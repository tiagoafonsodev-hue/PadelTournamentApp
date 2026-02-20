import { Match } from '@prisma/client';

export interface Team {
  player1Id: string;
  player2Id: string;
}

export class MatchExtractorService {
  /**
   * Extract the winning team from a completed match
   */
  extractWinnerTeam(match: Match): Team {
    if (match.winnerTeam === 1) {
      return { player1Id: match.player1Id, player2Id: match.player2Id };
    }
    return { player1Id: match.player3Id, player2Id: match.player4Id };
  }

  /**
   * Extract the losing team from a completed match
   */
  extractLoserTeam(match: Match): Team {
    if (match.winnerTeam === 1) {
      return { player1Id: match.player3Id, player2Id: match.player4Id };
    }
    return { player1Id: match.player1Id, player2Id: match.player2Id };
  }
}

export const matchExtractor = new MatchExtractorService();
