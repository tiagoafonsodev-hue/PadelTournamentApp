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
    points: number;
    groupNumber?: number;
}
export declare class TournamentProgressService {
    /**
     * Check if tournament phase is complete and advance if needed
     */
    checkAndAdvancePhase(tournamentId: string): Promise<void>;
    /**
     * Update player tournament stats and award points when tournament finishes
     */
    private updateTournamentStats;
    /**
     * Calculate final positions for all players in a tournament
     * Also calculates matchesWon for bonus points
     */
    private calculateFinalPositions;
    /**
     * Generate Knockout Round 2 matches (Final + 3rd place)
     * Called after Round 1 (semi-finals) completes
     */
    private generateKnockoutRound2;
    /**
     * Generate 8-team Knockout Round 2 (Semi-finals + Loser Semi-finals)
     * Called after Round 1 (Quarter-finals) completes
     * Round 2 matches:
     * - Match 5: SF1 (Winner QF1 vs Winner QF2) - Top bracket
     * - Match 6: SF2 (Winner QF3 vs Winner QF4) - Top bracket
     * - Match 7: Loser SF1 (Loser QF1 vs Loser QF2) - Bottom bracket
     * - Match 8: Loser SF2 (Loser QF3 vs Loser QF4) - Bottom bracket
     */
    private generateKnockout8TeamRound2;
    /**
     * Generate 8-team Knockout Round 3 (Finals for all positions)
     * Called after Round 2 (Semi-finals) completes
     * Round 3 matches:
     * - Match 9: Final (1st/2nd) - Winners of SF1 vs SF2
     * - Match 10: 3rd/4th place - Losers of SF1 vs SF2
     * - Match 11: 5th/6th place - Winners of Loser SF1 vs Loser SF2
     * - Match 12: 7th/8th place - Losers of Loser SF1 vs Loser SF2
     */
    private generateKnockout8TeamRound3;
    /**
     * Generate Single-Group Round 2 matches (Final + 3rd place)
     * For GROUP_STAGE_KNOCKOUT tournaments with 1 group (4 teams)
     * Called after Round 1 (2 semi-final matches) of Phase 2 completes
     */
    private generateSingleGroupRound2;
    /**
     * Generate Multi-Group Round 2 matches (Finals for all positions)
     * Called after Round 1 (semi-finals) of Phase 2 completes
     * Creates:
     * - Final (1st/2nd): Winners of Match 1 vs Match 2
     * - 3rd/4th place: Losers of Match 1 vs Match 2
     * - 5th/6th place: Winners of Match 3 vs Match 4
     * - 7th/8th place: Losers of Match 3 vs Match 4
     */
    private generateMultiGroupRound2;
    /**
     * Advance from Group Stage Phase 1 (Round Robin) to Phase 2 (Playoffs)
     * Called after Phase 1 completes
     */
    private advanceToPlayoffPhase;
    /**
     * Advance multi-group tournament to playoff phase
     * Crosses group winners: 1A vs 2B, 2A vs 1B (semi-finals for 1st/2nd)
     * Also crosses 3rd/4th: 3A vs 4B, 3B vs 4A (semi-finals for 3rd/4th)
     */
    private advanceMultiGroupPlayoff;
    /**
     * Calculate standings for a phase (for GROUP_STAGE_KNOCKOUT)
     */
    calculatePhaseStandings(tournamentId: string, phase: number): Promise<TeamStanding[]>;
    /**
     * Calculate standings for a group
     */
    calculateGroupStandings(tournamentId: string, groupNumber: number): Promise<TeamStanding[]>;
    /**
     * Build standings from matches
     */
    private buildStandingsFromMatches;
}
export declare const tournamentProgress: TournamentProgressService;
export {};
//# sourceMappingURL=TournamentProgressService.d.ts.map