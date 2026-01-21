"use strict";
// Tournament Scheduler for Padel Tournaments (variable player counts)
Object.defineProperty(exports, "__esModule", { value: true });
exports.tournamentScheduler = exports.TournamentSchedulerService = void 0;
class TournamentSchedulerService {
    /**
     * Generate Round Robin matches for variable team counts
     * Supports: 3 teams (6 players), 4 teams (8 players), 6 teams (12 players)
     * Also supports multi-group: 8 teams (16 players), 12 teams (24 players)
     */
    generateRoundRobinMatches(tournamentId, teams) {
        const teamCount = teams.length;
        // Single group tournaments
        if (teamCount === 3) {
            // 6 players: 3 teams, single group
            return this.generateRoundRobinSingleGroup(tournamentId, teams, 1);
        }
        else if (teamCount === 4) {
            // 8 players: 4 teams, single group
            return this.generateRoundRobinSingleGroup(tournamentId, teams, 1);
        }
        else if (teamCount === 6) {
            // 12 players: 6 teams, single group
            return this.generateRoundRobinSingleGroup(tournamentId, teams, 1);
        }
        // Multi-group tournaments
        else if (teamCount === 8) {
            // 16 players: 2 groups of 4 teams
            return this.generateRoundRobinMultiGroup(tournamentId, teams, 2, 4);
        }
        else if (teamCount === 12) {
            // 24 players: 3 groups of 4 teams
            return this.generateRoundRobinMultiGroup(tournamentId, teams, 3, 4);
        }
        throw new Error(`Unsupported team count: ${teamCount}`);
    }
    /**
     * Generate Round Robin for a single group (3, 4, or 6 teams)
     */
    generateRoundRobinSingleGroup(tournamentId, teams, groupNumber) {
        const matches = [];
        let matchNumber = 1;
        // For 3 teams (6 players), use Round Robin schedule with 3 matchdays
        if (teams.length === 3) {
            const schedule = [
                // Matchday 1: Team 0 vs Team 1
                { team1: 0, team2: 1, matchDay: 1 },
                // Matchday 2: Team 0 vs Team 2
                { team1: 0, team2: 2, matchDay: 2 },
                // Matchday 3: Team 1 vs Team 2
                { team1: 1, team2: 2, matchDay: 3 },
            ];
            for (const game of schedule) {
                const team1 = teams[game.team1];
                const team2 = teams[game.team2];
                matches.push({
                    tournamentId,
                    phase: 1,
                    roundNumber: 1,
                    matchNumber: matchNumber++,
                    matchDay: game.matchDay,
                    player1Id: team1.player1Id,
                    player2Id: team1.player2Id,
                    player3Id: team2.player1Id,
                    player4Id: team2.player2Id,
                    groupNumber,
                });
            }
        }
        // For 4 teams, use proper Round Robin schedule to avoid teams playing twice on same day
        else if (teams.length === 4) {
            const schedule = [
                // Matchday 1
                { team1: 0, team2: 1, matchDay: 1 },
                { team1: 2, team2: 3, matchDay: 1 },
                // Matchday 2
                { team1: 0, team2: 2, matchDay: 2 },
                { team1: 1, team2: 3, matchDay: 2 },
                // Matchday 3
                { team1: 0, team2: 3, matchDay: 3 },
                { team1: 1, team2: 2, matchDay: 3 },
            ];
            for (const game of schedule) {
                const team1 = teams[game.team1];
                const team2 = teams[game.team2];
                matches.push({
                    tournamentId,
                    phase: 1,
                    roundNumber: 1,
                    matchNumber: matchNumber++,
                    matchDay: game.matchDay,
                    player1Id: team1.player1Id,
                    player2Id: team1.player2Id,
                    player3Id: team2.player1Id,
                    player4Id: team2.player2Id,
                    groupNumber,
                });
            }
        }
        // For 6 teams (12 players), use Round Robin schedule with 5 matchdays
        // Each team plays each other once (15 matches total)
        else if (teams.length === 6) {
            const schedule = [
                // Matchday 1
                { team1: 0, team2: 1, matchDay: 1 },
                { team1: 2, team2: 3, matchDay: 1 },
                { team1: 4, team2: 5, matchDay: 1 },
                // Matchday 2
                { team1: 0, team2: 2, matchDay: 2 },
                { team1: 3, team2: 4, matchDay: 2 },
                { team1: 5, team2: 1, matchDay: 2 },
                // Matchday 3
                { team1: 0, team2: 3, matchDay: 3 },
                { team1: 4, team2: 1, matchDay: 3 },
                { team1: 2, team2: 5, matchDay: 3 },
                // Matchday 4
                { team1: 0, team2: 4, matchDay: 4 },
                { team1: 1, team2: 2, matchDay: 4 },
                { team1: 3, team2: 5, matchDay: 4 },
                // Matchday 5
                { team1: 0, team2: 5, matchDay: 5 },
                { team1: 2, team2: 4, matchDay: 5 },
                { team1: 1, team2: 3, matchDay: 5 },
            ];
            for (const game of schedule) {
                const team1 = teams[game.team1];
                const team2 = teams[game.team2];
                matches.push({
                    tournamentId,
                    phase: 1,
                    roundNumber: 1,
                    matchNumber: matchNumber++,
                    matchDay: game.matchDay,
                    player1Id: team1.player1Id,
                    player2Id: team1.player2Id,
                    player3Id: team2.player1Id,
                    player4Id: team2.player2Id,
                    groupNumber,
                });
            }
        }
        return matches;
    }
    /**
     * Generate Round Robin for multiple groups
     */
    generateRoundRobinMultiGroup(tournamentId, teams, groupCount, teamsPerGroup) {
        const matches = [];
        let matchNumber = 1;
        // Split teams into groups
        for (let groupIndex = 0; groupIndex < groupCount; groupIndex++) {
            const groupNumber = groupIndex + 1;
            const startIndex = groupIndex * teamsPerGroup;
            const groupTeams = teams.slice(startIndex, startIndex + teamsPerGroup);
            // Generate round robin within the group
            const groupMatches = this.generateRoundRobinSingleGroup(tournamentId, groupTeams, groupNumber);
            // Update match numbers to be sequential across all groups
            for (const match of groupMatches) {
                match.matchNumber = matchNumber++;
            }
            matches.push(...groupMatches);
        }
        return matches;
    }
    /**
     * Generate Knockout matches for variable team counts
     * Supports: 4, 6, 8, 12 teams
     */
    generateKnockoutMatches(tournamentId, teams) {
        const teamCount = teams.length;
        if (teamCount === 4) {
            // 8 players: Semi-finals (2 matches)
            return this.generateKnockoutFor4Teams(tournamentId, teams);
        }
        else if (teamCount === 6 || teamCount === 8 || teamCount === 12) {
            // Multi-team knockout: Generate initial round based on team count
            return this.generateKnockoutForMultipleTeams(tournamentId, teams);
        }
        throw new Error(`Unsupported team count for knockout: ${teamCount}`);
    }
    /**
     * Generate knockout for 4 teams (8 players) - semi-finals
     */
    generateKnockoutFor4Teams(tournamentId, teams) {
        const matches = [];
        // Round 1: Semi-finals (Teams 1 vs 2, Teams 3 vs 4)
        matches.push({
            tournamentId,
            phase: 1,
            roundNumber: 1,
            matchNumber: 1,
            player1Id: teams[0].player1Id,
            player2Id: teams[0].player2Id,
            player3Id: teams[1].player1Id,
            player4Id: teams[1].player2Id,
        });
        matches.push({
            tournamentId,
            phase: 1,
            roundNumber: 1,
            matchNumber: 2,
            player1Id: teams[2].player1Id,
            player2Id: teams[2].player2Id,
            player3Id: teams[3].player1Id,
            player4Id: teams[3].player2Id,
        });
        // Round 2 matches (Final and 3rd place) will be generated
        // after Round 1 completes, based on results
        return matches;
    }
    /**
     * Generate knockout for 6, 8, or 12 teams
     * These are more complex tournaments with multiple rounds
     */
    generateKnockoutForMultipleTeams(tournamentId, teams) {
        const matches = [];
        let matchNumber = 1;
        // For now, generate a simple bracket pairing teams sequentially
        // This creates the first round of matches
        for (let i = 0; i < teams.length; i += 2) {
            if (i + 1 < teams.length) {
                matches.push({
                    tournamentId,
                    phase: 1,
                    roundNumber: 1,
                    matchNumber: matchNumber++,
                    player1Id: teams[i].player1Id,
                    player2Id: teams[i].player2Id,
                    player3Id: teams[i + 1].player1Id,
                    player4Id: teams[i + 1].player2Id,
                });
            }
        }
        return matches;
    }
    /**
     * Generate Round 2 knockout matches (Final + 3rd place)
     * Called after Round 1 completes
     */
    generateKnockoutRound2(tournamentId, match1WinnerTeam, match1LoserTeam, match2WinnerTeam, match2LoserTeam) {
        const matches = [];
        // Match 3: Final (winners of semi-finals)
        matches.push({
            tournamentId,
            phase: 1,
            roundNumber: 2,
            matchNumber: 3,
            player1Id: match1WinnerTeam.player1Id,
            player2Id: match1WinnerTeam.player2Id,
            player3Id: match2WinnerTeam.player1Id,
            player4Id: match2WinnerTeam.player2Id,
        });
        // Match 4: 3rd place (losers of semi-finals)
        matches.push({
            tournamentId,
            phase: 1,
            roundNumber: 2,
            matchNumber: 4,
            player1Id: match1LoserTeam.player1Id,
            player2Id: match1LoserTeam.player2Id,
            player3Id: match2LoserTeam.player1Id,
            player4Id: match2LoserTeam.player2Id,
        });
        return matches;
    }
    /**
     * Generate Group Stage matches (Round Robin + Knockout)
     * Phase 1: Round Robin within groups
     * Phase 2: Playoffs based on group standings
     * Supports: 4, 6, 8, 12 teams
     */
    generateGroupStageMatches(tournamentId, teams) {
        // Phase 1: Generate round robin matches (single or multi-group)
        return this.generateRoundRobinMatches(tournamentId, teams);
    }
    /**
     * Generate Phase 2 playoff matches
     * Called after Phase 1 completes
     * 1st vs 2nd (Final), 3rd vs 4th (3rd place match)
     */
    generatePlayoffMatches(tournamentId, team1st, team2nd, team3rd, team4th) {
        const matches = [];
        // Match 1: Final (1st vs 2nd)
        matches.push({
            tournamentId,
            phase: 2,
            roundNumber: 1,
            matchNumber: 1,
            player1Id: team1st.player1Id,
            player2Id: team1st.player2Id,
            player3Id: team2nd.player1Id,
            player4Id: team2nd.player2Id,
        });
        // Match 2: 3rd place (3rd vs 4th)
        matches.push({
            tournamentId,
            phase: 2,
            roundNumber: 1,
            matchNumber: 2,
            player1Id: team3rd.player1Id,
            player2Id: team3rd.player2Id,
            player3Id: team4th.player1Id,
            player4Id: team4th.player2Id,
        });
        return matches;
    }
}
exports.TournamentSchedulerService = TournamentSchedulerService;
exports.tournamentScheduler = new TournamentSchedulerService();
//# sourceMappingURL=TournamentSchedulerService.js.map