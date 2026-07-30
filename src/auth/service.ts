// src/auth/service.ts
import { getPool } from "../db/pool";
import { hashPassword, verifyPassword } from "./password";
import { signToken } from "./jwt";
import type { Role, User } from "./types";

const VALID_ROLES: Role[] = ["consumer", "coach", "admin", "partner"];

export class AuthError extends Error {}

export async function registerUser(email: string, password: string, role: Role = "consumer") {
  if (!VALID_ROLES.includes(role)) throw new AuthError("Invalid role");
  if (password.length < 8) throw new AuthError("Password must be at least 8 characters");

  const pool = getPool();
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rowCount) throw new AuthError("Email already registered");

  const passwordHash = await hashPassword(password);
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)
     RETURNING id, email, role, created_at`,
    [email, passwordHash, role]
  );
  const user = toUser(result.rows[0]);
  return { user, token: signToken({ sub: user.id, role: user.role }) };
}

export async function loginUser(email: string, password: string) {
  const pool = getPool();
  const result = await pool.query(
    "SELECT id, email, role, password_hash, created_at FROM users WHERE email = $1",
    [email]
  );
  const row = result.rows[0];
  if (!row || !(await verifyPassword(password, row.password_hash))) {
    throw new AuthError("Invalid email or password");
  }
  const user = toUser(row);
  return { user, token: signToken({ sub: user.id, role: user.role }) };
}

// Admin-only: role changes never happen through self-service registration.
export async function updateUserRole(id: string, role: Role): Promise<User | null> {
  if (!VALID_ROLES.includes(role)) throw new AuthError("Invalid role");
  const pool = getPool();
  const result = await pool.query(
    `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, role, created_at`,
    [role, id]
  );
  return result.rows[0] ? toUser(result.rows[0]) : null;
}

function toUser(row: { id: string; email: string; role: Role; created_at: string }): User {
  return { id: row.id, email: row.email, role: row.role, createdAt: row.created_at };
}
