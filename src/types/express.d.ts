// src/types/express.d.ts
import type { UserRole } from '../modules/auth/auth.types';

declare module 'express-serve-static-core' {
  interface Request {
    /** Populated by the authenticate middleware after JWT verification. */
    user?: {
      id: string;
      username: string;
      role: UserRole;
      active:boolean;
      
    };
  }
}
