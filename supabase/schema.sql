-- === SCHEMA DATABASE: JOB MACHINE ===

-- 1. Tabella delle Posizioni Lavorative (Leads da LinkedIn vi verranno assegnati)
CREATE TABLE job_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    -- Variabili Trello Collegate a questo annuncio
    trello_board_id VARCHAR, 
    trello_list_id  VARCHAR, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabella dei Candidati
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES job_positions(id) ON DELETE CASCADE,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    phone VARCHAR,
    
    -- Campo JSON per immagazzinare le risposte al questionario (così da poter cambiare le domande nel tempo senza rompere il db)
    questionnaire_responses JSONB,
    
    -- Path dei file salvati nel bucket "resumes" di Supabase (opzionale se lo mettono in file input form)
    cv_file_path VARCHAR,
    cover_letter_file_path VARCHAR,
    
    -- Status in cui si trova il candidato all'interno del nostro motore pre-Trello
    status VARCHAR DEFAULT 'new' CHECK (status IN ('new', 'questionnaire_sent', 'form_completed', 'exported_to_trello')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Sicurezza: Imposta l'RLS (Row Level Security) - per il momento abilitiamo l'accesso in scrittura per i form pubblici
ALTER TABLE job_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Policy provvisoria: chiunque può inserire un candidato (visto che il form è pubblico)
CREATE POLICY "Allow public insert to candidates" ON candidates FOR INSERT WITH CHECK (true);
-- Policy provvisoria: la dashboard può leggere i jobs
CREATE POLICY "Allow public read jobs" ON job_positions FOR SELECT USING (true);
