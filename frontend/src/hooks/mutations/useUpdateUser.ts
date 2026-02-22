import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { UserWithDetails, UserRole } from '@/types';

interface UpdateUserInput {
  id: string;
  name?: string;
  role?: UserRole;
  playerId?: string | null;
}

async function updateUser({ id, ...body }: UpdateUserInput): Promise<UserWithDetails> {
  const { data } = await apiClient.put<UserWithDetails>(`/api/auth/users/${id}`, body);
  return data;
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
