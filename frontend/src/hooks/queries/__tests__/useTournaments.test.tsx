import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTournaments } from '../useTournaments';
import apiClient from '@/lib/api-client';
import { Tournament, TournamentType, TournamentStatus, TournamentCategory } from '@/types';

jest.mock('@/lib/api-client');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('useTournaments', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch tournaments successfully', async () => {
    const mockTournaments: Tournament[] = [
      {
        id: '1',
        userId: 'user1',
        name: 'Tournament 1',
        type: TournamentType.ROUND_ROBIN,
        category: TournamentCategory.OPEN_250,
        status: TournamentStatus.IN_PROGRESS,
        currentPhase: 1,
        maxPhases: 1,
        allowTies: false,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        userId: 'user1',
        name: 'Tournament 2',
        type: TournamentType.KNOCKOUT,
        category: TournamentCategory.OPEN_500,
        status: TournamentStatus.FINISHED,
        currentPhase: 1,
        maxPhases: 1,
        allowTies: false,
        createdAt: '2024-01-02T00:00:00Z',
        finishedAt: '2024-01-03T00:00:00Z',
      },
    ];

    mockApiClient.get.mockResolvedValue({ data: mockTournaments });

    const { result } = renderHook(() => useTournaments(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockTournaments);
    expect(mockApiClient.get).toHaveBeenCalledWith('/api/tournaments');
  });

  it('should handle error when fetching tournaments', async () => {
    const error = new Error('Failed to fetch tournaments');
    mockApiClient.get.mockRejectedValue(error);

    const { result } = renderHook(() => useTournaments(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });

  it('should return loading state initially', () => {
    mockApiClient.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useTournaments(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });
});
