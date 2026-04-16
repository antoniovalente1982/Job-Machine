-- Migration: Client Portal & Extended Data Fields

-- 1. Extend `clients` table
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS market_sector VARCHAR,
  ADD COLUMN IF NOT EXISTS company_context TEXT,
  ADD COLUMN IF NOT EXISTS access_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS client_password VARCHAR;

-- 2. Extend `structures` table
ALTER TABLE structures
  ADD COLUMN IF NOT EXISTS structure_context TEXT;

-- 3. Extend `candidates` table
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS client_notes TEXT;

-- Generate tokens for existing clients if null
UPDATE clients SET access_token = gen_random_uuid() WHERE access_token IS NULL;

