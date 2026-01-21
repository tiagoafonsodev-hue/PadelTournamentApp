import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { Tournament, TournamentType, TournamentCategory } from '@/types';

interface CreateTournamentInput {
  name: string;
  type: TournamentType;
  category?: TournamentCategory;
  playerCount: number;
  playerIds: string[];
  teams: { player1Id: string; player2Id: string }[];
  allowTies?: boolean;
}

async function createTournament(input: CreateTournamentInput): Promise<Tournament> {
  const { data } = await apiClient.post<Tournament>('/api/tournaments', input);
  return data;
}

export function useCreateTournament() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTournament,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.all });
    },
  });
}
