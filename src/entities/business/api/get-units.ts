'use server'

import { createClient } from '@/shared/api/supabase/server';
import { BusinessUnit } from '../model/types';

export async function getBusinessUnits(): Promise<BusinessUnit[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('business_units')
        .select('*')
        .order('name');

    if (error) {
        console.error('getBusinessUnits Error:', error);
        return [];
    }

    // Cast the JSONB metadata to our interface
    return data.map((unit: any) => ({
        ...unit,
        metadata: unit.metadata as any
    })) as BusinessUnit[];
}
