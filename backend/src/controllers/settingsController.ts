import { Response } from 'express';
import { TournamentCategory } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { tournamentPointService } from '../services/TournamentPointService';
import prisma from '../lib/prisma';

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
    console.error(error);
    res.status(500).json({ error: 'Server error' });
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
    console.error(error);
    res.status(500).json({ error: 'Server error' });
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
    console.error(error);
    res.status(500).json({ error: 'Server error' });
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
      });
    }

    res.json({
      primary: settings.tiebreakerPrimary,
      secondary: settings.tiebreakerSecondary,
      tertiary: settings.tiebreakerTertiary,
      pointsPerWin: settings.pointsPerWin,
      pointsPerDraw: settings.pointsPerDraw,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
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
      },
      create: {
        userId: req.userId!,
        tiebreakerPrimary: data.primary,
        tiebreakerSecondary: data.secondary,
        tiebreakerTertiary: data.tertiary,
        pointsPerWin: data.pointsPerWin,
        pointsPerDraw: data.pointsPerDraw,
      },
    });

    res.json({ message: 'Tiebreaker settings saved successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
