'use client';

import React, { useState } from 'react';
import { Property } from '../types';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { X } from 'lucide-react';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPropertyAdded: (property: Property) => void;
}

export const AddPropertyModal: React.FC<AddPropertyModalProps> = ({ isOpen, onClose, onPropertyAdded }) => {
  const [newProperty, setNewProperty] = useState({
    name: '',
    address: '',
    property_type: 'apartment' as Property['property_type'],
    purchase_price: '',
    monthly_rent: '',
    purchase_date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formInputClass = "w-full px-4 py-2 border border-input rounded-md bg-background text-foreground transition duration-150 ease-in-out focus:ring-2 focus:ring-ring focus:outline-none";
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
      const propertyData = {
        ...newProperty,
        purchase_price: Number(newProperty.purchase_price) || 0,
        monthly_rent: Number(newProperty.monthly_rent) || 0,
      };

      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propertyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add property');
      }
      
      const data = await response.json();
      onPropertyAdded(data as Property);
      toast.success('新しい物件を追加しました。');
      onClose(); // Close modal on success
    } catch (e: any) {
      setError(`物件の追加に失敗しました: ${e.message}`);
      toast.error(`物件の追加に失敗しました: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-card border rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-foreground">新しい物件を追加</h2>
          <button onClick={onClose} className="p-1 rounded-full text-muted-foreground hover:bg-accent transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Form fields */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">物件名</label>
            <input type="text" value={newProperty.name} onChange={e => setNewProperty(p => ({ ...p, name: e.target.value }))} className={formInputClass} placeholder="例: 渋谷レジデンス" />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">住所</label>
            <input type="text" value={newProperty.address} onChange={e => setNewProperty(p => ({ ...p, address: e.target.value }))} className={formInputClass} placeholder="例: 東京都渋谷区..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">物件タイプ</label>
            <select value={newProperty.property_type} onChange={e => setNewProperty(p => ({ ...p, property_type: e.target.value as any }))} className={formSelectClass}>
              <option value="apartment">マンション</option>
              <option value="house">一戸建て</option>
              <option value="commercial">商業物件</option>
              <option value="land">土地</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">購入価格</label>
            <input type="number" value={newProperty.purchase_price} onChange={e => setNewProperty(p => ({ ...p, purchase_price: e.target.value }))} className={formInputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">月額家賃</label>
            <input type="number" value={newProperty.monthly_rent} onChange={e => setNewProperty(p => ({ ...p, monthly_rent: e.target.value }))} className={formInputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">購入日</label>
            <input type="date" value={newProperty.purchase_date} onChange={e => setNewProperty(p => ({ ...p, purchase_date: e.target.value }))} className={formInputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">説明</label>
            <textarea value={newProperty.description} onChange={e => setNewProperty(p => ({ ...p, description: e.target.value }))} className={formTextareaClass} placeholder="物件に関するメモなど" />
          </div>
        </div>
        <div className="p-6 flex space-x-4 justify-end border-t bg-muted/50 rounded-b-lg">
          <button onClick={onClose} className="px-6 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 font-semibold transition">キャンセル</button>
          <button onClick={handleSave} disabled={loading } className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-semibold transition disabled:opacity-50">
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
        {error && <div className="p-4 text-sm text-center text-destructive bg-destructive/10 ">{error}</div>}
      </div>
    </div>
  );
}; 