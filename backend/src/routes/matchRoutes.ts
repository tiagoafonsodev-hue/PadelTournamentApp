import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { submitMatchResult } from '../controllers/matchController';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @openapi
 * /matches/{id}/result:
 *   post:
 *     summary: Submit match result (admin only)
 *     tags: [Matches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Match ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [team1Score, team2Score]
 *             properties:
 *               team1Score:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 15
 *                 description: Games won by team 1
 *               team2Score:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 15
 *                 description: Games won by team 2
 *     responses:
 *       200:
 *         description: Match result submitted, returns updated match
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Match'
 *       400:
 *         description: Invalid score or match already completed
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Match not found
 */
router.post('/:id/result', adminMiddleware, submitMatchResult);

export default router;
