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
    icon_name: 'ConciergeBell' // Default fallback
  });
  
  if (error) return { error: error.message };

  revalidatePath('/');
  return { success: true };
}
