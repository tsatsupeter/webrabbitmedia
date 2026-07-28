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
          updated_at?: string
          user_id?: string
          website_url?: string
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
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          last_active_business_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_active_business_id?: string | null
          updated_at?: string
        }
        Relationships: []
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
