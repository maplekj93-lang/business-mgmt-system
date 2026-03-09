import { useState, useEffect } from 'react';
import { createClient } from '@/shared/api/supabase/client';
import { calculateRecommendedDate } from '../lib/utils';
import type { AssetSyncInfo } from '@/entities/asset/model/schema';

async function fetchSyncGuideData(): Promise<AssetSyncInfo[]> {
    const supabase = createClient();
    const { data, error } = await (supabase.rpc as any)('get_asset_sync_guide');
    if (error) throw error;

    // recommended_start_date는 프론트에서 계산 (SQL에서도 계산되지만 오버라이드)
    return (data as any[]).map(asset => ({
        asset_id: asset.asset_id,
        asset_name: asset.asset_name,
        asset_type: asset.asset_type,
        last_synced_at: asset.last_synced_at,
        last_transaction_date: asset.last_transaction_date,
        recommended_start_date: calculateRecommendedDate(
            asset.last_transaction_date,
            asset.last_synced_at
        ),
    })) as AssetSyncInfo[];
}

export function useImportSyncGuide() {
    const [data, setData] = useState<AssetSyncInfo[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    const refresh = async () => {
        setIsLoading(true);
        try {
            const result = await fetchSyncGuideData();
            setData(result);
            setIsError(false);
        } catch (error) {
            console.error(error);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    return { data, isLoading, isError, refresh };
}
