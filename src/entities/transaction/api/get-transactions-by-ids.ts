'use server';

import { createClient } from '@/shared/api/supabase/server';

export interface TransactionDetail {
  id: string;
  date: string;
  amount: number;
  description: string;
  asset_name?: string;
  asset_owner?: string;
  receipt_memo?: string;
}

/**
 * 트랜잭션 ID 목록을 받아 상세 정보(자산명 포함)를 조회합니다.
 */
export async function getTransactionsByIds(
  ids: string[]
): Promise<TransactionDetail[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !ids || ids.length === 0) return [];

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      id,
      date,
      amount,
      description,
      receipt_memo,
      assets (
        name,
        owner_type
      )
    `)
    .in('id', ids)
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) {
    console.error('Failed to fetch transaction details:', error);
    return [];
  }

  return data.map((tx: any) => ({
    id: tx.id,
    date: tx.date,
    amount: tx.amount,
    description: tx.description,
    receipt_memo: tx.receipt_memo,
    asset_name: tx.assets?.name,
    asset_owner: tx.assets?.owner_type,
  }));
}
