-- Aggiungiamo il bucket Storage per i Curriculum Vitae e le Lettere Motivazionali
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Configuriamo i permessi (RLS) per il bucket (chiunque può fare upload, solo admin possono scaricare)
CREATE POLICY "Allow public uploads to resumes" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'resumes');

-- Assicuriamoci che anche le operazioni UPDATE (es. caricamento chunks/resumable) siano ammesse
CREATE POLICY "Allow public updates to resumes"
ON storage.objects FOR UPDATE
WITH CHECK (bucket_id = 'resumes');
