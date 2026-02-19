import { z } from 'zod';

const uiConfigSchema = z.object({
    icon: z.string().default('default'),
    color: z.string().default('gray'),
}).catchall(z.any());

// Reference: mdt_categories table
export const categorySchema = z.object({
    id: z.number(),
    name: z.string(),
    parent_id: z.number().nullable().optional(),
    type: z.enum(['income', 'expense', 'transfer']).optional(),
    ui_config: uiConfigSchema.optional(),
    parent: z.object({
        id: z.number(),
        name: z.string(),
        ui_config: uiConfigSchema.optional(),
    }).optional().nullable(),
});

// Reference: transactions table
export const transactionSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),

    // Relations
    category_id: z.number().nullable(),
    category: categorySchema.optional().nullable(), // Joined View

    // Dual-Track Logic
    allocation_status: z.enum(['personal', 'business_unallocated', 'business_allocated']),
    business_unit_id: z.string().uuid().nullable().optional(),

    // Core Data
    amount: z.number(), // Processed as number in JS, Decimal in DB
    original_currency: z.string().default('KRW'),
    date: z.string(), // YYYY-MM-DD
    description: z.string().nullable(),

    // Metadata
    import_batch_id: z.string().uuid().nullable().optional(),
    source_raw_data: z.record(z.string(), z.any()).optional().nullable(), // JSONB
});

export type Category = z.infer<typeof categorySchema>;
export type Transaction = z.infer<typeof transactionSchema>;
