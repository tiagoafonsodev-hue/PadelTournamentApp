import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import {
  createTournament,
  getTournaments,
  getTournamentById,
  getTournamentStandings,
  deleteTournament,
} from '../controllers/tournamentController';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Public routes (all authenticated users)
router.get('/', getTournaments);
router.get('/:id', getTournamentById);
router.get('/:id/standings', getTournamentStandings);

// Admin-only routes
router.post('/', adminMiddleware, createTournament);
router.delete('/:id', adminMiddleware, deleteTournament);

export default router;
