import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { UserWithDetails, UserRole } from '@/types';

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  playerId?: string;
}

async function createUser(input: CreateUserInput): Promise<UserWithDetails> {
  const { data } = await apiClient.post<{ user: UserWithDetails }>('/api/auth/users', input);
  return data.user;
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
