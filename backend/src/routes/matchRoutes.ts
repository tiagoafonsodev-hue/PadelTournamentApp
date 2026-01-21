import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { submitMatchResult } from '../controllers/matchController';

const router = express.Router();

router.use(authMiddleware);

router.post('/:id/result', submitMatchResult);

export default router;
