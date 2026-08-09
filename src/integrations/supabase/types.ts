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
      admin_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string | null
          id: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id: string
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Relationships: []
      }
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
          account_name_verified: boolean
          account_number: string | null
          bank_name: string | null
          branch_address: string | null
          branch_name: string | null
          business_id: string
          country: string | null
          created_at: string
          currency: string | null
          destination_type: string
          id: string
          is_primary: boolean
          momo_network: string | null
          proof_doc_path: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          routing_code: string | null
          routing_type: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_holder_name?: string | null
          account_name_verified?: boolean
          account_number?: string | null
          bank_name?: string | null
          branch_address?: string | null
          branch_name?: string | null
          business_id: string
          country?: string | null
          created_at?: string
          currency?: string | null
          destination_type?: string
          id?: string
          is_primary?: boolean
          momo_network?: string | null
          proof_doc_path?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          routing_code?: string | null
          routing_type?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_holder_name?: string | null
          account_name_verified?: boolean
          account_number?: string | null
          bank_name?: string | null
          branch_address?: string | null
          branch_name?: string | null
          business_id?: string
          country?: string | null
          created_at?: string
          currency?: string | null
          destination_type?: string
          id?: string
          is_primary?: boolean
          momo_network?: string | null
          proof_doc_path?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          routing_code?: string | null
          routing_type?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          id: string
          is_primary: boolean
          logo_path: string | null
          name: string
          statement_descriptor: string | null
          support_email: string | null
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_primary?: boolean
          logo_path?: string | null
          name: string
          statement_descriptor?: string | null
          support_email?: string | null
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_primary?: boolean
          logo_path?: string | null
          name?: string
          statement_descriptor?: string | null
          support_email?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brands_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
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
          director1_ghana_card_path: string | null
          director2_ghana_card_path: string | null
          entity_type: string | null
          id: string
          incorporation_date: string | null
          incorporation_doc_path: string | null
          legal_name: string | null
          owner_dob: string | null
          owner_ghana_card_path: string | null
          owner_name: string | null
          owner_ownership_percent: number | null
          owner_role: string | null
          postal_code: string | null
          registration_form_doc_path: string | null
          registration_number: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
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
          director1_ghana_card_path?: string | null
          director2_ghana_card_path?: string | null
          entity_type?: string | null
          id?: string
          incorporation_date?: string | null
          incorporation_doc_path?: string | null
          legal_name?: string | null
          owner_dob?: string | null
          owner_ghana_card_path?: string | null
          owner_name?: string | null
          owner_ownership_percent?: number | null
          owner_role?: string | null
          postal_code?: string | null
          registration_form_doc_path?: string | null
          registration_number?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
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
          director1_ghana_card_path?: string | null
          director2_ghana_card_path?: string | null
          entity_type?: string | null
          id?: string
          incorporation_date?: string | null
          incorporation_doc_path?: string | null
          legal_name?: string | null
          owner_dob?: string | null
          owner_ghana_card_path?: string | null
          owner_name?: string | null
          owner_ownership_percent?: number | null
          owner_role?: string | null
          postal_code?: string | null
          registration_form_doc_path?: string | null
          registration_number?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
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
          additional_info_request: string | null
          additional_info_requested_at: string | null
          additional_info_responded_at: string | null
          additional_info_response: string | null
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
          additional_info_request?: string | null
          additional_info_requested_at?: string | null
          additional_info_responded_at?: string | null
          additional_info_response?: string | null
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
          additional_info_request?: string | null
          additional_info_requested_at?: string | null
          additional_info_responded_at?: string | null
          additional_info_response?: string | null
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
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
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
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
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
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
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
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
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
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
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
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
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
      sms_campaigns: {
        Row: {
          business_id: string
          cost: number
          created_at: string
          currency: string
          id: string
          message: string
          mode: string
          name: string
          recipients_count: number
          scheduled_at: string | null
          segments: number
          sender_name: string
          sent_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          cost?: number
          created_at?: string
          currency?: string
          id?: string
          message: string
          mode: string
          name: string
          recipients_count?: number
          scheduled_at?: string | null
          segments?: number
          sender_name: string
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          cost?: number
          created_at?: string
          currency?: string
          id?: string
          message?: string
          mode?: string
          name?: string
          recipients_count?: number
          scheduled_at?: string | null
          segments?: number
          sender_name?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_campaigns_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_contact_groups: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_contact_groups_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_contacts: {
        Row: {
          birthday: string | null
          business_id: string
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          opted_out: boolean
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          birthday?: string | null
          business_id: string
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          opted_out?: boolean
          phone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          birthday?: string | null
          business_id?: string
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          opted_out?: boolean
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_contacts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_group_members: {
        Row: {
          contact_id: string
          created_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_group_members_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "sms_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "sms_contact_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_messages: {
        Row: {
          business_id: string
          campaign_id: string | null
          cost: number
          created_at: string
          error_reason: string | null
          id: string
          message: string
          mode: string
          segments: number
          sender_name: string | null
          sent_at: string | null
          status: string
          to_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          campaign_id?: string | null
          cost?: number
          created_at?: string
          error_reason?: string | null
          id?: string
          message: string
          mode: string
          segments?: number
          sender_name?: string | null
          sent_at?: string | null
          status?: string
          to_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          campaign_id?: string | null
          cost?: number
          created_at?: string
          error_reason?: string | null
          id?: string
          message?: string
          mode?: string
          segments?: number
          sender_name?: string | null
          sent_at?: string | null
          status?: string
          to_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sms_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_otp_requests: {
        Row: {
          business_id: string
          cost: number
          created_at: string
          expires_at: string | null
          id: string
          mode: string
          phone: string
          status: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          business_id: string
          cost?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          mode: string
          phone: string
          status?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          business_id?: string
          cost?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          mode?: string
          phone?: string
          status?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_otp_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_otp_settings: {
        Row: {
          business_id: string
          code_length: number
          created_at: string
          expiry_minutes: number
          id: string
          sender_name: string | null
          template: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          code_length?: number
          created_at?: string
          expiry_minutes?: number
          id?: string
          sender_name?: string | null
          template?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          code_length?: number
          created_at?: string
          expiry_minutes?: number
          id?: string
          sender_name?: string | null
          template?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_otp_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_rates: {
        Row: {
          channel: string
          created_at: string
          currency: string
          description: string | null
          id: string
          unit: string
          unit_rate: number
          updated_at: string
        }
        Insert: {
          channel: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          unit: string
          unit_rate: number
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          unit?: string
          unit_rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      sms_sender_ids: {
        Row: {
          business_id: string
          created_at: string
          id: string
          name: string
          rejection_reason: string | null
          sample_message: string | null
          status: string
          updated_at: string
          use_case: string | null
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          name: string
          rejection_reason?: string | null
          sample_message?: string | null
          status?: string
          updated_at?: string
          use_case?: string | null
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          name?: string
          rejection_reason?: string | null
          sample_message?: string | null
          status?: string
          updated_at?: string
          use_case?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_sender_ids_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_settings: {
        Row: {
          business_id: string
          callback_url: string | null
          created_at: string
          default_sender: string | null
          delivery_reports: boolean
          id: string
          optout_keyword: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          callback_url?: string | null
          created_at?: string
          default_sender?: string | null
          delivery_reports?: boolean
          id?: string
          optout_keyword?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          callback_url?: string | null
          created_at?: string
          default_sender?: string | null
          delivery_reports?: boolean
          id?: string
          optout_keyword?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_wallet_ledger: {
        Row: {
          amount: number
          balance_after: number
          business_id: string
          channel: string | null
          created_at: string
          description: string | null
          entry_type: string
          id: string
          mode: string
          reference: string | null
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          business_id: string
          channel?: string | null
          created_at?: string
          description?: string | null
          entry_type: string
          id?: string
          mode: string
          reference?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          business_id?: string
          channel?: string | null
          created_at?: string
          description?: string | null
          entry_type?: string
          id?: string
          mode?: string
          reference?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_wallet_ledger_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_wallets: {
        Row: {
          balance: number
          business_id: string
          created_at: string
          currency: string
          id: string
          mode: string
          trial_granted: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          business_id: string
          created_at?: string
          currency?: string
          id?: string
          mode: string
          trial_granted?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          business_id?: string
          created_at?: string
          currency?: string
          id?: string
          mode?: string
          trial_granted?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_wallets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
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
      ussd_codes: {
        Row: {
          business_id: string
          code: string
          created_at: string
          id: string
          name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          code: string
          created_at?: string
          id?: string
          name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          code?: string
          created_at?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ussd_codes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ussd_menu_nodes: {
        Row: {
          action: string
          business_id: string
          code_id: string
          created_at: string
          id: string
          label: string
          option_key: string | null
          order_index: number
          parent_id: string | null
          prompt: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          action?: string
          business_id: string
          code_id: string
          created_at?: string
          id?: string
          label: string
          option_key?: string | null
          order_index?: number
          parent_id?: string | null
          prompt?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          action?: string
          business_id?: string
          code_id?: string
          created_at?: string
          id?: string
          label?: string
          option_key?: string | null
          order_index?: number
          parent_id?: string | null
          prompt?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ussd_menu_nodes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ussd_menu_nodes_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "ussd_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ussd_menu_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "ussd_menu_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      ussd_sessions: {
        Row: {
          business_id: string
          code_id: string | null
          cost: number
          ended_at: string | null
          id: string
          mode: string
          msisdn: string
          session_ref: string | null
          started_at: string
          status: string
          steps: number
          user_id: string
        }
        Insert: {
          business_id: string
          code_id?: string | null
          cost?: number
          ended_at?: string | null
          id?: string
          mode: string
          msisdn: string
          session_ref?: string | null
          started_at?: string
          status?: string
          steps?: number
          user_id: string
        }
        Update: {
          business_id?: string
          code_id?: string | null
          cost?: number
          ended_at?: string | null
          id?: string
          mode?: string
          msisdn?: string
          session_ref?: string | null
          started_at?: string
          status?: string
          steps?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ussd_sessions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ussd_sessions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "ussd_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_calls: {
        Row: {
          business_id: string
          campaign_id: string | null
          cost: number
          created_at: string
          duration_seconds: number
          id: string
          mode: string
          status: string
          to_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          campaign_id?: string | null
          cost?: number
          created_at?: string
          duration_seconds?: number
          id?: string
          mode: string
          status?: string
          to_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          campaign_id?: string | null
          cost?: number
          created_at?: string
          duration_seconds?: number
          id?: string
          mode?: string
          status?: string
          to_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_calls_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_calls_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "voice_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_campaigns: {
        Row: {
          audio_path: string | null
          business_id: string
          caller_id: string | null
          cost: number
          created_at: string
          id: string
          mode: string
          name: string
          recipients_count: number
          scheduled_at: string | null
          script: string | null
          source: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_path?: string | null
          business_id: string
          caller_id?: string | null
          cost?: number
          created_at?: string
          id?: string
          mode: string
          name: string
          recipients_count?: number
          scheduled_at?: string | null
          script?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_path?: string | null
          business_id?: string
          caller_id?: string | null
          cost?: number
          created_at?: string
          id?: string
          mode?: string
          name?: string
          recipients_count?: number
          scheduled_at?: string | null
          script?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_campaigns_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      sms_ensure_wallet: {
        Args: { _business_id: string; _mode: string }
        Returns: {
          balance: number
          business_id: string
          created_at: string
          currency: string
          id: string
          mode: string
          trial_granted: boolean
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "sms_wallets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      sms_wallet_entry: {
        Args: {
          _amount: number
          _business_id: string
          _channel?: string
          _description?: string
          _entry_type: string
          _mode: string
          _reference?: string
        }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "support" | "user"
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
      app_role: ["admin", "support", "user"],
    },
  },
} as const
