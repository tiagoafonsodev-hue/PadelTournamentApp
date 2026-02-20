import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { Tournament } from '@/types';

async function fetchTournament(id: string): Promise<Tournament> {
  const { data } = await apiClient.get<Tournament>(`/api/tournaments/${id}`);
  return data;
}

export function useTournament(id: string) {
  return useQuery({
    queryKey: queryKeys.tournaments.detail(id),
    queryFn: () => fetchTournament(id),
    enabled: !!id,
    staleTime: 1000 * 60, // 1 minute (may change during active tournament)
  });
}
