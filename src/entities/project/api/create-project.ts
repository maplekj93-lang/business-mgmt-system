'use server'
import { createClient } from '@/shared/api/supabase/server';
import type { Project } from '../model/types';

type CreateProjectInput = Omit<Project, 'id' | 'created_at' | 'client' | 'project_incomes'>;

export async function createProject(input: CreateProjectInput): Promise<Project> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from('projects')
        .insert({ ...input, user_id: user?.id, checklist: input.checklist ?? [] })
        .select('*, client:clients(id, name)')
        .single();

    if (error) {
        console.error('Failed to create project:', error);
        throw new Error('프로젝트 생성 중 오류가 발생했습니다.');
    }

    return data as unknown as Project;
}
