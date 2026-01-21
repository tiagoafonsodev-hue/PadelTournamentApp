// Port of Android TournamentProgressManager.kt

import { Tournament, Match, TournamentStatus, MatchStatus } from '@prisma/client';
import { tournamentScheduler } from './TournamentSchedulerService';
import { tournamentPointService } from './TournamentPointService';
import prisma from '../lib/prisma';

interface TeamStanding {
  player1Id: string;
  player2Id: string;
  player1?: any;
  player2?: any;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  matchesDrawn: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
  points: number; // 2 points per win, 1 point per draw
  groupNumber?: number;
}

export class TournamentProgressService {
  /**
   * Check if tournament phase is complete and advance if needed
   */
  async checkAndAdvancePhase(tournamentId: string): Promise<void> {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { matches: true },
    });

    if (!tournament) return;

    // Check if all matches in current phase are completed
    const currentPhaseMatches = tournament.matches.filter(
      (m: Match) => m.phase === tournament.currentPhase
    );

    const allCompleted = currentPhaseMatches.every(
      (m: Match) => m.status === MatchStatus.COMPLETED
    );

    if (!allCompleted) return;

    // Determine what to do based on tournament type
    if (tournament.type === 'ROUND_ROBIN') {
      // Round Robin is single phase - mark as finished
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: {
          status: TournamentStatus.FINISHED,
          finishedAt: new Date(),
        },
      });
      // Update player tournament stats
      await this.updateTournamentStats(tournamentId);
    } else if (tournament.type === 'KNOCKOUT') {
      const round1Matches = tournament.matches.filter((m: Match) => m.roundNumber === 1);
      const round2Matches = tournament.matches.filter((m: Match) => m.roundNumber === 2);
      const round3Matches = tournament.matches.filter((m: Match) => m.roundNumber === 3);

      const allRound1Complete = round1Matches.length > 0 && round1Matches.every((m: Match) => m.status === MatchStatus.COMPLETED);
      const allRound2Complete = round2Matches.length > 0 && round2Matches.every((m: Match) => m.status === MatchStatus.COMPLETED);
      const allRound3Complete = round3Matches.length > 0 && round3Matches.every((m: Match) => m.status === MatchStatus.COMPLETED);

      // 8-team knockout (4 QF matches)
      if (round1Matches.length === 4) {
        if (allRound3Complete) {
          // Round 3 complete (Finals) - tournament finished
          await prisma.tournament.update({
            where: { id: tournamentId },
            data: { status: TournamentStatus.FINISHED, finishedAt: new Date() },
          });
          await this.updateTournamentStats(tournamentId);
        } else if (allRound2Complete && round3Matches.length === 0) {
          // Round 2 complete - generate Round 3 (Finals for all positions)
          await this.generateKnockout8TeamRound3(tournament.id, round2Matches);
        } else if (allRound1Complete && round2Matches.length === 0) {
          // Round 1 complete (QF) - generate Round 2 (Semi-finals + Loser semis)
          await this.generateKnockout8TeamRound2(tournament.id, round1Matches);
        }
      }
      // 4-team knockout (2 SF matches)
      else if (round1Matches.length === 2) {
        if (allRound2Complete) {
          // Round 2 complete - tournament finished
          await prisma.tournament.update({
            where: { id: tournamentId },
            data: { status: TournamentStatus.FINISHED, finishedAt: new Date() },
          });
          await this.updateTournamentStats(tournamentId);
        } else if (allRound1Complete && round2Matches.length === 0) {
          // Generate Round 2 (Final + 3rd place)
          await this.generateKnockoutRound2(tournament.id, round1Matches);
        }
      }
    } else if (tournament.type === 'GROUP_STAGE_KNOCKOUT') {
      if (tournament.currentPhase === 1) {
        // Phase 1 complete - generate Phase 2 playoff matches
        await this.advanceToPlayoffPhase(tournament);
      } else if (tournament.currentPhase === 2) {
        // Check if Phase 2 needs regeneration due to Phase 1 edits
        const phase2Matches = tournament.matches.filter((m: Match) => m.phase === 2);
        const anyPhase2Completed = phase2Matches.some((m: Match) => m.status === MatchStatus.COMPLETED);

        // If no Phase 2 matches have been played, check if we need to regenerate based on Phase 1 standings
        if (!anyPhase2Completed && phase2Matches.length > 0) {
          console.log(`[TournamentProgress] Phase 2 not started, checking if regeneration needed...`);
          // Regenerate Phase 2 with current Phase 1 standings
          await prisma.match.deleteMany({
            where: {
              tournamentId,
              phase: 2,
              status: MatchStatus.SCHEDULED,
            },
          });
          // Reset to Phase 1 and regenerate Phase 2
          await prisma.tournament.update({
            where: { id: tournamentId },
            data: { currentPhase: 1 },
          });
          await this.advanceToPlayoffPhase({ ...tournament, currentPhase: 1 });
          console.log(`[TournamentProgress] Phase 2 regenerated with updated standings`);
          return;
        }

        // Check if this is Round 1 or Round 2 complete
        const round1Matches = phase2Matches.filter(m => m.roundNumber === 1);
        const round2Matches = phase2Matches.filter(m => m.roundNumber === 2);

        console.log(`[TournamentProgress] Phase 2 check for tournament ${tournamentId}:`);
        console.log(`  - Round 1 matches: ${round1Matches.length}, completed: ${round1Matches.filter(m => m.status === MatchStatus.COMPLETED).length}`);
        console.log(`  - Round 2 matches: ${round2Matches.length}`);

        // Check if all Round 1 matches are complete
        const allRound1Complete = round1Matches.length > 0 &&
                                  round1Matches.every((m: Match) => m.status === MatchStatus.COMPLETED);
        const allRound2Complete = round2Matches.length > 0 &&
                                  round2Matches.every((m: Match) => m.status === MatchStatus.COMPLETED);

        // FIRST: Check if Round 2 is complete - finish tournament
        // OR if Round 1 is complete AND no Round 2 exists (single-group playoff like Open 250)
        if (allRound2Complete || (allRound1Complete && round2Matches.length === 0 && round1Matches.length === 2)) {
          console.log(`[TournamentProgress] All playoff matches complete! Finishing tournament...`);
          await prisma.tournament.update({
            where: { id: tournamentId },
            data: {
              status: TournamentStatus.FINISHED,
              finishedAt: new Date(),
            },
          });
          console.log(`[TournamentProgress] Tournament finished! Updating player stats...`);
          // Update player tournament stats
          await this.updateTournamentStats(tournamentId);
          console.log(`[TournamentProgress] Player stats updated!`);
        }
        // SECOND: Check if Round 1 is complete and needs Round 2 generation (multi-group)
        else if (allRound1Complete && round1Matches.length >= 4) {
          // If Round 2 doesn't exist, generate it
          if (round2Matches.length === 0) {
            console.log(`[TournamentProgress] All Round 1 matches complete! Generating Round 2...`);
            // Check if single-group (2 matches) or multi-group (4 matches)
            if (round1Matches.length === 2) {
              await this.generateSingleGroupRound2(tournament.id, round1Matches);
            } else {
              await this.generateMultiGroupRound2(tournament.id, round1Matches);
            }
            console.log(`[TournamentProgress] Round 2 generation complete!`);
          }
          // If Round 2 exists but all matches are SCHEDULED (not started), regenerate with updated teams
          else if (round2Matches.every((m: Match) => m.status === MatchStatus.SCHEDULED)) {
            console.log(`[TournamentProgress] Round 1 results changed! Regenerating Round 2 with updated teams...`);
            // Delete existing Round 2 matches
            await prisma.match.deleteMany({
              where: {
                tournamentId,
                phase: 2,
                roundNumber: 2,
              },
            });
            console.log(`[TournamentProgress] Deleted old Round 2 matches`);
            // Generate new Round 2 matches with correct teams (single or multi group)
            if (round1Matches.length === 2) {
              await this.generateSingleGroupRound2(tournament.id, round1Matches);
            } else {
              await this.generateMultiGroupRound2(tournament.id, round1Matches);
            }
            console.log(`[TournamentProgress] Round 2 regeneration complete!`);
          } else {
            console.log(`[TournamentProgress] Round 2 matches already started, cannot regenerate`);
          }
        } else if (round2Matches.length > 0) {
          console.log(`[TournamentProgress] Round 2 exists but not all matches complete yet`);
        }
      }
    }
  }

  /**
   * Update player tournament stats and award points when tournament finishes
   */
  private async updateTournamentStats(tournamentId: string): Promise<void> {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
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

    if (!tournament) return;

    // Calculate final positions for all players
    const finalPositions = await this.calculateFinalPositions(tournament);

    // Award tournament points
    if (finalPositions.length > 0) {
      await tournamentPointService.awardTournamentPoints(tournamentId, finalPositions);
    }
  }

  /**
   * Calculate final positions for all players in a tournament
   * Also calculates matchesWon for bonus points
   */
  private async calculateFinalPositions(
    tournament: Tournament & { matches: Match[] }
  ): Promise<{ playerId: string; position: number; matchesWon: number }[]> {
    const positions: { playerId: string; position: number; matchesWon: number }[] = [];

    // Calculate wins per player across all tournament matches
    const completedMatches = tournament.matches.filter(m => m.status === MatchStatus.COMPLETED);
    const playerWins = new Map<string, number>();

    for (const match of completedMatches) {
      // Initialize all players if not already
      [match.player1Id, match.player2Id, match.player3Id, match.player4Id].forEach(pid => {
        if (!playerWins.has(pid)) playerWins.set(pid, 0);
      });

      // Award wins to winning team players
      if (match.winnerTeam === 1) {
        playerWins.set(match.player1Id, (playerWins.get(match.player1Id) || 0) + 1);
        playerWins.set(match.player2Id, (playerWins.get(match.player2Id) || 0) + 1);
      } else if (match.winnerTeam === 2) {
        playerWins.set(match.player3Id, (playerWins.get(match.player3Id) || 0) + 1);
        playerWins.set(match.player4Id, (playerWins.get(match.player4Id) || 0) + 1);
      }
    }

    if (tournament.type === 'ROUND_ROBIN') {
      // For Round Robin, use standings to determine positions
      const standings = await this.calculatePhaseStandings(tournament.id, 1);
      standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const aSetDiff = a.setsWon - a.setsLost;
        const bSetDiff = b.setsWon - b.setsLost;
        if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;
        const aGameDiff = a.gamesWon - a.gamesLost;
        const bGameDiff = b.gamesWon - b.gamesLost;
        return bGameDiff - aGameDiff;
      });

      // Each position gets both players from the team
      let position = 1;
      for (const standing of standings) {
        positions.push({
          playerId: standing.player1Id,
          position,
          matchesWon: playerWins.get(standing.player1Id) || 0
        });
        positions.push({
          playerId: standing.player2Id,
          position,
          matchesWon: playerWins.get(standing.player2Id) || 0
        });
        position++;
      }
    } else {
      // For Knockout and Group Stage Knockout, determine from final matches
      const maxPhase = Math.max(...completedMatches.map(m => m.phase));
      const finalPhaseMatches = completedMatches.filter(m => m.phase === maxPhase);
      const maxRound = Math.max(...finalPhaseMatches.map(m => m.roundNumber));
      const finalMatches = finalPhaseMatches.filter(m => m.roundNumber === maxRound);

      // Sort by match number to process in order
      finalMatches.sort((a, b) => a.matchNumber - b.matchNumber);

      for (const match of finalMatches) {
        let winnerPos: number;
        let loserPos: number;

        // Determine positions based on match number
        // 8-team knockout (matches 9-12): Final - 1st/2nd, 3rd/4th, 5th/6th, 7th/8th
        // 4-team knockout/playoff (matches 3-4 or 5-8): Final, 3rd/4th, etc.
        // Simple knockout (matches 1-2): Final, 3rd/4th
        if (match.matchNumber === 9 || match.matchNumber === 5 || match.matchNumber === 3 || match.matchNumber === 1) {
          winnerPos = 1;
          loserPos = 2;
        } else if (match.matchNumber === 10 || match.matchNumber === 6 || match.matchNumber === 4 || match.matchNumber === 2) {
          winnerPos = 3;
          loserPos = 4;
        } else if (match.matchNumber === 11 || match.matchNumber === 7) {
          winnerPos = 5;
          loserPos = 6;
        } else if (match.matchNumber === 12 || match.matchNumber === 8) {
          winnerPos = 7;
          loserPos = 8;
        } else {
          continue;
        }

        if (match.winnerTeam === 1) {
          positions.push({ playerId: match.player1Id, position: winnerPos, matchesWon: playerWins.get(match.player1Id) || 0 });
          positions.push({ playerId: match.player2Id, position: winnerPos, matchesWon: playerWins.get(match.player2Id) || 0 });
          positions.push({ playerId: match.player3Id, position: loserPos, matchesWon: playerWins.get(match.player3Id) || 0 });
          positions.push({ playerId: match.player4Id, position: loserPos, matchesWon: playerWins.get(match.player4Id) || 0 });
        } else if (match.winnerTeam === 2) {
          positions.push({ playerId: match.player3Id, position: winnerPos, matchesWon: playerWins.get(match.player3Id) || 0 });
          positions.push({ playerId: match.player4Id, position: winnerPos, matchesWon: playerWins.get(match.player4Id) || 0 });
          positions.push({ playerId: match.player1Id, position: loserPos, matchesWon: playerWins.get(match.player1Id) || 0 });
          positions.push({ playerId: match.player2Id, position: loserPos, matchesWon: playerWins.get(match.player2Id) || 0 });
        }
      }

      // Handle players not in final matches (eliminated earlier)
      // Get all tournament players and assign remaining positions
      const tournamentPlayers = await prisma.tournamentPlayer.findMany({
        where: { tournamentId: tournament.id },
      });

      const assignedPlayerIds = new Set(positions.map(p => p.playerId));
      let nextPosition = Math.max(...positions.map(p => p.position), 0) + 1;

      for (const tp of tournamentPlayers) {
        if (!assignedPlayerIds.has(tp.playerId)) {
          positions.push({
            playerId: tp.playerId,
            position: nextPosition,
            matchesWon: playerWins.get(tp.playerId) || 0
          });
          // Group remaining players in pairs (they were in teams)
          if (positions.filter(p => p.position === nextPosition).length >= 2) {
            nextPosition++;
          }
        }
      }
    }

    return positions;
  }

  /**
   * Generate Knockout Round 2 matches (Final + 3rd place)
   * Called after Round 1 (semi-finals) completes
   */
  private async generateKnockoutRound2(
    tournamentId: string,
    round1Matches: Match[]
  ): Promise<void> {
    // Get winners and losers from both semi-finals
    const match1 = round1Matches[0];
    const match2 = round1Matches[1];

    const match1WinnerTeam = match1.winnerTeam === 1
      ? { player1Id: match1.player1Id, player2Id: match1.player2Id }
      : { player1Id: match1.player3Id, player2Id: match1.player4Id };

    const match1LoserTeam = match1.winnerTeam === 1
      ? { player1Id: match1.player3Id, player2Id: match1.player4Id }
      : { player1Id: match1.player1Id, player2Id: match1.player2Id };

    const match2WinnerTeam = match2.winnerTeam === 1
      ? { player1Id: match2.player1Id, player2Id: match2.player2Id }
      : { player1Id: match2.player3Id, player2Id: match2.player4Id };

    const match2LoserTeam = match2.winnerTeam === 1
      ? { player1Id: match2.player3Id, player2Id: match2.player4Id }
      : { player1Id: match2.player1Id, player2Id: match2.player2Id };

    // Generate Round 2 matches using scheduler
    const round2Matches = tournamentScheduler.generateKnockoutRound2(
      tournamentId,
      match1WinnerTeam,
      match1LoserTeam,
      match2WinnerTeam,
      match2LoserTeam
    );

    // Create matches in database
    await prisma.match.createMany({
      data: round2Matches.map((m) => ({
        tournamentId: m.tournamentId,
        phase: m.phase,
        roundNumber: m.roundNumber,
        matchNumber: m.matchNumber,
        player1Id: m.player1Id,
        player2Id: m.player2Id,
        player3Id: m.player3Id,
        player4Id: m.player4Id,
        status: MatchStatus.SCHEDULED,
      })),
    });
  }

  /**
   * Generate 8-team Knockout Round 2 (Semi-finals + Loser Semi-finals)
   * Called after Round 1 (Quarter-finals) completes
   * Round 2 matches:
   * - Match 5: SF1 (Winner QF1 vs Winner QF2) - Top bracket
   * - Match 6: SF2 (Winner QF3 vs Winner QF4) - Top bracket
   * - Match 7: Loser SF1 (Loser QF1 vs Loser QF2) - Bottom bracket
   * - Match 8: Loser SF2 (Loser QF3 vs Loser QF4) - Bottom bracket
   */
  private async generateKnockout8TeamRound2(
    tournamentId: string,
    round1Matches: Match[]
  ): Promise<void> {
    console.log(`[generateKnockout8TeamRound2] Starting Round 2 generation for 8-team knockout`);

    // Sort by match number to ensure correct order
    round1Matches.sort((a, b) => a.matchNumber - b.matchNumber);

    // Quarter-final results
    const qf1 = round1Matches[0];
    const qf2 = round1Matches[1];
    const qf3 = round1Matches[2];
    const qf4 = round1Matches[3];

    // Extract winners and losers
    const getWinner = (match: Match) => match.winnerTeam === 1
      ? { player1Id: match.player1Id, player2Id: match.player2Id }
      : { player1Id: match.player3Id, player2Id: match.player4Id };

    const getLoser = (match: Match) => match.winnerTeam === 1
      ? { player1Id: match.player3Id, player2Id: match.player4Id }
      : { player1Id: match.player1Id, player2Id: match.player2Id };

    const round2Matches = [
      // Top bracket semi-finals (for 1st-4th place)
      {
        tournamentId,
        phase: 1,
        roundNumber: 2,
        matchNumber: 5,
        player1Id: getWinner(qf1).player1Id,
        player2Id: getWinner(qf1).player2Id,
        player3Id: getWinner(qf2).player1Id,
        player4Id: getWinner(qf2).player2Id,
        status: MatchStatus.SCHEDULED,
      },
      {
        tournamentId,
        phase: 1,
        roundNumber: 2,
        matchNumber: 6,
        player1Id: getWinner(qf3).player1Id,
        player2Id: getWinner(qf3).player2Id,
        player3Id: getWinner(qf4).player1Id,
        player4Id: getWinner(qf4).player2Id,
        status: MatchStatus.SCHEDULED,
      },
      // Bottom bracket semi-finals (for 5th-8th place)
      {
        tournamentId,
        phase: 1,
        roundNumber: 2,
        matchNumber: 7,
        player1Id: getLoser(qf1).player1Id,
        player2Id: getLoser(qf1).player2Id,
        player3Id: getLoser(qf2).player1Id,
        player4Id: getLoser(qf2).player2Id,
        status: MatchStatus.SCHEDULED,
      },
      {
        tournamentId,
        phase: 1,
        roundNumber: 2,
        matchNumber: 8,
        player1Id: getLoser(qf3).player1Id,
        player2Id: getLoser(qf3).player2Id,
        player3Id: getLoser(qf4).player1Id,
        player4Id: getLoser(qf4).player2Id,
        status: MatchStatus.SCHEDULED,
      },
    ];

    await prisma.match.createMany({ data: round2Matches });
    console.log(`[generateKnockout8TeamRound2] Created ${round2Matches.length} Round 2 matches`);
  }

  /**
   * Generate 8-team Knockout Round 3 (Finals for all positions)
   * Called after Round 2 (Semi-finals) completes
   * Round 3 matches:
   * - Match 9: Final (1st/2nd) - Winners of SF1 vs SF2
   * - Match 10: 3rd/4th place - Losers of SF1 vs SF2
   * - Match 11: 5th/6th place - Winners of Loser SF1 vs Loser SF2
   * - Match 12: 7th/8th place - Losers of Loser SF1 vs Loser SF2
   */
  private async generateKnockout8TeamRound3(
    tournamentId: string,
    round2Matches: Match[]
  ): Promise<void> {
    console.log(`[generateKnockout8TeamRound3] Starting Round 3 generation for 8-team knockout`);

    // Sort by match number
    round2Matches.sort((a, b) => a.matchNumber - b.matchNumber);

    // Round 2 results
    const sf1 = round2Matches.find(m => m.matchNumber === 5)!;   // Top SF1
    const sf2 = round2Matches.find(m => m.matchNumber === 6)!;   // Top SF2
    const loserSf1 = round2Matches.find(m => m.matchNumber === 7)!;  // Bottom SF1
    const loserSf2 = round2Matches.find(m => m.matchNumber === 8)!;  // Bottom SF2

    const getWinner = (match: Match) => match.winnerTeam === 1
      ? { player1Id: match.player1Id, player2Id: match.player2Id }
      : { player1Id: match.player3Id, player2Id: match.player4Id };

    const getLoser = (match: Match) => match.winnerTeam === 1
      ? { player1Id: match.player3Id, player2Id: match.player4Id }
      : { player1Id: match.player1Id, player2Id: match.player2Id };

    const round3Matches = [
      // Final (1st/2nd place)
      {
        tournamentId,
        phase: 1,
        roundNumber: 3,
        matchNumber: 9,
        player1Id: getWinner(sf1).player1Id,
        player2Id: getWinner(sf1).player2Id,
        player3Id: getWinner(sf2).player1Id,
        player4Id: getWinner(sf2).player2Id,
        status: MatchStatus.SCHEDULED,
      },
      // 3rd/4th place
      {
        tournamentId,
        phase: 1,
        roundNumber: 3,
        matchNumber: 10,
        player1Id: getLoser(sf1).player1Id,
        player2Id: getLoser(sf1).player2Id,
        player3Id: getLoser(sf2).player1Id,
        player4Id: getLoser(sf2).player2Id,
        status: MatchStatus.SCHEDULED,
      },
      // 5th/6th place
      {
        tournamentId,
        phase: 1,
        roundNumber: 3,
        matchNumber: 11,
        player1Id: getWinner(loserSf1).player1Id,
        player2Id: getWinner(loserSf1).player2Id,
        player3Id: getWinner(loserSf2).player1Id,
        player4Id: getWinner(loserSf2).player2Id,
        status: MatchStatus.SCHEDULED,
      },
      // 7th/8th place
      {
        tournamentId,
        phase: 1,
        roundNumber: 3,
        matchNumber: 12,
        player1Id: getLoser(loserSf1).player1Id,
        player2Id: getLoser(loserSf1).player2Id,
        player3Id: getLoser(loserSf2).player1Id,
        player4Id: getLoser(loserSf2).player2Id,
        status: MatchStatus.SCHEDULED,
      },
    ];

    await prisma.match.createMany({ data: round3Matches });
    console.log(`[generateKnockout8TeamRound3] Created ${round3Matches.length} Round 3 matches`);
  }

  /**
   * Generate Single-Group Round 2 matches (Final + 3rd place)
   * For GROUP_STAGE_KNOCKOUT tournaments with 1 group (4 teams)
   * Called after Round 1 (2 semi-final matches) of Phase 2 completes
   */
  private async generateSingleGroupRound2(
    tournamentId: string,
    round1Matches: Match[]
  ): Promise<void> {
    console.log(`[generateSingleGroupRound2] Starting Round 2 generation for tournament ${tournamentId}`);
    console.log(`[generateSingleGroupRound2] Round 1 matches count: ${round1Matches.length}`);

    if (round1Matches.length < 2) {
      console.error('[generateSingleGroupRound2] Not enough Round 1 matches to generate Round 2');
      return;
    }

    // Sort by match number to ensure correct order
    round1Matches.sort((a, b) => a.matchNumber - b.matchNumber);

    const match1 = round1Matches[0];
    const match2 = round1Matches[1];

    // Extract winners and losers
    const match1Winner = match1.winnerTeam === 1
      ? { player1Id: match1.player1Id, player2Id: match1.player2Id }
      : { player1Id: match1.player3Id, player2Id: match1.player4Id };

    const match1Loser = match1.winnerTeam === 1
      ? { player1Id: match1.player3Id, player2Id: match1.player4Id }
      : { player1Id: match1.player1Id, player2Id: match1.player2Id };

    const match2Winner = match2.winnerTeam === 1
      ? { player1Id: match2.player1Id, player2Id: match2.player2Id }
      : { player1Id: match2.player3Id, player2Id: match2.player4Id };

    const match2Loser = match2.winnerTeam === 1
      ? { player1Id: match2.player3Id, player2Id: match2.player4Id }
      : { player1Id: match2.player1Id, player2Id: match2.player2Id };

    // Create Round 2 matches (Final + 3rd place)
    const round2Matches = [
      // Match 3: Final (1st/2nd place)
      {
        tournamentId,
        phase: 2,
        roundNumber: 2,
        matchNumber: 3,
        player1Id: match1Winner.player1Id,
        player2Id: match1Winner.player2Id,
        player3Id: match2Winner.player1Id,
        player4Id: match2Winner.player2Id,
        status: MatchStatus.SCHEDULED,
      },
      // Match 4: 3rd/4th place
      {
        tournamentId,
        phase: 2,
        roundNumber: 2,
        matchNumber: 4,
        player1Id: match1Loser.player1Id,
        player2Id: match1Loser.player2Id,
        player3Id: match2Loser.player1Id,
        player4Id: match2Loser.player2Id,
        status: MatchStatus.SCHEDULED,
      },
    ];

    console.log(`[generateSingleGroupRound2] Creating ${round2Matches.length} Round 2 matches...`);

    await prisma.match.createMany({
      data: round2Matches,
    });

    console.log(`[generateSingleGroupRound2] Successfully created Round 2 matches!`);
  }

  /**
   * Generate Multi-Group Round 2 matches (Finals for all positions)
   * Called after Round 1 (semi-finals) of Phase 2 completes
   * Creates:
   * - Final (1st/2nd): Winners of Match 1 vs Match 2
   * - 3rd/4th place: Losers of Match 1 vs Match 2
   * - 5th/6th place: Winners of Match 3 vs Match 4
   * - 7th/8th place: Losers of Match 3 vs Match 4
   */
  private async generateMultiGroupRound2(
    tournamentId: string,
    round1Matches: Match[]
  ): Promise<void> {
    console.log(`[generateMultiGroupRound2] Starting Round 2 generation for tournament ${tournamentId}`);
    console.log(`[generateMultiGroupRound2] Round 1 matches count: ${round1Matches.length}`);

    // Round 1 should have 4 matches (2 for top bracket, 2 for bottom bracket)
    if (round1Matches.length < 4) {
      console.error('[generateMultiGroupRound2] Not enough Round 1 matches to generate Round 2');
      return;
    }

    // Sort by match number to ensure correct order
    round1Matches.sort((a, b) => a.matchNumber - b.matchNumber);
    console.log(`[generateMultiGroupRound2] Match numbers: ${round1Matches.map(m => m.matchNumber).join(', ')}`);

    // Top bracket semi-finals (Match 1 and 2)
    const topSemi1 = round1Matches[0];
    const topSemi2 = round1Matches[1];

    // Bottom bracket semi-finals (Match 3 and 4)
    const bottomSemi1 = round1Matches[2];
    const bottomSemi2 = round1Matches[3];

    // Extract winners and losers from top bracket
    const topSemi1Winner = topSemi1.winnerTeam === 1
      ? { player1Id: topSemi1.player1Id, player2Id: topSemi1.player2Id }
      : { player1Id: topSemi1.player3Id, player2Id: topSemi1.player4Id };

    const topSemi1Loser = topSemi1.winnerTeam === 1
      ? { player1Id: topSemi1.player3Id, player2Id: topSemi1.player4Id }
      : { player1Id: topSemi1.player1Id, player2Id: topSemi1.player2Id };

    const topSemi2Winner = topSemi2.winnerTeam === 1
      ? { player1Id: topSemi2.player1Id, player2Id: topSemi2.player2Id }
      : { player1Id: topSemi2.player3Id, player2Id: topSemi2.player4Id };

    const topSemi2Loser = topSemi2.winnerTeam === 1
      ? { player1Id: topSemi2.player3Id, player2Id: topSemi2.player4Id }
      : { player1Id: topSemi2.player1Id, player2Id: topSemi2.player2Id };

    // Extract winners and losers from bottom bracket
    const bottomSemi1Winner = bottomSemi1.winnerTeam === 1
      ? { player1Id: bottomSemi1.player1Id, player2Id: bottomSemi1.player2Id }
      : { player1Id: bottomSemi1.player3Id, player2Id: bottomSemi1.player4Id };

    const bottomSemi1Loser = bottomSemi1.winnerTeam === 1
      ? { player1Id: bottomSemi1.player3Id, player2Id: bottomSemi1.player4Id }
      : { player1Id: bottomSemi1.player1Id, player2Id: bottomSemi1.player2Id };

    const bottomSemi2Winner = bottomSemi2.winnerTeam === 1
      ? { player1Id: bottomSemi2.player1Id, player2Id: bottomSemi2.player2Id }
      : { player1Id: bottomSemi2.player3Id, player2Id: bottomSemi2.player4Id };

    const bottomSemi2Loser = bottomSemi2.winnerTeam === 1
      ? { player1Id: bottomSemi2.player3Id, player2Id: bottomSemi2.player4Id }
      : { player1Id: bottomSemi2.player1Id, player2Id: bottomSemi2.player2Id };

    // Create Round 2 matches
    const round2Matches = [
      // Match 5: Final (1st/2nd place) - Winners of top bracket semi-finals
      {
        tournamentId,
        phase: 2,
        roundNumber: 2,
        matchNumber: 5,
        player1Id: topSemi1Winner.player1Id,
        player2Id: topSemi1Winner.player2Id,
        player3Id: topSemi2Winner.player1Id,
        player4Id: topSemi2Winner.player2Id,
        status: MatchStatus.SCHEDULED,
      },
      // Match 6: 3rd/4th place - Losers of top bracket semi-finals
      {
        tournamentId,
        phase: 2,
        roundNumber: 2,
        matchNumber: 6,
        player1Id: topSemi1Loser.player1Id,
        player2Id: topSemi1Loser.player2Id,
        player3Id: topSemi2Loser.player1Id,
        player4Id: topSemi2Loser.player2Id,
        status: MatchStatus.SCHEDULED,
      },
      // Match 7: 5th/6th place - Winners of bottom bracket semi-finals
      {
        tournamentId,
        phase: 2,
        roundNumber: 2,
        matchNumber: 7,
        player1Id: bottomSemi1Winner.player1Id,
        player2Id: bottomSemi1Winner.player2Id,
        player3Id: bottomSemi2Winner.player1Id,
        player4Id: bottomSemi2Winner.player2Id,
        status: MatchStatus.SCHEDULED,
      },
      // Match 8: 7th/8th place - Losers of bottom bracket semi-finals
      {
        tournamentId,
        phase: 2,
        roundNumber: 2,
        matchNumber: 8,
        player1Id: bottomSemi1Loser.player1Id,
        player2Id: bottomSemi1Loser.player2Id,
        player3Id: bottomSemi2Loser.player1Id,
        player4Id: bottomSemi2Loser.player2Id,
        status: MatchStatus.SCHEDULED,
      },
    ];

    console.log(`[generateMultiGroupRound2] Creating ${round2Matches.length} Round 2 matches...`);
    console.log(`[generateMultiGroupRound2] Match details:`, round2Matches.map(m =>
      `Match ${m.matchNumber} (Round ${m.roundNumber})`
    ).join(', '));

    // Create matches in database
    await prisma.match.createMany({
      data: round2Matches,
    });

    console.log(`[generateMultiGroupRound2] Successfully created Round 2 matches in database!`);
  }

  /**
   * Advance from Group Stage Phase 1 (Round Robin) to Phase 2 (Playoffs)
   * Called after Phase 1 completes
   */
  private async advanceToPlayoffPhase(tournament: Tournament): Promise<void> {
    // Check if this is a multi-group tournament
    const phase1Matches = await prisma.match.findMany({
      where: {
        tournamentId: tournament.id,
        phase: 1,
      },
    });

    const groupNumbers = new Set(phase1Matches.map(m => m.groupNumber).filter(g => g != null));
    const isMultiGroup = groupNumbers.size > 1;

    if (isMultiGroup) {
      // Multi-group tournament: get top 2 from each group and cross them
      await this.advanceMultiGroupPlayoff(tournament, Array.from(groupNumbers).sort());
      return;
    }

    // Single group tournament: use simple playoff logic
    // Calculate standings for Phase 1 (all matches in phase 1)
    const standings = await this.calculatePhaseStandings(tournament.id, 1);

    // Sort by: points desc, set diff desc, game diff desc
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;

      const aSetDiff = a.setsWon - a.setsLost;
      const bSetDiff = b.setsWon - b.setsLost;
      if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;

      const aGameDiff = a.gamesWon - a.gamesLost;
      const bGameDiff = b.gamesWon - b.gamesLost;
      return bGameDiff - aGameDiff;
    });

    // Get top 4 teams (1st, 2nd, 3rd, 4th)
    const team1st = { player1Id: standings[0].player1Id, player2Id: standings[0].player2Id };
    const team2nd = { player1Id: standings[1].player1Id, player2Id: standings[1].player2Id };
    const team3rd = { player1Id: standings[2].player1Id, player2Id: standings[2].player2Id };
    const team4th = { player1Id: standings[3].player1Id, player2Id: standings[3].player2Id };

    // Check if Phase 2 matches already exist
    const existingPhase2Matches = await prisma.match.findMany({
      where: {
        tournamentId: tournament.id,
        phase: 2,
      },
    });

    // If Phase 2 matches exist and have no results, delete and recreate them
    // This allows re-seeding when Phase 1 results are edited
    if (existingPhase2Matches.length > 0) {
      const anyCompleted = existingPhase2Matches.some(m => m.status === MatchStatus.COMPLETED);

      if (!anyCompleted) {
        // Delete existing Phase 2 matches that haven't been played
        await prisma.match.deleteMany({
          where: {
            tournamentId: tournament.id,
            phase: 2,
            status: MatchStatus.SCHEDULED,
          },
        });
      } else {
        // Phase 2 already has results, don't regenerate
        return;
      }
    }

    // Generate playoff matches using scheduler
    const playoffMatches = tournamentScheduler.generatePlayoffMatches(
      tournament.id,
      team1st,
      team2nd,
      team3rd,
      team4th
    );

    // Create matches in database
    await prisma.match.createMany({
      data: playoffMatches.map((m) => ({
        tournamentId: m.tournamentId,
        phase: m.phase,
        roundNumber: m.roundNumber,
        matchNumber: m.matchNumber,
        player1Id: m.player1Id,
        player2Id: m.player2Id,
        player3Id: m.player3Id,
        player4Id: m.player4Id,
        status: MatchStatus.SCHEDULED,
      })),
    });

    // Update tournament
    await prisma.tournament.update({
      where: { id: tournament.id },
      data: {
        currentPhase: 2,
        status: TournamentStatus.PHASE_1_COMPLETE,
      },
    });
  }

  /**
   * Advance multi-group tournament to playoff phase
   * Crosses group winners: 1A vs 2B, 2A vs 1B (semi-finals for 1st/2nd)
   * Also crosses 3rd/4th: 3A vs 4B, 3B vs 4A (semi-finals for 3rd/4th)
   */
  private async advanceMultiGroupPlayoff(tournament: Tournament, groupNumbers: number[]): Promise<void> {
    // Get standings for each group
    const groupStandings: Map<number, TeamStanding[]> = new Map();

    for (const groupNum of groupNumbers) {
      const matches = await prisma.match.findMany({
        where: {
          tournamentId: tournament.id,
          phase: 1,
          groupNumber: groupNum,
          status: MatchStatus.COMPLETED,
        },
        include: {
          player1: true,
          player2: true,
          player3: true,
          player4: true,
        },
      });

      const standings = this.buildStandingsFromMatches(matches);

      // Sort by: points desc, set diff desc, game diff desc
      standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;

        const aSetDiff = a.setsWon - a.setsLost;
        const bSetDiff = b.setsWon - b.setsLost;
        if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;

        const aGameDiff = a.gamesWon - a.gamesLost;
        const bGameDiff = b.gamesWon - b.gamesLost;
        return bGameDiff - aGameDiff;
      });

      groupStandings.set(groupNum, standings);
    }

    // Check if Phase 2 matches already exist
    const existingPhase2Matches = await prisma.match.findMany({
      where: {
        tournamentId: tournament.id,
        phase: 2,
      },
    });

    if (existingPhase2Matches.length > 0) {
      const anyCompleted = existingPhase2Matches.some(m => m.status === MatchStatus.COMPLETED);
      if (!anyCompleted) {
        await prisma.match.deleteMany({
          where: {
            tournamentId: tournament.id,
            phase: 2,
            status: MatchStatus.SCHEDULED,
          },
        });
      } else {
        return;
      }
    }

    // Create Phase 2 playoff matches
    const playoffMatches: any[] = [];
    let matchNumber = 1;

    // For 2 groups (16 players): create semi-finals and finals
    if (groupNumbers.length === 2) {
      const group1 = groupStandings.get(1)!;
      const group2 = groupStandings.get(2)!;

      // Semi-finals (Round 1): 1A vs 2B, 2A vs 1B
      playoffMatches.push({
        tournamentId: tournament.id,
        phase: 2,
        roundNumber: 1,
        matchNumber: matchNumber++,
        player1Id: group1[0].player1Id,  // 1st from Group A
        player2Id: group1[0].player2Id,
        player3Id: group2[1].player1Id,  // 2nd from Group B
        player4Id: group2[1].player2Id,
        status: MatchStatus.SCHEDULED,
      });

      playoffMatches.push({
        tournamentId: tournament.id,
        phase: 2,
        roundNumber: 1,
        matchNumber: matchNumber++,
        player1Id: group1[1].player1Id,  // 2nd from Group A
        player2Id: group1[1].player2Id,
        player3Id: group2[0].player1Id,  // 1st from Group B
        player4Id: group2[0].player2Id,
        status: MatchStatus.SCHEDULED,
      });

      // Semi-finals for 3rd place (Round 1): 3A vs 4B, 4A vs 3B
      playoffMatches.push({
        tournamentId: tournament.id,
        phase: 2,
        roundNumber: 1,
        matchNumber: matchNumber++,
        player1Id: group1[2].player1Id,  // 3rd from Group A
        player2Id: group1[2].player2Id,
        player3Id: group2[3].player1Id,  // 4th from Group B
        player4Id: group2[3].player2Id,
        status: MatchStatus.SCHEDULED,
      });

      playoffMatches.push({
        tournamentId: tournament.id,
        phase: 2,
        roundNumber: 1,
        matchNumber: matchNumber++,
        player1Id: group1[3].player1Id,  // 4th from Group A
        player2Id: group1[3].player2Id,
        player3Id: group2[2].player1Id,  // 3rd from Group B
        player4Id: group2[2].player2Id,
        status: MatchStatus.SCHEDULED,
      });

      // Note: Round 2 (finals) will be generated after Round 1 completes
    }
    // For 3 groups (24 players): more complex bracket
    else if (groupNumbers.length === 3) {
      // Simplified: top 2 from each group (6 teams) could create a more complex bracket
      // For now, use similar cross logic
      const group1 = groupStandings.get(1)!;
      const group2 = groupStandings.get(2)!;
      const group3 = groupStandings.get(3)!;

      // Create matches crossing groups (this is a simplified version)
      playoffMatches.push({
        tournamentId: tournament.id,
        phase: 2,
        roundNumber: 1,
        matchNumber: matchNumber++,
        player1Id: group1[0].player1Id,
        player2Id: group1[0].player2Id,
        player3Id: group2[1].player1Id,
        player4Id: group2[1].player2Id,
        status: MatchStatus.SCHEDULED,
      });

      playoffMatches.push({
        tournamentId: tournament.id,
        phase: 2,
        roundNumber: 1,
        matchNumber: matchNumber++,
        player1Id: group2[0].player1Id,
        player2Id: group2[0].player2Id,
        player3Id: group3[1].player1Id,
        player4Id: group3[1].player2Id,
        status: MatchStatus.SCHEDULED,
      });
    }

    // Create matches
    await prisma.match.createMany({
      data: playoffMatches,
    });

    // Update tournament
    await prisma.tournament.update({
      where: { id: tournament.id },
      data: {
        currentPhase: 2,
        status: TournamentStatus.PHASE_1_COMPLETE,
      },
    });
  }

  /**
   * Calculate standings for a phase (for GROUP_STAGE_KNOCKOUT)
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
   * Calculate standings for a group
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
    });

    return this.buildStandingsFromMatches(matches);
  }

  /**
   * Build standings from matches
   */
  private buildStandingsFromMatches(matches: Match[]): TeamStanding[] {

    // Build team standings map
    const standingsMap = new Map<string, TeamStanding>();

    for (const match of matches) {
      const team1Key = `${match.player1Id}-${match.player2Id}`;
      const team2Key = `${match.player3Id}-${match.player4Id}`;

      // Initialize team 1
      if (!standingsMap.has(team1Key)) {
        standingsMap.set(team1Key, {
          player1Id: match.player1Id,
          player2Id: match.player2Id,
          player1: (match as any).player1,
          player2: (match as any).player2,
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
          player1: (match as any).player3,
          player2: (match as any).player4,
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
}

export const tournamentProgress = new TournamentProgressService();
