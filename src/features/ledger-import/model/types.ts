
export interface DetectedFile {
    bankName: string;
    profile: BankProfile;
}

export interface ValidatedTransaction {
    date: string;       // ISO Date String (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
    amount: number;     // Negative for expense, Positive for income (항상 KRW 기준)
    description: string;
    raw_description: string; // [NEW] 원본 거래 설명 (정규화 전)
    normalized_name?: string; // [NEW] 정규화된 가맹점명
    categoryRaw: string;
    type: 'income' | 'expense' | 'transfer';
    source_raw_data?: Record<string, any>; // Store original row data + extras
    // 해외 결제 전용 — source_raw_data에도 저장됨 (편의용 직접 접근)
    _is_foreign_currency?: boolean;
    _local_currency?: string;       // 실제 결제 통화 (USD / KRW / EUR 등)
    _local_amount?: number;         // 결제 통화 기준 금액
    _fx_rate_used?: number;         // 적용된 환율 (1 USD = ? KRW)
    _is_fx_approximate?: boolean;   // 환율이 근사치인 경우 true
    cardNo?: string;                // [NEW] 카드번호
    transactionTime?: string;       // [NEW] 거래시간
}

// [NEW] 엑셀 파싱 후 임포트 전 중간 타입
export interface ExcelTransactionRow {
    date: string;   // YYYY-MM-DD로 정규화된 상태
    amount: number;
    description: string;
    raw_description: string; // [NEW] 원본 거래 설명
    normalized_name?: string; // [NEW] 정규화된 가맹점명
    asset_id: string;
    currency_code?: string; // [NEW] 통화 코드 (KRW, USD 등)
    foreign_amount?: number | null; // [NEW] 외화 금액
}

/** parseExcel() 호출 시 넘기는 옵션 */
export interface ParseOptions {
    /** 통화 → KRW 환율 맵. e.g. { USD: 1382.5, EUR: 1540 } */
    fxRates?: Record<string, number>;
}

export interface BankProfile {
    name: string;
    keywords: string[]; // Keywords to identify sheet/columns
    mapping: {
        date: string | string[];     // Column header(s) for Date
        time?: string | string[];    // Column header for Time (Optional)
        amount: string | string[];   // Column header for Amount (Single column)
        income?: string | string[];  // Column header for Income (Optional, for split columns)
        expense?: string | string[]; // Column header for Expense (Optional, for split columns)
        merchant: string | string[]; // Column header for Merchant
        status?: string | string[];  // Column for 'Cancel' status
        authCode?: string | string[]; // Column for Auth Code
        balance?: string | string[]; // Column for Balance
        type?: string | string[];    // Column for Type (Deposit/Withdrawal)
        cardNo?: string | string[];  // Column for Card Number (Optional)
        depositAccount?: string | string[]; // Column for Deposit Account
        withdrawalAccount?: string | string[]; // Column for Withdrawal Account
        categoryMain?: string | string[]; // Column for Main Category (대분류)
        categorySub?: string | string[];  // Column for Sub Category (소분류)
        // 해외 결제 전용
        localAmount?: string | string[];   // 현지이용금액 (KRW 또는 외화)
        localCurrency?: string | string[]; // 현지거래통화 (USD / KRW / EUR ...)
    };
    transforms?: {
        // Bank specific cleanup logic
        parseAmount?: (val: any) => number;
        parseStatus?: (val: any) => 'approved' | 'cancelled' | 'skip';
        postProcess?: (tx: ValidatedTransaction) => ValidatedTransaction;
    }
}
