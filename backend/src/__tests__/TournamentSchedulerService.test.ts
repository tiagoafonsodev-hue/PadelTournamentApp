import { TournamentSchedulerService } from '../services/TournamentSchedulerService';

describe('TournamentSchedulerService', () => {
  let scheduler: TournamentSchedulerService;

  beforeEach(() => {
    scheduler = new TournamentSchedulerService();
  });

  // Helper to create teams
  const createTeams = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      player1Id: `p${i * 2 + 1}`,
      player2Id: `p${i * 2 + 2}`,
    }));
  };

  describe('Round Robin Match Generation', () => {
    describe('3 Teams (6 players)', () => {
      it('should generate 3 matches for 3 teams', () => {
        const teams = createTeams(3);
        const matches = scheduler.generateRoundRobinMatches('t1', teams);

        expect(matches).toHaveLength(3);
      });

      it('should have all matches in 3 different matchdays', () => {
        const teams = createTeams(3);
        const matches = scheduler.generateRoundRobinMatches('t1', teams);

        const matchDays = new Set(matches.map(m => m.matchDay));
        expect(matchDays.size).toBe(3);
        expect(matchDays).toContain(1);
        expect(matchDays).toContain(2);
        expect(matchDays).toContain(3);
      });

      it('should ensure every team plays every other team once', () => {
        const teams = createTeams(3);
        const matches = scheduler.generateRoundRobinMatches('t1', teams);

        // Create a set of team matchups
        const matchups = new Set<string>();
        for (const match of matches) {
          const team1Key = `${match.player1Id}-${match.player2Id}`;
          const team2Key = `${match.player3Id}-${match.player4Id}`;
          matchups.add([team1Key, team2Key].sort().join('|'));
        }

        // With 3 teams, there should be 3 unique matchups (3 choose 2 = 3)
        expect(matchups.size).toBe(3);
      });

      it('should set phase to 1 and roundNumber to 1', () => {
        const teams = createTeams(3);
        const matches = scheduler.generateRoundRobinMatches('t1', teams);

        for (const match of matches) {
          expect(match.phase).toBe(1);
          expect(match.roundNumber).toBe(1);
        }
      });

      it('should have sequential match numbers', () => {
        const teams = createTeams(3);
        const matches = scheduler.generateRoundRobinMatches('t1', teams);

        const matchNumbers = matches.map(m => m.matchNumber).sort((a, b) => a - b);
        expect(matchNumbers).toEqual([1, 2, 3]);
      });
    });

    describe('4 Teams (8 players)', () => {
      it('should generate 6 matches for 4 teams', () => {
        const teams = createTeams(4);
        const matches = scheduler.generateRoundRobinMatches('t1', teams);

        expect(matches).toHaveLength(6);
      });

      it('should distribute matches across 3 matchdays with 2 matches each', () => {
        const teams = createTeams(4);
        const matches = scheduler.generateRoundRobinMatches('t1', teams);

        const matchesByDay = new Map<number, number>();
        for (const match of matches) {
          const day = match.matchDay!;
          matchesByDay.set(day, (matchesByDay.get(day) || 0) + 1);
        }

        expect(matchesByDay.get(1)).toBe(2);
        expect(matchesByDay.get(2)).toBe(2);
        expect(matchesByDay.get(3)).toBe(2);
      });

      it('should ensure no team plays twice on the same day', () => {
        const teams = createTeams(4);
        const matches = scheduler.generateRoundRobinMatches('t1', teams);

        const matchesByDay = new Map<number, string[]>();
        for (const match of matches) {
          const day = match.matchDay!;
          if (!matchesByDay.has(day)) {
            matchesByDay.set(day, []);
          }
          matchesByDay.get(day)!.push(match.player1Id, match.player2Id, match.player3Id, match.player4Id);
        }

        // Check each day has unique players (no repeats)
        for (const [day, players] of matchesByDay) {
          const uniquePlayers = new Set(players);
          expect(uniquePlayers.size).toBe(players.length);
        }
      });

      it('should ensure every team plays every other team once', () => {
        const teams = createTeams(4);
        const matches = scheduler.generateRoundRobinMatches('t1', teams);

        const matchups = new Set<string>();
        for (const match of matches) {
          const team1Key = `${match.player1Id}-${match.player2Id}`;
          const team2Key = `${match.player3Id}-${match.player4Id}`;
          matchups.add([team1Key, team2Key].sort().join('|'));
        }

        // With 4 teams, there should be 6 unique matchups (4 choose 2 = 6)
        expect(matchups.size).toBe(6);
      });

      it('should follow the specific schedule pattern', () => {
        const teams = createTeams(4);
        const matches = scheduler.generateRoundRobinMatches('t1', teams);

        // Day 1: Team 0 vs Team 1, Team 2 vs Team 3
        const day1Matches = matches.filter(m => m.matchDay === 1);
        expect(day1Matches).toHaveLength(2);

        // Day 2: Team 0 vs Team 2, Team 1 vs Team 3
        const day2Matches = matches.filter(m => m.matchDay === 2);
        expect(day2Matches).toHaveLength(2);

        // Day 3: Team 0 vs Team 3, Team 1 vs Team 2
        const day3Matches = matches.filter(m => m.matchDay === 3);
        expect(day3Matches).toHaveLength(2);
      });
    });

    describe('6 Teams (12 players)', () => {
      it('should generate 15 matches for 6 teams', () => {
        const teams = createTeams(6);
        const matches = scheduler.generateRoundRobinMatches('t1', teams);

        // n(n-1)/2 = 6*5/2 = 15
        expect(matches).toHaveLength(15);
      });

      it('should distribute matches across 5 matchdays with 3 matches each', () => {
        const teams = createTeams(6);
        const matches = scheduler.generateRoundRobinMatches('t1', teams);

        const matchesByDay = new Map<number, number>();
        for (const match of matches) {
          const day = match.matchDay!;
          matchesByDay.set(day, (matchesByDay.get(day) || 0) + 1);
        }

        for (let day = 1; day <= 5; day++) {
          expect(matchesByDay.get(day)).toBe(3);
        }
      });

      it('should ensure no team plays twice on the same day', () => {
        const teams = createTeams(6);
        const matches = scheduler.generateRoundRobinMatches('t1', teams);

        const matchesByDay = new Map<number, string[]>();
        for (const match of matches) {
          const day = match.matchDay!;
          if (!matchesByDay.has(day)) {
            matchesByDay.set(day, []);
          }
          matchesByDay.get(day)!.push(match.player1Id, match.player2Id, match.player3Id, match.player4Id);
        }

        for (const [day, players] of matchesByDay) {
          const uniquePlayers = new Set(players);
          expect(uniquePlayers.size).toBe(players.length);
        }
      });

      it('should ensure every team plays every other team once', () => {
        const teams = createTeams(6);
        const matches = scheduler.generateRoundRobinMatches('t1', teams);

        const matchups = new Set<string>();
        for (const match of matches) {
          const team1Key = `${match.player1Id}-${match.player2Id}`;
          const team2Key = `${match.player3Id}-${match.player4Id}`;
          matchups.add([team1Key, team2Key].sort().join('|'));
        }

        expect(matchups.size).toBe(15);
      });
    });

    describe('8 Teams (16 players) - Multi-group', () => {
      it('should generate 12 matches for 8 teams (2 groups of 4)', () => {
        const teams = createTeams(8);
        const matches = scheduler.generateRoundRobinMatches('t1', teams);

        // 2 groups * 6 matches per group = 12
        expect(matches).toHaveLength(12);
      });

      it('should assign teams to 2 groups', () => {
        const teams = createTeams(8);
        const matches = scheduler.generateRoundRobinMatches('t1', teams);

        const groups = new Set(matches.map(m => m.groupNumber));
        expect(groups.size).toBe(2);
        expect(groups).toContain(1);
        expect(groups).toContain(2);
      });

      it('should have 6 matches per group', () => {
        const teams = createTeams(8);
        const matches = scheduler.generateRoundRobinMatches('t1', teams);

        const group1Matches = matches.filter(m => m.groupNumber === 1);
        const group2Matches = matches.filter(m => m.groupNumber === 2);

        expect(group1Matches).toHaveLength(6);
        expect(group2Matches).toHaveLength(6);
      });

      it('should keep group teams separate (no cross-group matches in phase 1)', () => {
        const teams = createTeams(8);
        const matches = scheduler.generateRoundRobinMatches('t1', teams);

        // Group 1 should have teams 0-3 (players p1-p8)
        const group1Players = new Set(['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8']);
        // Group 2 should have teams 4-7 (players p9-p16)
        const group2Players = new Set(['p9', 'p10', 'p11', 'p12', 'p13', 'p14', 'p15', 'p16']);

        for (const match of matches) {
          const matchPlayers = [match.player1Id, match.player2Id, match.player3Id, match.player4Id];

          if (match.groupNumber === 1) {
            for (const player of matchPlayers) {
              expect(group1Players.has(player)).toBe(true);
            }
          } else {
            for (const player of matchPlayers) {
              expect(group2Players.has(player)).toBe(true);
            }
          }
        }
      });

      it('should have sequential match numbers across all groups', () => {
        const teams = createTeams(8);
        const matches = scheduler.generateRoundRobinMatches('t1', teams);

        const matchNumbers = matches.map(m => m.matchNumber).sort((a, b) => a - b);
        expect(matchNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      });
    });

    describe('12 Teams (24 players) - Multi-group', () => {
      it('should generate 18 matches for 12 teams (3 groups of 4)', () => {
        const teams = createTeams(12);
        const matches = scheduler.generateRoundRobinMatches('t1', teams);

        // 3 groups * 6 matches per group = 18
        expect(matches).toHaveLength(18);
      });

      it('should assign teams to 3 groups', () => {
        const teams = createTeams(12);
        const matches = scheduler.generateRoundRobinMatches('t1', teams);

        const groups = new Set(matches.map(m => m.groupNumber));
        expect(groups.size).toBe(3);
        expect(groups).toContain(1);
        expect(groups).toContain(2);
        expect(groups).toContain(3);
      });

      it('should have 6 matches per group', () => {
        const teams = createTeams(12);
        const matches = scheduler.generateRoundRobinMatches('t1', teams);

        for (let group = 1; group <= 3; group++) {
          const groupMatches = matches.filter(m => m.groupNumber === group);
          expect(groupMatches).toHaveLength(6);
        }
      });
    });

    describe('Unsupported team counts', () => {
      it('should throw error for 2 teams', () => {
        const teams = createTeams(2);
        expect(() => scheduler.generateRoundRobinMatches('t1', teams)).toThrow('Unsupported team count: 2');
      });

      it('should throw error for 5 teams', () => {
        const teams = createTeams(5);
        expect(() => scheduler.generateRoundRobinMatches('t1', teams)).toThrow('Unsupported team count: 5');
      });

      it('should throw error for 10 teams', () => {
        const teams = createTeams(10);
        expect(() => scheduler.generateRoundRobinMatches('t1', teams)).toThrow('Unsupported team count: 10');
      });
    });
  });

  describe('Knockout Match Generation', () => {
    describe('4 Teams (8 players) - Semi-finals', () => {
      it('should generate 2 semi-final matches', () => {
        const teams = createTeams(4);
        const matches = scheduler.generateKnockoutMatches('t1', teams);

        expect(matches).toHaveLength(2);
      });

      it('should pair teams correctly (1v2, 3v4)', () => {
        const teams = createTeams(4);
        const matches = scheduler.generateKnockoutMatches('t1', teams);

        // Match 1: Team 0 vs Team 1
        expect(matches[0].player1Id).toBe('p1');
        expect(matches[0].player2Id).toBe('p2');
        expect(matches[0].player3Id).toBe('p3');
        expect(matches[0].player4Id).toBe('p4');

        // Match 2: Team 2 vs Team 3
        expect(matches[1].player1Id).toBe('p5');
        expect(matches[1].player2Id).toBe('p6');
        expect(matches[1].player3Id).toBe('p7');
        expect(matches[1].player4Id).toBe('p8');
      });

      it('should set all matches to round 1, phase 1', () => {
        const teams = createTeams(4);
        const matches = scheduler.generateKnockoutMatches('t1', teams);

        for (const match of matches) {
          expect(match.phase).toBe(1);
          expect(match.roundNumber).toBe(1);
        }
      });

      it('should have correct match numbers', () => {
        const teams = createTeams(4);
        const matches = scheduler.generateKnockoutMatches('t1', teams);

        expect(matches[0].matchNumber).toBe(1);
        expect(matches[1].matchNumber).toBe(2);
      });
    });

    describe('6 Teams - First round', () => {
      it('should generate 3 first round matches', () => {
        const teams = createTeams(6);
        const matches = scheduler.generateKnockoutMatches('t1', teams);

        expect(matches).toHaveLength(3);
      });

      it('should pair teams sequentially', () => {
        const teams = createTeams(6);
        const matches = scheduler.generateKnockoutMatches('t1', teams);

        // Match 1: Team 0 vs Team 1
        expect(matches[0].player1Id).toBe('p1');
        expect(matches[0].player3Id).toBe('p3');

        // Match 2: Team 2 vs Team 3
        expect(matches[1].player1Id).toBe('p5');
        expect(matches[1].player3Id).toBe('p7');

        // Match 3: Team 4 vs Team 5
        expect(matches[2].player1Id).toBe('p9');
        expect(matches[2].player3Id).toBe('p11');
      });
    });

    describe('8 Teams - Quarter-finals', () => {
      it('should generate 4 first round matches', () => {
        const teams = createTeams(8);
        const matches = scheduler.generateKnockoutMatches('t1', teams);

        expect(matches).toHaveLength(4);
      });
    });

    describe('12 Teams - First round', () => {
      it('should generate 6 first round matches', () => {
        const teams = createTeams(12);
        const matches = scheduler.generateKnockoutMatches('t1', teams);

        expect(matches).toHaveLength(6);
      });
    });

    describe('Unsupported team counts', () => {
      it('should throw error for 3 teams', () => {
        const teams = createTeams(3);
        expect(() => scheduler.generateKnockoutMatches('t1', teams)).toThrow('Unsupported team count for knockout: 3');
      });

      it('should throw error for 5 teams', () => {
        const teams = createTeams(5);
        expect(() => scheduler.generateKnockoutMatches('t1', teams)).toThrow('Unsupported team count for knockout: 5');
      });
    });
  });

  describe('Knockout Round 2 Generation', () => {
    it('should generate Final and 3rd place match', () => {
      const winner1 = { player1Id: 'p1', player2Id: 'p2' };
      const loser1 = { player1Id: 'p3', player2Id: 'p4' };
      const winner2 = { player1Id: 'p5', player2Id: 'p6' };
      const loser2 = { player1Id: 'p7', player2Id: 'p8' };

      const matches = scheduler.generateKnockoutRound2('t1', winner1, loser1, winner2, loser2);

      expect(matches).toHaveLength(2);
    });

    it('should create Final match (match 3) with both winners', () => {
      const winner1 = { player1Id: 'p1', player2Id: 'p2' };
      const loser1 = { player1Id: 'p3', player2Id: 'p4' };
      const winner2 = { player1Id: 'p5', player2Id: 'p6' };
      const loser2 = { player1Id: 'p7', player2Id: 'p8' };

      const matches = scheduler.generateKnockoutRound2('t1', winner1, loser1, winner2, loser2);

      const finalMatch = matches.find(m => m.matchNumber === 3);
      expect(finalMatch).toBeDefined();
      expect(finalMatch!.player1Id).toBe('p1');
      expect(finalMatch!.player2Id).toBe('p2');
      expect(finalMatch!.player3Id).toBe('p5');
      expect(finalMatch!.player4Id).toBe('p6');
      expect(finalMatch!.roundNumber).toBe(2);
    });

    it('should create 3rd place match (match 4) with both losers', () => {
      const winner1 = { player1Id: 'p1', player2Id: 'p2' };
      const loser1 = { player1Id: 'p3', player2Id: 'p4' };
      const winner2 = { player1Id: 'p5', player2Id: 'p6' };
      const loser2 = { player1Id: 'p7', player2Id: 'p8' };

      const matches = scheduler.generateKnockoutRound2('t1', winner1, loser1, winner2, loser2);

      const thirdPlaceMatch = matches.find(m => m.matchNumber === 4);
      expect(thirdPlaceMatch).toBeDefined();
      expect(thirdPlaceMatch!.player1Id).toBe('p3');
      expect(thirdPlaceMatch!.player2Id).toBe('p4');
      expect(thirdPlaceMatch!.player3Id).toBe('p7');
      expect(thirdPlaceMatch!.player4Id).toBe('p8');
      expect(thirdPlaceMatch!.roundNumber).toBe(2);
    });
  });

  describe('Group Stage Knockout Match Generation', () => {
    it('should generate same matches as round robin for Phase 1', () => {
      const teams = createTeams(4);
      const groupStageMatches = scheduler.generateGroupStageMatches('t1', teams);
      const roundRobinMatches = scheduler.generateRoundRobinMatches('t2', teams);

      expect(groupStageMatches).toHaveLength(roundRobinMatches.length);
    });

    it('should work with multi-group tournaments', () => {
      const teams = createTeams(8);
      const matches = scheduler.generateGroupStageMatches('t1', teams);

      expect(matches).toHaveLength(12); // 2 groups * 6 matches
    });
  });

  describe('Playoff Match Generation', () => {
    it('should generate Final and 3rd place match', () => {
      const team1st = { player1Id: 'p1', player2Id: 'p2' };
      const team2nd = { player1Id: 'p3', player2Id: 'p4' };
      const team3rd = { player1Id: 'p5', player2Id: 'p6' };
      const team4th = { player1Id: 'p7', player2Id: 'p8' };

      const matches = scheduler.generatePlayoffMatches('t1', team1st, team2nd, team3rd, team4th);

      expect(matches).toHaveLength(2);
    });

    it('should create Final match (1st vs 2nd) with phase 2', () => {
      const team1st = { player1Id: 'p1', player2Id: 'p2' };
      const team2nd = { player1Id: 'p3', player2Id: 'p4' };
      const team3rd = { player1Id: 'p5', player2Id: 'p6' };
      const team4th = { player1Id: 'p7', player2Id: 'p8' };

      const matches = scheduler.generatePlayoffMatches('t1', team1st, team2nd, team3rd, team4th);

      const finalMatch = matches.find(m => m.matchNumber === 1);
      expect(finalMatch).toBeDefined();
      expect(finalMatch!.phase).toBe(2);
      expect(finalMatch!.roundNumber).toBe(1);
      expect(finalMatch!.player1Id).toBe('p1');
      expect(finalMatch!.player2Id).toBe('p2');
      expect(finalMatch!.player3Id).toBe('p3');
      expect(finalMatch!.player4Id).toBe('p4');
    });

    it('should create 3rd place match (3rd vs 4th)', () => {
      const team1st = { player1Id: 'p1', player2Id: 'p2' };
      const team2nd = { player1Id: 'p3', player2Id: 'p4' };
      const team3rd = { player1Id: 'p5', player2Id: 'p6' };
      const team4th = { player1Id: 'p7', player2Id: 'p8' };

      const matches = scheduler.generatePlayoffMatches('t1', team1st, team2nd, team3rd, team4th);

      const thirdPlaceMatch = matches.find(m => m.matchNumber === 2);
      expect(thirdPlaceMatch).toBeDefined();
      expect(thirdPlaceMatch!.phase).toBe(2);
      expect(thirdPlaceMatch!.player1Id).toBe('p5');
      expect(thirdPlaceMatch!.player2Id).toBe('p6');
      expect(thirdPlaceMatch!.player3Id).toBe('p7');
      expect(thirdPlaceMatch!.player4Id).toBe('p8');
    });
  });

  describe('Match Data Integrity', () => {
    it('should always include tournamentId in all matches', () => {
      const teams = createTeams(4);
      const matches = scheduler.generateRoundRobinMatches('test-tournament-id', teams);

      for (const match of matches) {
        expect(match.tournamentId).toBe('test-tournament-id');
      }
    });

    it('should have all 4 player IDs in each match', () => {
      const teams = createTeams(4);
      const matches = scheduler.generateRoundRobinMatches('t1', teams);

      for (const match of matches) {
        expect(match.player1Id).toBeDefined();
        expect(match.player2Id).toBeDefined();
        expect(match.player3Id).toBeDefined();
        expect(match.player4Id).toBeDefined();

        // All should be non-empty strings
        expect(match.player1Id.length).toBeGreaterThan(0);
        expect(match.player2Id.length).toBeGreaterThan(0);
        expect(match.player3Id.length).toBeGreaterThan(0);
        expect(match.player4Id.length).toBeGreaterThan(0);
      }
    });

    it('should not have duplicate players in a single match', () => {
      const teams = createTeams(4);
      const matches = scheduler.generateRoundRobinMatches('t1', teams);

      for (const match of matches) {
        const players = [match.player1Id, match.player2Id, match.player3Id, match.player4Id];
        const uniquePlayers = new Set(players);
        expect(uniquePlayers.size).toBe(4);
      }
    });
  });
});
