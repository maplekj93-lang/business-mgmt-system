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

export async function getRecentCrew(): Promise<RecentCrewMember[]> {
    const supabase = await createClient();

    // crew_payments에서 최근 기록을 가져와 그룹화 시도
    // 단순화를 위해 최근 기록 10개를 가져와 유니크한 크루 이름 기준으로 요약
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

    if (error) {
        console.error('Failed to fetch recent crew:', error);
        return [];
    }

    const crewMap = new Map<string, RecentCrewMember>();

    data.forEach((row: any) => {
        if (!crewMap.has(row.crew_name)) {
            crewMap.set(row.crew_name, {
                id: row.crew_name, // 이름으로 ID 대체
                name: row.crew_name,
                role: row.role || '크루',
                last_activity: row.daily_rate_logs?.work_date || '',
                status: 'offline', // 실시간 상태 정보가 없으므로 기본값
                avatar_url: `https://i.pravatar.cc/150?u=${encodeURIComponent(row.crew_name)}`
            });
        }
    });

    return Array.from(crewMap.values()).slice(0, 5);
}
