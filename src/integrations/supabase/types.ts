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
      campaign_products: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          product_id: string
          role: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          product_id: string
          role?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          product_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_products_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          buy_quantity: number | null
          created_at: string
          discount_percent: number | null
          end_date: string
          id: string
          is_active: boolean
          name: string
          pay_quantity: number | null
          source_buy_quantity: number | null
          special_price: number | null
          special_price_min_quantity: number | null
          start_date: string
          target_discount_percent: number | null
          type: Database["public"]["Enums"]["campaign_type"]
          updated_at: string
        }
        Insert: {
          buy_quantity?: number | null
          created_at?: string
          discount_percent?: number | null
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          pay_quantity?: number | null
          source_buy_quantity?: number | null
          special_price?: number | null
          special_price_min_quantity?: number | null
          start_date: string
          target_discount_percent?: number | null
          type: Database["public"]["Enums"]["campaign_type"]
          updated_at?: string
        }
        Update: {
          buy_quantity?: number | null
          created_at?: string
          discount_percent?: number | null
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          pay_quantity?: number | null
          source_buy_quantity?: number | null
          special_price?: number | null
          special_price_min_quantity?: number | null
          start_date?: string
          target_discount_percent?: number | null
          type?: Database["public"]["Enums"]["campaign_type"]
          updated_at?: string
        }
        Relationships: []
      }
      cash_register_sessions: {
        Row: {
          closed_at: string | null
          closing_amount: number | null
          created_at: string
          id: string
          notes: string | null
          opened_at: string
          opened_by: string
          opening_amount: number
          status: string
        }
        Insert: {
          closed_at?: string | null
          closing_amount?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by: string
          opening_amount?: number
          status?: string
        }
        Update: {
          closed_at?: string | null
          closing_amount?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by?: string
          opening_amount?: number
          status?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      loyalty_customers: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          phone: string
          qr_code: string
          total_points: number
          total_spent: number
          total_visits: number
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          phone: string
          qr_code: string
          total_points?: number
          total_spent?: number
          total_visits?: number
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string
          qr_code?: string
          total_points?: number
          total_spent?: number
          total_visits?: number
        }
        Relationships: []
      }
      loyalty_point_rules: {
        Row: {
          bonus_points: number
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          min_quantity: number
          name: string
          points_per_tl: number
          product_id: string | null
          start_date: string
          type: string
          valid_days: string[] | null
        }
        Insert: {
          bonus_points?: number
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          min_quantity?: number
          name: string
          points_per_tl?: number
          product_id?: string | null
          start_date: string
          type?: string
          valid_days?: string[] | null
        }
        Update: {
          bonus_points?: number
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          min_quantity?: number
          name?: string
          points_per_tl?: number
          product_id?: string | null
          start_date?: string
          type?: string
          valid_days?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_point_rules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          description: string
          id: string
          points: number
          sale_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          description?: string
          id?: string
          points: number
          sale_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string
          description?: string
          id?: string
          points?: number
          sale_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "loyalty_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_verifications: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          purpose: string
          verified: boolean
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          purpose?: string
          verified?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          purpose?: string
          verified?: boolean
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string
          category_id: string | null
          cost_price: number
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          kdv_rate: number
          min_stock: number
          name: string
          price: number
          show_in_carousel: boolean
          stock: number
          unit: string
          updated_at: string
        }
        Insert: {
          barcode: string
          category_id?: string | null
          cost_price?: number
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          kdv_rate?: number
          min_stock?: number
          name: string
          price?: number
          show_in_carousel?: boolean
          stock?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          barcode?: string
          category_id?: string | null
          cost_price?: number
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          kdv_rate?: number
          min_stock?: number
          name?: string
          price?: number
          show_in_carousel?: boolean
          stock?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          allowed: boolean
          created_at: string
          id: string
          page_description: string
          page_label: string
          page_path: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          allowed?: boolean
          created_at?: string
          id?: string
          page_description?: string
          page_label: string
          page_path: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          allowed?: boolean
          created_at?: string
          id?: string
          page_description?: string
          page_label?: string
          page_path?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          barcode: string
          campaign_id: string | null
          campaign_name: string | null
          created_at: string
          discount: number
          id: string
          product_id: string
          product_name: string
          quantity: number
          sale_id: string
          total: number
          unit_price: number
        }
        Insert: {
          barcode: string
          campaign_id?: string | null
          campaign_name?: string | null
          created_at?: string
          discount?: number
          id?: string
          product_id: string
          product_name: string
          quantity?: number
          sale_id: string
          total?: number
          unit_price?: number
        }
        Update: {
          barcode?: string
          campaign_id?: string | null
          campaign_name?: string | null
          created_at?: string
          discount?: number
          id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          sale_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          created_by: string | null
          discount: number
          id: string
          loyalty_customer_id: string | null
          payment_method: string
          points_earned: number
          points_redeemed: number
          sale_number: number
          subtotal: number
          total: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          discount?: number
          id?: string
          loyalty_customer_id?: string | null
          payment_method?: string
          points_earned?: number
          points_redeemed?: number
          sale_number?: number
          subtotal?: number
          total?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          discount?: number
          id?: string
          loyalty_customer_id?: string | null
          payment_method?: string
          points_earned?: number
          points_redeemed?: number
          sale_number?: number
          subtotal?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_loyalty_customer_id_fkey"
            columns: ["loyalty_customer_id"]
            isOneToOne: false
            referencedRelation: "loyalty_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          new_stock: number
          note: string | null
          previous_stock: number
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          new_stock?: number
          note?: string | null
          previous_stock?: number
          product_id: string
          quantity: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: Database["public"]["Enums"]["stock_movement_type"]
          new_stock?: number
          note?: string | null
          previous_stock?: number
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          created_at: string
          currency_symbol: string
          id: string
          logo_dark_url: string | null
          logo_light_url: string | null
          min_stock_alert: boolean
          point_value_tl: number
          points_per_tl: number
          receipt_footer: string
          receipt_header: string
          store_address: string
          store_name: string
          store_phone: string
          tax_number: string
          tax_office: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_symbol?: string
          id?: string
          logo_dark_url?: string | null
          logo_light_url?: string | null
          min_stock_alert?: boolean
          point_value_tl?: number
          points_per_tl?: number
          receipt_footer?: string
          receipt_header?: string
          store_address?: string
          store_name?: string
          store_phone?: string
          tax_number?: string
          tax_office?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_symbol?: string
          id?: string
          logo_dark_url?: string | null
          logo_light_url?: string | null
          min_stock_alert?: boolean
          point_value_tl?: number
          points_per_tl?: number
          receipt_footer?: string
          receipt_header?: string
          store_address?: string
          store_name?: string
          store_phone?: string
          tax_number?: string
          tax_office?: string
          updated_at?: string
        }
        Relationships: []
      }
      supplier_documents: {
        Row: {
          created_at: string
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          supplier_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          supplier_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_documents_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_invoice_items: {
        Row: {
          barcode: string | null
          id: string
          invoice_id: string
          product_id: string | null
          product_name: string
          quantity: number
          tax_rate: number
          total: number
          unit_price: number
        }
        Insert: {
          barcode?: string | null
          id?: string
          invoice_id: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          tax_rate?: number
          total?: number
          unit_price?: number
        }
        Update: {
          barcode?: string | null
          id?: string
          invoice_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          tax_rate?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_invoices: {
        Row: {
          created_at: string
          created_by: string | null
          document_url: string | null
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string | null
          notes: string | null
          status: string
          subtotal: number
          supplier_id: string
          tax_amount: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_url?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          notes?: string | null
          status?: string
          subtotal?: number
          supplier_id: string
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_url?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          notes?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          invoice_id: string | null
          payment_date: string
          payment_method: string
          supplier_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          invoice_id?: string | null
          payment_date?: string
          payment_method?: string
          supplier_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          invoice_id?: string | null
          payment_date?: string
          payment_method?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          iban: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          tax_number: string | null
          tax_office: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          iban?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          tax_number?: string | null
          tax_office?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          iban?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          tax_number?: string | null
          tax_office?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "kasiyer" | "depocu" | "muhasebe"
      campaign_type:
        | "x_al_y_ode"
        | "x_alana_y_indirim"
        | "yuzde_indirim"
        | "ozel_fiyat"
      stock_movement_type: "in" | "out" | "adjustment"
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
    Enums: {
      app_role: ["admin", "kasiyer", "depocu", "muhasebe"],
      campaign_type: [
        "x_al_y_ode",
        "x_alana_y_indirim",
        "yuzde_indirim",
        "ozel_fiyat",
      ],
      stock_movement_type: ["in", "out", "adjustment"],
    },
  },
} as const
