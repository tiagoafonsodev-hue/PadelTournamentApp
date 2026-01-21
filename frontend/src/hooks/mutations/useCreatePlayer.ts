import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { Player } from '@/types';

interface CreatePlayerInput {
  name: string;
  email?: string;
  phoneNumber?: string;
}

async function createPlayer(input: CreatePlayerInput): Promise<Player> {
  const { data } = await apiClient.post<Player>('/api/players', input);
  return data;
}

export function useCreatePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPlayer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.players.all });
    },
  });
}
