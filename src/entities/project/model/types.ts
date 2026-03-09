import type { OwnerType, IncomeType, PipelineStatus } from '@/shared/constants/business';

export interface Project {
    id: string;
    name: string;
    client_id?: string;
    business_owner: OwnerType;
    income_type: IncomeType;
    categories: string[];
    status: 'active' | 'completed' | 'cancelled';
    duration_days?: number;
    start_date?: string;
    end_date?: string;
    created_at: string;
    // 조인
    client?: { id: string; name: string };
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
