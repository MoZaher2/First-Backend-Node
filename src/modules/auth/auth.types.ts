// src/modules/auth/auth.types.ts

/** Roles that match the DB CHECK constraint: role IN ('admin', 'volunteer') */
export type UserRole = 'admin' | 'volunteer';

/** Row shape returned by SELECT on the users table (without password_hash). */
export interface UserRow {
  id: string;
  full_name: string;
  username: string;
  phone: string;
  role: UserRole;
  assigned_program_id: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/** Full user row including password_hash — only used internally by the auth service. */
export interface UserRowWithPassword extends UserRow {
  password_hash: string;
}

/** The payload embedded inside a signed JWT. */
export interface JwtPayload {
  sub: string;        // user id
  username: string;
  role: UserRole;
  is_active: boolean;
  iat?: number;
  exp?: number;
}

/** Shape of a successful login response. */
export interface LoginResponse {
  token: string;
  user: UserRow;
}
