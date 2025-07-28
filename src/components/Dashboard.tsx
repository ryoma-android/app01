'use client'

import React, { useState } from 'react';
import { Property, Transaction, Account } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import UsageGuide from './UsageGuide';
import { HelpCircle, Home, TrendingUp, Banknote, FileText, X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { supabase } from '../utils/supabase';
import toast from 'react-hot-toast';
import Portal from './Portal';

interface DashboardProps {
  properties: Property[];
  transactions: Transaction[];
  accounts: Account[];
  setProperties: React.Dispatch<React.SetStateAction<Property[]>>;
}

const Dashboard: React.FC<DashboardProps> = ({ properties, transactions, accounts, setProperties }) => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Property | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 物件別の収支計算
  const uniqueProperties = Array.from(new Map(properties.map(p => [p.id, p])).values());
  const propertyFinancials = uniqueProperties.map(property => {
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

  const PAGE_SIZE = 10;
  const [propertyPage, setPropertyPage] = useState(0);
  const [accountPage, setAccountPage] = useState(0);

  const pagedPropertyFinancials = propertyFinancials.slice(propertyPage * PAGE_SIZE, (propertyPage + 1) * PAGE_SIZE);
  const pagedAccounts = accounts.slice(accountPage * PAGE_SIZE, (accountPage + 1) * PAGE_SIZE);

  const formInputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 transition duration-150 ease-in-out focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500";
  const formSelectClass = `${formInputClass} pr-10`;
  const formTextareaClass = `${formInputClass} min-h-[80px]`;

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
          <button
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-white text-blue-700 font-semibold rounded-xl shadow hover:bg-blue-50 transition-colors mt-6 sm:mt-0"
          >
            <HelpCircle className="w-5 h-5" />
            使い方ガイド
          </button>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="rounded-2xl shadow bg-gradient-to-br from-blue-100 to-blue-50 p-6 flex flex-col items-center">
            <Home className="w-8 h-8 text-blue-500 mb-2" />
            <h3 className="text-sm font-medium text-blue-700">物件数</h3>
            <p className="text-2xl font-bold text-blue-900 mt-1">{properties.length}件</p>
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
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
            >
              物件を追加
            </button>
          </div>
          <div className="p-6 space-y-4">
            {pagedPropertyFinancials.map(({ property, income, expenses, netProfit }) => (
              <div key={property.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedProperty(property); setIsEditMode(false); setEditForm(null); }}>
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
            <span className="text-xs text-gray-400">{accounts.length}件中 {pagedAccounts.length}件表示</span>
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
                ページ {accountPage + 1} / {Math.ceil(accounts.length / PAGE_SIZE)}
              </span>
              <button 
                onClick={() => setAccountPage(p => p + 1)} 
                disabled={(accountPage + 1) * PAGE_SIZE >= accounts.length} 
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
            {transactions.slice(0, 10).map(transaction => {
              const property = properties.find(p => p.id === transaction.property_id);
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
        {isGuideOpen && <UsageGuide onClose={() => setIsGuideOpen(false)} />}
        {/* 物件詳細モーダル */}
        {selectedProperty && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-full">
              <button onClick={() => { setSelectedProperty(null); setIsEditMode(false); setEditForm(null); }} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1.5 z-10 transition"><X className="w-5 h-5" /></button>
              
            {!isEditMode ? (
              <div className="p-8 overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <span className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                    <Home className="w-6 h-6 text-blue-600" />
                  </span>
                  物件詳細
                </h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">物件名</label>
                    <div className="text-lg font-semibold text-gray-800">{selectedProperty.name}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">住所</label>
                    <div className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      {selectedProperty.address}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">物件タイプ</label>
                      <div className="text-lg font-semibold text-gray-800">{selectedProperty.property_type}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">購入日</label>
                      <div className="text-lg font-semibold text-gray-800">{selectedProperty.purchase_date}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">購入価格</label>
                      <div className="text-lg font-semibold text-gray-800">{selectedProperty.purchase_price ? formatCurrency(selectedProperty.purchase_price) : '未設定'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">月額家賃</label>
                      <div className="text-lg font-semibold text-gray-800">{selectedProperty.monthly_rent ? formatCurrency(selectedProperty.monthly_rent) : '未設定'}</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">説明</label>
                    <div className="text-base text-gray-700 whitespace-pre-line bg-gray-50 rounded-lg p-3 border border-gray-200 min-h-[60px]">
                      {selectedProperty.description || <span className="text-gray-400">（説明なし）</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={async () => {
                      if (!window.confirm('本当にこの物件を削除しますか？')) return;
                      setLoading(true);
                      setError('');
                      try {
                        const { error } = await supabase.from('properties').delete().eq('id', selectedProperty.id);
                        if (error) {
                          throw new Error(error.message);
                        }
                        setProperties(prev => prev.filter(p => p.id !== selectedProperty.id));
                        setSelectedProperty(null);
                        toast.success('物件を削除しました。');
                      } catch (e: any) {
                        setError('物件の削除に失敗しました');
                        toast.error(`物件の削除に失敗しました: ${e.message}`);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                    {loading ? '削除中...' : '物件を削除'}
                  </button>
                  <div className="flex-grow" />
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setSelectedProperty(null); setIsEditMode(false); setEditForm(null); }} className="px-5 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 font-semibold transition-all text-sm">閉じる</button>
                    <button onClick={() => { setIsEditMode(true); setEditForm({ ...selectedProperty }); }} className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 font-semibold transition-all text-sm">編集</button>
                  </div>
                </div>
                {error && <div className="text-red-500 mt-2 text-sm text-center">{error}</div>}
              </div>
            ) : isEditMode && editForm ? (
              <>
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold">「{editForm.name}」を編集中</h2>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                  {/* 物件名 */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">物件名</label>
                    <input type="text" name="name" value={editForm?.name || ''} onChange={e => setEditForm(prev => prev ? { ...prev, name: e.target.value } : null)} className={formInputClass} placeholder="物件名" />
                  </div>
                  {/* 住所 */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">住所</label>
                    <input type="text" name="address" value={editForm?.address || ''} onChange={e => setEditForm(prev => prev ? { ...prev, address: e.target.value } : null)} className={formInputClass} placeholder="住所" />
                  </div>
                  {/* 物件タイプ */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">物件タイプ</label>
                    <select
                      name="property_type"
                      value={editForm?.property_type || ''}
                      onChange={e => setEditForm(prev => prev ? { ...prev, property_type: e.target.value as Property['property_type'] } : null)}
                      className={formSelectClass}
                    >
                      <option value="apartment">マンション</option>
                      <option value="house">一戸建て</option>
                      <option value="commercial">商業物件</option>
                      <option value="land">土地</option>
                    </select>
                  </div>
                  {/* 購入価格 */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">購入価格</label>
                    <input type="number" name="purchase_price" value={editForm?.purchase_price || ''} onChange={e => setEditForm(prev => prev ? { ...prev, purchase_price: Number(e.target.value) } : null)} className={formInputClass} placeholder="購入価格" />
                  </div>
                  {/* 月額家賃 */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">月額家賃</label>
                    <input type="number" name="monthly_rent" value={editForm?.monthly_rent || ''} onChange={e => setEditForm(prev => prev ? { ...prev, monthly_rent: Number(e.target.value) } : null)} className={formInputClass} placeholder="月額家賃" />
                  </div>
                  {/* 購入日 */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">購入日</label>
                    <input type="date" name="purchase_date" value={editForm?.purchase_date || ''} onChange={e => setEditForm(prev => prev ? { ...prev, purchase_date: e.target.value } : null)} className={formInputClass} placeholder="購入日" />
                  </div>
                  {/* 説明 */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">説明</label>
                    <textarea name="description" value={editForm?.description || ''} onChange={e => setEditForm(prev => prev ? { ...prev, description: e.target.value } : null)} className={formTextareaClass} placeholder="説明" />
                  </div>
                </div>
                <div className="p-6 flex space-x-2 justify-end border-t border-gray-200">
                  <button onClick={async () => {
                    if (!editForm) return;
                    setLoading(true);
                    setError('');
                    try {
                      // created_at, owner_id, updated_at を除外
                      const { id, created_at, owner_id, updated_at, ...updateData } = editForm;
                      const { error: updateError } = await supabase.from('properties').update(updateData).eq('id', id);
                      if (updateError) {
                        setError(`物件の更新に失敗しました: ${updateError.message}`);
                        toast.error(`物件の更新に失敗しました: ${updateError.message}`);
                        return;
                      }
                      setProperties(prev => prev.map(p => p.id === id ? { ...p, ...editForm } : p));
                      setSelectedProperty({ ...editForm });
                      setIsEditMode(false);
                      toast.success('物件情報を更新しました。');
                      
                      // ★ここから追加: ベクトル化APIを呼び出す
                      console.log(`物件 ${id} のベクトル情報をバックグラウンドで更新します...`);
                      fetch('/api/generate-embedding', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ propertyId: id }),
                      })
                      .then(async res => {
                        const data = await res.json();
                        if (!res.ok) {
                           throw new Error(data.error || 'APIからのエラー応答');
                        }
                        console.log(`物件 ${id} のベクトル化成功:`, data.message);
                      })
                      .catch(err => {
                        console.error(`物件 ${id} のベクトル化に失敗しました:`, err);
                        // ここでのエラーはUIに表示せず、コンソールログに留める
                      });
                      // ★ここまで追加

                    } catch (e: any) {
                      setError('物件の更新中に予期せぬエラーが発生しました。');
                      toast.error('物件の更新中に予期せぬエラーが発生しました。');
                    } finally {
                      setLoading(false);
                    }
                  }} className="px-6 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 font-semibold transition">保存</button>
                  <button onClick={() => setIsEditMode(false)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg shadow-sm hover:bg-gray-300 font-semibold transition">キャンセル</button>
                </div>
                {error && <div className="text-red-500 mt-2 text-sm">{error}</div>}
              </>
            ) : null}
          </div>
        </div>
      )}
      {/* ★ここから追加: 新規物件追加モーダル */}
      {isAddModalOpen && (
        <AddPropertyModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onPropertyAdded={(newProperty) => {
            setProperties(prev => [newProperty, ...prev]);
            setIsAddModalOpen(false);
            // ベクトル化APIをキック
            console.log(`新規物件 ${newProperty.id} のベクトル情報をバックグラウンドで生成します...`);
            fetch('/api/generate-embedding', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ propertyId: newProperty.id }),
            })
            .then(async res => {
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || 'APIエラー');
              console.log(`新規物件 ${newProperty.id} のベクトル化成功:`, data.message);
            })
            .catch(err => {
              console.error(`新規物件 ${newProperty.id} のベクトル化に失敗しました:`, err);
            });
          }}
        />
      )}
      {/* ★ここまで追加 */}
      </Portal>
    </>
  );
};

// ★ここから追加: AddPropertyModalコンポーネント
interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPropertyAdded: (property: Property) => void;
}

const AddPropertyModal: React.FC<AddPropertyModalProps> = ({ isOpen, onClose, onPropertyAdded }) => {
  const [newProperty, setNewProperty] = useState<Partial<Omit<Property, 'id' | 'created_at' | 'owner_id' | 'updated_at'>>>({
    name: '',
    address: '',
    property_type: 'apartment',
    purchase_price: 0,
    monthly_rent: 0,
    purchase_date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const formInputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 transition duration-150 ease-in-out focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500";
  const formSelectClass = `${formInputClass} pr-10`;
  const formTextareaClass = `${formInputClass} min-h-[80px]`;

  const handleSave = async () => {
    if (!newProperty.name || !newProperty.address) {
      setError('物件名と住所は必須です。');
      toast.error('物件名と住所は必須です。');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data, error: insertError } = await supabase
        .from('properties')
        .insert(newProperty)
        .select()
        .single();
      
      if (insertError) {
        throw new Error(insertError.message);
      }
      onPropertyAdded(data as Property);
      toast.success('新しい物件を追加しました。');
    } catch (e: any) {
      setError(`物件の追加に失敗しました: ${e.message}`);
      toast.error(`物件の追加に失敗しました: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-full">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold">新しい物件を追加</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1.5 z-10 transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Form fields */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">物件名</label>
            <input type="text" value={newProperty.name} onChange={e => setNewProperty(p => ({ ...p, name: e.target.value }))} className={formInputClass} placeholder="例: 渋谷レジデンス" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">住所</label>
            <input type="text" value={newProperty.address} onChange={e => setNewProperty(p => ({ ...p, address: e.target.value }))} className={formInputClass} placeholder="例: 東京都渋谷区..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">物件タイプ</label>
            <select value={newProperty.property_type} onChange={e => setNewProperty(p => ({ ...p, property_type: e.target.value as any }))} className={formSelectClass}>
              <option value="apartment">マンション</option>
              <option value="house">一戸建て</option>
              <option value="commercial">商業物件</option>
              <option value="land">土地</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">購入価格</label>
            <input type="number" value={newProperty.purchase_price} onChange={e => setNewProperty(p => ({ ...p, purchase_price: Number(e.target.value) }))} className={formInputClass} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">月額家賃</label>
            <input type="number" value={newProperty.monthly_rent} onChange={e => setNewProperty(p => ({ ...p, monthly_rent: Number(e.target.value) }))} className={formInputClass} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">購入日</label>
            <input type="date" value={newProperty.purchase_date} onChange={e => setNewProperty(p => ({ ...p, purchase_date: e.target.value }))} className={formInputClass} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">説明</label>
            <textarea value={newProperty.description} onChange={e => setNewProperty(p => ({ ...p, description: e.target.value }))} className={formTextareaClass} placeholder="物件に関するメモなど" />
          </div>
        </div>
        <div className="p-6 flex space-x-2 justify-end border-t border-gray-200">
          <button onClick={handleSave} disabled={loading} className="px-6 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 font-semibold transition disabled:opacity-50">
            {loading ? '保存中...' : '保存'}
          </button>
          <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg shadow-sm hover:bg-gray-300 font-semibold transition">キャンセル</button>
        </div>
        {error && <div className="p-4 text-red-500 text-sm text-center bg-red-50 rounded-b-2xl">{error}</div>}
      </div>
    </div>
  );
};


export default Dashboard;