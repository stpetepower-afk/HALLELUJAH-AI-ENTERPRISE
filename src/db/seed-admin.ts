// src/db/seed-admin.ts
// One-time bootstrap for the first admin account — run directly against the
// database, never through the public API (which always creates "consumer" users).
// Usage: npm run seed:admin -- --email=you@example.com --password=...
import { registerUser, AuthError } from "../auth/service";
import { getPool } from "./pool";
import { log } from "../utils/logger";

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((a) => a.startsWith(prefix))?.slice(prefix.length);
}

async function seed() {
  const email = getArg("email");
  const password = getArg("password");
  if (!email || !password) {
    throw new Error("Usage: npm run seed:admin -- --email=<email> --password=<password>");
  }
  const { user } = await registerUser(email, password, "admin");
  log(`Admin user created: ${user.email} (${user.id})`);
}

seed()
  .catch((err) => {
    log("Seed failed:", err instanceof AuthError || err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => getPool().end());
