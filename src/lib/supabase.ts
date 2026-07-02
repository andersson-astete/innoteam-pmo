import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

// Create client - will work only if credentials are set
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          brand_color: string
          timezone: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['companies']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['companies']['Insert']>
      }
      projects: {
        Row: {
          id: string
          company_id: string
          name: string
          type: 'sap' | 'odoo' | 'custom'
          status: string
          start_date: string
          target_close_date: string
          phase_weights: Record<string, number>
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
      }
      deliverables: {
        Row: {
          id: string
          project_id: string
          society_name: string
          country: string
          report_type: 'BG' | 'DRE' | 'FF' | 'custom'
          percentage: number
          status: 'init' | 'proc' | 'testing' | 'go' | 'client'
          last_phase_reached: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['deliverables']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['deliverables']['Insert']>
      }
      alerts: {
        Row: {
          id: string
          project_id: string
          severity: 'baja' | 'media' | 'alta'
          title: string
          impact: string
          action: string
          owner: string
          due_date: string
          status: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['alerts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['alerts']['Insert']>
      }
      action_items: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string
          owner: string
          due_date: string
          status: 'pending' | 'in_progress' | 'done'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['action_items']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['action_items']['Insert']>
      }
    }
  }
}
