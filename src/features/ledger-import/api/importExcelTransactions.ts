import { createClient } from '@/shared/api/supabase/client';
import { generateImportHash, chunkArray } from '../lib/utils';
import type { ExcelTransactionRow } from '../model/types';

const CHUNK_SIZE = 150;  // 1회 upsert 최대 건수

export interface ImportResult {
    inserted: number;
    skipped: number;
    errors: string[];
}

/**
 * 파싱된 엑셀 데이터를 Supabase에 저장.
 *
 * 동작:
 *   1. 각 row에 import_hash 생성
 *   2. 150건씩 청크 분할
 *   3. 청크별 upsert (중복 hash는 ignoreDuplicates로 무시)
 *   4. 전체 성공 시 assets.last_synced_at 업데이트
 */
export async function importExcelTransactions(
    rows: ExcelTransactionRow[],
    assetId: string
): Promise<ImportResult> {
    const supabase = createClient();
    const result: ImportResult = { inserted: 0, skipped: 0, errors: [] };

    // ① 해시 생성 및 데이터 준비
    const preparedRows = await Promise.all(
        rows.map(async (row) => ({
            ...row, // Copy other fields that might be mapped via row (amount, description, etc)
            asset_id: row.asset_id,
            date: row.date,            // YYYY-MM-DD 정규화된 상태
            amount: row.amount,
            description: row.description.trim(),
            raw_description: row.raw_description || row.description,
            source: 'EXCEL' as const,
            import_hash: await generateImportHash(
                row.date,
                row.asset_id,
                row.amount,
                row.description
            ),
        }))
    );

    // ② 청크 분할 후 순차 upsert
    const chunks = chunkArray(preparedRows, CHUNK_SIZE);

    for (const [i, chunk] of chunks.entries()) {
        const { data, error } = await supabase
            .from('transactions')
            .upsert(chunk, {
                onConflict: 'import_hash',
                ignoreDuplicates: true,  // 중복 hash → 조용히 무시
            })
            .select('id');

        if (error) {
            result.errors.push(`청크 ${i + 1}/${chunks.length} 오류: ${error.message}`);
            continue;
        }

        // upsert에서 ignoreDuplicates=true이면 실제 삽입된 건만 반환됨
        result.inserted += data?.length ?? 0;
        result.skipped += chunk.length - (data?.length ?? 0);
    }

    // ③ 오류 없이 완료 시 last_synced_at 업데이트
    if (result.errors.length === 0) {
        await supabase
            .from('assets')
            .update({ last_synced_at: new Date().toISOString() } as any)
            .eq('id', assetId);
    }

    return result;
}
