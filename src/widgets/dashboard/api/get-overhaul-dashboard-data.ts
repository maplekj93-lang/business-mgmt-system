'use server';

import { createClient } from '@/shared/api/supabase/server';
import { getMonthlyStats, DashboardStats } from '@/entities/transaction/api/get-monthly-stats';
import { getProjects } from '@/entities/project/api/get-projects';

export interface OverhaulDashboardData {
  personal: {
    monthlyExpense: number;
    budget: number;
    cardSpending: number;
    nextPayment: number;
    unclassifiedCount: number;
  };
  business: {
    outstandingAmount: number;
    targetRevenue: number;
    currentRevenue: number;
    activeProjectCount: number;
    unbilledAmount: number;
    recentProjects: {
      name: string;
      status: string;
      date: string;
      amount: number;
    }[];
  };
}

export async function getOverhaulDashboardData(): Promise<OverhaulDashboardData> {
  // 1. Fetch Basic Stats for both modes
  const personalStats = await getMonthlyStats({ mode: 'personal' }); 
  
  // For now, let's manually call the RPC if needed or assume we can override.
  // Actually, I'll create a dedicated fetcher here to be sure.
  const supabase = await createClient();

  // Fetch Personal Data (Explicitly)
  const { data: pData } = await supabase.rpc('get_dashboard_stats', { p_mode: 'personal' });
  const pResult = pData && Array.isArray(pData) ? pData[0] : { total_expense: 0 };

  // Fetch Business Data (Explicitly)
  const { data: bData } = await supabase.rpc('get_dashboard_stats', { p_mode: 'business' });
  const bResult = bData && Array.isArray(bData) ? bData[0] : { total_income: 0 };

  // 2. Fetch Business Projects for Receivables and Active Projects
  const allProjects = await getProjects();
  
  const outstandingAmount = allProjects.reduce((acc, project) => {
    const unpaidIncomes = project.project_incomes?.filter(inc => inc.status !== '입금완료') || [];
    return acc + unpaidIncomes.reduce((sum, inc) => sum + inc.amount, 0);
  }, 0);

  const activeProjects = allProjects.filter(p => p.status === 'active');
  
  const recentProjects = allProjects.slice(0, 5).map(p => ({
    name: p.name,
    status: p.status === 'active' ? '진행중' : p.status === 'completed' ? '완료' : '대기',
    date: p.end_date || p.created_at.split('T')[0],
    amount: p.project_incomes?.reduce((sum, inc) => sum + inc.amount, 0) || 0
  }));

  // 3. Mock/Calculate extra fields (Budget, Card spending etc for now)
  // In a real scenario, these would come from specific tables or settings.
  return {
    personal: {
      monthlyExpense: Number(pResult.total_expense) || 0,
      budget: 3000000, // Placeholder
      cardSpending: 1820000, // Placeholder
      nextPayment: 420000, // Placeholder
      unclassifiedCount: 12 // Placeholder
    },
    business: {
      outstandingAmount: outstandingAmount,
      targetRevenue: 12000000, // Placeholder
      currentRevenue: Number(bResult.total_income) || 0,
      activeProjectCount: activeProjects.length,
      unbilledAmount: 1200000, // Placeholder
      recentProjects
    }
  };
}
