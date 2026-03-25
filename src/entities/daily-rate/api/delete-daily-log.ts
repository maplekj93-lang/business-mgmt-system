'use server'
import { revalidatePath } from 'next/cache';
import { createClient } from '@/shared/api/supabase/server';

export async function deleteDailyLog(id: string) {
    const supabase = await createClient();

    try {
        // 종속 데이터 삭제 (CASCADE가 없을 경우를 대비해 순차 삭제 고려)
        await supabase.from('crew_payments').delete().eq('daily_rate_log_id', id);
        await supabase.from('site_expenses').delete().eq('daily_rate_log_id', id);

        const { error } = await supabase
            .from('daily_rate_logs')
            .delete()
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/business/daily-rates');
        return { success: true };
    } catch (error: unknown) {
        console.error('Failed to delete daily log:', error);
        return { success: false, error: '일당 기록 삭제 중 오류가 발생했습니다.' };
    }
}
