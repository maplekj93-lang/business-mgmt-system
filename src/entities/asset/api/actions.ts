'use server'

import { createClient } from '@/shared/api/supabase/server';
import { revalidatePath } from 'next/cache';
import { CreateAssetDTO, UpdateAssetDTO, CreateAssetSchema, UpdateAssetSchema } from '../model/schema';

export async function createAsset(data: CreateAssetDTO) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Unauthorized' };
    }

    try {
        const validatedData = CreateAssetSchema.parse(data);

        const { data: asset, error } = await supabase
            .from('assets')
            .insert({
                ...validatedData,
                user_id: user.id
            })
            .select()
            .single();

        if (error) {
            console.error('Create asset error:', error);
            return { error: error.message };
        }

        revalidatePath('/settings/assets');
        return { data: asset };
    } catch (e: any) {
        console.error('Validation/Insert asset error:', e);
        return { error: e.message || 'Validation failed' };
    }
}

export async function updateAsset(id: string, updates: UpdateAssetDTO) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Unauthorized' };
    }

    try {
        const validatedData = UpdateAssetSchema.parse(updates);

        if (Object.keys(validatedData).length === 0) {
            return { error: 'No data to update' };
        }

        const { data: asset, error } = await supabase
            .from('assets')
            .update({
                ...validatedData,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            console.error('Update asset error:', error);
            return { error: error.message };
        }

        revalidatePath('/settings/assets');
        return { data: asset };
    } catch (e: any) {
        console.error('Validation/Update asset error:', e);
        return { error: e.message || 'Validation failed' };
    }
}

export async function deleteAsset(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Unauthorized' };
    }

    const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Delete asset error:', error);
        return { error: error.message };
    }

    revalidatePath('/settings/assets');
    return { success: true };
}
