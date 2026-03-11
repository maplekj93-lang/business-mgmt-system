import { NextResponse } from 'next/server';
import { createClient } from '@/shared/api/supabase/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'personal';
    const month = parseInt(searchParams.get('month') || '11');
    const year = parseInt(searchParams.get('year') || '2025');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'No user' }, { status: 401 });
    }

    const { data, error } = await (supabase.rpc as any)('get_advanced_analytics', {
        p_mode: mode,
        p_month: month,
        p_year: year
    });

    return NextResponse.json({
        user: user.id,
        params: { mode, month, year },
        error,
        data,
        result: data && Array.isArray(data) && data[0] ? data[0] : null
    });
}
