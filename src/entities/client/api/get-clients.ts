'use server'
import { createClient } from '@/shared/api/supabase/server';
import type { Client } from '../model/types';

export async function getClients(): Promise<Client[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

    if (error) {
        console.error('Failed to fetch clients:', error);
        throw new Error('거래처 목록을 불러오지 못했습니다.');
    }

    return (data || []) as unknown as Client[];
}
