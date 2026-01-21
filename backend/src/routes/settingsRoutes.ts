import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getPointConfigurations,
  getPointConfiguration,
  savePointConfiguration,
} from '../controllers/settingsController';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get all point configurations
router.get('/points', getPointConfigurations);

// Get point configuration for a specific category
router.get('/points/:category', getPointConfiguration);

// Save point configuration for a category
router.post('/points', savePointConfiguration);

export default router;
