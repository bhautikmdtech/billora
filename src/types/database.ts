export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Timestamp = string;
type UUID = string;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: UUID;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          notification_prefs: Json;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id: UUID;
          full_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          notification_prefs?: Json;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          id?: UUID;
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          notification_prefs?: Json;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
      };
      organizations: {
        Row: {
          id: UUID;
          name: string;
          slug: string;
          category: string;
          logo_url: string | null;
          address: Json | null;
          phone: string | null;
          email: string | null;
          gst_number: string | null;
          pan_number: string | null;
          is_active: boolean;
          created_by: UUID | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: UUID;
          name: string;
          slug?: string;
          category: string;
          logo_url?: string | null;
          address?: Json | null;
          phone?: string | null;
          email?: string | null;
          gst_number?: string | null;
          pan_number?: string | null;
          is_active?: boolean;
          created_by?: UUID | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          id?: UUID;
          name?: string;
          slug?: string;
          category?: string;
          logo_url?: string | null;
          address?: Json | null;
          phone?: string | null;
          email?: string | null;
          gst_number?: string | null;
          pan_number?: string | null;
          is_active?: boolean;
          created_by?: UUID | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
      };
      shops: {
        Row: {
          id: UUID;
          org_id: UUID;
          name: string;
          code: string;
          address: Json | null;
          phone: string | null;
          email: string | null;
          is_active: boolean;
          created_by: UUID | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: UUID;
          org_id: UUID;
          name: string;
          code: string;
          address?: Json | null;
          phone?: string | null;
          email?: string | null;
          is_active?: boolean;
          created_by?: UUID | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          id?: UUID;
          org_id?: UUID;
          name?: string;
          code?: string;
          address?: Json | null;
          phone?: string | null;
          email?: string | null;
          is_active?: boolean;
          created_by?: UUID | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
      };
      org_members: {
        Row: {
          id: UUID;
          org_id: UUID;
          user_id: UUID;
          role: string;
          status: string;
          joined_at: Timestamp;
          invited_by: UUID | null;
        };
        Insert: {
          id?: UUID;
          org_id: UUID;
          user_id: UUID;
          role: string;
          status?: string;
          joined_at?: Timestamp;
          invited_by?: UUID | null;
        };
        Update: {
          id?: UUID;
          org_id?: UUID;
          user_id?: UUID;
          role?: string;
          status?: string;
          joined_at?: Timestamp;
          invited_by?: UUID | null;
        };
      };
      shop_members: {
        Row: {
          id: UUID;
          shop_id: UUID;
          org_id: UUID;
          user_id: UUID;
          role: string;
          salary: number;
          status: string;
          joined_at: Timestamp;
        };
        Insert: {
          id?: UUID;
          shop_id: UUID;
          org_id: UUID;
          user_id: UUID;
          role: string;
          salary?: number;
          status?: string;
          joined_at?: Timestamp;
        };
        Update: {
          id?: UUID;
          shop_id?: UUID;
          org_id?: UUID;
          user_id?: UUID;
          role?: string;
          salary?: number;
          status?: string;
          joined_at?: Timestamp;
        };
      };
      invites: {
        Row: {
          id: UUID;
          org_id: UUID;
          shop_id: UUID | null;
          invited_email: string;
          role: string;
          token: string;
          invited_by: UUID | null;
          status: string;
          expires_at: Timestamp;
          created_at: Timestamp;
        };
        Insert: {
          id?: UUID;
          org_id: UUID;
          shop_id?: UUID | null;
          invited_email: string;
          role: string;
          token: string;
          invited_by?: UUID | null;
          status?: string;
          expires_at?: Timestamp;
          created_at?: Timestamp;
        };
        Update: {
          id?: UUID;
          org_id?: UUID;
          shop_id?: UUID | null;
          invited_email?: string;
          role?: string;
          token?: string;
          invited_by?: UUID | null;
          status?: string;
          expires_at?: Timestamp;
          created_at?: Timestamp;
        };
      };
      suppliers: {
        Row: {
          id: UUID;
          org_id: UUID;
          shop_id: UUID | null;
          name: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          gst_number: string | null;
          balance: number;
          is_active: boolean;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: UUID;
          org_id: UUID;
          shop_id?: UUID | null;
          name: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          gst_number?: string | null;
          balance?: number;
          is_active?: boolean;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          id?: UUID;
          org_id?: UUID;
          shop_id?: UUID | null;
          name?: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          gst_number?: string | null;
          balance?: number;
          is_active?: boolean;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
      };
      purchase_orders: {
        Row: {
          id: UUID;
          org_id: UUID;
          shop_id: UUID;
          supplier_id: UUID | null;
          order_number: string;
          status: string;
          subtotal: number;
          discount_amount: number;
          gst_amount: number;
          total_amount: number;
          paid_amount: number;
          payment_method: string | null;
          invoice_number: string | null;
          invoice_date: string | null;
          notes: string | null;
          attachment_url: string | null;
          received_at: Timestamp | null;
          created_by: UUID | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: UUID;
          org_id: UUID;
          shop_id: UUID;
          supplier_id?: UUID | null;
          order_number: string;
          status?: string;
          subtotal?: number;
          discount_amount?: number;
          gst_amount?: number;
          total_amount?: number;
          paid_amount?: number;
          payment_method?: string | null;
          invoice_number?: string | null;
          invoice_date?: string | null;
          notes?: string | null;
          attachment_url?: string | null;
          received_at?: Timestamp | null;
          created_by?: UUID | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          id?: UUID;
          org_id?: UUID;
          shop_id?: UUID;
          supplier_id?: UUID | null;
          order_number?: string;
          status?: string;
          subtotal?: number;
          discount_amount?: number;
          gst_amount?: number;
          total_amount?: number;
          paid_amount?: number;
          payment_method?: string | null;
          invoice_number?: string | null;
          invoice_date?: string | null;
          notes?: string | null;
          attachment_url?: string | null;
          received_at?: Timestamp | null;
          created_by?: UUID | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
      };
      purchase_order_items: {
        Row: {
          id: UUID;
          purchase_order_id: UUID;
          category: string | null;
          sub_category: string | null;
          color: string | null;
          size: string | null;
          description: string | null;
          qty_ordered: number;
          qty_received: number;
          cost_price: number;
          selling_price: number;
          mrp: number;
          gst_percent: number;
          total_cost: number;
        };
        Insert: {
          id?: UUID;
          purchase_order_id: UUID;
          category?: string | null;
          sub_category?: string | null;
          color?: string | null;
          size?: string | null;
          description?: string | null;
          qty_ordered?: number;
          qty_received?: number;
          cost_price?: number;
          selling_price?: number;
          mrp?: number;
          gst_percent?: number;
          total_cost?: number;
        };
        Update: {
          id?: UUID;
          purchase_order_id?: UUID;
          category?: string | null;
          sub_category?: string | null;
          color?: string | null;
          size?: string | null;
          description?: string | null;
          qty_ordered?: number;
          qty_received?: number;
          cost_price?: number;
          selling_price?: number;
          mrp?: number;
          gst_percent?: number;
          total_cost?: number;
        };
      };
      skus: {
        Row: {
          id: UUID;
          org_id: UUID;
          shop_id: UUID;
          purchase_order_id: UUID | null;
          purchase_order_item_id: UUID | null;
          supplier_id: UUID | null;
          sku_code: string;
          qr_data: string;
          qr_image_url: string | null;
          category: string | null;
          sub_category: string | null;
          color: string | null;
          size: string | null;
          description: string | null;
          cost_price: number;
          selling_price: number;
          mrp: number;
          gst_percent: number;
          status: string;
          sold_at: Timestamp | null;
          sold_sale_id: UUID | null;
          created_at: Timestamp;
        };
        Insert: {
          id?: UUID;
          org_id: UUID;
          shop_id: UUID;
          purchase_order_id?: UUID | null;
          purchase_order_item_id?: UUID | null;
          supplier_id?: UUID | null;
          sku_code: string;
          qr_data: string;
          qr_image_url?: string | null;
          category?: string | null;
          sub_category?: string | null;
          color?: string | null;
          size?: string | null;
          description?: string | null;
          cost_price?: number;
          selling_price?: number;
          mrp?: number;
          gst_percent?: number;
          status?: string;
          sold_at?: Timestamp | null;
          sold_sale_id?: UUID | null;
          created_at?: Timestamp;
        };
        Update: {
          id?: UUID;
          org_id?: UUID;
          shop_id?: UUID;
          purchase_order_id?: UUID | null;
          purchase_order_item_id?: UUID | null;
          supplier_id?: UUID | null;
          sku_code?: string;
          qr_data?: string;
          qr_image_url?: string | null;
          category?: string | null;
          sub_category?: string | null;
          color?: string | null;
          size?: string | null;
          description?: string | null;
          cost_price?: number;
          selling_price?: number;
          mrp?: number;
          gst_percent?: number;
          status?: string;
          sold_at?: Timestamp | null;
          sold_sale_id?: UUID | null;
          created_at?: Timestamp;
        };
      };
      customers: {
        Row: {
          id: UUID;
          org_id: UUID;
          shop_id: UUID;
          name: string;
          phone: string | null;
          email: string | null;
          whatsapp: string | null;
          address: Json | null;
          notes: string | null;
          total_purchases: number;
          total_spend: number;
          last_visit_at: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: UUID;
          org_id: UUID;
          shop_id: UUID;
          name: string;
          phone?: string | null;
          email?: string | null;
          whatsapp?: string | null;
          address?: Json | null;
          notes?: string | null;
          total_purchases?: number;
          total_spend?: number;
          last_visit_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          id?: UUID;
          org_id?: UUID;
          shop_id?: UUID;
          name?: string;
          phone?: string | null;
          email?: string | null;
          whatsapp?: string | null;
          address?: Json | null;
          notes?: string | null;
          total_purchases?: number;
          total_spend?: number;
          last_visit_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
      };
      sales: {
        Row: {
          id: UUID;
          org_id: UUID;
          shop_id: UUID;
          bill_number: string;
          customer_id: UUID | null;
          customer_snapshot: Json | null;
          subtotal: number;
          discount_total: number;
          gst_total: number;
          grand_total: number;
          payment_method: string | null;
          amount_paid: number;
          change_returned: number;
          status: string;
          bill_sent_whatsapp: boolean;
          bill_sent_email: boolean;
          created_by: UUID | null;
          created_at: Timestamp;
        };
        Insert: {
          id?: UUID;
          org_id: UUID;
          shop_id: UUID;
          bill_number: string;
          customer_id?: UUID | null;
          customer_snapshot?: Json | null;
          subtotal?: number;
          discount_total?: number;
          gst_total?: number;
          grand_total?: number;
          payment_method?: string | null;
          amount_paid?: number;
          change_returned?: number;
          status?: string;
          bill_sent_whatsapp?: boolean;
          bill_sent_email?: boolean;
          created_by?: UUID | null;
          created_at?: Timestamp;
        };
        Update: {
          id?: UUID;
          org_id?: UUID;
          shop_id?: UUID;
          bill_number?: string;
          customer_id?: UUID | null;
          customer_snapshot?: Json | null;
          subtotal?: number;
          discount_total?: number;
          gst_total?: number;
          grand_total?: number;
          payment_method?: string | null;
          amount_paid?: number;
          change_returned?: number;
          status?: string;
          bill_sent_whatsapp?: boolean;
          bill_sent_email?: boolean;
          created_by?: UUID | null;
          created_at?: Timestamp;
        };
      };
      sale_items: {
        Row: {
          id: UUID;
          sale_id: UUID;
          sku_id: UUID | null;
          sku_code: string | null;
          category: string | null;
          sub_category: string | null;
          color: string | null;
          size: string | null;
          mrp: number;
          selling_price: number;
          discount_amount: number;
          gst_percent: number;
          gst_amount: number;
          quantity: number;
        };
        Insert: {
          id?: UUID;
          sale_id: UUID;
          sku_id?: UUID | null;
          sku_code?: string | null;
          category?: string | null;
          sub_category?: string | null;
          color?: string | null;
          size?: string | null;
          mrp?: number;
          selling_price?: number;
          discount_amount?: number;
          gst_percent?: number;
          gst_amount?: number;
          quantity?: number;
        };
        Update: {
          id?: UUID;
          sale_id?: UUID;
          sku_id?: UUID | null;
          sku_code?: string | null;
          category?: string | null;
          sub_category?: string | null;
          color?: string | null;
          size?: string | null;
          mrp?: number;
          selling_price?: number;
          discount_amount?: number;
          gst_percent?: number;
          gst_amount?: number;
          quantity?: number;
        };
      };
      returns: {
        Row: {
          id: UUID;
          org_id: UUID;
          shop_id: UUID;
          type: string;
          reference_id: UUID | null;
          total_refund: number;
          refund_method: string | null;
          status: string;
          notes: string | null;
          processed_by: UUID | null;
          created_at: Timestamp;
        };
        Insert: {
          id?: UUID;
          org_id: UUID;
          shop_id: UUID;
          type: string;
          reference_id?: UUID | null;
          total_refund?: number;
          refund_method?: string | null;
          status?: string;
          notes?: string | null;
          processed_by?: UUID | null;
          created_at?: Timestamp;
        };
        Update: {
          id?: UUID;
          org_id?: UUID;
          shop_id?: UUID;
          type?: string;
          reference_id?: UUID | null;
          total_refund?: number;
          refund_method?: string | null;
          status?: string;
          notes?: string | null;
          processed_by?: UUID | null;
          created_at?: Timestamp;
        };
      };
      return_items: {
        Row: {
          id: UUID;
          return_id: UUID;
          sku_id: UUID | null;
          sku_code: string | null;
          reason: string | null;
          refund_amount: number;
        };
        Insert: {
          id?: UUID;
          return_id: UUID;
          sku_id?: UUID | null;
          sku_code?: string | null;
          reason?: string | null;
          refund_amount?: number;
        };
        Update: {
          id?: UUID;
          return_id?: UUID;
          sku_id?: UUID | null;
          sku_code?: string | null;
          reason?: string | null;
          refund_amount?: number;
        };
      };
      expenses: {
        Row: {
          id: UUID;
          org_id: UUID;
          shop_id: UUID;
          date: string;
          category: string | null;
          description: string | null;
          amount: number;
          payment_method: string | null;
          paid_to: string | null;
          receipt_url: string | null;
          created_by: UUID | null;
          created_at: Timestamp;
        };
        Insert: {
          id?: UUID;
          org_id: UUID;
          shop_id: UUID;
          date: string;
          category?: string | null;
          description?: string | null;
          amount?: number;
          payment_method?: string | null;
          paid_to?: string | null;
          receipt_url?: string | null;
          created_by?: UUID | null;
          created_at?: Timestamp;
        };
        Update: {
          id?: UUID;
          org_id?: UUID;
          shop_id?: UUID;
          date?: string;
          category?: string | null;
          description?: string | null;
          amount?: number;
          payment_method?: string | null;
          paid_to?: string | null;
          receipt_url?: string | null;
          created_by?: UUID | null;
          created_at?: Timestamp;
        };
      };
      payroll: {
        Row: {
          id: UUID;
          org_id: UUID;
          shop_id: UUID;
          user_id: UUID;
          month: string;
          salary: number;
          bonus: number;
          deduction: number;
          net_pay: number;
          status: string;
          paid_at: Timestamp | null;
          paid_by: UUID | null;
          notes: string | null;
          created_at: Timestamp;
        };
        Insert: {
          id?: UUID;
          org_id: UUID;
          shop_id: UUID;
          user_id: UUID;
          month: string;
          salary?: number;
          bonus?: number;
          deduction?: number;
          net_pay?: number;
          status?: string;
          paid_at?: Timestamp | null;
          paid_by?: UUID | null;
          notes?: string | null;
          created_at?: Timestamp;
        };
        Update: {
          id?: UUID;
          org_id?: UUID;
          shop_id?: UUID;
          user_id?: UUID;
          month?: string;
          salary?: number;
          bonus?: number;
          deduction?: number;
          net_pay?: number;
          status?: string;
          paid_at?: Timestamp | null;
          paid_by?: UUID | null;
          notes?: string | null;
          created_at?: Timestamp;
        };
      };
      attendance: {
        Row: {
          id: UUID;
          org_id: UUID;
          shop_id: UUID;
          user_id: UUID;
          date: string;
          check_in: Timestamp | null;
          check_out: Timestamp | null;
        };
        Insert: {
          id?: UUID;
          org_id: UUID;
          shop_id: UUID;
          user_id: UUID;
          date: string;
          check_in?: Timestamp | null;
          check_out?: Timestamp | null;
        };
        Update: {
          id?: UUID;
          org_id?: UUID;
          shop_id?: UUID;
          user_id?: UUID;
          date?: string;
          check_in?: Timestamp | null;
          check_out?: Timestamp | null;
        };
      };
      daily_kharsa: {
        Row: {
          id: UUID;
          org_id: UUID;
          shop_id: UUID;
          date: string;
          opening_balance: number;
          total_sales: number;
          total_returns: number;
          total_purchases: number;
          total_expenses: number;
          cash_in_hand: number;
          closing_balance: number;
          sales_count: number;
          is_closed: boolean;
          closed_by: UUID | null;
          closed_at: Timestamp | null;
          notes: string | null;
          created_at: Timestamp;
        };
        Insert: {
          id?: UUID;
          org_id: UUID;
          shop_id: UUID;
          date: string;
          opening_balance?: number;
          total_sales?: number;
          total_returns?: number;
          total_purchases?: number;
          total_expenses?: number;
          cash_in_hand?: number;
          closing_balance?: number;
          sales_count?: number;
          is_closed?: boolean;
          closed_by?: UUID | null;
          closed_at?: Timestamp | null;
          notes?: string | null;
          created_at?: Timestamp;
        };
        Update: {
          id?: UUID;
          org_id?: UUID;
          shop_id?: UUID;
          date?: string;
          opening_balance?: number;
          total_sales?: number;
          total_returns?: number;
          total_purchases?: number;
          total_expenses?: number;
          cash_in_hand?: number;
          closing_balance?: number;
          sales_count?: number;
          is_closed?: boolean;
          closed_by?: UUID | null;
          closed_at?: Timestamp | null;
          notes?: string | null;
          created_at?: Timestamp;
        };
      };
      notifications: {
        Row: {
          id: UUID;
          user_id: UUID;
          org_id: UUID | null;
          shop_id: UUID | null;
          type: string | null;
          title: string;
          message: string;
          is_read: boolean;
          action_url: string | null;
          created_at: Timestamp;
        };
        Insert: {
          id?: UUID;
          user_id: UUID;
          org_id?: UUID | null;
          shop_id?: UUID | null;
          type?: string | null;
          title: string;
          message: string;
          is_read?: boolean;
          action_url?: string | null;
          created_at?: Timestamp;
        };
        Update: {
          id?: UUID;
          user_id?: UUID;
          org_id?: UUID | null;
          shop_id?: UUID | null;
          type?: string | null;
          title?: string;
          message?: string;
          is_read?: boolean;
          action_url?: string | null;
          created_at?: Timestamp;
        };
      };
      subscriptions: {
        Row: {
          id: UUID;
          org_id: UUID;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          stripe_price_id: string | null;
          plan_name: string | null;
          interval: string | null;
          status: string | null;
          current_period_start: Timestamp | null;
          current_period_end: Timestamp | null;
          cancel_at_period_end: boolean;
          trial_end: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: UUID;
          org_id: UUID;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          plan_name?: string | null;
          interval?: string | null;
          status?: string | null;
          current_period_start?: Timestamp | null;
          current_period_end?: Timestamp | null;
          cancel_at_period_end?: boolean;
          trial_end?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          id?: UUID;
          org_id?: UUID;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          plan_name?: string | null;
          interval?: string | null;
          status?: string | null;
          current_period_start?: Timestamp | null;
          current_period_end?: Timestamp | null;
          cancel_at_period_end?: boolean;
          trial_end?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
      };
      audit_logs: {
        Row: {
          id: UUID;
          org_id: UUID | null;
          shop_id: UUID | null;
          user_id: UUID | null;
          action: string;
          entity: string | null;
          entity_id: UUID | null;
          changes: Json | null;
          ip: string | null;
          user_agent: string | null;
          created_at: Timestamp;
        };
        Insert: {
          id?: UUID;
          org_id?: UUID | null;
          shop_id?: UUID | null;
          user_id?: UUID | null;
          action: string;
          entity?: string | null;
          entity_id?: UUID | null;
          changes?: Json | null;
          ip?: string | null;
          user_agent?: string | null;
          created_at?: Timestamp;
        };
        Update: {
          id?: UUID;
          org_id?: UUID | null;
          shop_id?: UUID | null;
          user_id?: UUID | null;
          action?: string;
          entity?: string | null;
          entity_id?: UUID | null;
          changes?: Json | null;
          ip?: string | null;
          user_agent?: string | null;
          created_at?: Timestamp;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_user_org_role: {
        Args: { target_org_id: UUID };
        Returns: string | null;
      };
      get_user_shop_role: {
        Args: { target_shop_id: UUID };
        Returns: string | null;
      };
      user_has_org_access: {
        Args: { target_org_id: UUID };
        Returns: boolean;
      };
      user_can_manage_org: {
        Args: { target_org_id: UUID };
        Returns: boolean;
      };
      user_is_org_owner: {
        Args: { target_org_id: UUID };
        Returns: boolean;
      };
      user_has_shop_access: {
        Args: { target_shop_id: UUID };
        Returns: boolean;
      };
      user_can_manage_shop: {
        Args: { target_shop_id: UUID };
        Returns: boolean;
      };
      user_can_sell: {
        Args: { target_shop_id: UUID };
        Returns: boolean;
      };
      slugify: {
        Args: { value: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type PublicSchema = Database["public"];
export type PublicTables = PublicSchema["Tables"];
export type TableName = keyof PublicTables;
export type TableRow<T extends TableName> = PublicTables[T]["Row"];
export type TableInsert<T extends TableName> = PublicTables[T]["Insert"];
export type TableUpdate<T extends TableName> = PublicTables[T]["Update"];

