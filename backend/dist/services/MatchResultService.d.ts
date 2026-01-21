interface MatchResultData {
    team1Score: number;
    team2Score: number;
}
export declare class MatchResultService {
    /**
     * Submit match result with validation and stats updates
     * Padel matches are played as single set with time limit
     */
    submitMatchResult(matchId: string, result: MatchResultData): Promise<void>;
    /**
     * Basic validation - scores must be non-negative
     */
    private validateBasicResult;
    /**
     * Validate if tie is allowed based on tournament config and match phase
     */
    private validateTieAllowed;
    /**
     * Update player stats after match completion (win/loss)
     */
    private updatePlayerStats;
    /**
     * Update player stats for a tie/draw
     */
    private updatePlayerStatsForTie;
}
export declare const matchResultService: MatchResultService;
export {};
//# sourceMappingURL=MatchResultService.d.ts.map