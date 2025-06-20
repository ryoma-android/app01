import { Property, Transaction, AIRecommendation, PropertyFinancials } from '../types';

export const mockProperties: Property[] = [
  {
    id: '1',
    name: 'アパートA',
    address: '東京都渋谷区神宮前1-1-1',
    type: 'apartment',
    purchase_price: 50000000,
    purchase_date: '2022-01-15',
    monthly_rent: 120000,
    user_id: 'user1',
    created_at: '2022-01-15T00:00:00.000Z'
  },
  {
    id: '2',
    name: 'マンションB',
    address: '東京都新宿区新宿2-2-2',
    type: 'apartment',
    purchase_price: 35000000,
    purchase_date: '2021-06-10',
    monthly_rent: 95000,
    user_id: 'user1',
    created_at: '2021-06-10T00:00:00.000Z'
  },
  {
    id: '3',
    name: '戸建てC',
    address: '神奈川県横浜市港北区3-3-3',
    type: 'house',
    purchase_price: 42000000,
    purchase_date: '2023-03-20',
    monthly_rent: 110000,
    user_id: 'user1',
    created_at: '2023-03-20T00:00:00.000Z'
  }
];

export const mockTransactions: Transaction[] = [
  // アパートA
  { id: '1', property_id: '1', type: 'income', category: '家賃収入', amount: 120000, description: '1月分家賃', date: '2024-01-01', created_at: '2024-01-01T00:00:00.000Z' },
  { id: '2', property_id: '1', type: 'expense', category: '修繕費', amount: 50000, description: '水道修理', date: '2024-01-15', created_at: '2024-01-15T00:00:00.000Z' },
  { id: '3', property_id: '1', type: 'expense', category: '管理費', amount: 25000, description: '管理会社手数料', date: '2024-01-01', created_at: '2024-01-01T00:00:00.000Z' },
  
  // マンションB
  { id: '4', property_id: '2', type: 'income', category: '家賃収入', amount: 95000, description: '1月分家賃', date: '2024-01-01', created_at: '2024-01-01T00:00:00.000Z' },
  { id: '5', property_id: '2', type: 'expense', category: '水道光熱費', amount: 15000, description: '共益費', date: '2024-01-10', created_at: '2024-01-10T00:00:00.000Z' },
  
  // 戸建てC
  { id: '6', property_id: '3', type: 'income', category: '家賃収入', amount: 110000, description: '1月分家賃', date: '2024-01-01', created_at: '2024-01-01T00:00:00.000Z' },
  { id: '7', property_id: '3', type: 'expense', category: '修繕費', amount: 80000, description: 'エアコン交換', date: '2024-01-20', created_at: '2024-01-20T00:00:00.000Z' }
];

export const mockRecommendations: AIRecommendation[] = [
  {
    id: '1',
    property_id: '1',
    type: 'revenue_improvement',
    title: '家賃増額の検討',
    description: '周辺相場と比較して家賃が5-8%低い可能性があります。リノベーション後の家賃見直しを検討してください。',
    impact: 'high',
    priority: 1,
    created_at: '2024-01-25T00:00:00.000Z'
  },
  {
    id: '2',
    property_id: '1',
    type: 'tax_saving',
    title: '修繕費の適切な計上',
    description: '今期の修繕費が高額です。資本的支出との区分を確認し、適切な経費計上で節税効果を最大化しましょう。',
    impact: 'medium',
    priority: 2,
    created_at: '2024-01-25T00:00:00.000Z'
  },
  {
    id: '3',
    property_id: '2',
    type: 'maintenance',
    title: '定期点検の実施',
    description: '築年数を考慮すると、予防的メンテナンスで大規模修繕を避けることができます。',
    impact: 'medium',
    priority: 3,
    created_at: '2024-01-25T00:00:00.000Z'
  },
  {
    id: '4',
    property_id: '3',
    type: 'investment',
    title: 'エネルギー効率改善',
    description: '断熱改修により光熱費削減と家賃競争力向上が期待できます。投資回収期間は約3年と試算されます。',
    impact: 'high',
    priority: 1,
    created_at: '2024-01-25T00:00:00.000Z'
  }
];

export const generatePropertyFinancials = (property: Property): PropertyFinancials => {
  const propertyTransactions = mockTransactions.filter(t => t.property_id === property.id);
  
  const monthly_income = propertyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const monthly_expenses = propertyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const annual_income = monthly_income * 12;
  const annual_expenses = monthly_expenses * 12;
  const net_profit = annual_income - annual_expenses;
  const roi = (net_profit / property.purchase_price) * 100;
  const occupancy_rate = 95; // Mock data

  return {
    property,
    monthly_income,
    monthly_expenses,
    annual_income,
    annual_expenses,
    net_profit,
    roi,
    occupancy_rate
  };
};