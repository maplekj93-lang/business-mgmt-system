export type VatType = 'none' | 'include' | 'exclude';

export interface DailyRateLog {
    id: string;
    user_id?: string;
    client_id?: string;
    work_date: string;
    site_name: string;
    amount_gross: number;
    withholding_rate: number;   // 광준 본인: 0
    amount_net: number;   // DB GENERATED
    payment_status: 'pending' | 'paid';
    vat_type?: VatType;
    payment_date?: string;
    matched_transaction_id?: string;
    project_id?: string;
    created_at: string;
    // 조인
    client?: { id: string; name: string };
    crew_payments?: CrewPayment[];
    site_expenses?: SiteExpense[];
}

export interface CrewPayment {
    id: string;
    daily_rate_log_id: string;
    crew_name: string;
    role?: string;
    amount_gross: number;
    withholding_rate: number;
    amount_net: number;   // DB GENERATED
    account_info?: string;
    vat_type?: VatType;
    paid: boolean;
    paid_date?: string;
}

export interface SiteExpense {
    id: string;
    daily_rate_log_id: string;
    category: string;
    amount: number;
    memo?: string;
    receipt_url?: string;
    included_in_invoice: boolean;
}

/** 거래처 청구 총액 계산 (프론트 유틸) */
export function calcInvoiceTotal(log: DailyRateLog): number {
    const applyVat = (amount: number, type?: VatType) => {
        if (type === 'exclude') return amount * 1.1;
        return amount;
    };

    const myBase = applyVat(log.amount_gross, log.vat_type);

    const crew = (log.crew_payments ?? []).reduce((s, c) => {
        return s + applyVat(c.amount_gross, c.vat_type);
    }, 0);

    const expense = (log.site_expenses ?? [])
        .filter(e => e.included_in_invoice)
        .reduce((s, e) => s + e.amount, 0);

    return myBase + crew + expense;
}
