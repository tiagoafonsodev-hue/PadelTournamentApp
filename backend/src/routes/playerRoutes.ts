import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import {
  createPlayer,
  getPlayers,
  getPlayer,
  updatePlayer,
  deletePlayer,
  getLeaderboard,
} from '../controllers/playerController';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Public routes (all authenticated users)
router.get('/', getPlayers);
router.get('/leaderboard', getLeaderboard);
router.get('/:id', getPlayer);

// updatePlayer handles its own permission logic (admin can update any, player can update own profile)
router.put('/:id', updatePlayer);

// Admin-only routes
router.post('/', adminMiddleware, createPlayer);
router.delete('/:id', adminMiddleware, deletePlayer);

export default router;
