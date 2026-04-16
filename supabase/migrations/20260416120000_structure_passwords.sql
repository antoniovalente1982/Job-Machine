-- Migration: Structure Passwords for Multi-Tier Portal Access
-- Description: Aggiunge la possibilita di configurare password di accesso limitate alla singola struttura.

ALTER TABLE structures
  ADD COLUMN IF NOT EXISTS access_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS structure_password VARCHAR;

-- Generate tokens for existing structures if null
UPDATE structures SET access_token = gen_random_uuid() WHERE access_token IS NULL;
