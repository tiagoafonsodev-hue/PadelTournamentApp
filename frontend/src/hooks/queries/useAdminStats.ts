import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { AdminStats } from '@/types';

async function fetchAdminStats(): Promise<AdminStats> {
  const { data } = await apiClient.get<AdminStats>('/api/settings/stats');
  return data;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: fetchAdminStats,
    staleTime: 1000 * 60, // 1 minute
  });
}
