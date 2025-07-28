'use client'

import React, { useState, useEffect, Fragment } from 'react';
import { Property, Transaction, Account } from '../types';
import { supabase, createQueryHelper } from '../utils/supabase';
import { Plus, Building, AlertCircle, CheckCircle, Loader2, Home, X, Filter, Search, ArrowUp, ArrowDown, RotateCcw, Trash2, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate } from '../utils/format';
import { Transition } from '@headlessui/react';
import toast from 'react-hot-toast';

interface PropertyManagementProps {
  properties: Property[];
  setProperties: React.Dispatch<React.SetStateAction<Property[]>>;
  onPropertyAdded: (newProperty: Property) => void;
}

const PropertyManagement: React.FC<PropertyManagementProps> = ({ properties, setProperties, onPropertyAdded }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  // const [successMessage, setSuccessMessage] = useState('');
  // const [errorMessage, setErrorMessage] = useState('');
  
  const [propertyFilter, setPropertyFilter] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'purchase_date' | 'monthly_rent' | 'purchase_price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  
  const [filterType, setFilterType] = useState('');
  const [filterRentMin, setFilterRentMin] = useState('');
  const [filterRentMax, setFilterRentMax] = useState('');
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  const handleFilterReset = () => {
    setPropertyFilter('');
    setFilterType('');
    setFilterRentMin('');
    setFilterRentMax('');
    setFilterPriceMin('');
    setFilterPriceMax('');
    setFilterDateStart('');
    setFilterDateEnd('');
    setIsFilterVisible(false);
  };

  const [propertyFormData, setPropertyFormData] = useState({
    name: '',
    address: '',
    property_type: 'apartment' as Property['property_type'],
    purchase_price: '',
    current_value: '',
    monthly_rent: '',
    purchase_date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const [transactionFormData, setTransactionFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    property_id: '',
    account_id: ''
  });

  const [modalProperty, setModalProperty] = useState<Property | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Property | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const propertyTypeOptions = [
    { value: 'apartment', label: 'マンション' },
    { value: 'house', label: '一戸建て' },
    { value: 'commercial', label: '商業物件' },
    { value: 'land', label: '土地' },
  ];

  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadProperties(),
      loadTransactions(),
      loadAccounts()
    ]);
    setLoading(false);
  };

  const queryHelper = createQueryHelper();

  const loadProperties = async () => {
    const { data, error } = await queryHelper.properties();
    if (error) toast.error('物件データの読み込みに失敗しました');
    else if (data) setProperties(data);
  };
  
  const loadTransactions = async () => {
    const { data, error } = await queryHelper.transactions();
    if (error) toast.error('取引データの読み込みに失敗しました');
    else if (data) setTransactions(data);
  };

  const loadAccounts = async () => {
    const { data, error } = await queryHelper.accounts();
    if (error) toast.error('口座データの読み込みに失敗しました');
    else if (data) setAccounts(data);
  };

  const handlePropertySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyFormData.name || !propertyFormData.address || !propertyFormData.purchase_date) {
      toast.error('物件名、住所、購入日は必須です');
      return;
    }
    setLoading(true);
    
    const newPropertyData = {
      ...propertyFormData,
      purchase_price: propertyFormData.purchase_price ? parseFloat(propertyFormData.purchase_price) * 10000 : 0,
      current_value: propertyFormData.current_value ? parseFloat(propertyFormData.current_value) * 10000 : null,
      monthly_rent: propertyFormData.monthly_rent ? parseFloat(propertyFormData.monthly_rent) : null,
      owner_id: user?.id,
    };
    
    const { data, error } = await supabase.from('properties').insert([newPropertyData]).select();
    
    if (error) {
      toast.error(`物件の追加に失敗しました: ${error.message}`);
    } else if (data) {
      toast.success('物件が正常に追加されました');
      setPropertyFormData({ name: '', address: '', property_type: 'apartment', purchase_price: '', current_value: '', monthly_rent: '', purchase_date: new Date().toISOString().split('T')[0], description: '' });
      await loadProperties();
    }
    setLoading(false);
  };
  
  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionFormData.property_id || !transactionFormData.description || !transactionFormData.amount || !transactionFormData.category) {
      toast.error('必須項目を入力してください');
      return;
    }
    setLoading(true);
    try {
      const newTransaction = {
        property_id: transactionFormData.property_id,
        type: transactionFormData.type,
        category: transactionFormData.category,
        amount: parseFloat(transactionFormData.amount),
        description: transactionFormData.description,
        transaction_date: transactionFormData.date,
        account_id: transactionFormData.account_id || null,
        is_manual_entry: true,
        user_id: user?.id
      };

      const { error } = await supabase.from('transactions').insert([newTransaction]);
      
      if (error) {
        toast.error(`取引データの保存に失敗しました: ${error.message}`);
      } else {
        toast.success('取引データが正常に保存されました');
        setTransactionFormData({
          date: new Date().toISOString().split('T')[0],
          description: '',
          amount: '',
          type: 'expense',
          category: '',
          property_id: '',
          account_id: ''
        });
        await loadTransactions();
      }
    } catch (err: any) {
      toast.error(`予期せぬエラーが発生しました: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPropertyFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTransactionInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTransactionFormData(prev => ({ ...prev, [name]: value }));
  };

  const filteredProperties = properties.filter(p => {
    if (propertyFilter.trim() && !(p.name.toLowerCase().includes(propertyFilter.toLowerCase()) || p.address.toLowerCase().includes(propertyFilter.toLowerCase()))) return false;
    if (filterType && p.property_type !== filterType) return false;
    if (filterRentMin && (!p.monthly_rent || p.monthly_rent < Number(filterRentMin))) return false;
    if (filterRentMax && (!p.monthly_rent || p.monthly_rent > Number(filterRentMax))) return false;
    if (filterPriceMin && (!p.purchase_price || p.purchase_price < Number(filterPriceMin))) return false;
    if (filterPriceMax && (!p.purchase_price || p.purchase_price > Number(filterPriceMax))) return false;
    if (filterDateStart && (!p.purchase_date || new Date(p.purchase_date) < new Date(filterDateStart))) return false;
    if (filterDateEnd && (!p.purchase_date || new Date(p.purchase_date) > new Date(filterDateEnd))) return false;
    return true;
  });

  const sortedProperties = [...filteredProperties].sort((a, b) => {
    let aValue: any = a[sortKey] ?? '';
    let bValue: any = b[sortKey] ?? '';
    if (sortKey === 'purchase_date') {
      aValue = aValue ? new Date(aValue) : new Date(0);
      bValue = bValue ? new Date(bValue) : new Date(0);
    }
    if (sortKey === 'monthly_rent' || sortKey === 'purchase_price') {
      aValue = aValue ? Number(aValue) : 0;
      bValue = bValue ? Number(bValue) : 0;
    }
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const openPropertyModal = (property: Property) => {
    setModalProperty(property);
    setIsEditMode(false);
    setEditForm(null);
  };
  const closePropertyModal = () => setModalProperty(null);
  
  const handleEditClick = () => {
    if (modalProperty) {
      setIsEditMode(true);
      setEditForm({ ...modalProperty });
    }
  };
  
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleEditSave = async () => {
    if (!editForm) return;
    setLoading(true);
    const { id, created_at, updated_at, owner_id, ...updateData } = editForm;
    const { error } = await supabase.from('properties').update(updateData).eq('id', id);
    if (error) {
      toast.error(`物件の更新に失敗しました: ${error.message}`);
    } else {
      toast.success('物件情報を更新しました');
      await loadProperties();
      setModalProperty({ ...editForm });
      setIsEditMode(false);
    }
    setLoading(false);
  };
  
  const handleDeleteProperty = async () => {
    if (!modalProperty || !window.confirm('本当にこの物件を削除しますか？関連する取引も全て削除されます。')) return;
    setDeleteLoading(true);
    const { error } = await supabase.from('properties').delete().eq('id', modalProperty.id);
    if (error) {
      toast.error(`物件の削除に失敗しました: ${error.message}`);
    } else {
      toast.success('物件を削除しました');
      await loadData();
      closePropertyModal();
    }
    setDeleteLoading(false);
  };
  
  const formInputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 transition duration-150 ease-in-out focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500";
  const btnClass = "inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 disabled:cursor-not-allowed";
  const btnPrimaryClass = `${btnClass} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-400 disabled:opacity-75`;
  const btnSecondaryClass = `${btnClass} bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 disabled:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus:ring-gray-500`;
  const btnGreenClass = `${btnClass} bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-green-400 disabled:opacity-75`;
  const btnIconClass = "inline-flex items-center justify-center p-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-100 transition dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">物件・取引管理</h1>
        <p className="text-gray-600 mt-1">物件情報の登録とそれに関連する取引データを管理します。</p>
      </div>
      
      {/* {successMessage && <div className="bg-green-100 text-green-800 p-4 rounded-lg flex items-center gap-2"><CheckCircle className="w-5 h-5" />{successMessage}</div>}
      {errorMessage && <div className="bg-red-100 text-red-800 p-4 rounded-lg flex items-center gap-2"><AlertCircle className="w-5 h-5" />{errorMessage}</div>} */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Property Add Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 self-start">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Home className="w-5 h-5 text-blue-500" />
              新規物件追加
            </h2>
          </div>
          <form onSubmit={handlePropertySubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">物件名 *</label>
                <input type="text" name="name" value={propertyFormData.name} onChange={handlePropertyInputChange} placeholder="例: シティタワー中目黒 101号室" className={formInputClass} required />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">住所 *</label>
                <input type="text" name="address" value={propertyFormData.address} onChange={handlePropertyInputChange} placeholder="例: 東京都目黒区上目黒1-1-1" className={formInputClass} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">物件タイプ</label>
                <select name="property_type" value={propertyFormData.property_type} onChange={handlePropertyInputChange} className={formInputClass}>
                  {propertyTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">購入日 *</label>
                <input type="date" name="purchase_date" value={propertyFormData.purchase_date} onChange={handlePropertyInputChange} className={formInputClass} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">購入価格 (万円)</label>
                <input type="number" name="purchase_price" value={propertyFormData.purchase_price} onChange={handlePropertyInputChange} placeholder="例: 5000" className={formInputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">月額家賃 (円)</label>
                <input type="number" name="monthly_rent" value={propertyFormData.monthly_rent} onChange={handlePropertyInputChange} placeholder="例: 150000" className={formInputClass} />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={loading} className={btnPrimaryClass}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} 物件を追加
              </button>
            </div>
          </form>
        </div>
        
        {/* Transaction Add Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 self-start">
           <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-500" />
              新規取引追加
            </h2>
          </div>
          <form onSubmit={handleTransactionSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">取引タイプ *</label>
                <select name="type" value={transactionFormData.type} onChange={handleTransactionInputChange} className={formInputClass} required >
                  <option value="expense">支出</option>
                  <option value="income">収入</option>
                </select>
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">日付 *</label>
                <input type="date" name="date" value={transactionFormData.date} onChange={handleTransactionInputChange} className={formInputClass} required />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">物件 *</label>
                <select name="property_id" value={transactionFormData.property_id} onChange={handleTransactionInputChange} className={formInputClass} required>
                  <option value="">物件を選択してください</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">金額 (円) *</label>
                <input type="number" name="amount" value={transactionFormData.amount} onChange={handleTransactionInputChange} placeholder="例: 10000" className={formInputClass} required />
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ *</label>
                <input type="text" name="category" value={transactionFormData.category} onChange={handleTransactionInputChange} placeholder="例: 家賃収入、修繕費" className={formInputClass} required />
              </div>
              <div className="sm:col-span-2">
                 <label className="block text-sm font-medium text-gray-700 mb-1">説明 *</label>
                <textarea name="description" value={transactionFormData.description} onChange={handleTransactionInputChange} rows={1} placeholder="取引の詳細" className={`${formInputClass} min-h-[48px]`} required />
              </div>
            </div>
            <div className="flex justify-end pt-2">
               <button type="submit" disabled={loading} className={btnGreenClass}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} 取引を追加
              </button>
            </div>
          </form>
        </div>
      </div>


      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">物件一覧</h2>
            <p className="text-sm text-gray-500 mt-1">{properties.length}件の物件が登録されています</p>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" value={propertyFilter} onChange={e => setPropertyFilter(e.target.value)} placeholder="物件名・住所で検索..." className={`${formInputClass} pl-10`} />
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <select value={sortKey} onChange={e => setSortKey(e.target.value as any)} className={`${formInputClass} py-2.5`}>
                        <option value="name">物件名</option>
                        <option value="purchase_date">購入日</option>
                        <option value="monthly_rent">月額家賃</option>
                        <option value="purchase_price">購入価格</option>
                    </select>
                    <button type="button" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className={btnIconClass} aria-label="昇順・降順切り替え">
                        {sortOrder === 'asc' ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                    </button>
                    <button onClick={() => setIsFilterVisible(!isFilterVisible)} className={`${btnIconClass} ${isFilterVisible ? 'bg-blue-100 border-blue-300 text-blue-700' : ''}`}>
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <Transition show={isFilterVisible} as={Fragment} enter="transition-opacity duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">物件タイプ</label>
                          <select value={filterType} onChange={e => setFilterType(e.target.value)} className={formInputClass}>
                              <option value="">すべて</option>
                              {propertyTypeOptions.map(opt=><option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">月額家賃(円)</label>
                          <div className="flex gap-1">
                              <input type="number" min="0" value={filterRentMin} onChange={e => setFilterRentMin(e.target.value)} placeholder="最小" className={formInputClass} />
                              <input type="number" min="0" value={filterRentMax} onChange={e => setFilterRentMax(e.target.value)} placeholder="最大" className={formInputClass} />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">購入価格(円)</label>
                          <div className="flex gap-1">
                              <input type="number" min="0" value={filterPriceMin} onChange={e => setFilterPriceMin(e.target.value)} placeholder="最小" className={formInputClass} />
                              <input type="number" min="0" value={filterPriceMax} onChange={e => setFilterPriceMax(e.target.value)} placeholder="最大" className={formInputClass} />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">購入日</label>
                          <div className="flex gap-1">
                            <input type="date" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} className={formInputClass} />
                            <input type="date" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} className={formInputClass} />
                          </div>
                      </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                      <button type="button" onClick={handleFilterReset} className={btnSecondaryClass}>
                          <RotateCcw className="w-4 h-4 mr-2" /> リセット
                      </button>
                  </div>
              </div>
            </Transition>
        </div>
        <div className="p-6">
          {loading && !modalProperty ? <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
            : sortedProperties.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-semibold">該当する物件データがありません</p>
              <p className="text-sm text-gray-400 mt-1">フィルター条件を確認するか、新しい物件を追加してください。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedProperties.map(property => (
                <div key={property.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 cursor-pointer group" onClick={() => openPropertyModal(property)}>
                  <div className="flex justify-between items-start">
                      <div className="flex-1">
                          <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors pr-8">{property.name}</h3>
                          <p className="text-xs text-gray-500 mt-1">{property.address}</p>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full flex-shrink-0">{propertyTypeOptions.find(o=>o.value === property.property_type)?.label}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-sm">
                      <div className="flex flex-col">
                          <span className="text-xs text-gray-500">購入価格</span>
                          <span className="font-semibold text-gray-700">{property.purchase_price ? formatCurrency(property.purchase_price) : 'N/A'}</span>
                      </div>
                      <div className="flex flex-col">
                          <span className="text-xs text-gray-500">月額家賃</span>
                          <span className="font-semibold text-green-600">{property.monthly_rent ? formatCurrency(property.monthly_rent) : 'N/A'}</span>
                      </div>
                      <div className="flex flex-col">
                          <span className="text-xs text-gray-500">購入日</span>
                          <span className="font-semibold text-gray-700">{property.purchase_date ? formatDate(property.purchase_date) : 'N/A'}</span>
                      </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalProperty && (
        <Transition show={!!modalProperty} as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 z-50 flex items-center justify-center" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={closePropertyModal}></div>
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] relative transform transition-all">
                  <button onClick={closePropertyModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1.5 z-10 transition"><X className="w-5 h-5" /></button>
                  {!isEditMode ? (
                    <div className="p-8">
                      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <span className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg"><Home className="w-6 h-6 text-blue-600" /></span>
                        {modalProperty.name}
                      </h2>
                      <div className="space-y-5">
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">住所</label>
                            <div className="text-lg text-gray-800 flex items-center gap-2">{modalProperty.address}</div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                            <div><label className="block text-sm font-medium text-gray-500 mb-1">物件タイプ</label><div className="text-lg font-semibold text-gray-800">{propertyTypeOptions.find(o=>o.value === modalProperty.property_type)?.label}</div></div>
                            <div><label className="block text-sm font-medium text-gray-500 mb-1">購入日</label><div className="text-lg font-semibold text-gray-800">{modalProperty.purchase_date}</div></div>
                            <div><label className="block text-sm font-medium text-gray-500 mb-1">購入価格</label><div className="text-lg font-semibold text-gray-800">{modalProperty.purchase_price ? formatCurrency(modalProperty.purchase_price) : '未設定'}</div></div>
                            <div><label className="block text-sm font-medium text-gray-500 mb-1">月額家賃</label><div className="text-lg font-semibold text-gray-800">{modalProperty.monthly_rent ? formatCurrency(modalProperty.monthly_rent) : '未設定'}</div></div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">説明</label>
                            <div className="text-base text-gray-700 whitespace-pre-line bg-gray-50 rounded-lg p-3 border border-gray-200 min-h-[60px]">{modalProperty.description || <span className="text-gray-400">（説明なし）</span>}</div>
                          </div>
                      </div>
                      <div className="mt-4">
                        <h3 className="text-md font-semibold text-gray-700 mb-2">関連取引</h3>
                        <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                           {transactions.filter(t => t.property_id === modalProperty.id).length > 0 ? (
                              transactions.filter(t => t.property_id === modalProperty.id).map(t => (
                                <div key={t.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-md text-sm">
                                  <div>
                                    <p className="font-medium text-gray-800">{t.description}</p>
                                    <p className="text-xs text-gray-500">{formatDate(t.transaction_date)}</p>
                                  </div>
                                  <p className={`font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                  </p>
                                </div>
                              ))
                           ) : (
                              <p className="text-sm text-gray-400 text-center py-4">この物件には取引がありません。</p>
                           )}
                        </div>
                      </div>
                      <div className="flex items-center mt-6 pt-6 border-t border-gray-200">
                          <button onClick={handleDeleteProperty} disabled={deleteLoading} className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed">
                              <Trash2 className="w-4 h-4" />{deleteLoading ? '削除中...' : '削除'}
                          </button>
                          <div className="flex-grow" />
                          <div className="flex items-center gap-3">
                              <button onClick={closePropertyModal} className={btnSecondaryClass}>閉じる</button>
                              <button onClick={handleEditClick} className={btnPrimaryClass}><Edit className="w-4 h-4 mr-2" />編集</button>
                          </div>
                      </div>
                    </div>
                  ) : (
                  <>
                    <div className="p-6 border-b border-gray-200"><h2 className="text-xl font-bold">物件情報を編集</h2></div>
                    <div className="p-6 space-y-4 overflow-y-auto">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">物件名</label>
                          <input type="text" name="name" value={editForm?.name || ''} onChange={handleEditFormChange} className={formInputClass} />
                        </div>
                         <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">住所</label>
                          <input type="text" name="address" value={editForm?.address || ''} onChange={handleEditFormChange} className={formInputClass} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">物件タイプ</label>
                          <select name="property_type" value={editForm?.property_type} onChange={e => setEditForm(prev=> prev ? {...prev, property_type: e.target.value as Property['property_type']} : null)} className={formInputClass}>
                            {propertyTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">購入価格</label>
                          <input type="number" name="purchase_price" value={editForm?.purchase_price || ''} onChange={handleEditFormChange} className={formInputClass} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">月額家賃</label>
                          <input type="number" name="monthly_rent" value={editForm?.monthly_rent || ''} onChange={handleEditFormChange} className={formInputClass} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">購入日</label>
                          <input type="date" name="purchase_date" value={editForm?.purchase_date || ''} onChange={handleEditFormChange} className={formInputClass} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                          <textarea name="description" value={editForm?.description || ''} onChange={handleEditFormChange} className={`${formInputClass} min-h-[80px]`} />
                        </div>
                    </div>
                    <div className="p-6 flex space-x-2 justify-end border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                        <button onClick={() => setIsEditMode(false)} className={btnSecondaryClass}>キャンセル</button>
                        <button onClick={handleEditSave} disabled={loading} className={btnPrimaryClass}>
                          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}保存
                        </button>
                    </div>
                  </>
                  )}
              </div>
            </Transition.Child>
          </div>
        </Transition>
      )}
    </div>
  );
};

export default PropertyManagement;