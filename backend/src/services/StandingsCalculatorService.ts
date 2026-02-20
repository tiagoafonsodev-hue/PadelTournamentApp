import { Match, Player, MatchStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import logger from '../lib/logger';

type MatchWithPlayers = Match & {
  player1?: Player | null;
  player2?: Player | null;
  player3?: Player | null;
  player4?: Player | null;
};

type PlayerInfo = { id: string; name: string } | null | undefined;

export interface TeamStanding {
  player1Id: string;
  player2Id: string;
  player1?: PlayerInfo;
  player2?: PlayerInfo;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  matchesDrawn: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
  points: number;
  groupNumber?: number;
}

export class StandingsCalculatorService {
  /**
   * Build standings from a list of matches
   */
  buildStandingsFromMatches(matches: MatchWithPlayers[]): TeamStanding[] {
    logger.debug('buildStandingsFromMatches: building standings', { matchCount: matches.length });

    const standingsMap = new Map<string, TeamStanding>();

    for (const match of matches) {
      const team1Key = `${match.player1Id}-${match.player2Id}`;
      const team2Key = `${match.player3Id}-${match.player4Id}`;

      // Initialize team 1
      if (!standingsMap.has(team1Key)) {
        standingsMap.set(team1Key, {
          player1Id: match.player1Id,
          player2Id: match.player2Id,
          player1: match.player1,
          player2: match.player2,
          matchesPlayed: 0,
          matchesWon: 0,
          matchesLost: 0,
          matchesDrawn: 0,
          setsWon: 0,
          setsLost: 0,
          gamesWon: 0,
          gamesLost: 0,
          points: 0,
          groupNumber: match.groupNumber || undefined,
        });
      }

      // Initialize team 2
      if (!standingsMap.has(team2Key)) {
        standingsMap.set(team2Key, {
          player1Id: match.player3Id,
          player2Id: match.player4Id,
          player1: match.player3,
          player2: match.player4,
          matchesPlayed: 0,
          matchesWon: 0,
          matchesLost: 0,
          matchesDrawn: 0,
          setsWon: 0,
          setsLost: 0,
          gamesWon: 0,
          gamesLost: 0,
          points: 0,
          groupNumber: match.groupNumber || undefined,
        });
      }

      const team1Standing = standingsMap.get(team1Key)!;
      const team2Standing = standingsMap.get(team2Key)!;

      // Update match counts
      team1Standing.matchesPlayed++;
      team2Standing.matchesPlayed++;

      // Update sets and games
      team1Standing.setsWon += match.team1Score || 0;
      team1Standing.setsLost += match.team2Score || 0;
      team2Standing.setsWon += match.team2Score || 0;
      team2Standing.setsLost += match.team1Score || 0;

      // Calculate games from set scores
      const team1Games =
        (match.set1Team1 || 0) + (match.set2Team1 || 0) + (match.set3Team1 || 0);
      const team2Games =
        (match.set1Team2 || 0) + (match.set2Team2 || 0) + (match.set3Team2 || 0);

      team1Standing.gamesWon += team1Games;
      team1Standing.gamesLost += team2Games;
      team2Standing.gamesWon += team2Games;
      team2Standing.gamesLost += team1Games;

      // Update wins/losses/draws and points (2 points per win, 1 point per draw)
      if (match.winnerTeam === 1) {
        team1Standing.matchesWon++;
        team1Standing.points += 2;
        team2Standing.matchesLost++;
      } else if (match.winnerTeam === 2) {
        team2Standing.matchesWon++;
        team2Standing.points += 2;
        team1Standing.matchesLost++;
      } else {
        // Tie - winnerTeam is null
        team1Standing.matchesDrawn++;
        team2Standing.matchesDrawn++;
        team1Standing.points += 1;
        team2Standing.points += 1;
      }
    }

    return Array.from(standingsMap.values());
  }

  /**
   * Calculate standings for a specific phase
   */
  async calculatePhaseStandings(
    tournamentId: string,
    phase: number
  ): Promise<TeamStanding[]> {
    const matches = await prisma.match.findMany({
      where: {
        tournamentId,
        phase,
        status: MatchStatus.COMPLETED,
      },
      include: {
        player1: true,
        player2: true,
        player3: true,
        player4: true,
      },
    });

    return this.buildStandingsFromMatches(matches);
  }

  /**
   * Calculate standings for a specific group
   */
  async calculateGroupStandings(
    tournamentId: string,
    groupNumber: number
  ): Promise<TeamStanding[]> {
    const matches = await prisma.match.findMany({
      where: {
        tournamentId,
        groupNumber,
        status: MatchStatus.COMPLETED,
      },
      include: {
        player1: true,
        player2: true,
        player3: true,
        player4: true,
      },
    });

    return this.buildStandingsFromMatches(matches);
  }

  /**
   * Sort standings by tiebreakers (points, set diff, game diff)
   */
  sortStandingsByTiebreakers(standings: TeamStanding[]): TeamStanding[] {
    return [...standings].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;

      const aSetDiff = a.setsWon - a.setsLost;
      const bSetDiff = b.setsWon - b.setsLost;
      if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;

      const aGameDiff = a.gamesWon - a.gamesLost;
      const bGameDiff = b.gamesWon - b.gamesLost;
      return bGameDiff - aGameDiff;
    });
  }
}

export const standingsCalculator = new StandingsCalculatorService();
