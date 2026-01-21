import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { Match, MatchResultInput } from '@/types';

interface SubmitMatchResultParams {
  matchId: string;
  tournamentId: string;
  result: MatchResultInput;
}

async function submitMatchResult({ matchId, result }: SubmitMatchResultParams): Promise<Match> {
  const { data } = await apiClient.post<Match>(`/api/matches/${matchId}/result`, result);
  return data;
}

export function useSubmitMatchResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitMatchResult,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tournaments.detail(variables.tournamentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tournaments.standings(variables.tournamentId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.players.leaderboard });
    },
  });
}
