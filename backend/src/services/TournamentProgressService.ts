// Port of Android TournamentProgressManager.kt
// Refactored to use extracted services for better maintainability

import { Tournament, Match, TournamentStatus, MatchStatus } from '@prisma/client';
import { tournamentScheduler } from './TournamentSchedulerService';
import { tournamentPointService } from './TournamentPointService';
import { standingsCalculator, TeamStanding } from './StandingsCalculatorService';
import { knockoutRoundGenerator } from './KnockoutRoundGeneratorService';
import { playoffRoundGenerator } from './PlayoffRoundGeneratorService';
import prisma from '../lib/prisma';
import logger from '../lib/logger';

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

    logger.debug('checkAndAdvancePhase: start', { tournamentId });

    const currentPhaseMatches = tournament.matches.filter(
      (m: Match) => m.phase === tournament.currentPhase
    );

    logger.debug('checkAndAdvancePhase: tournament info', {
      tournamentId,
      type: tournament.type,
      currentPhase: tournament.currentPhase,
      matchCount: currentPhaseMatches.length
    });

    const allCompleted = currentPhaseMatches.every(
      (m: Match) => m.status === MatchStatus.COMPLETED
    );

    logger.debug('checkAndAdvancePhase: completion check', { allCompleted });

    if (!allCompleted) return;

    logger.info('checkAndAdvancePhase: phase complete, advancing', { phase: tournament.currentPhase });

    if (tournament.type === 'ROUND_ROBIN') {
      await this.handleRoundRobinComplete(tournamentId);
    } else if (tournament.type === 'KNOCKOUT') {
      await this.handleKnockoutProgress(tournament);
    } else if (tournament.type === 'GROUP_STAGE_KNOCKOUT') {
      await this.handleGroupStageKnockoutProgress(tournament);
    }
  }

  private async handleRoundRobinComplete(tournamentId: string): Promise<void> {
    logger.info('checkAndAdvancePhase: Round Robin tournament finishing');
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        status: TournamentStatus.FINISHED,
        finishedAt: new Date(),
      },
    });
    logger.info('checkAndAdvancePhase: tournament finished', { tournamentId });
    await this.updateTournamentStats(tournamentId);
  }

  private async handleKnockoutProgress(tournament: Tournament & { matches: Match[] }): Promise<void> {
    const round1Matches = tournament.matches.filter((m: Match) => m.roundNumber === 1);
    const round2Matches = tournament.matches.filter((m: Match) => m.roundNumber === 2);
    const round3Matches = tournament.matches.filter((m: Match) => m.roundNumber === 3);

    const allRound1Complete = round1Matches.length > 0 && round1Matches.every((m: Match) => m.status === MatchStatus.COMPLETED);
    const allRound2Complete = round2Matches.length > 0 && round2Matches.every((m: Match) => m.status === MatchStatus.COMPLETED);
    const allRound3Complete = round3Matches.length > 0 && round3Matches.every((m: Match) => m.status === MatchStatus.COMPLETED);

    // 8-team knockout (4 QF matches)
    if (round1Matches.length === 4) {
      if (allRound3Complete) {
        await this.finishTournament(tournament.id);
      } else if (allRound2Complete && round3Matches.length === 0) {
        await knockoutRoundGenerator.generateKnockout8TeamRound3(tournament.id, round2Matches);
      } else if (allRound1Complete && round2Matches.length === 0) {
        await knockoutRoundGenerator.generateKnockout8TeamRound2(tournament.id, round1Matches);
      }
    }
    // 4-team knockout (2 SF matches)
    else if (round1Matches.length === 2) {
      if (allRound2Complete) {
        await this.finishTournament(tournament.id);
      } else if (allRound1Complete && round2Matches.length === 0) {
        await knockoutRoundGenerator.generateKnockoutRound2(tournament.id, round1Matches);
      }
    }
  }

  private async handleGroupStageKnockoutProgress(tournament: Tournament & { matches: Match[] }): Promise<void> {
    if (tournament.currentPhase === 1) {
      await this.advanceToPlayoffPhase(tournament);
    } else if (tournament.currentPhase === 2) {
      await this.handlePhase2Progress(tournament);
    }
  }

  private async handlePhase2Progress(tournament: Tournament & { matches: Match[] }): Promise<void> {
    const phase2Matches = tournament.matches.filter((m: Match) => m.phase === 2);
    const anyPhase2Completed = phase2Matches.some((m: Match) => m.status === MatchStatus.COMPLETED);

    // Check if Phase 2 needs regeneration
    if (!anyPhase2Completed && phase2Matches.length > 0) {
      logger.debug('Phase 2 not started, checking if regeneration needed');
      await prisma.match.deleteMany({
        where: { tournamentId: tournament.id, phase: 2, status: MatchStatus.SCHEDULED },
      });
      await prisma.tournament.update({
        where: { id: tournament.id },
        data: { currentPhase: 1 },
      });
      await this.advanceToPlayoffPhase({ ...tournament, currentPhase: 1 });
      logger.info('Phase 2 regenerated with updated standings');
      return;
    }

    const round1Matches = phase2Matches.filter(m => m.roundNumber === 1);
    const round2Matches = phase2Matches.filter(m => m.roundNumber === 2);

    logger.debug('Phase 2 check', {
      tournamentId: tournament.id,
      round1: { total: round1Matches.length, completed: round1Matches.filter(m => m.status === MatchStatus.COMPLETED).length },
      round2: { total: round2Matches.length }
    });

    const allRound1Complete = round1Matches.length > 0 && round1Matches.every((m: Match) => m.status === MatchStatus.COMPLETED);
    const allRound2Complete = round2Matches.length > 0 && round2Matches.every((m: Match) => m.status === MatchStatus.COMPLETED);

    // Check if tournament is complete
    if (allRound2Complete || (allRound1Complete && round2Matches.length === 0 && round1Matches.length === 2)) {
      await this.finishTournament(tournament.id);
    }
    // Generate Round 2 if needed
    else if (allRound1Complete && round1Matches.length >= 4) {
      if (round2Matches.length === 0) {
        await this.generatePlayoffRound2(tournament.id, round1Matches);
      } else if (round2Matches.every((m: Match) => m.status === MatchStatus.SCHEDULED)) {
        logger.info('Round 1 results changed, regenerating Round 2 with updated teams');
        await prisma.match.deleteMany({
          where: { tournamentId: tournament.id, phase: 2, roundNumber: 2 },
        });
        logger.debug('Deleted old Round 2 matches');
        await this.generatePlayoffRound2(tournament.id, round1Matches);
      } else {
        logger.debug('Round 2 matches already started, cannot regenerate');
      }
    } else if (round2Matches.length > 0) {
      logger.debug('Round 2 exists but not all matches complete yet');
    }
  }

  private async generatePlayoffRound2(tournamentId: string, round1Matches: Match[]): Promise<void> {
    logger.info('All Round 1 matches complete, generating Round 2');
    if (round1Matches.length === 2) {
      await playoffRoundGenerator.generateSingleGroupRound2(tournamentId, round1Matches);
    } else {
      await playoffRoundGenerator.generateMultiGroupRound2(tournamentId, round1Matches);
    }
    logger.info('Round 2 generation complete');
  }

  private async finishTournament(tournamentId: string): Promise<void> {
    logger.info('All playoff matches complete, finishing tournament');
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: TournamentStatus.FINISHED, finishedAt: new Date() },
    });
    logger.info('Tournament finished, updating player stats');
    await this.updateTournamentStats(tournamentId);
    logger.info('Player stats updated');
  }

  private async updateTournamentStats(tournamentId: string): Promise<void> {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        matches: {
          include: { player1: true, player2: true, player3: true, player4: true },
        },
      },
    });

    if (!tournament) return;

    const finalPositions = await this.calculateFinalPositions(tournament);
    if (finalPositions.length > 0) {
      await tournamentPointService.awardTournamentPoints(tournamentId, finalPositions);
    }
  }

  private async calculateFinalPositions(
    tournament: Tournament & { matches: Match[] }
  ): Promise<{ playerId: string; position: number; matchesWon: number }[]> {
    const positions: { playerId: string; position: number; matchesWon: number }[] = [];
    const completedMatches = tournament.matches.filter(m => m.status === MatchStatus.COMPLETED);
    const playerWins = this.calculatePlayerWins(completedMatches);

    if (tournament.type === 'ROUND_ROBIN') {
      return this.calculateRoundRobinPositions(tournament.id, playerWins);
    }

    return this.calculateKnockoutPositions(tournament, completedMatches, playerWins);
  }

  private calculatePlayerWins(matches: Match[]): Map<string, number> {
    const playerWins = new Map<string, number>();

    for (const match of matches) {
      [match.player1Id, match.player2Id, match.player3Id, match.player4Id].forEach(pid => {
        if (!playerWins.has(pid)) playerWins.set(pid, 0);
      });

      if (match.winnerTeam === 1) {
        playerWins.set(match.player1Id, (playerWins.get(match.player1Id) || 0) + 1);
        playerWins.set(match.player2Id, (playerWins.get(match.player2Id) || 0) + 1);
      } else if (match.winnerTeam === 2) {
        playerWins.set(match.player3Id, (playerWins.get(match.player3Id) || 0) + 1);
        playerWins.set(match.player4Id, (playerWins.get(match.player4Id) || 0) + 1);
      }
    }

    return playerWins;
  }

  private async calculateRoundRobinPositions(
    tournamentId: string,
    playerWins: Map<string, number>
  ): Promise<{ playerId: string; position: number; matchesWon: number }[]> {
    const positions: { playerId: string; position: number; matchesWon: number }[] = [];
    const standings = await standingsCalculator.calculatePhaseStandings(tournamentId, 1);
    const sortedStandings = standingsCalculator.sortStandingsByTiebreakers(standings);

    let position = 1;
    for (const standing of sortedStandings) {
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

    return positions;
  }

  private async calculateKnockoutPositions(
    tournament: Tournament & { matches: Match[] },
    completedMatches: Match[],
    playerWins: Map<string, number>
  ): Promise<{ playerId: string; position: number; matchesWon: number }[]> {
    const positions: { playerId: string; position: number; matchesWon: number }[] = [];
    const maxPhase = Math.max(...completedMatches.map(m => m.phase));
    const finalPhaseMatches = completedMatches.filter(m => m.phase === maxPhase);
    const maxRound = Math.max(...finalPhaseMatches.map(m => m.roundNumber));
    const finalMatches = finalPhaseMatches.filter(m => m.roundNumber === maxRound);
    finalMatches.sort((a, b) => a.matchNumber - b.matchNumber);

    const isGroupStageKnockout = tournament.type === 'GROUP_STAGE_KNOCKOUT';

    for (const match of finalMatches) {
      const positionMapping = this.getPositionMapping(match.matchNumber, finalMatches.length, isGroupStageKnockout);
      if (!positionMapping) continue;

      const { winnerPos, loserPos } = positionMapping;
      this.addMatchPositions(positions, match, winnerPos, loserPos, playerWins);
    }

    // Handle players not in final matches
    await this.addRemainingPlayerPositions(tournament.id, positions, playerWins);

    return positions;
  }

  private getPositionMapping(matchNumber: number, numFinalMatches: number, isGroupStageKnockout: boolean): { winnerPos: number; loserPos: number } | null {
    if (isGroupStageKnockout) {
      if (numFinalMatches === 2) {
        if (matchNumber === 3) return { winnerPos: 1, loserPos: 2 };
        if (matchNumber === 4) return { winnerPos: 3, loserPos: 4 };
      } else if (numFinalMatches === 4) {
        if (matchNumber === 5) return { winnerPos: 1, loserPos: 2 };
        if (matchNumber === 6) return { winnerPos: 3, loserPos: 4 };
        if (matchNumber === 7) return { winnerPos: 5, loserPos: 6 };
        if (matchNumber === 8) return { winnerPos: 7, loserPos: 8 };
      } else if (numFinalMatches === 6) {
        if (matchNumber === 7) return { winnerPos: 1, loserPos: 2 };
        if (matchNumber === 8) return { winnerPos: 3, loserPos: 4 };
        if (matchNumber === 9) return { winnerPos: 5, loserPos: 6 };
        if (matchNumber === 10) return { winnerPos: 7, loserPos: 8 };
        if (matchNumber === 11) return { winnerPos: 9, loserPos: 10 };
        if (matchNumber === 12) return { winnerPos: 11, loserPos: 12 };
      }
    } else {
      if (numFinalMatches === 2) {
        if (matchNumber === 3) return { winnerPos: 1, loserPos: 2 };
        if (matchNumber === 4) return { winnerPos: 3, loserPos: 4 };
      } else if (numFinalMatches === 4) {
        if (matchNumber === 9) return { winnerPos: 1, loserPos: 2 };
        if (matchNumber === 10) return { winnerPos: 3, loserPos: 4 };
        if (matchNumber === 11) return { winnerPos: 5, loserPos: 6 };
        if (matchNumber === 12) return { winnerPos: 7, loserPos: 8 };
      }
    }
    return null;
  }

  private addMatchPositions(
    positions: { playerId: string; position: number; matchesWon: number }[],
    match: Match,
    winnerPos: number,
    loserPos: number,
    playerWins: Map<string, number>
  ): void {
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

  private async addRemainingPlayerPositions(
    tournamentId: string,
    positions: { playerId: string; position: number; matchesWon: number }[],
    playerWins: Map<string, number>
  ): Promise<void> {
    const tournamentPlayers = await prisma.tournamentPlayer.findMany({
      where: { tournamentId },
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
        if (positions.filter(p => p.position === nextPosition).length >= 2) {
          nextPosition++;
        }
      }
    }
  }

  private async advanceToPlayoffPhase(tournament: Tournament): Promise<void> {
    const phase1Matches = await prisma.match.findMany({
      where: { tournamentId: tournament.id, phase: 1 },
    });

    const groupNumbers = new Set(phase1Matches.map(m => m.groupNumber).filter(g => g != null));
    const isMultiGroup = groupNumbers.size > 1;

    if (isMultiGroup) {
      await this.advanceMultiGroupPlayoff(tournament, Array.from(groupNumbers).sort((a, b) => a - b));
      return;
    }

    await this.advanceSingleGroupPlayoff(tournament);
  }

  private async advanceSingleGroupPlayoff(tournament: Tournament): Promise<void> {
    const standings = await standingsCalculator.calculatePhaseStandings(tournament.id, 1);
    const sortedStandings = standingsCalculator.sortStandingsByTiebreakers(standings);

    const team1st = { player1Id: sortedStandings[0].player1Id, player2Id: sortedStandings[0].player2Id };
    const team2nd = { player1Id: sortedStandings[1].player1Id, player2Id: sortedStandings[1].player2Id };
    const team3rd = { player1Id: sortedStandings[2].player1Id, player2Id: sortedStandings[2].player2Id };
    const team4th = { player1Id: sortedStandings[3].player1Id, player2Id: sortedStandings[3].player2Id };

    // Check/delete existing Phase 2 matches
    const existingPhase2Matches = await prisma.match.findMany({
      where: { tournamentId: tournament.id, phase: 2 },
    });

    if (existingPhase2Matches.length > 0) {
      const anyCompleted = existingPhase2Matches.some(m => m.status === MatchStatus.COMPLETED);
      if (!anyCompleted) {
        await prisma.match.deleteMany({
          where: { tournamentId: tournament.id, phase: 2, status: MatchStatus.SCHEDULED },
        });
      } else {
        return;
      }
    }

    const playoffMatches = tournamentScheduler.generatePlayoffMatches(
      tournament.id, team1st, team2nd, team3rd, team4th
    );

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

    await prisma.tournament.update({
      where: { id: tournament.id },
      data: { currentPhase: 2, status: TournamentStatus.PHASE_1_COMPLETE },
    });
  }

  private async advanceMultiGroupPlayoff(tournament: Tournament, groupNumbers: number[]): Promise<void> {
    const groupStandings = await this.getGroupStandings(tournament.id, groupNumbers);

    // Check/delete existing Phase 2 matches
    const existingPhase2Matches = await prisma.match.findMany({
      where: { tournamentId: tournament.id, phase: 2 },
    });

    if (existingPhase2Matches.length > 0) {
      const anyCompleted = existingPhase2Matches.some(m => m.status === MatchStatus.COMPLETED);
      if (!anyCompleted) {
        await prisma.match.deleteMany({
          where: { tournamentId: tournament.id, phase: 2, status: MatchStatus.SCHEDULED },
        });
      } else {
        return;
      }
    }

    const playoffMatches = this.createMultiGroupPlayoffMatches(tournament.id, groupNumbers, groupStandings);

    await prisma.match.createMany({ data: playoffMatches });

    await prisma.tournament.update({
      where: { id: tournament.id },
      data: { currentPhase: 2, status: TournamentStatus.PHASE_1_COMPLETE },
    });
  }

  private async getGroupStandings(tournamentId: string, groupNumbers: number[]): Promise<Map<number, TeamStanding[]>> {
    const groupStandings = new Map<number, TeamStanding[]>();

    for (const groupNum of groupNumbers) {
      const standings = await standingsCalculator.calculateGroupStandings(tournamentId, groupNum);
      const sortedStandings = standingsCalculator.sortStandingsByTiebreakers(standings);
      groupStandings.set(groupNum, sortedStandings);
    }

    return groupStandings;
  }

  private createMultiGroupPlayoffMatches(
    tournamentId: string,
    groupNumbers: number[],
    groupStandings: Map<number, TeamStanding[]>
  ): any[] {
    const playoffMatches: any[] = [];
    let matchNumber = 1;

    if (groupNumbers.length === 2) {
      const group1 = groupStandings.get(1)!;
      const group2 = groupStandings.get(2)!;

      // Winners Semi-finals
      playoffMatches.push(this.createPlayoffMatch(tournamentId, matchNumber++, group1[0], group2[1]));
      playoffMatches.push(this.createPlayoffMatch(tournamentId, matchNumber++, group1[1], group2[0]));
      // Consolation Semi-finals
      playoffMatches.push(this.createPlayoffMatch(tournamentId, matchNumber++, group1[2], group2[3]));
      playoffMatches.push(this.createPlayoffMatch(tournamentId, matchNumber++, group2[2], group1[3]));
    } else if (groupNumbers.length === 3) {
      playoffMatches.push(...this.createMastersPlayoffMatches(tournamentId, groupStandings));
    }

    return playoffMatches;
  }

  private createPlayoffMatch(tournamentId: string, matchNumber: number, team1: TeamStanding, team2: TeamStanding): any {
    return {
      tournamentId,
      phase: 2,
      roundNumber: 1,
      matchNumber,
      player1Id: team1.player1Id,
      player2Id: team1.player2Id,
      player3Id: team2.player1Id,
      player4Id: team2.player2Id,
      status: MatchStatus.SCHEDULED,
    };
  }

  private createMastersPlayoffMatches(tournamentId: string, groupStandings: Map<number, TeamStanding[]>): any[] {
    const group1 = groupStandings.get(1)!;
    const group2 = groupStandings.get(2)!;
    const group3 = groupStandings.get(3)!;

    const compareTeams = (a: TeamStanding, b: TeamStanding) => {
      if (b.points !== a.points) return b.points - a.points;
      const aSetDiff = a.setsWon - a.setsLost;
      const bSetDiff = b.setsWon - b.setsLost;
      if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;
      return (b.gamesWon - b.gamesLost) - (a.gamesWon - a.gamesLost);
    };

    const allSeconds = [group1[1], group2[1], group3[1]].sort(compareTeams);
    const allThirds = [group1[2], group2[2], group3[2]].sort(compareTeams);
    const allFourths = [group1[3], group2[3], group3[3]].sort(compareTeams);

    const winnersBracket = [group1[0], group2[0], group3[0], allSeconds[0]];
    const middleBracket = [allSeconds[1], allSeconds[2], allThirds[0], allThirds[1]];
    const consolationBracket = [allThirds[2], allFourths[0], allFourths[1], allFourths[2]];

    let matchNumber = 1;
    const matches: any[] = [];

    // Winners Bracket SF
    matches.push(this.createPlayoffMatch(tournamentId, matchNumber++, winnersBracket[0], winnersBracket[3]));
    matches.push(this.createPlayoffMatch(tournamentId, matchNumber++, winnersBracket[1], winnersBracket[2]));
    // Middle Bracket SF
    matches.push(this.createPlayoffMatch(tournamentId, matchNumber++, middleBracket[0], middleBracket[3]));
    matches.push(this.createPlayoffMatch(tournamentId, matchNumber++, middleBracket[1], middleBracket[2]));
    // Consolation Bracket SF
    matches.push(this.createPlayoffMatch(tournamentId, matchNumber++, consolationBracket[0], consolationBracket[1]));
    matches.push(this.createPlayoffMatch(tournamentId, matchNumber++, consolationBracket[2], consolationBracket[3]));

    return matches;
  }

  // Public methods for external use (e.g., tournamentController)
  async calculatePhaseStandings(tournamentId: string, phase: number): Promise<TeamStanding[]> {
    return standingsCalculator.calculatePhaseStandings(tournamentId, phase);
  }

  async calculateGroupStandings(tournamentId: string, groupNumber: number): Promise<TeamStanding[]> {
    return standingsCalculator.calculateGroupStandings(tournamentId, groupNumber);
  }
}

export const tournamentProgress = new TournamentProgressService();
