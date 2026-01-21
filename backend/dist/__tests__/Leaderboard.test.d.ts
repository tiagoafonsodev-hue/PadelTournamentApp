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
interface Player {
    id: string;
    name: string;
    stats: PlayerStats | null;
}
declare function sortLeaderboard(players: Player[]): Player[];
declare function calculateWinPercentage(matchesWon: number, totalMatches: number): number;
declare function createPlayer(id: string, name: string, stats: Partial<PlayerStats> | null): Player;
//# sourceMappingURL=Leaderboard.test.d.ts.map