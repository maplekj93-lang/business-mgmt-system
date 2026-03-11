'use server';

import { createClient } from '@/shared/api/supabase/server';

export interface ClientLeadTimeStats {
  client_name: string;
  avg_lead_days: number;
  min_lead_days: number;
  max_lead_days: number;
  recent_projects: { name: string; lead_days: number; date: string }[];
}

export async function getClientLeadTime(clientId: string): Promise<ClientLeadTimeStats | null> {
  const supabase = await createClient();

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('name')
    .eq('id', clientId)
    .single();

  if (clientError || !client) {
    return null;
  }

  // Fetch completed projects with both invoice and actual payment dates
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('name, invoice_sent_date, actual_payment_date')
    .eq('client_id', clientId)
    .not('invoice_sent_date', 'is', null)
    .not('actual_payment_date', 'is', null)
    .order('actual_payment_date', { ascending: false })
    .limit(10);

  if (projectsError || !projects || projects.length === 0) {
    return {
      client_name: client.name,
      avg_lead_days: 0,
      min_lead_days: 0,
      max_lead_days: 0,
      recent_projects: []
    };
  }

  let totalDays = 0;
  let minDays = Infinity;
  let maxDays = 0;
  
  const recent_projects = projects.map(p => {
    const start = new Date(p.invoice_sent_date!);
    const end = new Date(p.actual_payment_date!);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const leadDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    totalDays += leadDays;
    if (leadDays < minDays) minDays = leadDays;
    if (leadDays > maxDays) maxDays = leadDays;

    return {
      name: p.name,
      lead_days: leadDays,
      date: p.actual_payment_date!
    };
  });

  return {
    client_name: client.name,
    avg_lead_days: Math.round(totalDays / projects.length),
    min_lead_days: minDays === Infinity ? 0 : minDays,
    max_lead_days: maxDays,
    recent_projects
  };
}
