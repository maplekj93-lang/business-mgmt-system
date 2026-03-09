export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      business_profiles: {
        Row: {
          id: string
          owner_type: string
          business_name: string
          representative_name: string
          business_number: string | null
          address: string | null
          bank_name: string | null
          account_number: string | null
          portfolio_url: string | null
          intro_document_url: string | null
          include_portfolio: boolean
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          owner_type: string
          business_name: string
          representative_name: string
          business_number?: string | null
          address?: string | null
          bank_name?: string | null
          account_number?: string | null
          portfolio_url?: string | null
          intro_document_url?: string | null
          include_portfolio?: boolean
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          owner_type?: string
          business_name?: string
          representative_name?: string
          business_number?: string | null
          address?: string | null
          bank_name?: string | null
          account_number?: string | null
          portfolio_url?: string | null
          intro_document_url?: string | null
          include_portfolio?: boolean
          is_default?: boolean
          created_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          name: string
          business_number: string | null
          files: Json
          contacts: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          business_number?: string | null
          files?: Json
          contacts?: Json
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          business_number?: string | null
          files?: Json
          contacts?: Json
          created_at?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          asset_type: string
          created_at: string | null
          id: string
          identifier_keywords: string[] | null
          name: string
          owner_type: string
          user_id: string | null
        }
        Insert: {
          asset_type: string
          created_at?: string | null
          id?: string
          identifier_keywords?: string[] | null
          name: string
          owner_type: string
          user_id?: string | null
        }
        Update: {
          asset_type?: string
          created_at?: string | null
          id?: string
          identifier_keywords?: string[] | null
          name?: string
          owner_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      business_units: {
        Row: {
          id: string
          metadata: Json | null
          name: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          metadata?: Json | null
          name: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          metadata?: Json | null
          name?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      mdt_allocation_rules: {
        Row: {
          category_id: number | null
          created_at: string | null
          id: number
          keyword: string
          user_id: string | null
        }
        Insert: {
          category_id?: number | null
          created_at?: string | null
          id?: number
          keyword: string
          user_id?: string | null
        }
        Update: {
          category_id?: number | null
          created_at?: string | null
          id?: number
          keyword?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mdt_allocation_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mdt_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      mdt_business_rules: {
        Row: {
          description: string | null
          id: number
          rule_key: string
          rule_value: Json
          user_id: string | null
        }
        Insert: {
          description?: string | null
          id?: number
          rule_key: string
          rule_value: Json
          user_id?: string | null
        }
        Update: {
          description?: string | null
          id?: number
          rule_key?: string
          rule_value?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      mdt_categories: {
        Row: {
          id: number
          is_business_only: boolean | null
          name: string
          parent_id: number | null
          type: string | null
          ui_config: Json | null
          user_id: string | null
        }
        Insert: {
          id?: number
          is_business_only?: boolean | null
          name: string
          parent_id?: number | null
          type?: string | null
          ui_config?: Json | null
          user_id?: string | null
        }
        Update: {
          id?: number
          is_business_only?: boolean | null
          name?: string
          parent_id?: number | null
          type?: string | null
          ui_config?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mdt_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "mdt_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mdt_categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mdt_import_mappings: {
        Row: {
          created_at: string | null
          id: string
          source_value: string
          target_asset_id: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          source_value: string
          target_asset_id: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          source_value?: string
          target_asset_id?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          additional_currencies: string[] | null
          full_name: string | null
          id: string
          preferred_currency: string | null
          updated_at: string | null
        }
        Insert: {
          additional_currencies?: string[] | null
          full_name?: string | null
          id: string
          preferred_currency?: string | null
          updated_at?: string | null
        }
        Update: {
          additional_currencies?: string[] | null
          full_name?: string | null
          id?: string
          preferred_currency?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          name: string
          client_id: string | null
          business_owner: string
          income_type: string
          categories: string[]
          status: string
          duration_days: number | null
          start_date: string | null
          end_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          client_id?: string | null
          business_owner: string
          income_type: string
          categories?: string[]
          status?: string
          duration_days?: number | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          client_id?: string | null
          business_owner?: string
          income_type?: string
          categories?: string[]
          status?: string
          duration_days?: number | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      project_incomes: {
        Row: {
          id: string
          project_id: string
          title: string
          amount: number
          expected_date: string | null
          status: string
          matched_transaction_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          amount?: number
          expected_date?: string | null
          status?: string
          matched_transaction_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          amount?: number
          expected_date?: string | null
          status?: string
          matched_transaction_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_incomes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_rate_logs: {
        Row: {
          id: string
          user_id: string | null
          client_id: string | null
          work_date: string
          site_name: string
          amount_gross: number
          withholding_rate: number
          amount_net: number
          payment_status: string
          payment_date: string | null
          matched_transaction_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          client_id?: string | null
          work_date: string
          site_name: string
          amount_gross: number
          withholding_rate?: number
          amount_net?: number
          payment_status?: string
          payment_date?: string | null
          matched_transaction_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          client_id?: string | null
          work_date?: string
          site_name?: string
          amount_gross?: number
          withholding_rate?: number
          amount_net?: number
          payment_status?: string
          payment_date?: string | null
          matched_transaction_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_rate_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_payments: {
        Row: {
          id: string
          daily_rate_log_id: string
          crew_name: string
          role: string | null
          amount_gross: number
          withholding_rate: number
          amount_net: number
          account_info: string | null
          paid: boolean
          paid_date: string | null
        }
        Insert: {
          id?: string
          daily_rate_log_id: string
          crew_name: string
          role?: string | null
          amount_gross: number
          withholding_rate?: number
          amount_net?: number
          account_info?: string | null
          paid?: boolean
          paid_date?: string | null
        }
        Update: {
          id?: string
          daily_rate_log_id?: string
          crew_name?: string
          role?: string | null
          amount_gross?: number
          withholding_rate?: number
          amount_net?: number
          account_info?: string | null
          paid?: boolean
          paid_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crew_payments_daily_rate_log_id_fkey"
            columns: ["daily_rate_log_id"]
            isOneToOne: false
            referencedRelation: "daily_rate_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      site_expenses: {
        Row: {
          id: string
          daily_rate_log_id: string
          category: string
          amount: number
          memo: string | null
          receipt_url: string | null
          included_in_invoice: boolean
        }
        Insert: {
          id?: string
          daily_rate_log_id: string
          category: string
          amount: number
          memo?: string | null
          receipt_url?: string | null
          included_in_invoice?: boolean
        }
        Update: {
          id?: string
          daily_rate_log_id?: string
          category?: string
          amount?: number
          memo?: string | null
          receipt_url?: string | null
          included_in_invoice?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "site_expenses_daily_rate_log_id_fkey"
            columns: ["daily_rate_log_id"]
            isOneToOne: false
            referencedRelation: "daily_rate_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          allocation_status: string | null
          amount: number
          asset_id: string | null
          business_unit_id: string | null
          category_id: number | null
          date: string
          description: string | null
          id: string
          import_batch_id: string | null
          is_reimbursable: boolean | null
          original_currency: string | null
          owner: string | null
          project_id: string | null
          receipt_memo: string | null
          source_raw_data: Json | null
          transaction_time: string | null
          user_id: string | null
        }
        Insert: {
          allocation_status?: string | null
          amount: number
          asset_id?: string | null
          business_unit_id?: string | null
          category_id?: number | null
          date: string
          description?: string | null
          id?: string
          import_batch_id?: string | null
          is_reimbursable?: boolean | null
          original_currency?: string | null
          owner?: string | null
          project_id?: string | null
          receipt_memo?: string | null
          source_raw_data?: Json | null
          transaction_time?: string | null
          user_id?: string | null
        }
        Update: {
          allocation_status?: string | null
          amount?: number
          asset_id?: string | null
          business_unit_id?: string | null
          category_id?: number | null
          date?: string
          description?: string | null
          id?: string
          import_batch_id?: string | null
          is_reimbursable?: boolean | null
          original_currency?: string | null
          owner?: string | null
          project_id?: string | null
          receipt_memo?: string | null
          source_raw_data?: Json | null
          transaction_time?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mdt_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_advanced_analytics: {
        Args: { p_mode: string; p_month: number; p_year: number }
        Returns: {
          category_distribution: Json
          daily_trend: Json
          summary: Json
        }[]
      }
      get_dashboard_stats:
      | {
        Args: { p_mode: string }
        Returns: {
          net_profit: number
          total_expense: number
          total_income: number
          trend: Json
          unit_breakdown: Json
        }[]
      }
      | {
        Args: { p_mode: string; p_user_id: string }
        Returns: {
          net_profit: number
          total_expense: number
          total_income: number
          trend: Json
        }[]
      }
      get_filtered_transactions: {
        Args: {
          p_limit?: number
          p_mode?: string
          p_month?: number
          p_page?: number
          p_year?: number
        }
        Returns: {
          allocation_status: string
          amount: number
          asset_id: string
          asset_name: string
          asset_type: string
          business_unit_id: string
          category_color: string
          category_icon: string
          category_id: number
          category_name: string
          category_type: string
          date: string
          description: string
          id: string
          is_reimbursable: boolean
          owner_type: string
          parent_category_name: string
          project_id: string
          project_name: string
          receipt_memo: string
          source_raw_data: Json
        }[]
      }
      get_unclassified_stats: {
        Args: never
        Returns: {
          amount: number
          count: number
          raw_name: string
          sample_date: string
          total_amount: number
          transaction_ids: string[]
          type: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
