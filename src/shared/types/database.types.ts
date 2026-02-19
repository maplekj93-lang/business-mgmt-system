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
      assets_liabilities: {
        Row: {
          category: string | null
          current_valuation: number
          id: string
          is_business_asset: boolean | null
          name: string
        }
        Insert: {
          category?: string | null
          current_valuation: number
          id?: string
          is_business_asset?: boolean | null
          name: string
        }
        Update: {
          category?: string | null
          current_valuation?: number
          id?: string
          is_business_asset?: boolean | null
          name?: string
        }
        Relationships: []
      }
      business_units: {
        Row: {
          id: string
          name: string
          type: string | null
        }
        Insert: {
          id?: string
          name: string
          type?: string | null
        }
        Update: {
          id?: string
          name?: string
          type?: string | null
        }
        Relationships: []
      }
      mdt_business_rules: {
        Row: {
          description: string | null
          id: number
          rule_key: string
          rule_value: Json
        }
        Insert: {
          description?: string | null
          id?: number
          rule_key: string
          rule_value: Json
        }
        Update: {
          description?: string | null
          id?: number
          rule_key?: string
          rule_value?: Json
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
      transactions: {
        Row: {
          allocation_status: string | null
          amount: number
          business_unit_id: string | null
          category_id: number | null
          date: string
          description: string | null
          id: string
          import_batch_id: string | null
          original_currency: string | null
          source_raw_data: Json | null
          user_id: string | null
        }
        Insert: {
          allocation_status?: string | null
          amount: number
          business_unit_id?: string | null
          category_id?: number | null
          date: string
          description?: string | null
          id?: string
          import_batch_id?: string | null
          original_currency?: string | null
          source_raw_data?: Json | null
          user_id?: string | null
        }
        Update: {
          allocation_status?: string | null
          amount?: number
          business_unit_id?: string | null
          category_id?: number | null
          date?: string
          description?: string | null
          id?: string
          import_batch_id?: string | null
          original_currency?: string | null
          source_raw_data?: Json | null
          user_id?: string | null
        }
        Relationships: [
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
      [_ in never]: never
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
