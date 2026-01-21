'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useToast } from './ToastProvider';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

interface MatchCompletedEvent {
  tournamentId: string;
  matchId: string;
}

interface PhaseAdvancedEvent {
  tournamentId: string;
  phase: number;
}

interface TournamentFinishedEvent {
  tournamentId: string;
  name: string;
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    let userData: { id: string };
    try {
      userData = JSON.parse(userStr);
    } catch {
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      socketInstance.emit('join', userData.id);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('match:completed', (data: MatchCompletedEvent) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tournaments.detail(data.tournamentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tournaments.standings(data.tournamentId),
      });
      showToast('Match result updated', 'info');
    });

    socketInstance.on('tournament:phase-advanced', (data: PhaseAdvancedEvent) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tournaments.detail(data.tournamentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tournaments.standings(data.tournamentId),
      });
      showToast(`Tournament advanced to Phase ${data.phase}`, 'success');
    });

    socketInstance.on('tournament:finished', (data: TournamentFinishedEvent) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tournaments.detail(data.tournamentId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.players.leaderboard });
      showToast(`Tournament "${data.name}" completed!`, 'success');
    });

    socketInstance.on('player:stats-updated', () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.players.leaderboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.players.all });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [queryClient, showToast]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
