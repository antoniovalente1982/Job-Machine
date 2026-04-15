'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

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
  const trello_board_link = formData.get('trello_board_link') as string;
  
  const { error } = await supabase.from('job_positions').insert({
    structure_id: structureId,
    title,
    salary,
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

  // Crea l'invito nel database
  const { error: inviteError } = await supabase.from('team_invites').insert({
    email,
    role,
  });
  if (inviteError) return { error: inviteError.message };

  // Crea l'utente su Supabase Auth con una password temporanea
  const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: formData.get('full_name') as string || email.split('@')[0] }
  });
  
  // Se l'utente esiste già in auth, aggiorniamo solo il profilo
  if (authError && !authError.message.includes('already')) {
    return { error: authError.message };
  }

  // Aggiorna il ruolo nel profilo se l'utente esiste già
  if (authData?.user) {
    await supabase.from('profiles').upsert({
      id: authData.user.id,
      email,
      role,
      full_name: formData.get('full_name') as string || email.split('@')[0],
    });
  }

  // Segna l'invito come accettato
  await supabase.from('team_invites').update({ accepted: true }).eq('email', email);

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
