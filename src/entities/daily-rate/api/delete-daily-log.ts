'use server'
import { createClient } from '@/shared/api/supabase/server';

export async function deleteDailyLog(id: string): Promise<void> {
    const supabase = await createClient();

    // crew_payments, site_expenses는 ON DELETE CASCADE 가정
    // 혹시 cascade 없으면 수동 삭제
    await supabase.from('crew_payments').delete().eq('daily_rate_log_id', id);
    await supabase.from('site_expenses').delete().eq('daily_rate_log_id', id);

    const { error } = await supabase
        .from('daily_rate_logs')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Failed to delete daily log:', error);
        throw new Error('일당 기록 삭제 중 오류가 발생했습니다.');
    }
}
