import { Response } from 'express';
import { TournamentType, TournamentStatus, MatchStatus, TournamentCategory } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { tournamentScheduler } from '../services/TournamentSchedulerService';
import { tournamentProgress } from '../services/TournamentProgressService';
import prisma from '../lib/prisma';

const tournamentSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['ROUND_ROBIN', 'KNOCKOUT', 'GROUP_STAGE_KNOCKOUT']),
  category: z.enum(['OPEN_250', 'OPEN_500', 'OPEN_1000', 'MASTERS']).optional().default('OPEN_250'),
  playerCount: z.number().int().min(4),
  playerIds: z.array(z.string()).min(4),
  teams: z.array(z.object({
    player1Id: z.string(),
    player2Id: z.string(),
  })).min(2),
  allowTies: z.boolean().optional().default(false),
});

interface Team {
  player1Id: string;
  player2Id: string;
}

/**
 * Seed teams based on their combined 2025 tournament points
 * Uses snake/zigzag distribution for balanced groups
 */
async function seedTeamsByPoints(teams: Team[]): Promise<Team[]> {
  // Get 2025 tournament points for all players
  const playerIds = teams.flatMap(t => [t.player1Id, t.player2Id]);

  // Get all tournament results from 2025 for these players
  const tournamentResults = await prisma.tournamentResult.findMany({
    where: {
      playerId: { in: playerIds },
      createdAt: {
        gte: new Date('2025-01-01'),
        lt: new Date('2026-01-01'),
      },
    },
  });

  console.log(`[Team Seeding] Found ${tournamentResults.length} tournament results from 2025`);

  // Calculate total 2025 points per player
  const player2025Points = new Map<string, number>();
  for (const result of tournamentResults) {
    const currentPoints = player2025Points.get(result.playerId) || 0;
    player2025Points.set(result.playerId, currentPoints + result.pointsAwarded + result.bonusPoints);
  }

  // Get player names for logging
  const players = await prisma.player.findMany({
    where: { id: { in: playerIds } },
    select: { id: true, name: true },
  });
  const playerNames = new Map(players.map(p => [p.id, p.name]));

  // Calculate team points (sum of both players' 2025 points)
  const teamsWithPoints = teams.map((team, index) => {
    const player1Points = player2025Points.get(team.player1Id) || 0;
    const player2Points = player2025Points.get(team.player2Id) || 0;
    const totalPoints = player1Points + player2Points;

    console.log(`[Team Seeding] Team ${index + 1}: ${playerNames.get(team.player1Id)} (${player1Points}) + ${playerNames.get(team.player2Id)} (${player2Points}) = ${totalPoints} pts`);

    return {
      team,
      totalPoints,
    };
  });

  // Sort teams by total points descending (highest points first)
  teamsWithPoints.sort((a, b) => b.totalPoints - a.totalPoints);

  console.log('[Team Seeding] Teams sorted by 2025 points (strongest to weakest)');
  teamsWithPoints.forEach((t, i) => {
    console.log(`  ${i + 1}. Team with ${t.totalPoints} points`);
  });

  // Return sorted teams for snake draft distribution
  return teamsWithPoints.map(t => t.team);
}

export const createTournament = async (req: AuthRequest, res: Response) => {
  try {
    const data = tournamentSchema.parse(req.body);

    // Validate: player count must be one of the allowed values
    if (![8, 12, 16, 24].includes(data.playerCount)) {
      return res.status(400).json({ error: 'Player count must be 8, 12, 16, or 24' });
    }

    // Validate: playerIds match playerCount
    if (data.playerIds.length !== data.playerCount) {
      return res.status(400).json({ error: `Must select exactly ${data.playerCount} players` });
    }

    // Validate: correct number of teams
    const expectedTeams = data.playerCount / 2;
    if (data.teams.length !== expectedTeams) {
      return res.status(400).json({ error: `Must create exactly ${expectedTeams} teams` });
    }

    // Validate: allowTies can only be true for ROUND_ROBIN and GROUP_STAGE_KNOCKOUT
    if (data.allowTies && data.type === 'KNOCKOUT') {
      return res.status(400).json({ error: 'Ties are not allowed in knockout tournaments' });
    }

    // Reorder teams based on 2025 tournament points for balanced group generation
    let seededTeams = data.teams;
    if (data.type === 'GROUP_STAGE_KNOCKOUT') {
      seededTeams = await seedTeamsByPoints(data.teams);
    }

    // Create tournament
    const tournament = await prisma.tournament.create({
      data: {
        userId: req.userId!,
        name: data.name,
        type: data.type as TournamentType,
        category: data.category as TournamentCategory,
        maxPhases: data.type === 'GROUP_STAGE_KNOCKOUT' ? 2 : 1,
        allowTies: data.allowTies,
        startedAt: new Date(),
        status: TournamentStatus.IN_PROGRESS,
      },
    });

    // Link players
    await prisma.tournamentPlayer.createMany({
      data: data.playerIds.map((playerId) => ({
        tournamentId: tournament.id,
        playerId,
      })),
    });

    // Generate matches with seeded teams
    let matches;
    if (data.type === 'ROUND_ROBIN') {
      matches = tournamentScheduler.generateRoundRobinMatches(tournament.id, seededTeams);
    } else if (data.type === 'KNOCKOUT') {
      matches = tournamentScheduler.generateKnockoutMatches(tournament.id, seededTeams);
    } else {
      matches = tournamentScheduler.generateGroupStageMatches(tournament.id, seededTeams);
    }

    await prisma.match.createMany({
      data: matches.map((m) => ({
        tournamentId: m.tournamentId,
        phase: m.phase,
        roundNumber: m.roundNumber,
        matchNumber: m.matchNumber,
        matchDay: m.matchDay,
        player1Id: m.player1Id,
        player2Id: m.player2Id,
        player3Id: m.player3Id,
        player4Id: m.player4Id,
        groupNumber: m.groupNumber,
        status: MatchStatus.SCHEDULED,
      })),
    });

    res.json(tournament);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// All users: Get all tournaments (global)
export const getTournaments = async (req: AuthRequest, res: Response) => {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: {
        players: { include: { player: true } },
        matches: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// All users: Get tournament by ID (global)
export const getTournamentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        players: { include: { player: true } },
        matches: {
          include: {
            player1: true,
            player2: true,
            player3: true,
            player4: true,
          },
          orderBy: [{ phase: 'asc' }, { roundNumber: 'asc' }, { matchNumber: 'asc' }],
        },
      },
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// All users: Get tournament standings (global)
// Query param: ?final=true to get final positions (for Final Classification modal)
export const getTournamentStandings = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { final } = req.query; // ?final=true for final classification

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        matches: {
          include: {
            player1: true,
            player2: true,
            player3: true,
            player4: true,
          },
        },
      },
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Calculate standings based on tournament type
    let standings;

    if (tournament.type === 'KNOCKOUT') {
      // For knockout, determine final positions from final matches
      standings = await calculateKnockoutStandings(tournament.matches);
    } else if (tournament.type === 'GROUP_STAGE_KNOCKOUT') {
      // If final=true and tournament is finished, return final knockout standings
      if (final === 'true' && tournament.status === 'FINISHED') {
        const phase2Matches = tournament.matches.filter((m) => m.phase === 2);
        standings = await calculateKnockoutStandings(phase2Matches);
      } else {
        // Return Phase 1 group standings for "Phase 1 Classification by Group"
        const phase1Matches = tournament.matches.filter((m) => m.phase === 1);
        const groupNumbers = [...new Set(phase1Matches.map(m => m.groupNumber).filter(g => g != null))].sort();

        if (groupNumbers.length > 1) {
          // Multi-group tournament: return standings per group
          const groupStandings: any[] = [];
          for (const groupNum of groupNumbers) {
            const groupStanding = await tournamentProgress.calculateGroupStandings(id, groupNum as number);
            // Sort within group
            groupStanding.sort((a: any, b: any) => {
              if (b.points !== a.points) return b.points - a.points;
              const aSetDiff = a.setsWon - a.setsLost;
              const bSetDiff = b.setsWon - b.setsLost;
              if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;
              const aGameDiff = a.gamesWon - a.gamesLost;
              const bGameDiff = b.gamesWon - b.gamesLost;
              return bGameDiff - aGameDiff;
            });
            // Add group position (1st, 2nd, 3rd, 4th within group)
            groupStanding.forEach((team: any, index: number) => {
              team.groupPosition = index + 1;
              team.groupNumber = groupNum;
            });
            groupStandings.push(...groupStanding);
          }
          standings = groupStandings;
        } else {
          // Single group tournament
          standings = await tournamentProgress.calculatePhaseStandings(id, 1);
        }
      }
    } else {
      // Round Robin
      standings = await tournamentProgress.calculatePhaseStandings(id, 1);
    }

    // Sort standings for non-knockout tournaments (by points, then game difference)
    if (tournament.type !== 'KNOCKOUT' && !(standings[0] as any)?.position) {
      standings = standings.sort((a: any, b: any) => {
        // First by points (descending)
        if ((b.points || 0) !== (a.points || 0)) {
          return (b.points || 0) - (a.points || 0);
        }
        // Then by game difference (descending)
        const aGameDiff = (a.gamesWon || 0) - (a.gamesLost || 0);
        const bGameDiff = (b.gamesWon || 0) - (b.gamesLost || 0);
        return bGameDiff - aGameDiff;
      });

      // Add positions for finished ROUND_ROBIN tournaments
      if (tournament.status === 'FINISHED' && tournament.type === 'ROUND_ROBIN') {
        standings = standings.map((s: any, index: number) => ({
          ...s,
          position: index + 1,
        }));
      }
    }

    // If tournament is finished, fetch tournament results with points
    if (tournament.status === 'FINISHED') {
      const tournamentResults = await prisma.tournamentResult.findMany({
        where: { tournamentId: id },
      });

      // Create a map of playerId to points
      const pointsMap = new Map<string, { pointsAwarded: number; bonusPoints: number }>();
      for (const result of tournamentResults) {
        pointsMap.set(result.playerId, {
          pointsAwarded: result.pointsAwarded,
          bonusPoints: result.bonusPoints,
        });
      }

      // Add tournament points to standings
      standings = standings.map((standing: any) => {
        const player1Points = pointsMap.get(standing.player1Id);
        const player2Points = pointsMap.get(standing.player2Id);
        // Tournament points are the same for both team members, just use player1
        return {
          ...standing,
          tournamentPointsAwarded: player1Points?.pointsAwarded || 0,
          bonusPoints: player1Points?.bonusPoints || 0,
        };
      });
    }

    res.json(standings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Helper function to calculate knockout standings from final matches
async function calculateKnockoutStandings(matches: any[]) {
  const standings: any[] = [];

  // First, build team stats from all completed matches
  const teamStats = new Map<string, {
    player1Id: string;
    player2Id: string;
    player1: any;
    player2: any;
    matchesWon: number;
    matchesLost: number;
    gamesWon: number;
    gamesLost: number;
  }>();

  const completedMatches = matches.filter(m => m.status === MatchStatus.COMPLETED);
  for (const match of completedMatches) {
    const team1Key = `${match.player1Id}-${match.player2Id}`;
    const team2Key = `${match.player3Id}-${match.player4Id}`;

    // Initialize team1 stats
    if (!teamStats.has(team1Key)) {
      teamStats.set(team1Key, {
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        player1: match.player1,
        player2: match.player2,
        matchesWon: 0,
        matchesLost: 0,
        gamesWon: 0,
        gamesLost: 0,
      });
    }
    // Initialize team2 stats
    if (!teamStats.has(team2Key)) {
      teamStats.set(team2Key, {
        player1Id: match.player3Id,
        player2Id: match.player4Id,
        player1: match.player3,
        player2: match.player4,
        matchesWon: 0,
        matchesLost: 0,
        gamesWon: 0,
        gamesLost: 0,
      });
    }

    const team1Stats = teamStats.get(team1Key)!;
    const team2Stats = teamStats.get(team2Key)!;

    // Update wins/losses
    if (match.winnerTeam === 1) {
      team1Stats.matchesWon++;
      team2Stats.matchesLost++;
    } else if (match.winnerTeam === 2) {
      team2Stats.matchesWon++;
      team1Stats.matchesLost++;
    }

    // Update games
    team1Stats.gamesWon += match.set1Team1 || 0;
    team1Stats.gamesLost += match.set1Team2 || 0;
    team2Stats.gamesWon += match.set1Team2 || 0;
    team2Stats.gamesLost += match.set1Team1 || 0;
  }

  // Helper to get stats for a team
  const getTeamStats = (player1Id: string, player2Id: string) => {
    const key = `${player1Id}-${player2Id}`;
    return teamStats.get(key) || { matchesWon: 0, matchesLost: 0, gamesWon: 0, gamesLost: 0 };
  };

  // Find final and 3rd place matches (highest round number)
  const maxRound = Math.max(...matches.map((m) => m.roundNumber));
  const finalMatches = matches.filter((m) => m.roundNumber === maxRound);

  if (finalMatches.length === 0) {
    return [];
  }

  // Match numbers vary by tournament size:
  // - Open 250 (4 teams): Match 3 = Final, Match 4 = 3rd place
  // - Simple knockout: Match 1 = Final, Match 2 = 3rd place
  // - Open 1000 (8 teams): Match 9 = Final, Match 10 = 3rd, Match 11 = 5th, Match 12 = 7th
  const finalMatch = finalMatches.find((m) => m.matchNumber === 9 || m.matchNumber === 5 || m.matchNumber === 3 || m.matchNumber === 1);
  const thirdPlaceMatch = finalMatches.find((m) => m.matchNumber === 10 || m.matchNumber === 6 || m.matchNumber === 4 || m.matchNumber === 2);
  const fifthPlaceMatch = finalMatches.find((m) => m.matchNumber === 11 || m.matchNumber === 7);
  const seventhPlaceMatch = finalMatches.find((m) => m.matchNumber === 12 || m.matchNumber === 8);

  // Helper to create standing with stats
  const createStanding = (player1Id: string, player2Id: string, player1: any, player2: any, position: number) => {
    const stats = getTeamStats(player1Id, player2Id);
    return {
      player1Id,
      player2Id,
      player1,
      player2,
      position,
      matchesWon: stats.matchesWon,
      matchesLost: stats.matchesLost,
      gamesWon: stats.gamesWon,
      gamesLost: stats.gamesLost,
    };
  };

  if (finalMatch && finalMatch.status === MatchStatus.COMPLETED) {
    // 1st place - winner of final
    const winner = finalMatch.winnerTeam === 1
      ? createStanding(finalMatch.player1Id, finalMatch.player2Id, finalMatch.player1, finalMatch.player2, 1)
      : createStanding(finalMatch.player3Id, finalMatch.player4Id, finalMatch.player3, finalMatch.player4, 1);

    // 2nd place - loser of final
    const runnerUp = finalMatch.winnerTeam === 1
      ? createStanding(finalMatch.player3Id, finalMatch.player4Id, finalMatch.player3, finalMatch.player4, 2)
      : createStanding(finalMatch.player1Id, finalMatch.player2Id, finalMatch.player1, finalMatch.player2, 2);

    standings.push(winner, runnerUp);
  }

  if (thirdPlaceMatch && thirdPlaceMatch.status === MatchStatus.COMPLETED) {
    // 3rd place - winner of 3rd place match
    const third = thirdPlaceMatch.winnerTeam === 1
      ? createStanding(thirdPlaceMatch.player1Id, thirdPlaceMatch.player2Id, thirdPlaceMatch.player1, thirdPlaceMatch.player2, 3)
      : createStanding(thirdPlaceMatch.player3Id, thirdPlaceMatch.player4Id, thirdPlaceMatch.player3, thirdPlaceMatch.player4, 3);

    // 4th place - loser of 3rd place match
    const fourth = thirdPlaceMatch.winnerTeam === 1
      ? createStanding(thirdPlaceMatch.player3Id, thirdPlaceMatch.player4Id, thirdPlaceMatch.player3, thirdPlaceMatch.player4, 4)
      : createStanding(thirdPlaceMatch.player1Id, thirdPlaceMatch.player2Id, thirdPlaceMatch.player1, thirdPlaceMatch.player2, 4);

    standings.push(third, fourth);
  }

  // 5th/6th place match (for larger tournaments like Open 1000)
  if (fifthPlaceMatch && fifthPlaceMatch.status === MatchStatus.COMPLETED) {
    const fifth = fifthPlaceMatch.winnerTeam === 1
      ? createStanding(fifthPlaceMatch.player1Id, fifthPlaceMatch.player2Id, fifthPlaceMatch.player1, fifthPlaceMatch.player2, 5)
      : createStanding(fifthPlaceMatch.player3Id, fifthPlaceMatch.player4Id, fifthPlaceMatch.player3, fifthPlaceMatch.player4, 5);

    const sixth = fifthPlaceMatch.winnerTeam === 1
      ? createStanding(fifthPlaceMatch.player3Id, fifthPlaceMatch.player4Id, fifthPlaceMatch.player3, fifthPlaceMatch.player4, 6)
      : createStanding(fifthPlaceMatch.player1Id, fifthPlaceMatch.player2Id, fifthPlaceMatch.player1, fifthPlaceMatch.player2, 6);

    standings.push(fifth, sixth);
  }

  // 7th/8th place match (for larger tournaments like Open 1000)
  if (seventhPlaceMatch && seventhPlaceMatch.status === MatchStatus.COMPLETED) {
    const seventh = seventhPlaceMatch.winnerTeam === 1
      ? createStanding(seventhPlaceMatch.player1Id, seventhPlaceMatch.player2Id, seventhPlaceMatch.player1, seventhPlaceMatch.player2, 7)
      : createStanding(seventhPlaceMatch.player3Id, seventhPlaceMatch.player4Id, seventhPlaceMatch.player3, seventhPlaceMatch.player4, 7);

    const eighth = seventhPlaceMatch.winnerTeam === 1
      ? createStanding(seventhPlaceMatch.player3Id, seventhPlaceMatch.player4Id, seventhPlaceMatch.player3, seventhPlaceMatch.player4, 8)
      : createStanding(seventhPlaceMatch.player1Id, seventhPlaceMatch.player2Id, seventhPlaceMatch.player1, seventhPlaceMatch.player2, 8);

    standings.push(seventh, eighth);
  }

  return standings;
}

// Admin only: Delete a tournament (protected by adminMiddleware in routes)
export const deleteTournament = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Delete tournament (will cascade delete matches and tournament players)
    await prisma.tournament.delete({
      where: { id },
    });

    res.json({ message: 'Tournament deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
