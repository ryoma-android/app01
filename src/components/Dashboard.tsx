import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Building, AlertCircle, CheckCircle, Info, Play, Brain, Plus, BarChart3, MessageSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { mockProperties, generatePropertyFinancials } from '../utils/mockData';

const Dashboard: React.FC = () => {
  const [showTour, setShowTour] = useState(false);
  const propertyFinancials = mockProperties.map(generatePropertyFinancials);
  
  const totalMonthlyIncome = propertyFinancials.reduce((sum, pf) => sum + pf.monthly_income, 0);
  const totalMonthlyExpenses = propertyFinancials.reduce((sum, pf) => sum + pf.monthly_expenses, 0);
  const totalNetProfit = totalMonthlyIncome - totalMonthlyExpenses;
  const averageROI = propertyFinancials.reduce((sum, pf) => sum + pf.roi, 0) / propertyFinancials.length;

  const chartData = propertyFinancials.map(pf => ({
    name: pf.property.name,
    収入: pf.monthly_income,
    支出: pf.monthly_expenses,
    純利益: pf.monthly_income - pf.monthly_expenses
  }));

  const pieData = propertyFinancials.map((pf, index) => ({
    name: pf.property.name,
    value: pf.monthly_income,
    color: ['#3B82F6', '#059669', '#D97706', '#8B5CF6'][index % 4]
  }));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const WelcomeBanner = () => (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold mb-2">「次の一手」へようこそ！ 🏠</h3>
          <p className="text-blue-100 mb-4">
            あなたの不動産投資をAIがサポートします。現在の収支状況をご確認ください。
          </p>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowTour(true)}
              className="flex items-center px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
            >
              <Play className="w-4 h-4 mr-2" />
              使い方を見る
            </button>
            <span className="text-blue-100 text-sm">
              {propertyFinancials.length}件の物件 • 月間利益 {formatCurrency(totalNetProfit)}
            </span>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <Building className="w-12 h-12 text-white" />
          </div>
        </div>
      </div>
    </div>
  );

  const MetricCard = ({ title, value, change, icon: Icon, color, description, isGood }: any) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className={`text-sm font-medium ${isGood ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
          <span className="text-gray-500 text-sm ml-2">先月比</span>
        </div>
        <div className="group relative">
          <Info className="w-4 h-4 text-gray-400 cursor-help" />
          <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {description}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <WelcomeBanner />

      {/* 重要な数字 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="月間収入"
          value={formatCurrency(totalMonthlyIncome)}
          change={5.2}
          icon={TrendingUp}
          color="bg-green-500"
          description="全物件からの家賃収入の合計です"
          isGood={true}
        />
        <MetricCard
          title="月間支出"
          value={formatCurrency(totalMonthlyExpenses)}
          change={2.1}
          icon={TrendingDown}
          color="bg-red-500"
          description="修繕費、管理費、税金などの支出合計です"
          isGood={false}
        />
        <MetricCard
          title="月間利益"
          value={formatCurrency(totalNetProfit)}
          change={8.7}
          icon={DollarSign}
          color="bg-blue-500"
          description="収入から支出を引いた実際の利益です"
          isGood={true}
        />
        <MetricCard
          title="平均利回り"
          value={`${averageROI.toFixed(1)}%`}
          change={1.2}
          icon={Building}
          color="bg-purple-500"
          description="投資額に対する年間利益の割合です"
          isGood={true}
        />
      </div>

      {/* かんたん操作 */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">よく使う機能</h3>
        <p className="text-gray-500 text-sm mb-4">クリックするだけで簡単に操作できます</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left group">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-medium text-gray-900">物件を追加</div>
              <div className="text-sm text-gray-500">新しい物件を登録します</div>
            </div>
          </button>
          <button className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left group">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-medium text-gray-900">詳しい分析を見る</div>
              <div className="text-sm text-gray-500">グラフで収支を確認</div>
            </div>
          </button>
          <button className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left group">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-medium text-gray-900">AIに相談する</div>
              <div className="text-sm text-gray-500">改善のアドバイスを受ける</div>
            </div>
          </button>
        </div>
      </div>

      {/* グラフ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">物件別の収支</h3>
            <div className="flex items-center text-sm text-gray-500">
              <Info className="w-4 h-4 mr-1" />
              月間の比較
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="収入" fill="#3B82F6" name="収入" />
              <Bar dataKey="支出" fill="#EF4444" name="支出" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">収入の内訳</h3>
            <div className="flex items-center text-sm text-gray-500">
              <Info className="w-4 h-4 mr-1" />
              物件別の割合
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 物件一覧 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">あなたの物件</h3>
            <span className="text-sm text-gray-500">{propertyFinancials.length}件の物件</span>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {propertyFinancials.map((pf) => (
              <div key={pf.property.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{pf.property.name}</h4>
                    <p className="text-sm text-gray-500">{pf.property.address}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-8 text-right">
                  <div>
                    <p className="text-sm text-gray-500">月間収入</p>
                    <p className="font-medium text-green-600">{formatCurrency(pf.monthly_income)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">月間支出</p>
                    <p className="font-medium text-red-600">{formatCurrency(pf.monthly_expenses)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">利回り</p>
                    <p className="font-medium text-gray-900">{pf.roi.toFixed(1)}%</p>
                  </div>
                  <div className="flex items-center">
                    {pf.roi > 5 ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-5 h-5 mr-1" />
                        <span className="text-sm font-medium">良好</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-yellow-600">
                        <AlertCircle className="w-5 h-5 mr-1" />
                        <span className="text-sm font-medium">要確認</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;