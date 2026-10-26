// src/modules/auth/auth.controller.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as authService from './auth.service.js';
import type { LoginInput, ChangePasswordInput } from './auth.schema.js';

/**
 * POST /api/v1/auth/login
 * Validates credentials and returns a Bearer token.
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  // Body has already been validated by the validate middleware
  const input: LoginInput = req.body;
  const result = await authService.login(input);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

/**
 * POST /api/v1/auth/logout
 * With stateless Bearer tokens there is no server-side session to destroy.
 * This endpoint exists for API completeness and future token-blacklisting.
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * GET /api/v1/auth/me
 * Returns the profile of the currently authenticated user.
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await authService.getMe(userId);

  res.status(200).json({
    success: true,
    data: { user },
  });
});


export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  // Body has already been validated by the validate middleware
  const input: ChangePasswordInput = req.body;
  const result = await authService.changePassword(req.user!.id, input);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
    data: result,
  });
});