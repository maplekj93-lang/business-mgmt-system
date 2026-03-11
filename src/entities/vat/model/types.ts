export interface VatReserve {
  id: string;
  user_id: string;
  year_month: string;  // "2026-03"
  total_income: number;
  vat_10_percent: number;
  vat_paid_date?: string;
  status: 'pending' | 'paid' | 'filed';
  created_at: string;
  updated_at: string;
}

export interface VatSummary {
  year_month: string;
  total_income: number;
  vat_amount: number;
  filled_percentage: number;  // 0-100
  status: 'pending' | 'paid' | 'filed';
}
