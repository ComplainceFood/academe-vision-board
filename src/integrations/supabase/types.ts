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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_communications: {
        Row: {
          admin_id: string
          category: string
          content: string
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          is_published: boolean
          priority: string
          published_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          category?: string
          content: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_published?: boolean
          priority?: string
          published_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          category?: string
          content?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_published?: boolean
          priority?: string
          published_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      calendar_sync_history: {
        Row: {
          created_at: string
          duration_ms: number | null
          errors: Json | null
          id: string
          successful_syncs: number
          sync_time: string
          total_internal_events: number
          total_outlook_events: number
          total_users: number
          triggered_by: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          errors?: Json | null
          id?: string
          successful_syncs?: number
          sync_time?: string
          total_internal_events?: number
          total_outlook_events?: number
          total_users?: number
          triggered_by?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          errors?: Json | null
          id?: string
          successful_syncs?: number
          sync_time?: string
          total_internal_events?: number
          total_outlook_events?: number
          total_users?: number
          triggered_by?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          course: string
          date: string
          description: string
          id: string
          receipt: boolean | null
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          course: string
          date: string
          description: string
          id?: string
          receipt?: boolean | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          course?: string
          date?: string
          description?: string
          id?: string
          receipt?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          admin_id: string | null
          admin_response: string | null
          category: string
          created_at: string
          description: string
          id: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          admin_response?: string | null
          category: string
          created_at?: string
          description: string
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          admin_response?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      funding_commitments: {
        Row: {
          category: string
          commitment_date: string
          committed_amount: number
          created_at: string
          description: string | null
          due_date: string | null
          funding_source_id: string
          id: string
          notes: string | null
          priority: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          commitment_date?: string
          committed_amount: number
          created_at?: string
          description?: string | null
          due_date?: string | null
          funding_source_id: string
          id?: string
          notes?: string | null
          priority?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          commitment_date?: string
          committed_amount?: number
          created_at?: string
          description?: string | null
          due_date?: string | null
          funding_source_id?: string
          id?: string
          notes?: string | null
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funding_commitments_funding_source_id_fkey"
            columns: ["funding_source_id"]
            isOneToOne: false
            referencedRelation: "funding_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      funding_expenditures: {
        Row: {
          amount: number
          approval_date: string | null
          approved_by: string | null
          category: string
          created_at: string
          description: string
          expenditure_date: string
          expense_id: string | null
          funding_source_id: string
          id: string
          notes: string | null
          receipt_number: string | null
          receipt_url: string | null
          supply_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          approval_date?: string | null
          approved_by?: string | null
          category: string
          created_at?: string
          description: string
          expenditure_date?: string
          expense_id?: string | null
          funding_source_id: string
          id?: string
          notes?: string | null
          receipt_number?: string | null
          receipt_url?: string | null
          supply_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          approval_date?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          description?: string
          expenditure_date?: string
          expense_id?: string | null
          funding_source_id?: string
          id?: string
          notes?: string | null
          receipt_number?: string | null
          receipt_url?: string | null
          supply_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funding_expenditures_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funding_expenditures_funding_source_id_fkey"
            columns: ["funding_source_id"]
            isOneToOne: false
            referencedRelation: "funding_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funding_expenditures_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "supplies"
            referencedColumns: ["id"]
          },
        ]
      }
      funding_reports: {
        Row: {
          created_at: string
          due_date: string | null
          funding_source_id: string
          id: string
          remaining_balance: number
          report_content: string | null
          report_period_end: string
          report_period_start: string
          report_type: string
          status: string
          submission_notes: string | null
          submitted_date: string | null
          total_expenditures: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          funding_source_id: string
          id?: string
          remaining_balance?: number
          report_content?: string | null
          report_period_end: string
          report_period_start: string
          report_type: string
          status?: string
          submission_notes?: string | null
          submitted_date?: string | null
          total_expenditures?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          funding_source_id?: string
          id?: string
          remaining_balance?: number
          report_content?: string | null
          report_period_end?: string
          report_period_start?: string
          report_type?: string
          status?: string
          submission_notes?: string | null
          submitted_date?: string | null
          total_expenditures?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funding_reports_funding_source_id_fkey"
            columns: ["funding_source_id"]
            isOneToOne: false
            referencedRelation: "funding_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      funding_sources: {
        Row: {
          contact_email: string | null
          contact_person: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          remaining_amount: number
          reporting_requirements: string | null
          restrictions: string | null
          start_date: string
          status: string
          total_amount: number
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          remaining_amount: number
          reporting_requirements?: string | null
          restrictions?: string | null
          start_date: string
          status?: string
          total_amount: number
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          remaining_amount?: number
          reporting_requirements?: string | null
          restrictions?: string | null
          start_date?: string
          status?: string
          total_amount?: number
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      future_planning: {
        Row: {
          created_at: string | null
          description: string | null
          estimated_hours: number | null
          id: string
          priority: string
          semester: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          priority: string
          semester: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string
          semester?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      google_calendar_integration: {
        Row: {
          access_token: string | null
          created_at: string
          id: string
          is_active: boolean | null
          last_sync: string | null
          refresh_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          refresh_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      login_history: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown
          location: Json | null
          login_at: string
          login_method: string | null
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address: unknown
          location?: Json | null
          login_at?: string
          login_method?: string | null
          success?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown
          location?: Json | null
          login_at?: string
          login_method?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meetings: {
        Row: {
          action_items: Json
          agenda: string | null
          attachments: Json
          attendees: Json
          created_at: string
          description: string | null
          end_time: string
          funding_source_id: string | null
          id: string
          is_recurring: boolean
          location: string
          notes: string | null
          recurring_end_date: string | null
          recurring_pattern: string | null
          reminder_minutes: number | null
          start_date: string
          start_time: string
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_items?: Json
          agenda?: string | null
          attachments?: Json
          attendees?: Json
          created_at?: string
          description?: string | null
          end_time: string
          funding_source_id?: string | null
          id?: string
          is_recurring?: boolean
          location: string
          notes?: string | null
          recurring_end_date?: string | null
          recurring_pattern?: string | null
          reminder_minutes?: number | null
          start_date: string
          start_time: string
          status?: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_items?: Json
          agenda?: string | null
          attachments?: Json
          attendees?: Json
          created_at?: string
          description?: string | null
          end_time?: string
          funding_source_id?: string | null
          id?: string
          is_recurring?: boolean
          location?: string
          notes?: string | null
          recurring_end_date?: string | null
          recurring_pattern?: string | null
          reminder_minutes?: number | null
          start_date?: string
          start_time?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_funding_source_id_fkey"
            columns: ["funding_source_id"]
            isOneToOne: false
            referencedRelation: "funding_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          course: string
          created_at: string
          due_date: string | null
          folder_color: string | null
          funding_source_id: string | null
          id: string
          is_folder: boolean | null
          next_occurrence: string | null
          parent_folder_id: string | null
          priority: string
          recurrence_end_date: string | null
          recurrence_pattern: string | null
          starred: boolean
          status: string
          student_name: string | null
          subtasks: Json | null
          tags: string[] | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          course: string
          created_at?: string
          due_date?: string | null
          folder_color?: string | null
          funding_source_id?: string | null
          id?: string
          is_folder?: boolean | null
          next_occurrence?: string | null
          parent_folder_id?: string | null
          priority?: string
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          starred?: boolean
          status?: string
          student_name?: string | null
          subtasks?: Json | null
          tags?: string[] | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          course?: string
          created_at?: string
          due_date?: string | null
          folder_color?: string | null
          funding_source_id?: string | null
          id?: string
          is_folder?: boolean | null
          next_occurrence?: string | null
          parent_folder_id?: string | null
          priority?: string
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          starred?: boolean
          status?: string
          student_name?: string | null
          subtasks?: Json | null
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_funding_source_id_fkey"
            columns: ["funding_source_id"]
            isOneToOne: false
            referencedRelation: "funding_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_frequency: string
          email_notifications: boolean
          funding_alerts: boolean
          id: string
          low_supply_alerts: boolean
          meeting_alerts: boolean
          reminder_time: string
          task_reminders: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_frequency?: string
          email_notifications?: boolean
          funding_alerts?: boolean
          id?: string
          low_supply_alerts?: boolean
          meeting_alerts?: boolean
          reminder_time?: string
          task_reminders?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_frequency?: string
          email_notifications?: boolean
          funding_alerts?: boolean
          id?: string
          low_supply_alerts?: boolean
          meeting_alerts?: boolean
          reminder_time?: string
          task_reminders?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          author: string | null
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          metadata: Json | null
          priority: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          author?: string | null
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          priority?: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          author?: string | null
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          priority?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      outlook_integration: {
        Row: {
          access_token_encrypted: string | null
          auto_sync_enabled: boolean | null
          created_at: string
          id: string
          is_connected: boolean | null
          last_auto_sync: string | null
          last_sync: string | null
          refresh_token_encrypted: string | null
          sync_frequency: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          auto_sync_enabled?: boolean | null
          created_at?: string
          id?: string
          is_connected?: boolean | null
          last_auto_sync?: string | null
          last_sync?: string | null
          refresh_token_encrypted?: string | null
          sync_frequency?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          auto_sync_enabled?: boolean | null
          created_at?: string
          id?: string
          is_connected?: boolean | null
          last_auto_sync?: string | null
          last_sync?: string | null
          refresh_token_encrypted?: string | null
          sync_frequency?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      planning_events: {
        Row: {
          completed: boolean | null
          course: string | null
          created_at: string | null
          date: string
          description: string | null
          end_time: string | null
          external_id: string | null
          external_source: string | null
          id: string
          is_synced: boolean | null
          last_outlook_sync: string | null
          location: string | null
          outlook_id: string | null
          priority: string | null
          synced_from_outlook: boolean | null
          synced_to_outlook: boolean | null
          time: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          course?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          end_time?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          is_synced?: boolean | null
          last_outlook_sync?: string | null
          location?: string | null
          outlook_id?: string | null
          priority?: string | null
          synced_from_outlook?: boolean | null
          synced_to_outlook?: boolean | null
          time?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          course?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          end_time?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          is_synced?: boolean | null
          last_outlook_sync?: string | null
          location?: string | null
          outlook_id?: string | null
          priority?: string | null
          synced_from_outlook?: boolean | null
          synced_to_outlook?: boolean | null
          time?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          department: string | null
          display_name: string | null
          email: string | null
          first_name: string | null
          id: string
          last_login_at: string | null
          last_login_ip: unknown
          last_login_location: Json | null
          last_name: string | null
          notification_preferences: Json | null
          office_location: string | null
          orcid_id: string | null
          phone: string | null
          position: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_login_at?: string | null
          last_login_ip?: unknown
          last_login_location?: Json | null
          last_name?: string | null
          notification_preferences?: Json | null
          office_location?: string | null
          orcid_id?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_login_at?: string | null
          last_login_ip?: unknown
          last_login_location?: Json | null
          last_name?: string | null
          notification_preferences?: Json | null
          office_location?: string | null
          orcid_id?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scholastic_achievements: {
        Row: {
          award_type: string | null
          category: string
          co_authors: string[] | null
          course_code: string | null
          created_at: string
          date: string | null
          description: string | null
          evaluation_score: number | null
          id: string
          impact_factor: number | null
          journal_name: string | null
          organization: string | null
          review_count: number | null
          status: string
          student_count: number | null
          student_level: string | null
          student_name: string | null
          tags: string[] | null
          term: string | null
          title: string
          updated_at: string
          url: string | null
          user_id: string
          venue: string | null
          visibility: string
        }
        Insert: {
          award_type?: string | null
          category: string
          co_authors?: string[] | null
          course_code?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          evaluation_score?: number | null
          id?: string
          impact_factor?: number | null
          journal_name?: string | null
          organization?: string | null
          review_count?: number | null
          status?: string
          student_count?: number | null
          student_level?: string | null
          student_name?: string | null
          tags?: string[] | null
          term?: string | null
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
          venue?: string | null
          visibility?: string
        }
        Update: {
          award_type?: string | null
          category?: string
          co_authors?: string[] | null
          course_code?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          evaluation_score?: number | null
          id?: string
          impact_factor?: number | null
          journal_name?: string | null
          organization?: string | null
          review_count?: number | null
          status?: string
          student_count?: number | null
          student_level?: string | null
          student_name?: string | null
          tags?: string[] | null
          term?: string | null
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
          venue?: string | null
          visibility?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          details: Json | null
          id: string
          ip_address: unknown
          record_id: string | null
          table_name: string | null
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          record_id?: string | null
          table_name?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          record_id?: string | null
          table_name?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      shopping_list: {
        Row: {
          created_at: string | null
          id: string
          name: string
          notes: string | null
          priority: string
          purchased: boolean
          quantity: number
          supply_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          priority: string
          purchased?: boolean
          quantity?: number
          supply_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          priority?: string
          purchased?: boolean
          quantity?: number
          supply_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "supplies"
            referencedColumns: ["id"]
          },
        ]
      }
      supplies: {
        Row: {
          category: string
          cost: number | null
          course: string
          current_count: number
          id: string
          last_restocked: string | null
          name: string
          threshold: number
          total_count: number
          user_id: string
        }
        Insert: {
          category: string
          cost?: number | null
          course: string
          current_count: number
          id?: string
          last_restocked?: string | null
          name: string
          threshold: number
          total_count: number
          user_id: string
        }
        Update: {
          category?: string
          cost?: number | null
          course?: string
          current_count?: number
          id?: string
          last_restocked?: string | null
          name?: string
          threshold?: number
          total_count?: number
          user_id?: string
        }
        Relationships: []
      }
      test_automation_configs: {
        Row: {
          config_data: Json | null
          created_at: string
          framework: string
          id: string
          is_active: boolean
          last_execution: string | null
          script_path: string | null
          test_case_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config_data?: Json | null
          created_at?: string
          framework: string
          id?: string
          is_active?: boolean
          last_execution?: string | null
          script_path?: string | null
          test_case_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config_data?: Json | null
          created_at?: string
          framework?: string
          id?: string
          is_active?: boolean
          last_execution?: string | null
          script_path?: string | null
          test_case_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_automation_configs_test_case_id_fkey"
            columns: ["test_case_id"]
            isOneToOne: false
            referencedRelation: "test_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      test_case_requirements: {
        Row: {
          created_at: string
          id: string
          requirement_id: string
          test_case_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          requirement_id: string
          test_case_id: string
        }
        Update: {
          created_at?: string
          id?: string
          requirement_id?: string
          test_case_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_case_requirements_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "test_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_case_requirements_test_case_id_fkey"
            columns: ["test_case_id"]
            isOneToOne: false
            referencedRelation: "test_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      test_cases: {
        Row: {
          created_at: string
          description: string | null
          estimated_time: number | null
          expected_result: string | null
          id: string
          preconditions: string | null
          priority: string
          status: string
          suite_id: string
          tags: string[] | null
          test_steps: Json
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          estimated_time?: number | null
          expected_result?: string | null
          id?: string
          preconditions?: string | null
          priority?: string
          status?: string
          suite_id: string
          tags?: string[] | null
          test_steps?: Json
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          estimated_time?: number | null
          expected_result?: string | null
          id?: string
          preconditions?: string | null
          priority?: string
          status?: string
          suite_id?: string
          tags?: string[] | null
          test_steps?: Json
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_cases_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      test_defects: {
        Row: {
          assignee_id: string | null
          created_at: string
          description: string
          environment: string | null
          execution_id: string
          external_id: string | null
          external_url: string | null
          id: string
          priority: string
          severity: string
          status: string
          steps_to_reproduce: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          description: string
          environment?: string | null
          execution_id: string
          external_id?: string | null
          external_url?: string | null
          id?: string
          priority?: string
          severity?: string
          status?: string
          steps_to_reproduce?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          description?: string
          environment?: string | null
          execution_id?: string
          external_id?: string | null
          external_url?: string | null
          id?: string
          priority?: string
          severity?: string
          status?: string
          steps_to_reproduce?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_defects_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "test_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      test_executions: {
        Row: {
          actual_result: string | null
          attachments: Json | null
          browser: string | null
          build_version: string | null
          created_at: string
          environment: string | null
          execution_date: string
          execution_time: number | null
          id: string
          notes: string | null
          status: string
          test_case_id: string
          user_id: string
        }
        Insert: {
          actual_result?: string | null
          attachments?: Json | null
          browser?: string | null
          build_version?: string | null
          created_at?: string
          environment?: string | null
          execution_date?: string
          execution_time?: number | null
          id?: string
          notes?: string | null
          status?: string
          test_case_id: string
          user_id: string
        }
        Update: {
          actual_result?: string | null
          attachments?: Json | null
          browser?: string | null
          build_version?: string | null
          created_at?: string
          environment?: string | null
          execution_date?: string
          execution_time?: number | null
          id?: string
          notes?: string | null
          status?: string
          test_case_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_executions_test_case_id_fkey"
            columns: ["test_case_id"]
            isOneToOne: false
            referencedRelation: "test_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      test_projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      test_requirements: {
        Row: {
          created_at: string
          description: string | null
          external_id: string | null
          id: string
          priority: string
          project_id: string
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          priority?: string
          project_id: string
          status?: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          priority?: string
          project_id?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_requirements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "test_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      test_suites: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          project_id: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          project_id: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_suites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "test_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      test_team_members: {
        Row: {
          created_at: string
          id: string
          permissions: Json | null
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permissions?: Json | null
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permissions?: Json | null
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_team_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "test_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_agreements: {
        Row: {
          agreed_at: string
          agreement_type: string
          created_at: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string
          version: string
        }
        Insert: {
          agreed_at?: string
          agreement_type: string
          created_at?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id: string
          version?: string
        }
        Update: {
          agreed_at?: string
          agreement_type?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          notes: string | null
          started_at: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_login_attempts: { Args: { user_email: string }; Returns: Json }
      check_rate_limit: {
        Args: {
          action_type: string
          max_requests?: number
          user_id: string
          window_minutes?: number
        }
        Returns: boolean
      }
      current_user_has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      get_current_user_id: { Args: never; Returns: string }
      get_extension_security_info: {
        Args: never
        Returns: {
          extension_name: string
          recommendation: string
          schema_name: string
          security_status: string
        }[]
      }
      get_user_project_role: {
        Args: { project_id: string; user_id: string }
        Returns: string
      }
      get_user_role: {
        Args: { _user_id?: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_authenticated_recently: {
        Args: { minutes_threshold?: number }
        Returns: boolean
      }
      is_profile_access_authorized: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      is_profile_owner: { Args: { profile_user_id: string }; Returns: boolean }
      is_project_member: {
        Args: { project_id: string; user_id: string }
        Returns: boolean
      }
      is_project_owner_or_admin: {
        Args: { project_id: string; user_id: string }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          action_type: string
          details?: Json
          record_id?: string
          table_name?: string
        }
        Returns: undefined
      }
      log_sensitive_data_access: {
        Args: { operation: string; record_count?: number; table_name: string }
        Returns: undefined
      }
      prevent_anonymous_access: { Args: never; Returns: boolean }
      seed_demo_data: { Args: { target_user_id: string }; Returns: undefined }
      validate_password_strength: { Args: { password: string }; Returns: Json }
      validate_profile_access: { Args: never; Returns: boolean }
      validate_security_configuration: { Args: never; Returns: Json }
      validate_sensitive_operation: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "system_admin" | "primary_user" | "secondary_user"
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
      app_role: ["system_admin", "primary_user", "secondary_user"],
    },
  },
} as const
