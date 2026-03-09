'use server'
import { createClient } from '@/shared/api/supabase/server';

export async function updatePaymentStatus(
    id: string,
    status: 'pending' | 'paid'
): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('daily_rate_logs')
        .update({
            payment_status: status,
            payment_date: status === 'paid' ? new Date().toISOString().split('T')[0] : null,
        })
        .eq('id', id);

    if (error) {
        console.error('Failed to update payment status:', error);
        throw new Error('결제 상태 업데이트 중 오류가 발생했습니다.');
    }
}
