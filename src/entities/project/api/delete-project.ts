'use server'
import { createClient } from '@/shared/api/supabase/server';

export async function deleteProject(id: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Failed to delete project:', error);
        throw new Error('프로젝트 삭제 중 오류가 발생했습니다.');
    }
}
