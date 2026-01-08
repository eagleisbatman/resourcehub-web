-- Idempotent migration: Can be run multiple times safely
-- This migration creates api_keys table with IF NOT EXISTS checks

-- Create api_keys table (idempotent)
CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    key TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes (idempotent)
CREATE INDEX IF NOT EXISTS api_keys_key_idx ON api_keys(key);
CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON api_keys(user_id);
