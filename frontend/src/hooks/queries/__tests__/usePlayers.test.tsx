import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePlayers } from '../usePlayers';
import apiClient from '@/lib/api-client';
import { Player } from '@/types';

jest.mock('@/lib/api-client');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('usePlayers', () => {
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

  it('should fetch players successfully', async () => {
    const mockPlayers: Player[] = [
      {
        id: '1',
        userId: 'user1',
        name: 'Player 1',
        email: 'player1@test.com',
        phoneNumber: '123456789',
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        userId: 'user1',
        name: 'Player 2',
        createdAt: '2024-01-01T00:00:00Z',
      },
    ];

    mockApiClient.get.mockResolvedValue({ data: mockPlayers });

    const { result } = renderHook(() => usePlayers(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockPlayers);
    expect(mockApiClient.get).toHaveBeenCalledWith('/api/players', expect.objectContaining({}));
  });

  it('should fetch players with search query', async () => {
    const mockPlayers: Player[] = [
      {
        id: '1',
        userId: 'user1',
        name: 'Player 1',
        createdAt: '2024-01-01T00:00:00Z',
      },
    ];

    mockApiClient.get.mockResolvedValue({ data: mockPlayers });

    const { result } = renderHook(() => usePlayers('Player'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockPlayers);
    expect(mockApiClient.get).toHaveBeenCalledWith('/api/players', { params: { search: 'Player' } });
  });

  it('should handle error when fetching players', async () => {
    const error = new Error('Failed to fetch players');
    mockApiClient.get.mockRejectedValue(error);

    const { result } = renderHook(() => usePlayers(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});
