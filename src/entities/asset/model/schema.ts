import { z } from 'zod';

export const AssetTypeSchema = z.enum(['bank_account', 'credit_card', 'cash', 'other']);
export type AssetType = z.infer<typeof AssetTypeSchema>;

export const OwnerTypeSchema = z.enum([
    'kwangjun',
    'euiyoung',
    'joint',
    'business',
    'other'
]);
export type OwnerType = z.infer<typeof OwnerTypeSchema>;

export const AssetSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    name: z.string().min(1, '자산 이름은 필수입니다.'),
    asset_type: AssetTypeSchema,
    owner_type: OwnerTypeSchema,
    identifier_keywords: z.array(z.string()).default([]),
    is_hidden: z.boolean().default(false),
    memo: z.string().nullable().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
    last_synced_at: z.string().nullable().optional(), // [NEW] Import Sync Guide
});

export type Asset = z.infer<typeof AssetSchema>;

export const CreateAssetSchema = AssetSchema.pick({
    name: true,
    asset_type: true,
    owner_type: true,
    identifier_keywords: true,
    is_hidden: true,
    memo: true,
}).partial({
    identifier_keywords: true,
    is_hidden: true,
    memo: true,
});
export type CreateAssetDTO = z.infer<typeof CreateAssetSchema>;

export const UpdateAssetSchema = CreateAssetSchema.partial();
export type UpdateAssetDTO = z.infer<typeof UpdateAssetSchema>;

// [NEW] 동기화 가이드 화면용 집계 타입
export interface AssetSyncInfo {
    asset_id: string;
    asset_name: string;
    asset_type: string;
    last_synced_at: string | null;
    last_transaction_date: string | null;    // YYYY-MM-DD
    recommended_start_date: string;           // YYYY-MM-DD (계산된 값)
}
