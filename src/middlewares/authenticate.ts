// src/middlewares/authenticate.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import type { JwtPayload } from '../modules/auth/auth.types.js';

/**
 * Middleware that verifies the Bearer token from the Authorization header
 * and attaches the decoded user info to `req.user`.
 *
 * Expected header format:  Authorization: Bearer <token>
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication required. Please provide a valid Bearer token'));
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return next(new ApiError(401, 'Authentication required. Please provide a valid Bearer token'));
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;

    // Attach user info to the request object
    req.user = {
      id: decoded.sub,
      username: decoded.username,
      role: decoded.role,
      active:decoded.is_active,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, 'Token has expired. Please login again'));
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(401, 'Invalid token. Please login again'));
    }
    return next(new ApiError(401, 'Authentication failed'));
  }
};
