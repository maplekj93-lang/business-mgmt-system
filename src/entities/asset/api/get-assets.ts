'use server'

import { createClient } from '@/shared/api/supabase/server';
import { Asset } from '../model/schema';
import { unstable_noStore as noStore } from 'next/cache';

export async function getAssets(): Promise<Asset[]> {
    noStore();

    // 1. Get authenticated user from current session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    // 2. Fetch assets using standard authenticated client
    // (RLS handles the user isolation automatically now that table GRANTs are fixed)
    const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('name');

    if (error) {
        console.error('getAssets Error:', error);
        return [];
    }

    return data as Asset[];
}
