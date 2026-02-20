import express from 'express';
import multer from 'multer';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import {
  createPlayer,
  getPlayers,
  getPlayer,
  updatePlayer,
  deletePlayer,
  getLeaderboard,
  getPlayerHistory,
  getPlayerTrends,
  resetLeaderboard,
  resetPlayerStats,
} from '../controllers/playerController';
import { importPlayers, getPlayerTemplate } from '../controllers/importController';

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept Excel and CSV files
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
    ];
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx, .xls) and CSV files are allowed'));
    }
  },
});

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @openapi
 * /players:
 *   get:
 *     summary: Get all players
 *     tags: [Players]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search players by name
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *         description: Items per page (max 100)
 *     responses:
 *       200:
 *         description: List of players
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Player'
 */
router.get('/', getPlayers);

/**
 * @openapi
 * /players/leaderboard:
 *   get:
 *     summary: Get player leaderboard sorted by tournament points
 *     tags: [Players]
 *     responses:
 *       200:
 *         description: Leaderboard of players
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Player'
 */
router.get('/leaderboard', getLeaderboard);

/**
 * @openapi
 * /players/{id}:
 *   get:
 *     summary: Get player by ID
 *     tags: [Players]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Player details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Player'
 *       404:
 *         description: Player not found
 */
router.get('/:id', getPlayer);

/**
 * @openapi
 * /players/{id}/history:
 *   get:
 *     summary: Get player tournament history
 *     tags: [Players]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated tournament history
 */
router.get('/:id/history', getPlayerHistory);

/**
 * @openapi
 * /players/{id}/trends:
 *   get:
 *     summary: Get player statistics trends
 *     tags: [Players]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Player trends data
 */
router.get('/:id/trends', getPlayerTrends);

/**
 * @openapi
 * /players/{id}:
 *   put:
 *     summary: Update player
 *     tags: [Players]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               phoneNumber: { type: string }
 *     responses:
 *       200:
 *         description: Updated player
 *       403:
 *         description: Access denied
 *       404:
 *         description: Player not found
 */
router.put('/:id', updatePlayer);

/**
 * @openapi
 * /players:
 *   post:
 *     summary: Create a new player (admin only)
 *     tags: [Players]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               phoneNumber: { type: string }
 *     responses:
 *       200:
 *         description: Created player
 *       403:
 *         description: Admin access required
 */
router.post('/', adminMiddleware, createPlayer);

/**
 * @openapi
 * /players/{id}:
 *   delete:
 *     summary: Delete a player (admin only)
 *     tags: [Players]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Player deleted
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Player not found
 */
router.delete('/:id', adminMiddleware, deletePlayer);

/**
 * @openapi
 * /players/reset-leaderboard:
 *   post:
 *     summary: Reset leaderboard (admin only)
 *     tags: [Players]
 *     responses:
 *       200:
 *         description: Leaderboard reset successfully
 *       403:
 *         description: Admin access required
 */
router.post('/reset-leaderboard', adminMiddleware, resetLeaderboard);

/**
 * @openapi
 * /players/reset-stats:
 *   post:
 *     summary: Reset all player stats (admin only)
 *     tags: [Players]
 *     responses:
 *       200:
 *         description: Stats reset successfully
 *       403:
 *         description: Admin access required
 */
router.post('/reset-stats', adminMiddleware, resetPlayerStats);

// Import routes (admin only)
router.get('/template', adminMiddleware, getPlayerTemplate);
router.post('/import', adminMiddleware, upload.single('file'), importPlayers);

export default router;
