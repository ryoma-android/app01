import React, { useState, useMemo, Fragment } from 'react';
import { TrendingUp, Download, BarChart3, PieChart as PieIcon, DollarSign, Home, ChevronsUpDown, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '../utils/format';
import { Property, Transaction } from '../types';
import { Listbox, Transition } from '@headlessui/react';

interface AnalyticsProps {
  properties: Property[];
  transactions: Transaction[];
}

const Analytics: React.FC<AnalyticsProps> = ({ properties = [], transactions = [] }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('12months');
  const [selectedPropertyId, setSelectedPropertyId] = useState('all');
  const [propertyPage, setPropertyPage] = useState(0);

  const PAGE_SIZE = 10;
  const formInputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 transition duration-150 ease-in-out focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white";
  const listboxButtonClass = `relative w-full cursor-default rounded-lg py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm ${formInputClass}`;

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (selectedPropertyId !== 'all') {
      filtered = filtered.filter(t => t.property_id === selectedPropertyId);
    }
    
    const periodInDays = {
      '6months': 180,
      '12months': 365,
      '24months': 730
    }[selectedPeriod] || 365;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodInDays);
    
    return filtered.filter(t => {
      const transactionDate = t.transaction_date || t.date;
      return transactionDate ? new Date(transactionDate) >= cutoffDate : false;
    });
  }, [transactions, selectedPropertyId, selectedPeriod]);

  const timeSeriesData = useMemo(() => {
    const monthlyData: { [key: string]: { income: number, expense: number, date: Date } } = {};

    filteredTransactions.forEach(t => {
      const transactionDate = t.transaction_date || t.date;
      if (!transactionDate) return;

      const date = new Date(transactionDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0, date: new Date(date.getFullYear(), date.getMonth(), 1) };
      }
      
      if (t.type === 'income') {
        monthlyData[monthKey].income += t.amount;
      } else {
        monthlyData[monthKey].expense += t.amount;
      }
    });
    
    const sortedMonths = Object.keys(monthlyData).sort((a,b) => monthlyData[a].date.getTime() - monthlyData[b].date.getTime());
    let cumulativeProfit = 0;
    
    return sortedMonths.map(monthKey => {
      const { income, expense } = monthlyData[monthKey];
      const netProfit = income - expense;
      cumulativeProfit += netProfit;
      return {
        month: monthKey,
        収入: income,
        支出: expense,
        純利益: netProfit,
        累積利益: cumulativeProfit
      };
    });
  }, [filteredTransactions]);
  
  const totalIncome = useMemo(() => filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);
  const totalExpenses = useMemo(() => filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);
  const totalNetProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? (totalNetProfit / totalIncome) * 100 : 0;
  
  const expenseBreakdown = useMemo(() => {
    const breakdown: { [category: string]: number } = {};
    filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
      const category = t.category || 'その他';
      if (!breakdown[category]) breakdown[category] = 0;
      breakdown[category] += t.amount;
    });
    return Object.entries(breakdown)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);
  
  const propertyFinancials = useMemo(() => {
    return properties.map(property => {
      const propTransactions = transactions.filter(t => t.property_id === property.id);
      const income = propTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expenses = propTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const netProfit = income - expenses;
      const roi = property.purchase_price ? (netProfit / property.purchase_price) * 100 : 0;
      return { property, income, expenses, netProfit, roi };
    }).sort((a,b) => b.netProfit - a.netProfit);
  }, [properties, transactions]);

  const pagedPropertyFinancials = useMemo(() => {
    return propertyFinancials.slice(propertyPage * PAGE_SIZE, (propertyPage + 1) * PAGE_SIZE);
  }, [propertyFinancials, propertyPage]);


  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">収支分析</h2>
          <p className="text-gray-500 mt-1 dark:text-gray-400">不動産ポートフォリオの財務状況を分析します。</p>
        </div>
        {/* --- フィルターUIの修正 --- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className={formInputClass}
          >
            <option value="6months">過去6ヶ月</option>
            <option value="12months">過去12ヶ月</option>
            <option value="24months">過去24ヶ月</option>
          </select>
          
          <div className="sm:col-span-1">
            <Listbox value={selectedPropertyId} onChange={setSelectedPropertyId}>
              <div className="relative w-full">
                <Listbox.Button className={listboxButtonClass}>
                  <span className="block truncate">{selectedPropertyId === 'all' ? 'すべての物件' : properties.find(p => p.id === selectedPropertyId)?.name}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronsUpDown
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </span>
                </Listbox.Button>
                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-gray-800 dark:ring-gray-600">
                     <Listbox.Option
                        key="all"
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-200'
                          }`
                        }
                        value="all"
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${
                                selected ? 'font-medium' : 'font-normal'
                              }`}
                            >
                              すべての物件
                            </span>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600 dark:text-blue-400">
                                <Check className="h-5 w-5" aria-hidden="true" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    {properties.map((property) => (
                      <Listbox.Option
                        key={property.id}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-200'
                          }`
                        }
                        value={property.id}
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${
                                selected ? 'font-medium' : 'font-normal'
                              }`}
                            >
                              {property.name}
                            </span>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600 dark:text-blue-400">
                                <Check className="h-5 w-5" aria-hidden="true" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>
          
          <button className="px-4 py-2 bg-gray-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-gray-800 transition-colors flex items-center justify-center">
            <Download className="w-4 h-4 mr-2" />
            レポート
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "総収入", value: totalIncome, icon: TrendingUp, color: "green" },
          { title: "総支出", value: totalExpenses, icon: DollarSign, color: "red" },
          { title: "純利益", value: totalNetProfit, icon: BarChart3, color: "blue" },
          { title: "利益率", value: profitMargin, unit: "%", icon: PieIcon, color: "purple" }
        ].map(metric => (
          <div key={metric.title} className={`bg-white rounded-2xl shadow-sm p-6 border-l-4 border-${metric.color}-500 dark:bg-gray-800`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{metric.title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {metric.unit === "%" ? `${metric.value.toFixed(1)}%` : formatCurrency(metric.value)}
                </p>
              </div>
              <div className={`w-12 h-12 bg-${metric.color}-100 rounded-full flex items-center justify-center dark:bg-${metric.color}-900`}>
                <metric.icon className={`w-6 h-6 text-${metric.color}-600 dark:text-${metric.color}-400`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm p-6 dark:bg-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 dark:text-white">収支推移</h3>
          {timeSeriesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={timeSeriesData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(value) => formatCurrency(Number(value))} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '1rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: number, name: string) => [formatCurrency(value), name]} 
                />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }} />
                <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <Area type="monotone" dataKey="収入" stroke="#22C55E" fill="url(#colorIncome)" strokeWidth={2} />
                <Area type="monotone" dataKey="支出" stroke="#F43F5E" fill="url(#colorExpense)" strokeWidth={2} />
                <Line type="monotone" dataKey="純利益" stroke="#3B82F6" strokeWidth={3} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px]">
              <BarChart3 className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500">表示するデータがありません</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 dark:bg-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 dark:text-white">支出内訳</h3>
          {expenseBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={expenseBreakdown} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={90} 
                  innerRadius={60}
                  paddingAngle={5}
                  fill="#8884d8" 
                  labelLine={false}
                >
                  {expenseBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [formatCurrency(value), '金額']} />
                <Legend iconSize={10} layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ lineHeight: '24px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px]">
              <PieIcon className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500">表示するデータがありません</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm mt-8 dark:bg-gray-800">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 dark:text-white">
            <Home className="w-5 h-5 text-gray-600" />
            物件別パフォーマンス
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-500 dark:text-gray-400">物件名</th>
                <th className="text-right py-3 px-6 font-medium text-gray-500 dark:text-gray-400">総収入</th>
                <th className="text-right py-3 px-6 font-medium text-gray-500 dark:text-gray-400">総支出</th>
                <th className="text-right py-3 px-6 font-medium text-gray-500 dark:text-gray-400">純利益</th>
                <th className="text-right py-3 px-6 font-medium text-gray-500 dark:text-gray-400">ROI</th>
              </tr>
            </thead>
            <tbody>
              {pagedPropertyFinancials.map((pf) => (
                <tr key={pf.property.id} className="border-t border-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{pf.property.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{pf.property.address}</p>
                    </div>
                  </td>
                  <td className="text-right py-4 px-6 font-medium text-green-600 dark:text-green-400">{formatCurrency(pf.income)}</td>
                  <td className="text-right py-4 px-6 font-medium text-red-600 dark:text-red-400">{formatCurrency(pf.expenses)}</td>
                  <td className="text-right py-4 px-6 font-bold text-blue-600 dark:text-blue-400">{formatCurrency(pf.netProfit)}</td>
                  <td className="text-right py-4 px-6 font-medium text-gray-900 dark:text-gray-300">{pf.roi.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {propertyFinancials.length > PAGE_SIZE && (
            <div className="flex justify-center items-center gap-4 p-4 border-t border-gray-100 dark:border-gray-700">
              <button 
                onClick={() => setPropertyPage(p => Math.max(0, p - 1))} 
                disabled={propertyPage === 0} 
                className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full font-semibold text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus:ring-gray-500"
              >
                <span className="sr-only">前へ</span>
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                ページ {propertyPage + 1} / {Math.ceil(propertyFinancials.length / PAGE_SIZE)}
              </span>
              <button 
                onClick={() => setPropertyPage(p => p + 1)} 
                disabled={(propertyPage + 1) * PAGE_SIZE >= propertyFinancials.length} 
                className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full font-semibold text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus:ring-gray-500"
              >
                <span className="sr-only">次へ</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;