import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { handleError } from '../lib/errorHandler';

const playerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phoneNumber: z.string().optional().or(z.literal('')),
});

const profileUpdateSchema = z.object({
  email: z.string().email().optional().or(z.literal('')),
  phoneNumber: z.string().optional().or(z.literal('')),
});

// Admin only: Create a new player
export const createPlayer = async (req: AuthRequest, res: Response) => {
  try {
    const data = playerSchema.parse(req.body);

    const player = await prisma.player.create({
      data: {
        name: data.name,
        email: data.email || null,
        phoneNumber: data.phoneNumber || null,
      },
    });

    // Create initial stats
    await prisma.playerStats.create({
      data: { playerId: player.id },
    });

    const createdPlayer = await prisma.player.findUnique({
      where: { id: player.id },
      include: { stats: true },
    });

    res.json(createdPlayer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    handleError(res, error, 'Create player');
  }
};

// All users: Get all players (global) with optional pagination
export const getPlayers = async (req: AuthRequest, res: Response) => {
  try {
    const { search, page, limit } = req.query;

    const whereClause = search
      ? { name: { contains: search as string, mode: 'insensitive' as const } }
      : undefined;

    // If pagination params provided, use pagination
    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
      const skip = (pageNum - 1) * limitNum;

      const [players, total] = await Promise.all([
        prisma.player.findMany({
          where: whereClause,
          include: { stats: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.player.count({ where: whereClause }),
      ]);

      return res.json({
        data: players,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }

    // Fallback: return all players (backwards compatible)
    const players = await prisma.player.findMany({
      where: whereClause,
      include: { stats: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(players);
  } catch (error) {
    handleError(res, error, 'Get players');
  }
};

// Admin: Update any player
// Player: Update own profile (email/phone only)
export const updatePlayer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const player = await prisma.player.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Check permissions
    const isAdmin = req.userRole === 'ADMIN';
    const isOwnProfile = req.playerId === id;

    if (!isAdmin && !isOwnProfile) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (isAdmin) {
      // Admin can update everything
      const data = playerSchema.parse(req.body);
      const updated = await prisma.player.update({
        where: { id },
        data: {
          name: data.name,
          email: data.email || null,
          phoneNumber: data.phoneNumber || null,
        },
        include: { stats: true },
      });
      res.json(updated);
    } else {
      // Player can only update email and phone
      const data = profileUpdateSchema.parse(req.body);
      const updated = await prisma.player.update({
        where: { id },
        data: {
          email: data.email || null,
          phoneNumber: data.phoneNumber || null,
        },
        include: { stats: true },
      });
      res.json(updated);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    handleError(res, error, 'Update player', { playerId: req.params.id });
  }
};

// Admin only: Delete a player
export const deletePlayer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const player = await prisma.player.findUnique({
      where: { id },
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    await prisma.player.delete({ where: { id } });

    res.json({ message: 'Player deleted' });
  } catch (error) {
    handleError(res, error, 'Delete player', { playerId: req.params.id });
  }
};

// All users: Get global leaderboard
export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const players = await prisma.player.findMany({
      include: { stats: true },
      orderBy: {
        stats: {
          tournamentPoints: 'desc',
        },
      },
    });

    res.json(players);
  } catch (error) {
    handleError(res, error, 'Get leaderboard');
  }
};

// Get single player by ID
export const getPlayer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const player = await prisma.player.findUnique({
      where: { id },
      include: { stats: true },
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json(player);
  } catch (error) {
    handleError(res, error, 'Get player', { playerId: req.params.id });
  }
};

// Admin only: Reset leaderboard (clear tournament results and points)
export const resetLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    // Delete all tournament results
    await prisma.tournamentResult.deleteMany({});

    // Reset tournament points for all players
    await prisma.playerStats.updateMany({
      data: {
        tournamentPoints: 0,
      },
    });

    res.json({ message: 'Leaderboard reset successfully' });
  } catch (error) {
    handleError(res, error, 'Reset leaderboard');
  }
};

// Get player tournament history with pagination
export const getPlayerHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));

    const [results, total] = await Promise.all([
      prisma.tournamentResult.findMany({
        where: { playerId: id },
        include: {
          tournament: {
            select: { id: true, name: true, date: true, type: true, category: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.tournamentResult.count({ where: { playerId: id } }),
    ]);

    res.json({
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    handleError(res, error, 'Get player history', { playerId: req.params.id });
  }
};

// Get player statistics trends
export const getPlayerTrends = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Get all tournament results for this player, ordered by date
    const results = await prisma.tournamentResult.findMany({
      where: { playerId: id },
      include: { tournament: { select: { date: true, category: true } } },
      orderBy: { createdAt: 'asc' },
    });

    // Build per-tournament trend (cumulative points)
    let cumulativePoints = 0;
    const perTournament = results.map(r => {
      cumulativePoints += r.pointsAwarded + r.bonusPoints;
      return {
        date: r.tournament.date,
        category: r.category,
        position: r.finalPosition,
        pointsEarned: r.pointsAwarded + r.bonusPoints,
        cumulativePoints,
      };
    });

    // Build monthly aggregation
    const monthlyMap = new Map<string, { points: number; tournaments: number; wins: number }>();
    for (const r of results) {
      const month = r.tournament.date.toISOString().slice(0, 7); // YYYY-MM
      const existing = monthlyMap.get(month) || { points: 0, tournaments: 0, wins: 0 };
      existing.points += r.pointsAwarded + r.bonusPoints;
      existing.tournaments += 1;
      if (r.finalPosition === 1) existing.wins += 1;
      monthlyMap.set(month, existing);
    }

    const monthly = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      ...data,
    }));

    res.json({ perTournament, monthly });
  } catch (error) {
    handleError(res, error, 'Get player trends', { playerId: req.params.id });
  }
};

// Admin only: Reset all player stats
export const resetPlayerStats = async (req: AuthRequest, res: Response) => {
  try {
    // Reset all player stats to zero
    await prisma.playerStats.updateMany({
      data: {
        totalMatches: 0,
        matchesWon: 0,
        matchesLost: 0,
        matchesDrawn: 0,
        setsWon: 0,
        setsLost: 0,
        gamesWon: 0,
        gamesLost: 0,
        tournamentsPlayed: 0,
        tournamentsWon: 0,
        tournamentPoints: 0,
        winPercentage: 0,
      },
    });

    // Delete all tournament results
    await prisma.tournamentResult.deleteMany({});

    res.json({ message: 'Player stats reset successfully' });
  } catch (error) {
    handleError(res, error, 'Reset player stats');
  }
};
