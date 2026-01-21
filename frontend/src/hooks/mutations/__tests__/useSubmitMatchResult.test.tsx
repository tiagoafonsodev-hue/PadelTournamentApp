import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSubmitMatchResult } from '../useSubmitMatchResult';
import apiClient from '@/lib/api-client';
import { Match, MatchStatus } from '@/types';

jest.mock('@/lib/api-client');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('useSubmitMatchResult', () => {
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

  it('should submit match result successfully', async () => {
    const mockMatch: Match = {
      id: 'match1',
      tournamentId: 'tournament1',
      phase: 1,
      roundNumber: 1,
      matchNumber: 1,
      player1Id: 'p1',
      player2Id: 'p2',
      player3Id: 'p3',
      player4Id: 'p4',
      team1Score: 6,
      team2Score: 4,
      winnerTeam: 1,
      status: MatchStatus.COMPLETED,
    };

    mockApiClient.post.mockResolvedValue({ data: mockMatch });

    const { result } = renderHook(() => useSubmitMatchResult(), { wrapper });

    result.current.mutate({
      matchId: 'match1',
      tournamentId: 'tournament1',
      result: {
        team1Score: 6,
        team2Score: 4,
      },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockMatch);
    expect(mockApiClient.post).toHaveBeenCalledWith('/api/matches/match1/result', {
      team1Score: 6,
      team2Score: 4,
    });
  });

  it('should invalidate tournament queries on success', async () => {
    const mockMatch: Match = {
      id: 'match1',
      tournamentId: 'tournament1',
      phase: 1,
      roundNumber: 1,
      matchNumber: 1,
      player1Id: 'p1',
      player2Id: 'p2',
      player3Id: 'p3',
      player4Id: 'p4',
      team1Score: 6,
      team2Score: 4,
      winnerTeam: 1,
      status: MatchStatus.COMPLETED,
    };

    mockApiClient.post.mockResolvedValue({ data: mockMatch });

    const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useSubmitMatchResult(), { wrapper });

    result.current.mutate({
      matchId: 'match1',
      tournamentId: 'tournament1',
      result: {
        team1Score: 6,
        team2Score: 4,
      },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Should invalidate tournament detail, standings, and leaderboard
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['tournaments', 'tournament1'],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['tournaments', 'tournament1', 'standings'],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['players', 'leaderboard'],
    });
  });

  it('should handle error when submitting match result', async () => {
    const error = new Error('Failed to submit match result');
    mockApiClient.post.mockRejectedValue(error);

    const { result } = renderHook(() => useSubmitMatchResult(), { wrapper });

    result.current.mutate({
      matchId: 'match1',
      tournamentId: 'tournament1',
      result: {
        team1Score: 6,
        team2Score: 4,
      },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});
