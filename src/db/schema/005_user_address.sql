-- src/db/schema/005_user_address.sql
-- The dispute letter has needed this since it was built (placeholder "[Your street address]").
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10);
