import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import {
  getPointConfigurations,
  getPointConfiguration,
  savePointConfiguration,
} from '../controllers/settingsController';

const router = Router();

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// Get all point configurations
router.get('/points', getPointConfigurations);

// Get point configuration for a specific category
router.get('/points/:category', getPointConfiguration);

// Save point configuration for a category
router.post('/points', savePointConfiguration);

export default router;
