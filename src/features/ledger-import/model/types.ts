
export interface DetectedFile {
    bankName: string;
    profile: BankProfile;
}

export interface ValidatedTransaction {
    date: string;       // ISO Date String (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
    amount: number;     // Negative for expense, Positive for income
    description: string;
    categoryRaw: string;
    type: 'income' | 'expense' | 'transfer';
    source_raw_data?: Record<string, any>; // Store original row data + extras
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
    };
    transforms?: {
        // Bank specific cleanup logic
        parseAmount?: (val: any) => number;
        parseStatus?: (val: any) => 'approved' | 'cancelled';
    }
}
