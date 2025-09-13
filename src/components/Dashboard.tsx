'use client'

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Property, Transaction, Account } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { Home, TrendingUp, Banknote, FileText, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Portal from './Portal';
import { AddPropertyModal } from './AddPropertyModal';
import { PropertyDetailModal } from './PropertyDetailModal';

const Dashboard: React.FC = () => {
  const { data: properties, error: propertiesError, isLoading: isLoadingProperties, mutate: mutateProperties } = useSWR<Property[]>('/api/properties');
  const { data: transactions, error: transactionsError, isLoading: isLoadingTransactions } = useSWR<Transaction[]>('/api/transactions');
  const { data: accounts, error: accountsError, isLoading: isLoadingAccounts } = useSWR<Account[]>('/api/accounts');


  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Property | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 物件別の収支計算
  const { propertyFinancials, totalIncome, totalExpenses, totalNetProfit } = useMemo(() => {
    const transactionsByProperty = new Map<string, { income: number; expenses: number }>();
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const t of transactions || []) {
      if (!t.property_id) continue;

      if (!transactionsByProperty.has(t.property_id)) {
        transactionsByProperty.set(t.property_id, { income: 0, expenses: 0 });
      }
      const financials = transactionsByProperty.get(t.property_id)!;

      if (t.type === 'income') {
        financials.income += t.amount;
        totalIncome += t.amount;
      } else if (t.type === 'expense') {
        financials.expenses += t.amount;
        totalExpenses += t.amount;
      }
    }

    const uniqueProperties = Array.from(new Map(properties?.map(p => [p.id, p]) || []).values());
    const propertyFinancials = uniqueProperties.map(property => {
      const financials = transactionsByProperty.get(property.id) || { income: 0, expenses: 0 };
      return {
        property,
        income: financials.income,
        expenses: financials.expenses,
        netProfit: financials.income - financials.expenses
      };
    });
    
    const totalNetProfit = totalIncome - totalExpenses;

    return { propertyFinancials, totalIncome, totalExpenses, totalNetProfit };
  }, [properties, transactions]);

  const PAGE_SIZE = 10;
  const [propertyPage, setPropertyPage] = useState(0);
  const [accountPage, setAccountPage] = useState(0);

  const pagedPropertyFinancials = propertyFinancials.slice(propertyPage * PAGE_SIZE, (propertyPage + 1) * PAGE_SIZE);
  const pagedAccounts = accounts?.slice(accountPage * PAGE_SIZE, (accountPage + 1) * PAGE_SIZE) || [];

  const formInputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 transition duration-150 ease-in-out focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500";
  const formSelectClass = `${formInputClass} pr-10`;
  const formTextareaClass = `${formInputClass} min-h-[80px]`;

  const handleOpenAddModal = () => setIsAddModalOpen(true);
  const handleCloseAddModal = () => setIsAddModalOpen(false);

  const handlePropertyAdded = (newProperty: Property) => {
    mutateProperties((currentProperties = []) => [newProperty, ...currentProperties], false);
    handleCloseAddModal();
    // Vectorization API call
    fetch('/api/generate-embedding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId: newProperty.id }),
    }).catch(err => console.error('Failed to generate embedding:', err));
  };
  
  const handleSelectProperty = (property: Property) => {
    setSelectedProperty(property);
    setEditForm(property);
    setIsEditMode(false);
  };

  const handleSetProperties = (updatedProperties: Property[] | ((prev: Property[]) => Property[])) => {
    if (typeof updatedProperties === 'function') {
      mutateProperties(current => updatedProperties(current ?? []), false);
    } else {
      mutateProperties(updatedProperties, false);
    }
  };

  const isLoading = isLoadingProperties || isLoadingTransactions || isLoadingAccounts;
  const error = propertiesError || transactionsError || accountsError;

  if (error) return <div className="p-6 text-destructive">データの読み込みに失敗しました: {error.message}</div>;

  if (isLoading) {
    return (
      <div className="p-6 space-y-10 max-w-6xl mx-auto animate-pulse">
        <div className="bg-muted rounded-2xl h-32 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-muted rounded-2xl h-24"></div>
          <div className="bg-muted rounded-2xl h-24"></div>
          <div className="bg-muted rounded-2xl h-24"></div>
          <div className="bg-muted rounded-2xl h-24"></div>
        </div>
        <div className="bg-muted rounded-2xl h-96"></div>
      </div>
    );
  }

  const validProperties = properties || [];
  const validTransactions = transactions || [];
  const validAccounts = accounts || [];

  return (
    <>
      <div className="p-6 space-y-10 max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-8 flex flex-col sm:flex-row justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <Home className="w-7 h-7 text-white" /> 不動産投資ダッシュボード
            </h1>
            <p className="text-blue-100 text-base">物件と取引の概要</p>
          </div>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="rounded-2xl shadow bg-gradient-to-br from-blue-100 to-blue-50 p-6 flex flex-col items-center">
            <Home className="w-8 h-8 text-blue-500 mb-2" />
            <h3 className="text-sm font-medium text-blue-700">物件数</h3>
            <p className="text-2xl font-bold text-blue-900 mt-1">{validProperties.length}件</p>
          </div>
          <div className="rounded-2xl shadow bg-gradient-to-br from-green-100 to-green-50 p-6 flex flex-col items-center">
            <TrendingUp className="w-8 h-8 text-green-500 mb-2" />
            <h3 className="text-sm font-medium text-green-700">総収入</h3>
            <p className="text-2xl font-bold text-green-900 mt-1">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="rounded-2xl shadow bg-gradient-to-br from-red-100 to-red-50 p-6 flex flex-col items-center">
            <Banknote className="w-8 h-8 text-red-500 mb-2" />
            <h3 className="text-sm font-medium text-red-700">総支出</h3>
            <p className="text-2xl font-bold text-red-900 mt-1">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className={`rounded-2xl shadow bg-gradient-to-br from-purple-100 to-purple-50 p-6 flex flex-col items-center ${totalNetProfit >= 0 ? '' : 'opacity-90'}`}>
            <FileText className="w-8 h-8 text-purple-500 mb-2" />
            <h3 className="text-sm font-medium text-purple-700">純利益</h3>
            <p className={`text-2xl font-bold mt-1 ${totalNetProfit >= 0 ? 'text-purple-900' : 'text-red-700'}`}>{formatCurrency(totalNetProfit)}</p>
          </div>
        </div>

        {/* 物件一覧 */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">物件一覧</h2>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
            >
              物件を追加
            </button>
          </div>
          <div className="p-6 space-y-4">
            {pagedPropertyFinancials.map(({ property, income, expenses, netProfit }) => (
              <div key={property.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleSelectProperty(property)}>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{property.name}</h3>
                  <p className="text-sm text-gray-500 mb-1">{property.address}</p>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>購入価格: {formatCurrency(property.purchase_price)}</span>
                    <span>購入日: {property.purchase_date}</span>
                  </div>
                </div>
                <div className="flex gap-6 items-center">
                  <div className="text-center">
                    <div className="text-xs text-gray-500">収入</div>
                    <div className="font-bold text-green-600">{formatCurrency(income)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">支出</div>
                    <div className="font-bold text-red-600">{formatCurrency(expenses)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">純利益</div>
                    <div className={`font-bold ${netProfit >= 0 ? 'text-purple-700' : 'text-red-700'}`}>{formatCurrency(netProfit)}</div>
                  </div>
                </div>
              </div>
            ))}
            {/* ページ送り */}
            <div className="flex justify-center items-center gap-4 mt-6">
              <button 
                onClick={() => setPropertyPage(p => Math.max(0, p - 1))} 
                disabled={propertyPage === 0} 
                className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full font-semibold text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <span className="sr-only">前へ</span>
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium text-gray-700">
                ページ {propertyPage + 1} / {Math.ceil(propertyFinancials.length / PAGE_SIZE)}
              </span>
              <button 
                onClick={() => setPropertyPage(p => p + 1)} 
                disabled={(propertyPage + 1) * PAGE_SIZE >= propertyFinancials.length} 
                className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full font-semibold text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <span className="sr-only">次へ</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 口座一覧 */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">口座一覧</h2>
            <span className="text-xs text-gray-400">{validAccounts.length}件中 {pagedAccounts.length}件表示</span>
          </div>
          <div className="p-6 space-y-4">
            {pagedAccounts.map(account => (
              <div key={account.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:shadow-md transition-shadow">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{account.name}</h3>
                  <p className="text-sm text-gray-500 mb-1">{account.institution}</p>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>口座番号: {account.account_number || '-'}</span>
                    <span>通貨: {account.currency}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(account.balance)}</div>
                  <div className="text-xs text-gray-500">{account.type}</div>
                </div>
              </div>
            ))}
            {/* ページ送り */}
            <div className="flex justify-center items-center gap-4 mt-6">
               <button 
                onClick={() => setAccountPage(p => Math.max(0, p - 1))} 
                disabled={accountPage === 0} 
                className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full font-semibold text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <span className="sr-only">前へ</span>
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium text-gray-700">
                ページ {accountPage + 1} / {Math.ceil(validAccounts.length / PAGE_SIZE)}
              </span>
              <button 
                onClick={() => setAccountPage(p => p + 1)} 
                disabled={(accountPage + 1) * PAGE_SIZE >= validAccounts.length} 
                className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full font-semibold text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <span className="sr-only">次へ</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 最近の取引 */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">最近の取引</h2>
            <span className="text-xs text-gray-400">最新10件</span>
          </div>
          <div className="p-6 space-y-3">
            {validTransactions.slice(0, 10).map(transaction => {
              const property = validProperties.find(p => p.id === transaction.property_id);
              return (
                <div key={transaction.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-gray-100 last:border-b-0 gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-base">{transaction.description}</p>
                    <p className="text-sm text-gray-500">
                      {property?.name} • {transaction.category} • {formatDate(transaction.date || '')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <Portal>
        {isAddModalOpen && (
          <AddPropertyModal 
            isOpen={isAddModalOpen} 
            onClose={handleCloseAddModal} 
            onPropertyAdded={handlePropertyAdded} 
          />
        )}

        {selectedProperty && editForm && (
          <PropertyDetailModal
            property={editForm}
            isOpen={!!selectedProperty}
            onClose={() => setSelectedProperty(null)}
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
            setEditForm={setEditForm}
            setProperties={handleSetProperties}
          />
        )}
      </Portal>
    </>
  );
};

export default Dashboard;