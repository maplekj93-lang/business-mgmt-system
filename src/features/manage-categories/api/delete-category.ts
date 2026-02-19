'use server'

import { createClient } from '@/shared/api/supabase/server';
import { revalidatePath } from 'next/cache';

export async function deleteCategory(id: number) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('mdt_categories')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('deleteCategory Error:', error);
        // Error code 23503 is Foreign Key Violation in Postgres
        if (error.code === '23503') {
            return {
                success: false,
                message: '거래 내역이 연결되어 있어 삭제할 수 없습니다. 먼저 거래 내역의 카테고리를 변경해 주세요.'
            };
        }
        return { success: false, message: error.message };
    }

    revalidatePath('/settings/categories');
    return { success: true };
}
