'use client'

import React, { useState, useEffect, Fragment, useMemo } from 'react';
import useSWR from 'swr';
import { Property, Transaction, Account } from '../types';
import { createClient } from '@/utils/supabase/client';
import { Plus, Building, Loader2, Home, X, Filter, Search, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate } from '../utils/format';
import { Transition } from '@headlessui/react';
import toast from 'react-hot-toast';
import { PropertyDetailModal } from './PropertyDetailModal'; 

const supabase = createClient();

const propertyTypeOptions = [
  { value: 'apartment', label: 'マンション' },
  { value: 'house', label: '一戸建て' },
  { value: 'commercial', label: '商業物件' },
  { value: 'land', label: '土地' },
];

const PropertyManagement: React.FC = () => {

  const { data: properties, error: propertiesError, isLoading: isLoadingProperties, mutate: mutateProperties } = useSWR<Property[]>('/api/properties');
  const { data: transactions, error: transactionsError, isLoading: isLoadingTransactions, mutate: mutateTransactions } = useSWR<Transaction[]>('/api/transactions');
  const { data: accounts, error: accountsError, isLoading: isLoadingAccounts, mutate: mutateAccounts } = useSWR<Account[]>('/api/accounts'); 

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

  const [modalProperty, setModalProperty] = useState<Property | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Property | null>(null);

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

  const filteredProperties = properties?.filter(p => {
    if (propertyFilter.trim() && !(p.name.toLowerCase().includes(propertyFilter.toLowerCase()) || p.address.toLowerCase().includes(propertyFilter.toLowerCase()))) return false;
    if (filterType && p.property_type !== filterType) return false;
    if (filterRentMin && (!p.monthly_rent || p.monthly_rent < Number(filterRentMin))) return false;
    if (filterRentMax && (!p.monthly_rent || p.monthly_rent > Number(filterRentMax))) return false;
    if (filterPriceMin && (!p.purchase_price || p.purchase_price < Number(filterPriceMin))) return false;
    if (filterPriceMax && (!p.purchase_price || p.purchase_price > Number(filterPriceMax))) return false;
    if (filterDateStart && (!p.purchase_date || new Date(p.purchase_date) < new Date(filterDateStart))) return false;
    if (filterDateEnd && (!p.purchase_date || new Date(p.purchase_date) > new Date(filterDateEnd))) return false;
    return true;
  }) || [];

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
    setEditForm(property);
    setIsEditMode(false);
  };
  const closePropertyModal = () => setModalProperty(null);

  const handlePropertyAdded = (newProperty: Property) => {
    mutateProperties((current = []) => [newProperty, ...current], false);
    toast.success('物件が正常に追加されました');
  };
  
  const handleTransactionAdded = () => {
    mutateTransactions();
    toast.success('取引データが正常に保存されました');
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
  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>; // Add a proper loader here

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">物件・取引管理</h1>
        <p className="text-gray-600 mt-1">物件情報の登録とそれに関連する取引データを管理します。</p>
      </div>
      
      {/* Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <AddPropertyForm onPropertyAdded={handlePropertyAdded} />
        <AddTransactionForm properties={properties || []} onTransactionAdded={handleTransactionAdded}/>
      </div>

      {/* Property List Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">物件一覧</h2>
            <p className="text-sm text-gray-500 mt-1">{properties?.length || 0}件の物件が登録されています</p>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" value={propertyFilter} onChange={e => setPropertyFilter(e.target.value)} placeholder="物件名・住所で検索..." className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground transition duration-150 ease-in-out focus:ring-2 focus:ring-ring focus:outline-none pl-10" />
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <select value={sortKey} onChange={e => setSortKey(e.target.value as any)} className="w-full px-4 py-2.5 border border-input rounded-md bg-background text-foreground transition duration-150 ease-in-out focus:ring-2 focus:ring-ring focus:outline-none">
                        <option value="name">物件名</option>
                        <option value="purchase_date">購入日</option>
                        <option value="monthly_rent">月額家賃</option>
                        <option value="purchase_price">購入価格</option>
                    </select>
                    <button type="button" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="inline-flex items-center justify-center p-2.5 border border-input rounded-md bg-card text-foreground hover:bg-accent transition" aria-label="昇順・降順切り替え">
                        {sortOrder === 'asc' ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                    </button>
                    <button onClick={() => setIsFilterVisible(!isFilterVisible)} className="inline-flex items-center justify-center p-2.5 border border-input rounded-md bg-card text-foreground hover:bg-accent transition">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <Transition show={isFilterVisible} as={Fragment} enter="transition-opacity duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">物件タイプ</label>
                          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full px-4 py-2.5 border border-input rounded-md bg-background text-foreground transition duration-150 ease-in-out focus:ring-2 focus:ring-ring focus:outline-none">
                              <option value="">すべて</option>
                              {propertyTypeOptions.map(opt=><option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">月額家賃(円)</label>
                          <div className="flex gap-1">
                              <input type="number" min="0" value={filterRentMin} onChange={e => setFilterRentMin(e.target.value)} placeholder="最小" className="w-full px-4 py-2.5 border border-input rounded-md bg-background text-foreground transition duration-150 ease-in-out focus:ring-2 focus:ring-ring focus:outline-none" />
                              <input type="number" min="0" value={filterRentMax} onChange={e => setFilterRentMax(e.target.value)} placeholder="最大" className="w-full px-4 py-2.5 border border-input rounded-md bg-background text-foreground transition duration-150 ease-in-out focus:ring-2 focus:ring-ring focus:outline-none" />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">購入価格(円)</label>
                          <div className="flex gap-1">
                              <input type="number" min="0" value={filterPriceMin} onChange={e => setFilterPriceMin(e.target.value)} placeholder="最小" className="w-full px-4 py-2.5 border border-input rounded-md bg-background text-foreground transition duration-150 ease-in-out focus:ring-2 focus:ring-ring focus:outline-none" />
                              <input type="number" min="0" value={filterPriceMax} onChange={e => setFilterPriceMax(e.target.value)} placeholder="最大" className="w-full px-4 py-2.5 border border-input rounded-md bg-background text-foreground transition duration-150 ease-in-out focus:ring-2 focus:ring-ring focus:outline-none" />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">購入日</label>
                          <div className="flex gap-1">
                            <input type="date" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} className="w-full px-4 py-2.5 border border-input rounded-md bg-background text-foreground transition duration-150 ease-in-out focus:ring-2 focus:ring-ring focus:outline-none" />
                            <input type="date" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} className="w-full px-4 py-2.5 border border-input rounded-md bg-background text-foreground transition duration-150 ease-in-out focus:ring-2 focus:ring-ring focus:outline-none" />
                          </div>
                      </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                      <button type="button" onClick={handleFilterReset} className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 disabled:cursor-not-allowed bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus:ring-gray-500">
                          <RotateCcw className="w-4 h-4 mr-2" /> リセット
                      </button>
                  </div>
              </div>
            </Transition>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
          ) : sortedProperties.length === 0 ? (
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

      {/* Modal */}
      {modalProperty && editForm && (
        <PropertyDetailModal
          isOpen={!!modalProperty}
          onClose={closePropertyModal}
          property={editForm}
          setProperties={handleSetProperties}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
          setEditForm={setEditForm}
        />
      )}
    </div>
  );
};

const AddPropertyForm: React.FC<{ onPropertyAdded: (newProperty: Property) => void }> = ({ onPropertyAdded }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    property_type: 'apartment' as Property['property_type'],
    purchase_price: '',
    current_value: '',
    monthly_rent: '',
    purchase_date: new Date().toISOString().split('T')[0],
    description: ''
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.address || !formData.purchase_date) {
      toast.error('物件名、住所、購入日は必須です');
      return;
    }
    setLoading(true);
    
    const newPropertyData = {
      ...formData,
      purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) * 10000 : 0,
      current_value: formData.current_value ? parseFloat(formData.current_value) * 10000 : null,
      monthly_rent: formData.monthly_rent ? parseFloat(formData.monthly_rent) : null,
      owner_id: user?.id,
    };
    
    const { data, error } = await supabase.from('properties').insert([newPropertyData]).select();
    
    if (error) {
      toast.error(`物件の追加に失敗しました: ${error.message}`);
    } else if (data) {
      onPropertyAdded(data[0]);
    }
    setLoading(false);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formInputClass = "w-full px-4 py-2 border border-input rounded-md bg-background text-foreground transition focus:ring-2 focus:ring-ring focus:outline-none";
  const btnPrimaryClass = "inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg transition-all disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-400 disabled:opacity-75";
  const btnSecondaryClass = "inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 disabled:cursor-not-allowed bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus:ring-gray-500";
  const btnGreenClass = "inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg transition-all disabled:cursor-not-allowed bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:opacity-50";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 self-start">
      <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Home className="w-5 h-5 text-blue-500" />
              新規物件追加
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">物件名 *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="例: シティタワー中目黒 101号室" className={formInputClass} required />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">住所 *</label>
                <input type="text" name="address" value={formData.address} onChange={handleInputChange} placeholder="例: 東京都目黒区上目黒1-1-1" className={formInputClass} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">物件タイプ</label>
                <select name="property_type" value={formData.property_type} onChange={handleInputChange} className={formInputClass}>
                  {propertyTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">購入日 *</label>
                <input type="date" name="purchase_date" value={formData.purchase_date} onChange={handleInputChange} className={formInputClass} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">購入価格 (万円)</label>
                <input type="number" name="purchase_price" value={formData.purchase_price} onChange={handleInputChange} placeholder="例: 5000" className={formInputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">月額家賃 (円)</label>
                <input type="number" name="monthly_rent" value={formData.monthly_rent} onChange={handleInputChange} placeholder="例: 150000" className={formInputClass} />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={loading} className={btnPrimaryClass}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} 物件を追加
              </button>
            </div>
          </form>
        </div>
  );
};

const AddTransactionForm: React.FC<{ properties: Property[], onTransactionAdded: () => void }> = ({ properties, onTransactionAdded }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      type: 'expense' as 'income' | 'expense',
      category: '',
      property_id: '',
      account_id: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.property_id || !formData.description || !formData.amount || !formData.category) {
        toast.error('必須項目を入力してください');
        return;
      }
      setLoading(true);
      try {
        const newTransaction = {
          property_id: formData.property_id,
          type: formData.type,
          category: formData.category,
          amount: parseFloat(formData.amount),
          description: formData.description,
          transaction_date: formData.date,
          account_id: formData.account_id || null,
          is_manual_entry: true,
          user_id: user?.id
        };

        const { error } = await supabase.from('transactions').insert([newTransaction]);
        
        if (error) {
          toast.error(`取引データの保存に失敗しました: ${error.message}`);
        } else {
          onTransactionAdded();
        }
      } catch (err: any) {
        toast.error(`予期せぬエラーが発生しました: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    const formInputClass = "w-full px-4 py-2 border border-input rounded-md bg-background text-foreground transition focus:ring-2 focus:ring-ring focus:outline-none";
    const btnPrimaryClass = "inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-400 disabled:opacity-75";
    const btnSecondaryClass = "inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 disabled:cursor-not-allowed bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus:ring-gray-500";
    const btnGreenClass = "inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg transition-all disabled:cursor-not-allowed bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:opacity-50";

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 self-start">
            <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-500" />
              新規取引追加
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">取引タイプ *</label>
                <select name="type" value={formData.type} onChange={handleInputChange} className={formInputClass} required >
                  <option value="expense">支出</option>
                  <option value="income">収入</option>
                </select>
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">日付 *</label>
                <input type="date" name="date" value={formData.date} onChange={handleInputChange} className={formInputClass} required />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">物件 *</label>
                <select name="property_id" value={formData.property_id} onChange={handleInputChange} className={formInputClass} required>
                  <option value="">物件を選択してください</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">金額 (円) *</label>
                <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} placeholder="例: 10000" className={formInputClass} required />
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ *</label>
                <input type="text" name="category" value={formData.category} onChange={handleInputChange} placeholder="例: 家賃収入、修繕費" className={formInputClass} required />
              </div>
              <div className="sm:col-span-2">
                 <label className="block text-sm font-medium text-gray-700 mb-1">説明 *</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows={1} placeholder="取引の詳細" className={`${formInputClass} min-h-[48px]`} required />
              </div>
            </div>
            <div className="flex justify-end pt-2">
               <button type="submit" disabled={loading} className={btnGreenClass}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} 取引を追加
              </button>
            </div>
          </form>
        </div>
    );
};


export default PropertyManagement;