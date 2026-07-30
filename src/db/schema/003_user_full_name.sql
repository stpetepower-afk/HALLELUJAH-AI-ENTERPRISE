-- src/db/schema/003_user_full_name.sql
-- Needed to generate real dispute letters, which require the consumer's name.
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
