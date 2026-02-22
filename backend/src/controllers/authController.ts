import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import logger from '../lib/logger';
import { handleError } from '../lib/errorHandler';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['ADMIN', 'PLAYER']).optional().default('PLAYER'),
  playerId: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['ADMIN', 'PLAYER']).optional(),
  playerId: z.string().nullable().optional(),
});

// Self-registration (creates PLAYER by default)
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with PLAYER role by default
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: 'PLAYER',
      },
    });

    // Generate token with role
    const token = jwt.sign(
      { userId: user.id, role: user.role, playerId: user.playerId },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        playerId: user.playerId,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token with role
    const token = jwt.sign(
      { userId: user.id, role: user.role, playerId: user.playerId },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        playerId: user.playerId,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin creates user (can specify role and link to player)
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const data = createUserSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // If playerId provided, verify player exists and isn't already linked
    if (data.playerId) {
      const player = await prisma.player.findUnique({
        where: { id: data.playerId },
        include: { user: true },
      });

      if (!player) {
        return res.status(400).json({ error: 'Player not found' });
      }

      if (player.user) {
        return res.status(400).json({ error: 'Player already linked to another user' });
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: data.role,
        playerId: data.playerId,
      },
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        playerId: user.playerId,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    handleError(res, error, 'Create user');
  }
};

// Admin: list all users
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        playerId: true,
        createdAt: true,
        player: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    handleError(res, error, 'Get users');
  }
};

// Admin: update user (name, role, playerId)
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateUserSchema.parse(req.body);

    // Prevent admin from changing own role
    if (id === req.userId && data.role !== undefined) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    // If linking to a player, verify player exists and isn't already linked to another user
    if (data.playerId) {
      const player = await prisma.player.findUnique({
        where: { id: data.playerId },
        include: { user: true },
      });
      if (!player) {
        return res.status(400).json({ error: 'Player not found' });
      }
      if (player.user && player.user.id !== id) {
        return res.status(400).json({ error: 'Player already linked to another user' });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.playerId !== undefined && { playerId: data.playerId }),
      },
      select: { id: true, email: true, name: true, role: true, playerId: true, createdAt: true },
    });

    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    handleError(res, error, 'Update user');
  }
};

// Admin: delete user
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (id === req.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    handleError(res, error, 'Delete user');
  }
};

// Get current user info
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      include: {
        player: {
          include: { stats: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      playerId: user.playerId,
      player: user.player,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
