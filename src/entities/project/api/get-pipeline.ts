'use server'
import { createClient } from '@/shared/api/supabase/server';
import type { ProjectIncome } from '../model/types';
import type { OwnerType } from '@/shared/constants/business';

export async function getPipelineIncomes(
    ownerFilter?: OwnerType | 'all'
): Promise<ProjectIncome[]> {
    const supabase = await createClient();

    // 조인 쿼리: project_incomes -> projects -> clients
    const { data, error } = await supabase
        .from('project_incomes')
        .select(`
      *,
      project:projects (
        id, name, business_owner, categories, status,
        client:clients(id, name)
      )
    `)
        .eq('project.status', 'active')
        .order('expected_date', { ascending: true, nullsFirst: false });

    if (error) {
        console.error('Failed to fetch pipeline incomes:', error);
        throw new Error('파이프라인 데이터를 불러오지 못했습니다.');
    }

    let result = (data || []) as unknown as ProjectIncome[];

    // business_owner 필터링
    if (ownerFilter && ownerFilter !== 'all') {
        result = result.filter(income => income.project?.business_owner === ownerFilter);
    }

    return result;
}
