// src/middlewares/authorize.ts
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import type { UserRole } from '../modules/auth/auth.types.js';

/**
 * Middleware factory that restricts access to users whose role
 * is included in the provided list.
 *
 * Must be used **after** the `authenticate` middleware so that
 * `req.user` is guaranteed to exist.
 *
 * Usage:  router.get('/admin-only', authenticate, authorize(['admin']), handler);
 */
export const authorize = (roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, 'You do not have permission to access this resource'),
      );
    }

    next();
  };
};
