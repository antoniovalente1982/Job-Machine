-- === MIGRAZIONE v2: SCHEMA EVOLUTO HR SaaS ===

-- 1. Tabella Profili Team (la tua agenzia)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR NOT NULL,
    full_name VARCHAR,
    role VARCHAR DEFAULT 'operator' CHECK (role IN ('admin', 'operator')),
    avatar_url VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by authenticated" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow insert profiles" ON profiles FOR INSERT WITH CHECK (true);

-- 2. Aggiungi colonne mancanti a clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_email VARCHAR;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Aggiungi colonne mancanti a job_positions
ALTER TABLE job_positions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE job_positions ADD COLUMN IF NOT EXISTS questionnaire JSONB DEFAULT '[]'::jsonb;

-- 4. Evolvi la tabella candidates con pipeline completa
-- Prima droppiamo il vecchio check constraint sullo status
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_status_check;

-- Nuovo set di stage per la pipeline
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS pipeline_stage VARCHAR DEFAULT 'candidatura_ricevuta';
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id);
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);

-- Aggiorna status con i nuovi valori possibili
ALTER TABLE candidates ADD CONSTRAINT candidates_pipeline_check 
CHECK (pipeline_stage IN (
    'candidatura_ricevuta',
    'questionario_inviato',
    'questionario_compilato',
    'cv_ricevuto',
    'in_valutazione',
    'selezionato',
    'da_contattare',
    'colloquio_fissato',
    'assunto',
    'scartato'
));

-- 5. Note interne sui candidati
CREATE TABLE IF NOT EXISTS candidate_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE candidate_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notes viewable by authenticated" ON candidate_notes FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 6. Activity Log (registra OGNI azione del team)
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    action VARCHAR NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Logs viewable by authenticated" ON activity_log FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 7. Template Messaggi (gli script del recruiting pipeline)
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    subject VARCHAR,
    body TEXT NOT NULL,
    trigger_stage VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Templates full access for authenticated" ON message_templates FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 8. Funzione per creare automaticamente il profilo quando un utente si registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'admin'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: quando un nuovo utente si registra, crea il profilo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
