export interface Contact {
    name: string;
    role?: string;
    dept?: string;
    phone?: string;
    email?: string;
}

export interface Client {
    id: string;
    name: string;
    business_number?: string;
    files: string[];
    contacts: Contact[];
    created_at: string;
    // 집계값 (쿼리 조인으로 계산 예정)
    total_revenue?: number;
    project_count?: number;
    last_project_at?: string;
    avg_payment_lead_days?: number;
}
