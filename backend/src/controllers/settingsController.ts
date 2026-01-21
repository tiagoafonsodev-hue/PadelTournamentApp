import { Response } from 'express';
import { TournamentCategory } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { tournamentPointService } from '../services/TournamentPointService';

// Schema for updating point configuration
const pointConfigSchema = z.object({
  category: z.enum(['OPEN_250', 'OPEN_500', 'OPEN_1000', 'MASTERS']),
  points: z.record(z.string(), z.number().min(0)),
});

/**
 * Get all point configurations for the current user
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
 * Get point configuration for a specific category
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
 * Save point configuration for a category
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
