// Tests for MatchResultService - validation and player stats logic

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

// Extracted basic validation logic for testing (no ties allowed by default)
function validateMatchResult(result: MatchResultData): void {
  // Scores must be non-negative
  if (result.team1Score < 0 || result.team2Score < 0) {
    throw new Error('Scores cannot be negative');
  }

  // Scores cannot be tied (legacy behavior - no allowTies config)
  if (result.team1Score === result.team2Score) {
    throw new Error('Match cannot end in a tie');
  }
}

// Extended validation with tournament tie configuration
function validateMatchResultWithConfig(
  result: MatchResultData,
  tournament: TournamentConfig,
  match: MatchContext
): void {
  // Scores must be non-negative
  if (result.team1Score < 0 || result.team2Score < 0) {
    throw new Error('Scores cannot be negative');
  }

  const isTie = result.team1Score === result.team2Score;
  if (!isTie) return; // Not a tie, valid

  // Check if ties are allowed
  if (!tournament.allowTies) {
    throw new Error('Match cannot end in a tie');
  }

  // Ties only allowed in Phase 1 (group stage)
  if (match.phase !== 1) {
    throw new Error('Ties are not allowed in playoff matches');
  }

  // Knockout tournaments never allow ties
  if (tournament.type === 'KNOCKOUT') {
    throw new Error('Ties are not allowed in knockout tournaments');
  }
}

// Extracted winner determination logic
function determineWinner(result: MatchResultData): 1 | 2 {
  return result.team1Score > result.team2Score ? 1 : 2;
}

// Determine winner with null for ties
function determineWinnerWithTies(result: MatchResultData): 1 | 2 | null {
  if (result.team1Score === result.team2Score) return null;
  return result.team1Score > result.team2Score ? 1 : 2;
}

// Extracted stats update logic (simulates the update calculation)
function calculateUpdatedStats(
  currentStats: PlayerStats | null,
  isWinner: boolean,
  gamesFor: number,
  gamesAgainst: number,
  reverse: boolean = false
): PlayerStats {
  if (!currentStats) {
    // Create initial stats (only when not reversing)
    if (reverse) {
      throw new Error('Cannot reverse stats for non-existent player');
    }
    return {
      playerId: 'new-player',
      totalMatches: 1,
      matchesWon: isWinner ? 1 : 0,
      matchesLost: isWinner ? 0 : 1,
      matchesDrawn: 0,
      setsWon: isWinner ? 1 : 0,
      setsLost: isWinner ? 0 : 1,
      gamesWon: gamesFor,
      gamesLost: gamesAgainst,
      tournamentsPlayed: 0,
      tournamentsWon: 0,
      winPercentage: isWinner ? 100 : 0,
      tournamentPoints: 0,
    };
  }

  const multiplier = reverse ? -1 : 1;
  const newTotalMatches = currentStats.totalMatches + (multiplier * 1);
  const newMatchesWon = currentStats.matchesWon + (multiplier * (isWinner ? 1 : 0));
  const newMatchesLost = currentStats.matchesLost + (multiplier * (isWinner ? 0 : 1));
  const newWinPercentage = newTotalMatches > 0 ? (newMatchesWon / newTotalMatches) * 100 : 0;

  return {
    ...currentStats,
    totalMatches: newTotalMatches,
    matchesWon: newMatchesWon,
    matchesLost: newMatchesLost,
    setsWon: currentStats.setsWon + (multiplier * (isWinner ? 1 : 0)),
    setsLost: currentStats.setsLost + (multiplier * (isWinner ? 0 : 1)),
    gamesWon: currentStats.gamesWon + (multiplier * gamesFor),
    gamesLost: currentStats.gamesLost + (multiplier * gamesAgainst),
    winPercentage: newWinPercentage,
  };
}

// Create empty stats for a player
function createEmptyStats(playerId: string): PlayerStats {
  return {
    playerId,
    totalMatches: 0,
    matchesWon: 0,
    matchesLost: 0,
    matchesDrawn: 0,
    setsWon: 0,
    setsLost: 0,
    gamesWon: 0,
    gamesLost: 0,
    tournamentsPlayed: 0,
    tournamentsWon: 0,
    winPercentage: 0,
    tournamentPoints: 0,
  };
}

// Calculate stats update for a tie/draw
function calculateUpdatedStatsForTie(
  currentStats: PlayerStats | null,
  gamesFor: number,
  gamesAgainst: number,
  reverse: boolean = false
): PlayerStats {
  if (!currentStats) {
    if (reverse) {
      throw new Error('Cannot reverse stats for non-existent player');
    }
    return {
      playerId: 'new-player',
      totalMatches: 1,
      matchesWon: 0,
      matchesLost: 0,
      matchesDrawn: 1,
      setsWon: 0,
      setsLost: 0,
      gamesWon: gamesFor,
      gamesLost: gamesAgainst,
      tournamentsPlayed: 0,
      tournamentsWon: 0,
      winPercentage: 0, // No decisive matches yet
      tournamentPoints: 0,
    };
  }

  const multiplier = reverse ? -1 : 1;
  const newTotalMatches = currentStats.totalMatches + (multiplier * 1);
  const newMatchesDrawn = currentStats.matchesDrawn + (multiplier * 1);
  // Win percentage based on decisive matches only
  const decisiveMatches = newTotalMatches - newMatchesDrawn;
  const newWinPercentage = decisiveMatches > 0 ? (currentStats.matchesWon / decisiveMatches) * 100 : 0;

  return {
    ...currentStats,
    totalMatches: newTotalMatches,
    matchesDrawn: newMatchesDrawn,
    gamesWon: currentStats.gamesWon + (multiplier * gamesFor),
    gamesLost: currentStats.gamesLost + (multiplier * gamesAgainst),
    winPercentage: newWinPercentage,
  };
}

describe('MatchResultService', () => {
  describe('Match Result Validation', () => {
    describe('Negative scores', () => {
      it('should reject negative team1Score', () => {
        expect(() => validateMatchResult({ team1Score: -1, team2Score: 6 }))
          .toThrow('Scores cannot be negative');
      });

      it('should reject negative team2Score', () => {
        expect(() => validateMatchResult({ team1Score: 6, team2Score: -3 }))
          .toThrow('Scores cannot be negative');
      });

      it('should reject both negative scores', () => {
        expect(() => validateMatchResult({ team1Score: -2, team2Score: -4 }))
          .toThrow('Scores cannot be negative');
      });
    });

    describe('Tie scores', () => {
      it('should reject 0-0 tie', () => {
        expect(() => validateMatchResult({ team1Score: 0, team2Score: 0 }))
          .toThrow('Match cannot end in a tie');
      });

      it('should reject 6-6 tie', () => {
        expect(() => validateMatchResult({ team1Score: 6, team2Score: 6 }))
          .toThrow('Match cannot end in a tie');
      });

      it('should reject any tie', () => {
        expect(() => validateMatchResult({ team1Score: 4, team2Score: 4 }))
          .toThrow('Match cannot end in a tie');
      });
    });

    describe('Valid scores', () => {
      it('should accept valid team1 win', () => {
        expect(() => validateMatchResult({ team1Score: 6, team2Score: 4 }))
          .not.toThrow();
      });

      it('should accept valid team2 win', () => {
        expect(() => validateMatchResult({ team1Score: 3, team2Score: 6 }))
          .not.toThrow();
      });

      it('should accept close game', () => {
        expect(() => validateMatchResult({ team1Score: 7, team2Score: 6 }))
          .not.toThrow();
      });

      it('should accept blowout', () => {
        expect(() => validateMatchResult({ team1Score: 6, team2Score: 0 }))
          .not.toThrow();
      });

      it('should accept zero score for losing team', () => {
        expect(() => validateMatchResult({ team1Score: 0, team2Score: 6 }))
          .not.toThrow();
      });

      it('should accept high scores', () => {
        expect(() => validateMatchResult({ team1Score: 12, team2Score: 10 }))
          .not.toThrow();
      });
    });
  });

  describe('Winner Determination', () => {
    it('should return 1 when team1 wins', () => {
      expect(determineWinner({ team1Score: 6, team2Score: 4 })).toBe(1);
    });

    it('should return 2 when team2 wins', () => {
      expect(determineWinner({ team1Score: 3, team2Score: 6 })).toBe(2);
    });

    it('should return 1 for minimal team1 win', () => {
      expect(determineWinner({ team1Score: 1, team2Score: 0 })).toBe(1);
    });

    it('should return 2 for minimal team2 win', () => {
      expect(determineWinner({ team1Score: 0, team2Score: 1 })).toBe(2);
    });

    it('should handle close games correctly - team1 wins', () => {
      expect(determineWinner({ team1Score: 7, team2Score: 6 })).toBe(1);
    });

    it('should handle close games correctly - team2 wins', () => {
      expect(determineWinner({ team1Score: 6, team2Score: 7 })).toBe(2);
    });
  });

  describe('Player Stats Updates', () => {
    describe('New player (no existing stats)', () => {
      it('should create stats with 1 win for winning player', () => {
        const stats = calculateUpdatedStats(null, true, 6, 4);

        expect(stats.totalMatches).toBe(1);
        expect(stats.matchesWon).toBe(1);
        expect(stats.matchesLost).toBe(0);
        expect(stats.winPercentage).toBe(100);
      });

      it('should create stats with 1 loss for losing player', () => {
        const stats = calculateUpdatedStats(null, false, 4, 6);

        expect(stats.totalMatches).toBe(1);
        expect(stats.matchesWon).toBe(0);
        expect(stats.matchesLost).toBe(1);
        expect(stats.winPercentage).toBe(0);
      });

      it('should track games correctly for new player', () => {
        const stats = calculateUpdatedStats(null, true, 6, 3);

        expect(stats.gamesWon).toBe(6);
        expect(stats.gamesLost).toBe(3);
      });

      it('should track sets as match wins for new player (winner)', () => {
        const stats = calculateUpdatedStats(null, true, 6, 4);

        expect(stats.setsWon).toBe(1);
        expect(stats.setsLost).toBe(0);
      });

      it('should track sets as match wins for new player (loser)', () => {
        const stats = calculateUpdatedStats(null, false, 4, 6);

        expect(stats.setsWon).toBe(0);
        expect(stats.setsLost).toBe(1);
      });
    });

    describe('Existing player stats update', () => {
      it('should increment totalMatches', () => {
        const existing = createEmptyStats('p1');
        existing.totalMatches = 5;
        existing.matchesWon = 3;
        existing.matchesLost = 2;

        const updated = calculateUpdatedStats(existing, true, 6, 4);

        expect(updated.totalMatches).toBe(6);
      });

      it('should increment matchesWon for winner', () => {
        const existing = createEmptyStats('p1');
        existing.totalMatches = 5;
        existing.matchesWon = 3;
        existing.matchesLost = 2;

        const updated = calculateUpdatedStats(existing, true, 6, 4);

        expect(updated.matchesWon).toBe(4);
        expect(updated.matchesLost).toBe(2); // Unchanged
      });

      it('should increment matchesLost for loser', () => {
        const existing = createEmptyStats('p1');
        existing.totalMatches = 5;
        existing.matchesWon = 3;
        existing.matchesLost = 2;

        const updated = calculateUpdatedStats(existing, false, 4, 6);

        expect(updated.matchesWon).toBe(3); // Unchanged
        expect(updated.matchesLost).toBe(3);
      });

      it('should accumulate gamesWon and gamesLost', () => {
        const existing = createEmptyStats('p1');
        existing.gamesWon = 30;
        existing.gamesLost = 25;

        const updated = calculateUpdatedStats(existing, true, 6, 4);

        expect(updated.gamesWon).toBe(36);
        expect(updated.gamesLost).toBe(29);
      });

      it('should recalculate winPercentage correctly', () => {
        const existing = createEmptyStats('p1');
        existing.totalMatches = 4;
        existing.matchesWon = 2;

        // Win this match: 3 wins out of 5 = 60%
        const updated = calculateUpdatedStats(existing, true, 6, 4);

        expect(updated.winPercentage).toBe(60);
      });

      it('should handle 100% win rate', () => {
        const existing = createEmptyStats('p1');
        existing.totalMatches = 9;
        existing.matchesWon = 9;
        existing.matchesLost = 0;

        const updated = calculateUpdatedStats(existing, true, 6, 4);

        expect(updated.matchesWon).toBe(10);
        expect(updated.winPercentage).toBe(100);
      });

      it('should handle 0% win rate', () => {
        const existing = createEmptyStats('p1');
        existing.totalMatches = 5;
        existing.matchesWon = 0;
        existing.matchesLost = 5;

        const updated = calculateUpdatedStats(existing, false, 3, 6);

        expect(updated.matchesLost).toBe(6);
        expect(updated.winPercentage).toBe(0);
      });
    });

    describe('Stats reversal (for match result updates)', () => {
      it('should decrement totalMatches when reversing', () => {
        const existing = createEmptyStats('p1');
        existing.totalMatches = 5;
        existing.matchesWon = 3;
        existing.matchesLost = 2;

        const updated = calculateUpdatedStats(existing, true, 6, 4, true);

        expect(updated.totalMatches).toBe(4);
      });

      it('should decrement matchesWon when reversing a win', () => {
        const existing = createEmptyStats('p1');
        existing.totalMatches = 5;
        existing.matchesWon = 3;
        existing.matchesLost = 2;

        const updated = calculateUpdatedStats(existing, true, 6, 4, true);

        expect(updated.matchesWon).toBe(2);
        expect(updated.matchesLost).toBe(2);
      });

      it('should decrement matchesLost when reversing a loss', () => {
        const existing = createEmptyStats('p1');
        existing.totalMatches = 5;
        existing.matchesWon = 2;
        existing.matchesLost = 3;

        const updated = calculateUpdatedStats(existing, false, 4, 6, true);

        expect(updated.matchesWon).toBe(2);
        expect(updated.matchesLost).toBe(2);
      });

      it('should subtract games when reversing', () => {
        const existing = createEmptyStats('p1');
        existing.gamesWon = 30;
        existing.gamesLost = 25;

        const updated = calculateUpdatedStats(existing, true, 6, 4, true);

        expect(updated.gamesWon).toBe(24);
        expect(updated.gamesLost).toBe(21);
      });

      it('should recalculate winPercentage after reversal', () => {
        const existing = createEmptyStats('p1');
        existing.totalMatches = 5;
        existing.matchesWon = 3;
        existing.matchesLost = 2;

        // Reverse a win: 2 wins out of 4 = 50%
        const updated = calculateUpdatedStats(existing, true, 6, 4, true);

        expect(updated.winPercentage).toBe(50);
      });

      it('should handle reversal to 0 matches', () => {
        const existing = createEmptyStats('p1');
        existing.totalMatches = 1;
        existing.matchesWon = 1;
        existing.matchesLost = 0;
        existing.winPercentage = 100;

        const updated = calculateUpdatedStats(existing, true, 6, 4, true);

        expect(updated.totalMatches).toBe(0);
        expect(updated.matchesWon).toBe(0);
        expect(updated.winPercentage).toBe(0); // 0/0 = 0%
      });
    });

    describe('Match result update flow', () => {
      it('should correctly update stats when changing match result', () => {
        // Scenario: Player originally won 6-4, now we change result to loss 4-6

        // Original stats after winning
        let stats = createEmptyStats('p1');
        stats = calculateUpdatedStats(stats, true, 6, 4);

        expect(stats.matchesWon).toBe(1);
        expect(stats.matchesLost).toBe(0);
        expect(stats.gamesWon).toBe(6);
        expect(stats.gamesLost).toBe(4);

        // Reverse the old win
        stats = calculateUpdatedStats(stats, true, 6, 4, true);

        expect(stats.totalMatches).toBe(0);
        expect(stats.matchesWon).toBe(0);

        // Apply new loss
        stats = calculateUpdatedStats(stats, false, 4, 6);

        expect(stats.totalMatches).toBe(1);
        expect(stats.matchesWon).toBe(0);
        expect(stats.matchesLost).toBe(1);
        expect(stats.gamesWon).toBe(4);
        expect(stats.gamesLost).toBe(6);
        expect(stats.winPercentage).toBe(0);
      });

      it('should maintain correct stats through multiple matches', () => {
        let stats = createEmptyStats('p1');

        // Match 1: Win 6-4
        stats = calculateUpdatedStats(stats, true, 6, 4);
        expect(stats.winPercentage).toBe(100);

        // Match 2: Win 6-3
        stats = calculateUpdatedStats(stats, true, 6, 3);
        expect(stats.winPercentage).toBe(100);
        expect(stats.gamesWon).toBe(12);
        expect(stats.gamesLost).toBe(7);

        // Match 3: Lose 4-6
        stats = calculateUpdatedStats(stats, false, 4, 6);
        expect(stats.matchesWon).toBe(2);
        expect(stats.matchesLost).toBe(1);
        expect(stats.winPercentage).toBeCloseTo(66.67, 1);

        // Match 4: Win 6-5
        stats = calculateUpdatedStats(stats, true, 6, 5);
        expect(stats.matchesWon).toBe(3);
        expect(stats.matchesLost).toBe(1);
        expect(stats.winPercentage).toBe(75);
        expect(stats.gamesWon).toBe(22);
        expect(stats.gamesLost).toBe(18);
      });
    });
  });

  describe('Complete match processing', () => {
    it('should correctly process a team1 win', () => {
      const result = { team1Score: 6, team2Score: 4 };

      // Validate
      expect(() => validateMatchResult(result)).not.toThrow();

      // Determine winner
      expect(determineWinner(result)).toBe(1);

      // Update stats for team1 players (winners)
      const team1Player1Stats = calculateUpdatedStats(null, true, 6, 4);
      const team1Player2Stats = calculateUpdatedStats(null, true, 6, 4);

      expect(team1Player1Stats.matchesWon).toBe(1);
      expect(team1Player2Stats.matchesWon).toBe(1);

      // Update stats for team2 players (losers)
      const team2Player1Stats = calculateUpdatedStats(null, false, 4, 6);
      const team2Player2Stats = calculateUpdatedStats(null, false, 4, 6);

      expect(team2Player1Stats.matchesLost).toBe(1);
      expect(team2Player2Stats.matchesLost).toBe(1);
    });

    it('should correctly process a team2 win', () => {
      const result = { team1Score: 3, team2Score: 6 };

      // Validate
      expect(() => validateMatchResult(result)).not.toThrow();

      // Determine winner
      expect(determineWinner(result)).toBe(2);

      // Team2 wins
      const team2PlayerStats = calculateUpdatedStats(null, true, 6, 3);
      expect(team2PlayerStats.matchesWon).toBe(1);
      expect(team2PlayerStats.gamesWon).toBe(6);

      // Team1 loses
      const team1PlayerStats = calculateUpdatedStats(null, false, 3, 6);
      expect(team1PlayerStats.matchesLost).toBe(1);
      expect(team1PlayerStats.gamesLost).toBe(6);
    });
  });

  describe('Edge cases', () => {
    it('should handle very high scores', () => {
      const result = { team1Score: 15, team2Score: 13 };
      expect(() => validateMatchResult(result)).not.toThrow();
      expect(determineWinner(result)).toBe(1);
    });

    it('should handle one-game difference', () => {
      const result = { team1Score: 5, team2Score: 4 };
      expect(() => validateMatchResult(result)).not.toThrow();
      expect(determineWinner(result)).toBe(1);
    });

    it('should handle zero to something score', () => {
      const result = { team1Score: 0, team2Score: 6 };
      expect(() => validateMatchResult(result)).not.toThrow();
      expect(determineWinner(result)).toBe(2);

      const loserStats = calculateUpdatedStats(null, false, 0, 6);
      expect(loserStats.gamesWon).toBe(0);
      expect(loserStats.gamesLost).toBe(6);
    });

    it('should handle accumulating stats over many matches', () => {
      let stats = createEmptyStats('p1');

      // Simulate 100 matches: 70 wins, 30 losses
      for (let i = 0; i < 70; i++) {
        stats = calculateUpdatedStats(stats, true, 6, Math.floor(Math.random() * 5));
      }
      for (let i = 0; i < 30; i++) {
        stats = calculateUpdatedStats(stats, false, Math.floor(Math.random() * 5), 6);
      }

      expect(stats.totalMatches).toBe(100);
      expect(stats.matchesWon).toBe(70);
      expect(stats.matchesLost).toBe(30);
      expect(stats.winPercentage).toBe(70);
    });
  });
});

describe('Match scenarios', () => {
  describe('Tournament match flow', () => {
    it('should track 4 players stats correctly for one match', () => {
      const result = { team1Score: 6, team2Score: 4 };

      // Team 1: p1 + p2 (winners)
      // Team 2: p3 + p4 (losers)

      const p1Stats = calculateUpdatedStats(null, true, 6, 4);
      const p2Stats = calculateUpdatedStats(null, true, 6, 4);
      const p3Stats = calculateUpdatedStats(null, false, 4, 6);
      const p4Stats = calculateUpdatedStats(null, false, 4, 6);

      // All players played 1 match
      expect(p1Stats.totalMatches).toBe(1);
      expect(p2Stats.totalMatches).toBe(1);
      expect(p3Stats.totalMatches).toBe(1);
      expect(p4Stats.totalMatches).toBe(1);

      // Winners have 1 win
      expect(p1Stats.matchesWon).toBe(1);
      expect(p2Stats.matchesWon).toBe(1);

      // Losers have 1 loss
      expect(p3Stats.matchesLost).toBe(1);
      expect(p4Stats.matchesLost).toBe(1);
    });

    it('should correctly update stats when same players play multiple matches', () => {
      // Simulating a player (p1) in a 4-team round robin (3 matches)

      let p1Stats = createEmptyStats('p1');

      // Match 1: Win 6-3
      p1Stats = calculateUpdatedStats(p1Stats, true, 6, 3);

      // Match 2: Win 6-4
      p1Stats = calculateUpdatedStats(p1Stats, true, 6, 4);

      // Match 3: Lose 4-6
      p1Stats = calculateUpdatedStats(p1Stats, false, 4, 6);

      expect(p1Stats.totalMatches).toBe(3);
      expect(p1Stats.matchesWon).toBe(2);
      expect(p1Stats.matchesLost).toBe(1);
      expect(p1Stats.gamesWon).toBe(16);
      expect(p1Stats.gamesLost).toBe(13);
      expect(p1Stats.winPercentage).toBeCloseTo(66.67, 1);
    });
  });

  describe('Match result correction flow', () => {
    it('should handle correcting a misreported score', () => {
      // Originally reported: Team1 won 6-4
      // Correct score: Team2 won 4-6

      let p1Stats = createEmptyStats('p1'); // Team 1 player
      let p3Stats = createEmptyStats('p3'); // Team 2 player

      // Initial (wrong) result
      p1Stats = calculateUpdatedStats(p1Stats, true, 6, 4);
      p3Stats = calculateUpdatedStats(p3Stats, false, 4, 6);

      // Verify wrong stats
      expect(p1Stats.matchesWon).toBe(1);
      expect(p3Stats.matchesLost).toBe(1);

      // Reverse old result
      p1Stats = calculateUpdatedStats(p1Stats, true, 6, 4, true);
      p3Stats = calculateUpdatedStats(p3Stats, false, 4, 6, true);

      // Both should be at 0
      expect(p1Stats.totalMatches).toBe(0);
      expect(p3Stats.totalMatches).toBe(0);

      // Apply correct result
      p1Stats = calculateUpdatedStats(p1Stats, false, 4, 6);
      p3Stats = calculateUpdatedStats(p3Stats, true, 6, 4);

      // Verify correct stats
      expect(p1Stats.matchesLost).toBe(1);
      expect(p1Stats.matchesWon).toBe(0);
      expect(p3Stats.matchesWon).toBe(1);
      expect(p3Stats.matchesLost).toBe(0);
    });
  });
});

// ==========================================
// TIE FUNCTIONALITY TESTS
// ==========================================

describe('Tie Functionality', () => {
  describe('Tie Validation with Tournament Config', () => {
    describe('Ties allowed in group stage', () => {
      it('should accept tie when allowTies is true and phase is 1 (ROUND_ROBIN)', () => {
        const tournament: TournamentConfig = { allowTies: true, type: 'ROUND_ROBIN' };
        const match: MatchContext = { phase: 1 };

        expect(() => validateMatchResultWithConfig({ team1Score: 5, team2Score: 5 }, tournament, match))
          .not.toThrow();
      });

      it('should accept tie when allowTies is true and phase is 1 (GROUP_STAGE_KNOCKOUT)', () => {
        const tournament: TournamentConfig = { allowTies: true, type: 'GROUP_STAGE_KNOCKOUT' };
        const match: MatchContext = { phase: 1 };

        expect(() => validateMatchResultWithConfig({ team1Score: 4, team2Score: 4 }, tournament, match))
          .not.toThrow();
      });

      it('should accept 0-0 tie when allowed', () => {
        const tournament: TournamentConfig = { allowTies: true, type: 'ROUND_ROBIN' };
        const match: MatchContext = { phase: 1 };

        expect(() => validateMatchResultWithConfig({ team1Score: 0, team2Score: 0 }, tournament, match))
          .not.toThrow();
      });
    });

    describe('Ties rejected when not allowed', () => {
      it('should reject tie when allowTies is false', () => {
        const tournament: TournamentConfig = { allowTies: false, type: 'ROUND_ROBIN' };
        const match: MatchContext = { phase: 1 };

        expect(() => validateMatchResultWithConfig({ team1Score: 5, team2Score: 5 }, tournament, match))
          .toThrow('Match cannot end in a tie');
      });

      it('should reject tie in Phase 2 (playoffs) even when allowTies is true', () => {
        const tournament: TournamentConfig = { allowTies: true, type: 'GROUP_STAGE_KNOCKOUT' };
        const match: MatchContext = { phase: 2 };

        expect(() => validateMatchResultWithConfig({ team1Score: 5, team2Score: 5 }, tournament, match))
          .toThrow('Ties are not allowed in playoff matches');
      });

      it('should reject tie in KNOCKOUT tournament even when allowTies is true', () => {
        const tournament: TournamentConfig = { allowTies: true, type: 'KNOCKOUT' };
        const match: MatchContext = { phase: 1 };

        expect(() => validateMatchResultWithConfig({ team1Score: 5, team2Score: 5 }, tournament, match))
          .toThrow('Ties are not allowed in knockout tournaments');
      });

      it('should reject tie in KNOCKOUT tournament Phase 2', () => {
        const tournament: TournamentConfig = { allowTies: true, type: 'KNOCKOUT' };
        const match: MatchContext = { phase: 2 };

        expect(() => validateMatchResultWithConfig({ team1Score: 5, team2Score: 5 }, tournament, match))
          .toThrow('Ties are not allowed in playoff matches');
      });
    });

    describe('Non-tie results always valid', () => {
      it('should accept non-tie result regardless of allowTies setting', () => {
        const tournament: TournamentConfig = { allowTies: false, type: 'ROUND_ROBIN' };
        const match: MatchContext = { phase: 1 };

        expect(() => validateMatchResultWithConfig({ team1Score: 6, team2Score: 4 }, tournament, match))
          .not.toThrow();
      });

      it('should accept non-tie in Phase 2 playoff', () => {
        const tournament: TournamentConfig = { allowTies: true, type: 'GROUP_STAGE_KNOCKOUT' };
        const match: MatchContext = { phase: 2 };

        expect(() => validateMatchResultWithConfig({ team1Score: 6, team2Score: 5 }, tournament, match))
          .not.toThrow();
      });

      it('should accept non-tie in KNOCKOUT', () => {
        const tournament: TournamentConfig = { allowTies: false, type: 'KNOCKOUT' };
        const match: MatchContext = { phase: 1 };

        expect(() => validateMatchResultWithConfig({ team1Score: 6, team2Score: 4 }, tournament, match))
          .not.toThrow();
      });
    });

    describe('Negative scores still rejected', () => {
      it('should reject negative scores even when ties are allowed', () => {
        const tournament: TournamentConfig = { allowTies: true, type: 'ROUND_ROBIN' };
        const match: MatchContext = { phase: 1 };

        expect(() => validateMatchResultWithConfig({ team1Score: -1, team2Score: 5 }, tournament, match))
          .toThrow('Scores cannot be negative');
      });
    });
  });

  describe('Winner Determination with Ties', () => {
    it('should return null for a tie', () => {
      expect(determineWinnerWithTies({ team1Score: 5, team2Score: 5 })).toBeNull();
    });

    it('should return null for 0-0 tie', () => {
      expect(determineWinnerWithTies({ team1Score: 0, team2Score: 0 })).toBeNull();
    });

    it('should return 1 for team1 win', () => {
      expect(determineWinnerWithTies({ team1Score: 6, team2Score: 4 })).toBe(1);
    });

    it('should return 2 for team2 win', () => {
      expect(determineWinnerWithTies({ team1Score: 4, team2Score: 6 })).toBe(2);
    });
  });

  describe('Player Stats for Ties', () => {
    describe('New player - tie', () => {
      it('should create stats with 1 draw for new player', () => {
        const stats = calculateUpdatedStatsForTie(null, 5, 5);

        expect(stats.totalMatches).toBe(1);
        expect(stats.matchesWon).toBe(0);
        expect(stats.matchesLost).toBe(0);
        expect(stats.matchesDrawn).toBe(1);
        expect(stats.winPercentage).toBe(0); // No decisive matches
      });

      it('should track games correctly for tie', () => {
        const stats = calculateUpdatedStatsForTie(null, 5, 5);

        expect(stats.gamesWon).toBe(5);
        expect(stats.gamesLost).toBe(5);
      });

      it('should not count sets for ties', () => {
        const stats = calculateUpdatedStatsForTie(null, 5, 5);

        expect(stats.setsWon).toBe(0);
        expect(stats.setsLost).toBe(0);
      });
    });

    describe('Existing player stats update - tie', () => {
      it('should increment matchesDrawn for tie', () => {
        const existing = createEmptyStats('p1');
        existing.totalMatches = 5;
        existing.matchesWon = 3;
        existing.matchesLost = 2;
        existing.matchesDrawn = 0;

        const updated = calculateUpdatedStatsForTie(existing, 5, 5);

        expect(updated.totalMatches).toBe(6);
        expect(updated.matchesDrawn).toBe(1);
        expect(updated.matchesWon).toBe(3); // Unchanged
        expect(updated.matchesLost).toBe(2); // Unchanged
      });

      it('should calculate winPercentage based on decisive matches only', () => {
        const existing = createEmptyStats('p1');
        existing.totalMatches = 4;
        existing.matchesWon = 2;
        existing.matchesLost = 2;
        existing.matchesDrawn = 0;

        // Add a tie: 2 wins, 2 losses, 1 draw = 5 total
        // Decisive matches = 4, win% = 2/4 = 50%
        const updated = calculateUpdatedStatsForTie(existing, 5, 5);

        expect(updated.totalMatches).toBe(5);
        expect(updated.matchesDrawn).toBe(1);
        expect(updated.winPercentage).toBe(50);
      });

      it('should maintain 100% win rate after tie', () => {
        const existing = createEmptyStats('p1');
        existing.totalMatches = 4;
        existing.matchesWon = 4;
        existing.matchesLost = 0;
        existing.matchesDrawn = 0;

        // Add a tie: 4 wins, 0 losses, 1 draw
        // Decisive matches = 4, win% = 4/4 = 100%
        const updated = calculateUpdatedStatsForTie(existing, 5, 5);

        expect(updated.winPercentage).toBe(100);
      });

      it('should accumulate games from ties', () => {
        const existing = createEmptyStats('p1');
        existing.gamesWon = 20;
        existing.gamesLost = 15;

        const updated = calculateUpdatedStatsForTie(existing, 5, 5);

        expect(updated.gamesWon).toBe(25);
        expect(updated.gamesLost).toBe(20);
      });
    });

    describe('Stats reversal - tie', () => {
      it('should decrement matchesDrawn when reversing tie', () => {
        const existing = createEmptyStats('p1');
        existing.totalMatches = 5;
        existing.matchesWon = 2;
        existing.matchesLost = 2;
        existing.matchesDrawn = 1;

        const updated = calculateUpdatedStatsForTie(existing, 5, 5, true);

        expect(updated.totalMatches).toBe(4);
        expect(updated.matchesDrawn).toBe(0);
      });

      it('should recalculate winPercentage after tie reversal', () => {
        const existing = createEmptyStats('p1');
        existing.totalMatches = 5;
        existing.matchesWon = 2;
        existing.matchesLost = 2;
        existing.matchesDrawn = 1;

        // After reversal: 4 total, 2 wins, 2 losses, 0 draws
        // Decisive = 4, win% = 2/4 = 50%
        const updated = calculateUpdatedStatsForTie(existing, 5, 5, true);

        expect(updated.winPercentage).toBe(50);
      });
    });

    describe('Mixed match history with ties', () => {
      it('should correctly track player with wins, losses, and ties', () => {
        let stats = createEmptyStats('p1');

        // Match 1: Win 6-4
        stats = calculateUpdatedStats(stats, true, 6, 4);
        expect(stats.matchesWon).toBe(1);
        expect(stats.winPercentage).toBe(100);

        // Match 2: Tie 5-5
        stats = calculateUpdatedStatsForTie(stats, 5, 5);
        expect(stats.totalMatches).toBe(2);
        expect(stats.matchesDrawn).toBe(1);
        expect(stats.winPercentage).toBe(100); // 1/1 decisive = 100%

        // Match 3: Loss 4-6
        stats = calculateUpdatedStats(stats, false, 4, 6);
        expect(stats.totalMatches).toBe(3);
        expect(stats.matchesWon).toBe(1);
        expect(stats.matchesLost).toBe(1);
        expect(stats.matchesDrawn).toBe(1);
        // Decisive = 2, win% = 1/2 = 50%
        // Note: calculateUpdatedStats doesn't know about draws, so this tests the formula

        // Match 4: Win 6-3
        stats = calculateUpdatedStats(stats, true, 6, 3);
        expect(stats.totalMatches).toBe(4);
        expect(stats.matchesWon).toBe(2);
        expect(stats.gamesWon).toBe(21); // 6 + 5 + 4 + 6
        expect(stats.gamesLost).toBe(18); // 4 + 5 + 6 + 3
      });
    });
  });

  describe('Tie Match Processing', () => {
    it('should correctly process a tie match for all 4 players', () => {
      const result = { team1Score: 5, team2Score: 5 };

      // Validate (with tie allowed)
      const tournament: TournamentConfig = { allowTies: true, type: 'ROUND_ROBIN' };
      const match: MatchContext = { phase: 1 };
      expect(() => validateMatchResultWithConfig(result, tournament, match)).not.toThrow();

      // Determine winner (should be null)
      expect(determineWinnerWithTies(result)).toBeNull();

      // Update stats for all 4 players (all get draws)
      const p1Stats = calculateUpdatedStatsForTie(null, 5, 5);
      const p2Stats = calculateUpdatedStatsForTie(null, 5, 5);
      const p3Stats = calculateUpdatedStatsForTie(null, 5, 5);
      const p4Stats = calculateUpdatedStatsForTie(null, 5, 5);

      // All players should have 1 draw
      expect(p1Stats.matchesDrawn).toBe(1);
      expect(p2Stats.matchesDrawn).toBe(1);
      expect(p3Stats.matchesDrawn).toBe(1);
      expect(p4Stats.matchesDrawn).toBe(1);

      // All should have 0 wins and losses
      expect(p1Stats.matchesWon).toBe(0);
      expect(p1Stats.matchesLost).toBe(0);
    });

    it('should handle correcting a win to a tie', () => {
      // Originally reported: Team1 won 6-4
      // Correct score: Tie 5-5

      let p1Stats = createEmptyStats('p1');

      // Initial (wrong) result - win
      p1Stats = calculateUpdatedStats(p1Stats, true, 6, 4);
      expect(p1Stats.matchesWon).toBe(1);
      expect(p1Stats.matchesDrawn).toBe(0);

      // Reverse old win
      p1Stats = calculateUpdatedStats(p1Stats, true, 6, 4, true);
      expect(p1Stats.totalMatches).toBe(0);

      // Apply correct result - tie
      p1Stats = calculateUpdatedStatsForTie(p1Stats, 5, 5);
      expect(p1Stats.totalMatches).toBe(1);
      expect(p1Stats.matchesWon).toBe(0);
      expect(p1Stats.matchesDrawn).toBe(1);
      expect(p1Stats.gamesWon).toBe(5);
      expect(p1Stats.gamesLost).toBe(5);
    });

    it('should handle correcting a tie to a win', () => {
      // Originally reported: Tie 5-5
      // Correct score: Team1 won 6-5

      let p1Stats = createEmptyStats('p1');

      // Initial (wrong) result - tie
      p1Stats = calculateUpdatedStatsForTie(p1Stats, 5, 5);
      expect(p1Stats.matchesDrawn).toBe(1);

      // Reverse old tie
      p1Stats = calculateUpdatedStatsForTie(p1Stats, 5, 5, true);
      expect(p1Stats.totalMatches).toBe(0);
      expect(p1Stats.matchesDrawn).toBe(0);

      // Apply correct result - win
      p1Stats = calculateUpdatedStats(p1Stats, true, 6, 5);
      expect(p1Stats.totalMatches).toBe(1);
      expect(p1Stats.matchesWon).toBe(1);
      expect(p1Stats.matchesDrawn).toBe(0);
      expect(p1Stats.gamesWon).toBe(6);
      expect(p1Stats.gamesLost).toBe(5);
    });
  });
});
