// src/auth/service.ts
import { getPool } from "../db/pool";
import { hashPassword, verifyPassword } from "./password";
import { signToken } from "./jwt";
import type { Address, Role, User } from "./types";

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
     RETURNING id, email, role, full_name, address_line1, city, state, postal_code, created_at`,
    [email, passwordHash, role]
  );
  const user = toUser(result.rows[0]);
  return { user, token: signToken({ sub: user.id, role: user.role }) };
}

export async function loginUser(email: string, password: string) {
  const pool = getPool();
  const result = await pool.query(
    "SELECT id, email, role, full_name, address_line1, city, state, postal_code, password_hash, created_at FROM users WHERE email = $1",
    [email]
  );
  const row = result.rows[0];
  if (!row || !(await verifyPassword(password, row.password_hash))) {
    throw new AuthError("Invalid email or password");
  }
  const user = toUser(row);
  return { user, token: signToken({ sub: user.id, role: user.role }) };
}

export async function getUserById(id: string): Promise<User | null> {
  const pool = getPool();
  const result = await pool.query(
    "SELECT id, email, role, full_name, address_line1, city, state, postal_code, created_at FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0] ? toUser(result.rows[0]) : null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const pool = getPool();
  const result = await pool.query(
    "SELECT id, email, role, full_name, address_line1, city, state, postal_code, created_at FROM users WHERE email = $1",
    [email]
  );
  return result.rows[0] ? toUser(result.rows[0]) : null;
}

// Admin-only: role changes never happen through self-service registration.
export async function updateUserRole(id: string, role: Role): Promise<User | null> {
  if (!VALID_ROLES.includes(role)) throw new AuthError("Invalid role");
  const pool = getPool();
  const result = await pool.query(
    `UPDATE users SET role = $1 WHERE id = $2
     RETURNING id, email, role, full_name, address_line1, city, state, postal_code, created_at`,
    [role, id]
  );
  return result.rows[0] ? toUser(result.rows[0]) : null;
}

// Coach/admin-editable: the participant's legal name, needed for dispute letters.
export async function updateUserFullName(id: string, fullName: string): Promise<User | null> {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE users SET full_name = $1 WHERE id = $2
     RETURNING id, email, role, full_name, address_line1, city, state, postal_code, created_at`,
    [fullName, id]
  );
  return result.rows[0] ? toUser(result.rows[0]) : null;
}

// Coach/admin-editable: mailing address, needed for dispute letters (previously
// always "[Your street address]" placeholder text).
export async function updateUserAddress(id: string, address: Address): Promise<User | null> {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE users SET address_line1 = $1, city = $2, state = $3, postal_code = $4 WHERE id = $5
     RETURNING id, email, role, full_name, address_line1, city, state, postal_code, created_at`,
    [address.addressLine1, address.city, address.state, address.postalCode, id]
  );
  return result.rows[0] ? toUser(result.rows[0]) : null;
}

function toUser(row: {
  id: string;
  email: string;
  role: Role;
  full_name: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  created_at: string;
}): User {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    fullName: row.full_name,
    addressLine1: row.address_line1,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    createdAt: row.created_at,
  };
}
