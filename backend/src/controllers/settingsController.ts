import { Response } from 'express';
import { TournamentCategory } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { tournamentPointService } from '../services/TournamentPointService';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { handleError } from '../lib/errorHandler';

// Schema for updating point configuration
const pointConfigSchema = z.object({
  category: z.enum(['OPEN_250', 'OPEN_500', 'OPEN_1000', 'MASTERS']),
  points: z.record(z.string(), z.number().min(0)),
});

// Schema for tiebreaker settings
const tiebreakerSettingsSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  tertiary: z.string(),
  pointsPerWin: z.number().min(1).max(10),
  pointsPerDraw: z.number().min(0).max(10),
  seasonYear: z.number().int().min(2020).max(2099).optional(),
});

/**
 * Admin only: Get all point configurations
 * Protected by adminMiddleware in routes
 */
export const getPointConfigurations = async (req: AuthRequest, res: Response) => {
  try {
    const configs = await tournamentPointService.getAllPointConfigurations(req.userId!);
    res.json(configs);
  } catch (error) {
    handleError(res, error, 'Settings operation');
  }
};

/**
 * Admin only: Get point configuration for a specific category
 * Protected by adminMiddleware in routes
 */
export const getPointConfiguration = async (req: AuthRequest, res: Response) => {
  try {
    const { category } = req.params;

    if (!['OPEN_250', 'OPEN_500', 'OPEN_1000', 'MASTERS'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const config = await tournamentPointService.getPointConfiguration(
      req.userId!,
      category as TournamentCategory
    );

    res.json(config);
  } catch (error) {
    handleError(res, error, 'Settings operation');
  }
};

/**
 * Admin only: Save point configuration for a category
 * Protected by adminMiddleware in routes
 */
export const savePointConfiguration = async (req: AuthRequest, res: Response) => {
  try {
    const data = pointConfigSchema.parse(req.body);

    // Convert string keys to numbers
    const points: Record<number, number> = {};
    for (const [key, value] of Object.entries(data.points)) {
      points[parseInt(key)] = value;
    }

    await tournamentPointService.savePointConfiguration(
      req.userId!,
      data.category as TournamentCategory,
      points
    );

    res.json({ message: 'Configuration saved successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    handleError(res, error, 'Settings operation');
  }
};

/**
 * Get tiebreaker settings
 */
export const getTiebreakerSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.userSettings.findUnique({
      where: { userId: req.userId! },
    });

    if (!settings) {
      // Return defaults
      return res.json({
        primary: 'setDiff',
        secondary: 'gameDiff',
        tertiary: 'gamesWon',
        pointsPerWin: 2,
        pointsPerDraw: 1,
        seasonYear: new Date().getFullYear(),
      });
    }

    res.json({
      primary: settings.tiebreakerPrimary,
      secondary: settings.tiebreakerSecondary,
      tertiary: settings.tiebreakerTertiary,
      pointsPerWin: settings.pointsPerWin,
      pointsPerDraw: settings.pointsPerDraw,
      seasonYear: settings.seasonYear,
    });
  } catch (error) {
    handleError(res, error, 'Settings operation');
  }
};

/**
 * Save tiebreaker settings
 */
export const saveTiebreakerSettings = async (req: AuthRequest, res: Response) => {
  try {
    const data = tiebreakerSettingsSchema.parse(req.body);

    await prisma.userSettings.upsert({
      where: { userId: req.userId! },
      update: {
        tiebreakerPrimary: data.primary,
        tiebreakerSecondary: data.secondary,
        tiebreakerTertiary: data.tertiary,
        pointsPerWin: data.pointsPerWin,
        pointsPerDraw: data.pointsPerDraw,
        ...(data.seasonYear !== undefined && { seasonYear: data.seasonYear }),
      },
      create: {
        userId: req.userId!,
        tiebreakerPrimary: data.primary,
        tiebreakerSecondary: data.secondary,
        tiebreakerTertiary: data.tertiary,
        pointsPerWin: data.pointsPerWin,
        pointsPerDraw: data.pointsPerDraw,
        seasonYear: data.seasonYear ?? new Date().getFullYear(),
      },
    });

    res.json({ message: 'Tiebreaker settings saved successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    handleError(res, error, 'Settings operation');
  }
};

/**
 * Admin only: Get overview stats for the admin dashboard
 */
export const getAdminStats = async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalPlayers,
      createdCount,
      inProgressCount,
      phase1CompleteCount,
      phase2CompleteCount,
      finishedCount,
      totalMatchesPlayed,
      recentTournaments,
      topPlayers,
    ] = await Promise.all([
      prisma.player.count(),
      prisma.tournament.count({ where: { status: 'CREATED' } }),
      prisma.tournament.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.tournament.count({ where: { status: 'PHASE_1_COMPLETE' } }),
      prisma.tournament.count({ where: { status: 'PHASE_2_COMPLETE' } }),
      prisma.tournament.count({ where: { status: 'FINISHED' } }),
      prisma.match.count({ where: { status: 'COMPLETED' } }),
      prisma.tournament.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, date: true, status: true, category: true, type: true },
      }),
      prisma.player.findMany({
        take: 3,
        include: { stats: true },
        orderBy: { stats: { tournamentPoints: 'desc' } },
      }),
    ]);

    res.json({
      totalPlayers,
      tournaments: {
        created: createdCount,
        inProgress: inProgressCount + phase1CompleteCount + phase2CompleteCount,
        finished: finishedCount,
      },
      totalMatchesPlayed,
      recentTournaments,
      topPlayers: topPlayers.map((p, i) => ({
        rank: i + 1,
        id: p.id,
        name: p.name,
        points: p.stats?.tournamentPoints ?? 0,
      })),
    });
  } catch (error) {
    handleError(res, error, 'Admin stats');
  }
};
