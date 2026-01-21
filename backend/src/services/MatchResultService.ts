// Match result processing (SINGLE SET SCORING - time limited)

import { MatchStatus, Match, Tournament } from '@prisma/client';
import { tournamentProgress } from './TournamentProgressService';
import prisma from '../lib/prisma';

interface MatchResultData {
  team1Score: number; // Games won by team 1
  team2Score: number; // Games won by team 2
}

type MatchOutcome = 'win' | 'loss' | 'draw';

export class MatchResultService {
  /**
   * Submit match result with validation and stats updates
   * Padel matches are played as single set with time limit
   */
  async submitMatchResult(
    matchId: string,
    result: MatchResultData
  ): Promise<void> {
    // Basic validation (non-negative scores)
    this.validateBasicResult(result);

    // Get match details with tournament
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { tournament: true },
    });

    if (!match) {
      throw new Error('Match not found');
    }

    // Validate tie conditions
    this.validateTieAllowed(result, match, match.tournament);

    const isUpdate = match.status === MatchStatus.COMPLETED;
    const isTie = result.team1Score === result.team2Score;

    // If updating, reverse old stats first
    if (isUpdate && match.set1Team1 !== null && match.set1Team2 !== null) {
      const oldIsTie = match.winnerTeam === null;
      if (oldIsTie) {
        // Reverse tie stats
        await this.updatePlayerStatsForTie(match.player1Id, match.set1Team1, match.set1Team2, true);
        await this.updatePlayerStatsForTie(match.player2Id, match.set1Team1, match.set1Team2, true);
        await this.updatePlayerStatsForTie(match.player3Id, match.set1Team2, match.set1Team1, true);
        await this.updatePlayerStatsForTie(match.player4Id, match.set1Team2, match.set1Team1, true);
      } else {
        // Reverse win/loss stats
        const oldTeam1Winner = match.winnerTeam === 1;
        await this.updatePlayerStats(match.player1Id, oldTeam1Winner ? 'win' : 'loss', match.set1Team1, match.set1Team2, true);
        await this.updatePlayerStats(match.player2Id, oldTeam1Winner ? 'win' : 'loss', match.set1Team1, match.set1Team2, true);
        await this.updatePlayerStats(match.player3Id, oldTeam1Winner ? 'loss' : 'win', match.set1Team2, match.set1Team1, true);
        await this.updatePlayerStats(match.player4Id, oldTeam1Winner ? 'loss' : 'win', match.set1Team2, match.set1Team1, true);
      }
    }

    // Determine winner (null for tie)
    const winnerTeam = isTie ? null : (result.team1Score > result.team2Score ? 1 : 2);

    // Update match with result
    await prisma.match.update({
      where: { id: matchId },
      data: {
        set1Team1: result.team1Score,
        set1Team2: result.team2Score,
        team1Score: isTie ? 0 : (result.team1Score > result.team2Score ? 1 : 0),
        team2Score: isTie ? 0 : (result.team2Score > result.team1Score ? 1 : 0),
        winnerTeam,
        status: MatchStatus.COMPLETED,
        playedAt: new Date(),
      },
    });

    // Update player stats for all 4 players
    if (isTie) {
      await this.updatePlayerStatsForTie(match.player1Id, result.team1Score, result.team2Score, false);
      await this.updatePlayerStatsForTie(match.player2Id, result.team1Score, result.team2Score, false);
      await this.updatePlayerStatsForTie(match.player3Id, result.team2Score, result.team1Score, false);
      await this.updatePlayerStatsForTie(match.player4Id, result.team2Score, result.team1Score, false);
    } else {
      const isTeam1Winner = winnerTeam === 1;
      await this.updatePlayerStats(match.player1Id, isTeam1Winner ? 'win' : 'loss', result.team1Score, result.team2Score, false);
      await this.updatePlayerStats(match.player2Id, isTeam1Winner ? 'win' : 'loss', result.team1Score, result.team2Score, false);
      await this.updatePlayerStats(match.player3Id, isTeam1Winner ? 'loss' : 'win', result.team2Score, result.team1Score, false);
      await this.updatePlayerStats(match.player4Id, isTeam1Winner ? 'loss' : 'win', result.team2Score, result.team1Score, false);
    }

    // Always check if tournament phase should advance
    await tournamentProgress.checkAndAdvancePhase(match.tournamentId);
  }

  /**
   * Basic validation - scores must be non-negative
   */
  private validateBasicResult(result: MatchResultData): void {
    if (result.team1Score < 0 || result.team2Score < 0) {
      throw new Error('Scores cannot be negative');
    }
  }

  /**
   * Validate if tie is allowed based on tournament config and match phase
   */
  private validateTieAllowed(
    result: MatchResultData,
    match: Match,
    tournament: Tournament
  ): void {
    const isTie = result.team1Score === result.team2Score;

    if (!isTie) return; // Not a tie, no validation needed

    // Check if ties are allowed for this tournament
    if (!tournament.allowTies) {
      throw new Error('Match cannot end in a tie');
    }

    // Ties only allowed in Phase 1 (group stage)
    if (match.phase !== 1) {
      throw new Error('Ties are not allowed in playoff matches');
    }

    // Double-check: knockout tournaments never allow ties
    if (tournament.type === 'KNOCKOUT') {
      throw new Error('Ties are not allowed in knockout tournaments');
    }
  }

  /**
   * Update player stats after match completion (win/loss)
   */
  private async updatePlayerStats(
    playerId: string,
    outcome: MatchOutcome,
    gamesFor: number,
    gamesAgainst: number,
    reverse: boolean = false
  ): Promise<void> {
    if (outcome === 'draw') {
      return this.updatePlayerStatsForTie(playerId, gamesFor, gamesAgainst, reverse);
    }

    const isWinner = outcome === 'win';
    const stats = await prisma.playerStats.findUnique({
      where: { playerId },
    });

    if (!stats) {
      if (!reverse) {
        await prisma.playerStats.create({
          data: {
            playerId,
            totalMatches: 1,
            matchesWon: isWinner ? 1 : 0,
            matchesLost: isWinner ? 0 : 1,
            matchesDrawn: 0,
            setsWon: isWinner ? 1 : 0,
            setsLost: isWinner ? 0 : 1,
            gamesWon: gamesFor,
            gamesLost: gamesAgainst,
            tournamentsPlayed: 0,
            tournamentsWon: 0,
            winPercentage: isWinner ? 100 : 0,
          },
        });
      }
      return;
    }

    const multiplier = reverse ? -1 : 1;
    const newTotalMatches = stats.totalMatches + (multiplier * 1);
    const newMatchesWon = stats.matchesWon + (multiplier * (isWinner ? 1 : 0));
    const newMatchesLost = stats.matchesLost + (multiplier * (isWinner ? 0 : 1));
    // Win percentage: wins / (total - draws) * 100, or wins / total if no draws matter
    const decisiveMatches = newTotalMatches - stats.matchesDrawn;
    const newWinPercentage = decisiveMatches > 0 ? (newMatchesWon / decisiveMatches) * 100 : 0;

    await prisma.playerStats.update({
      where: { playerId },
      data: {
        totalMatches: newTotalMatches,
        matchesWon: newMatchesWon,
        matchesLost: newMatchesLost,
        setsWon: stats.setsWon + (multiplier * (isWinner ? 1 : 0)),
        setsLost: stats.setsLost + (multiplier * (isWinner ? 0 : 1)),
        gamesWon: stats.gamesWon + (multiplier * gamesFor),
        gamesLost: stats.gamesLost + (multiplier * gamesAgainst),
        winPercentage: newWinPercentage,
      },
    });
  }

  /**
   * Update player stats for a tie/draw
   */
  private async updatePlayerStatsForTie(
    playerId: string,
    gamesFor: number,
    gamesAgainst: number,
    reverse: boolean = false
  ): Promise<void> {
    const stats = await prisma.playerStats.findUnique({
      where: { playerId },
    });

    if (!stats) {
      if (!reverse) {
        await prisma.playerStats.create({
          data: {
            playerId,
            totalMatches: 1,
            matchesWon: 0,
            matchesLost: 0,
            matchesDrawn: 1,
            setsWon: 0,
            setsLost: 0,
            gamesWon: gamesFor,
            gamesLost: gamesAgainst,
            tournamentsPlayed: 0,
            tournamentsWon: 0,
            winPercentage: 0, // No decisive matches yet
          },
        });
      }
      return;
    }

    const multiplier = reverse ? -1 : 1;
    const newTotalMatches = stats.totalMatches + (multiplier * 1);
    const newMatchesDrawn = stats.matchesDrawn + (multiplier * 1);
    // Win percentage based on decisive matches only
    const decisiveMatches = newTotalMatches - newMatchesDrawn;
    const newWinPercentage = decisiveMatches > 0 ? (stats.matchesWon / decisiveMatches) * 100 : 0;

    await prisma.playerStats.update({
      where: { playerId },
      data: {
        totalMatches: newTotalMatches,
        matchesDrawn: newMatchesDrawn,
        gamesWon: stats.gamesWon + (multiplier * gamesFor),
        gamesLost: stats.gamesLost + (multiplier * gamesAgainst),
        winPercentage: newWinPercentage,
      },
    });
  }
}

export const matchResultService = new MatchResultService();
