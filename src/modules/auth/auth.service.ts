// src/modules/auth/auth.service.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../../config/database.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import type { UserRow, UserRowWithPassword, JwtPayload, LoginResponse } from './auth.types.js';
import type { LoginInput, ChangePasswordInput } from './auth.schema.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Columns returned for safe (no password_hash) user queries. */
const SAFE_USER_COLUMNS = `
  id, full_name, username, phone, role,
  assigned_program_id, is_active, created_at, updated_at
`;

/**
 * Sign a JWT with the standard payload shape.
 */
function signToken(user: UserRow): string {
  const payload: JwtPayload = {
    sub: user.id,
    username: user.username,
    role: user.role,
    is_active: user.is_active,
  };

  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions);
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

/**
 * Authenticate a user by username + password.
 * Returns a Bearer token and the user profile (without password_hash).
 */
export async function login(input: LoginInput): Promise<LoginResponse> {
  // 1. Fetch user including password_hash
  const result = await query(
    `SELECT ${SAFE_USER_COLUMNS}, password_hash FROM users WHERE username = $1`,
    [input.username],
  );

  const user: UserRowWithPassword | undefined = result.rows[0];

  if (!user) {
    throw new ApiError(401, 'Invalid username or password');
  }

  // 2. Check if the account is active
  if (!user.is_active) {
    throw new ApiError(403, 'Account is deactivated. Please contact an administrator');
  }

  // 3. Compare password
  const isMatch = await bcrypt.compare(input.password, user.password_hash);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid username or password');
  }

  // 4. Build safe user object (strip password_hash)
  const { password_hash: _, ...safeUser } = user;

  // 5. Sign token
  const token = signToken(safeUser);

  return { token, user: safeUser };
}

/**
 * Return the authenticated user's profile.
 * Throws 404 if the user no longer exists or is deactivated.
 */
export async function getMe(userId: string): Promise<UserRow> {
  const result = await query(
    `SELECT ${SAFE_USER_COLUMNS} FROM users WHERE id = $1`,
    [userId],
  );

  const user: UserRow | undefined = result.rows[0];

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (!user.is_active) {
    throw new ApiError(403, 'Account is deactivated');
  }

  return user;
}





export async function changePassword(userId: string, input: ChangePasswordInput): Promise<UserRow> {
  // 1. Fetch user including password_hash


  // 1. جلب الـ hash الحالي
  const result = await query(
    `SELECT password_hash FROM users WHERE id = $1`,
    [userId],
  );

  if (result.rowCount === 0) {
    throw new ApiError(404, 'User not found');
  }

  const { password_hash } = result.rows[0];

  // 2. التحقق من كلمة المرور الحالية
  const isMatch = await bcrypt.compare(input.currentPassword, password_hash);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid password');
  }

  // 3. تشفير كلمة المرور الجديدة وتحديثها
  const newHash = await bcrypt.hash(input.newPassword, 12);
  const updatedUser = await query(
    `UPDATE users 
     SET password_hash = $1, 
         updated_at = now()
     WHERE id = $2`,
    [newHash, userId],
  );
  console.log(updatedUser)

  return updatedUser.rows[0];
}

