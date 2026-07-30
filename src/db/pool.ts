// src/db/pool.ts
import { Pool } from "pg";
import { requireSecret } from "../utils/secrets-manager";

let pool: Pool | undefined;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: requireSecret("DATABASE_URL") });
  }
  return pool;
}
