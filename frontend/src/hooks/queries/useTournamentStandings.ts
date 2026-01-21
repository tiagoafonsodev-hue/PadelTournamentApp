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
  position?: number;
}

async function fetchTournamentStandings(id: string): Promise<TeamStanding[]> {
  const { data } = await apiClient.get<TeamStanding[]>(`/api/tournaments/${id}/standings`);
  return data;
}

export function useTournamentStandings(id: string) {
  return useQuery({
    queryKey: queryKeys.tournaments.standings(id),
    queryFn: () => fetchTournamentStandings(id),
    enabled: !!id,
  });
}
