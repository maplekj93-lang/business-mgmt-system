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
  summary: {
    totalBalance: number;
    monthlySpent: number;
    dailyAverage: number;
  };
  recentTransactions: {
    id: string;
    date: string;
    description: string;
    amount: number;
    category: string;
    type: 'income' | 'expense';
  }[];
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

  // 3. Fetch Recent Transactions with Categories
  const { data: recentTxData } = await supabase
    .from('transactions')
    .select(`
      id,
      date,
      description,
      amount,
      mdt_categories (
        name,
        type
      )
    `)
    .order('date', { ascending: false })
    .limit(5);

  const recentTransactions = (recentTxData || []).map(tx => ({
    id: tx.id,
    date: tx.date,
    description: tx.description || '내역 없음',
    amount: Number(tx.amount),
    category: (tx.mdt_categories as any)?.name || '미분류',
    type: ((tx.mdt_categories as any)?.type || 'expense') as 'income' | 'expense'
  }));

  // 4. Calculate Summary Stats
  const monthlySpent = Number(pResult.total_expense) || 0;
  const daysInMonth = new Date().getDate();
  const dailyAverage = Math.round(monthlySpent / (daysInMonth || 1));
  
  // Total Balance Calculation (Sum of all assets current_balance)
  const { data: assetData } = await supabase.from('assets').select('current_balance');
  const totalBalance = (assetData || []).reduce((sum, asset) => sum + (Number(asset.current_balance) || 0), 0);

  return {
    personal: {
      monthlyExpense: monthlySpent,
      budget: 3000000, 
      cardSpending: 1820000, 
      nextPayment: 420000, 
      unclassifiedCount: 12 
    },
    business: {
      outstandingAmount: outstandingAmount,
      targetRevenue: 12000000, 
      currentRevenue: Number(bResult.total_income) || 0,
      activeProjectCount: activeProjects.length,
      unbilledAmount: 1200000, 
      recentProjects
    },
    summary: {
      totalBalance,
      monthlySpent,
      dailyAverage
    },
    recentTransactions
  };
}
