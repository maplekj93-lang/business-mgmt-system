import type { OwnerType, IncomeType, PipelineStatus, ProjectStatus } from '@/shared/constants/business';

export interface ChecklistItem {
    id: string;   // nanoid or crypto.randomUUID()
    text: string;
    done: boolean;
}

export interface Project {
    id: string;
    name: string;
    client_id?: string;
    business_owner: OwnerType;
    income_type: IncomeType;
    categories: string[];
    status: ProjectStatus;
    duration_days?: number;
    start_date?: string | null;
    end_date?: string | null;
    deadline?: string | null;
    memo?: string | null;
    checklist: ChecklistItem[];
    created_at: string;
    // 리드타임 추적
    quote_sent_date?: string | null;
    invoice_sent_date?: string | null;
    expected_payment_date?: string | null;
    actual_payment_date?: string | null;
    payment_lead_days?: number; // (Front-computed or DB View)
    // 조인
    client?: { id: string; name: string };
    project_incomes?: ProjectIncome[];
}

export interface ProjectIncome {
    id: string;
    project_id: string;
    title: string;
    amount: number;
    expected_date?: string;
    status: PipelineStatus;
    matched_transaction_id?: string;
    created_at: string;
    // 조인
    project?: Project;
}
