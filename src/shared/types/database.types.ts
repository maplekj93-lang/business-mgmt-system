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
      activity_logs: {
        Row: {
          action_type: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          new_data: Json | null
          previous_data: Json | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          new_data?: Json | null
          previous_data?: Json | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          new_data?: Json | null
          previous_data?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      assets: {
        Row: {
          asset_type: string
          created_at: string | null
          current_balance: number | null
          id: string
          identifier_keywords: string[] | null
          is_hidden: boolean
          is_safety_net: boolean | null
          last_synced_at: string | null
          memo: string | null
          name: string
          owner_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          asset_type: string
          created_at?: string | null
          current_balance?: number | null
          id?: string
          identifier_keywords?: string[] | null
          is_hidden?: boolean
          is_safety_net?: boolean | null
          last_synced_at?: string | null
          memo?: string | null
          name: string
          owner_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          asset_type?: string
          created_at?: string | null
          current_balance?: number | null
          id?: string
          identifier_keywords?: string[] | null
          is_hidden?: boolean
          is_safety_net?: boolean | null
          last_synced_at?: string | null
          memo?: string | null
          name?: string
          owner_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      business_profiles: {
        Row: {
          account_number: string | null
          address: string | null
          bank_name: string | null
          business_name: string
          business_number: string | null
          created_at: string | null
          id: string
          include_portfolio: boolean | null
          intro_document_url: string | null
          is_default: boolean | null
          owner_type: string
          portfolio_url: string | null
          representative_name: string
        }
        Insert: {
          account_number?: string | null
          address?: string | null
          bank_name?: string | null
          business_name: string
          business_number?: string | null
          created_at?: string | null
          id?: string
          include_portfolio?: boolean | null
          intro_document_url?: string | null
          is_default?: boolean | null
          owner_type: string
          portfolio_url?: string | null
          representative_name: string
        }
        Update: {
          account_number?: string | null
          address?: string | null
          bank_name?: string | null
          business_name?: string
          business_number?: string | null
          created_at?: string | null
          id?: string
          include_portfolio?: boolean | null
          intro_document_url?: string | null
          is_default?: boolean | null
          owner_type?: string
          portfolio_url?: string | null
          representative_name?: string
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
      clients: {
        Row: {
          avg_payment_lead_days: number | null
          business_number: string | null
          contacts: Json | null
          created_at: string | null
          files: Json | null
          id: string
          name: string
          total_projects_count: number | null
          total_revenue: number | null
        }
        Insert: {
          avg_payment_lead_days?: number | null
          business_number?: string | null
          contacts?: Json | null
          created_at?: string | null
          files?: Json | null
          id?: string
          name: string
          total_projects_count?: number | null
          total_revenue?: number | null
        }
        Update: {
          avg_payment_lead_days?: number | null
          business_number?: string | null
          contacts?: Json | null
          created_at?: string | null
          files?: Json | null
          id?: string
          name?: string
          total_projects_count?: number | null
          total_revenue?: number | null
        }
        Relationships: []
      }
      crew_payments: {
        Row: {
          account_info: string | null
          amount_gross: number
          amount_net: number | null
          bank_verified: boolean | null
          crew_name: string
          daily_rate_log_id: string
          id: string
          paid: boolean | null
          paid_date: string | null
          role: string | null
          vat_type: string | null
          verified_at: string | null
          withholding_rate: number | null
        }
        Insert: {
          account_info?: string | null
          amount_gross: number
          amount_net?: number | null
          bank_verified?: boolean | null
          crew_name: string
          daily_rate_log_id: string
          id?: string
          paid?: boolean | null
          paid_date?: string | null
          role?: string | null
          vat_type?: string | null
          verified_at?: string | null
          withholding_rate?: number | null
        }
        Update: {
          account_info?: string | null
          amount_gross?: number
          amount_net?: number | null
          bank_verified?: boolean | null
          crew_name?: string
          daily_rate_log_id?: string
          id?: string
          paid?: boolean | null
          paid_date?: string | null
          role?: string | null
          vat_type?: string | null
          verified_at?: string | null
          withholding_rate?: number | null
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
      crew_profiles: {
        Row: {
          account_info: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          role: string | null
          updated_at: string | null
          user_id: string
          withholding_rate: number
        }
        Insert: {
          account_info?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          user_id: string
          withholding_rate?: number
        }
        Update: {
          account_info?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
          withholding_rate?: number
        }
        Relationships: []
      }
      daily_rate_logs: {
        Row: {
          amount_gross: number
          amount_net: number | null
          client_id: string | null
          created_at: string | null
          id: string
          matched_transaction_id: string | null
          owner_id: string | null
          payment_date: string | null
          payment_status: string | null
          project_id: string | null
          site_name: string
          user_id: string | null
          vat_type: string | null
          withholding_rate: number | null
          work_date: string
        }
        Insert: {
          amount_gross: number
          amount_net?: number | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          matched_transaction_id?: string | null
          owner_id?: string | null
          payment_date?: string | null
          payment_status?: string | null
          project_id?: string | null
          site_name: string
          user_id?: string | null
          vat_type?: string | null
          withholding_rate?: number | null
          work_date: string
        }
        Update: {
          amount_gross?: number
          amount_net?: number | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          matched_transaction_id?: string | null
          owner_id?: string | null
          payment_date?: string | null
          payment_status?: string | null
          project_id?: string | null
          site_name?: string
          user_id?: string | null
          vat_type?: string | null
          withholding_rate?: number | null
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_rate_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_rate_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      dutch_pay_groups: {
        Row: {
          created_at: string | null
          due_date: string | null
          id: string
          is_settled: boolean | null
          name: string
          owner_id: string | null
          total_amount: number
          transaction_id: string | null
        }
        Insert: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_settled?: boolean | null
          name: string
          owner_id?: string | null
          total_amount?: number
          transaction_id?: string | null
        }
        Update: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_settled?: boolean | null
          name?: string
          owner_id?: string | null
          total_amount?: number
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dutch_pay_groups_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      dutch_pay_members: {
        Row: {
          amount_to_pay: number
          created_at: string | null
          group_id: string | null
          id: string
          is_paid: boolean | null
          name: string
          paid_at: string | null
        }
        Insert: {
          amount_to_pay?: number
          created_at?: string | null
          group_id?: string | null
          id?: string
          is_paid?: boolean | null
          name: string
          paid_at?: string | null
        }
        Update: {
          amount_to_pay?: number
          created_at?: string | null
          group_id?: string | null
          id?: string
          is_paid?: boolean | null
          name?: string
          paid_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dutch_pay_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "dutch_pay_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_expense_rules: {
        Row: {
          amount: number
          category_id: number | null
          created_at: string | null
          day_of_month: number
          id: string
          is_active: boolean
          name: string
          owner_type: string | null
          tolerance_days: number
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: number | null
          created_at?: string | null
          day_of_month: number
          id?: string
          is_active?: boolean
          name: string
          owner_type?: string | null
          tolerance_days?: number
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: number | null
          created_at?: string | null
          day_of_month?: number
          id?: string
          is_active?: boolean
          name?: string
          owner_type?: string | null
          tolerance_days?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixed_expense_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mdt_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          created_at: string | null
          filename: string | null
          id: string
          import_type: string | null
          metadata: Json | null
          row_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          filename?: string | null
          id?: string
          import_type?: string | null
          metadata?: Json | null
          row_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          filename?: string | null
          id?: string
          import_type?: string | null
          metadata?: Json | null
          row_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      income_matching_rules: {
        Row: {
          conditions: Json | null
          confidence_boost: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_locked: boolean | null
          last_used_at: string | null
          project_keyword: string
          sender_name: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          conditions?: Json | null
          confidence_boost?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_locked?: boolean | null
          last_used_at?: string | null
          project_keyword: string
          sender_name: string
          usage_count?: number | null
          user_id?: string
        }
        Update: {
          conditions?: Json | null
          confidence_boost?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_locked?: boolean | null
          last_used_at?: string | null
          project_keyword?: string
          sender_name?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      income_transaction_links: {
        Row: {
          amount_allocated: number
          created_at: string | null
          id: string
          income_id: string
          income_type: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          amount_allocated: number
          created_at?: string | null
          id?: string
          income_id: string
          income_type: string
          transaction_id: string
          user_id?: string
        }
        Update: {
          amount_allocated?: number
          created_at?: string | null
          id?: string
          income_id?: string
          income_type?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_transaction_links_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      kakao_pay_mappings: {
        Row: {
          amount: number
          category_id: number | null
          created_at: string | null
          id: string
          kakao_merchant_name: string
          kakao_type: string | null
          matched_date: string | null
          metadata: Json | null
          source_transaction_id: string
        }
        Insert: {
          amount: number
          category_id?: number | null
          created_at?: string | null
          id?: string
          kakao_merchant_name: string
          kakao_type?: string | null
          matched_date?: string | null
          metadata?: Json | null
          source_transaction_id: string
        }
        Update: {
          amount?: number
          category_id?: number | null
          created_at?: string | null
          id?: string
          kakao_merchant_name?: string
          kakao_type?: string | null
          matched_date?: string | null
          metadata?: Json | null
          source_transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kakao_pay_mappings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mdt_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kakao_pay_mappings_source_transaction_id_fkey"
            columns: ["source_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      mdt_allocation_rules: {
        Row: {
          business_tag: string | null
          category_id: number | null
          created_at: string | null
          id: number
          is_business: boolean | null
          keyword: string
          match_type: string | null
          priority: number | null
          user_id: string | null
        }
        Insert: {
          business_tag?: string | null
          category_id?: number | null
          created_at?: string | null
          id?: number
          is_business?: boolean | null
          keyword: string
          match_type?: string | null
          priority?: number | null
          user_id?: string | null
        }
        Update: {
          business_tag?: string | null
          category_id?: number | null
          created_at?: string | null
          id?: number
          is_business?: boolean | null
          keyword?: string
          match_type?: string | null
          priority?: number | null
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
      project_incomes: {
        Row: {
          amount: number
          created_at: string | null
          expected_date: string | null
          id: string
          matched_transaction_id: string | null
          project_id: string
          status: string
          title: string
        }
        Insert: {
          amount?: number
          created_at?: string | null
          expected_date?: string | null
          id?: string
          matched_transaction_id?: string | null
          project_id: string
          status?: string
          title: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          expected_date?: string | null
          id?: string
          matched_transaction_id?: string | null
          project_id?: string
          status?: string
          title?: string
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
      projects: {
        Row: {
          actual_payment_date: string | null
          business_owner: string
          categories: string[] | null
          checklist: Json | null
          client_id: string | null
          created_at: string | null
          deadline: string | null
          duration_days: number | null
          end_date: string | null
          expected_payment_date: string | null
          id: string
          income_type: string
          invoice_sent_date: string | null
          memo: string | null
          name: string
          quote_sent_date: string | null
          start_date: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          actual_payment_date?: string | null
          business_owner: string
          categories?: string[] | null
          checklist?: Json | null
          client_id?: string | null
          created_at?: string | null
          deadline?: string | null
          duration_days?: number | null
          end_date?: string | null
          expected_payment_date?: string | null
          id?: string
          income_type: string
          invoice_sent_date?: string | null
          memo?: string | null
          name: string
          quote_sent_date?: string | null
          start_date?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          actual_payment_date?: string | null
          business_owner?: string
          categories?: string[] | null
          checklist?: Json | null
          client_id?: string | null
          created_at?: string | null
          deadline?: string | null
          duration_days?: number | null
          end_date?: string | null
          expected_payment_date?: string | null
          id?: string
          income_type?: string
          invoice_sent_date?: string | null
          memo?: string | null
          name?: string
          quote_sent_date?: string | null
          start_date?: string | null
          status?: string
          user_id?: string | null
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
      recurring_expenses: {
        Row: {
          allocation_status: string | null
          amount: number
          category_id: number | null
          created_at: string | null
          description: string | null
          due_day_of_month: number | null
          frequency: string
          id: string
          is_auto_record: boolean | null
          is_business: boolean | null
          last_matched_transaction_id: string | null
          last_recorded_date: string | null
          name: string
          next_due_date: string | null
          owner_type: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allocation_status?: string | null
          amount: number
          category_id?: number | null
          created_at?: string | null
          description?: string | null
          due_day_of_month?: number | null
          frequency: string
          id?: string
          is_auto_record?: boolean | null
          is_business?: boolean | null
          last_matched_transaction_id?: string | null
          last_recorded_date?: string | null
          name: string
          next_due_date?: string | null
          owner_type?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allocation_status?: string | null
          amount?: number
          category_id?: number | null
          created_at?: string | null
          description?: string | null
          due_day_of_month?: number | null
          frequency?: string
          id?: string
          is_auto_record?: boolean | null
          is_business?: boolean | null
          last_matched_transaction_id?: string | null
          last_recorded_date?: string | null
          name?: string
          next_due_date?: string | null
          owner_type?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mdt_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_expenses_last_matched_transaction_id_fkey"
            columns: ["last_matched_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      site_expenses: {
        Row: {
          amount: number
          category: string
          daily_rate_log_id: string
          id: string
          included_in_invoice: boolean | null
          memo: string | null
          receipt_url: string | null
        }
        Insert: {
          amount: number
          category: string
          daily_rate_log_id: string
          id?: string
          included_in_invoice?: boolean | null
          memo?: string | null
          receipt_url?: string | null
        }
        Update: {
          amount?: number
          category?: string
          daily_rate_log_id?: string
          id?: string
          included_in_invoice?: boolean | null
          memo?: string | null
          receipt_url?: string | null
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
      transaction_breakdowns: {
        Row: {
          amount: number
          category_id: number | null
          created_at: string | null
          description: string
          excluded_from_personal: boolean | null
          id: string
          metadata: Json | null
          source_transaction_id: string
          track: string | null
        }
        Insert: {
          amount: number
          category_id?: number | null
          created_at?: string | null
          description: string
          excluded_from_personal?: boolean | null
          id?: string
          metadata?: Json | null
          source_transaction_id: string
          track?: string | null
        }
        Update: {
          amount?: number
          category_id?: number | null
          created_at?: string | null
          description?: string
          excluded_from_personal?: boolean | null
          id?: string
          metadata?: Json | null
          source_transaction_id?: string
          track?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_breakdowns_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mdt_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_breakdowns_source_transaction_id_fkey"
            columns: ["source_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          allocation_status: string | null
          amount: number
          asset_id: string | null
          breakdown_source_id: string | null
          business_unit_id: string | null
          category_id: number | null
          date: string
          description: string | null
          excluded_from_personal: boolean | null
          id: string
          import_batch_id: string | null
          import_hash: string | null
          is_reimbursable: boolean | null
          is_virtual_salary: boolean | null
          kakao_pay_row_id: string | null
          manual_override: boolean
          metadata: Json | null
          normalized_name: string | null
          original_currency: string | null
          owner: string | null
          owner_type: string | null
          project_id: string | null
          raw_description: string
          receipt_memo: string | null
          source: string
          source_raw_data: Json | null
          transaction_time: string | null
          user_id: string | null
        }
        Insert: {
          allocation_status?: string | null
          amount: number
          asset_id?: string | null
          breakdown_source_id?: string | null
          business_unit_id?: string | null
          category_id?: number | null
          date: string
          description?: string | null
          excluded_from_personal?: boolean | null
          id?: string
          import_batch_id?: string | null
          import_hash?: string | null
          is_reimbursable?: boolean | null
          is_virtual_salary?: boolean | null
          kakao_pay_row_id?: string | null
          manual_override?: boolean
          metadata?: Json | null
          normalized_name?: string | null
          original_currency?: string | null
          owner?: string | null
          owner_type?: string | null
          project_id?: string | null
          raw_description?: string
          receipt_memo?: string | null
          source?: string
          source_raw_data?: Json | null
          transaction_time?: string | null
          user_id?: string | null
        }
        Update: {
          allocation_status?: string | null
          amount?: number
          asset_id?: string | null
          breakdown_source_id?: string | null
          business_unit_id?: string | null
          category_id?: number | null
          date?: string
          description?: string | null
          excluded_from_personal?: boolean | null
          id?: string
          import_batch_id?: string | null
          import_hash?: string | null
          is_reimbursable?: boolean | null
          is_virtual_salary?: boolean | null
          kakao_pay_row_id?: string | null
          manual_override?: boolean
          metadata?: Json | null
          normalized_name?: string | null
          original_currency?: string | null
          owner?: string | null
          owner_type?: string | null
          project_id?: string | null
          raw_description?: string
          receipt_memo?: string | null
          source?: string
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
            foreignKeyName: "transactions_breakdown_source_id_fkey"
            columns: ["breakdown_source_id"]
            isOneToOne: false
            referencedRelation: "transactions"
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
      ungroupable_merchants: {
        Row: {
          created_at: string | null
          id: string
          normalized_name: string
          reason: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          normalized_name: string
          reason?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          normalized_name?: string
          reason?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          buffer_warning_pct: number | null
          created_at: string | null
          id: string
          income_tax_rate: number | null
          monthly_living_expense: number | null
          updated_at: string | null
          user_id: string
          virtual_salary_amount: number | null
          virtual_salary_day: number | null
        }
        Insert: {
          buffer_warning_pct?: number | null
          created_at?: string | null
          id?: string
          income_tax_rate?: number | null
          monthly_living_expense?: number | null
          updated_at?: string | null
          user_id: string
          virtual_salary_amount?: number | null
          virtual_salary_day?: number | null
        }
        Update: {
          buffer_warning_pct?: number | null
          created_at?: string | null
          id?: string
          income_tax_rate?: number | null
          monthly_living_expense?: number | null
          updated_at?: string | null
          user_id?: string
          virtual_salary_amount?: number | null
          virtual_salary_day?: number | null
        }
        Relationships: []
      }
      vat_reserves: {
        Row: {
          created_at: string | null
          id: string
          status: string | null
          total_income: number | null
          updated_at: string | null
          user_id: string
          vat_10_percent: number | null
          vat_paid_date: string | null
          year_month: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          status?: string | null
          total_income?: number | null
          updated_at?: string | null
          user_id: string
          vat_10_percent?: number | null
          vat_paid_date?: string | null
          year_month: string
        }
        Update: {
          created_at?: string | null
          id?: string
          status?: string | null
          total_income?: number | null
          updated_at?: string | null
          user_id?: string
          vat_10_percent?: number | null
          vat_paid_date?: string | null
          year_month?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_cashflow_stats: {
        Args: {
          p_end_date: string
          p_owner_id?: string
          p_start_date: string
          p_user_id: string
        }
        Returns: Json
      }
      cleanup_transaction_duplicates: {
        Args: never
        Returns: {
          deleted_count: number
          updated_count: number
        }[]
      }
      confirm_income_matching_v2: {
        Args: {
          p_amounts_allocated: number[]
          p_create_rule?: boolean
          p_income_id: string
          p_income_type: string
          p_rule_keyword?: string
          p_rule_sender_name?: string
          p_transaction_ids: string[]
        }
        Returns: undefined
      }
      confirm_income_matching_v3: {
        Args: {
          p_amounts_allocated: number[]
          p_create_rule?: boolean
          p_income_id: string
          p_income_type: string
          p_rule_keyword?: string
          p_rule_sender_name?: string
          p_transaction_ids: string[]
        }
        Returns: undefined
      }
      get_advanced_analytics: {
        Args: {
          p_mode: string
          p_month: number
          p_owner_id?: string
          p_year: number
        }
        Returns: {
          category_distribution: Json
          daily_trend: Json
          summary: Json
        }[]
      }
      get_asset_sync_guide: {
        Args: never
        Returns: {
          asset_id: string
          asset_name: string
          asset_type: string
          last_synced_at: string
          last_transaction_date: string
          recommended_start_date: string
        }[]
      }
      get_clients_with_stats: {
        Args: never
        Returns: {
          business_number: string
          contacts: Json
          created_at: string
          files: Json
          id: string
          last_project_at: string
          name: string
          project_count: number
          total_revenue: number
        }[]
      }
      get_dashboard_stats:
        | {
            Args: { p_mode?: string; p_owner_id?: string }
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
          p_date_filter?: string
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
          is_scheduled: boolean
          owner_type: string
          parent_category_name: string
          project_id: string
          project_name: string
          receipt_memo: string
          source_raw_data: Json
          tx_owner_type: string
        }[]
      }
      get_income_matching_candidates_v2: {
        Args: {
          p_income_id: string
          p_income_type: string
          p_search_query?: string
          p_target_amount: number
        }
        Returns: {
          confidence_score: number
          match_reason: string
          transaction_amount: number
          transaction_date: string
          transaction_description: string
          transaction_id: string
        }[]
      }
      get_income_matching_candidates_v3: {
        Args: {
          p_search_query?: string
          p_target_amount: number
          p_target_date?: string
        }
        Returns: {
          confidence_score: number
          is_choice_required: boolean
          match_reason: string
          transaction_amount: number
          transaction_date: string
          transaction_description: string
          transaction_id: string
        }[]
      }
      get_project_profitability: {
        Args: { p_owner_id?: string; p_status?: string }
        Returns: {
          expenses: number
          labor_cost: number
          net_profit: number
          owner_id: string
          profit_margin: number
          project_id: string
          project_name: string
          revenue: number
          status: string
        }[]
      }
      get_unclassified_stats: {
        Args: never
        Returns: {
          amount: number
          count: number
          is_groupable: boolean
          owner_type: string
          raw_name: string
          sample_date: string
          total_amount: number
          transaction_ids: string[]
          type: string
        }[]
      }
      get_unclassified_stats_test: {
        Args: never
        Returns: {
          amount: number
          count: number
          owner_type: string
          raw_name: string
          sample_date: string
          total_amount: number
          transaction_ids: string[]
          type: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
