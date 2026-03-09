'use server'

import { createClient } from '@/shared/api/supabase/server';

export interface Recommendation {
    categoryId: number;
    categoryName: string;
    confidence: number;
}

export async function getRecommendationsAction(description: string): Promise<Recommendation | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    try {
        // Query history for similar descriptions
        // We look for exact or partial matches
        const { data, error } = await supabase
            .from('transactions')
            .select(`
                category_id,
                mdt_categories!inner (name)
            `)
            .eq('user_id', user.id)
            .ilike('description', `%${description}%`)
            .not('category_id', 'is', null)
            .limit(10);

        if (error || !data || data.length === 0) return null;

        // Group by category and find the most frequent
        const counts: Record<number, { count: number, name: string }> = {};
        data.forEach((tx: any) => {
            const id = tx.category_id;
            if (!counts[id]) {
                counts[id] = { count: 0, name: tx.mdt_categories.name };
            }
            counts[id].count++;
        });

        // Sort by frequency
        const sorted = Object.entries(counts)
            .map(([id, info]) => ({
                categoryId: parseInt(id),
                categoryName: info.name,
                count: info.count
            }))
            .sort((a, b) => b.count - a.count);

        const best = sorted[0];

        return {
            categoryId: best.categoryId,
            categoryName: best.categoryName,
            confidence: best.count / data.length
        };
    } catch (e) {
        console.error('getRecommendationsAction Error:', e);
        return null;
    }
}
