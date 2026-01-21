import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { Player } from '@/types';

interface UpdatePlayerInput {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
}

async function updatePlayer({ id, ...input }: UpdatePlayerInput): Promise<Player> {
  const { data } = await apiClient.put<Player>(`/api/players/${id}`, input);
  return data;
}

export function useUpdatePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePlayer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.players.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.players.leaderboard });
    },
  });
}
