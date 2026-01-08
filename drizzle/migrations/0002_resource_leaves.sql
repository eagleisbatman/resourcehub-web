-- Idempotent migration: Can be run multiple times safely
-- This migration creates resource_leaves table with IF NOT EXISTS checks

-- Create leave_type enum (idempotent)
DO $$ BEGIN
  CREATE TYPE leave_type AS ENUM ('leave', 'sick', 'vacation', 'unavailable');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create resource_leaves table (idempotent)
CREATE TABLE IF NOT EXISTS resource_leaves (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL DEFAULT 'leave',
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes (idempotent)
CREATE INDEX IF NOT EXISTS resource_leaves_resource_id_idx ON resource_leaves(resource_id);
CREATE INDEX IF NOT EXISTS resource_leaves_dates_idx ON resource_leaves(start_date, end_date);
