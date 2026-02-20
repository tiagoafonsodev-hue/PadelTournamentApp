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

/**
 * @openapi
 * /tournaments:
 *   get:
 *     summary: Get all tournaments for authenticated user
 *     tags: [Tournaments]
 *     responses:
 *       200:
 *         description: List of tournaments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tournament'
 */
router.get('/', getTournaments);

/**
 * @openapi
 * /tournaments/{id}:
 *   get:
 *     summary: Get tournament by ID with matches and players
 *     tags: [Tournaments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Tournament details with matches
 *       404:
 *         description: Tournament not found
 */
router.get('/:id', getTournamentById);

/**
 * @openapi
 * /tournaments/{id}/standings:
 *   get:
 *     summary: Get tournament standings
 *     tags: [Tournaments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: final
 *         schema: { type: boolean }
 *         description: Get final standings (for finished tournaments)
 *     responses:
 *       200:
 *         description: Tournament standings
 *       404:
 *         description: Tournament not found
 */
router.get('/:id/standings', getTournamentStandings);

/**
 * @openapi
 * /tournaments:
 *   post:
 *     summary: Create a new tournament (admin only)
 *     tags: [Tournaments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, type, playerCount, playerIds, teams]
 *             properties:
 *               name: { type: string }
 *               date: { type: string, format: date }
 *               type: { type: string, enum: [ROUND_ROBIN, KNOCKOUT, GROUP_STAGE_KNOCKOUT] }
 *               category: { type: string, enum: [OPEN_250, OPEN_500, OPEN_1000, MASTERS], default: OPEN_250 }
 *               playerCount: { type: integer, enum: [8, 12, 16, 24] }
 *               playerIds: { type: array, items: { type: string } }
 *               teams: { type: array, items: { type: object, properties: { player1Id: { type: string }, player2Id: { type: string } } } }
 *               allowTies: { type: boolean, default: false }
 *               fieldCount: { type: integer, minimum: 1, maximum: 10, default: 2 }
 *     responses:
 *       200:
 *         description: Created tournament
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Admin access required
 */
router.post('/', adminMiddleware, createTournament);

/**
 * @openapi
 * /tournaments/{id}:
 *   delete:
 *     summary: Delete a tournament (admin only)
 *     tags: [Tournaments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Tournament deleted
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Tournament not found
 */
router.delete('/:id', adminMiddleware, deleteTournament);

export default router;
