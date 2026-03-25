'use server'

import { createClient } from '@/shared/api/supabase/server';

export interface RecentCrewMember {
    id: string;
    name: string;
    role: string;
    last_activity: string;
    avatar_url?: string;
    status: 'online' | 'offline';
}

export async function getRecentCrew() {
    const supabase = await createClient();

    try {
        // crew_payments에서 최근 기록을 가져와 그룹화 시도
        const { data, error } = await supabase
            .from('crew_payments')
            .select(`
                crew_name,
                role,
                daily_rate_logs (
                    work_date
                )
            `)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        const crewMap = new Map<string, RecentCrewMember>();

        (data || []).forEach((row) => {
            const crewName = row.crew_name;
            if (!crewMap.has(crewName)) {
                // 부모 row의 work_date 추출 (단일 객체 혹은 배열일 수 있음)
                const workDate = Array.isArray(row.daily_rate_logs) 
                    ? row.daily_rate_logs[0]?.work_date 
                    : (row.daily_rate_logs as any)?.work_date;

                crewMap.set(crewName, {
                    id: crewName,
                    name: crewName,
                    role: row.role || '크루',
                    last_activity: workDate || '',
                    status: 'offline',
                    avatar_url: `https://i.pravatar.cc/150?u=${encodeURIComponent(crewName)}`
                });
            }
        });

        return { 
            success: true, 
            data: Array.from(crewMap.values()).slice(0, 5) 
        };
    } catch (error: unknown) {
        console.error('Failed to fetch recent crew:', error);
        return { success: false, error: '최근 크루 정보를 불러오지 못했습니다.', data: [] as RecentCrewMember[] };
    }
}
