// src/modules/auth/auth.routes.ts
import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { loginSchema, changePassword } from './auth.schema.js';
import * as authController from './auth.controller.js';

const router = Router();

// Public
router.post('/login', validate(loginSchema), authController.login);

// Protected
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.patch('/change-password', authenticate, validate(changePassword), authController.changePassword);

export default router;
