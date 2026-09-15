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
  iapp: {
    Tables: {
      ai_analysis: {
        Row: {
          attempt: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          error_code: string | null
          error_message: string | null
          eye: Database["iapp"]["Enums"]["eye_side"] | null
          finished_at: string | null
          id: string
          image_id: string
          latency_ms: number | null
          modality: string
          model: string | null
          parent_id: string | null
          patient_id: string
          prompt_version: string
          provider: string
          raw_response: Json | null
          request_meta: Json | null
          started_at: string
          status: Database["iapp"]["Enums"]["ai_run_status"]
          tokens_in: number | null
          tokens_out: number | null
          visit_id: string | null
        }
        Insert: {
          attempt?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          error_code?: string | null
          error_message?: string | null
          eye?: Database["iapp"]["Enums"]["eye_side"] | null
          finished_at?: string | null
          id?: string
          image_id: string
          latency_ms?: number | null
          modality: string
          model?: string | null
          parent_id?: string | null
          patient_id: string
          prompt_version?: string
          provider?: string
          raw_response?: Json | null
          request_meta?: Json | null
          started_at?: string
          status?: Database["iapp"]["Enums"]["ai_run_status"]
          tokens_in?: number | null
          tokens_out?: number | null
          visit_id?: string | null
        }
        Update: {
          attempt?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          error_code?: string | null
          error_message?: string | null
          eye?: Database["iapp"]["Enums"]["eye_side"] | null
          finished_at?: string | null
          id?: string
          image_id?: string
          latency_ms?: number | null
          modality?: string
          model?: string | null
          parent_id?: string | null
          patient_id?: string
          prompt_version?: string
          provider?: string
          raw_response?: Json | null
          request_meta?: Json | null
          started_at?: string
          status?: Database["iapp"]["Enums"]["ai_run_status"]
          tokens_in?: number | null
          tokens_out?: number | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_analysis_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "medical_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "ai_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_ai_latest"
            referencedColumns: ["analysis_id"]
          },
          {
            foreignKeyName: "ai_analysis_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_active_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_my_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_active_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_my_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_finding_catalog: {
        Row: {
          category: string
          is_active: boolean
          label_ar: string
          label_en: string
          modality: string
          seq: number
          unit: string | null
          value_kind: string
        }
        Insert: {
          category: string
          is_active?: boolean
          label_ar: string
          label_en: string
          modality: string
          seq?: number
          unit?: string | null
          value_kind?: string
        }
        Update: {
          category?: string
          is_active?: boolean
          label_ar?: string
          label_en?: string
          modality?: string
          seq?: number
          unit?: string | null
          value_kind?: string
        }
        Relationships: []
      }
      ai_findings: {
        Row: {
          analysis_id: string
          category: string
          confidence: number | null
          created_at: string
          detail: string | null
          eye: Database["iapp"]["Enums"]["eye_side"] | null
          id: string
          modality: string
          patient_id: string
          present: boolean | null
          seq: number
          severity: Database["iapp"]["Enums"]["ai_severity"]
          unit: string | null
          value_num: number | null
          value_text: string | null
        }
        Insert: {
          analysis_id: string
          category: string
          confidence?: number | null
          created_at?: string
          detail?: string | null
          eye?: Database["iapp"]["Enums"]["eye_side"] | null
          id?: string
          modality: string
          patient_id: string
          present?: boolean | null
          seq?: number
          severity?: Database["iapp"]["Enums"]["ai_severity"]
          unit?: string | null
          value_num?: number | null
          value_text?: string | null
        }
        Update: {
          analysis_id?: string
          category?: string
          confidence?: number | null
          created_at?: string
          detail?: string | null
          eye?: Database["iapp"]["Enums"]["eye_side"] | null
          id?: string
          modality?: string
          patient_id?: string
          present?: boolean | null
          seq?: number
          severity?: Database["iapp"]["Enums"]["ai_severity"]
          unit?: string | null
          value_num?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_findings_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "ai_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_findings_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "v_ai_latest"
            referencedColumns: ["analysis_id"]
          },
          {
            foreignKeyName: "ai_findings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_findings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_active_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_findings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_my_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_findings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_find_catalog"
            columns: ["modality", "category"]
            isOneToOne: false
            referencedRelation: "ai_finding_catalog"
            referencedColumns: ["modality", "category"]
          },
        ]
      }
      ai_impression: {
        Row: {
          analysis_id: string
          confidence: number | null
          created_at: string
          differentials: Json | null
          id: string
          impression_text: string
          is_final: boolean | null
          limitations: string | null
          patient_id: string
          recommendations: string | null
          urgency: Database["iapp"]["Enums"]["ai_urgency"]
        }
        Insert: {
          analysis_id: string
          confidence?: number | null
          created_at?: string
          differentials?: Json | null
          id?: string
          impression_text: string
          is_final?: boolean | null
          limitations?: string | null
          patient_id: string
          recommendations?: string | null
          urgency?: Database["iapp"]["Enums"]["ai_urgency"]
        }
        Update: {
          analysis_id?: string
          confidence?: number | null
          created_at?: string
          differentials?: Json | null
          id?: string
          impression_text?: string
          is_final?: boolean | null
          limitations?: string | null
          patient_id?: string
          recommendations?: string | null
          urgency?: Database["iapp"]["Enums"]["ai_urgency"]
        }
        Relationships: [
          {
            foreignKeyName: "ai_impression_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: true
            referencedRelation: "ai_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_impression_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: true
            referencedRelation: "v_ai_latest"
            referencedColumns: ["analysis_id"]
          },
          {
            foreignKeyName: "ai_impression_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_impression_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_active_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_impression_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_my_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_impression_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_status_history: {
        Row: {
          actor_id: string | null
          actor_role: string | null
          appointment_id: string
          from_status: Database["iapp"]["Enums"]["appointment_status"] | null
          id: number
          occurred_at: string
          reason: string | null
          to_status: Database["iapp"]["Enums"]["appointment_status"]
        }
        Insert: {
          actor_id?: string | null
          actor_role?: string | null
          appointment_id: string
          from_status?: Database["iapp"]["Enums"]["appointment_status"] | null
          id?: number
          occurred_at?: string
          reason?: string | null
          to_status: Database["iapp"]["Enums"]["appointment_status"]
        }
        Update: {
          actor_id?: string | null
          actor_role?: string | null
          appointment_id?: string
          from_status?: Database["iapp"]["Enums"]["appointment_status"] | null
          id?: number
          occurred_at?: string
          reason?: string | null
          to_status?: Database["iapp"]["Enums"]["appointment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "appointment_status_history_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_status_history_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "v_appointment_board"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_transitions: {
        Row: {
          allowed_roles: string[]
          description: string | null
          from_status: Database["iapp"]["Enums"]["appointment_status"]
          requires_reason: boolean
          sets_timestamp: string | null
          to_status: Database["iapp"]["Enums"]["appointment_status"]
        }
        Insert: {
          allowed_roles: string[]
          description?: string | null
          from_status: Database["iapp"]["Enums"]["appointment_status"]
          requires_reason?: boolean
          sets_timestamp?: string | null
          to_status: Database["iapp"]["Enums"]["appointment_status"]
        }
        Update: {
          allowed_roles?: string[]
          description?: string | null
          from_status?: Database["iapp"]["Enums"]["appointment_status"]
          requires_reason?: boolean
          sets_timestamp?: string | null
          to_status?: Database["iapp"]["Enums"]["appointment_status"]
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_type: string | null
          arrived_at: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          clinic_id: string
          completed_at: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          doctor_id: string | null
          duration_minutes: number
          guest_name: string | null
          guest_phone: string | null
          id: string
          in_clinic_at: string | null
          legacy_id: string | null
          no_show_at: string | null
          notes: string | null
          patient_id: string | null
          requested_at: string | null
          reschedule_count: number
          rescheduled_from: string | null
          room: string | null
          scheduled_date: string
          scheduled_time: string
          slot: unknown
          source: Database["iapp"]["Enums"]["appointment_source"]
          status: Database["iapp"]["Enums"]["appointment_status"]
          updated_at: string
          updated_by: string | null
          visit_id: string | null
          waiting_at: string | null
        }
        Insert: {
          appointment_type?: string | null
          arrived_at?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          clinic_id: string
          completed_at?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          doctor_id?: string | null
          duration_minutes?: number
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          in_clinic_at?: string | null
          legacy_id?: string | null
          no_show_at?: string | null
          notes?: string | null
          patient_id?: string | null
          requested_at?: string | null
          reschedule_count?: number
          rescheduled_from?: string | null
          room?: string | null
          scheduled_date: string
          scheduled_time: string
          slot?: unknown
          source?: Database["iapp"]["Enums"]["appointment_source"]
          status?: Database["iapp"]["Enums"]["appointment_status"]
          updated_at?: string
          updated_by?: string | null
          visit_id?: string | null
          waiting_at?: string | null
        }
        Update: {
          appointment_type?: string | null
          arrived_at?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          clinic_id?: string
          completed_at?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          doctor_id?: string | null
          duration_minutes?: number
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          in_clinic_at?: string | null
          legacy_id?: string | null
          no_show_at?: string | null
          notes?: string | null
          patient_id?: string | null
          requested_at?: string | null
          reschedule_count?: number
          rescheduled_from?: string | null
          room?: string | null
          scheduled_date?: string
          scheduled_time?: string
          slot?: unknown
          source?: Database["iapp"]["Enums"]["appointment_source"]
          status?: Database["iapp"]["Enums"]["appointment_status"]
          updated_at?: string
          updated_by?: string | null
          visit_id?: string | null
          waiting_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_active_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_my_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_rescheduled_from_fkey"
            columns: ["rescheduled_from"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_rescheduled_from_fkey"
            columns: ["rescheduled_from"]
            isOneToOne: false
            referencedRelation: "v_appointment_board"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "v_active_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "v_my_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          after_data: Json | null
          before_data: Json | null
          id: number
          ip: unknown
          occurred_at: string
          outcome: string
          patient_id: string | null
          reason: string | null
          record_id: string | null
          request_id: string | null
          resource: string
          row_count: number | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          after_data?: Json | null
          before_data?: Json | null
          id?: number
          ip?: unknown
          occurred_at?: string
          outcome: string
          patient_id?: string | null
          reason?: string | null
          record_id?: string | null
          request_id?: string | null
          resource: string
          row_count?: number | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          after_data?: Json | null
          before_data?: Json | null
          id?: number
          ip?: unknown
          occurred_at?: string
          outcome?: string
          patient_id?: string | null
          reason?: string | null
          record_id?: string | null
          request_id?: string | null
          resource?: string
          row_count?: number | null
          user_agent?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_08: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          after_data: Json | null
          before_data: Json | null
          id: number
          ip: unknown
          occurred_at: string
          outcome: string
          patient_id: string | null
          reason: string | null
          record_id: string | null
          request_id: string | null
          resource: string
          row_count: number | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          after_data?: Json | null
          before_data?: Json | null
          id?: number
          ip?: unknown
          occurred_at?: string
          outcome: string
          patient_id?: string | null
          reason?: string | null
          record_id?: string | null
          request_id?: string | null
          resource: string
          row_count?: number | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          after_data?: Json | null
          before_data?: Json | null
          id?: number
          ip?: unknown
          occurred_at?: string
          outcome?: string
          patient_id?: string | null
          reason?: string | null
          record_id?: string | null
          request_id?: string | null
          resource?: string
          row_count?: number | null
          user_agent?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_09: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          after_data: Json | null
          before_data: Json | null
          id: number
          ip: unknown
          occurred_at: string
          outcome: string
          patient_id: string | null
          reason: string | null
          record_id: string | null
          request_id: string | null
          resource: string
          row_count: number | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          after_data?: Json | null
          before_data?: Json | null
          id?: number
          ip?: unknown
          occurred_at?: string
          outcome: string
          patient_id?: string | null
          reason?: string | null
          record_id?: string | null
          request_id?: string | null
          resource: string
          row_count?: number | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          after_data?: Json | null
          before_data?: Json | null
          id?: number
          ip?: unknown
          occurred_at?: string
          outcome?: string
          patient_id?: string | null
          reason?: string | null
          record_id?: string | null
          request_id?: string | null
          resource?: string
          row_count?: number | null
          user_agent?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_10: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          after_data: Json | null
          before_data: Json | null
          id: number
          ip: unknown
          occurred_at: string
          outcome: string
          patient_id: string | null
          reason: string | null
          record_id: string | null
          request_id: string | null
          resource: string
          row_count: number | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          after_data?: Json | null
          before_data?: Json | null
          id?: number
          ip?: unknown
          occurred_at?: string
          outcome: string
          patient_id?: string | null
          reason?: string | null
          record_id?: string | null
          request_id?: string | null
          resource: string
          row_count?: number | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          after_data?: Json | null
          before_data?: Json | null
          id?: number
          ip?: unknown
          occurred_at?: string
          outcome?: string
          patient_id?: string | null
          reason?: string | null
          record_id?: string | null
          request_id?: string | null
          resource?: string
          row_count?: number | null
          user_agent?: string | null
        }
        Relationships: []
      }
      audit_logs_default: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          after_data: Json | null
          before_data: Json | null
          id: number
          ip: unknown
          occurred_at: string
          outcome: string
          patient_id: string | null
          reason: string | null
          record_id: string | null
          request_id: string | null
          resource: string
          row_count: number | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          after_data?: Json | null
          before_data?: Json | null
          id?: number
          ip?: unknown
          occurred_at?: string
          outcome: string
          patient_id?: string | null
          reason?: string | null
          record_id?: string | null
          request_id?: string | null
          resource: string
          row_count?: number | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          after_data?: Json | null
          before_data?: Json | null
          id?: number
          ip?: unknown
          occurred_at?: string
          outcome?: string
          patient_id?: string | null
          reason?: string | null
          record_id?: string | null
          request_id?: string | null
          resource?: string
          row_count?: number | null
          user_agent?: string | null
        }
        Relationships: []
      }
      clinic_schedules: {
        Row: {
          clinic_id: string
          created_at: string
          created_by: string | null
          day_of_week: number
          doctor_id: string | null
          end_time: string
          id: string
          is_active: boolean
          slot_minutes: number | null
          start_time: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          created_by?: string | null
          day_of_week: number
          doctor_id?: string | null
          end_time: string
          id?: string
          is_active?: boolean
          slot_minutes?: number | null
          start_time: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          day_of_week?: number
          doctor_id?: string | null
          end_time?: string
          id?: string
          is_active?: boolean
          slot_minutes?: number | null
          start_time?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_schedules_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_schedule_doctor"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          code: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          icon: string | null
          id: string
          is_active: boolean
          name_ar: string
          name_en: string | null
          notes: string | null
          phone: string | null
          slot_minutes: number
          timezone: string
          updated_at: string
          updated_by: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name_ar: string
          name_en?: string | null
          notes?: string | null
          phone?: string | null
          slot_minutes?: number
          timezone?: string
          updated_at?: string
          updated_by?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string | null
          notes?: string | null
          phone?: string | null
          slot_minutes?: number
          timezone?: string
          updated_at?: string
          updated_by?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      diagnoses: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          diagnosed_on: string
          diagnosis_text: string
          doctor_id: string | null
          examination_id: string | null
          eye: Database["iapp"]["Enums"]["eye_side"] | null
          icd10_code: string | null
          id: string
          is_primary: boolean
          legacy_id: string | null
          patient_id: string
          resolved_on: string | null
          status: Database["iapp"]["Enums"]["diagnosis_status"]
          updated_at: string
          updated_by: string | null
          visit_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          diagnosed_on?: string
          diagnosis_text: string
          doctor_id?: string | null
          examination_id?: string | null
          eye?: Database["iapp"]["Enums"]["eye_side"] | null
          icd10_code?: string | null
          id?: string
          is_primary?: boolean
          legacy_id?: string | null
          patient_id: string
          resolved_on?: string | null
          status?: Database["iapp"]["Enums"]["diagnosis_status"]
          updated_at?: string
          updated_by?: string | null
          visit_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          diagnosed_on?: string
          diagnosis_text?: string
          doctor_id?: string | null
          examination_id?: string | null
          eye?: Database["iapp"]["Enums"]["eye_side"] | null
          icd10_code?: string | null
          id?: string
          is_primary?: boolean
          legacy_id?: string | null
          patient_id?: string
          resolved_on?: string | null
          status?: Database["iapp"]["Enums"]["diagnosis_status"]
          updated_at?: string
          updated_by?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnoses_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnoses_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "examinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnoses_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "v_exam_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnoses_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "v_my_examinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnoses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnoses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_active_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnoses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_my_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnoses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnoses_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_active_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnoses_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_my_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnoses_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_review: {
        Row: {
          action: Database["iapp"]["Enums"]["ai_review_action"]
          analysis_id: string
          comment: string | null
          created_at: string
          edited_findings: Json | null
          edited_impression: string | null
          id: string
          image_id: string
          patient_id: string
          reject_reason: string | null
          reviewed_at: string
          reviewer_id: string
          superseded_at: string | null
        }
        Insert: {
          action: Database["iapp"]["Enums"]["ai_review_action"]
          analysis_id: string
          comment?: string | null
          created_at?: string
          edited_findings?: Json | null
          edited_impression?: string | null
          id?: string
          image_id: string
          patient_id: string
          reject_reason?: string | null
          reviewed_at?: string
          reviewer_id?: string
          superseded_at?: string | null
        }
        Update: {
          action?: Database["iapp"]["Enums"]["ai_review_action"]
          analysis_id?: string
          comment?: string | null
          created_at?: string
          edited_findings?: Json | null
          edited_impression?: string | null
          id?: string
          image_id?: string
          patient_id?: string
          reject_reason?: string | null
          reviewed_at?: string
          reviewer_id?: string
          superseded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_review_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "ai_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_review_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "v_ai_latest"
            referencedColumns: ["analysis_id"]
          },
          {
            foreignKeyName: "doctor_review_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "medical_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_review_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_review_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_active_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_review_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_my_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_review_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          email: string | null
          full_name_ar: string
          full_name_en: string | null
          id: string
          initial: string | null
          is_active: boolean
          is_primary: boolean
          legacy_id: string | null
          license_no: string | null
          phone: string | null
          profile_id: string | null
          short_name: string | null
          specialty: string | null
          title_ar: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          full_name_ar: string
          full_name_en?: string | null
          id?: string
          initial?: string | null
          is_active?: boolean
          is_primary?: boolean
          legacy_id?: string | null
          license_no?: string | null
          phone?: string | null
          profile_id?: string | null
          short_name?: string | null
          specialty?: string | null
          title_ar?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          full_name_ar?: string
          full_name_en?: string | null
          id?: string
          initial?: string | null
          is_active?: boolean
          is_primary?: boolean
          legacy_id?: string | null
          license_no?: string | null
          phone?: string | null
          profile_id?: string | null
          short_name?: string | null
          specialty?: string | null
          title_ar?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      exam_findings: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          examination_id: string
          eye: Database["iapp"]["Enums"]["eye_side"]
          field: string
          id: string
          is_normal: boolean | null
          patient_id: string
          section: string
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          examination_id: string
          eye: Database["iapp"]["Enums"]["eye_side"]
          field: string
          id?: string
          is_normal?: boolean | null
          patient_id: string
          section: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          examination_id?: string
          eye?: Database["iapp"]["Enums"]["eye_side"]
          field?: string
          id?: string
          is_normal?: boolean | null
          patient_id?: string
          section?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_findings_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "examinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_findings_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "v_exam_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_findings_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "v_my_examinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_findings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_findings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_active_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_findings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_my_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_findings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical"
            referencedColumns: ["id"]
          },
        ]
      }
      examinations: {
        Row: {
          anterior_segment: string | null
          anterior_segment_left: string | null
          anterior_segment_right: string | null
          chief_complaint: string | null
          color_vision: string | null
          contrast_sensitivity: string | null
          cover_test: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          doctor_id: string | null
          exam_date: string
          id: string
          legacy_id: string | null
          notes: string | null
          patient_id: string
          posterior_segment: string | null
          posterior_segment_left: string | null
          posterior_segment_right: string | null
          treatment_plan: string | null
          updated_at: string
          updated_by: string | null
          va_left: string | null
          va_left_corrected: string | null
          va_left_ph: string | null
          va_right: string | null
          va_right_corrected: string | null
          va_right_ph: string | null
          visit_id: string | null
        }
        Insert: {
          anterior_segment?: string | null
          anterior_segment_left?: string | null
          anterior_segment_right?: string | null
          chief_complaint?: string | null
          color_vision?: string | null
          contrast_sensitivity?: string | null
          cover_test?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          doctor_id?: string | null
          exam_date: string
          id?: string
          legacy_id?: string | null
          notes?: string | null
          patient_id: string
          posterior_segment?: string | null
          posterior_segment_left?: string | null
          posterior_segment_right?: string | null
          treatment_plan?: string | null
          updated_at?: string
          updated_by?: string | null
          va_left?: string | null
          va_left_corrected?: string | null
          va_left_ph?: string | null
          va_right?: string | null
          va_right_corrected?: string | null
          va_right_ph?: string | null
          visit_id?: string | null
        }
        Update: {
          anterior_segment?: string | null
          anterior_segment_left?: string | null
          anterior_segment_right?: string | null
          chief_complaint?: string | null
          color_vision?: string | null
          contrast_sensitivity?: string | null
          cover_test?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          doctor_id?: string | null
          exam_date?: string
          id?: string
          legacy_id?: string | null
          notes?: string | null
          patient_id?: string
          posterior_segment?: string | null
          posterior_segment_left?: string | null
          posterior_segment_right?: string | null
          treatment_plan?: string | null
          updated_at?: string
          updated_by?: string | null
          va_left?: string | null
          va_left_corrected?: string | null
          va_left_ph?: string | null
          va_right?: string | null
          va_right_corrected?: string | null
          va_right_ph?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "examinations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "examinations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "examinations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_active_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "examinations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_my_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "examinations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "examinations_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_active_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "examinations_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_my_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "examinations_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      final_report: {
        Row: {
          ai_analysis_id: string | null
          ai_assisted: boolean
          authored_by: string
          created_at: string
          deleted_at: string | null
          finalized_at: string | null
          findings: Json | null
          id: string
          image_id: string
          impression: string | null
          patient_id: string
          report_text: string
          source: Database["iapp"]["Enums"]["report_source"]
          status: Database["iapp"]["Enums"]["report_state"]
          updated_at: string
          updated_by: string | null
          visit_id: string | null
        }
        Insert: {
          ai_analysis_id?: string | null
          ai_assisted?: boolean
          authored_by?: string
          created_at?: string
          deleted_at?: string | null
          finalized_at?: string | null
          findings?: Json | null
          id?: string
          image_id: string
          impression?: string | null
          patient_id: string
          report_text: string
          source?: Database["iapp"]["Enums"]["report_source"]
          status?: Database["iapp"]["Enums"]["report_state"]
          updated_at?: string
          updated_by?: string | null
          visit_id?: string | null
        }
        Update: {
          ai_analysis_id?: string | null
          ai_assisted?: boolean
          authored_by?: string
          created_at?: string
          deleted_at?: string | null
          finalized_at?: string | null
          findings?: Json | null
          id?: string
          image_id?: string
          impression?: string | null
          patient_id?: string
          report_text?: string
          source?: Database["iapp"]["Enums"]["report_source"]
          status?: Database["iapp"]["Enums"]["report_state"]
          updated_at?: string
          updated_by?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "final_report_ai_analysis_id_fkey"
            columns: ["ai_analysis_id"]
            isOneToOne: false
            referencedRelation: "ai_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_report_ai_analysis_id_fkey"
            columns: ["ai_analysis_id"]
            isOneToOne: false
            referencedRelation: "v_ai_latest"
            referencedColumns: ["analysis_id"]
          },
          {
            foreignKeyName: "final_report_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "medical_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_report_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_report_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_active_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_report_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_my_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_report_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_report_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_active_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_report_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_my_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_report_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          clinic_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          doctor_id: string | null
          due_date: string
          examination_id: string | null
          id: string
          legacy_id: string | null
          notes: string | null
          notified_at: string | null
          patient_id: string
          reason: string | null
          resulting_appointment_id: string | null
          status: Database["iapp"]["Enums"]["follow_up_status"]
          updated_at: string
          updated_by: string | null
          visit_id: string | null
        }
        Insert: {
          clinic_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          doctor_id?: string | null
          due_date: string
          examination_id?: string | null
          id?: string
          legacy_id?: string | null
          notes?: string | null
          notified_at?: string | null
          patient_id: string
          reason?: string | null
          resulting_appointment_id?: string | null
          status?: Database["iapp"]["Enums"]["follow_up_status"]
          updated_at?: string
          updated_by?: string | null
          visit_id?: string | null
        }
        Update: {
          clinic_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          doctor_id?: string | null
          due_date?: string
          examination_id?: string | null
          id?: string
          legacy_id?: string | null
          notes?: string | null
          notified_at?: string | null
          patient_id?: string
          reason?: string | null
          resulting_appointment_id?: string | null
          status?: Database["iapp"]["Enums"]["follow_up_status"]
          updated_at?: string
          updated_by?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "examinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "v_exam_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "v_my_examinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_active_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_my_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_active_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_my_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      image_reports: {
        Row: {
          confidence: number | null
          consent_recorded: boolean
          created_at: string
          created_by: string | null
          deleted_at: string | null
          findings: Json | null
          id: string
          image_id: string
          is_approved: boolean
          model_name: string | null
          patient_id: string
          report_text: string
          reviewed_at: string | null
          reviewed_by: string | null
          source: Database["iapp"]["Enums"]["report_source"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          confidence?: number | null
          consent_recorded?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          findings?: Json | null
          id?: string
          image_id: string
          is_approved?: boolean
          model_name?: string | null
          patient_id: string
          report_text: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: Database["iapp"]["Enums"]["report_source"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          confidence?: number | null
          consent_recorded?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          findings?: Json | null
          id?: string
          image_id?: string
          is_approved?: boolean
          model_name?: string | null
          patient_id?: string
          report_text?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: Database["iapp"]["Enums"]["report_source"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "image_reports_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "medical_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_active_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_my_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      imaging_order_items: {
        Row: {
          created_at: string
          done: boolean
          eye: Database["iapp"]["Enums"]["eye_side"]
          id: string
          image_id: string | null
          modality: Database["iapp"]["Enums"]["image_modality"]
          notes: string | null
          order_id: string
          seq: number
        }
        Insert: {
          created_at?: string
          done?: boolean
          eye: Database["iapp"]["Enums"]["eye_side"]
          id?: string
          image_id?: string | null
          modality: Database["iapp"]["Enums"]["image_modality"]
          notes?: string | null
          order_id: string
          seq?: number
        }
        Update: {
          created_at?: string
          done?: boolean
          eye?: Database["iapp"]["Enums"]["eye_side"]
          id?: string
          image_id?: string | null
          modality?: Database["iapp"]["Enums"]["image_modality"]
          notes?: string | null
          order_id?: string
          seq?: number
        }
        Relationships: [
          {
            foreignKeyName: "imaging_order_items_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "medical_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "imaging_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      imaging_orders: {
        Row: {
          clinic_id: string | null
          clinical_indication: string | null
          clinical_notes: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          doctor_id: string | null
          id: string
          order_no: string | null
          ordered_on: string
          patient_id: string
          printed_at: string | null
          printed_count: number
          status: Database["iapp"]["Enums"]["imaging_order_status"]
          updated_at: string
          updated_by: string | null
          urgency: Database["iapp"]["Enums"]["order_urgency"]
          visit_id: string | null
        }
        Insert: {
          clinic_id?: string | null
          clinical_indication?: string | null
          clinical_notes?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          doctor_id?: string | null
          id?: string
          order_no?: string | null
          ordered_on?: string
          patient_id: string
          printed_at?: string | null
          printed_count?: number
          status?: Database["iapp"]["Enums"]["imaging_order_status"]
          updated_at?: string
          updated_by?: string | null
          urgency?: Database["iapp"]["Enums"]["order_urgency"]
          visit_id?: string | null
        }
        Update: {
          clinic_id?: string | null
          clinical_indication?: string | null
          clinical_notes?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          doctor_id?: string | null
          id?: string
          order_no?: string | null
          ordered_on?: string
          patient_id?: string
          printed_at?: string | null
          printed_count?: number
          status?: Database["iapp"]["Enums"]["imaging_order_status"]
          updated_at?: string
          updated_by?: string | null
          urgency?: Database["iapp"]["Enums"]["order_urgency"]
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "imaging_orders_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_orders_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_active_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_my_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_orders_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_active_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_orders_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_my_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imaging_orders_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      iop_measurements: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          examination_id: string | null
          eye: Database["iapp"]["Enums"]["eye_side"]
          id: string
          is_post_dilation: boolean
          legacy_id: string | null
          measured_at: string
          method: string | null
          notes: string | null
          patient_id: string
          updated_at: string
          updated_by: string | null
          value_mmhg: number
          visit_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          examination_id?: string | null
          eye: Database["iapp"]["Enums"]["eye_side"]
          id?: string
          is_post_dilation?: boolean
          legacy_id?: string | null
          measured_at?: string
          method?: string | null
          notes?: string | null
          patient_id: string
          updated_at?: string
          updated_by?: string | null
          value_mmhg: number
          visit_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          examination_id?: string | null
          eye?: Database["iapp"]["Enums"]["eye_side"]
          id?: string
          is_post_dilation?: boolean
          legacy_id?: string | null
          measured_at?: string
          method?: string | null
          notes?: string | null
          patient_id?: string
          updated_at?: string
          updated_by?: string | null
          value_mmhg?: number
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "iop_measurements_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "examinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iop_measurements_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "v_exam_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iop_measurements_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "v_my_examinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iop_measurements_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iop_measurements_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_active_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iop_measurements_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_my_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iop_measurements_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iop_measurements_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_active_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iop_measurements_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_my_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iop_measurements_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_images: {
        Row: {
          captured_on: string | null
          checksum: string | null
          clinical_indication: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          device: string | null
          doctor_report: string | null
          examination_id: string | null
          eye: Database["iapp"]["Enums"]["eye_side"] | null
          file_name: string | null
          height: number | null
          id: string
          legacy_id: string | null
          legacy_url: string | null
          mime_type: string | null
          modality: Database["iapp"]["Enums"]["image_modality"]
          notes: string | null
          patient_id: string
          reported_at: string | null
          reported_by: string | null
          size_bytes: number | null
          status: Database["iapp"]["Enums"]["imaging_status"]
          storage_path: string
          storage_provider: string
          study_date: string | null
          technician: string | null
          thumbnail_path: string | null
          updated_at: string
          updated_by: string | null
          visit_id: string | null
          width: number | null
        }
        Insert: {
          captured_on?: string | null
          checksum?: string | null
          clinical_indication?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          device?: string | null
          doctor_report?: string | null
          examination_id?: string | null
          eye?: Database["iapp"]["Enums"]["eye_side"] | null
          file_name?: string | null
          height?: number | null
          id?: string
          legacy_id?: string | null
          legacy_url?: string | null
          mime_type?: string | null
          modality?: Database["iapp"]["Enums"]["image_modality"]
          notes?: string | null
          patient_id: string
          reported_at?: string | null
          reported_by?: string | null
          size_bytes?: number | null
          status?: Database["iapp"]["Enums"]["imaging_status"]
          storage_path: string
          storage_provider?: string
          study_date?: string | null
          technician?: string | null
          thumbnail_path?: string | null
          updated_at?: string
          updated_by?: string | null
          visit_id?: string | null
          width?: number | null
        }
        Update: {
          captured_on?: string | null
          checksum?: string | null
          clinical_indication?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          device?: string | null
          doctor_report?: string | null
          examination_id?: string | null
          eye?: Database["iapp"]["Enums"]["eye_side"] | null
          file_name?: string | null
          height?: number | null
          id?: string
          legacy_id?: string | null
          legacy_url?: string | null
          mime_type?: string | null
          modality?: Database["iapp"]["Enums"]["image_modality"]
          notes?: string | null
          patient_id?: string
          reported_at?: string | null
          reported_by?: string | null
          size_bytes?: number | null
          status?: Database["iapp"]["Enums"]["imaging_status"]
          storage_path?: string
          storage_provider?: string
          study_date?: string | null
          technician?: string | null
          thumbnail_path?: string | null
          updated_at?: string
          updated_by?: string | null
          visit_id?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_images_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "examinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_images_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "v_exam_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_images_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "v_my_examinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_images_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_images_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_active_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_images_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_my_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_images_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_images_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_active_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_images_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_my_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_images_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          created_at: string
          created_by: string | null
          form: Database["iapp"]["Enums"]["medication_form"]
          generic_name: string | null
          id: string
          is_active: boolean
          is_custom: boolean
          name: string
          name_ar: string | null
          strength: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          form?: Database["iapp"]["Enums"]["medication_form"]
          generic_name?: string | null
          id?: string
          is_active?: boolean
          is_custom?: boolean
          name: string
          name_ar?: string | null
          strength?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          form?: Database["iapp"]["Enums"]["medication_form"]
          generic_name?: string | null
          id?: string
          is_active?: boolean
          is_custom?: boolean
          name?: string
          name_ar?: string | null
          strength?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      migration_issues: {
        Row: {
          field: string | null
          id: number
          issue: string
          raw_value: Json | null
          run_id: string | null
          severity: string
          source_id: string | null
          source_key: string | null
        }
        Insert: {
          field?: string | null
          id?: number
          issue: string
          raw_value?: Json | null
          run_id?: string | null
          severity: string
          source_id?: string | null
          source_key?: string | null
        }
        Update: {
          field?: string | null
          id?: number
          issue?: string
          raw_value?: Json | null
          run_id?: string | null
          severity?: string
          source_id?: string | null
          source_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "migration_issues_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "migration_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      migration_runs: {
        Row: {
          errors: Json | null
          finished_at: string | null
          id: string
          mode: string
          notes: string | null
          source_hash: string | null
          started_at: string
          stats: Json | null
        }
        Insert: {
          errors?: Json | null
          finished_at?: string | null
          id?: string
          mode: string
          notes?: string | null
          source_hash?: string | null
          started_at?: string
          stats?: Json | null
        }
        Update: {
          errors?: Json | null
          finished_at?: string | null
          id?: string
          mode?: string
          notes?: string | null
          source_hash?: string | null
          started_at?: string
          stats?: Json | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          channel: Database["iapp"]["Enums"]["notification_channel"]
          created_at: string
          created_by: string | null
          error: string | null
          id: string
          patient_id: string | null
          payload: Json | null
          profile_id: string | null
          read_at: string | null
          related_id: string | null
          related_resource: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: Database["iapp"]["Enums"]["notification_status"]
          title: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body: string
          channel?: Database["iapp"]["Enums"]["notification_channel"]
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          patient_id?: string | null
          payload?: Json | null
          profile_id?: string | null
          read_at?: string | null
          related_id?: string | null
          related_resource?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: Database["iapp"]["Enums"]["notification_status"]
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string
          channel?: Database["iapp"]["Enums"]["notification_channel"]
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          patient_id?: string | null
          payload?: Json | null
          profile_id?: string | null
          read_at?: string | null
          related_id?: string | null
          related_resource?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: Database["iapp"]["Enums"]["notification_status"]
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_active_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_my_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          age_at_registration: number | null
          allergies: string | null
          alt_phone: string | null
          blood_type: string | null
          city: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          deleted_at: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          gender: Database["iapp"]["Enums"]["gender"]
          id: string
          is_active: boolean
          last_visit: string | null
          legacy_id: string | null
          medical_history: string | null
          national_id: string | null
          notes: string | null
          occupation: string | null
          patient_code: string
          phone: string | null
          phone_normalized: string | null
          primary_clinic_id: string | null
          primary_condition: string | null
          triage_status: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          age_at_registration?: number | null
          allergies?: string | null
          alt_phone?: string | null
          blood_type?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name: string
          gender?: Database["iapp"]["Enums"]["gender"]
          id?: string
          is_active?: boolean
          last_visit?: string | null
          legacy_id?: string | null
          medical_history?: string | null
          national_id?: string | null
          notes?: string | null
          occupation?: string | null
          patient_code: string
          phone?: string | null
          phone_normalized?: string | null
          primary_clinic_id?: string | null
          primary_condition?: string | null
          triage_status?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          age_at_registration?: number | null
          allergies?: string | null
          alt_phone?: string | null
          blood_type?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          gender?: Database["iapp"]["Enums"]["gender"]
          id?: string
          is_active?: boolean
          last_visit?: string | null
          legacy_id?: string | null
          medical_history?: string | null
          national_id?: string | null
          notes?: string | null
          occupation?: string | null
          patient_code?: string
          phone?: string | null
          phone_normalized?: string | null
          primary_clinic_id?: string | null
          primary_condition?: string | null
          triage_status?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_primary_clinic_id_fkey"
            columns: ["primary_clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          amount_paid: number
          clinic_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          deleted_at: string | null
          discount: number
          id: string
          legacy_id: string | null
          method: Database["iapp"]["Enums"]["payment_method"] | null
          notes: string | null
          paid_at: string | null
          patient_id: string
          receipt_no: string | null
          service_id: string | null
          status: Database["iapp"]["Enums"]["payment_status"]
          updated_at: string
          updated_by: string | null
          visit_id: string | null
        }
        Insert: {
          amount: number
          amount_paid?: number
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          discount?: number
          id?: string
          legacy_id?: string | null
          method?: Database["iapp"]["Enums"]["payment_method"] | null
          notes?: string | null
          paid_at?: string | null
          patient_id: string
          receipt_no?: string | null
          service_id?: string | null
          status?: Database["iapp"]["Enums"]["payment_status"]
          updated_at?: string
          updated_by?: string | null
          visit_id?: string | null
        }
        Update: {
          amount?: number
          amount_paid?: number
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          discount?: number
          id?: string
          legacy_id?: string | null
          method?: Database["iapp"]["Enums"]["payment_method"] | null
          notes?: string | null
          paid_at?: string | null
          patient_id?: string
          receipt_no?: string | null
          service_id?: string | null
          status?: Database["iapp"]["Enums"]["payment_status"]
          updated_at?: string
          updated_by?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_active_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_my_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_active_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_my_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_items: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          dose: string | null
          duration: string | null
          eye: Database["iapp"]["Enums"]["eye_side"] | null
          free_text: string | null
          frequency: string | null
          id: string
          instructions: string | null
          is_parsed: boolean
          medication_id: string | null
          prescription_id: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          dose?: string | null
          duration?: string | null
          eye?: Database["iapp"]["Enums"]["eye_side"] | null
          free_text?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          is_parsed?: boolean
          medication_id?: string | null
          prescription_id: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          dose?: string | null
          duration?: string | null
          eye?: Database["iapp"]["Enums"]["eye_side"] | null
          free_text?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          is_parsed?: boolean
          medication_id?: string | null
          prescription_id?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescription_items_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_items_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_items_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "v_my_prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          clinic_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          doctor_id: string | null
          examination_id: string | null
          eye: Database["iapp"]["Enums"]["eye_side"] | null
          id: string
          is_glasses: boolean
          legacy_id: string | null
          legacy_medicines_text: string | null
          notes: string | null
          patient_id: string
          prescribed_on: string
          printed_at: string | null
          updated_at: string
          updated_by: string | null
          visit_id: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          doctor_id?: string | null
          examination_id?: string | null
          eye?: Database["iapp"]["Enums"]["eye_side"] | null
          id?: string
          is_glasses?: boolean
          legacy_id?: string | null
          legacy_medicines_text?: string | null
          notes?: string | null
          patient_id: string
          prescribed_on?: string
          printed_at?: string | null
          updated_at?: string
          updated_by?: string | null
          visit_id?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          doctor_id?: string | null
          examination_id?: string | null
          eye?: Database["iapp"]["Enums"]["eye_side"] | null
          id?: string
          is_glasses?: boolean
          legacy_id?: string | null
          legacy_medicines_text?: string | null
          notes?: string | null
          patient_id?: string
          prescribed_on?: string
          printed_at?: string | null
          updated_at?: string
          updated_by?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "examinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "v_exam_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "v_my_examinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_active_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_my_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_active_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_my_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      refractions: {
        Row: {
          add_power: number | null
          axis: number | null
          base: string | null
          created_at: string
          created_by: string | null
          cylinder: number | null
          deleted_at: string | null
          examination_id: string | null
          eye: Database["iapp"]["Enums"]["eye_side"]
          id: string
          ipd_mm: number | null
          legacy_id: string | null
          measured_on: string
          patient_id: string
          prescription_id: string | null
          prism: number | null
          refraction_type: Database["iapp"]["Enums"]["refraction_type"]
          sphere: number | null
          updated_at: string
          updated_by: string | null
          va_result: string | null
          visit_id: string | null
        }
        Insert: {
          add_power?: number | null
          axis?: number | null
          base?: string | null
          created_at?: string
          created_by?: string | null
          cylinder?: number | null
          deleted_at?: string | null
          examination_id?: string | null
          eye: Database["iapp"]["Enums"]["eye_side"]
          id?: string
          ipd_mm?: number | null
          legacy_id?: string | null
          measured_on?: string
          patient_id: string
          prescription_id?: string | null
          prism?: number | null
          refraction_type?: Database["iapp"]["Enums"]["refraction_type"]
          sphere?: number | null
          updated_at?: string
          updated_by?: string | null
          va_result?: string | null
          visit_id?: string | null
        }
        Update: {
          add_power?: number | null
          axis?: number | null
          base?: string | null
          created_at?: string
          created_by?: string | null
          cylinder?: number | null
          deleted_at?: string | null
          examination_id?: string | null
          eye?: Database["iapp"]["Enums"]["eye_side"]
          id?: string
          ipd_mm?: number | null
          legacy_id?: string | null
          measured_on?: string
          patient_id?: string
          prescription_id?: string | null
          prism?: number | null
          refraction_type?: Database["iapp"]["Enums"]["refraction_type"]
          sphere?: number | null
          updated_at?: string
          updated_by?: string | null
          va_result?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_refraction_prescription"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_refraction_prescription"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "v_my_prescriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refractions_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "examinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refractions_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "v_exam_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refractions_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "v_my_examinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refractions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refractions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_active_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refractions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_my_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refractions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refractions_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_active_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refractions_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_my_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refractions_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          is_system: boolean
          name_ar: string
          name_en: string
          rank: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name_ar: string
          name_en: string
          rank?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name_ar?: string
          name_en?: string
          rank?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          category: string | null
          code: string | null
          created_at: string
          created_by: string | null
          currency: string
          default_price: number
          deleted_at: string | null
          icon: string | null
          id: string
          is_active: boolean
          legacy_id: string | null
          name_ar: string
          name_en: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          default_price?: number
          deleted_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          legacy_id?: string | null
          name_ar: string
          name_en?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          default_price?: number
          deleted_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          legacy_id?: string | null
          name_ar?: string
          name_en?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          clinic_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          email: string | null
          employee_no: string | null
          full_name_ar: string
          hired_on: string | null
          id: string
          is_active: boolean
          job_title: string | null
          legacy_id: string | null
          phone: string | null
          profile_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          employee_no?: string | null
          full_name_ar: string
          hired_on?: string | null
          id?: string
          is_active?: boolean
          job_title?: string | null
          legacy_id?: string | null
          phone?: string | null
          profile_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          employee_no?: string | null
          full_name_ar?: string
          hired_on?: string | null
          id?: string
          is_active?: boolean
          job_title?: string | null
          legacy_id?: string | null
          phone?: string | null
          profile_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      surgeries: {
        Row: {
          anesthesia: string | null
          clinic_id: string | null
          complications: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          doctor_id: string | null
          examination_id: string | null
          eye: Database["iapp"]["Enums"]["eye_side"]
          id: string
          is_external: boolean
          is_planned: boolean
          legacy_id: string | null
          notes: string | null
          outcome: string | null
          patient_id: string
          performed_on: string | null
          procedure_code: string | null
          procedure_name: string
          surgeon_name: string | null
          updated_at: string
          updated_by: string | null
          visit_id: string | null
        }
        Insert: {
          anesthesia?: string | null
          clinic_id?: string | null
          complications?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          doctor_id?: string | null
          examination_id?: string | null
          eye: Database["iapp"]["Enums"]["eye_side"]
          id?: string
          is_external?: boolean
          is_planned?: boolean
          legacy_id?: string | null
          notes?: string | null
          outcome?: string | null
          patient_id: string
          performed_on?: string | null
          procedure_code?: string | null
          procedure_name: string
          surgeon_name?: string | null
          updated_at?: string
          updated_by?: string | null
          visit_id?: string | null
        }
        Update: {
          anesthesia?: string | null
          clinic_id?: string | null
          complications?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          doctor_id?: string | null
          examination_id?: string | null
          eye?: Database["iapp"]["Enums"]["eye_side"]
          id?: string
          is_external?: boolean
          is_planned?: boolean
          legacy_id?: string | null
          notes?: string | null
          outcome?: string | null
          patient_id?: string
          performed_on?: string | null
          procedure_code?: string | null
          procedure_name?: string
          surgeon_name?: string | null
          updated_at?: string
          updated_by?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surgeries_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgeries_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgeries_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "examinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgeries_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "v_exam_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgeries_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "v_my_examinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgeries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgeries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_active_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgeries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_my_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgeries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgeries_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_active_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgeries_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_my_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surgeries_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_ratings: {
        Row: {
          comment: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          legacy_id: string | null
          patient_id: string | null
          rated_on: string
          rating: number
          updated_at: string
          updated_by: string | null
          visit_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          legacy_id?: string | null
          patient_id?: string | null
          rated_on?: string
          rating: number
          updated_at?: string
          updated_by?: string | null
          visit_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          legacy_id?: string | null
          patient_id?: string | null
          rated_on?: string
          rating?: number
          updated_at?: string
          updated_by?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_ratings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_ratings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_active_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_ratings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_my_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_ratings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_ratings_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_active_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_ratings_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_my_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_ratings_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          appointment_id: string | null
          chief_complaint: string | null
          clinic_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          doctor_id: string | null
          id: string
          is_locked: boolean
          legacy_id: string | null
          locked_at: string | null
          locked_by: string | null
          notes: string | null
          patient_id: string
          summary: string | null
          updated_at: string
          updated_by: string | null
          visit_date: string
          visit_type: Database["iapp"]["Enums"]["visit_type"]
        }
        Insert: {
          appointment_id?: string | null
          chief_complaint?: string | null
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          doctor_id?: string | null
          id?: string
          is_locked?: boolean
          legacy_id?: string | null
          locked_at?: string | null
          locked_by?: string | null
          notes?: string | null
          patient_id: string
          summary?: string | null
          updated_at?: string
          updated_by?: string | null
          visit_date: string
          visit_type?: Database["iapp"]["Enums"]["visit_type"]
        }
        Update: {
          appointment_id?: string | null
          chief_complaint?: string | null
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          doctor_id?: string | null
          id?: string
          is_locked?: boolean
          legacy_id?: string | null
          locked_at?: string | null
          locked_by?: string | null
          notes?: string | null
          patient_id?: string
          summary?: string | null
          updated_at?: string
          updated_by?: string | null
          visit_date?: string
          visit_type?: Database["iapp"]["Enums"]["visit_type"]
        }
        Relationships: [
          {
            foreignKeyName: "visits_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_active_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_my_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_active_patients: {
        Row: {
          address: string | null
          age_at_registration: number | null
          allergies: string | null
          alt_phone: string | null
          blood_type: string | null
          city: string | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string | null
          deleted_at: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string | null
          gender: Database["iapp"]["Enums"]["gender"] | null
          id: string | null
          is_active: boolean | null
          legacy_id: string | null
          medical_history: string | null
          national_id: string | null
          notes: string | null
          occupation: string | null
          patient_code: string | null
          phone: string | null
          phone_normalized: string | null
          primary_clinic_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          age_at_registration?: number | null
          allergies?: string | null
          alt_phone?: string | null
          blood_type?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          gender?: Database["iapp"]["Enums"]["gender"] | null
          id?: string | null
          is_active?: boolean | null
          legacy_id?: string | null
          medical_history?: string | null
          national_id?: string | null
          notes?: string | null
          occupation?: string | null
          patient_code?: string | null
          phone?: string | null
          phone_normalized?: string | null
          primary_clinic_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          age_at_registration?: number | null
          allergies?: string | null
          alt_phone?: string | null
          blood_type?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          gender?: Database["iapp"]["Enums"]["gender"] | null
          id?: string | null
          is_active?: boolean | null
          legacy_id?: string | null
          medical_history?: string | null
          national_id?: string | null
          notes?: string | null
          occupation?: string | null
          patient_code?: string | null
          phone?: string | null
          phone_normalized?: string | null
          primary_clinic_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_primary_clinic_id_fkey"
            columns: ["primary_clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      v_active_visits: {
        Row: {
          appointment_id: string | null
          chief_complaint: string | null
          clinic_id: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          doctor_id: string | null
          id: string | null
          is_locked: boolean | null
          legacy_id: string | null
          locked_at: string | null
          locked_by: string | null
          notes: string | null
          patient_id: string | null
          summary: string | null
          updated_at: string | null
          updated_by: string | null
          visit_date: string | null
          visit_type: Database["iapp"]["Enums"]["visit_type"] | null
        }
        Insert: {
          appointment_id?: string | null
          chief_complaint?: string | null
          clinic_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          doctor_id?: string | null
          id?: string | null
          is_locked?: boolean | null
          legacy_id?: string | null
          locked_at?: string | null
          locked_by?: string | null
          notes?: string | null
          patient_id?: string | null
          summary?: string | null
          updated_at?: string | null
          updated_by?: string | null
          visit_date?: string | null
          visit_type?: Database["iapp"]["Enums"]["visit_type"] | null
        }
        Update: {
          appointment_id?: string | null
          chief_complaint?: string | null
          clinic_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          doctor_id?: string | null
          id?: string | null
          is_locked?: boolean | null
          legacy_id?: string | null
          locked_at?: string | null
          locked_by?: string | null
          notes?: string | null
          patient_id?: string | null
          summary?: string | null
          updated_at?: string | null
          updated_by?: string | null
          visit_date?: string | null
          visit_type?: Database["iapp"]["Enums"]["visit_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "visits_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_active_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_my_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical"
            referencedColumns: ["id"]
          },
        ]
      }
      v_ai_latest: {
        Row: {
          analysis_id: string | null
          attempt: number | null
          confidence: number | null
          created_at: string | null
          differentials: Json | null
          edited_impression: string | null
          error_message: string | null
          eye: Database["iapp"]["Enums"]["eye_side"] | null
          final_report_id: string | null
          finding_count: number | null
          finished_at: string | null
          image_id: string | null
          impression_text: string | null
          limitations: string | null
          modality: string | null
          model: string | null
          patient_id: string | null
          prompt_version: string | null
          recommendations: string | null
          reject_reason: string | null
          review_action: Database["iapp"]["Enums"]["ai_review_action"] | null
          reviewed_at: string | null
          status: Database["iapp"]["Enums"]["ai_run_status"] | null
          urgency: Database["iapp"]["Enums"]["ai_urgency"] | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_analysis_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "medical_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_active_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_my_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical"
            referencedColumns: ["id"]
          },
        ]
      }
      v_appointment_board: {
        Row: {
          appointment_type: string | null
          arrived_at: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          clinic_id: string | null
          clinic_name: string | null
          completed_at: string | null
          confirmed_at: string | null
          display_name: string | null
          display_phone: string | null
          doctor_id: string | null
          doctor_name: string | null
          doctor_short: string | null
          duration_minutes: number | null
          id: string | null
          in_clinic_at: string | null
          notes: string | null
          patient_code: string | null
          patient_id: string | null
          requested_at: string | null
          reschedule_count: number | null
          rescheduled_from: string | null
          room: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          source: Database["iapp"]["Enums"]["appointment_source"] | null
          status: Database["iapp"]["Enums"]["appointment_status"] | null
          visit_id: string | null
          wait_minutes: number | null
          waiting_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_active_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_my_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_rescheduled_from_fkey"
            columns: ["rescheduled_from"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_rescheduled_from_fkey"
            columns: ["rescheduled_from"]
            isOneToOne: false
            referencedRelation: "v_appointment_board"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "v_active_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "v_my_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      v_exam_full: {
        Row: {
          add_od: number | null
          add_os: number | null
          anterior_segment: string | null
          anterior_segment_left: string | null
          anterior_segment_right: string | null
          axis_od: number | null
          axis_os: number | null
          chief_complaint: string | null
          color_vision: string | null
          contrast_sensitivity: string | null
          cover_test: string | null
          created_at: string | null
          cyl_od: number | null
          cyl_os: number | null
          doctor_id: string | null
          exam_date: string | null
          id: string | null
          iop_od: number | null
          iop_od_at: string | null
          iop_od_method: string | null
          iop_os: number | null
          iop_os_at: string | null
          iop_os_method: string | null
          notes: string | null
          patient_id: string | null
          posterior_segment: string | null
          posterior_segment_left: string | null
          posterior_segment_right: string | null
          sph_od: number | null
          sph_os: number | null
          treatment_plan: string | null
          va_left: string | null
          va_left_corrected: string | null
          va_left_ph: string | null
          va_right: string | null
          va_right_corrected: string | null
          va_right_ph: string | null
          visit_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "examinations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "examinations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "examinations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_active_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "examinations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_my_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "examinations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "examinations_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_active_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "examinations_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_my_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "examinations_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      v_my_diagnoses: {
        Row: {
          diagnosed_on: string | null
          diagnosis_text: string | null
          eye: Database["iapp"]["Enums"]["eye_side"] | null
          id: string | null
          patient_id: string | null
          status: Database["iapp"]["Enums"]["diagnosis_status"] | null
        }
        Insert: {
          diagnosed_on?: string | null
          diagnosis_text?: string | null
          eye?: Database["iapp"]["Enums"]["eye_side"] | null
          id?: string | null
          patient_id?: string | null
          status?: Database["iapp"]["Enums"]["diagnosis_status"] | null
        }
        Update: {
          diagnosed_on?: string | null
          diagnosis_text?: string | null
          eye?: Database["iapp"]["Enums"]["eye_side"] | null
          id?: string | null
          patient_id?: string | null
          status?: Database["iapp"]["Enums"]["diagnosis_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnoses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnoses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_active_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnoses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_my_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnoses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical"
            referencedColumns: ["id"]
          },
        ]
      }
      v_my_examinations: {
        Row: {
          doctor_id: string | null
          exam_date: string | null
          id: string | null
          patient_id: string | null
          treatment_plan: string | null
          va_left: string | null
          va_right: string | null
          visit_id: string | null
        }
        Insert: {
          doctor_id?: string | null
          exam_date?: string | null
          id?: string | null
          patient_id?: string | null
          treatment_plan?: string | null
          va_left?: string | null
          va_right?: string | null
          visit_id?: string | null
        }
        Update: {
          doctor_id?: string | null
          exam_date?: string | null
          id?: string | null
          patient_id?: string | null
          treatment_plan?: string | null
          va_left?: string | null
          va_right?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "examinations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "examinations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "examinations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_active_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "examinations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_my_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "examinations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "examinations_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_active_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "examinations_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "v_my_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "examinations_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      v_my_patient: {
        Row: {
          address: string | null
          allergies: string | null
          blood_type: string | null
          city: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string | null
          gender: Database["iapp"]["Enums"]["gender"] | null
          id: string | null
          patient_code: string | null
          phone: string | null
          primary_clinic_id: string | null
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          blood_type?: string | null
          city?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          gender?: Database["iapp"]["Enums"]["gender"] | null
          id?: string | null
          patient_code?: string | null
          phone?: string | null
          primary_clinic_id?: string | null
        }
        Update: {
          address?: string | null
          allergies?: string | null
          blood_type?: string | null
          city?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          gender?: Database["iapp"]["Enums"]["gender"] | null
          id?: string | null
          patient_code?: string | null
          phone?: string | null
          primary_clinic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_primary_clinic_id_fkey"
            columns: ["primary_clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      v_my_prescriptions: {
        Row: {
          eye: Database["iapp"]["Enums"]["eye_side"] | null
          id: string | null
          is_glasses: boolean | null
          legacy_medicines_text: string | null
          notes: string | null
          patient_id: string | null
          prescribed_on: string | null
        }
        Insert: {
          eye?: Database["iapp"]["Enums"]["eye_side"] | null
          id?: string | null
          is_glasses?: boolean | null
          legacy_medicines_text?: string | null
          notes?: string | null
          patient_id?: string | null
          prescribed_on?: string | null
        }
        Update: {
          eye?: Database["iapp"]["Enums"]["eye_side"] | null
          id?: string | null
          is_glasses?: boolean | null
          legacy_medicines_text?: string | null
          notes?: string | null
          patient_id?: string | null
          prescribed_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_active_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_my_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical"
            referencedColumns: ["id"]
          },
        ]
      }
      v_my_visits: {
        Row: {
          clinic_id: string | null
          doctor_id: string | null
          id: string | null
          patient_id: string | null
          visit_date: string | null
          visit_type: Database["iapp"]["Enums"]["visit_type"] | null
        }
        Insert: {
          clinic_id?: string | null
          doctor_id?: string | null
          id?: string | null
          patient_id?: string | null
          visit_date?: string | null
          visit_type?: Database["iapp"]["Enums"]["visit_type"] | null
        }
        Update: {
          clinic_id?: string | null
          doctor_id?: string | null
          id?: string | null
          patient_id?: string | null
          visit_date?: string | null
          visit_type?: Database["iapp"]["Enums"]["visit_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "visits_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_active_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_my_patient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_clinical"
            referencedColumns: ["id"]
          },
        ]
      }
      v_patient_clinical: {
        Row: {
          address: string | null
          age_at_registration: number | null
          allergies: string | null
          alt_phone: string | null
          blood_type: string | null
          city: string | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string | null
          deleted_at: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string | null
          gender: Database["iapp"]["Enums"]["gender"] | null
          id: string | null
          is_active: boolean | null
          last_visit: string | null
          legacy_id: string | null
          medical_history: string | null
          national_id: string | null
          notes: string | null
          occupation: string | null
          patient_code: string | null
          phone: string | null
          phone_normalized: string | null
          primary_clinic_id: string | null
          primary_condition: string | null
          triage_status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          age_at_registration?: number | null
          allergies?: string | null
          alt_phone?: string | null
          blood_type?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          gender?: Database["iapp"]["Enums"]["gender"] | null
          id?: string | null
          is_active?: boolean | null
          last_visit?: string | null
          legacy_id?: string | null
          medical_history?: string | null
          national_id?: string | null
          notes?: string | null
          occupation?: string | null
          patient_code?: string | null
          phone?: string | null
          phone_normalized?: string | null
          primary_clinic_id?: string | null
          primary_condition?: string | null
          triage_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          age_at_registration?: number | null
          allergies?: string | null
          alt_phone?: string | null
          blood_type?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          gender?: Database["iapp"]["Enums"]["gender"] | null
          id?: string | null
          is_active?: boolean | null
          last_visit?: string | null
          legacy_id?: string | null
          medical_history?: string | null
          national_id?: string | null
          notes?: string | null
          occupation?: string | null
          patient_code?: string | null
          phone?: string | null
          phone_normalized?: string | null
          primary_clinic_id?: string | null
          primary_condition?: string | null
          triage_status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_primary_clinic_id_fkey"
            columns: ["primary_clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      acting_role: { Args: never; Returns: string }
      ai_quota_used: { Args: { p_hours?: number }; Returns: number }
      ai_to_final_report: {
        Args: { p_analysis_id: string; p_finalize?: boolean; p_text?: string }
        Returns: {
          ai_analysis_id: string | null
          ai_assisted: boolean
          authored_by: string
          created_at: string
          deleted_at: string | null
          finalized_at: string | null
          findings: Json | null
          id: string
          image_id: string
          impression: string | null
          patient_id: string
          report_text: string
          source: Database["iapp"]["Enums"]["report_source"]
          status: Database["iapp"]["Enums"]["report_state"]
          updated_at: string
          updated_by: string | null
          visit_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "final_report"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      available_slots: {
        Args: { p_clinic_id: string; p_date: string; p_doctor_id?: string }
        Returns: {
          is_free: boolean
          slot_time: string
        }[]
      }
      book_appointment: {
        Args: {
          p_clinic_id: string
          p_date: string
          p_doctor_id?: string
          p_duration?: number
          p_guest_name?: string
          p_guest_phone?: string
          p_notes?: string
          p_patient_id?: string
          p_room?: string
          p_time: string
          p_type?: string
        }
        Returns: {
          appointment_type: string | null
          arrived_at: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          clinic_id: string
          completed_at: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          doctor_id: string | null
          duration_minutes: number
          guest_name: string | null
          guest_phone: string | null
          id: string
          in_clinic_at: string | null
          legacy_id: string | null
          no_show_at: string | null
          notes: string | null
          patient_id: string | null
          requested_at: string | null
          reschedule_count: number
          rescheduled_from: string | null
          room: string | null
          scheduled_date: string
          scheduled_time: string
          slot: unknown
          source: Database["iapp"]["Enums"]["appointment_source"]
          status: Database["iapp"]["Enums"]["appointment_status"]
          updated_at: string
          updated_by: string | null
          visit_id: string | null
          waiting_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      call_patient: {
        Args: { p_id: string }
        Returns: {
          appointment_type: string | null
          arrived_at: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          clinic_id: string
          completed_at: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          doctor_id: string | null
          duration_minutes: number
          guest_name: string | null
          guest_phone: string | null
          id: string
          in_clinic_at: string | null
          legacy_id: string | null
          no_show_at: string | null
          notes: string | null
          patient_id: string | null
          requested_at: string | null
          reschedule_count: number
          rescheduled_from: string | null
          room: string | null
          scheduled_date: string
          scheduled_time: string
          slot: unknown
          source: Database["iapp"]["Enums"]["appointment_source"]
          status: Database["iapp"]["Enums"]["appointment_status"]
          updated_at: string
          updated_by: string | null
          visit_id: string | null
          waiting_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_appointment: {
        Args: { p_id: string; p_reason: string }
        Returns: {
          appointment_type: string | null
          arrived_at: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          clinic_id: string
          completed_at: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          doctor_id: string | null
          duration_minutes: number
          guest_name: string | null
          guest_phone: string | null
          id: string
          in_clinic_at: string | null
          legacy_id: string | null
          no_show_at: string | null
          notes: string | null
          patient_id: string | null
          requested_at: string | null
          reschedule_count: number
          rescheduled_from: string | null
          room: string | null
          scheduled_date: string
          scheduled_time: string
          slot: unknown
          source: Database["iapp"]["Enums"]["appointment_source"]
          status: Database["iapp"]["Enums"]["appointment_status"]
          updated_at: string
          updated_by: string | null
          visit_id: string | null
          waiting_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      claim_patient_record: {
        Args: { p_code: string; p_phone: string }
        Returns: Json
      }
      complete_appointment: {
        Args: { p_id: string; p_visit_id?: string }
        Returns: {
          appointment_type: string | null
          arrived_at: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          clinic_id: string
          completed_at: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          doctor_id: string | null
          duration_minutes: number
          guest_name: string | null
          guest_phone: string | null
          id: string
          in_clinic_at: string | null
          legacy_id: string | null
          no_show_at: string | null
          notes: string | null
          patient_id: string | null
          requested_at: string | null
          reschedule_count: number
          rescheduled_from: string | null
          room: string | null
          scheduled_date: string
          scheduled_time: string
          slot: unknown
          source: Database["iapp"]["Enums"]["appointment_source"]
          status: Database["iapp"]["Enums"]["appointment_status"]
          updated_at: string
          updated_by: string | null
          visit_id: string | null
          waiting_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_appointment: {
        Args: { p_id: string }
        Returns: {
          appointment_type: string | null
          arrived_at: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          clinic_id: string
          completed_at: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          doctor_id: string | null
          duration_minutes: number
          guest_name: string | null
          guest_phone: string | null
          id: string
          in_clinic_at: string | null
          legacy_id: string | null
          no_show_at: string | null
          notes: string | null
          patient_id: string | null
          requested_at: string | null
          reschedule_count: number
          rescheduled_from: string | null
          room: string | null
          scheduled_date: string
          scheduled_time: string
          slot: unknown
          source: Database["iapp"]["Enums"]["appointment_source"]
          status: Database["iapp"]["Enums"]["appointment_status"]
          updated_at: string
          updated_by: string | null
          visit_id: string | null
          waiting_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_patient_uuid: { Args: never; Returns: string }
      img_digest: {
        Args: { r: Database["iapp"]["Tables"]["medical_images"]["Row"] }
        Returns: Json
      }
      is_doctor: { Args: never; Returns: boolean }
      is_secretary: { Args: never; Returns: boolean }
      log_event: {
        Args: {
          p_action: string
          p_meta?: Json
          p_outcome?: string
          p_patient_id?: string
          p_reason?: string
          p_record_id?: string
          p_resource: string
        }
        Returns: undefined
      }
      mark_arrived: {
        Args: { p_id: string }
        Returns: {
          appointment_type: string | null
          arrived_at: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          clinic_id: string
          completed_at: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          doctor_id: string | null
          duration_minutes: number
          guest_name: string | null
          guest_phone: string | null
          id: string
          in_clinic_at: string | null
          legacy_id: string | null
          no_show_at: string | null
          notes: string | null
          patient_id: string | null
          requested_at: string | null
          reschedule_count: number
          rescheduled_from: string | null
          room: string | null
          scheduled_date: string
          scheduled_time: string
          slot: unknown
          source: Database["iapp"]["Enums"]["appointment_source"]
          status: Database["iapp"]["Enums"]["appointment_status"]
          updated_at: string
          updated_by: string | null
          visit_id: string | null
          waiting_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_no_show: {
        Args: { p_id: string }
        Returns: {
          appointment_type: string | null
          arrived_at: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          clinic_id: string
          completed_at: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          doctor_id: string | null
          duration_minutes: number
          guest_name: string | null
          guest_phone: string | null
          id: string
          in_clinic_at: string | null
          legacy_id: string | null
          no_show_at: string | null
          notes: string | null
          patient_id: string | null
          requested_at: string | null
          reschedule_count: number
          rescheduled_from: string | null
          room: string | null
          scheduled_date: string
          scheduled_time: string
          slot: unknown
          source: Database["iapp"]["Enums"]["appointment_source"]
          status: Database["iapp"]["Enums"]["appointment_status"]
          updated_at: string
          updated_by: string | null
          visit_id: string | null
          waiting_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_order_printed: {
        Args: { p_id: string }
        Returns: {
          clinic_id: string | null
          clinical_indication: string | null
          clinical_notes: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          doctor_id: string | null
          id: string
          order_no: string | null
          ordered_on: string
          patient_id: string
          printed_at: string | null
          printed_count: number
          status: Database["iapp"]["Enums"]["imaging_order_status"]
          updated_at: string
          updated_by: string | null
          urgency: Database["iapp"]["Enums"]["order_urgency"]
          visit_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "imaging_orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_waiting: {
        Args: { p_id: string }
        Returns: {
          appointment_type: string | null
          arrived_at: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          clinic_id: string
          completed_at: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          doctor_id: string | null
          duration_minutes: number
          guest_name: string | null
          guest_phone: string | null
          id: string
          in_clinic_at: string | null
          legacy_id: string | null
          no_show_at: string | null
          notes: string | null
          patient_id: string | null
          requested_at: string | null
          reschedule_count: number
          rescheduled_from: string | null
          room: string | null
          scheduled_date: string
          scheduled_time: string
          slot: unknown
          source: Database["iapp"]["Enums"]["appointment_source"]
          status: Database["iapp"]["Enums"]["appointment_status"]
          updated_at: string
          updated_by: string | null
          visit_id: string | null
          waiting_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      my_clinic_ids: { Args: never; Returns: string[] }
      my_link_status: { Args: never; Returns: Json }
      my_patient_id: { Args: never; Returns: string }
      normalize_phone: { Args: { p: string }; Returns: string }
      normalize_phone_txt: { Args: { p: string }; Returns: string }
      reschedule_appointment: {
        Args: {
          p_id: string
          p_new_date: string
          p_new_doctor_id?: string
          p_new_room?: string
          p_new_time: string
          p_reason?: string
        }
        Returns: {
          appointment_type: string | null
          arrived_at: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          clinic_id: string
          completed_at: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          doctor_id: string | null
          duration_minutes: number
          guest_name: string | null
          guest_phone: string | null
          id: string
          in_clinic_at: string | null
          legacy_id: string | null
          no_show_at: string | null
          notes: string | null
          patient_id: string | null
          requested_at: string | null
          reschedule_count: number
          rescheduled_from: string | null
          room: string | null
          scheduled_date: string
          scheduled_time: string
          slot: unknown
          source: Database["iapp"]["Enums"]["appointment_source"]
          status: Database["iapp"]["Enums"]["appointment_status"]
          updated_at: string
          updated_by: string | null
          visit_id: string | null
          waiting_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_appointment: {
        Args: { p_id: string }
        Returns: {
          appointment_type: string | null
          arrived_at: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          clinic_id: string
          completed_at: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          doctor_id: string | null
          duration_minutes: number
          guest_name: string | null
          guest_phone: string | null
          id: string
          in_clinic_at: string | null
          legacy_id: string | null
          no_show_at: string | null
          notes: string | null
          patient_id: string | null
          requested_at: string | null
          reschedule_count: number
          rescheduled_from: string | null
          room: string | null
          scheduled_date: string
          scheduled_time: string
          slot: unknown
          source: Database["iapp"]["Enums"]["appointment_source"]
          status: Database["iapp"]["Enums"]["appointment_status"]
          updated_at: string
          updated_by: string | null
          visit_id: string | null
          waiting_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      soft_delete: {
        Args: { p_id: string; p_table: string }
        Returns: undefined
      }
      storage_patient_of: { Args: { p_name: string }; Returns: string }
      sweep_no_shows: { Args: { p_grace_minutes?: number }; Returns: number }
      transition: {
        Args: {
          p_appointment_id: string
          p_reason?: string
          p_to: Database["iapp"]["Enums"]["appointment_status"]
        }
        Returns: {
          appointment_type: string | null
          arrived_at: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          clinic_id: string
          completed_at: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          doctor_id: string | null
          duration_minutes: number
          guest_name: string | null
          guest_phone: string | null
          id: string
          in_clinic_at: string | null
          legacy_id: string | null
          no_show_at: string | null
          notes: string | null
          patient_id: string | null
          requested_at: string | null
          reschedule_count: number
          rescheduled_from: string | null
          room: string | null
          scheduled_date: string
          scheduled_time: string
          slot: unknown
          source: Database["iapp"]["Enums"]["appointment_source"]
          status: Database["iapp"]["Enums"]["appointment_status"]
          updated_at: string
          updated_by: string | null
          visit_id: string | null
          waiting_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      ai_review_action: "accept" | "edit" | "reject" | "regenerate"
      ai_run_status:
        | "queued"
        | "running"
        | "succeeded"
        | "failed"
        | "superseded"
      ai_severity: "none" | "mild" | "moderate" | "severe" | "unknown"
      ai_urgency: "routine" | "soon" | "urgent"
      appointment_source: "staff" | "patient_portal" | "guest" | "walk_in"
      appointment_status:
        | "REQUESTED"
        | "PENDING"
        | "CONFIRMED"
        | "ARRIVED"
        | "WAITING"
        | "IN_CLINIC"
        | "COMPLETED"
        | "CANCELLED"
        | "NO_SHOW"
      appointment_status_v1:
        | "requested"
        | "confirmed"
        | "arrived"
        | "waiting"
        | "in_room"
        | "completed"
        | "cancelled"
        | "no_show"
      diagnosis_status: "active" | "resolved" | "chronic" | "ruled_out"
      eye_side: "OD" | "OS" | "OU"
      follow_up_status:
        | "pending"
        | "notified"
        | "completed"
        | "missed"
        | "cancelled"
      gender: "male" | "female" | "other" | "unknown"
      image_modality:
        | "fundus"
        | "oct"
        | "ffa"
        | "optos"
        | "topography"
        | "biometry"
        | "anterior_segment"
        | "xray"
        | "other"
        | "unknown"
        | "octa"
        | "pentacam"
        | "visual_field"
        | "uwf_fundus"
        | "uwf_oct"
        | "uwf_octa"
        | "b_scan"
      imaging_order_status:
        | "requested"
        | "scheduled"
        | "completed"
        | "cancelled"
      imaging_status: "uploaded" | "pending_report" | "reported" | "archived"
      medication_form:
        | "drop"
        | "ointment"
        | "tablet"
        | "capsule"
        | "injection"
        | "gel"
        | "other"
      notification_channel: "in_app" | "sms" | "whatsapp" | "email"
      notification_status: "pending" | "sent" | "failed" | "read"
      order_urgency: "routine" | "urgent" | "stat"
      payment_method: "cash" | "card" | "transfer" | "insurance" | "other"
      payment_status: "unpaid" | "partial" | "paid" | "refunded" | "waived"
      refraction_type: "unaided" | "aided" | "cycloplegic" | "final" | "auto"
      report_source: "ai" | "doctor" | "external"
      report_state: "draft" | "final"
      visit_type:
        | "routine"
        | "follow_up"
        | "retina"
        | "refraction"
        | "consultation"
        | "surgery"
        | "emergency"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          detail: Json | null
          id: number
          ip: unknown
          occurred_at: string
          outcome: string
          patient_id: string | null
          reason: string | null
          record_ids: string[] | null
          request_id: string | null
          resource: string
          role: Database["public"]["Enums"]["iapp_role"] | null
          row_count: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          detail?: Json | null
          id?: number
          ip?: unknown
          occurred_at?: string
          outcome: string
          patient_id?: string | null
          reason?: string | null
          record_ids?: string[] | null
          request_id?: string | null
          resource: string
          role?: Database["public"]["Enums"]["iapp_role"] | null
          row_count?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          detail?: Json | null
          id?: number
          ip?: unknown
          occurred_at?: string
          outcome?: string
          patient_id?: string | null
          reason?: string | null
          record_ids?: string[] | null
          request_id?: string | null
          resource?: string
          role?: Database["public"]["Enums"]["iapp_role"] | null
          row_count?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_events: {
        Row: {
          event: string
          id: number
          identifier: string
          ip: unknown
          occurred_at: string
          user_agent: string | null
        }
        Insert: {
          event: string
          id?: number
          identifier: string
          ip?: unknown
          occurred_at?: string
          user_agent?: string | null
        }
        Update: {
          event?: string
          id?: number
          identifier?: string
          ip?: unknown
          occurred_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      patient_links: {
        Row: {
          created_at: string
          id: string
          method: string
          patient_id: string
          user_id: string
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          method?: string
          patient_id: string
          user_id: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          method?: string
          patient_id?: string
          user_id?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          clinic_id: string | null
          created_at: string
          created_by: string | null
          full_name: string | null
          id: string
          is_active: boolean
          last_login_at: string | null
          phone: string | null
          role: Database["public"]["Enums"]["iapp_role"]
          updated_at: string
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          last_login_at?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["iapp_role"]
          updated_at?: string
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["iapp_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_patient_id: { Args: never; Returns: string }
      current_role: {
        Args: never
        Returns: Database["public"]["Enums"]["iapp_role"]
      }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      iapp_role: "admin" | "doctor" | "secretary" | "patient"
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
  iapp: {
    Enums: {
      ai_review_action: ["accept", "edit", "reject", "regenerate"],
      ai_run_status: ["queued", "running", "succeeded", "failed", "superseded"],
      ai_severity: ["none", "mild", "moderate", "severe", "unknown"],
      ai_urgency: ["routine", "soon", "urgent"],
      appointment_source: ["staff", "patient_portal", "guest", "walk_in"],
      appointment_status: [
        "REQUESTED",
        "PENDING",
        "CONFIRMED",
        "ARRIVED",
        "WAITING",
        "IN_CLINIC",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
      ],
      appointment_status_v1: [
        "requested",
        "confirmed",
        "arrived",
        "waiting",
        "in_room",
        "completed",
        "cancelled",
        "no_show",
      ],
      diagnosis_status: ["active", "resolved", "chronic", "ruled_out"],
      eye_side: ["OD", "OS", "OU"],
      follow_up_status: [
        "pending",
        "notified",
        "completed",
        "missed",
        "cancelled",
      ],
      gender: ["male", "female", "other", "unknown"],
      image_modality: [
        "fundus",
        "oct",
        "ffa",
        "optos",
        "topography",
        "biometry",
        "anterior_segment",
        "xray",
        "other",
        "unknown",
        "octa",
        "pentacam",
        "visual_field",
        "uwf_fundus",
        "uwf_oct",
        "uwf_octa",
        "b_scan",
      ],
      imaging_order_status: [
        "requested",
        "scheduled",
        "completed",
        "cancelled",
      ],
      imaging_status: ["uploaded", "pending_report", "reported", "archived"],
      medication_form: [
        "drop",
        "ointment",
        "tablet",
        "capsule",
        "injection",
        "gel",
        "other",
      ],
      notification_channel: ["in_app", "sms", "whatsapp", "email"],
      notification_status: ["pending", "sent", "failed", "read"],
      order_urgency: ["routine", "urgent", "stat"],
      payment_method: ["cash", "card", "transfer", "insurance", "other"],
      payment_status: ["unpaid", "partial", "paid", "refunded", "waived"],
      refraction_type: ["unaided", "aided", "cycloplegic", "final", "auto"],
      report_source: ["ai", "doctor", "external"],
      report_state: ["draft", "final"],
      visit_type: [
        "routine",
        "follow_up",
        "retina",
        "refraction",
        "consultation",
        "surgery",
        "emergency",
        "other",
      ],
    },
  },
  public: {
    Enums: {
      iapp_role: ["admin", "doctor", "secretary", "patient"],
    },
  },
} as const
