import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { matchResultService } from '../services/MatchResultService';

const prisma = new PrismaClient();

const matchResultSchema = z.object({
  team1Score: z.number().min(0),
  team2Score: z.number().min(0),
});

export const submitMatchResult = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = matchResultSchema.parse(req.body);

    // Verify match belongs to user's tournament
    const match = await prisma.match.findFirst({
      where: { id },
      include: { tournament: true },
    });

    if (!match || match.tournament.userId !== req.userId!) {
      return res.status(404).json({ error: 'Match not found' });
    }

    await matchResultService.submitMatchResult(id, data);

    const updatedMatch = await prisma.match.findUnique({
      where: { id },
      include: {
        player1: true,
        player2: true,
        player3: true,
        player4: true,
      },
    });

    res.json(updatedMatch);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    if (error.message) {
      return res.status(400).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
