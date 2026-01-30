import { createClient } from '@supabase/supabase-js'

// Supabase Configuration
// Supports both legacy anon key and modern publishable keys
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

// Try publishable key first, fallback to legacy anon key
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseKey) {
  throw new Error('Missing Supabase key environment variable (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
}

// Create Supabase client with publishable key support
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Export types for our database
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          role: 'admin' | 'member' | 'viewer'
          created_at: string
          updated_at: string
          last_seen_at: string | null
        }
        Insert: {
          id?: string
          email: string
          name: string
          avatar_url?: string | null
          role?: 'admin' | 'member' | 'viewer'
          created_at?: string
          updated_at?: string
          last_seen_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          role?: 'admin' | 'member' | 'viewer'
          created_at?: string
          updated_at?: string
          last_seen_at?: string | null
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          owner_id: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          owner_id?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          owner_id?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      organization_members: {
        Row: {
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          joined_at: string
        }
        Insert: {
          organization_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member'
          joined_at?: string
        }
        Update: {
          organization_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          joined_at?: string
        }
      }
      agents: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'claude-code' | 'open-code' | 'custom' | 'project-manager'
          capabilities: string[]
          status: 'online' | 'offline' | 'busy' | 'error'
          current_task_id: string | null
          config: Json
          api_key_encrypted: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'claude-code' | 'open-code' | 'custom' | 'project-manager'
          capabilities?: string[]
          status?: 'online' | 'offline' | 'busy' | 'error'
          current_task_id?: string | null
          config?: Json
          api_key_encrypted?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'claude-code' | 'open-code' | 'custom' | 'project-manager'
          capabilities?: string[]
          status?: 'online' | 'offline' | 'busy' | 'error'
          current_task_id?: string | null
          config?: Json
          api_key_encrypted?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      boards: {
        Row: {
          id: string
          organization_id: string | null
          name: string
          description: string | null
          settings: Json
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          name: string
          description?: string | null
          settings?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          name?: string
          description?: string | null
          settings?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      board_members: {
        Row: {
          board_id: string
          user_id: string
          role: 'owner' | 'admin' | 'editor' | 'viewer'
          added_at: string
        }
        Insert: {
          board_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'editor' | 'viewer'
          added_at?: string
        }
        Update: {
          board_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'editor' | 'viewer'
          added_at?: string
        }
      }
      columns: {
        Row: {
          id: string
          board_id: string
          title: string
          position: number
          wip_limit: number | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          board_id: string
          title: string
          position: number
          wip_limit?: number | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          board_id?: string
          title?: string
          position?: number
          wip_limit?: number | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      cards: {
        Row: {
          id: string
          column_id: string
          board_id: string
          title: string
          description: string | null
          assignee_type: 'user' | 'agent' | null
          assignee_id: string | null
          priority: 'critical' | 'high' | 'medium' | 'low' | 'none'
          status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
          tags: string[]
          due_date: string | null
          position: number
          version: number
          agent_context: Json
          created_by: string | null
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          column_id: string
          board_id: string
          title: string
          description?: string | null
          assignee_type?: 'user' | 'agent' | null
          assignee_id?: string | null
          priority?: 'critical' | 'high' | 'medium' | 'low' | 'none'
          status?: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
          tags?: string[]
          due_date?: string | null
          position?: number
          version?: number
          agent_context?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          column_id?: string
          board_id?: string
          title?: string
          description?: string | null
          assignee_type?: 'user' | 'agent' | null
          assignee_id?: string | null
          priority?: 'critical' | 'high' | 'medium' | 'low' | 'none'
          status?: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
          tags?: string[]
          due_date?: string | null
          position?: number
          version?: number
          agent_context?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
      }
      comments: {
        Row: {
          id: string
          card_id: string
          author_type: 'user' | 'agent'
          author_id: string
          content: string
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          card_id: string
          author_type: 'user' | 'agent'
          author_id: string
          content: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          card_id?: string
          author_type?: 'user' | 'agent'
          author_id?: string
          content?: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          board_id: string
          card_id: string | null
          actor_type: 'user' | 'agent' | 'system'
          actor_id: string | null
          action: string
          data: Json
          created_at: string
        }
        Insert: {
          id?: string
          board_id: string
          card_id?: string | null
          actor_type: 'user' | 'agent' | 'system'
          actor_id?: string | null
          action: string
          data: Json
          created_at?: string
        }
        Update: {
          id?: string
          board_id?: string
          card_id?: string | null
          actor_type?: 'user' | 'agent' | 'system'
          actor_id?: string | null
          action?: string
          data?: Json
          created_at?: string
        }
      }
      presence: {
        Row: {
          id: string
          board_id: string
          entity_type: 'user' | 'agent'
          entity_id: string
          status: 'active' | 'idle' | 'offline'
          last_seen_at: string
          cursor_x: number | null
          cursor_y: number | null
          focused_card_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          board_id: string
          entity_type: 'user' | 'agent'
          entity_id: string
          status?: 'active' | 'idle' | 'offline'
          last_seen_at?: string
          cursor_x?: number | null
          cursor_y?: number | null
          focused_card_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          board_id?: string
          entity_type?: 'user' | 'agent'
          entity_id?: string
          status?: 'active' | 'idle' | 'offline'
          last_seen_at?: string
          cursor_x?: number | null
          cursor_y?: number | null
          focused_card_id?: string | null
          created_at?: string
          updated_at?: string
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
      [_ in never]: never
    }
  }
}

// Type helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience types
export type User = Tables<'users'>
export type Organization = Tables<'organizations'>
export type OrganizationMember = Tables<'organization_members'>
export type Agent = Tables<'agents'>
export type Board = Tables<'boards'>
export type BoardMember = Tables<'board_members'>
export type Column = Tables<'columns'>
export type Card = Tables<'cards'>
export type Comment = Tables<'comments'>
export type Activity = Tables<'activities'>
export type Presence = Tables<'presence'>
