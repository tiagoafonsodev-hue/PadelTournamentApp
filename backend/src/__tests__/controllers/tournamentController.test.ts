import { Response } from 'express';
import { mockPrisma } from '../setup';
import { getTournaments, getTournamentById } from '../../controllers/tournamentController';
import { AuthRequest } from '../../middleware/auth';

// Import setup to initialize mocks
import '../setup';

describe('TournamentController', () => {
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

  describe('getTournaments', () => {
    it('should return tournaments scoped to userId', async () => {
      const mockTournaments = [
        {
          id: 't1',
          name: 'Tournament 1',
          type: 'ROUND_ROBIN',
          status: 'IN_PROGRESS',
          _count: { players: 8, matches: 6 },
        },
      ];

      (mockPrisma.tournament.findMany as jest.Mock).mockResolvedValue(mockTournaments);

      await getTournaments(mockReq as AuthRequest, mockRes as Response);

      expect(mockPrisma.tournament.findMany).toHaveBeenCalledWith({
        where: { userId: 'test-user-id' },
        select: expect.objectContaining({
          id: true,
          name: true,
          type: true,
          status: true,
        }),
        orderBy: { createdAt: 'desc' },
      });

      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe('getTournamentById', () => {
    it('should return tournament with matches and players', async () => {
      mockReq.params = { id: 't1' };

      const mockTournament = {
        id: 't1',
        name: 'Tournament 1',
        userId: 'test-user-id',
        type: 'ROUND_ROBIN',
        status: 'IN_PROGRESS',
        players: [],
        matches: [],
      };

      (mockPrisma.tournament.findFirst as jest.Mock).mockResolvedValue(mockTournament);

      await getTournamentById(mockReq as AuthRequest, mockRes as Response);

      expect(mockPrisma.tournament.findFirst).toHaveBeenCalledWith({
        where: { id: 't1', userId: 'test-user-id' },
        include: expect.objectContaining({
          players: expect.any(Object),
          matches: expect.any(Object),
        }),
      });

      expect(jsonMock).toHaveBeenCalledWith(mockTournament);
    });

    it('should return 404 when tournament not found', async () => {
      mockReq.params = { id: 'non-existent' };

      (mockPrisma.tournament.findFirst as jest.Mock).mockResolvedValue(null);

      await getTournamentById(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Tournament not found' });
    });
  });
});
