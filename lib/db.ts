import { Pool } from 'pg';
import 'dotenv/config';

// Create a connection pool using DATABASE_URL from environment
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// A helper to run queries
export async function query(text: string, params?: any[]) {
  const res = await pool.query(text, params);
  return res;
} 