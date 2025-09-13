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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          name: string
          address: string
          type: 'apartment' | 'house' | 'commercial' | 'land'
          purchase_price: number
          purchase_date: string
          monthly_rent: number
          owner_id: string
          created_at: string
          updated_at: string
          square_meters?: number
          rooms?: number
          floor?: number
          total_floors?: number
          year_built?: number
          status: 'active' | 'inactive' | 'sold'
        }
        Insert: {
          id?: string
          name: string
          address: string
          type: 'apartment' | 'house' | 'commercial' | 'land'
          purchase_price: number
          purchase_date: string
          monthly_rent: number
          owner_id: string
          created_at?: string
          updated_at?: string
          square_meters?: number
          rooms?: number
          floor?: number
          total_floors?: number
          year_built?: number
          status?: 'active' | 'inactive' | 'sold'
        }
        Update: {
          id?: string
          name?: string
          address?: string
          type?: 'apartment' | 'house' | 'commercial' | 'land'
          purchase_price?: number
          purchase_date?: string
          monthly_rent?: number
          owner_id?: string
          created_at?: string
          updated_at?: string
          square_meters?: number
          rooms?: number
          floor?: number
          total_floors?: number
          year_built?: number
          status?: 'active' | 'inactive' | 'sold'
        }
      }
      transactions: {
        Row: {
          id: string
          property_id: string
          type: 'income' | 'expense'
          category: string
          amount: number
          description: string
          date: string
          created_at: string
          updated_at: string
          receipt_url?: string
          tags?: string[]
          is_recurring?: boolean
          recurring_interval?: 'monthly' | 'quarterly' | 'yearly'
          user_id: string
        }
        Insert: {
          id?: string
          property_id: string
          type: 'income' | 'expense'
          category: string
          amount: number
          description: string
          date: string
          created_at?: string
          updated_at?: string
          receipt_url?: string
          tags?: string[]
          is_recurring?: boolean
          recurring_interval?: 'monthly' | 'quarterly' | 'yearly'
          user_id: string
        }
        Update: {
          id?: string
          property_id?: string
          type?: 'income' | 'expense'
          category?: string
          amount?: number
          description?: string
          date?: string
          created_at?: string
          updated_at?: string
          receipt_url?: string
          tags?: string[]
          is_recurring?: boolean
          recurring_interval?: 'monthly' | 'quarterly' | 'yearly'
          user_id?: string
        }
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'bank' | 'credit_card' | 'cash' | 'investment'
          balance: number
          currency: string
          account_number?: string
          institution?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'bank' | 'credit_card' | 'cash' | 'investment'
          balance?: number
          currency?: string
          account_number?: string
          institution?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'bank' | 'credit_card' | 'cash' | 'investment'
          balance?: number
          currency?: string
          account_number?: string
          institution?: string
          created_at?: string
          updated_at?: string
        }
      }
      ai_recommendations: {
        Row: {
          id: string
          property_id: string
          type: 'revenue_improvement' | 'tax_saving' | 'maintenance' | 'investment' | 'risk_management'
          title: string
          description: string
          impact: 'high' | 'medium' | 'low'
          priority: number
          created_at: string
          updated_at: string
          estimated_savings?: number
          implementation_cost?: number
          timeline?: string
          status: 'pending' | 'implemented' | 'dismissed'
          user_id: string
        }
        Insert: {
          id?: string
          property_id: string
          type: 'revenue_improvement' | 'tax_saving' | 'maintenance' | 'investment' | 'risk_management'
          title: string
          description: string
          impact: 'high' | 'medium' | 'low'
          priority: number
          created_at?: string
          updated_at?: string
          estimated_savings?: number
          implementation_cost?: number
          timeline?: string
          status?: 'pending' | 'implemented' | 'dismissed'
          user_id: string
        }
        Update: {
          id?: string
          property_id?: string
          type?: 'revenue_improvement' | 'tax_saving' | 'maintenance' | 'investment' | 'risk_management'
          title?: string
          description?: string
          impact?: 'high' | 'medium' | 'low'
          priority?: number
          created_at?: string
          updated_at?: string
          estimated_savings?: number
          implementation_cost?: number
          timeline?: string
          status?: 'pending' | 'implemented' | 'dismissed'
          user_id?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'transaction' | 'recommendation' | 'system' | 'reminder'
          title: string
          message: string
          is_read: boolean
          created_at: string
          metadata?: Json
        }
        Insert: {
          id?: string
          user_id: string
          type: 'transaction' | 'recommendation' | 'system' | 'reminder'
          title: string
          message: string
          is_read?: boolean
          created_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'transaction' | 'recommendation' | 'system' | 'reminder'
          title?: string
          message?: string
          is_read?: boolean
          created_at?: string
          metadata?: Json
        }
      }
      ai_conversations: {
        Row: {
          id: string
          user_id: string
          messages: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          messages: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          messages?: Json
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          user_id: string
          property_id?: string | null
          transaction_id?: string | null
          name: string
          type: 'receipt' | 'contract' | 'tax_document' | 'insurance' | 'depreciation_schedule' | 'other'
          file_url?: string | null
          file_size?: number | null
          mime_type?: string | null
          description?: string | null
          ocr_text?: string | null
          is_reconciled_with_transaction?: boolean | null
          tax_year?: number | null
          document_category?: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          property_id?: string | null
          transaction_id?: string | null
          name: string
          type: 'receipt' | 'contract' | 'tax_document' | 'insurance' | 'depreciation_schedule' | 'other'
          file_url?: string | null
          file_size?: number | null
          mime_type?: string | null
          description?: string | null
          ocr_text?: string | null
          is_reconciled_with_transaction?: boolean | null
          tax_year?: number | null
          document_category?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          property_id?: string | null
          transaction_id?: string | null
          name?: string
          type?: 'receipt' | 'contract' | 'tax_document' | 'insurance' | 'depreciation_schedule' | 'other'
          file_url?: string | null
          file_size?: number | null
          mime_type?: string | null
          description?: string | null
          ocr_text?: string | null
          is_reconciled_with_transaction?: boolean | null
          tax_year?: number | null
          document_category?: string | null
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