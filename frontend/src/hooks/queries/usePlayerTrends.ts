import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { TournamentCategory } from '@/types';

export interface TournamentTrend {
  date: string;
  category: TournamentCategory;
  position: number;
  pointsEarned: number;
  cumulativePoints: number;
}

export interface MonthlyTrend {
  month: string;
  points: number;
  tournaments: number;
  wins: number;
}

interface PlayerTrendsResponse {
  perTournament: TournamentTrend[];
  monthly: MonthlyTrend[];
}

async function fetchPlayerTrends(playerId: string): Promise<PlayerTrendsResponse> {
  const { data } = await apiClient.get<PlayerTrendsResponse>(
    `/api/players/${playerId}/trends`
  );
  return data;
}

export function usePlayerTrends(playerId: string) {
  return useQuery({
    queryKey: queryKeys.players.trends(playerId),
    queryFn: () => fetchPlayerTrends(playerId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!playerId,
  });
}
