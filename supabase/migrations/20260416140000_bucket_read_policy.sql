-- Aggiungiamo i permessi pubblici di LETTURA per scaricare/accedere ai CV, 
-- permettendo la visualizzazione dei CV all'interno del Portale Clienti 
-- senza incontrare "Errore caricamento PDF". I path rimangono sicuri dal 
-- guessing in quanto crittografati con UUIDv4.

CREATE POLICY "Allow public read to resumes"
ON storage.objects FOR SELECT
USING (bucket_id = 'resumes');
