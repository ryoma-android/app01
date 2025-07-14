'use client'

import React, { useState, useEffect } from 'react';
import { Property, Transaction, Account } from '../types';
import { supabase, createQueryHelper } from '../utils/supabase';
import { Plus, CreditCard, Building, AlertCircle, CheckCircle, Loader2, BarChart3, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PropertyChart from './PropertyChart';
import { formatCurrency, formatDate } from '../utils/mockData';

const PropertyManagement: React.FC = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  // 物件追加フォーム状態
  const [propertyFormData, setPropertyFormData] = useState({
    name: '',
    address: '',
    property_type: 'apartment' as 'apartment' | 'house' | 'commercial',
    purchase_price: '',
    current_value: '',
    monthly_rent: '',
    purchase_date: new Date().toISOString().split('T')[0],
    description: ''
  });

  // 取引追加フォーム状態
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    property_id: '',
    account_id: ''
  });

  // データ読み込み
  useEffect(() => {
    loadProperties();
    loadTransactions();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const queryHelper = createQueryHelper();
      const { data, error } = await queryHelper.properties();
      
      if (error) {
        console.error('物件データの読み込みエラー:', error);
        setErrorMessage('物件データの読み込みに失敗しました');
        return;
      }

      console.log('読み込まれた物件データ:', data);
      if (data) {
        setProperties(data);
      }
    } catch (error) {
      console.error('物件データの読み込みエラー:', error);
      setErrorMessage('物件データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const queryHelper = createQueryHelper();
      const { data, error } = await queryHelper.transactions();
      
      if (error) {
        console.error('取引データの読み込みエラー:', error);
        setErrorMessage('取引データの読み込みに失敗しました');
        return;
      }

      console.log('読み込まれた取引データ:', data);
      if (data) {
        setTransactions(data);
      }
    } catch (error) {
      console.error('取引データの読み込みエラー:', error);
      setErrorMessage('取引データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 物件追加処理
  const handlePropertySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!propertyFormData.name || !propertyFormData.address || !propertyFormData.purchase_date) {
      setErrorMessage('物件名、住所、購入日は必須です');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const newProperty = {
        name: propertyFormData.name,
        address: propertyFormData.address,
        property_type: propertyFormData.property_type,
        purchase_price: propertyFormData.purchase_price ? parseFloat(propertyFormData.purchase_price) * 10000 : 0, // 万円から円に変換
        current_value: propertyFormData.current_value ? parseFloat(propertyFormData.current_value) * 10000 : null, // 万円から円に変換
        monthly_rent: propertyFormData.monthly_rent ? parseFloat(propertyFormData.monthly_rent) : null,
        purchase_date: propertyFormData.purchase_date,
        owner_id: user?.id || 'user1' // 認証済みユーザーのIDを使用
      };

      console.log('保存する物件データ:', newProperty);
      
      const { data, error } = await supabase
        .from('properties')
        .insert([newProperty])
        .select();

      if (error) {
        console.error('物件データの保存エラー:', error);
        console.error('エラー詳細:', error.message, error.details, error.hint);
        setErrorMessage(`物件データの保存に失敗しました: ${error.message}`);
        return;
      }

      console.log('保存成功:', data);

      setSuccessMessage('物件が正常に追加されました');
      
      // フォームをリセット
      setPropertyFormData({
        name: '',
        address: '',
        property_type: 'apartment',
        purchase_price: '',
        current_value: '',
        monthly_rent: '',
        purchase_date: new Date().toISOString().split('T')[0],
        description: ''
      });

      // 物件リストを再読み込み
      await loadProperties();
      
      // 新しく追加された物件を選択状態にする
      if (data && data.length > 0) {
        const newProperty = data[0];
        setSelectedPropertyId(newProperty.id);
        
        // 新しく追加された物件のサンプル取引データを生成
        // const sampleTransactions = [
        //   {
        //     property_id: newProperty.id,
        //     type: 'income' as const,
        //     category: '家賃収入',
        //     amount: newProperty.monthly_rent || 100000,
        //     description: `${newProperty.name} - 初回家賃収入`,
        //     transaction_date: new Date().toISOString().split('T')[0],
        //     account_id: accounts.length > 0 ? accounts[0].id : null,
        //     is_manual_entry: true,
        //     user_id: user?.id || 'user1'
        //   },
        //   {
        //     property_id: newProperty.id,
        //     type: 'expense' as const,
        //     category: '管理費',
        //     amount: Math.floor((newProperty.monthly_rent || 100000) * 0.1), // 家賃の10%
        //     description: `${newProperty.name} - 管理費`,
        //     transaction_date: new Date().toISOString().split('T')[0],
        //     account_id: accounts.length > 0 ? accounts[0].id : null,
        //     is_manual_entry: true,
        //     user_id: user?.id || 'user1'
        //   }
        // ];

        // サンプル取引データを保存
        // const { error: transactionError } = await supabase
        //   .from('transactions')
        //   .insert(sampleTransactions);

        // if (transactionError) {
        //   console.error('サンプル取引データの保存エラー:', transactionError);
        // } else {
        //   console.log('サンプル取引データを保存しました');
        //   // 取引リストを再読み込み
        //   await loadTransactions();
        //   setSuccessMessage('物件が正常に追加されました。サンプル取引データも自動生成されました。');
        // }
      }

    } catch (error) {
      console.error('物件データの保存エラー:', error);
      setErrorMessage('物件データの保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 取引追加処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.property_id || !formData.description || !formData.amount || !formData.category) {
      setErrorMessage('必須項目を入力してください');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const newTransaction = {
        property_id: formData.property_id,
        type: formData.type,
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description,
        transaction_date: formData.date,
        account_id: formData.account_id || null,
        is_manual_entry: true,
        user_id: user?.id || 'user1' // 認証済みユーザーのIDを使用
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert([newTransaction])
        .select();

      if (error) {
        console.error('取引データの保存エラー:', error);
        console.error('エラー詳細:', error.message, error.details, error.hint);
        setErrorMessage(`取引データの保存に失敗しました: ${error.message}`);
        return;
      }

      setSuccessMessage('取引データが正常に保存されました');
      
      // フォームをリセット
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        type: 'expense',
        category: '',
        property_id: '',
        account_id: ''
      });

      // 取引リストを再読み込み
      await loadTransactions();

    } catch (error) {
      console.error('取引データの保存エラー:', error);
      setErrorMessage('取引データの保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 銀行・クレカ連携の模擬処理
  const handleBankSync = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      // 模擬データの生成（実際のAPI連携は次のフェーズで実装）
      // const mockBankTransactions = [
      //   {
      //     property_id: '1',
      //     type: 'income' as const,
      //     category: '家賃収入',
      //     amount: 120000,
      //     description: '4月分家賃（銀行連携）',
      //     transaction_date: new Date().toISOString().split('T')[0],
      //     account_id: '1',
      //     is_manual_entry: false,
      //     user_id: user?.id || 'user1'
      //   },
      //   {
      //     property_id: '2',
      //     type: 'expense' as const,
      //     category: '管理費',
      //     amount: 15000,
      //     description: '共益費（銀行連携）',
      //     transaction_date: new Date().toISOString().split('T')[0],
      //     account_id: '1',
      //     is_manual_entry: false,
      //     user_id: user?.id || 'user1'
      //   },
      //   {
      //     property_id: '3',
      //     type: 'expense' as const,
      //     category: '修繕費',
      //     amount: 35000,
      //     description: 'エアコン修理（銀行連携）',
      //     transaction_date: new Date().toISOString().split('T')[0],
      //     account_id: '1',
      //     is_manual_entry: false,
      //     user_id: user?.id || 'user1'
      //   }
      // ];

      // const { data, error } = await supabase
      //   .from('transactions')
      //   .insert(mockBankTransactions)
      //   .select();

      // if (error) {
      //   console.error('銀行連携データの保存エラー:', error);
      //   setErrorMessage('銀行連携データの保存に失敗しました');
      //   return;
      // }

      // setSuccessMessage('銀行連携データが正常に保存されました（模擬データ）');
      
      // 取引リストを再読み込み
      // await loadTransactions();

    } catch (error) {
      console.error('銀行連携データの保存エラー:', error);
      setErrorMessage('銀行連携データの保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // フォーム入力ハンドラー
  const handlePropertyInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPropertyFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // フィルタされた取引データを取得
  const getFilteredTransactions = () => {
    if (!selectedPropertyId) {
      return transactions;
    }
    return transactions.filter(transaction => transaction.property_id === selectedPropertyId);
  };

  // グラフデータの計算
  const getChartData = () => {
    const filteredTransactions = getFilteredTransactions();
    console.log('フィルタされた取引データ:', filteredTransactions);
    
    const monthlyData: { [key: string]: { income: number; expense: number } } = {};
    
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.transaction_date || transaction.date || new Date().toISOString());
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 };
      }
      
      if (transaction.type === 'income') {
        monthlyData[monthKey].income += transaction.amount;
      } else {
        monthlyData[monthKey].expense += transaction.amount;
      }
    });

    const result = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense,
        profit: data.income - data.expense
      }));
    
    console.log('グラフデータ:', result);
    return result;
  };

  const chartData = getChartData();

  return (
    <div className="p-6 space-y-8">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">物件・取引管理</h1>
        <p className="text-gray-600">物件情報と取引データの管理</p>
      </div>

      {/* 成功・エラーメッセージ */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <p className="text-green-800">{successMessage}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* 物件追加フォーム */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Home className="w-5 h-5 mr-2" />
            物件追加
          </h2>
        </div>
        <div className="p-6">
          <form onSubmit={handlePropertySubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 物件名 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  物件名 *
                </label>
                <input
                  type="text"
                  name="name"
                  value={propertyFormData.name}
                  onChange={handlePropertyInputChange}
                  placeholder="例: マンションA-101号室"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  required
                />
              </div>

              {/* 住所 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  住所 *
                </label>
                <input
                  type="text"
                  name="address"
                  value={propertyFormData.address}
                  onChange={handlePropertyInputChange}
                  placeholder="例: 東京都渋谷区..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  required
                />
              </div>

              {/* 物件タイプ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  物件タイプ
                </label>
                <select
                  name="property_type"
                  value={propertyFormData.property_type}
                  onChange={handlePropertyInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                >
                  <option value="apartment">マンション</option>
                  <option value="house">一戸建て</option>
                  <option value="commercial">商業物件</option>
                </select>
              </div>

              {/* 購入価格 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  購入価格（万円）
                </label>
                <input
                  type="number"
                  name="purchase_price"
                  value={propertyFormData.purchase_price}
                  onChange={handlePropertyInputChange}
                  placeholder="例: 3000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                />
              </div>

              {/* 現在価値 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  現在価値（万円）
                </label>
                <input
                  type="number"
                  name="current_value"
                  value={propertyFormData.current_value}
                  onChange={handlePropertyInputChange}
                  placeholder="例: 3500"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                />
              </div>

              {/* 月額家賃 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  月額家賃（円）
                </label>
                <input
                  type="number"
                  name="monthly_rent"
                  value={propertyFormData.monthly_rent}
                  onChange={handlePropertyInputChange}
                  placeholder="例: 120000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                />
              </div>

              {/* 購入日 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  購入日
                </label>
                <input
                  type="date"
                  name="purchase_date"
                  value={propertyFormData.purchase_date}
                  onChange={handlePropertyInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                />
              </div>
            </div>

            {/* 説明 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                説明
              </label>
              <textarea
                name="description"
                value={propertyFormData.description}
                onChange={handlePropertyInputChange}
                rows={3}
                placeholder="物件の詳細情報を入力してください"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              />
            </div>

            {/* 送信ボタン */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Home className="w-4 h-4 mr-2" />
                )}
                物件を追加
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 取引追加フォーム */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">取引追加</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 日付 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  日付 *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  required
                />
              </div>

              {/* 取引タイプ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  取引タイプ *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  required
                >
                  <option value="expense">支出</option>
                  <option value="income">収入</option>
                </select>
              </div>

              {/* 物件選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  物件 *
                </label>
                <select
                  name="property_id"
                  value={formData.property_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  required
                >
                  <option value="">物件を選択</option>
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.name} - {property.address}
                    </option>
                  ))}
                </select>
              </div>

              {/* 口座選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  口座
                </label>
                <select
                  name="account_id"
                  value={formData.account_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                >
                  <option value="">口座を選択</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.institution})
                    </option>
                  ))}
                </select>
              </div>

              {/* 金額 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  金額 *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  required
                />
              </div>

              {/* カテゴリ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  カテゴリ *
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="例: 家賃収入、修繕費、管理費"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  required
                />
              </div>
            </div>

            {/* 説明 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                説明 *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="取引の詳細を入力してください"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                required
              />
            </div>

            {/* 送信ボタン */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                取引を追加
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 銀行・クレカ連携（模擬） */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">銀行・クレジットカード連携</h2>
          <p className="text-sm text-gray-500 mt-1">
            実際のAPI連携は次のフェーズで実装予定です。現在は模擬データを使用します。
          </p>
        </div>
        <div className="p-6">
          <button
            onClick={handleBankSync}
            disabled={loading}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <CreditCard className="w-5 h-5 mr-2" />
            )}
            銀行データを連携（模擬）
          </button>
        </div>
      </div>

      {/* 物件一覧 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Home className="w-5 h-5 mr-2" />
            物件一覧
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {properties.length}件の物件
          </p>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-8">
              <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">物件データがありません</p>
            </div>
          ) : (
            <div className="space-y-4">
              {properties.map(property => (
                <div key={property.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{property.name}</h3>
                      <p className="text-sm text-gray-500">{property.address}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span>タイプ: {property.property_type === 'apartment' ? 'マンション' : property.property_type === 'house' ? '一戸建て' : '商業物件'}</span>
                        {property.purchase_price && (
                          <span>購入価格: {formatCurrency(property.purchase_price)}</span>
                        )}
                        {property.monthly_rent && (
                          <span>月額家賃: {formatCurrency(property.monthly_rent)}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPropertyId(selectedPropertyId === property.id ? '' : property.id)}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        selectedPropertyId === property.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {selectedPropertyId === property.id ? 'フィルタ解除' : 'フィルタ適用'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* グラフ表示 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            収支グラフ
            {selectedPropertyId && (
              <span className="ml-2 text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                物件フィルタ適用中
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {selectedPropertyId ? '選択された物件の' : '全物件の'}月別の収入・支出・利益の推移
          </p>
        </div>
        <div className="p-6">
          {chartData.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">グラフデータがありません</p>
              <p className="text-sm text-gray-400">
                {selectedPropertyId ? '選択された物件の取引データを追加してください' : '取引データを追加するとグラフが表示されます'}
              </p>
              <div className="mt-4 text-xs text-gray-400">
                <p>デバッグ情報:</p>
                <p>取引データ数: {transactions.length}</p>
                <p>フィルタ済み取引データ数: {getFilteredTransactions().length}</p>
                <p>選択物件ID: {selectedPropertyId || 'なし'}</p>
              </div>
            </div>
          ) : (
            <>
              {selectedPropertyId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-blue-900 mb-2">選択物件情報</h4>
                  {(() => {
                    const selectedProperty = properties.find(p => p.id === selectedPropertyId);
                    return selectedProperty ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700 font-medium">物件名:</span>
                          <span className="text-blue-800 ml-2">{selectedProperty.name}</span>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">月額家賃:</span>
                          <span className="text-blue-800 ml-2">
                            {selectedProperty.monthly_rent ? formatCurrency(selectedProperty.monthly_rent) : '未設定'}
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">購入価格:</span>
                          <span className="text-blue-800 ml-2">
                            {selectedProperty.purchase_price ? formatCurrency(selectedProperty.purchase_price) : '未設定'}
                          </span>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
              <PropertyChart data={chartData} />
            </>
          )}
        </div>
      </div>

      {/* 取引一覧 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">取引一覧</h2>
          <p className="text-sm text-gray-500 mt-1">
            {getFilteredTransactions().length}件の取引
            {selectedPropertyId && (
              <span className="ml-2 text-blue-600">（物件フィルタ適用中）</span>
            )}
          </p>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : getFilteredTransactions().length === 0 ? (
            <div className="text-center py-8">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {selectedPropertyId ? '選択された物件の取引データがありません' : '取引データがありません'}
              </p>
              {selectedPropertyId && (
                <p className="text-sm text-gray-400 mt-2">
                  取引追加フォームから取引データを追加してください
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {getFilteredTransactions().map(transaction => {
                const property = properties.find(p => p.id === transaction.property_id);
                const account = accounts.find(a => a.id === transaction.account_id);
                
                return (
                  <div key={transaction.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {property?.name} • {transaction.category} • {formatDate(transaction.transaction_date || transaction.date || new Date().toISOString())}
                        </p>
                        {account && (
                          <p className="text-xs text-gray-400">{account.name}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                        {transaction.is_auto_generated && (
                          <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mt-1">
                            自動連携
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyManagement;