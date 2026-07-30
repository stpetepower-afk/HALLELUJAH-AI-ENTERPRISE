// src/auth/types.ts
export type Role = "consumer" | "coach" | "admin" | "partner";

export interface Address {
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
}

export interface User extends Address {
  id: string;
  email: string;
  role: Role;
  fullName: string | null;
  createdAt: string;
}
