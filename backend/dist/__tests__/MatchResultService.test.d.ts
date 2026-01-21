interface MatchResultData {
    team1Score: number;
    team2Score: number;
}
interface PlayerStats {
    playerId: string;
    totalMatches: number;
    matchesWon: number;
    matchesLost: number;
    matchesDrawn: number;
    setsWon: number;
    setsLost: number;
    gamesWon: number;
    gamesLost: number;
    tournamentsPlayed: number;
    tournamentsWon: number;
    winPercentage: number;
    tournamentPoints: number;
}
interface TournamentConfig {
    allowTies: boolean;
    type: 'ROUND_ROBIN' | 'KNOCKOUT' | 'GROUP_STAGE_KNOCKOUT';
}
interface MatchContext {
    phase: number;
}
declare function validateMatchResult(result: MatchResultData): void;
declare function validateMatchResultWithConfig(result: MatchResultData, tournament: TournamentConfig, match: MatchContext): void;
declare function determineWinner(result: MatchResultData): 1 | 2;
declare function determineWinnerWithTies(result: MatchResultData): 1 | 2 | null;
declare function calculateUpdatedStats(currentStats: PlayerStats | null, isWinner: boolean, gamesFor: number, gamesAgainst: number, reverse?: boolean): PlayerStats;
declare function createEmptyStats(playerId: string): PlayerStats;
declare function calculateUpdatedStatsForTie(currentStats: PlayerStats | null, gamesFor: number, gamesAgainst: number, reverse?: boolean): PlayerStats;
//# sourceMappingURL=MatchResultService.test.d.ts.map