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
    start_date?: string;
    end_date?: string;
    deadline?: string;
    memo?: string;
    checklist: ChecklistItem[];
    created_at: string;
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
