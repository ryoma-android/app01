export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: 'bank' | 'credit_card' | 'cash' | 'investment';
  balance: number;
  currency: string;
  institution?: string;
  account_number?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  property_type: 'apartment' | 'house' | 'commercial' | 'land';
  purchase_price: number;
  current_value?: number;
  purchase_date: string;
  monthly_rent?: number;
  owner_id: string;
  created_at: string;
  updated_at: string;
  // 追加フィールド
  land_cost?: number;
  building_cost?: number;
  property_tax?: number;
  insurance_cost?: number;
  management_fee?: number;
  building_structure?: string;
  useful_life?: number;
  sqm_area?: number;
  building_year?: number;
  floors?: number;
  rooms?: number;
  description?: string;
}

export interface Transaction {
  id: string;
  property_id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  transaction_date: string;
  date?: string; // 後方互換性のため
  created_at: string;
  updated_at: string;
  // 追加フィールド
  receipt_url?: string;
  tags?: string[];
  is_recurring?: boolean;
  recurring_interval?: 'monthly' | 'quarterly' | 'yearly';
  account_id?: string;
  is_manual_entry?: boolean;
  is_auto_generated?: boolean;
}

export interface AIRecommendation {
  id: string;
  property_id: string;
  type: 'revenue_improvement' | 'tax_saving' | 'maintenance' | 'investment' | 'risk_management';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  priority: number;
  created_at: string;
  updated_at: string;
  // 追加フィールド
  estimated_savings?: number;
  implementation_cost?: number;
  timeline?: string;
  status: 'pending' | 'implemented' | 'dismissed';
}

export interface PropertyFinancials {
  property: Property;
  monthly_income: number;
  monthly_expenses: number;
  annual_income: number;
  annual_expenses: number;
  net_profit: number;
  roi: number;
  occupancy_rate: number;
  // 追加フィールド
  cash_flow: number;
  cap_rate: number;
  appreciation_rate: number;
}

// 新規追加の型定義
export interface DashboardMetrics {
  total_properties: number;
  total_monthly_income: number;
  total_monthly_expenses: number;
  total_net_profit: number;
  average_roi: number;
  total_portfolio_value: number;
  monthly_cash_flow: number;
}

export interface AIConversation {
  id: string;
  user_id: string;
  messages: AIMessage[];
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    property_id?: string;
    transaction_id?: string;
    recommendation_id?: string;
  };
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'transaction' | 'recommendation' | 'system' | 'reminder';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata?: {
    property_id?: string;
    transaction_id?: string;
    recommendation_id?: string;
  };
}

// 認証関連の型定義
export interface User {
  id: string;
  email: string;
  full_name?: string;
  plan_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  full_name: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  success: string | null;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}