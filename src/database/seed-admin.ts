// src/database/seed-admin.ts
// ─────────────────────────────────────────────────────────────────────────────
// One-time script to create the initial admin account.
//
// Usage:  npx tsx src/database/seed-admin.ts
// ─────────────────────────────────────────────────────────────────────────────
import bcrypt from 'bcrypt';
import { pool } from '../config/database.js';

const SALT_ROUNDS = 12;

async function seedAdmin() {
  const username  = 'zaher';
  const password  = 'Mozaher@123';        // ← change after first login
  const fullName  = 'محمد زاهر طه';
  const phone     = '01005138370';
  const role      = 'admin';

  console.log('🔄  Hashing password …');
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  console.log('🔄  Inserting admin user …');
  try {
    const result = await pool.query(
      `INSERT INTO users (full_name, username, password_hash, phone, role, assigned_program_id)
       VALUES ($1, $2, $3, $4, $5, NULL)
       ON CONFLICT (username) DO NOTHING
       RETURNING id, username, role`,
      [fullName, username, passwordHash, phone, role],
    );

    if (result.rowCount === 0) {
      console.log('⚠️  Admin user already exists — skipped.');
    } else {
      console.log('✅  Admin user created successfully!');
      console.log('    id:       ', result.rows[0].id);
      console.log('    username: ', result.rows[0].username);
      console.log('    role:     ', result.rows[0].role);
      console.log(`    password:  ${password}   (change it after first login)`);
    }
  } catch (err) {
    console.error('❌  Failed to seed admin:', err);
  } finally {
    await pool.end();
  }
}

seedAdmin();
