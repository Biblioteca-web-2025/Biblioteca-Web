import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validar variables de entorno en desarrollo
if (process.env.NODE_ENV === 'development') {
  if (!supabaseUrl) {
    console.warn('⚠️  NEXT_PUBLIC_SUPABASE_URL no está configurada')
  }
  if (!supabaseAnonKey) {
    console.warn('⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada')
  }
  if (!supabaseServiceKey) {
    console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY no está configurada')
  }
}

// Cliente para uso del lado del servidor (con service role)
export const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Cliente para uso del lado del cliente
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Cliente para componentes que requieren autenticación
export const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️  Variables de entorno de Supabase no configuradas')
    return null
  }
  return createClientComponentClient()
}

// Tipos de la base de datos
export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string
          title: string
          author: string
          category: string
          subcategory: string | null
          year: string
          cover_image_url: string | null
          pdf_url: string | null
          type: string
          description: string | null
          keywords: string | null
          editorial: string | null
          isbn: string | null
          pages: number | null
          location: string | null
          featured: boolean
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          title: string
          author: string
          category: string
          subcategory?: string | null
          year: string
          cover_image_url?: string | null
          pdf_url?: string | null
          type: string
          description?: string | null
          keywords?: string | null
          editorial?: string | null
          isbn?: string | null
          pages?: number | null
          location?: string | null
          featured?: boolean
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          title?: string
          author?: string
          category?: string
          subcategory?: string | null
          year?: string
          cover_image_url?: string | null
          pdf_url?: string | null
          type?: string
          description?: string | null
          keywords?: string | null
          editorial?: string | null
          isbn?: string | null
          pages?: number | null
          location?: string | null
          featured?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      document_stats: {
        Row: {
          id: number
          document_id: string
          views: number
          downloads: number
          last_viewed: string | null
          created_at: string
        }
        Insert: {
          id?: number
          document_id: string
          views?: number
          downloads?: number
          last_viewed?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          document_id?: string
          views?: number
          downloads?: number
          last_viewed?: string | null
          created_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: number
          action: string
          document_id: string | null
          user_id: string | null
          user_ip: string | null
          user_agent: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          action: string
          document_id?: string | null
          user_id?: string | null
          user_ip?: string | null
          user_agent?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: number
          action?: string
          document_id?: string | null
          user_id?: string | null
          user_ip?: string | null
          user_agent?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      admin_users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: string
          created_at: string
          updated_at: string
          last_login: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: string
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: string
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'super_admin'
      document_type: 'articulos' | 'proyectos' | 'trabajo-de-grado' | 'fichas' | 'libros' | 'otras-publicaciones'
    }
  }
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never
