'use server'
import { createClient } from '@/shared/api/supabase/server';
import type { PipelineStatus } from '@/shared/constants/business';

export async function updateIncomeStatus(id: string, status: PipelineStatus) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('project_incomes')
        .update({ status })
        .eq('id', id);

    if (error) {
        console.error('Failed to update income status:', error);
        throw new Error('수입 상태를 변경하지 못했습니다.');
    }
}
