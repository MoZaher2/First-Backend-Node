import { Pool } from 'pg';
import { env } from './env.js';

export const pool = new Pool({
  connectionString: env.databaseUrl,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
