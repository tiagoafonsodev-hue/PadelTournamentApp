import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { UserWithDetails } from '@/types';

async function fetchUsers(): Promise<UserWithDetails[]> {
  const { data } = await apiClient.get<UserWithDetails[]>('/api/auth/users');
  return data;
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 1000 * 30, // 30 seconds
  });
}
