import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { matchResultService } from '../services/MatchResultService';
import prisma from '../lib/prisma';

const matchResultSchema = z.object({
  team1Score: z.number().min(0),
  team2Score: z.number().min(0),
});

// Admin only: Submit match result (protected by adminMiddleware in routes)
export const submitMatchResult = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = matchResultSchema.parse(req.body);

    const match = await prisma.match.findUnique({
      where: { id },
      include: { tournament: true },
    });

    if (!match) {
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
