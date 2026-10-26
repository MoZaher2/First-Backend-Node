// src/routes/index.ts
import { Router, Request, Response } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';

const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Module routes
router.use('/auth', authRoutes);

export default router;

