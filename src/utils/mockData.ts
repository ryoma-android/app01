import { Property, Transaction, AIRecommendation, PropertyFinancials, DashboardMetrics, Account } from '../types';

export const generatePropertyFinancials = (property: Property, transactions: Transaction[]): PropertyFinancials => {
  const propertyTransactions = transactions.filter(t => t.property_id === property.id);
  
  const monthly_income = propertyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const monthly_expenses = propertyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const annual_income = monthly_income * 12;
  const annual_expenses = monthly_expenses * 12;
  const net_profit = annual_income - annual_expenses;
  const roi = property.purchase_price ? (net_profit / property.purchase_price) * 100 : 0;
  const occupancy_rate = 95; // Mock data

  // 追加の計算
  const cash_flow = monthly_income - monthly_expenses;
  const cap_rate = property.purchase_price ? (annual_income / property.purchase_price) * 100 : 0;
  const appreciation_rate = 2.5; // 年2.5%の価格上昇を想定

  return {
    property,
    monthly_income,
    monthly_expenses,
    annual_income,
    annual_expenses,
    net_profit,
    roi,
    occupancy_rate,
    cash_flow,
    cap_rate,
    appreciation_rate
  };
};

// ダッシュボードメトリクスの計算
export const calculateDashboardMetrics = (properties: Property[], transactions: Transaction[]): DashboardMetrics => {
  const propertyFinancials = properties.map(property => generatePropertyFinancials(property, transactions));
  
  const total_properties = properties.length;
  const total_monthly_income = propertyFinancials.reduce((sum, pf) => sum + pf.monthly_income, 0);
  const total_monthly_expenses = propertyFinancials.reduce((sum, pf) => sum + pf.monthly_expenses, 0);
  const total_net_profit = total_monthly_income - total_monthly_expenses;
  const average_roi = propertyFinancials.length > 0 ? propertyFinancials.reduce((sum, pf) => sum + pf.roi, 0) / propertyFinancials.length : 0;
  const total_portfolio_value = properties.reduce((sum, p) => sum + (p.purchase_price || 0), 0);
  const monthly_cash_flow = total_net_profit;

  return {
    total_properties,
    total_monthly_income,
    total_monthly_expenses,
    total_net_profit,
    average_roi,
    total_portfolio_value,
    monthly_cash_flow
  };
};

// パーセンテージフォーマット関数
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};