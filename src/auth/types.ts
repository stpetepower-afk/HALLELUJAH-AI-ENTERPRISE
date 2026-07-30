// src/auth/types.ts
export type Role = "consumer" | "coach" | "admin" | "partner";

export interface User {
  id: string;
  email: string;
  role: Role;
  fullName: string | null;
  createdAt: string;
}
