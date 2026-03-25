import { z } from 'zod';

export const CashflowInsightSchema = z.object({
    business_income: z.number(),
    business_expense: z.number(),
    personal_income: z.number(),
    personal_expense: z.number(),
    expected_income: z.number(),
    pending_count: z.number().optional().default(0),
    total_count: z.number().optional().default(0),
});

export type CashflowInsight = z.infer<typeof CashflowInsightSchema>;
