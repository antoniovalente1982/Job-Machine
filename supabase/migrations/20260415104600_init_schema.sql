-- === SCHEMA DATABASE SCALABILE: JOB MACHINE (MULTI-TENANT) ===

-- 1. Tabella Clienti (Le aziende/agenzie per cui lavorate)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL, -- E.g. "Consulting Manager Group"
    slug VARCHAR UNIQUE NOT NULL, -- E.g. "consulting-manager-group" (per gli URL)
    logo_url VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabella Strutture (Le sedi fisiche del cliente)
CREATE TABLE structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL, -- E.g. "Hotel Palau 4 stelle S"
    location VARCHAR,      -- E.g. "Palau (SS)"
    description TEXT,
    image_url VARCHAR,     -- Foto della struttura
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabella delle Posizioni Lavorative (I Ruoli)
CREATE TABLE job_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    structure_id UUID REFERENCES structures(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL, -- E.g. "Capopartita"
    salary VARCHAR,         -- E.g. "2000€ mese + TFR"
    icon_name VARCHAR,      -- E.g. "ChefHat" (per mappatura lucide-react)
    is_active BOOLEAN DEFAULT true,
    
    -- Variabili Trello Collegate a questo annuncio
    trello_board_link VARCHAR, -- Il link visivo (trello.com/invite/...)
    trello_board_id VARCHAR,   -- L'id tecnico della API
    trello_list_id  VARCHAR,   -- L'id tecnico della lista specifica (opzionale)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabella dei Candidati (Gli iscritti al form)
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES job_positions(id) ON DELETE CASCADE,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    phone VARCHAR,
    
    -- Campo JSON per immagazzinare le risposte al questionario dinamico
    questionnaire_responses JSONB,
    
    -- Path dei file salvati nel bucket Supabase
    cv_file_path VARCHAR,
    cover_letter_file_path VARCHAR,
    
    -- Status pipeline
    status VARCHAR DEFAULT 'new' CHECK (status IN ('new', 'questionnaire_sent', 'form_completed', 'exported_to_trello')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- REGOLE DI SICUREZZA (Row Level Security)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Lettura pubblica globale per far visualizzare il sito
CREATE POLICY "Allow public read clients" ON clients FOR SELECT USING (true);
CREATE POLICY "Allow public read structures" ON structures FOR SELECT USING (true);
CREATE POLICY "Allow public read jobs" ON job_positions FOR SELECT USING (true);

-- Scrittura pubblica limitata SOLO alla tabella candidati (Insert via form pubblico)
CREATE POLICY "Allow public insert to candidates" ON candidates FOR INSERT WITH CHECK (true);
