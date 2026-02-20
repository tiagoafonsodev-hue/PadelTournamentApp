import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { TeamStanding } from '@/types';

export type { TeamStanding };

async function fetchTournamentStandings(id: string, final?: boolean): Promise<TeamStanding[]> {
  const url = final
    ? `/api/tournaments/${id}/standings?final=true`
    : `/api/tournaments/${id}/standings`;
  const { data } = await apiClient.get<TeamStanding[]>(url);
  return data;
}

export function useTournamentStandings(id: string) {
  return useQuery({
    queryKey: queryKeys.tournaments.standings(id),
    queryFn: () => fetchTournamentStandings(id),
    enabled: !!id,
    staleTime: 1000 * 30, // 30 seconds (real-time during matches)
  });
}

// Hook to fetch final standings (for Final Classification modal)
export function useFinalStandings(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: [...queryKeys.tournaments.standings(id), 'final'],
    queryFn: () => fetchTournamentStandings(id, true),
    enabled: !!id && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes (final standings don't change)
  });
}
