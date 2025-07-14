import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// 型安全なクエリヘルパー
export const createQueryHelper = () => {
  return {
    // ユーザー関連
    users: () => supabase.from('users').select('*'),
    userById: (id: string) => supabase.from('users').select('*').eq('id', id).single(),
    
    // 物件関連
    properties: () => supabase.from('properties').select('*'),
    propertiesByUserId: (userId: string) => 
      supabase.from('properties').select('*').eq('owner_id', userId),
    propertyById: (id: string) => 
      supabase.from('properties').select('*').eq('id', id).single(),
    
    // 取引関連
    transactions: () => supabase.from('transactions').select('*'),
    transactionsByPropertyId: (propertyId: string) => 
      supabase.from('transactions').select('*').eq('property_id', propertyId),
    transactionsByUserId: (userId: string) => 
      supabase.from('transactions').select('*').eq('user_id', userId),
    
    // AI推奨事項関連
    recommendations: () => supabase.from('ai_recommendations').select('*'),
    recommendationsByPropertyId: (propertyId: string) => 
      supabase.from('ai_recommendations').select('*').eq('property_id', propertyId),
    recommendationsByUserId: (userId: string) => 
      supabase.from('ai_recommendations').select('*').eq('user_id', userId),
    
    // 通知関連
    notifications: () => supabase.from('notifications').select('*'),
    notificationsByUserId: (userId: string) => 
      supabase.from('notifications').select('*').eq('user_id', userId),
    
    // AI会話関連
    conversations: () => supabase.from('ai_conversations').select('*'),
    conversationsByUserId: (userId: string) => 
      supabase.from('ai_conversations').select('*').eq('user_id', userId),
  }
}

// リアルタイムサブスクリプション
export const createRealtimeSubscriptions = () => {
  return {
    // 物件の変更を監視
    properties: (userId: string, callback: (payload: any) => void) => 
      supabase
        .channel('properties')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'properties', filter: `user_id=eq.${userId}` }, 
          callback
        )
        .subscribe(),
    
    // 取引の変更を監視
    transactions: (userId: string, callback: (payload: any) => void) => 
      supabase
        .channel('transactions')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` }, 
          callback
        )
        .subscribe(),
    
    // AI推奨事項の変更を監視
    recommendations: (userId: string, callback: (payload: any) => void) => 
      supabase
        .channel('recommendations')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'ai_recommendations', filter: `user_id=eq.${userId}` }, 
          callback
        )
        .subscribe(),
  }
}

// 認証ヘルパー
export const auth = {
  signUp: async (email: string, password: string) => {
    return await supabase.auth.signUp({
      email,
      password,
    })
  },
  
  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    })
  },
  
  signOut: async () => {
    return await supabase.auth.signOut()
  },
  
  getCurrentUser: async () => {
    return await supabase.auth.getUser()
  },
  
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  },
}

// ストレージヘルパー
export const storage = {
  uploadFile: async (bucket: string, path: string, file: File) => {
    return await supabase.storage.from(bucket).upload(path, file)
  },
  
  getPublicUrl: (bucket: string, path: string) => {
    return supabase.storage.from(bucket).getPublicUrl(path)
  },
  
  deleteFile: async (bucket: string, path: string) => {
    return await supabase.storage.from(bucket).remove([path])
  },
}

export default supabase 