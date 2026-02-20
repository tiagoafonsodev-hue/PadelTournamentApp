// Mock Prisma client for unit tests
import { jest } from '@jest/globals';

// Mock prisma client
export const mockPrisma = {
  tournament: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  player: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  playerStats: {
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  match: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
  },
  tournamentPlayer: {
    createMany: jest.fn(),
  },
  tournamentResult: {
    findMany: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
  },
  tournamentPointConfig: {
    findMany: jest.fn(),
  },
  $queryRaw: jest.fn(),
};

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}));

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
