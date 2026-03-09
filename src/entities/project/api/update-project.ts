'use server'
import { createClient } from '@/shared/api/supabase/server';
import type { Project } from '../model/types';

type UpdateProjectInput = Partial<Omit<Project, 'id' | 'created_at' | 'client' | 'project_incomes'>>;

export async function updateProject(id: string, input: UpdateProjectInput): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('projects')
        .update(input as any)
        .eq('id', id);

    if (error) {
        console.error('Failed to update project:', error);
        throw new Error('프로젝트 업데이트 중 오류가 발생했습니다.');
    }
}
