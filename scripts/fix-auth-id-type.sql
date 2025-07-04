-- Fix for Clerk auth_id compatibility
-- This script changes the auth_id column from UUID to VARCHAR to support Clerk user IDs

-- First, let's see if there are any existing records that might conflict
SELECT auth_id FROM jobsight.users WHERE auth_id IS NOT NULL;

-- Drop any constraints that depend on auth_id being UUID
ALTER TABLE jobsight.users DROP CONSTRAINT IF EXISTS users_auth_id_key;

-- Change the column type from UUID to VARCHAR
ALTER TABLE jobsight.users ALTER COLUMN auth_id TYPE VARCHAR(255);

-- Re-add the unique constraint
ALTER TABLE jobsight.users ADD CONSTRAINT users_auth_id_key UNIQUE (auth_id);

-- Update any other tables that might reference this column
-- (The notifications tables already use VARCHAR(255) so they should be fine)

-- Verify the change
\d jobsight.users;
