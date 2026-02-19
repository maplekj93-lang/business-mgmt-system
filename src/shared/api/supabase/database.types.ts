export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    preferred_currency: string | null
                    additional_currencies: string[] | null
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    preferred_currency?: string | null
                    additional_currencies?: string[] | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    preferred_currency?: string | null
                    additional_currencies?: string[] | null
                    updated_at?: string | null
                }
            }
            mdt_categories: {
                Row: {
                    id: number
                    user_id: string | null
                    parent_id: number | null
                    name: string
                    type: 'income' | 'expense' | 'transfer' | null
                    ui_config: Json | null
                    is_business_only: boolean | null
                }
                Insert: {
                    id?: number
                    user_id?: string | null
                    parent_id?: number | null
                    name: string
                    type?: 'income' | 'expense' | 'transfer' | null
                    ui_config?: Json | null
                    is_business_only?: boolean | null
                }
                Update: {
                    id?: number
                    user_id?: string | null
                    parent_id?: number | null
                    name?: string
                    type?: 'income' | 'expense' | 'transfer' | null
                    ui_config?: Json | null
                    is_business_only?: boolean | null
                }
            }
            business_units: {
                Row: {
                    id: string
                    name: string
                    type: string | null
                    metadata: Json | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    name: string
                    type?: string | null
                    metadata?: Json | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    name?: string
                    type?: string | null
                    metadata?: Json | null
                    created_at?: string | null
                }
            }
            transactions: {
                Row: {
                    id: string
                    user_id: string | null
                    category_id: number | null
                    allocation_status: 'personal' | 'business_unallocated' | 'business_allocated' | null
                    business_unit_id: string | null
                    amount: number
                    original_currency: string | null
                    date: string
                    description: string | null
                    import_batch_id: string | null
                    source_raw_data: Json | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    category_id?: number | null
                    allocation_status?: 'personal' | 'business_unallocated' | 'business_allocated' | null
                    business_unit_id?: string | null
                    amount: number
                    original_currency?: string | null
                    date: string
                    description?: string | null
                    import_batch_id?: string | null
                    source_raw_data?: Json | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    category_id?: number | null
                    allocation_status?: 'personal' | 'business_unallocated' | 'business_allocated' | null
                    business_unit_id?: string | null
                    amount?: number
                    original_currency?: string | null
                    date?: string
                    description?: string | null
                    import_batch_id?: string | null
                    source_raw_data?: Json | null
                }
            }
            assets_liabilities: {
                Row: {
                    id: string
                    name: string
                    category: 'asset' | 'liability' | 'investment' | null
                    current_valuation: number
                    is_business_asset: boolean | null
                    user_id: string | null
                }
                Insert: {
                    id?: string
                    name: string
                    category?: 'asset' | 'liability' | 'investment' | null
                    current_valuation: number
                    is_business_asset?: boolean | null
                    user_id?: string | null
                }
                Update: {
                    id?: string
                    name?: string
                    category?: 'asset' | 'liability' | 'investment' | null
                    current_valuation?: number
                    is_business_asset?: boolean | null
                    user_id?: string | null
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            get_dashboard_stats: {
                Args: {
                    p_mode: string
                }
                Returns: {
                    total_income: number
                    total_expense: number
                    net_profit: number
                    trend: Json
                    unit_breakdown: Json
                }[]
            }
            get_filtered_transactions: {
                Args: {
                    p_mode?: string
                    p_year?: number
                    p_month?: number
                    p_page?: number
                    p_limit?: number
                }
                Returns: {
                    id: string
                    date: string
                    amount: number
                    description: string
                    category_id: number
                    allocation_status: string
                    business_unit_id: string
                    source_raw_data: Json
                    category_name: string
                    category_type: string
                    category_icon: string
                    category_color: string
                    parent_category_name: string
                }[]
            }
            get_unclassified_stats: {
                Args: Record<PropertyKey, never>
                Returns: {
                    raw_name: string
                    count: number
                    total_amount: number
                    sample_date: string
                    transaction_ids: string[]
                    type: string
                }[]
            }
            get_advanced_analytics: {
                Args: {
                    p_mode: string
                    p_month: number
                    p_year: number
                }
                Returns: {
                    daily_trend: Json
                    category_distribution: Json
                    summary: Json
                }[]
            }
        }
        Enums: {
            [_ in never]: never
        }
    }
}
