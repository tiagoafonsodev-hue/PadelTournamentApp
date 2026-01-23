import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreatePlayer } from '../useCreatePlayer';
import apiClient from '@/lib/api-client';
import { Player } from '@/types';

jest.mock('@/lib/api-client');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('useCreatePlayer', () => {
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

  it('should create player successfully', async () => {
    const mockPlayer: Player = {
      id: '1',
            name: 'New Player',
      email: 'newplayer@test.com',
      phoneNumber: '123456789',
      createdAt: '2024-01-01T00:00:00Z',
    };

    mockApiClient.post.mockResolvedValue({ data: mockPlayer });

    const { result } = renderHook(() => useCreatePlayer(), { wrapper });

    result.current.mutate({
      name: 'New Player',
      email: 'newplayer@test.com',
      phoneNumber: '123456789',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockPlayer);
    expect(mockApiClient.post).toHaveBeenCalledWith('/api/players', {
      name: 'New Player',
      email: 'newplayer@test.com',
      phoneNumber: '123456789',
    });
  });

  it('should create player with only name', async () => {
    const mockPlayer: Player = {
      id: '1',
            name: 'Player Name',
      createdAt: '2024-01-01T00:00:00Z',
    };

    mockApiClient.post.mockResolvedValue({ data: mockPlayer });

    const { result } = renderHook(() => useCreatePlayer(), { wrapper });

    result.current.mutate({
      name: 'Player Name',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockPlayer);
    expect(mockApiClient.post).toHaveBeenCalledWith('/api/players', {
      name: 'Player Name',
    });
  });

  it('should invalidate players query on success', async () => {
    const mockPlayer: Player = {
      id: '1',
            name: 'New Player',
      createdAt: '2024-01-01T00:00:00Z',
    };

    mockApiClient.post.mockResolvedValue({ data: mockPlayer });

    const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreatePlayer(), { wrapper });

    result.current.mutate({
      name: 'New Player',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['players'],
    });
  });

  it('should handle error when creating player', async () => {
    const error = new Error('Failed to create player');
    mockApiClient.post.mockRejectedValue(error);

    const { result } = renderHook(() => useCreatePlayer(), { wrapper });

    result.current.mutate({
      name: 'New Player',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});
