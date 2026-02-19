import { z } from 'zod';

export const MonthlyStatSchema = z.object({
    year: z.number(),
    month: z.number(),
    income: z.number(),
    expense: z.number(),
    profit: z.number(), // Net (Income - Expense)
});

export const UnitBreakdownSchema = z.object({
    unit_name: z.string(),
    income: z.number(),
    expense: z.number(),
    net: z.number(),
});

export const SummaryStatsSchema = z.object({
    totalIncome: z.number(),
    totalExpense: z.number(),
    netProfit: z.number(),
    trend: z.array(MonthlyStatSchema),
    unitBreakdown: z.array(UnitBreakdownSchema).optional(),
});

export type MonthlyStat = z.infer<typeof MonthlyStatSchema>;
export type SummaryStats = z.infer<typeof SummaryStatsSchema>;
