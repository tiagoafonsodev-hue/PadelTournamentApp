import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const playerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phoneNumber: z.string().optional().or(z.literal('')),
});

export const createPlayer = async (req: AuthRequest, res: Response) => {
  try {
    const data = playerSchema.parse(req.body);

    const player = await prisma.player.create({
      data: {
        userId: req.userId!,
        name: data.name,
        email: data.email || null,
        phoneNumber: data.phoneNumber || null,
      },
    });

    // Create initial stats
    await prisma.playerStats.create({
      data: { playerId: player.id },
    });

    res.json(player);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

export const getPlayers = async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;

    const players = await prisma.player.findMany({
      where: {
        userId: req.userId!,
        ...(search && {
          name: { contains: search as string, mode: 'insensitive' },
        }),
      },
      include: { stats: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(players);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const updatePlayer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = playerSchema.parse(req.body);

    const player = await prisma.player.findFirst({
      where: { id, userId: req.userId! },
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const updated = await prisma.player.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email || null,
        phoneNumber: data.phoneNumber || null,
      },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

export const deletePlayer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const player = await prisma.player.findFirst({
      where: { id, userId: req.userId! },
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    await prisma.player.delete({ where: { id } });

    res.json({ message: 'Player deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const players = await prisma.player.findMany({
      where: { userId: req.userId! },
      include: { stats: true },
      orderBy: {
        stats: {
          tournamentPoints: 'desc',
        },
      },
    });

    res.json(players);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
