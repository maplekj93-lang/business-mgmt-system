import { z } from 'zod';

export const VatTypeSchema = z.enum(['none', 'include', 'exclude']).default('none');

export const CrewPaymentSchema = z.object({
  id: z.string().uuid().optional(),
  daily_rate_log_id: z.string().uuid().optional(),
  crew_name: z.string().min(1, '크루원 이름은 필수입니다.'),
  role: z.string().optional(),
  amount_gross: z.number().min(0),
  withholding_rate: z.number().min(0).max(100),
  amount_net: z.number().optional(), // DB에서 계산되지만 프론트에서 계산해서 보낼 수도 있음
  account_info: z.string().optional(),
  vat_type: VatTypeSchema,
  paid: z.boolean().default(false),
  paid_date: z.string().optional().nullable(),
});

export const SiteExpenseSchema = z.object({
  id: z.string().uuid().optional(),
  daily_rate_log_id: z.string().uuid().optional(),
  category: z.string().min(1, '카테고리는 필수입니다.'),
  amount: z.number().min(0),
  memo: z.string().optional().nullable(),
  receipt_url: z.string().optional().nullable(),
  included_in_invoice: z.boolean().default(true),
});

export const DailyRateLogSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  client_id: z.string().uuid().optional().nullable(),
  work_date: z.string().min(1, '작업 일자는 필수입니다.'),
  site_name: z.string().min(1, '현장명은 필수입니다.'),
  amount_gross: z.number().min(0),
  withholding_rate: z.number().min(0).max(100),
  amount_net: z.number().optional(),
  payment_status: z.enum(['pending', 'paid']).default('pending'),
  payment_date: z.string().optional().nullable(),
  vat_type: VatTypeSchema,
  matched_transaction_id: z.string().optional().nullable(),
  created_at: z.string().optional(),
});

export const CreateDailyLogInputSchema = DailyRateLogSchema.extend({
  crew_payments: z.array(CrewPaymentSchema).optional(),
  site_expenses: z.array(SiteExpenseSchema).optional(),
});

export type CrewPaymentInput = z.infer<typeof CrewPaymentSchema>;
export type SiteExpenseInput = z.infer<typeof SiteExpenseSchema>;
export type DailyRateLogInput = z.infer<typeof CreateDailyLogInputSchema>;
