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

// Public routes (all authenticated users)
router.get('/', getPlayers);
router.get('/leaderboard', getLeaderboard);
router.get('/:id', getPlayer);

// updatePlayer handles its own permission logic (admin can update any, player can update own profile)
router.put('/:id', updatePlayer);

// Admin-only routes
router.post('/', adminMiddleware, createPlayer);
router.delete('/:id', adminMiddleware, deletePlayer);
router.post('/reset-leaderboard', adminMiddleware, resetLeaderboard);
router.post('/reset-stats', adminMiddleware, resetPlayerStats);

// Import routes (admin only)
router.get('/template', adminMiddleware, getPlayerTemplate);
router.post('/import', adminMiddleware, upload.single('file'), importPlayers);

export default router;
