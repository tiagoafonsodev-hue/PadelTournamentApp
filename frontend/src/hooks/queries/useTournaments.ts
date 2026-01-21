import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { Tournament } from '@/types';

async function fetchTournaments(): Promise<Tournament[]> {
  const { data } = await apiClient.get<Tournament[]>('/api/tournaments');
  return data;
}

export function useTournaments() {
  return useQuery({
    queryKey: queryKeys.tournaments.all,
    queryFn: fetchTournaments,
  });
}
