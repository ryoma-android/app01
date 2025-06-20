export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  type: 'apartment' | 'house' | 'commercial' | 'land';
  purchase_price: number;
  purchase_date: string;
  monthly_rent: number;
  user_id: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  property_id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  created_at: string;
}

export interface AIRecommendation {
  id: string;
  property_id: string;
  type: 'revenue_improvement' | 'tax_saving' | 'maintenance' | 'investment';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  priority: number;
  created_at: string;
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
}