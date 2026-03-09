'use server'
import { createClient } from '@/shared/api/supabase/server';
import type { Project } from '../model/types';

export async function getProjects(status?: 'active' | 'completed' | 'cancelled'): Promise<Project[]> {
    const supabase = await createClient();
    let query = supabase
        .from('projects')
        .select('*, client:clients(id, name)')
        .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) {
        console.error('Failed to fetch projects:', error);
        throw new Error('프로젝트 목록을 불러오지 못했습니다.');
    }

    return (data || []) as unknown as Project[];
}
