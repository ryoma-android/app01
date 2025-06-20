import React, { useState } from 'react';
import { TrendingUp, Download, Calendar, Filter } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { mockProperties, generatePropertyFinancials } from '../utils/mockData';

const Analytics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('12months');
  const [selectedProperty, setSelectedProperty] = useState('all');

  const propertyFinancials = mockProperties.map(generatePropertyFinancials);

  // Generate mock time series data
  const generateTimeSeriesData = () => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    return months.map((month, index) => ({
      month,
      収入: 320000 + Math.random() * 50000,
      支出: 150000 + Math.random() * 30000,
      純利益: 170000 + Math.random() * 20000,
      累積利益: (index + 1) * 170000 + Math.random() * 50000
    }));
  };

  const timeSeriesData = generateTimeSeriesData();

  const expenseBreakdown = [
    { category: '修繕費', amount: 150000, percentage: 35 },
    { category: '管理費', amount: 100000, percentage: 23 },
    { category: '水道光熱費', amount: 80000, percentage: 19 },
    { category: '保険料', amount: 50000, percentage: 12 },
    { category: 'その他', amount: 50000, percentage: 11 }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">収支分析</h2>
          <p className="text-gray-500 mt-1">詳細な財務分析とトレンド</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="6months">過去6ヶ月</option>
            <option value="12months">過去12ヶ月</option>
            <option value="24months">過去24ヶ月</option>
          </select>
          
          <select 
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">すべての物件</option>
            {mockProperties.map(property => (
              <option key={property.id} value={property.id}>{property.name}</option>
            ))}
          </select>
          
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            レポート出力
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">年間総収入</p>
              <p className="text-2xl font-bold text-gray-900">¥3,900,000</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-green-600 text-sm font-medium">+12.5%</span>
            <span className="text-gray-500 text-sm ml-2">前年比</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">年間総支出</p>
              <p className="text-2xl font-bold text-gray-900">¥1,800,000</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-red-600 text-sm font-medium">+8.2%</span>
            <span className="text-gray-500 text-sm ml-2">前年比</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">年間純利益</p>
              <p className="text-2xl font-bold text-gray-900">¥2,100,000</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-green-600 text-sm font-medium">+15.8%</span>
            <span className="text-gray-500 text-sm ml-2">前年比</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">利益率</p>
              <p className="text-2xl font-bold text-gray-900">53.8%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-green-600 text-sm font-medium">+2.1%</span>
            <span className="text-gray-500 text-sm ml-2">前年比</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Trend */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">収支推移</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Line type="monotone" dataKey="収入" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="支出" stroke="#EF4444" strokeWidth={2} />
              <Line type="monotone" dataKey="純利益" stroke="#059669" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cumulative Profit */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">累積利益</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Area type="monotone" dataKey="累積利益" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">支出内訳</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={expenseBreakdown} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="category" type="category" width={80} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="amount" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Property Comparison */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">物件別比較</h3>
          <div className="space-y-4">
            {propertyFinancials.map((pf, index) => (
              <div key={pf.property.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{pf.property.name}</h4>
                  <p className="text-sm text-gray-500">ROI: {pf.roi.toFixed(1)}%</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatCurrency(pf.net_profit)}</p>
                  <p className="text-sm text-gray-500">年間純利益</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">詳細レポート</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-500">物件名</th>
                <th className="text-right py-3 px-6 font-medium text-gray-500">月間収入</th>
                <th className="text-right py-3 px-6 font-medium text-gray-500">月間支出</th>
                <th className="text-right py-3 px-6 font-medium text-gray-500">純利益</th>
                <th className="text-right py-3 px-6 font-medium text-gray-500">ROI</th>
                <th className="text-right py-3 px-6 font-medium text-gray-500">入居率</th>
              </tr>
            </thead>
            <tbody>
              {propertyFinancials.map((pf) => (
                <tr key={pf.property.id} className="border-t border-gray-100">
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-900">{pf.property.name}</p>
                      <p className="text-sm text-gray-500">{pf.property.address}</p>
                    </div>
                  </td>
                  <td className="text-right py-4 px-6 font-medium text-gray-900">
                    {formatCurrency(pf.monthly_income)}
                  </td>
                  <td className="text-right py-4 px-6 font-medium text-gray-900">
                    {formatCurrency(pf.monthly_expenses)}
                  </td>
                  <td className="text-right py-4 px-6 font-medium text-green-600">
                    {formatCurrency(pf.monthly_income - pf.monthly_expenses)}
                  </td>
                  <td className="text-right py-4 px-6 font-medium text-gray-900">
                    {pf.roi.toFixed(1)}%
                  </td>
                  <td className="text-right py-4 px-6 font-medium text-gray-900">
                    {pf.occupancy_rate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;