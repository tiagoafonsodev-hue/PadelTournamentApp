import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

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
    res.status(500).json({ error: 'Server error' });
  }
};

// All users: Get all players (global)
export const getPlayers = async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;

    const players = await prisma.player.findMany({
      where: search
        ? { name: { contains: search as string, mode: 'insensitive' } }
        : undefined,
      include: { stats: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(players);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
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
    res.status(500).json({ error: 'Server error' });
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
    res.status(500).json({ error: 'Server error' });
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
    res.status(500).json({ error: 'Server error' });
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
    res.status(500).json({ error: 'Server error' });
  }
};
