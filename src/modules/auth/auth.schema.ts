// src/modules/auth/auth.schema.ts
import { z } from 'zod';

/**
 * Validation schema for POST /api/v1/auth/login
 *
 * username: 3-50 chars, lowercase alphanumeric + dots/hyphens/underscores
 *           (mirrors the DB CHECK: username ~ '^[a-z0-9._-]{3,50}$')
 * password: 6-128 chars (reasonable min/max for plaintext input)
 */
export const loginSchema = z.object({
  username: z
    .string({ required_error: 'Username is required' })
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(
      /^[a-z0-9._-]+$/,
      'Username may only contain lowercase letters, digits, dots, hyphens, and underscores',
    ),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be at most 128 characters'),
});


export const changePassword = z.object({
  currentPassword: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be at most 128 characters'),
  newPassword: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be at most 128 characters'),
});

/** Inferred TypeScript type from the login schema. */
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePassword>;
