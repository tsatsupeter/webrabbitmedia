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
          product: string
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
          product?: string
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
          product?: string
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
      business_transfers: {
        Row: {
          business_id: string
          created_at: string
          expires_at: string
          from_user_id: string
          id: string
          responded_at: string | null
          status: string
          to_email: string
          to_user_id: string | null
          token: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          expires_at?: string
          from_user_id: string
          id?: string
          responded_at?: string | null
          status?: string
          to_email: string
          to_user_id?: string | null
          token: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          expires_at?: string
          from_user_id?: string
          id?: string
          responded_at?: string | null
          status?: string
          to_email?: string
          to_user_id?: string | null
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_transfers_business_id_fkey"
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
      developer_earnings: {
        Row: {
          amount: number
          assignment_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          developer_id: string
          id: string
          milestone_id: string | null
          note: string | null
          paid_at: string | null
          project_id: string
          reference: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          assignment_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          developer_id: string
          id?: string
          milestone_id?: string | null
          note?: string | null
          paid_at?: string | null
          project_id: string
          reference?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          assignment_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          developer_id?: string
          id?: string
          milestone_id?: string | null
          note?: string | null
          paid_at?: string | null
          project_id?: string
          reference?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_earnings_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "project_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_earnings_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "studio_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_earnings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          note: string | null
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          note?: string | null
          token: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          note?: string | null
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      developer_profiles: {
        Row: {
          availability: string
          avatar_url: string | null
          created_at: string
          currency: string
          display_name: string
          email: string | null
          github_url: string | null
          headline: string | null
          id: string
          linkedin_url: string | null
          location: string | null
          payout_account: string | null
          payout_method: string | null
          payout_name: string | null
          phone: string | null
          pitch: string | null
          portfolio_url: string | null
          rate: number
          rate_unit: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          seniority: string
          skills: string[]
          source: string
          status: string
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          availability?: string
          avatar_url?: string | null
          created_at?: string
          currency?: string
          display_name: string
          email?: string | null
          github_url?: string | null
          headline?: string | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          payout_account?: string | null
          payout_method?: string | null
          payout_name?: string | null
          phone?: string | null
          pitch?: string | null
          portfolio_url?: string | null
          rate?: number
          rate_unit?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          seniority?: string
          skills?: string[]
          source?: string
          status?: string
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          availability?: string
          avatar_url?: string | null
          created_at?: string
          currency?: string
          display_name?: string
          email?: string | null
          github_url?: string | null
          headline?: string | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          payout_account?: string | null
          payout_method?: string | null
          payout_name?: string | null
          phone?: string | null
          pitch?: string | null
          portfolio_url?: string | null
          rate?: number
          rate_unit?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          seniority?: string
          skills?: string[]
          source?: string
          status?: string
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      docs_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          sources: Json
          thread_id: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          role: string
          sources?: Json
          thread_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          sources?: Json
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "docs_chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "docs_chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      docs_chat_threads: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
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
          messaging_emails: boolean
          product_emails: boolean
          security_emails: boolean
          tx_emails: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          messaging_emails?: boolean
          product_emails?: boolean
          security_emails?: boolean
          tx_emails?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          messaging_emails?: boolean
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
          gateway: string
          id: string
          updated_at: string
        }
        Insert: {
          business_id: string
          commission_bps?: number
          created_at?: string
          gateway?: string
          id?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          commission_bps?: number
          created_at?: string
          gateway?: string
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
      project_assignments: {
        Row: {
          amount: number
          assigned_at: string
          assigned_by: string | null
          created_at: string
          currency: string
          developer_id: string
          developer_profile_id: string | null
          hours: number
          id: string
          note: string | null
          pay_type: string
          project_id: string
          removed_at: string | null
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          currency?: string
          developer_id: string
          developer_profile_id?: string | null
          hours?: number
          id?: string
          note?: string | null
          pay_type?: string
          project_id: string
          removed_at?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          currency?: string
          developer_id?: string
          developer_profile_id?: string | null
          hours?: number
          id?: string
          note?: string | null
          pay_type?: string
          project_id?: string
          removed_at?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_assignments_developer_profile_id_fkey"
            columns: ["developer_profile_id"]
            isOneToOne: false
            referencedRelation: "developer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          created_at: string
          detail: Json
          id: string
          type: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          detail?: Json
          id?: string
          type: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          detail?: Json
          id?: string
          type?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sms_campaigns: {
        Row: {
          business_id: string
          cost: number
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          message: string
          mode: string
          name: string
          provider: string
          provider_campaign_id: string | null
          provider_response: Json | null
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
          failure_reason?: string | null
          id?: string
          message: string
          mode: string
          name: string
          provider?: string
          provider_campaign_id?: string | null
          provider_response?: Json | null
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
          failure_reason?: string | null
          id?: string
          message?: string
          mode?: string
          name?: string
          provider?: string
          provider_campaign_id?: string | null
          provider_response?: Json | null
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
          delivered_at: string | null
          error_reason: string | null
          id: string
          message: string
          mode: string
          provider_message_id: string | null
          provider_status: string | null
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
          delivered_at?: string | null
          error_reason?: string | null
          id?: string
          message: string
          mode: string
          provider_message_id?: string | null
          provider_status?: string | null
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
          delivered_at?: string | null
          error_reason?: string | null
          id?: string
          message?: string
          mode?: string
          provider_message_id?: string | null
          provider_status?: string | null
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
          attempts: number
          business_id: string
          code_hash: string | null
          cost: number
          created_at: string
          expires_at: string | null
          id: string
          mode: string
          phone: string
          provider_campaign_id: string | null
          status: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          business_id: string
          code_hash?: string | null
          cost?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          mode: string
          phone: string
          provider_campaign_id?: string | null
          status?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          business_id?: string
          code_hash?: string | null
          cost?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          mode?: string
          phone?: string
          provider_campaign_id?: string | null
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
          provider_status: string | null
          provider_synced_at: string | null
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
          provider_status?: string | null
          provider_synced_at?: string | null
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
          provider_status?: string | null
          provider_synced_at?: string | null
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
      sms_topups: {
        Row: {
          amount: number
          business_id: string
          created_at: string
          credited_at: string | null
          currency: string
          gateway: string
          id: string
          mode: string
          msisdn: string
          network: string
          provider_code: string | null
          provider_reason: string | null
          provider_reference: string | null
          reference: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          business_id: string
          created_at?: string
          credited_at?: string | null
          currency?: string
          gateway?: string
          id?: string
          mode?: string
          msisdn: string
          network: string
          provider_code?: string | null
          provider_reason?: string | null
          provider_reference?: string | null
          reference: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string
          credited_at?: string | null
          currency?: string
          gateway?: string
          id?: string
          mode?: string
          msisdn?: string
          network?: string
          provider_code?: string | null
          provider_reason?: string | null
          provider_reference?: string | null
          reference?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_topups_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
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
      software_requests: {
        Row: {
          admin_note: string | null
          budget: string | null
          business_id: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string
          id: string
          project_type: string
          status: string
          timeline: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          budget?: string | null
          business_id?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description: string
          id?: string
          project_type: string
          status?: string
          timeline?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          budget?: string | null
          business_id?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string
          id?: string
          project_type?: string
          status?: string
          timeline?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "software_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_events: {
        Row: {
          actor_id: string | null
          actor_label: string | null
          created_at: string
          details: Json
          id: string
          message: string | null
          project_id: string
          type: string
        }
        Insert: {
          actor_id?: string | null
          actor_label?: string | null
          created_at?: string
          details?: Json
          id?: string
          message?: string | null
          project_id: string
          type: string
        }
        Update: {
          actor_id?: string | null
          actor_label?: string | null
          created_at?: string
          details?: Json
          id?: string
          message?: string | null
          project_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_files: {
        Row: {
          created_at: string
          id: string
          kind: string | null
          label: string | null
          path: string
          project_id: string
          size_bytes: number | null
          uploaded_by: string | null
          uploader_role: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string | null
          label?: string | null
          path: string
          project_id: string
          size_bytes?: number | null
          uploaded_by?: string | null
          uploader_role?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string | null
          label?: string | null
          path?: string
          project_id?: string
          size_bytes?: number | null
          uploaded_by?: string | null
          uploader_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_invoices: {
        Row: {
          amount: number
          business_id: string | null
          created_at: string
          currency: string
          description: string | null
          due_date: string | null
          gateway: string | null
          id: string
          milestone_id: string | null
          msisdn: string | null
          network: string | null
          paid_at: string | null
          project_id: string
          provider_reference: string | null
          reference: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          business_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          due_date?: string | null
          gateway?: string | null
          id?: string
          milestone_id?: string | null
          msisdn?: string | null
          network?: string | null
          paid_at?: string | null
          project_id: string
          provider_reference?: string | null
          reference: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          business_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          due_date?: string | null
          gateway?: string | null
          id?: string
          milestone_id?: string | null
          msisdn?: string | null
          network?: string | null
          paid_at?: string | null
          project_id?: string
          provider_reference?: string | null
          reference?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_invoices_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "studio_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_messages: {
        Row: {
          attachment_path: string | null
          author_id: string | null
          author_label: string | null
          author_role: string
          body: string
          created_at: string
          id: string
          project_id: string
        }
        Insert: {
          attachment_path?: string | null
          author_id?: string | null
          author_label?: string | null
          author_role?: string
          body: string
          created_at?: string
          id?: string
          project_id: string
        }
        Update: {
          attachment_path?: string | null
          author_id?: string | null
          author_label?: string | null
          author_role?: string
          body?: string
          created_at?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_milestones: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          currency: string
          description: string | null
          due_date: string | null
          id: string
          order_index: number
          project_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          order_index?: number
          project_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          order_index?: number
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_projects: {
        Row: {
          admin_note: string | null
          approved_at: string | null
          brief: Json
          business_id: string | null
          change_request: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          currency: string
          estimate_max: number
          estimate_min: number
          goal: string | null
          id: string
          launched_at: string | null
          project_type: string | null
          proposal: Json | null
          proposal_sent_at: string | null
          status: string
          submitted_at: string | null
          title: string
          updated_at: string
          user_id: string
          weeks_max: number
          weeks_min: number
        }
        Insert: {
          admin_note?: string | null
          approved_at?: string | null
          brief?: Json
          business_id?: string | null
          change_request?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string
          estimate_max?: number
          estimate_min?: number
          goal?: string | null
          id?: string
          launched_at?: string | null
          project_type?: string | null
          proposal?: Json | null
          proposal_sent_at?: string | null
          status?: string
          submitted_at?: string | null
          title?: string
          updated_at?: string
          user_id: string
          weeks_max?: number
          weeks_min?: number
        }
        Update: {
          admin_note?: string | null
          approved_at?: string | null
          brief?: Json
          business_id?: string | null
          change_request?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string
          estimate_max?: number
          estimate_min?: number
          goal?: string | null
          id?: string
          launched_at?: string | null
          project_type?: string | null
          proposal?: Json | null
          proposal_sent_at?: string | null
          status?: string
          submitted_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          weeks_max?: number
          weeks_min?: number
        }
        Relationships: [
          {
            foreignKeyName: "studio_projects_business_id_fkey"
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
          provider_fee: number | null
          provider_reason: string | null
          provider_reference: string | null
          provider_transaction_id: string
          r_switch: string | null
          raw_response: Json | null
          reversed_at: string | null
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
          provider_fee?: number | null
          provider_reason?: string | null
          provider_reference?: string | null
          provider_transaction_id: string
          r_switch?: string | null
          raw_response?: Json | null
          reversed_at?: string | null
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
          provider_fee?: number | null
          provider_reason?: string | null
          provider_reference?: string | null
          provider_transaction_id?: string
          r_switch?: string | null
          raw_response?: Json | null
          reversed_at?: string | null
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
          provider_call_id: string | null
          provider_status: string | null
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
          provider_call_id?: string | null
          provider_status?: string | null
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
          provider_call_id?: string | null
          provider_status?: string | null
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
          failure_reason: string | null
          id: string
          mode: string
          name: string
          provider_campaign_id: string | null
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
          failure_reason?: string | null
          id?: string
          mode: string
          name: string
          provider_campaign_id?: string | null
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
          failure_reason?: string | null
          id?: string
          mode?: string
          name?: string
          provider_campaign_id?: string | null
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
      webhook_deliveries: {
        Row: {
          attempt: number
          business_id: string
          claimed_at: string | null
          created_at: string
          delivered_at: string | null
          duration_ms: number | null
          endpoint_id: string
          error: string | null
          event_id: string
          id: string
          max_attempts: number
          next_attempt_at: string
          response_body: string | null
          response_code: number | null
          status: string
          updated_at: string
        }
        Insert: {
          attempt?: number
          business_id: string
          claimed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          duration_ms?: number | null
          endpoint_id: string
          error?: string | null
          event_id: string
          id?: string
          max_attempts?: number
          next_attempt_at?: string
          response_body?: string | null
          response_code?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempt?: number
          business_id?: string
          claimed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          duration_ms?: number | null
          endpoint_id?: string
          error?: string | null
          event_id?: string
          id?: string
          max_attempts?: number
          next_attempt_at?: string
          response_body?: string | null
          response_code?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_deliveries_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_deliveries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "webhook_events"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_endpoint_secrets: {
        Row: {
          created_at: string
          endpoint_id: string
          secret: string
        }
        Insert: {
          created_at?: string
          endpoint_id: string
          secret: string
        }
        Update: {
          created_at?: string
          endpoint_id?: string
          secret?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_endpoint_secrets_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: true
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_endpoints: {
        Row: {
          business_id: string
          created_at: string
          created_by: string | null
          description: string | null
          disabled_reason: string | null
          events: string[]
          failure_streak: number
          id: string
          last_delivery_at: string | null
          last_status_code: number | null
          mode: string
          secret_hash: string
          secret_last4: string
          status: string
          throttle_per_minute: number | null
          updated_at: string
          url: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          disabled_reason?: string | null
          events?: string[]
          failure_streak?: number
          id?: string
          last_delivery_at?: string | null
          last_status_code?: number | null
          mode?: string
          secret_hash: string
          secret_last4: string
          status?: string
          throttle_per_minute?: number | null
          updated_at?: string
          url: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          disabled_reason?: string | null
          events?: string[]
          failure_streak?: number
          id?: string
          last_delivery_at?: string | null
          last_status_code?: number | null
          mode?: string
          secret_hash?: string
          secret_last4?: string
          status?: string
          throttle_per_minute?: number | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_endpoints_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          business_id: string
          created_at: string
          id: string
          mode: string
          payload: Json
          resource_id: string | null
          resource_type: string | null
          type: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          mode: string
          payload?: Json
          resource_id?: string | null
          resource_type?: string | null
          type: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          mode?: string
          payload?: Json
          resource_id?: string | null
          resource_type?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_settings: {
        Row: {
          alert_emails: string[]
          business_id: string
          created_at: string
          id: string
          mode: string
          updated_at: string
        }
        Insert: {
          alert_emails?: string[]
          business_id: string
          created_at?: string
          id?: string
          mode: string
          updated_at?: string
        }
        Update: {
          alert_emails?: string[]
          business_id?: string
          created_at?: string
          id?: string
          mode?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_activity: {
        Row: {
          action: string
          actor_id: string | null
          actor_label: string | null
          business_id: string
          created_at: string
          details: Json
          id: string
          target_label: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_label?: string | null
          business_id: string
          created_at?: string
          details?: Json
          id?: string
          target_label?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_label?: string | null
          business_id?: string
          created_at?: string
          details?: Json
          id?: string
          target_label?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspace_activity_business_id_fkey"
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
      business_role: { Args: { _business_id: string }; Returns: string }
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
      is_business_editor: { Args: { _business_id: string }; Returns: boolean }
      is_business_member: { Args: { _business_id: string }; Returns: boolean }
      is_developer: { Args: never; Returns: boolean }
      is_project_developer: { Args: { _project_id: string }; Returns: boolean }
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
      sms_ensure_wallet_svc: {
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
      sms_wallet_entry_svc: {
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
