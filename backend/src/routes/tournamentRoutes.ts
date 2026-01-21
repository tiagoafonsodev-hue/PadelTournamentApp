import express from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  createTournament,
  getTournaments,
  getTournamentById,
  getTournamentStandings,
  deleteTournament,
} from '../controllers/tournamentController';

const router = express.Router();

router.use(authMiddleware);

router.post('/', createTournament);
router.get('/', getTournaments);
router.get('/:id', getTournamentById);
router.get('/:id/standings', getTournamentStandings);
router.delete('/:id', deleteTournament);

export default router;
