'use server';

import { supabase } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/email';

// Creazione Cliente
export async function createClient(formData: FormData) {
  const name = formData.get('name') as string;
  const slug = name.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^\w-]/g, '');

  const { error } = await supabase.from('clients').insert({ name, slug });
  if (error) return { error: error.message };
  
  revalidatePath('/');
  return { success: true };
}

// Creazione Struttura
export async function createStructure(clientId: string, formData: FormData) {
  const name = formData.get('name') as string;
  const location = formData.get('location') as string;
  
  const { error } = await supabase.from('structures').insert({
    client_id: clientId,
    name,
    location
  });
  if (error) return { error: error.message };

  revalidatePath('/');
  return { success: true };
}

// Creazione Posizione Lavorativa
export async function createJobPosition(structureId: string, formData: FormData) {
  const title = formData.get('title') as string;
  const salary = formData.get('salary') as string;
  const public_description = formData.get('public_description') as string;
  const trello_board_link = formData.get('trello_board_link') as string;
  
  const { error } = await supabase.from('job_positions').insert({
    structure_id: structureId,
    title,
    salary,
    public_description,
    trello_board_link,
    status: 'open',
    icon_name: 'ConciergeBell'
  });
  
  if (error) return { error: error.message };

  revalidatePath('/');
  return { success: true };
}

// === GESTIONE STATO POSIZIONI (come Greenhouse/Lever) ===

export async function updateJobStatus(jobId: string, newStatus: string) {
  const updateData: any = { status: newStatus };
  
  if (newStatus === 'closed') {
    updateData.closed_at = new Date().toISOString();
  }
  if (newStatus === 'open') {
    updateData.closed_at = null;
    updateData.is_active = true;
  }
  if (newStatus === 'archived') {
    updateData.is_active = false;
  }

  const { error } = await supabase.from('job_positions').update(updateData).eq('id', jobId);
  if (error) return { error: error.message };

  revalidatePath('/');
  return { success: true };
}

// === TEAM MANAGEMENT ===

export async function inviteTeamMember(formData: FormData) {
  const email = formData.get('email') as string;
  const role = formData.get('role') as string;
  const fullName = formData.get('full_name') as string || email.split('@')[0];

  // Usa il client Admin (service_role) per creare l'utente
  const adminSb = getSupabaseAdmin();

  // Genera password temporanea sicura
  const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';

  // 1. Crea l'utente su Supabase Auth
  const { data: authData, error: authError } = await adminSb.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true, // Conferma email automaticamente
    user_metadata: { full_name: fullName }
  });
  
  if (authError) {
    // Se l'utente esiste già, non è un errore critico
    if (authError.message.includes('already')) {
      return { error: 'Questo utente esiste già nel sistema. Puoi cambiare il suo ruolo dalla lista team.' };
    }
    console.error('[INVITE] Errore creazione utente:', authError.message);
    return { error: `Errore creazione utente: ${authError.message}` };
  }

  // 2. Crea/aggiorna il profilo con il ruolo
  if (authData?.user) {
    await adminSb.from('profiles').upsert({
      id: authData.user.id,
      email,
      role,
      full_name: fullName,
    });
  }

  // 3. Registra l'invito
  await supabase.from('team_invites').insert({
    email,
    role,
    accepted: true,
  });

  // 4. Invia email con le credenziali di accesso
  const loginUrl = process.env.NEXT_PUBLIC_SITE_URL 
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/login`
    : 'https://jobmachine.biz/login';

  try {
    await sendEmail({
      to: email,
      subject: '🚀 Benvenuto in Job Machine — Le tue credenziali di accesso',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 24px; color: #1a1a2e; margin: 0;">Job Machine</h1>
            <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Piattaforma di Recruiting</p>
          </div>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="margin: 0 0 16px; font-size: 16px; color: #1a1a2e;">
              Ciao <strong>${fullName}</strong>,
            </p>
            <p style="margin: 0 0 16px; font-size: 14px; color: #374151; line-height: 1.6;">
              Sei stato invitato come <strong>${role === 'admin' ? 'Amministratore' : 'Operatore'}</strong> sulla piattaforma Job Machine.
            </p>
            <p style="margin: 0 0 8px; font-size: 14px; color: #374151;">
              Ecco le tue credenziali di accesso:
            </p>
          </div>

          <div style="background: #1a1a2e; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <div style="margin-bottom: 12px;">
              <span style="color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Email</span>
              <div style="color: #ffffff; font-size: 15px; font-weight: 600; margin-top: 2px;">${email}</div>
            </div>
            <div>
              <span style="color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Password temporanea</span>
              <div style="color: #60a5fa; font-size: 18px; font-weight: 700; font-family: monospace; margin-top: 2px; letter-spacing: 1px;">${tempPassword}</div>
            </div>
          </div>

          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${loginUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px;">
              Accedi a Job Machine →
            </a>
          </div>

          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
            Ti consigliamo di cambiare la password al primo accesso.
          </p>
        </div>
      `,
      text: `Ciao ${fullName}, sei stato invitato su Job Machine come ${role === 'admin' ? 'Amministratore' : 'Operatore'}.\n\nEmail: ${email}\nPassword temporanea: ${tempPassword}\n\nAccedi qui: ${loginUrl}\n\nTi consigliamo di cambiare la password al primo accesso.`
    });
  } catch (emailErr: any) {
    // L'utente è stato creato, ma l'email non è partita.
    // Mostriamo comunque la password temporanea nell'interfaccia.
    console.error('[INVITE] Errore invio email:', emailErr.message);
  }

  revalidatePath('/');
  return { success: true, tempPassword };
}


export async function updateUserRole(userId: string, newRole: string) {
  const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
  if (error) return { error: error.message };
  revalidatePath('/');
  return { success: true };
}

// === PIPELINE CANDIDATI ===

export async function updateCandidateChecklist(candidateId: string, field: string, value: boolean) {
  const { error } = await supabase.from('candidates').update({ [field]: value }).eq('id', candidateId);
  if (error) return { error: error.message };
  revalidatePath('/');
  return { success: true };
}

export async function updateCandidateNotes(candidateId: string, notes: string) {
  const { error } = await supabase.from('candidates').update({ internal_notes: notes }).eq('id', candidateId);
  if (error) return { error: error.message };
  revalidatePath('/');
  return { success: true };
}

export async function updateJobPipelineStages(jobId: string, stages: any[]) {
  const { error } = await supabase.from('job_positions').update({ pipeline_stages: stages }).eq('id', jobId);
  if (error) return { error: error.message };
  revalidatePath('/');
  return { success: true };
}

export async function updateJobFormSchema(jobId: string, formSchema: any[]) {
  const { error } = await supabase.from('job_positions').update({ form_schema: formSchema }).eq('id', jobId);
  if (error) return { error: error.message };
  revalidatePath('/');
  return { success: true };
}

export async function updateJobPublicDescription(jobId: string, public_description: string) {
  const { error } = await supabase.from('job_positions').update({ public_description }).eq('id', jobId);
  if (error) return { error: error.message };
  revalidatePath('/');
  return { success: true };
}

export async function moveCandidatePipeline(
  candidateId: string, 
  newStage: string, 
  emailConfig?: { autoEmail: boolean; emailSubject?: string; emailBody?: string }
) {
  // First, get the candidate info so we have their email and name
  const { data: candidate, error: fetchErr } = await supabase
    .from('candidates')
    .select('email, first_name')
    .eq('id', candidateId)
    .single();

  const { error } = await supabase
    .from('candidates')
    .update({ pipeline_stage: newStage })
    .eq('id', candidateId);
    
  if (error) return { error: error.message };
  
  // If stage has autoEmail configured, trigger the email
  if (candidate && emailConfig?.autoEmail && emailConfig.emailSubject && emailConfig.emailBody) {
     const personalizedBody = emailConfig.emailBody.replace(/{Nome}/g, candidate.first_name);
     await sendEmail({
       to: candidate.email,
       subject: emailConfig.emailSubject,
       text: personalizedBody
     });
  }

  revalidatePath('/');
  return { success: true };
}

// === CANDIDATI MANUALI PIPELINE ===

export async function addManualCandidate(jobId: string, firstName: string, lastName: string, email: string, stage: string) {
  const { error } = await supabase.from('candidates').insert({
    job_id: jobId,
    first_name: firstName,
    last_name: lastName,
    email: email,
    pipeline_stage: stage,
    checklist_msg1_sent: false,
    checklist_msg2_sent: false,
    checklist_quest_done: false,
    checklist_remind_cv: false,
    checklist_cv_done: false,
  });
  if (error) return { error: error.message };
  revalidatePath('/');
  return { success: true };
}

// === CV DOWNLOAD URL ===

export async function getCvSignedUrl(filePath: string): Promise<{ url: string | null; error?: string }> {
  const { data, error } = await supabase.storage
    .from('resumes')
    .createSignedUrl(filePath, 60 * 60); // 1 ora di validità
  if (error) return { url: null, error: error.message };
  return { url: data.signedUrl };
}

// === CHECKLIST LABELS PERSONALIZZATE PER JOB ===

export async function updateJobChecklistLabels(jobId: string, labels: string[]) {
  const { error } = await supabase
    .from('job_positions')
    .update({ checklist_labels: labels })
    .eq('id', jobId);
  if (error) return { error: error.message };
  revalidatePath('/');
  return { success: true };
}

// === TEMPLATE MESSAGGI ===

export async function createTemplateMessage(title: string, subject: string, body: string) {
  const { error } = await supabase.from('message_templates').insert({ title, subject, body });
  if (error) return { error: error.message };
  revalidatePath('/templates');
  return { success: true };
}

export async function updateTemplateMessage(id: string, title: string, subject: string, body: string) {
  const { error } = await supabase.from('message_templates').update({ title, subject, body }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/templates');
  return { success: true };
}

export async function deleteTemplateMessage(id: string) {
  const { error } = await supabase.from('message_templates').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/templates');
  return { success: true };
}
