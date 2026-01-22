import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { register, login, getMe, createUser } from '../controllers/authController';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authMiddleware, getMe);

// Admin-only routes
router.post('/users', authMiddleware, adminMiddleware, createUser);

export default router;
