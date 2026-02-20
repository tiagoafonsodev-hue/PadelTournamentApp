import { Match, MatchStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { matchExtractor, Team } from './MatchExtractorService';

export class KnockoutRoundGeneratorService {
  /**
   * Generate Knockout Round 2 matches (Final + 3rd place) for 4-team knockout
   * Called after Round 1 (semi-finals) completes
   */
  async generateKnockoutRound2(
    tournamentId: string,
    round1Matches: Match[]
  ): Promise<void> {
    const match1 = round1Matches[0];
    const match2 = round1Matches[1];

    const match1WinnerTeam = matchExtractor.extractWinnerTeam(match1);
    const match1LoserTeam = matchExtractor.extractLoserTeam(match1);
    const match2WinnerTeam = matchExtractor.extractWinnerTeam(match2);
    const match2LoserTeam = matchExtractor.extractLoserTeam(match2);

    const round2Matches = [
      // Match 3: Final (winners of semi-finals)
      {
        tournamentId,
        phase: 1,
        roundNumber: 2,
        matchNumber: 3,
        player1Id: match1WinnerTeam.player1Id,
        player2Id: match1WinnerTeam.player2Id,
        player3Id: match2WinnerTeam.player1Id,
        player4Id: match2WinnerTeam.player2Id,
        status: MatchStatus.SCHEDULED,
      },
      // Match 4: 3rd place (losers of semi-finals)
      {
        tournamentId,
        phase: 1,
        roundNumber: 2,
        matchNumber: 4,
        player1Id: match1LoserTeam.player1Id,
        player2Id: match1LoserTeam.player2Id,
        player3Id: match2LoserTeam.player1Id,
        player4Id: match2LoserTeam.player2Id,
        status: MatchStatus.SCHEDULED,
      },
    ];

    await prisma.match.createMany({ data: round2Matches });
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
  async generateKnockout8TeamRound2(
    tournamentId: string,
    round1Matches: Match[]
  ): Promise<void> {
    logger.debug('generateKnockout8TeamRound2: starting Round 2 generation for 8-team knockout');

    // Sort by match number to ensure correct order
    round1Matches.sort((a, b) => a.matchNumber - b.matchNumber);

    // Quarter-final results
    const qf1 = round1Matches[0];
    const qf2 = round1Matches[1];
    const qf3 = round1Matches[2];
    const qf4 = round1Matches[3];

    const round2Matches = [
      // Top bracket semi-finals (for 1st-4th place)
      {
        tournamentId,
        phase: 1,
        roundNumber: 2,
        matchNumber: 5,
        player1Id: matchExtractor.extractWinnerTeam(qf1).player1Id,
        player2Id: matchExtractor.extractWinnerTeam(qf1).player2Id,
        player3Id: matchExtractor.extractWinnerTeam(qf2).player1Id,
        player4Id: matchExtractor.extractWinnerTeam(qf2).player2Id,
        status: MatchStatus.SCHEDULED,
      },
      {
        tournamentId,
        phase: 1,
        roundNumber: 2,
        matchNumber: 6,
        player1Id: matchExtractor.extractWinnerTeam(qf3).player1Id,
        player2Id: matchExtractor.extractWinnerTeam(qf3).player2Id,
        player3Id: matchExtractor.extractWinnerTeam(qf4).player1Id,
        player4Id: matchExtractor.extractWinnerTeam(qf4).player2Id,
        status: MatchStatus.SCHEDULED,
      },
      // Bottom bracket semi-finals (for 5th-8th place)
      {
        tournamentId,
        phase: 1,
        roundNumber: 2,
        matchNumber: 7,
        player1Id: matchExtractor.extractLoserTeam(qf1).player1Id,
        player2Id: matchExtractor.extractLoserTeam(qf1).player2Id,
        player3Id: matchExtractor.extractLoserTeam(qf2).player1Id,
        player4Id: matchExtractor.extractLoserTeam(qf2).player2Id,
        status: MatchStatus.SCHEDULED,
      },
      {
        tournamentId,
        phase: 1,
        roundNumber: 2,
        matchNumber: 8,
        player1Id: matchExtractor.extractLoserTeam(qf3).player1Id,
        player2Id: matchExtractor.extractLoserTeam(qf3).player2Id,
        player3Id: matchExtractor.extractLoserTeam(qf4).player1Id,
        player4Id: matchExtractor.extractLoserTeam(qf4).player2Id,
        status: MatchStatus.SCHEDULED,
      },
    ];

    await prisma.match.createMany({ data: round2Matches });
    logger.info('generateKnockout8TeamRound2: created Round 2 matches', { count: round2Matches.length });
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
  async generateKnockout8TeamRound3(
    tournamentId: string,
    round2Matches: Match[]
  ): Promise<void> {
    logger.debug('generateKnockout8TeamRound3: starting Round 3 generation for 8-team knockout');

    // Sort by match number
    round2Matches.sort((a, b) => a.matchNumber - b.matchNumber);

    // Round 2 results
    const sf1 = round2Matches.find(m => m.matchNumber === 5)!;
    const sf2 = round2Matches.find(m => m.matchNumber === 6)!;
    const loserSf1 = round2Matches.find(m => m.matchNumber === 7)!;
    const loserSf2 = round2Matches.find(m => m.matchNumber === 8)!;

    const round3Matches = [
      // Final (1st/2nd place)
      {
        tournamentId,
        phase: 1,
        roundNumber: 3,
        matchNumber: 9,
        player1Id: matchExtractor.extractWinnerTeam(sf1).player1Id,
        player2Id: matchExtractor.extractWinnerTeam(sf1).player2Id,
        player3Id: matchExtractor.extractWinnerTeam(sf2).player1Id,
        player4Id: matchExtractor.extractWinnerTeam(sf2).player2Id,
        status: MatchStatus.SCHEDULED,
      },
      // 3rd/4th place
      {
        tournamentId,
        phase: 1,
        roundNumber: 3,
        matchNumber: 10,
        player1Id: matchExtractor.extractLoserTeam(sf1).player1Id,
        player2Id: matchExtractor.extractLoserTeam(sf1).player2Id,
        player3Id: matchExtractor.extractLoserTeam(sf2).player1Id,
        player4Id: matchExtractor.extractLoserTeam(sf2).player2Id,
        status: MatchStatus.SCHEDULED,
      },
      // 5th/6th place
      {
        tournamentId,
        phase: 1,
        roundNumber: 3,
        matchNumber: 11,
        player1Id: matchExtractor.extractWinnerTeam(loserSf1).player1Id,
        player2Id: matchExtractor.extractWinnerTeam(loserSf1).player2Id,
        player3Id: matchExtractor.extractWinnerTeam(loserSf2).player1Id,
        player4Id: matchExtractor.extractWinnerTeam(loserSf2).player2Id,
        status: MatchStatus.SCHEDULED,
      },
      // 7th/8th place
      {
        tournamentId,
        phase: 1,
        roundNumber: 3,
        matchNumber: 12,
        player1Id: matchExtractor.extractLoserTeam(loserSf1).player1Id,
        player2Id: matchExtractor.extractLoserTeam(loserSf1).player2Id,
        player3Id: matchExtractor.extractLoserTeam(loserSf2).player1Id,
        player4Id: matchExtractor.extractLoserTeam(loserSf2).player2Id,
        status: MatchStatus.SCHEDULED,
      },
    ];

    await prisma.match.createMany({ data: round3Matches });
    logger.info('generateKnockout8TeamRound3: created Round 3 matches', { count: round3Matches.length });
  }
}

export const knockoutRoundGenerator = new KnockoutRoundGeneratorService();
