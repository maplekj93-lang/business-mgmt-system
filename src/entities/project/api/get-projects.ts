'use server'
import { createClient } from '@/shared/api/supabase/server';
import type { Project } from '../model/types';
import type { OwnerType, ProjectStatus } from '@/shared/constants/business';

interface GetProjectsOptions {
    status?: ProjectStatus;
    owner?: OwnerType | 'all';
}

export async function getProjects(
    statusOrOptions?: ProjectStatus | 'active' | 'completed' | 'cancelled' | GetProjectsOptions
): Promise<Project[]> {
    const supabase = await createClient();

    // 하위 호환: 문자열로 status만 넘기는 기존 호출 지원
    const options: GetProjectsOptions = typeof statusOrOptions === 'string'
        ? { status: statusOrOptions as ProjectStatus }
        : (statusOrOptions ?? {});

    let query = supabase
        .from('projects')
        .select('*, client:clients(id, name), project_incomes(*)')
        .order('created_at', { ascending: false });

    if (options.status) query = query.eq('status', options.status);
    if (options.owner && options.owner !== 'all') query = query.eq('business_owner', options.owner);

    const { data, error } = await query;
    if (error) {
        console.error('Failed to fetch projects:', error);
        throw new Error('프로젝트 목록을 불러오지 못했습니다.');
    }

    return (data || []) as unknown as Project[];
}
