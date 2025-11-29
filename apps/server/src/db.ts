import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/airtable_lite";

export const pool = new Pool({ connectionString });

export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE,
      version BIGINT DEFAULT 1
    );
  `);

  // ensure columns exist for older DBs
  await pool.query(`ALTER TABLE items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE`);
  await pool.query(`ALTER TABLE items ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 1`);
}
