import { queryKeys } from '../query-keys';

describe('queryKeys', () => {
  describe('tournaments', () => {
    it('should return correct key for all tournaments', () => {
      expect(queryKeys.tournaments.all).toEqual(['tournaments']);
    });

    it('should return correct key for tournament detail', () => {
      expect(queryKeys.tournaments.detail('tournament1')).toEqual(['tournaments', 'tournament1']);
    });

    it('should return correct key for tournament standings', () => {
      expect(queryKeys.tournaments.standings('tournament1')).toEqual([
        'tournaments',
        'tournament1',
        'standings',
      ]);
    });
  });

  describe('players', () => {
    it('should return correct key for all players', () => {
      expect(queryKeys.players.all).toEqual(['players']);
    });

    it('should return correct key for player search', () => {
      expect(queryKeys.players.search('John')).toEqual(['players', { search: 'John' }]);
    });

    it('should return correct key for leaderboard', () => {
      expect(queryKeys.players.leaderboard).toEqual(['players', 'leaderboard']);
    });
  });

  describe('matches', () => {
    it('should return correct key for matches by tournament', () => {
      expect(queryKeys.matches.byTournament('tournament1')).toEqual([
        'matches',
        { tournamentId: 'tournament1' },
      ]);
    });
  });
});
