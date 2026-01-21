// Tournament point awarding service
// Awards points to players based on final position when tournament finishes
// Includes bonus points: +1 point for each match won in the tournament

import { PrismaClient, TournamentCategory } from '@prisma/client';

const prisma = new PrismaClient();

// Default point configurations if none set by user
const DEFAULT_POINTS: Record<TournamentCategory, Record<number, number>> = {
  OPEN_250: {
    1: 7.5,
    2: 5,
    3: 3,
    4: 1,
  },
  OPEN_500: {
    1: 15,
    2: 12,
    3: 9,
    4: 6,
    5: 3,
    6: 1,
  },
  OPEN_1000: {
    1: 16.5,
    2: 13,
    3: 11,
    4: 9,
    5: 7,
    6: 5,
    7: 3,
    8: 1,
  },
  MASTERS: {
    1: 24.5,
    2: 21,
    3: 19,
    4: 17,
    5: 15,
    6: 13,
    7: 11,
    8: 9,
    9: 7,
    10: 5,
    11: 3,
    12: 1,
  },
};

interface PlayerPosition {
  playerId: string;
  position: number;
  matchesWon?: number; // Number of matches won in the tournament for bonus points
}

export class TournamentPointService {
  /**
   * Get points for a specific position in a category
   * First checks user's custom configuration, falls back to defaults
   */
  async getPointsForPosition(
    userId: string,
    category: TournamentCategory,
    position: number
  ): Promise<number> {
    // Try to get user's custom config
    const customConfig = await prisma.tournamentPointConfig.findUnique({
      where: {
        userId_category_position: {
          userId,
          category,
          position,
        },
      },
    });

    if (customConfig) {
      return customConfig.points;
    }

    // Fall back to defaults
    return DEFAULT_POINTS[category][position] || 0;
  }

  /**
   * Award points to all players in a finished tournament
   * Includes bonus points: +1 for each match won in the tournament
   */
  async awardTournamentPoints(
    tournamentId: string,
    finalPositions: PlayerPosition[]
  ): Promise<void> {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    // Get all point values for this category
    const pointsMap = new Map<number, number>();
    for (const { position } of finalPositions) {
      if (!pointsMap.has(position)) {
        const points = await this.getPointsForPosition(
          tournament.userId,
          tournament.category,
          position
        );
        pointsMap.set(position, points);
      }
    }

    // Process each player
    for (const { playerId, position, matchesWon = 0 } of finalPositions) {
      const basePoints = pointsMap.get(position) || 0;
      const bonusPoints = matchesWon; // +1 point per win
      const totalPoints = basePoints + bonusPoints;

      // Create tournament result record
      await prisma.tournamentResult.upsert({
        where: {
          tournamentId_playerId: {
            tournamentId,
            playerId,
          },
        },
        create: {
          tournamentId,
          playerId,
          finalPosition: position,
          pointsAwarded: basePoints,
          bonusPoints,
          category: tournament.category,
        },
        update: {
          finalPosition: position,
          pointsAwarded: basePoints,
          bonusPoints,
          category: tournament.category,
        },
      });

      // Update player's total tournament points
      await prisma.playerStats.upsert({
        where: { playerId },
        create: {
          playerId,
          tournamentPoints: totalPoints,
          tournamentsPlayed: 1,
          tournamentsWon: position === 1 ? 1 : 0,
        },
        update: {
          tournamentPoints: {
            increment: totalPoints,
          },
          tournamentsPlayed: {
            increment: 1,
          },
          tournamentsWon: position === 1 ? { increment: 1 } : undefined,
        },
      });
    }
  }

  /**
   * Recalculate total tournament points for a player
   * Useful if point configurations change
   */
  async recalculatePlayerPoints(playerId: string): Promise<number> {
    const results = await prisma.tournamentResult.findMany({
      where: { playerId },
    });

    const totalPoints = results.reduce((sum, r) => sum + r.pointsAwarded, 0);

    await prisma.playerStats.update({
      where: { playerId },
      data: { tournamentPoints: totalPoints },
    });

    return totalPoints;
  }

  /**
   * Get user's point configuration for a category
   */
  async getPointConfiguration(
    userId: string,
    category: TournamentCategory
  ): Promise<Record<number, number>> {
    const configs = await prisma.tournamentPointConfig.findMany({
      where: { userId, category },
      orderBy: { position: 'asc' },
    });

    if (configs.length === 0) {
      return DEFAULT_POINTS[category];
    }

    const result: Record<number, number> = {};
    for (const config of configs) {
      result[config.position] = config.points;
    }

    // Fill in any missing positions from defaults
    for (let pos = 1; pos <= 12; pos++) {
      if (!(pos in result)) {
        result[pos] = DEFAULT_POINTS[category][pos] || 0;
      }
    }

    return result;
  }

  /**
   * Save user's point configuration for a category
   */
  async savePointConfiguration(
    userId: string,
    category: TournamentCategory,
    points: Record<number, number>
  ): Promise<void> {
    // Delete existing configs for this category
    await prisma.tournamentPointConfig.deleteMany({
      where: { userId, category },
    });

    // Create new configs
    const configs = Object.entries(points).map(([position, pts]) => ({
      userId,
      category,
      position: parseInt(position),
      points: pts,
    }));

    await prisma.tournamentPointConfig.createMany({
      data: configs,
    });
  }

  /**
   * Get all point configurations for a user
   */
  async getAllPointConfigurations(
    userId: string
  ): Promise<Record<TournamentCategory, Record<number, number>>> {
    const result: Record<TournamentCategory, Record<number, number>> = {
      OPEN_250: await this.getPointConfiguration(userId, 'OPEN_250'),
      OPEN_500: await this.getPointConfiguration(userId, 'OPEN_500'),
      OPEN_1000: await this.getPointConfiguration(userId, 'OPEN_1000'),
      MASTERS: await this.getPointConfiguration(userId, 'MASTERS'),
    };

    return result;
  }
}

export const tournamentPointService = new TournamentPointService();
