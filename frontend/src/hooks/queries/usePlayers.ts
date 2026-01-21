import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { Player } from '@/types';

async function fetchPlayers(search?: string): Promise<Player[]> {
  const params = search ? { search } : {};
  const { data } = await apiClient.get<Player[]>('/api/players', { params });
  return data;
}

export function usePlayers(search?: string) {
  return useQuery({
    queryKey: search ? queryKeys.players.search(search) : queryKeys.players.all,
    queryFn: () => fetchPlayers(search),
  });
}
