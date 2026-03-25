'use server'

import { createClient } from '@/shared/api/supabase/server';
import { revalidatePath } from 'next/cache';

export async function upsertCategory(formData: {
    id?: number;
    name: string;
    parent_id: number | null;
    type: 'income' | 'expense' | 'transfer';
    is_business_only: boolean;
    ui_config: { icon: string; color: string };
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, message: 'Authentication required' };

    const payload = {
        name: formData.name,
        parent_id: formData.parent_id,
        type: formData.type,
        is_business_only: formData.is_business_only,
        ui_config: formData.ui_config,
        user_id: user.id
    };

    let error;
    if (formData.id) {
        // Update
        const { error: updateError } = await (supabase
            .from('mdt_categories') as any)
            .update(payload)
            .eq('id', formData.id);
        error = updateError;
    } else {
        // Insert
        const { error: insertError } = await (supabase
            .from('mdt_categories') as any)
            .insert(payload);
        error = insertError;
    }

    if (error) {
        console.error('upsertCategory Error:', error);
        return { success: false, message: error.message };
    }

    revalidatePath('/settings/classification');
    return { success: true };
}
