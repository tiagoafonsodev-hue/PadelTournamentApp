import express from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  createPlayer,
  getPlayers,
  updatePlayer,
  deletePlayer,
  getLeaderboard,
} from '../controllers/playerController';

const router = express.Router();

router.use(authMiddleware);

router.post('/', createPlayer);
router.get('/', getPlayers);
router.put('/:id', updatePlayer);
router.delete('/:id', deletePlayer);
router.get('/leaderboard', getLeaderboard);

export default router;
