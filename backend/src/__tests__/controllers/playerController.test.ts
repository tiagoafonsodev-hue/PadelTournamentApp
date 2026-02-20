import { Request, Response } from 'express';
import { mockPrisma } from '../setup';
import { getPlayers, getPlayerHistory, getPlayerTrends } from '../../controllers/playerController';
import { AuthRequest } from '../../middleware/auth';

// Import setup to initialize mocks
import '../setup';

describe('PlayerController', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRes = {
      json: jsonMock,
      status: statusMock,
    };
    mockReq = {
      userId: 'test-user-id',
      userRole: 'ADMIN',
      query: {},
      params: {},
    };
  });

  describe('getPlayers', () => {
    it('should return all players without pagination', async () => {
      const mockPlayers = [
        { id: '1', name: 'Player 1', stats: {} },
        { id: '2', name: 'Player 2', stats: {} },
      ];

      (mockPrisma.player.findMany as jest.Mock).mockResolvedValue(mockPlayers);

      await getPlayers(mockReq as AuthRequest, mockRes as Response);

      expect(mockPrisma.player.findMany).toHaveBeenCalledWith({
        where: undefined,
        include: { stats: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(jsonMock).toHaveBeenCalledWith(mockPlayers);
    });

    it('should return paginated players when page and limit provided', async () => {
      mockReq.query = { page: '2', limit: '10' };
      const mockPlayers = [{ id: '1', name: 'Player 1' }];

      (mockPrisma.player.findMany as jest.Mock).mockResolvedValue(mockPlayers);
      (mockPrisma.player.count as jest.Mock).mockResolvedValue(25);

      await getPlayers(mockReq as AuthRequest, mockRes as Response);

      expect(mockPrisma.player.findMany).toHaveBeenCalledWith({
        where: undefined,
        include: { stats: true },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10,
      });
      expect(jsonMock).toHaveBeenCalledWith({
        data: mockPlayers,
        pagination: {
          page: 2,
          limit: 10,
          total: 25,
          totalPages: 3,
        },
      });
    });

    it('should filter players by search term', async () => {
      mockReq.query = { search: 'John' };
      const mockPlayers = [{ id: '1', name: 'John Doe' }];

      (mockPrisma.player.findMany as jest.Mock).mockResolvedValue(mockPlayers);

      await getPlayers(mockReq as AuthRequest, mockRes as Response);

      expect(mockPrisma.player.findMany).toHaveBeenCalledWith({
        where: { name: { contains: 'John', mode: 'insensitive' } },
        include: { stats: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getPlayerHistory', () => {
    it('should return paginated tournament history', async () => {
      mockReq.params = { id: 'player-1' };
      mockReq.query = { page: '1', limit: '10' };

      const mockResults = [
        {
          id: 'result-1',
          playerId: 'player-1',
          finalPosition: 1,
          pointsAwarded: 100,
          bonusPoints: 10,
          tournament: { id: 't1', name: 'Tournament 1', date: new Date() },
        },
      ];

      (mockPrisma.tournamentResult.findMany as jest.Mock).mockResolvedValue(mockResults);
      (mockPrisma.tournamentResult.count as jest.Mock).mockResolvedValue(1);

      await getPlayerHistory(mockReq as AuthRequest, mockRes as Response);

      expect(mockPrisma.tournamentResult.findMany).toHaveBeenCalledWith({
        where: { playerId: 'player-1' },
        include: {
          tournament: {
            select: { id: true, name: true, date: true, type: true, category: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });

      expect(jsonMock).toHaveBeenCalledWith({
        data: mockResults,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });
  });

  describe('getPlayerTrends', () => {
    it('should return per-tournament and monthly trends', async () => {
      mockReq.params = { id: 'player-1' };

      const mockResults = [
        {
          id: 'result-1',
          playerId: 'player-1',
          finalPosition: 1,
          pointsAwarded: 100,
          bonusPoints: 10,
          category: 'OPEN_250',
          tournament: { date: new Date('2025-01-15'), category: 'OPEN_250' },
        },
        {
          id: 'result-2',
          playerId: 'player-1',
          finalPosition: 2,
          pointsAwarded: 75,
          bonusPoints: 5,
          category: 'OPEN_500',
          tournament: { date: new Date('2025-01-20'), category: 'OPEN_500' },
        },
      ];

      (mockPrisma.tournamentResult.findMany as jest.Mock).mockResolvedValue(mockResults);

      await getPlayerTrends(mockReq as AuthRequest, mockRes as Response);

      expect(mockPrisma.tournamentResult.findMany).toHaveBeenCalledWith({
        where: { playerId: 'player-1' },
        include: { tournament: { select: { date: true, category: true } } },
        orderBy: { createdAt: 'asc' },
      });

      expect(jsonMock).toHaveBeenCalled();
      const response = jsonMock.mock.calls[0][0];

      expect(response.perTournament).toHaveLength(2);
      expect(response.perTournament[0].cumulativePoints).toBe(110);
      expect(response.perTournament[1].cumulativePoints).toBe(190);

      expect(response.monthly).toHaveLength(1);
      expect(response.monthly[0].month).toBe('2025-01');
      expect(response.monthly[0].points).toBe(190);
      expect(response.monthly[0].tournaments).toBe(2);
      expect(response.monthly[0].wins).toBe(1);
    });
  });
});
