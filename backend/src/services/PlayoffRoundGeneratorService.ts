import { Match, MatchStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { matchExtractor } from './MatchExtractorService';

export class PlayoffRoundGeneratorService {
  /**
   * Generate Single-Group Round 2 matches (Final + 3rd place)
   * For GROUP_STAGE_KNOCKOUT tournaments with 1 group (4 teams)
   * Called after Round 1 (2 semi-final matches) of Phase 2 completes
   */
  async generateSingleGroupRound2(
    tournamentId: string,
    round1Matches: Match[]
  ): Promise<void> {
    logger.debug('generateSingleGroupRound2: starting Round 2 generation', { tournamentId, round1MatchCount: round1Matches.length });

    if (round1Matches.length < 2) {
      logger.error('generateSingleGroupRound2: not enough Round 1 matches to generate Round 2');
      return;
    }

    // Sort by match number to ensure correct order
    round1Matches.sort((a, b) => a.matchNumber - b.matchNumber);

    const match1 = round1Matches[0];
    const match2 = round1Matches[1];

    // Extract winners and losers
    const match1Winner = matchExtractor.extractWinnerTeam(match1);
    const match1Loser = matchExtractor.extractLoserTeam(match1);
    const match2Winner = matchExtractor.extractWinnerTeam(match2);
    const match2Loser = matchExtractor.extractLoserTeam(match2);

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

    logger.debug('generateSingleGroupRound2: creating Round 2 matches', { count: round2Matches.length });

    await prisma.match.createMany({ data: round2Matches });

    logger.info('generateSingleGroupRound2: successfully created Round 2 matches');
  }

  /**
   * Generate Multi-Group Round 2 matches (Finals for all positions)
   * Called after Round 1 (semi-finals) of Phase 2 completes
   *
   * For 2 groups (Open1000 - 4 SF matches):
   * - Match 5: Final (1st/2nd), Match 6: 3rd/4th
   * - Match 7: 5th/6th, Match 8: 7th/8th
   *
   * For 3 groups (Masters - 6 SF matches):
   * - Match 7-8: Winners bracket finals (1st-4th)
   * - Match 9-10: Middle bracket finals (5th-8th)
   * - Match 11-12: Consolation bracket finals (9th-12th)
   */
  async generateMultiGroupRound2(
    tournamentId: string,
    round1Matches: Match[]
  ): Promise<void> {
    logger.debug('generateMultiGroupRound2: starting Round 2 generation', { tournamentId, round1MatchCount: round1Matches.length });

    // Sort by match number to ensure correct order
    round1Matches.sort((a, b) => a.matchNumber - b.matchNumber);
    logger.debug('generateMultiGroupRound2: match numbers', { matchNumbers: round1Matches.map(m => m.matchNumber) });

    const round2Matches: any[] = [];

    // Masters format: 6 SF matches → 6 Finals
    if (round1Matches.length === 6) {
      // Winners bracket SF (Matches 1-2)
      const winnersSf1 = round1Matches[0];
      const winnersSf2 = round1Matches[1];
      // Middle bracket SF (Matches 3-4)
      const middleSf1 = round1Matches[2];
      const middleSf2 = round1Matches[3];
      // Consolation bracket SF (Matches 5-6)
      const consolationSf1 = round1Matches[4];
      const consolationSf2 = round1Matches[5];

      // Winners Bracket Finals (Match 7-8)
      round2Matches.push({
        tournamentId,
        phase: 2,
        roundNumber: 2,
        matchNumber: 7,
        player1Id: matchExtractor.extractWinnerTeam(winnersSf1).player1Id,
        player2Id: matchExtractor.extractWinnerTeam(winnersSf1).player2Id,
        player3Id: matchExtractor.extractWinnerTeam(winnersSf2).player1Id,
        player4Id: matchExtractor.extractWinnerTeam(winnersSf2).player2Id,
        status: MatchStatus.SCHEDULED,
      });
      round2Matches.push({
        tournamentId,
        phase: 2,
        roundNumber: 2,
        matchNumber: 8,
        player1Id: matchExtractor.extractLoserTeam(winnersSf1).player1Id,
        player2Id: matchExtractor.extractLoserTeam(winnersSf1).player2Id,
        player3Id: matchExtractor.extractLoserTeam(winnersSf2).player1Id,
        player4Id: matchExtractor.extractLoserTeam(winnersSf2).player2Id,
        status: MatchStatus.SCHEDULED,
      });

      // Middle Bracket Finals (Match 9-10)
      round2Matches.push({
        tournamentId,
        phase: 2,
        roundNumber: 2,
        matchNumber: 9,
        player1Id: matchExtractor.extractWinnerTeam(middleSf1).player1Id,
        player2Id: matchExtractor.extractWinnerTeam(middleSf1).player2Id,
        player3Id: matchExtractor.extractWinnerTeam(middleSf2).player1Id,
        player4Id: matchExtractor.extractWinnerTeam(middleSf2).player2Id,
        status: MatchStatus.SCHEDULED,
      });
      round2Matches.push({
        tournamentId,
        phase: 2,
        roundNumber: 2,
        matchNumber: 10,
        player1Id: matchExtractor.extractLoserTeam(middleSf1).player1Id,
        player2Id: matchExtractor.extractLoserTeam(middleSf1).player2Id,
        player3Id: matchExtractor.extractLoserTeam(middleSf2).player1Id,
        player4Id: matchExtractor.extractLoserTeam(middleSf2).player2Id,
        status: MatchStatus.SCHEDULED,
      });

      // Consolation Bracket Finals (Match 11-12)
      round2Matches.push({
        tournamentId,
        phase: 2,
        roundNumber: 2,
        matchNumber: 11,
        player1Id: matchExtractor.extractWinnerTeam(consolationSf1).player1Id,
        player2Id: matchExtractor.extractWinnerTeam(consolationSf1).player2Id,
        player3Id: matchExtractor.extractWinnerTeam(consolationSf2).player1Id,
        player4Id: matchExtractor.extractWinnerTeam(consolationSf2).player2Id,
        status: MatchStatus.SCHEDULED,
      });
      round2Matches.push({
        tournamentId,
        phase: 2,
        roundNumber: 2,
        matchNumber: 12,
        player1Id: matchExtractor.extractLoserTeam(consolationSf1).player1Id,
        player2Id: matchExtractor.extractLoserTeam(consolationSf1).player2Id,
        player3Id: matchExtractor.extractLoserTeam(consolationSf2).player1Id,
        player4Id: matchExtractor.extractLoserTeam(consolationSf2).player2Id,
        status: MatchStatus.SCHEDULED,
      });
    }
    // Open1000 format: 4 SF matches → 4 Finals
    else if (round1Matches.length >= 4) {
      // Top bracket semi-finals (Match 1 and 2)
      const topSemi1 = round1Matches[0];
      const topSemi2 = round1Matches[1];
      // Bottom bracket semi-finals (Match 3 and 4)
      const bottomSemi1 = round1Matches[2];
      const bottomSemi2 = round1Matches[3];

      // Match 5: Final (1st/2nd place)
      round2Matches.push({
        tournamentId,
        phase: 2,
        roundNumber: 2,
        matchNumber: 5,
        player1Id: matchExtractor.extractWinnerTeam(topSemi1).player1Id,
        player2Id: matchExtractor.extractWinnerTeam(topSemi1).player2Id,
        player3Id: matchExtractor.extractWinnerTeam(topSemi2).player1Id,
        player4Id: matchExtractor.extractWinnerTeam(topSemi2).player2Id,
        status: MatchStatus.SCHEDULED,
      });
      // Match 6: 3rd/4th place
      round2Matches.push({
        tournamentId,
        phase: 2,
        roundNumber: 2,
        matchNumber: 6,
        player1Id: matchExtractor.extractLoserTeam(topSemi1).player1Id,
        player2Id: matchExtractor.extractLoserTeam(topSemi1).player2Id,
        player3Id: matchExtractor.extractLoserTeam(topSemi2).player1Id,
        player4Id: matchExtractor.extractLoserTeam(topSemi2).player2Id,
        status: MatchStatus.SCHEDULED,
      });
      // Match 7: 5th/6th place
      round2Matches.push({
        tournamentId,
        phase: 2,
        roundNumber: 2,
        matchNumber: 7,
        player1Id: matchExtractor.extractWinnerTeam(bottomSemi1).player1Id,
        player2Id: matchExtractor.extractWinnerTeam(bottomSemi1).player2Id,
        player3Id: matchExtractor.extractWinnerTeam(bottomSemi2).player1Id,
        player4Id: matchExtractor.extractWinnerTeam(bottomSemi2).player2Id,
        status: MatchStatus.SCHEDULED,
      });
      // Match 8: 7th/8th place
      round2Matches.push({
        tournamentId,
        phase: 2,
        roundNumber: 2,
        matchNumber: 8,
        player1Id: matchExtractor.extractLoserTeam(bottomSemi1).player1Id,
        player2Id: matchExtractor.extractLoserTeam(bottomSemi1).player2Id,
        player3Id: matchExtractor.extractLoserTeam(bottomSemi2).player1Id,
        player4Id: matchExtractor.extractLoserTeam(bottomSemi2).player2Id,
        status: MatchStatus.SCHEDULED,
      });
    } else {
      logger.error('generateMultiGroupRound2: not enough Round 1 matches to generate Round 2');
      return;
    }

    logger.debug('generateMultiGroupRound2: creating Round 2 matches', { count: round2Matches.length });

    await prisma.match.createMany({ data: round2Matches });

    logger.info('generateMultiGroupRound2: successfully created Round 2 matches');
  }
}

export const playoffRoundGenerator = new PlayoffRoundGeneratorService();
