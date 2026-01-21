interface Team {
    player1Id: string;
    player2Id: string;
}
interface MatchData {
    tournamentId: string;
    phase: number;
    roundNumber: number;
    matchNumber: number;
    matchDay?: number;
    player1Id: string;
    player2Id: string;
    player3Id: string;
    player4Id: string;
    groupNumber?: number;
}
export declare class TournamentSchedulerService {
    /**
     * Generate Round Robin matches for variable team counts
     * Supports: 3 teams (6 players), 4 teams (8 players), 6 teams (12 players)
     * Also supports multi-group: 8 teams (16 players), 12 teams (24 players)
     */
    generateRoundRobinMatches(tournamentId: string, teams: Team[]): MatchData[];
    /**
     * Generate Round Robin for a single group (3, 4, or 6 teams)
     */
    private generateRoundRobinSingleGroup;
    /**
     * Generate Round Robin for multiple groups
     */
    private generateRoundRobinMultiGroup;
    /**
     * Generate Knockout matches for variable team counts
     * Supports: 4, 6, 8, 12 teams
     */
    generateKnockoutMatches(tournamentId: string, teams: Team[]): MatchData[];
    /**
     * Generate knockout for 4 teams (8 players) - semi-finals
     */
    private generateKnockoutFor4Teams;
    /**
     * Generate knockout for 6, 8, or 12 teams
     * These are more complex tournaments with multiple rounds
     */
    private generateKnockoutForMultipleTeams;
    /**
     * Generate Round 2 knockout matches (Final + 3rd place)
     * Called after Round 1 completes
     */
    generateKnockoutRound2(tournamentId: string, match1WinnerTeam: Team, match1LoserTeam: Team, match2WinnerTeam: Team, match2LoserTeam: Team): MatchData[];
    /**
     * Generate Group Stage matches (Round Robin + Knockout)
     * Phase 1: Round Robin within groups
     * Phase 2: Playoffs based on group standings
     * Supports: 4, 6, 8, 12 teams
     */
    generateGroupStageMatches(tournamentId: string, teams: Team[]): MatchData[];
    /**
     * Generate Phase 2 playoff matches
     * Called after Phase 1 completes
     * 1st vs 2nd (Final), 3rd vs 4th (3rd place match)
     */
    generatePlayoffMatches(tournamentId: string, team1st: Team, team2nd: Team, team3rd: Team, team4th: Team): MatchData[];
}
export declare const tournamentScheduler: TournamentSchedulerService;
export {};
//# sourceMappingURL=TournamentSchedulerService.d.ts.map