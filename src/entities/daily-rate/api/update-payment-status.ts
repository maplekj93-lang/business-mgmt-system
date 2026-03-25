'use server'
import { revalidatePath } from 'next/cache';
import { createClient } from '@/shared/api/supabase/server';

export async function updatePaymentStatus(
    id: string,
    status: 'pending' | 'paid'
) {
    const supabase = await createClient();

    try {
        const { error } = await supabase
            .from('daily_rate_logs')
            .update({
                payment_status: status,
                payment_date: status === 'paid' ? new Date().toISOString().split('T')[0] : null,
            })
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/business/daily-rates');
        return { success: true };
    } catch (error: unknown) {
        console.error('Failed to update payment status:', error);
        return { success: false, error: '결제 상태 업데이트 중 오류가 발생했습니다.' };
    }
}
