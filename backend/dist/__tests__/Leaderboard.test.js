"use strict";
// Tests for Leaderboard ranking and sorting logic
// Leaderboard sorting logic (matches the backend implementation)
function sortLeaderboard(players) {
    return [...players].sort((a, b) => {
        // Primary sort: winPercentage descending
        const aWinPct = a.stats?.winPercentage ?? 0;
        const bWinPct = b.stats?.winPercentage ?? 0;
        if (bWinPct !== aWinPct) {
            return bWinPct - aWinPct;
        }
        // Secondary sort: total matches descending (more matches = more reliable ranking)
        const aMatches = a.stats?.totalMatches ?? 0;
        const bMatches = b.stats?.totalMatches ?? 0;
        if (bMatches !== aMatches) {
            return bMatches - aMatches;
        }
        // Tertiary sort: tournaments won descending
        const aTournamentsWon = a.stats?.tournamentsWon ?? 0;
        const bTournamentsWon = b.stats?.tournamentsWon ?? 0;
        if (bTournamentsWon !== aTournamentsWon) {
            return bTournamentsWon - aTournamentsWon;
        }
        // Quaternary sort: games won descending
        const aGamesWon = a.stats?.gamesWon ?? 0;
        const bGamesWon = b.stats?.gamesWon ?? 0;
        return bGamesWon - aGamesWon;
    });
}
// Calculate win percentage
function calculateWinPercentage(matchesWon, totalMatches) {
    if (totalMatches === 0)
        return 0;
    return (matchesWon / totalMatches) * 100;
}
// Create a player with stats
function createPlayer(id, name, stats) {
    if (stats === null) {
        return { id, name, stats: null };
    }
    const totalMatches = stats.totalMatches ?? 0;
    const matchesWon = stats.matchesWon ?? 0;
    return {
        id,
        name,
        stats: {
            playerId: id,
            totalMatches,
            matchesWon,
            matchesLost: stats.matchesLost ?? 0,
            matchesDrawn: stats.matchesDrawn ?? 0,
            setsWon: stats.setsWon ?? 0,
            setsLost: stats.setsLost ?? 0,
            gamesWon: stats.gamesWon ?? 0,
            gamesLost: stats.gamesLost ?? 0,
            tournamentsPlayed: stats.tournamentsPlayed ?? 0,
            tournamentsWon: stats.tournamentsWon ?? 0,
            winPercentage: stats.winPercentage ?? calculateWinPercentage(matchesWon, totalMatches),
            tournamentPoints: stats.tournamentPoints ?? 0,
        },
    };
}
describe('Leaderboard', () => {
    describe('Win Percentage Calculation', () => {
        it('should calculate 100% for all wins', () => {
            expect(calculateWinPercentage(10, 10)).toBe(100);
        });
        it('should calculate 0% for no wins', () => {
            expect(calculateWinPercentage(0, 10)).toBe(0);
        });
        it('should calculate 50% for half wins', () => {
            expect(calculateWinPercentage(5, 10)).toBe(50);
        });
        it('should calculate correct percentage for various scenarios', () => {
            expect(calculateWinPercentage(3, 4)).toBe(75);
            expect(calculateWinPercentage(1, 3)).toBeCloseTo(33.33, 1);
            expect(calculateWinPercentage(2, 3)).toBeCloseTo(66.67, 1);
            expect(calculateWinPercentage(7, 10)).toBe(70);
        });
        it('should return 0% for 0 matches', () => {
            expect(calculateWinPercentage(0, 0)).toBe(0);
        });
    });
    describe('Basic Sorting by Win Percentage', () => {
        it('should sort players by win percentage descending', () => {
            const players = [
                createPlayer('p1', 'Alice', { winPercentage: 50, totalMatches: 10 }),
                createPlayer('p2', 'Bob', { winPercentage: 75, totalMatches: 10 }),
                createPlayer('p3', 'Charlie', { winPercentage: 25, totalMatches: 10 }),
            ];
            const sorted = sortLeaderboard(players);
            expect(sorted[0].name).toBe('Bob'); // 75%
            expect(sorted[1].name).toBe('Alice'); // 50%
            expect(sorted[2].name).toBe('Charlie'); // 25%
        });
        it('should handle 100% win rate at top', () => {
            const players = [
                createPlayer('p1', 'Average', { winPercentage: 50, totalMatches: 10 }),
                createPlayer('p2', 'Perfect', { winPercentage: 100, totalMatches: 5 }),
                createPlayer('p3', 'Good', { winPercentage: 80, totalMatches: 10 }),
            ];
            const sorted = sortLeaderboard(players);
            expect(sorted[0].name).toBe('Perfect');
            expect(sorted[0].stats?.winPercentage).toBe(100);
        });
        it('should handle 0% win rate at bottom', () => {
            const players = [
                createPlayer('p1', 'Winless', { winPercentage: 0, totalMatches: 5 }),
                createPlayer('p2', 'Average', { winPercentage: 50, totalMatches: 10 }),
                createPlayer('p3', 'Good', { winPercentage: 75, totalMatches: 10 }),
            ];
            const sorted = sortLeaderboard(players);
            expect(sorted[2].name).toBe('Winless');
            expect(sorted[2].stats?.winPercentage).toBe(0);
        });
        it('should correctly order many players', () => {
            const players = [
                createPlayer('p1', 'Player1', { winPercentage: 45 }),
                createPlayer('p2', 'Player2', { winPercentage: 90 }),
                createPlayer('p3', 'Player3', { winPercentage: 30 }),
                createPlayer('p4', 'Player4', { winPercentage: 65 }),
                createPlayer('p5', 'Player5', { winPercentage: 80 }),
                createPlayer('p6', 'Player6', { winPercentage: 55 }),
            ];
            const sorted = sortLeaderboard(players);
            expect(sorted[0].stats?.winPercentage).toBe(90);
            expect(sorted[1].stats?.winPercentage).toBe(80);
            expect(sorted[2].stats?.winPercentage).toBe(65);
            expect(sorted[3].stats?.winPercentage).toBe(55);
            expect(sorted[4].stats?.winPercentage).toBe(45);
            expect(sorted[5].stats?.winPercentage).toBe(30);
        });
    });
    describe('Players with No Stats', () => {
        it('should place players with null stats at bottom', () => {
            const players = [
                createPlayer('p1', 'NoStats', null),
                createPlayer('p2', 'HasStats', { winPercentage: 50, totalMatches: 10 }),
            ];
            const sorted = sortLeaderboard(players);
            expect(sorted[0].name).toBe('HasStats');
            expect(sorted[1].name).toBe('NoStats');
        });
        it('should handle multiple players with no stats', () => {
            const players = [
                createPlayer('p1', 'NoStats1', null),
                createPlayer('p2', 'HasStats', { winPercentage: 50, totalMatches: 10 }),
                createPlayer('p3', 'NoStats2', null),
            ];
            const sorted = sortLeaderboard(players);
            expect(sorted[0].name).toBe('HasStats');
            // Both no-stats players at bottom (order between them doesn't matter)
            expect(['NoStats1', 'NoStats2']).toContain(sorted[1].name);
            expect(['NoStats1', 'NoStats2']).toContain(sorted[2].name);
        });
        it('should treat null stats as 0% win rate', () => {
            const players = [
                createPlayer('p1', 'NoStats', null),
                createPlayer('p2', 'ZeroWins', { winPercentage: 0, totalMatches: 5 }),
            ];
            const sorted = sortLeaderboard(players);
            // Both have 0% win rate, but ZeroWins has more matches
            expect(sorted[0].name).toBe('ZeroWins');
            expect(sorted[1].name).toBe('NoStats');
        });
    });
    describe('Tiebreaker: Total Matches', () => {
        it('should use total matches as tiebreaker when win percentage is equal', () => {
            const players = [
                createPlayer('p1', 'FewMatches', { winPercentage: 75, totalMatches: 4 }),
                createPlayer('p2', 'ManyMatches', { winPercentage: 75, totalMatches: 20 }),
            ];
            const sorted = sortLeaderboard(players);
            // Same win percentage, but more matches = more reliable ranking
            expect(sorted[0].name).toBe('ManyMatches');
            expect(sorted[1].name).toBe('FewMatches');
        });
        it('should correctly rank players with same win percentage but different match counts', () => {
            const players = [
                createPlayer('p1', 'Pro', { winPercentage: 60, totalMatches: 100 }),
                createPlayer('p2', 'Newcomer', { winPercentage: 60, totalMatches: 5 }),
                createPlayer('p3', 'Regular', { winPercentage: 60, totalMatches: 30 }),
            ];
            const sorted = sortLeaderboard(players);
            expect(sorted[0].name).toBe('Pro'); // 100 matches
            expect(sorted[1].name).toBe('Regular'); // 30 matches
            expect(sorted[2].name).toBe('Newcomer'); // 5 matches
        });
    });
    describe('Tiebreaker: Tournaments Won', () => {
        it('should use tournaments won when win percentage and matches are equal', () => {
            const players = [
                createPlayer('p1', 'NoTrophies', {
                    winPercentage: 70,
                    totalMatches: 20,
                    tournamentsWon: 0
                }),
                createPlayer('p2', 'Champion', {
                    winPercentage: 70,
                    totalMatches: 20,
                    tournamentsWon: 3
                }),
            ];
            const sorted = sortLeaderboard(players);
            expect(sorted[0].name).toBe('Champion');
            expect(sorted[1].name).toBe('NoTrophies');
        });
    });
    describe('Tiebreaker: Games Won', () => {
        it('should use games won as final tiebreaker', () => {
            const players = [
                createPlayer('p1', 'CloserGames', {
                    winPercentage: 70,
                    totalMatches: 20,
                    tournamentsWon: 2,
                    gamesWon: 100
                }),
                createPlayer('p2', 'DominantWins', {
                    winPercentage: 70,
                    totalMatches: 20,
                    tournamentsWon: 2,
                    gamesWon: 150
                }),
            ];
            const sorted = sortLeaderboard(players);
            expect(sorted[0].name).toBe('DominantWins');
            expect(sorted[1].name).toBe('CloserGames');
        });
    });
    describe('Complex Leaderboard Scenarios', () => {
        it('should correctly rank a realistic leaderboard', () => {
            const players = [
                createPlayer('p1', 'WorldChamp', {
                    winPercentage: 85,
                    totalMatches: 50,
                    tournamentsWon: 5,
                    gamesWon: 300,
                }),
                createPlayer('p2', 'Newcomer', {
                    winPercentage: 100,
                    totalMatches: 2,
                    tournamentsWon: 0,
                    gamesWon: 12,
                }),
                createPlayer('p3', 'Veteran', {
                    winPercentage: 70,
                    totalMatches: 100,
                    tournamentsWon: 3,
                    gamesWon: 500,
                }),
                createPlayer('p4', 'Improving', {
                    winPercentage: 60,
                    totalMatches: 15,
                    tournamentsWon: 1,
                    gamesWon: 80,
                }),
                createPlayer('p5', 'Beginner', {
                    winPercentage: 30,
                    totalMatches: 10,
                    tournamentsWon: 0,
                    gamesWon: 40,
                }),
                createPlayer('p6', 'NoGames', null),
            ];
            const sorted = sortLeaderboard(players);
            // Order should be by win percentage first
            expect(sorted[0].name).toBe('Newcomer'); // 100%
            expect(sorted[1].name).toBe('WorldChamp'); // 85%
            expect(sorted[2].name).toBe('Veteran'); // 70%
            expect(sorted[3].name).toBe('Improving'); // 60%
            expect(sorted[4].name).toBe('Beginner'); // 30%
            expect(sorted[5].name).toBe('NoGames'); // 0%
        });
        it('should handle all players with same stats', () => {
            const players = [
                createPlayer('p1', 'Player1', { winPercentage: 50, totalMatches: 10 }),
                createPlayer('p2', 'Player2', { winPercentage: 50, totalMatches: 10 }),
                createPlayer('p3', 'Player3', { winPercentage: 50, totalMatches: 10 }),
            ];
            const sorted = sortLeaderboard(players);
            // All should be present, order doesn't matter when all stats are identical
            expect(sorted).toHaveLength(3);
            expect(sorted.map(p => p.stats?.winPercentage)).toEqual([50, 50, 50]);
        });
        it('should handle empty leaderboard', () => {
            const sorted = sortLeaderboard([]);
            expect(sorted).toHaveLength(0);
        });
        it('should handle single player', () => {
            const players = [
                createPlayer('p1', 'OnlyPlayer', { winPercentage: 75, totalMatches: 10 }),
            ];
            const sorted = sortLeaderboard(players);
            expect(sorted).toHaveLength(1);
            expect(sorted[0].name).toBe('OnlyPlayer');
        });
    });
    describe('Real Tournament Progression', () => {
        it('should update rankings as tournament progresses', () => {
            // Initial state: 4 players with no matches
            let players = [
                createPlayer('p1', 'Alice', { totalMatches: 0, matchesWon: 0, winPercentage: 0 }),
                createPlayer('p2', 'Bob', { totalMatches: 0, matchesWon: 0, winPercentage: 0 }),
                createPlayer('p3', 'Charlie', { totalMatches: 0, matchesWon: 0, winPercentage: 0 }),
                createPlayer('p4', 'Diana', { totalMatches: 0, matchesWon: 0, winPercentage: 0 }),
            ];
            // All start at 0%
            let sorted = sortLeaderboard(players);
            expect(sorted.every(p => p.stats?.winPercentage === 0)).toBe(true);
            // After round 1: Alice and Charlie win
            players = [
                createPlayer('p1', 'Alice', { totalMatches: 1, matchesWon: 1, winPercentage: 100 }),
                createPlayer('p2', 'Bob', { totalMatches: 1, matchesWon: 0, winPercentage: 0 }),
                createPlayer('p3', 'Charlie', { totalMatches: 1, matchesWon: 1, winPercentage: 100 }),
                createPlayer('p4', 'Diana', { totalMatches: 1, matchesWon: 0, winPercentage: 0 }),
            ];
            sorted = sortLeaderboard(players);
            expect(['Alice', 'Charlie']).toContain(sorted[0].name);
            expect(['Alice', 'Charlie']).toContain(sorted[1].name);
            expect(['Bob', 'Diana']).toContain(sorted[2].name);
            expect(['Bob', 'Diana']).toContain(sorted[3].name);
            // After round 2: Alice beats Charlie, Diana beats Bob
            players = [
                createPlayer('p1', 'Alice', { totalMatches: 2, matchesWon: 2, winPercentage: 100 }),
                createPlayer('p2', 'Bob', { totalMatches: 2, matchesWon: 0, winPercentage: 0 }),
                createPlayer('p3', 'Charlie', { totalMatches: 2, matchesWon: 1, winPercentage: 50 }),
                createPlayer('p4', 'Diana', { totalMatches: 2, matchesWon: 1, winPercentage: 50 }),
            ];
            sorted = sortLeaderboard(players);
            expect(sorted[0].name).toBe('Alice'); // 100%
            expect(['Charlie', 'Diana']).toContain(sorted[1].name); // 50%
            expect(['Charlie', 'Diana']).toContain(sorted[2].name); // 50%
            expect(sorted[3].name).toBe('Bob'); // 0%
            // Final round: Alice beats Diana, Charlie beats Bob
            players = [
                createPlayer('p1', 'Alice', { totalMatches: 3, matchesWon: 3, winPercentage: 100 }),
                createPlayer('p2', 'Bob', { totalMatches: 3, matchesWon: 0, winPercentage: 0 }),
                createPlayer('p3', 'Charlie', { totalMatches: 3, matchesWon: 2, winPercentage: 66.67 }),
                createPlayer('p4', 'Diana', { totalMatches: 3, matchesWon: 1, winPercentage: 33.33 }),
            ];
            sorted = sortLeaderboard(players);
            expect(sorted[0].name).toBe('Alice'); // 100%
            expect(sorted[1].name).toBe('Charlie'); // 66.67%
            expect(sorted[2].name).toBe('Diana'); // 33.33%
            expect(sorted[3].name).toBe('Bob'); // 0%
        });
    });
    describe('Multiple Tournaments Impact', () => {
        it('should reflect accumulated stats across tournaments', () => {
            // Player stats after multiple tournaments
            const players = [
                createPlayer('p1', 'Consistent', {
                    totalMatches: 30, // 3 tournaments x 10 matches
                    matchesWon: 21, // 70% win rate
                    winPercentage: 70,
                    tournamentsPlayed: 3,
                    tournamentsWon: 1,
                }),
                createPlayer('p2', 'Streaky', {
                    totalMatches: 30,
                    matchesWon: 21, // Also 70% win rate
                    winPercentage: 70,
                    tournamentsPlayed: 3,
                    tournamentsWon: 2, // More tournament wins
                }),
                createPlayer('p3', 'NewTalent', {
                    totalMatches: 10, // Only 1 tournament
                    matchesWon: 8, // 80% win rate
                    winPercentage: 80,
                    tournamentsPlayed: 1,
                    tournamentsWon: 1,
                }),
            ];
            const sorted = sortLeaderboard(players);
            // NewTalent has highest win percentage
            expect(sorted[0].name).toBe('NewTalent');
            // Between Consistent and Streaky (same win% and matches), Streaky has more tournament wins
            expect(sorted[1].name).toBe('Streaky');
            expect(sorted[2].name).toBe('Consistent');
        });
    });
    describe('Edge Cases', () => {
        it('should handle very small win percentage differences', () => {
            const players = [
                createPlayer('p1', 'Player1', { winPercentage: 50.01 }),
                createPlayer('p2', 'Player2', { winPercentage: 50.00 }),
                createPlayer('p3', 'Player3', { winPercentage: 49.99 }),
            ];
            const sorted = sortLeaderboard(players);
            expect(sorted[0].stats?.winPercentage).toBe(50.01);
            expect(sorted[1].stats?.winPercentage).toBe(50.00);
            expect(sorted[2].stats?.winPercentage).toBe(49.99);
        });
        it('should handle players with only losses', () => {
            const players = [
                createPlayer('p1', 'AllLosses', {
                    totalMatches: 10,
                    matchesWon: 0,
                    matchesLost: 10,
                    winPercentage: 0,
                }),
                createPlayer('p2', 'SomeWins', {
                    totalMatches: 10,
                    matchesWon: 3,
                    matchesLost: 7,
                    winPercentage: 30,
                }),
            ];
            const sorted = sortLeaderboard(players);
            expect(sorted[0].name).toBe('SomeWins');
            expect(sorted[1].name).toBe('AllLosses');
        });
        it('should handle players with only wins', () => {
            const players = [
                createPlayer('p1', 'AllWins', {
                    totalMatches: 10,
                    matchesWon: 10,
                    matchesLost: 0,
                    winPercentage: 100,
                }),
                createPlayer('p2', 'MostWins', {
                    totalMatches: 10,
                    matchesWon: 9,
                    matchesLost: 1,
                    winPercentage: 90,
                }),
            ];
            const sorted = sortLeaderboard(players);
            expect(sorted[0].name).toBe('AllWins');
            expect(sorted[1].name).toBe('MostWins');
        });
        it('should handle very large match counts', () => {
            const players = [
                createPlayer('p1', 'Veteran', {
                    totalMatches: 1000,
                    matchesWon: 600,
                    winPercentage: 60,
                }),
                createPlayer('p2', 'Legend', {
                    totalMatches: 5000,
                    matchesWon: 3000,
                    winPercentage: 60,
                }),
            ];
            const sorted = sortLeaderboard(players);
            // Same win percentage, but Legend has more matches (more reliable)
            expect(sorted[0].name).toBe('Legend');
            expect(sorted[1].name).toBe('Veteran');
        });
    });
    describe('Rank Position Calculation', () => {
        it('should assign correct rank positions', () => {
            const players = [
                createPlayer('p1', 'Third', { winPercentage: 60 }),
                createPlayer('p2', 'First', { winPercentage: 90 }),
                createPlayer('p3', 'Second', { winPercentage: 75 }),
                createPlayer('p4', 'Fourth', { winPercentage: 45 }),
            ];
            const sorted = sortLeaderboard(players);
            // Verify positions
            expect(sorted[0].name).toBe('First'); // Rank 1
            expect(sorted[1].name).toBe('Second'); // Rank 2
            expect(sorted[2].name).toBe('Third'); // Rank 3
            expect(sorted[3].name).toBe('Fourth'); // Rank 4
        });
        it('should handle tied ranks correctly', () => {
            const players = [
                createPlayer('p1', 'TiedA', { winPercentage: 75, totalMatches: 10, tournamentsWon: 1, gamesWon: 50 }),
                createPlayer('p2', 'First', { winPercentage: 90 }),
                createPlayer('p3', 'TiedB', { winPercentage: 75, totalMatches: 10, tournamentsWon: 1, gamesWon: 50 }),
            ];
            const sorted = sortLeaderboard(players);
            expect(sorted[0].name).toBe('First');
            // TiedA and TiedB have identical stats, their relative order doesn't matter
            expect(['TiedA', 'TiedB']).toContain(sorted[1].name);
            expect(['TiedA', 'TiedB']).toContain(sorted[2].name);
        });
    });
    describe('Stats Display Values', () => {
        it('should preserve all stats for display', () => {
            const player = createPlayer('p1', 'Complete', {
                totalMatches: 25,
                matchesWon: 18,
                matchesLost: 7,
                setsWon: 18,
                setsLost: 7,
                gamesWon: 120,
                gamesLost: 85,
                tournamentsPlayed: 5,
                tournamentsWon: 2,
                winPercentage: 72,
            });
            const sorted = sortLeaderboard([player]);
            expect(sorted[0].stats).not.toBeNull();
            expect(sorted[0].stats?.totalMatches).toBe(25);
            expect(sorted[0].stats?.matchesWon).toBe(18);
            expect(sorted[0].stats?.matchesLost).toBe(7);
            expect(sorted[0].stats?.setsWon).toBe(18);
            expect(sorted[0].stats?.setsLost).toBe(7);
            expect(sorted[0].stats?.gamesWon).toBe(120);
            expect(sorted[0].stats?.gamesLost).toBe(85);
            expect(sorted[0].stats?.tournamentsPlayed).toBe(5);
            expect(sorted[0].stats?.tournamentsWon).toBe(2);
            expect(sorted[0].stats?.winPercentage).toBe(72);
        });
    });
});
//# sourceMappingURL=Leaderboard.test.js.map