-- === MIGRAZIONE v3: STATI POSIZIONI + TEAM MANAGEMENT ===

-- 1. Evolvi job_positions con stato pubblicazione (come Greenhouse/Lever)
ALTER TABLE job_positions ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'open' 
  CHECK (status IN ('draft', 'open', 'paused', 'closed', 'archived'));
ALTER TABLE job_positions ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE;

-- 2. Tabella inviti team
CREATE TABLE IF NOT EXISTS team_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR NOT NULL,
    role VARCHAR DEFAULT 'operator' CHECK (role IN ('owner', 'admin', 'operator')),
    invited_by UUID REFERENCES profiles(id),
    accepted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Invites full access" ON team_invites FOR ALL USING (true) WITH CHECK (true);

-- 3. Aggiorna profili con ruolo owner
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('owner', 'admin', 'operator'));
