import { supabase } from '@/lib/supabase';
import DashboardClient from './DashboardClient';

// Disabilita cache per dati sempre freschi
export const revalidate = 0;

export default async function DashboardPage() {
  // Fetch dati lato server — il browser riceve la pagina già pronta
  const [clientsRes, structuresRes, jobsRes, candidatesRes] = await Promise.all([
    supabase.from('clients').select('id, name, slug, structures(id, name, job_positions(id))').order('name'),
    supabase.from('structures').select('id', { count: 'exact', head: true }),
    supabase.from('job_positions').select('id', { count: 'exact', head: true }),
    supabase.from('candidates').select('id, pipeline_stage'),
  ]);

  const clients = clientsRes.data || [];
  const allCandidates = candidatesRes.data || [];
  const hiredCount = allCandidates.filter((c: any) => c.pipeline_stage === 'assunto').length;

  const initialData = {
    clients,
    stats: {
      clients: clients.length,
      structures: structuresRes.count || 0,
      jobs: jobsRes.count || 0,
      candidates: allCandidates.length,
      hired: hiredCount,
    }
  };

  return <DashboardClient initialData={initialData} />;
}
