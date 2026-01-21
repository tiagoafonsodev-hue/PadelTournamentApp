export const queryKeys = {
  tournaments: {
    all: ['tournaments'] as const,
    detail: (id: string) => ['tournaments', id] as const,
    standings: (id: string) => ['tournaments', id, 'standings'] as const,
  },
  players: {
    all: ['players'] as const,
    search: (search: string) => ['players', { search }] as const,
    leaderboard: ['players', 'leaderboard'] as const,
  },
  matches: {
    byTournament: (tournamentId: string) => ['matches', { tournamentId }] as const,
  },
};
