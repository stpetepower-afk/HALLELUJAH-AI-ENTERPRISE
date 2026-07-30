-- src/db/schema/001_users.sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'consumer' CHECK (role IN ('consumer', 'coach', 'admin', 'partner')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
