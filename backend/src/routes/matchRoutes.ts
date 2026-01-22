import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { submitMatchResult } from '../controllers/matchController';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Admin-only routes
router.post('/:id/result', adminMiddleware, submitMatchResult);

export default router;
