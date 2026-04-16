CREATE TABLE message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    subject VARCHAR,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- Consentiamo ad admin/membri del team (quindi a utenti che usano Supabase dal backend)
-- di leggere e scrivere ai template in modo autenticato/bypassato se si usa il service_role. 
-- Dal momento che l'applicazione Server Component/Admin lo farà in sicurezza, 
-- creiamo policies generiche a livello public read per la comodità attuale se serve in future API
CREATE POLICY "Allow authenticated read on message_templates"
ON message_templates FOR SELECT
USING (true);

-- Per ora ci limitiamo a queste basi, la gestione CRUD verrà fatta 
-- tramite proxy Service Role in NextJS o utente Admin.
