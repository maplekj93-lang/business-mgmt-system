'use server';

import { createClient } from '@/shared/api/supabase/server';

export interface OverdueProject {
  id: string;
  name: string;
  amount: number;
  client_name: string;
  overdue_days: number;
}

export async function getOverdueProjects(): Promise<OverdueProject[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      id, 
      name, 
      invoice_sent_date, 
      expected_payment_date,
      clients (name),
      project_incomes (amount, matched_transaction_id)
    `)
    .not('invoice_sent_date', 'is', null)
    .is('actual_payment_date', null);

  if (error || !projects) {
    console.error('Failed to fetch overdue projects:', error);
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueList: OverdueProject[] = [];

  projects.forEach((p) => {
    const incomes = (p.project_incomes as unknown as any[]) || [];
    const outstandingIncomes = incomes.filter(i => !i.matched_transaction_id);
    const amount = outstandingIncomes.reduce((acc, curr) => acc + Number(curr.amount), 0);

    if (amount <= 0) return;

    const targetDateStr = p.expected_payment_date || p.invoice_sent_date; 
    const targetDate = new Date(targetDateStr!);
    
    if (!p.expected_payment_date) {
        targetDate.setDate(targetDate.getDate() + 30);
    }
    
    const diffTime = today.getTime() - targetDate.getTime();
    const overdueDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (overdueDays > 0) {
      overdueList.push({
        id: p.id,
        name: p.name,
        amount,
        client_name: (p.clients as any)?.name || 'Unknown',
        overdue_days: overdueDays
      });
    }
  });

  return overdueList.sort((a, b) => b.overdue_days - a.overdue_days);
}
