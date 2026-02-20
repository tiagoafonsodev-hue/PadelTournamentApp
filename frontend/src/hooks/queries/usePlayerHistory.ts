import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { TournamentResult, TournamentCategory, TournamentType } from '@/types';

interface TournamentSummary {
  id: string;
  name: string | null;
  date: string;
  type: TournamentType;
  category: TournamentCategory;
}

export interface PlayerHistoryResult extends TournamentResult {
  tournament: TournamentSummary;
}

interface PlayerHistoryResponse {
  data: PlayerHistoryResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function fetchPlayerHistory(playerId: string, page: number): Promise<PlayerHistoryResponse> {
  const { data } = await apiClient.get<PlayerHistoryResponse>(
    `/api/players/${playerId}/history?page=${page}&limit=10`
  );
  return data;
}

export function usePlayerHistory(playerId: string, page = 1) {
  return useQuery({
    queryKey: queryKeys.players.history(playerId, page),
    queryFn: () => fetchPlayerHistory(playerId, page),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!playerId,
  });
}
