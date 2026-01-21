import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { Player } from '@/types';

async function fetchLeaderboard(): Promise<Player[]> {
  const { data } = await apiClient.get<Player[]>('/api/players/leaderboard');
  return data;
}

export function useLeaderboard() {
  return useQuery({
    queryKey: queryKeys.players.leaderboard,
    queryFn: fetchLeaderboard,
  });
}
