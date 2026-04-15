'use server'

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function submitApplication(jobId: string, formData: FormData) {
  try {
    const firstName = formData.get('first_name') as string;
    const lastName = formData.get('last_name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    
    // Raccogliamo le risposte al questionario fisse testuali
    const motivation = formData.get('motivation') as string;
    const experience = formData.get('experience') as string;
    const residency = formData.get('residency') as string;
    
    const questionnaire_responses = {
      motivation,
      experience,
      residency
    };

    // Estraiamo il file Curriculum Vitae
    const cvFile = formData.get('cv_file') as File;
    let cv_file_path = null;

    if (cvFile && cvFile.size > 0) {
      // Normalizziamo il nome file
      const safeName = `${Date.now()}_${cvFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
      const filePath = `candidati/${jobId}/${safeName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, cvFile);
        
      if (uploadError) {
        throw new Error(`Errore caricamento CV: ${uploadError.message}`);
      }
      
      cv_file_path = uploadData.path;
    }

    // Inseriamo a db il candidato
    const { data: candidate, error: dbError } = await supabase
      .from('candidates')
      .insert({
        job_id: jobId,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        questionnaire_responses,
        cv_file_path,
        status: 'form_completed' // Salta il 'new' e andiamo dritti al completamento
      })
      .select()
      .single();

    if (dbError) throw new Error(`Errore inserimento DB: ${dbError.message}`);

    // NOTA: Qui è dove inseriremo in un secondo momento l'invocazione alle API di Trello!

    return { success: true, message: 'Candidatura inviata con successo!' };
  } catch (error: any) {
    console.error('Submit application error:', error);
    return { success: false, message: error.message || 'Errore di sistema' };
  }
}
