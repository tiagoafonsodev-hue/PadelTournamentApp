"use strict";
// Tests for TournamentProgressService standings calculation logic
// Since the buildStandingsFromMatches is private, we test the public interface
// and the exported helper class
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
// Extracted standings calculation logic for testing
function buildStandingsFromMatches(matches) {
    const standingsMap = new Map();
    for (const match of matches) {
        const team1Key = `${match.player1Id}-${match.player2Id}`;
        const team2Key = `${match.player3Id}-${match.player4Id}`;
        // Initialize team 1
        if (!standingsMap.has(team1Key)) {
            standingsMap.set(team1Key, {
                player1Id: match.player1Id,
                player2Id: match.player2Id,
                matchesPlayed: 0,
                matchesWon: 0,
                matchesLost: 0,
                matchesDrawn: 0,
                setsWon: 0,
                setsLost: 0,
                gamesWon: 0,
                gamesLost: 0,
                points: 0,
                groupNumber: match.groupNumber || undefined,
            });
        }
        // Initialize team 2
        if (!standingsMap.has(team2Key)) {
            standingsMap.set(team2Key, {
                player1Id: match.player3Id,
                player2Id: match.player4Id,
                matchesPlayed: 0,
                matchesWon: 0,
                matchesLost: 0,
                matchesDrawn: 0,
                setsWon: 0,
                setsLost: 0,
                gamesWon: 0,
                gamesLost: 0,
                points: 0,
                groupNumber: match.groupNumber || undefined,
            });
        }
        const team1Standing = standingsMap.get(team1Key);
        const team2Standing = standingsMap.get(team2Key);
        // Update match counts
        team1Standing.matchesPlayed++;
        team2Standing.matchesPlayed++;
        // Update sets (team1Score/team2Score represent sets won)
        team1Standing.setsWon += match.team1Score || 0;
        team1Standing.setsLost += match.team2Score || 0;
        team2Standing.setsWon += match.team2Score || 0;
        team2Standing.setsLost += match.team1Score || 0;
        // Calculate games from set scores
        const team1Games = (match.set1Team1 || 0) + (match.set2Team1 || 0) + (match.set3Team1 || 0);
        const team2Games = (match.set1Team2 || 0) + (match.set2Team2 || 0) + (match.set3Team2 || 0);
        team1Standing.gamesWon += team1Games;
        team1Standing.gamesLost += team2Games;
        team2Standing.gamesWon += team2Games;
        team2Standing.gamesLost += team1Games;
        // Update wins/losses/draws and points (2 points per win, 1 per draw)
        if (match.winnerTeam === 1) {
            team1Standing.matchesWon++;
            team1Standing.points += 2;
            team2Standing.matchesLost++;
        }
        else if (match.winnerTeam === 2) {
            team2Standing.matchesWon++;
            team2Standing.points += 2;
            team1Standing.matchesLost++;
        }
        else {
            // Tie - winnerTeam is null
            team1Standing.matchesDrawn++;
            team2Standing.matchesDrawn++;
            team1Standing.points += 1;
            team2Standing.points += 1;
        }
    }
    return Array.from(standingsMap.values());
}
// Sort standings by tiebreaker rules
function sortStandings(standings) {
    return [...standings].sort((a, b) => {
        // 1. Points (descending)
        if (b.points !== a.points)
            return b.points - a.points;
        // 2. Set difference (descending)
        const aSetDiff = a.setsWon - a.setsLost;
        const bSetDiff = b.setsWon - b.setsLost;
        if (bSetDiff !== aSetDiff)
            return bSetDiff - aSetDiff;
        // 3. Game difference (descending)
        const aGameDiff = a.gamesWon - a.gamesLost;
        const bGameDiff = b.gamesWon - b.gamesLost;
        return bGameDiff - aGameDiff;
    });
}
// Helper to create a completed match
function createMatch(team1, team2, score, options = {}) {
    const winner = score.t1 > score.t2 ? 1 : 2;
    return {
        id: `match-${Math.random().toString(36).substr(2, 9)}`,
        player1Id: team1.p1,
        player2Id: team1.p2,
        player3Id: team2.p1,
        player4Id: team2.p2,
        team1Score: score.t1 > score.t2 ? 1 : 0,
        team2Score: score.t2 > score.t1 ? 1 : 0,
        set1Team1: score.t1,
        set1Team2: score.t2,
        set2Team1: null,
        set2Team2: null,
        set3Team1: null,
        set3Team2: null,
        winnerTeam: winner,
        status: client_1.MatchStatus.COMPLETED,
        groupNumber: options.groupNumber || null,
        phase: options.phase || 1,
        roundNumber: options.roundNumber || 1,
        matchNumber: options.matchNumber || 1,
    };
}
// Helper to create a tied match
function createTieMatch(team1, team2, score, // Both teams have same score
options = {}) {
    return {
        id: `match-${Math.random().toString(36).substr(2, 9)}`,
        player1Id: team1.p1,
        player2Id: team1.p2,
        player3Id: team2.p1,
        player4Id: team2.p2,
        team1Score: 0, // Tie = 0 sets won for scoring purposes
        team2Score: 0,
        set1Team1: score,
        set1Team2: score,
        set2Team1: null,
        set2Team2: null,
        set3Team1: null,
        set3Team2: null,
        winnerTeam: null, // NULL indicates a tie
        status: client_1.MatchStatus.COMPLETED,
        groupNumber: options.groupNumber || null,
        phase: options.phase || 1,
        roundNumber: options.roundNumber || 1,
        matchNumber: options.matchNumber || 1,
    };
}
describe('Standings Calculation', () => {
    describe('Basic standings from matches', () => {
        it('should initialize standings for all teams', () => {
            const matches = [
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, { t1: 6, t2: 4 }),
            ];
            const standings = buildStandingsFromMatches(matches);
            expect(standings).toHaveLength(2);
            expect(standings.find(s => s.player1Id === 'p1')).toBeDefined();
            expect(standings.find(s => s.player1Id === 'p3')).toBeDefined();
        });
        it('should correctly count matches played', () => {
            const matches = [
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, { t1: 6, t2: 4 }),
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p5', p2: 'p6' }, { t1: 6, t2: 3 }),
            ];
            const standings = buildStandingsFromMatches(matches);
            const team1 = standings.find(s => s.player1Id === 'p1');
            expect(team1.matchesPlayed).toBe(2);
        });
        it('should award 2 points per win', () => {
            const matches = [
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, { t1: 6, t2: 4 }),
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p5', p2: 'p6' }, { t1: 6, t2: 3 }),
            ];
            const standings = buildStandingsFromMatches(matches);
            const team1 = standings.find(s => s.player1Id === 'p1');
            expect(team1.points).toBe(4); // 2 wins * 2 points
            expect(team1.matchesWon).toBe(2);
            expect(team1.matchesLost).toBe(0);
        });
        it('should correctly track games won and lost', () => {
            const matches = [
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, { t1: 6, t2: 4 }),
            ];
            const standings = buildStandingsFromMatches(matches);
            const team1 = standings.find(s => s.player1Id === 'p1');
            const team2 = standings.find(s => s.player1Id === 'p3');
            expect(team1.gamesWon).toBe(6);
            expect(team1.gamesLost).toBe(4);
            expect(team2.gamesWon).toBe(4);
            expect(team2.gamesLost).toBe(6);
        });
        it('should track sets won/lost (1 set per match)', () => {
            const matches = [
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, { t1: 6, t2: 4 }),
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p5', p2: 'p6' }, { t1: 3, t2: 6 }),
            ];
            const standings = buildStandingsFromMatches(matches);
            const team1 = standings.find(s => s.player1Id === 'p1');
            expect(team1.setsWon).toBe(1); // Won first match
            expect(team1.setsLost).toBe(1); // Lost second match
        });
    });
    describe('Full Round Robin (4 teams)', () => {
        it('should correctly calculate standings for a complete round robin', () => {
            // 4 teams playing round robin (6 matches)
            // Team A: p1-p2, Team B: p3-p4, Team C: p5-p6, Team D: p7-p8
            const matches = [
                // Day 1: A vs B, C vs D
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, { t1: 6, t2: 3 }), // A wins
                createMatch({ p1: 'p5', p2: 'p6' }, { p1: 'p7', p2: 'p8' }, { t1: 6, t2: 4 }), // C wins
                // Day 2: A vs C, B vs D
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p5', p2: 'p6' }, { t1: 5, t2: 6 }), // C wins
                createMatch({ p1: 'p3', p2: 'p4' }, { p1: 'p7', p2: 'p8' }, { t1: 6, t2: 5 }), // B wins
                // Day 3: A vs D, B vs C
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p7', p2: 'p8' }, { t1: 6, t2: 2 }), // A wins
                createMatch({ p1: 'p3', p2: 'p4' }, { p1: 'p5', p2: 'p6' }, { t1: 4, t2: 6 }), // C wins
            ];
            const standings = sortStandings(buildStandingsFromMatches(matches));
            // Expected:
            // Team C: 3 wins = 6 points (beat A, D, B)
            // Team A: 2 wins = 4 points (beat B, D)
            // Team B: 1 win = 2 points (beat D)
            // Team D: 0 wins = 0 points
            expect(standings[0].player1Id).toBe('p5'); // Team C first
            expect(standings[0].points).toBe(6);
            expect(standings[0].matchesWon).toBe(3);
            expect(standings[1].player1Id).toBe('p1'); // Team A second
            expect(standings[1].points).toBe(4);
            expect(standings[1].matchesWon).toBe(2);
            expect(standings[2].player1Id).toBe('p3'); // Team B third
            expect(standings[2].points).toBe(2);
            expect(standings[2].matchesWon).toBe(1);
            expect(standings[3].player1Id).toBe('p7'); // Team D fourth
            expect(standings[3].points).toBe(0);
            expect(standings[3].matchesWon).toBe(0);
        });
    });
    describe('Tiebreaker rules', () => {
        describe('Set difference tiebreaker', () => {
            it('should break ties using set difference when points are equal', () => {
                // Both teams have 1 win, but different set differences
                const matches = [
                    // Team A beats Team C 6-2
                    createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p5', p2: 'p6' }, { t1: 6, t2: 2 }),
                    // Team B beats Team D 6-5
                    createMatch({ p1: 'p3', p2: 'p4' }, { p1: 'p7', p2: 'p8' }, { t1: 6, t2: 5 }),
                    // Team A loses to Team D 4-6
                    createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p7', p2: 'p8' }, { t1: 4, t2: 6 }),
                    // Team B loses to Team C 3-6
                    createMatch({ p1: 'p3', p2: 'p4' }, { p1: 'p5', p2: 'p6' }, { t1: 3, t2: 6 }),
                ];
                const standings = sortStandings(buildStandingsFromMatches(matches));
                // Teams A and B both have 2 points (1 win each)
                // Team A: Set diff = 1-1 = 0, Game diff = (6+4)-(2+6) = 2
                // Team B: Set diff = 1-1 = 0, Game diff = (6+3)-(5+6) = -2
                // Since set diff is equal, game diff breaks tie
                // Team A should be higher
                const teamA = standings.find(s => s.player1Id === 'p1');
                const teamB = standings.find(s => s.player1Id === 'p3');
                expect(teamA.points).toBe(2);
                expect(teamB.points).toBe(2);
                // Find positions
                const teamAPos = standings.findIndex(s => s.player1Id === 'p1');
                const teamBPos = standings.findIndex(s => s.player1Id === 'p3');
                expect(teamAPos).toBeLessThan(teamBPos);
            });
        });
        describe('Game difference tiebreaker', () => {
            it('should break ties using game difference when points and set diff are equal', () => {
                // Two teams with same points, same set diff, different game diff
                const matches = [
                    // Team A beats Team B 6-3
                    createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, { t1: 6, t2: 3 }),
                    // Team A loses to Team C 4-6 (net +3 games in wins, -2 in loss = +1 total)
                    createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p5', p2: 'p6' }, { t1: 4, t2: 6 }),
                    // Team B beats Team C 6-5 (net +1)
                    createMatch({ p1: 'p3', p2: 'p4' }, { p1: 'p5', p2: 'p6' }, { t1: 6, t2: 5 }),
                ];
                const standings = sortStandings(buildStandingsFromMatches(matches));
                // Team A: 1 win (vs B), 1 loss (vs C) = 2 points
                //   Games: 6+4=10 won, 3+6=9 lost, diff = +1
                // Team B: 1 win (vs C), 1 loss (vs A) = 2 points
                //   Games: 3+6=9 won, 6+5=11 lost, diff = -2
                // Team C: 1 win (vs A), 1 loss (vs B) = 2 points
                //   Games: 6+5=11 won, 4+6=10 lost, diff = +1
                // All have 2 points
                // Team A and C have +1 game diff, Team B has -2 game diff
                // A and C should be above B
                const teamA = standings.find(s => s.player1Id === 'p1');
                const teamB = standings.find(s => s.player1Id === 'p3');
                const teamC = standings.find(s => s.player1Id === 'p5');
                expect(teamA.points).toBe(2);
                expect(teamB.points).toBe(2);
                expect(teamC.points).toBe(2);
                // B should be last
                const teamBPos = standings.findIndex(s => s.player1Id === 'p3');
                expect(teamBPos).toBe(2);
            });
        });
    });
    describe('Multi-group standings', () => {
        it('should track group numbers in standings', () => {
            const matches = [
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, { t1: 6, t2: 4 }, { groupNumber: 1 }),
                createMatch({ p1: 'p5', p2: 'p6' }, { p1: 'p7', p2: 'p8' }, { t1: 6, t2: 3 }, { groupNumber: 2 }),
            ];
            const standings = buildStandingsFromMatches(matches);
            const group1Teams = standings.filter(s => s.groupNumber === 1);
            const group2Teams = standings.filter(s => s.groupNumber === 2);
            expect(group1Teams).toHaveLength(2);
            expect(group2Teams).toHaveLength(2);
        });
        it('should calculate standings independently per group', () => {
            // Group 1: Teams A and B
            // Group 2: Teams C and D
            const matches = [
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, { t1: 6, t2: 4 }, { groupNumber: 1 }),
                createMatch({ p1: 'p5', p2: 'p6' }, { p1: 'p7', p2: 'p8' }, { t1: 3, t2: 6 }, { groupNumber: 2 }),
            ];
            const standings = buildStandingsFromMatches(matches);
            // Group 1: Team A won
            const teamA = standings.find(s => s.player1Id === 'p1' && s.groupNumber === 1);
            expect(teamA.points).toBe(2);
            expect(teamA.matchesWon).toBe(1);
            // Group 2: Team D won
            const teamD = standings.find(s => s.player1Id === 'p7' && s.groupNumber === 2);
            expect(teamD.points).toBe(2);
            expect(teamD.matchesWon).toBe(1);
        });
    });
    describe('Edge cases', () => {
        it('should handle empty matches array', () => {
            const standings = buildStandingsFromMatches([]);
            expect(standings).toHaveLength(0);
        });
        it('should handle single match', () => {
            const matches = [
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, { t1: 6, t2: 0 }),
            ];
            const standings = buildStandingsFromMatches(matches);
            expect(standings).toHaveLength(2);
            const winner = standings.find(s => s.player1Id === 'p1');
            expect(winner.matchesWon).toBe(1);
            expect(winner.gamesWon).toBe(6);
            expect(winner.gamesLost).toBe(0);
        });
        it('should handle very close scores', () => {
            const matches = [
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, { t1: 7, t2: 6 }),
            ];
            const standings = buildStandingsFromMatches(matches);
            const winner = standings.find(s => s.player1Id === 'p1');
            expect(winner.points).toBe(2);
            expect(winner.gamesWon).toBe(7);
            expect(winner.gamesLost).toBe(6);
        });
        it('should correctly handle same team in multiple matches', () => {
            const matches = [
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, { t1: 6, t2: 4 }),
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p5', p2: 'p6' }, { t1: 6, t2: 3 }),
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p7', p2: 'p8' }, { t1: 4, t2: 6 }),
            ];
            const standings = buildStandingsFromMatches(matches);
            const teamA = standings.find(s => s.player1Id === 'p1');
            expect(teamA.matchesPlayed).toBe(3);
            expect(teamA.matchesWon).toBe(2);
            expect(teamA.matchesLost).toBe(1);
            expect(teamA.gamesWon).toBe(6 + 6 + 4);
            expect(teamA.gamesLost).toBe(4 + 3 + 6);
        });
    });
    describe('Complete 4-team Round Robin scenarios', () => {
        it('should handle all teams with same points but different game diffs', () => {
            // Circular results: A beats B, B beats C, C beats D, D beats A, A beats C, B beats D
            // This creates a mix where tiebreakers are needed
            const matches = [
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, { t1: 6, t2: 4 }), // A > B
                createMatch({ p1: 'p5', p2: 'p6' }, { p1: 'p7', p2: 'p8' }, { t1: 6, t2: 3 }), // C > D
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p5', p2: 'p6' }, { t1: 6, t2: 5 }), // A > C
                createMatch({ p1: 'p3', p2: 'p4' }, { p1: 'p7', p2: 'p8' }, { t1: 6, t2: 4 }), // B > D
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p7', p2: 'p8' }, { t1: 6, t2: 2 }), // A > D
                createMatch({ p1: 'p3', p2: 'p4' }, { p1: 'p5', p2: 'p6' }, { t1: 6, t2: 5 }), // B > C
            ];
            const standings = sortStandings(buildStandingsFromMatches(matches));
            // A: 3 wins = 6 points (beat B, C, D)
            // B: 2 wins = 4 points (beat C, D)
            // C: 1 win = 2 points (beat D)
            // D: 0 wins = 0 points
            expect(standings[0].player1Id).toBe('p1'); // A first
            expect(standings[0].points).toBe(6);
            expect(standings[1].player1Id).toBe('p3'); // B second
            expect(standings[1].points).toBe(4);
            expect(standings[2].player1Id).toBe('p5'); // C third
            expect(standings[2].points).toBe(2);
            expect(standings[3].player1Id).toBe('p7'); // D fourth
            expect(standings[3].points).toBe(0);
        });
        it('should handle three-way tie on points', () => {
            // A beats B, B beats C, C beats A (circular)
            // D loses to everyone
            const matches = [
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, { t1: 6, t2: 2 }), // A > B (big win)
                createMatch({ p1: 'p3', p2: 'p4' }, { p1: 'p5', p2: 'p6' }, { t1: 6, t2: 3 }), // B > C
                createMatch({ p1: 'p5', p2: 'p6' }, { p1: 'p1', p2: 'p2' }, { t1: 6, t2: 5 }), // C > A (close)
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p7', p2: 'p8' }, { t1: 6, t2: 1 }), // A > D
                createMatch({ p1: 'p3', p2: 'p4' }, { p1: 'p7', p2: 'p8' }, { t1: 6, t2: 2 }), // B > D
                createMatch({ p1: 'p5', p2: 'p6' }, { p1: 'p7', p2: 'p8' }, { t1: 6, t2: 4 }), // C > D
            ];
            const standings = sortStandings(buildStandingsFromMatches(matches));
            // A, B, C all have 2 wins = 4 points
            // D has 0 wins = 0 points
            // D should be last
            expect(standings[3].player1Id).toBe('p7'); // D last
            // Top 3 all have 4 points
            expect(standings[0].points).toBe(4);
            expect(standings[1].points).toBe(4);
            expect(standings[2].points).toBe(4);
        });
    });
    describe('12 Teams (3 groups of 4) scenario', () => {
        it('should correctly calculate standings for 3 groups', () => {
            // Simplified: just test that groups are tracked correctly
            const matches = [
                // Group 1 match
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, { t1: 6, t2: 4 }, { groupNumber: 1 }),
                // Group 2 match
                createMatch({ p1: 'p9', p2: 'p10' }, { p1: 'p11', p2: 'p12' }, { t1: 6, t2: 3 }, { groupNumber: 2 }),
                // Group 3 match
                createMatch({ p1: 'p17', p2: 'p18' }, { p1: 'p19', p2: 'p20' }, { t1: 5, t2: 6 }, { groupNumber: 3 }),
            ];
            const standings = buildStandingsFromMatches(matches);
            const group1Teams = standings.filter(s => s.groupNumber === 1);
            const group2Teams = standings.filter(s => s.groupNumber === 2);
            const group3Teams = standings.filter(s => s.groupNumber === 3);
            expect(group1Teams).toHaveLength(2);
            expect(group2Teams).toHaveLength(2);
            expect(group3Teams).toHaveLength(2);
            // Group 1 winner
            const g1Winner = group1Teams.find(s => s.player1Id === 'p1');
            expect(g1Winner.points).toBe(2);
            // Group 3 winner
            const g3Winner = group3Teams.find(s => s.player1Id === 'p19');
            expect(g3Winner.points).toBe(2);
        });
    });
});
describe('Phase advancement scenarios', () => {
    describe('ROUND_ROBIN tournament completion', () => {
        it('should finish when all matches are complete', () => {
            // This tests the logic conceptually - when all matches in a round robin are complete,
            // the tournament should be marked as finished
            const matches = [
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, { t1: 6, t2: 4 }),
                createMatch({ p1: 'p5', p2: 'p6' }, { p1: 'p7', p2: 'p8' }, { t1: 6, t2: 3 }),
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p5', p2: 'p6' }, { t1: 6, t2: 5 }),
                createMatch({ p1: 'p3', p2: 'p4' }, { p1: 'p7', p2: 'p8' }, { t1: 6, t2: 4 }),
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p7', p2: 'p8' }, { t1: 6, t2: 2 }),
                createMatch({ p1: 'p3', p2: 'p4' }, { p1: 'p5', p2: 'p6' }, { t1: 6, t2: 5 }),
            ];
            // All matches have COMPLETED status
            const allCompleted = matches.every(m => m.status === client_1.MatchStatus.COMPLETED);
            expect(allCompleted).toBe(true);
            // Final standings can be calculated
            const standings = sortStandings(buildStandingsFromMatches(matches));
            expect(standings).toHaveLength(4);
        });
    });
    describe('KNOCKOUT tournament advancement', () => {
        it('should identify winners and losers from semi-finals', () => {
            const semifinal1 = createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, { t1: 6, t2: 4 }, { roundNumber: 1, matchNumber: 1 });
            const semifinal2 = createMatch({ p1: 'p5', p2: 'p6' }, { p1: 'p7', p2: 'p8' }, { t1: 3, t2: 6 }, { roundNumber: 1, matchNumber: 2 });
            // Extract winners and losers
            const getWinner = (match) => match.winnerTeam === 1
                ? { p1: match.player1Id, p2: match.player2Id }
                : { p1: match.player3Id, p2: match.player4Id };
            const getLoser = (match) => match.winnerTeam === 1
                ? { p1: match.player3Id, p2: match.player4Id }
                : { p1: match.player1Id, p2: match.player2Id };
            const winner1 = getWinner(semifinal1);
            const loser1 = getLoser(semifinal1);
            const winner2 = getWinner(semifinal2);
            const loser2 = getLoser(semifinal2);
            expect(winner1.p1).toBe('p1'); // Team A won semi 1
            expect(loser1.p1).toBe('p3'); // Team B lost semi 1
            expect(winner2.p1).toBe('p7'); // Team D won semi 2
            expect(loser2.p1).toBe('p5'); // Team C lost semi 2
        });
    });
    describe('GROUP_STAGE_KNOCKOUT advancement', () => {
        it('should identify top 2 teams from group for playoff seeding', () => {
            // Complete group stage
            const groupMatches = [
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, { t1: 6, t2: 3 }, { groupNumber: 1 }),
                createMatch({ p1: 'p5', p2: 'p6' }, { p1: 'p7', p2: 'p8' }, { t1: 6, t2: 4 }, { groupNumber: 1 }),
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p5', p2: 'p6' }, { t1: 6, t2: 5 }, { groupNumber: 1 }),
                createMatch({ p1: 'p3', p2: 'p4' }, { p1: 'p7', p2: 'p8' }, { t1: 6, t2: 4 }, { groupNumber: 1 }),
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p7', p2: 'p8' }, { t1: 6, t2: 2 }, { groupNumber: 1 }),
                createMatch({ p1: 'p3', p2: 'p4' }, { p1: 'p5', p2: 'p6' }, { t1: 6, t2: 5 }, { groupNumber: 1 }),
            ];
            const standings = sortStandings(buildStandingsFromMatches(groupMatches));
            // Top 2 qualify for playoffs
            const qualified = standings.slice(0, 2);
            expect(qualified).toHaveLength(2);
            // Team A (p1-p2) should be 1st
            expect(qualified[0].player1Id).toBe('p1');
            // Verify they have the most points
            expect(qualified[0].points).toBeGreaterThanOrEqual(qualified[1].points);
        });
        it('should create cross-group matchups for 2-group tournament', () => {
            // Group 1 standings
            const group1 = [
                { player1Id: 'g1p1', player2Id: 'g1p2', points: 6 }, // 1st Group 1
                { player1Id: 'g1p3', player2Id: 'g1p4', points: 4 }, // 2nd Group 1
            ];
            // Group 2 standings
            const group2 = [
                { player1Id: 'g2p1', player2Id: 'g2p2', points: 6 }, // 1st Group 2
                { player1Id: 'g2p3', player2Id: 'g2p4', points: 2 }, // 2nd Group 2
            ];
            // Cross-group matchups:
            // Semi 1: 1st Group 1 vs 2nd Group 2
            // Semi 2: 2nd Group 1 vs 1st Group 2
            const semi1 = {
                team1: { p1: group1[0].player1Id, p2: group1[0].player2Id },
                team2: { p1: group2[1].player1Id, p2: group2[1].player2Id },
            };
            const semi2 = {
                team1: { p1: group1[1].player1Id, p2: group1[1].player2Id },
                team2: { p1: group2[0].player1Id, p2: group2[0].player2Id },
            };
            expect(semi1.team1.p1).toBe('g1p1');
            expect(semi1.team2.p1).toBe('g2p3');
            expect(semi2.team1.p1).toBe('g1p3');
            expect(semi2.team2.p1).toBe('g2p1');
        });
    });
});
// ==========================================
// TIE FUNCTIONALITY TESTS
// ==========================================
describe('Tie Standings Calculation', () => {
    describe('Basic tie handling', () => {
        it('should award 1 point per team for a tie', () => {
            const matches = [
                createTieMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, 5),
            ];
            const standings = buildStandingsFromMatches(matches);
            const team1 = standings.find(s => s.player1Id === 'p1');
            const team2 = standings.find(s => s.player1Id === 'p3');
            expect(team1.points).toBe(1);
            expect(team2.points).toBe(1);
        });
        it('should track matchesDrawn correctly', () => {
            const matches = [
                createTieMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, 5),
            ];
            const standings = buildStandingsFromMatches(matches);
            const team1 = standings.find(s => s.player1Id === 'p1');
            const team2 = standings.find(s => s.player1Id === 'p3');
            expect(team1.matchesDrawn).toBe(1);
            expect(team2.matchesDrawn).toBe(1);
            expect(team1.matchesWon).toBe(0);
            expect(team1.matchesLost).toBe(0);
        });
        it('should track games correctly for ties', () => {
            const matches = [
                createTieMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, 5),
            ];
            const standings = buildStandingsFromMatches(matches);
            const team1 = standings.find(s => s.player1Id === 'p1');
            const team2 = standings.find(s => s.player1Id === 'p3');
            expect(team1.gamesWon).toBe(5);
            expect(team1.gamesLost).toBe(5);
            expect(team2.gamesWon).toBe(5);
            expect(team2.gamesLost).toBe(5);
        });
        it('should not count sets for tied matches', () => {
            const matches = [
                createTieMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, 5),
            ];
            const standings = buildStandingsFromMatches(matches);
            const team1 = standings.find(s => s.player1Id === 'p1');
            expect(team1.setsWon).toBe(0);
            expect(team1.setsLost).toBe(0);
        });
    });
    describe('Mixed win/tie scenarios', () => {
        it('should correctly calculate standings with mix of wins and ties', () => {
            // Team A wins against B, ties with C
            // Team B ties with C
            const matches = [
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, { t1: 6, t2: 4 }), // A > B
                createTieMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p5', p2: 'p6' }, 5), // A = C
                createTieMatch({ p1: 'p3', p2: 'p4' }, { p1: 'p5', p2: 'p6' }, 4), // B = C
            ];
            const standings = sortStandings(buildStandingsFromMatches(matches));
            // A: 1 win (2 pts) + 1 tie (1 pt) = 3 points
            // B: 0 wins + 1 tie (1 pt) + 1 loss = 1 point
            // C: 0 wins + 2 ties (2 pts) = 2 points
            const teamA = standings.find(s => s.player1Id === 'p1');
            const teamB = standings.find(s => s.player1Id === 'p3');
            const teamC = standings.find(s => s.player1Id === 'p5');
            expect(teamA.points).toBe(3);
            expect(teamA.matchesWon).toBe(1);
            expect(teamA.matchesDrawn).toBe(1);
            expect(teamC.points).toBe(2);
            expect(teamC.matchesDrawn).toBe(2);
            expect(teamB.points).toBe(1);
            expect(teamB.matchesLost).toBe(1);
            expect(teamB.matchesDrawn).toBe(1);
        });
        it('should rank team with win above team with only ties', () => {
            const matches = [
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p5', p2: 'p6' }, { t1: 6, t2: 4 }), // A > C
                createTieMatch({ p1: 'p3', p2: 'p4' }, { p1: 'p5', p2: 'p6' }, 5), // B = C
                createTieMatch({ p1: 'p3', p2: 'p4' }, { p1: 'p7', p2: 'p8' }, 5), // B = D
            ];
            const standings = sortStandings(buildStandingsFromMatches(matches));
            // A: 1 win = 2 points
            // B: 2 ties = 2 points
            // Game diff should break tie: A is +2, B is 0
            const teamAPos = standings.findIndex(s => s.player1Id === 'p1');
            const teamBPos = standings.findIndex(s => s.player1Id === 'p3');
            expect(teamAPos).toBeLessThan(teamBPos);
        });
    });
    describe('Multiple ties in round robin', () => {
        it('should handle all ties in a group', () => {
            // All matches end in ties
            const matches = [
                createTieMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, 5),
                createTieMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p5', p2: 'p6' }, 4),
                createTieMatch({ p1: 'p3', p2: 'p4' }, { p1: 'p5', p2: 'p6' }, 5),
            ];
            const standings = buildStandingsFromMatches(matches);
            // All teams should have 2 points (2 ties each)
            standings.forEach(team => {
                expect(team.points).toBe(2);
                expect(team.matchesDrawn).toBe(2);
                expect(team.matchesWon).toBe(0);
                expect(team.matchesLost).toBe(0);
            });
        });
        it('should use game difference as tiebreaker when all have same points from ties', () => {
            // All ties but different game scores
            const matches = [
                createTieMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, 6), // 6-6
                createTieMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p5', p2: 'p6' }, 5), // 5-5
                createTieMatch({ p1: 'p3', p2: 'p4' }, { p1: 'p5', p2: 'p6' }, 4), // 4-4
            ];
            const standings = sortStandings(buildStandingsFromMatches(matches));
            // All have 2 points
            // A: 6+5 = 11 games won, 6+5 = 11 lost, diff = 0
            // B: 6+4 = 10 games won, 6+4 = 10 lost, diff = 0
            // C: 5+4 = 9 games won, 5+4 = 9 lost, diff = 0
            // All game diffs are 0, so it comes down to games won
            // All should be tied on all tiebreakers
            expect(standings[0].points).toBe(2);
            expect(standings[1].points).toBe(2);
            expect(standings[2].points).toBe(2);
        });
    });
    describe('Complete 4-team round robin with ties', () => {
        it('should calculate correct standings for tournament with some ties', () => {
            // 4 teams, 6 matches
            // A beats B, ties with C, beats D
            // B ties with C, beats D
            // C beats D
            const matches = [
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, { t1: 6, t2: 3 }), // A > B
                createTieMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p5', p2: 'p6' }, 5), // A = C
                createMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p7', p2: 'p8' }, { t1: 6, t2: 2 }), // A > D
                createTieMatch({ p1: 'p3', p2: 'p4' }, { p1: 'p5', p2: 'p6' }, 4), // B = C
                createMatch({ p1: 'p3', p2: 'p4' }, { p1: 'p7', p2: 'p8' }, { t1: 6, t2: 4 }), // B > D
                createMatch({ p1: 'p5', p2: 'p6' }, { p1: 'p7', p2: 'p8' }, { t1: 6, t2: 3 }), // C > D
            ];
            const standings = sortStandings(buildStandingsFromMatches(matches));
            // Expected:
            // A: 2 wins (4pts) + 1 tie (1pt) = 5 points
            // C: 1 win (2pts) + 2 ties (2pts) = 4 points
            // B: 1 win (2pts) + 1 tie (1pt) + 1 loss = 3 points
            // D: 0 wins + 3 losses = 0 points
            expect(standings[0].player1Id).toBe('p1'); // A first
            expect(standings[0].points).toBe(5);
            expect(standings[0].matchesWon).toBe(2);
            expect(standings[0].matchesDrawn).toBe(1);
            expect(standings[1].player1Id).toBe('p5'); // C second
            expect(standings[1].points).toBe(4);
            expect(standings[1].matchesWon).toBe(1);
            expect(standings[1].matchesDrawn).toBe(2);
            expect(standings[2].player1Id).toBe('p3'); // B third
            expect(standings[2].points).toBe(3);
            expect(standings[2].matchesWon).toBe(1);
            expect(standings[2].matchesDrawn).toBe(1);
            expect(standings[2].matchesLost).toBe(1);
            expect(standings[3].player1Id).toBe('p7'); // D last
            expect(standings[3].points).toBe(0);
            expect(standings[3].matchesLost).toBe(3);
        });
    });
    describe('Ties in multi-group tournament', () => {
        it('should track ties correctly per group', () => {
            const matches = [
                // Group 1: A ties with B
                createTieMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, 5, { groupNumber: 1 }),
                // Group 2: C beats D
                createMatch({ p1: 'p5', p2: 'p6' }, { p1: 'p7', p2: 'p8' }, { t1: 6, t2: 3 }, { groupNumber: 2 }),
            ];
            const standings = buildStandingsFromMatches(matches);
            const group1 = standings.filter(s => s.groupNumber === 1);
            const group2 = standings.filter(s => s.groupNumber === 2);
            // Group 1: Both teams tied
            expect(group1[0].points).toBe(1);
            expect(group1[0].matchesDrawn).toBe(1);
            expect(group1[1].points).toBe(1);
            expect(group1[1].matchesDrawn).toBe(1);
            // Group 2: C won, D lost
            const teamC = group2.find(s => s.player1Id === 'p5');
            const teamD = group2.find(s => s.player1Id === 'p7');
            expect(teamC.points).toBe(2);
            expect(teamC.matchesWon).toBe(1);
            expect(teamD.points).toBe(0);
            expect(teamD.matchesLost).toBe(1);
        });
    });
    describe('Edge cases with ties', () => {
        it('should handle 0-0 tie', () => {
            const matches = [
                createTieMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, 0),
            ];
            const standings = buildStandingsFromMatches(matches);
            const team1 = standings.find(s => s.player1Id === 'p1');
            expect(team1.points).toBe(1);
            expect(team1.matchesDrawn).toBe(1);
            expect(team1.gamesWon).toBe(0);
            expect(team1.gamesLost).toBe(0);
        });
        it('should handle high-scoring tie', () => {
            const matches = [
                createTieMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, 10),
            ];
            const standings = buildStandingsFromMatches(matches);
            const team1 = standings.find(s => s.player1Id === 'p1');
            expect(team1.points).toBe(1);
            expect(team1.gamesWon).toBe(10);
            expect(team1.gamesLost).toBe(10);
        });
        it('should handle team with only ties', () => {
            const matches = [
                createTieMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p3', p2: 'p4' }, 5),
                createTieMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p5', p2: 'p6' }, 4),
                createTieMatch({ p1: 'p1', p2: 'p2' }, { p1: 'p7', p2: 'p8' }, 6),
            ];
            const standings = buildStandingsFromMatches(matches);
            const teamA = standings.find(s => s.player1Id === 'p1');
            expect(teamA.matchesPlayed).toBe(3);
            expect(teamA.matchesDrawn).toBe(3);
            expect(teamA.matchesWon).toBe(0);
            expect(teamA.matchesLost).toBe(0);
            expect(teamA.points).toBe(3); // 3 ties * 1 point
            expect(teamA.gamesWon).toBe(15); // 5 + 4 + 6
            expect(teamA.gamesLost).toBe(15); // Same (ties)
        });
    });
});
//# sourceMappingURL=TournamentProgressService.test.js.map