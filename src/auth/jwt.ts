// src/auth/jwt.ts
import jwt from "jsonwebtoken";
import { requireSecret } from "../utils/secrets-manager";
import type { Role } from "./types";

export interface TokenPayload {
  sub: string;
  role: Role;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, requireSecret("JWT_SECRET_KEY"), { expiresIn: "12h" });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, requireSecret("JWT_SECRET_KEY")) as TokenPayload;
}
