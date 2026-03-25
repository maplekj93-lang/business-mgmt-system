import { Database } from '@/shared/types/database.types';

export type DutchPayGroup = Database['public']['Tables']['dutch_pay_groups']['Row'] & {
    members: DutchPayMember[];
};

export type DutchPayMember = Database['public']['Tables']['dutch_pay_members']['Row'];

export interface NewDutchPayGroup {
    name: string;
    total_amount: number;
    due_date?: string | null;
    transaction_id?: string | null;
    members: {
        name: string;
        amount: number;
    }[];
}
