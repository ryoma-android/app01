'use client'

import React from 'react';
import { Property, Transaction, Account } from '../types';
import { formatCurrency, formatDate } from '../utils/mockData';

interface DashboardProps {
  properties: Property[];
  transactions: Transaction[];
  accounts: Account[];
}

const Dashboard: React.FC<DashboardProps> = ({ properties, transactions, accounts }) => {
  // 物件別の収支計算
  const propertyFinancials = properties.map(property => {
    const propertyTransactions = transactions.filter(t => t.property_id === property.id);
    const income = propertyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = propertyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      property,
      income,
      expenses,
      netProfit: income - expenses
    };
  });

  // 総計計算
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalNetProfit = totalIncome - totalExpenses;

  return (
    <div className="p-6 space-y-8">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">不動産投資ダッシュボード</h1>
        <p className="text-gray-600">物件と取引の概要</p>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">物件数</h3>
          <p className="text-2xl font-bold text-gray-900">{properties.length}件</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">総収入</h3>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">総支出</h3>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">純利益</h3>
          <p className={`text-2xl font-bold ${totalNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(totalNetProfit)}
          </p>
        </div>
      </div>

      {/* 物件一覧 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">物件一覧</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {propertyFinancials.map(({ property, income, expenses, netProfit }) => (
              <div key={property.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{property.name}</h3>
                    <p className="text-sm text-gray-500">{property.address}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    netProfit >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {netProfit >= 0 ? '黒字' : '赤字'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">収入</p>
                    <p className="font-medium text-green-600">{formatCurrency(income)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">支出</p>
                    <p className="font-medium text-red-600">{formatCurrency(expenses)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">純利益</p>
                    <p className={`font-medium ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(netProfit)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 口座一覧 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">口座一覧</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {accounts.map(account => (
              <div key={account.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{account.name}</h3>
                    <p className="text-sm text-gray-500">{account.institution}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(account.balance)}
                    </p>
                    <p className="text-xs text-gray-500">{account.type}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 最近の取引 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">最近の取引</h2>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {transactions.slice(0, 10).map(transaction => {
              const property = properties.find(p => p.id === transaction.property_id);
              return (
                <div key={transaction.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-500">
                      {property?.name} • {transaction.category} • {formatDate(transaction.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;