import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export interface TeamStanding {
  player1Id: string;
  player2Id: string;
  player1?: { id: string; name: string };
  player2?: { id: string; name: string };
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  points: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
  groupNumber?: number;
  groupPosition?: number;
  position?: number;
  tournamentPointsAwarded?: number;
  bonusPoints?: number;
}

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
  });
}

// Hook to fetch final standings (for Final Classification modal)
export function useFinalStandings(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: [...queryKeys.tournaments.standings(id), 'final'],
    queryFn: () => fetchTournamentStandings(id, true),
    enabled: !!id && enabled,
  });
}
