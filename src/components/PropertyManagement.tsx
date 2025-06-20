import React, { useState } from 'react';
import { Building, Plus, Edit, Trash2, MapPin, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { mockProperties, generatePropertyFinancials } from '../utils/mockData';
import { Property } from '../types';

const PropertyManagement: React.FC = () => {
  const [properties, setProperties] = useState(mockProperties);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const propertyFinancials = properties.map(generatePropertyFinancials);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPropertyTypeLabel = (type: string) => {
    const typeMap = {
      apartment: 'アパート',
      house: '戸建て',
      commercial: '商業用',
      land: '土地'
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  const PropertyForm = ({ property, onClose }: { property?: Property, onClose: () => void }) => {
    const [formData, setFormData] = useState({
      name: property?.name || '',
      address: property?.address || '',
      type: property?.type || 'apartment',
      purchase_price: property?.purchase_price || 0,
      purchase_date: property?.purchase_date || '',
      monthly_rent: property?.monthly_rent || 0
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // Here you would typically save to database
      console.log('Saving property:', formData);
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            {property ? '物件を編集' : '新しい物件を追加'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">物件名</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">住所</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">物件タイプ</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as Property['type']})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="apartment">アパート</option>
                <option value="house">戸建て</option>
                <option value="commercial">商業用</option>
                <option value="land">土地</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">購入価格</label>
              <input
                type="number"
                value={formData.purchase_price}
                onChange={(e) => setFormData({...formData, purchase_price: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">購入日</label>
              <input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">月額家賃</label>
              <input
                type="number"
                value={formData.monthly_rent}
                onChange={(e) => setFormData({...formData, monthly_rent: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {property ? '更新' : '追加'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">物件管理</h2>
          <p className="text-gray-500 mt-1">所有物件の管理と収支状況</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          物件を追加
        </button>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {propertyFinancials.map((pf) => (
          <div key={pf.property.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{pf.property.name}</h3>
                    <span className="text-sm text-gray-500">{getPropertyTypeLabel(pf.property.type)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => setSelectedProperty(pf.property)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="text-sm">{pf.property.address}</span>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-sm">
                    {new Date(pf.property.purchase_date).toLocaleDateString('ja-JP')}
                  </span>
                </div>

                <div className="flex items-center text-gray-600">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <span className="text-sm">購入価格: {formatCurrency(pf.property.purchase_price)}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">月間収入</p>
                    <p className="font-semibold text-green-600">{formatCurrency(pf.monthly_income)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">月間支出</p>
                    <p className="font-semibold text-red-600">{formatCurrency(pf.monthly_expenses)}</p>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">ROI</p>
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 text-blue-600 mr-1" />
                      <span className="font-semibold text-blue-600">{pf.roi.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">入居率</p>
                    <span className="font-semibold text-gray-900">{pf.occupancy_rate}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {showAddForm && (
        <PropertyForm onClose={() => setShowAddForm(false)} />
      )}
      
      {selectedProperty && (
        <PropertyForm 
          property={selectedProperty} 
          onClose={() => setSelectedProperty(null)} 
        />
      )}
    </div>
  );
};

export default PropertyManagement;