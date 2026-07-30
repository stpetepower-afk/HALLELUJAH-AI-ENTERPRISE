// src/db/migrate.ts
// Applies every .sql file in src/db/schema, in filename order. Run with: npm run migrate
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { getPool } from "./pool";
import { log } from "../utils/logger";

const schemaDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "schema");

async function migrate() {
  const pool = getPool();
  const files = readdirSync(schemaDir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    log(`Applying migration: ${file}`);
    const sql = readFileSync(path.join(schemaDir, file), "utf8");
    await pool.query(sql);
  }
  await pool.end();
  log("Migrations complete.");
}

migrate().catch((err) => {
  log("Migration failed:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
