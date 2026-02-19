export interface Category {
    id: number;
    name: string;
    parent_id: number | null;
    type: 'income' | 'expense' | 'transfer';
    is_business_only: boolean;
    ui_config: {
        icon: string;
        color: string;
    };
    created_at?: string;
    updated_at?: string;
}

export interface CategoryTreeItem extends Category {
    children: CategoryTreeItem[];
}
