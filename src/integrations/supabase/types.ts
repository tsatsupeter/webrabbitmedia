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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          access: string
          business_id: string
          created_at: string
          expires_at: string
          id: string
          key_hash: string
          key_prefix: string
          mode: string
          name: string
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          access?: string
          business_id: string
          created_at?: string
          expires_at?: string
          id?: string
          key_hash: string
          key_prefix: string
          mode?: string
          name: string
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          access?: string
          business_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          key_hash?: string
          key_prefix?: string
          mode?: string
          name?: string
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_verification: {
        Row: {
          account_holder_name: string | null
          account_number: string | null
          bank_name: string | null
          branch_address: string | null
          branch_name: string | null
          business_id: string
          country: string | null
          created_at: string
          currency: string | null
          id: string
          is_primary: boolean
          proof_doc_path: string | null
          routing_code: string | null
          routing_type: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_holder_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          branch_address?: string | null
          branch_name?: string | null
          business_id: string
          country?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          is_primary?: boolean
          proof_doc_path?: string | null
          routing_code?: string | null
          routing_type?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_holder_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          branch_address?: string | null
          branch_name?: string | null
          business_id?: string
          country?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          is_primary?: boolean
          proof_doc_path?: string | null
          routing_code?: string | null
          routing_type?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      business_verification: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          address_proof_path: string | null
          business_id: string
          city: string | null
          country: string | null
          created_at: string
          entity_type: string | null
          id: string
          incorporation_date: string | null
          incorporation_doc_path: string | null
          legal_name: string | null
          owner_dob: string | null
          owner_name: string | null
          owner_ownership_percent: number | null
          owner_role: string | null
          postal_code: string | null
          registration_number: string | null
          state: string | null
          status: string
          submitted_at: string | null
          support_email: string | null
          support_phone: string | null
          tax_doc_path: string | null
          tax_id: string | null
          trading_name: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          address_proof_path?: string | null
          business_id: string
          city?: string | null
          country?: string | null
          created_at?: string
          entity_type?: string | null
          id?: string
          incorporation_date?: string | null
          incorporation_doc_path?: string | null
          legal_name?: string | null
          owner_dob?: string | null
          owner_name?: string | null
          owner_ownership_percent?: number | null
          owner_role?: string | null
          postal_code?: string | null
          registration_number?: string | null
          state?: string | null
          status?: string
          submitted_at?: string | null
          support_email?: string | null
          support_phone?: string | null
          tax_doc_path?: string | null
          tax_id?: string | null
          trading_name?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          address_proof_path?: string | null
          business_id?: string
          city?: string | null
          country?: string | null
          created_at?: string
          entity_type?: string | null
          id?: string
          incorporation_date?: string | null
          incorporation_doc_path?: string | null
          legal_name?: string | null
          owner_dob?: string | null
          owner_name?: string | null
          owner_ownership_percent?: number | null
          owner_role?: string | null
          postal_code?: string | null
          registration_number?: string | null
          state?: string | null
          status?: string
          submitted_at?: string | null
          support_email?: string | null
          support_phone?: string | null
          tax_doc_path?: string | null
          tax_id?: string | null
          trading_name?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_verification_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          business_type: string | null
          created_at: string
          disclaimer_accepted_at: string
          id: string
          location: string
          monetization_note: string | null
          name: string
          product_category: string
          referral_source: string
          status: string
          updated_at: string
          user_id: string
          website_url: string
        }
        Insert: {
          business_type?: string | null
          created_at?: string
          disclaimer_accepted_at?: string
          id?: string
          location: string
          monetization_note?: string | null
          name: string
          product_category: string
          referral_source: string
          status?: string
          updated_at?: string
          user_id: string
          website_url: string
        }
        Update: {
          business_type?: string | null
          created_at?: string
          disclaimer_accepted_at?: string
          id?: string
          location?: string
          monetization_note?: string | null
          name?: string
          product_category?: string
          referral_source?: string
          status?: string
          updated_at?: string
          user_id?: string
          website_url?: string
        }
        Relationships: []
      }
      idempotency_keys: {
        Row: {
          api_key_id: string
          business_id: string
          completed_at: string | null
          created_at: string
          endpoint: string
          id: string
          key: string
          request_hash: string
          response_body: Json | null
          status_code: number | null
          transaction_id: string | null
        }
        Insert: {
          api_key_id: string
          business_id: string
          completed_at?: string | null
          created_at?: string
          endpoint: string
          id?: string
          key: string
          request_hash: string
          response_body?: Json | null
          status_code?: number | null
          transaction_id?: string | null
        }
        Update: {
          api_key_id?: string
          business_id?: string
          completed_at?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          key?: string
          request_hash?: string
          response_body?: Json | null
          status_code?: number | null
          transaction_id?: string | null
        }
        Relationships: []
      }
      identity_verification: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          business_id: string
          city: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string | null
          id: string
          id_document_back_path: string | null
          id_document_front_path: string | null
          id_number: string | null
          id_type: string | null
          postal_code: string | null
          selfie_path: string | null
          state: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          business_id: string
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          id?: string
          id_document_back_path?: string | null
          id_document_front_path?: string | null
          id_number?: string | null
          id_type?: string | null
          postal_code?: string | null
          selfie_path?: string | null
          state?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          business_id?: string
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          id?: string
          id_document_back_path?: string | null
          id_document_front_path?: string | null
          id_number?: string | null
          id_type?: string | null
          postal_code?: string | null
          selfie_path?: string | null
          state?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_verification_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          product_emails: boolean
          security_emails: boolean
          tx_emails: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          product_emails?: boolean
          security_emails?: boolean
          tx_emails?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          product_emails?: boolean
          security_emails?: boolean
          tx_emails?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          business_id: string | null
          category: string | null
          created_at: string
          id: string
          link: string | null
          message: string | null
          read: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          category?: string | null
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          category?: string | null
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          bank_id: string | null
          business_id: string
          completed_at: string | null
          created_at: string
          currency: string
          currency_conversion: number
          fees: number
          gross_amount: number
          id: string
          initiated_at: string
          mode: string
          name: string
          net_amount: number
          notes: string | null
          payment_method: string
          provider_reference: string | null
          status: string
          tax_deducted: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_id?: string | null
          business_id: string
          completed_at?: string | null
          created_at?: string
          currency?: string
          currency_conversion?: number
          fees?: number
          gross_amount?: number
          id?: string
          initiated_at?: string
          mode?: string
          name: string
          net_amount?: number
          notes?: string | null
          payment_method?: string
          provider_reference?: string | null
          status?: string
          tax_deducted?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_id?: string | null
          business_id?: string
          completed_at?: string | null
          created_at?: string
          currency?: string
          currency_conversion?: number
          fees?: number
          gross_amount?: number
          id?: string
          initiated_at?: string
          mode?: string
          name?: string
          net_amount?: number
          notes?: string | null
          payment_method?: string
          provider_reference?: string | null
          status?: string
          tax_deducted?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "bank_verification"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          business_id: string
          commission_bps: number
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          business_id: string
          commission_bps?: number
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          commission_bps?: number
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_information: {
        Row: {
          acquisitions: string[]
          business_id: string
          category: string | null
          confirmed_at: string | null
          created_at: string
          delivery_level: string | null
          description: string | null
          id: string
          integrations: string[]
          other_acquisition: string | null
          payment_platform: string | null
          receive_flow: string | null
          receive_methods: string[]
          risks: string[]
          socials: string[]
          stage: string | null
          status: string
          updated_at: string
          user_id: string
          websites: string[]
        }
        Insert: {
          acquisitions?: string[]
          business_id: string
          category?: string | null
          confirmed_at?: string | null
          created_at?: string
          delivery_level?: string | null
          description?: string | null
          id?: string
          integrations?: string[]
          other_acquisition?: string | null
          payment_platform?: string | null
          receive_flow?: string | null
          receive_methods?: string[]
          risks?: string[]
          socials?: string[]
          stage?: string | null
          status?: string
          updated_at?: string
          user_id: string
          websites?: string[]
        }
        Update: {
          acquisitions?: string[]
          business_id?: string
          category?: string | null
          confirmed_at?: string | null
          created_at?: string
          delivery_level?: string | null
          description?: string | null
          id?: string
          integrations?: string[]
          other_acquisition?: string | null
          payment_platform?: string | null
          receive_flow?: string | null
          receive_methods?: string[]
          risks?: string[]
          socials?: string[]
          stage?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          websites?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "product_information_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          last_active_business_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          last_active_business_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_active_business_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      team_invites: {
        Row: {
          accepted_at: string | null
          business_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          business_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: string
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          business_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          business_id: string
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_bank: string | null
          account_number: string | null
          api_key_id: string | null
          business_id: string
          channel: string
          created_at: string
          currency: string
          customer_email: string | null
          description: string | null
          fee_amount: number
          gross_amount: number
          id: string
          mode: string
          net_amount: number
          payout_id: string | null
          provider: string
          provider_code: string | null
          provider_reason: string | null
          provider_reference: string | null
          provider_transaction_id: string
          r_switch: string | null
          raw_response: Json | null
          status: string
          subscriber_number: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_bank?: string | null
          account_number?: string | null
          api_key_id?: string | null
          business_id: string
          channel: string
          created_at?: string
          currency?: string
          customer_email?: string | null
          description?: string | null
          fee_amount?: number
          gross_amount: number
          id?: string
          mode: string
          net_amount: number
          payout_id?: string | null
          provider?: string
          provider_code?: string | null
          provider_reason?: string | null
          provider_reference?: string | null
          provider_transaction_id: string
          r_switch?: string | null
          raw_response?: Json | null
          status?: string
          subscriber_number?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_bank?: string | null
          account_number?: string | null
          api_key_id?: string | null
          business_id?: string
          channel?: string
          created_at?: string
          currency?: string
          customer_email?: string | null
          description?: string | null
          fee_amount?: number
          gross_amount?: number
          id?: string
          mode?: string
          net_amount?: number
          payout_id?: string | null
          provider?: string
          provider_code?: string | null
          provider_reason?: string | null
          provider_reference?: string | null
          provider_transaction_id?: string
          r_switch?: string | null
          raw_response?: Json | null
          status?: string
          subscriber_number?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      enqueue_email: {
        Args: {
          _business_id: string
          _data: Json
          _event: string
          _user_id: string
        }
        Returns: undefined
      }
      get_email_hook_secret: { Args: never; Returns: string }
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
