'use client';

import React, { useState } from 'react';
import { Property } from '../types';
import toast from 'react-hot-toast';
import { X, Home, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { cn } from '@/utils/format';
import Portal from './Portal';

interface PropertyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  setProperties: (updater: (prev: Property[]) => Property[]) => void;
  isEditMode: boolean;
  setIsEditMode: (isEdit: boolean) => void;
  setEditForm: React.Dispatch<React.SetStateAction<Property | null>>;
}

const propertyTypeOptions = [
  { value: 'apartment', label: 'マンション' },
  { value: 'house', label: '一戸建て' },
  { value: 'commercial', label: '商業物件' },
  { value: 'land', label: '土地' },
];

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  isOpen,
  onClose,
  property,
  setProperties,
  isEditMode,
  setIsEditMode,
  setEditForm
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formInputClass = "w-full px-4 py-2 border border-input rounded-md bg-background text-foreground transition duration-150 ease-in-out focus:ring-2 focus:ring-ring focus:outline-none";
  const formSelectClass = `${formInputClass} pr-10`;
  const formTextareaClass = `${formInputClass} min-h-[80px]`;

  const handleUpdate = async () => {
    if (!property) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(property),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Update failed');
      }
      
      setProperties(prev => prev.map(p => (p.id === property.id ? { ...p, ...property } : p)));
      setIsEditMode(false);
      toast.success('物件情報を更新しました。');

      fetch('/api/generate-embedding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: property.id }),
      }).catch(err => console.error(`Failed to update vector for property ${property.id}:`, err));

    } catch (e: any) {
      setError(`物件の更新に失敗しました: ${e.message}`);
      toast.error(`物件の更新に失敗しました: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('本当にこの物件を削除しますか？')) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }
      
      setProperties(prev => prev.filter(p => p.id !== property.id));
      onClose();
      toast.success('物件を削除しました。');
    } catch (e: any) {
      setError('物件の削除に失敗しました');
      toast.error(`物件の削除に失敗しました: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="bg-card border rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">
              {isEditMode ? `「${property.name}」を編集中` : '物件詳細'}
            </h2>
            <button onClick={onClose} className="p-1 rounded-full text-muted-foreground hover:bg-accent transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4 overflow-y-auto">
            {isEditMode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">物件名</label>
                  <input type="text" value={property.name || ''} onChange={e => setEditForm(p => p ? { ...p, name: e.target.value } : null)} className={formInputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">住所</label>
                  <input type="text" value={property.address || ''} onChange={e => setEditForm(p => p ? { ...p, address: e.target.value } : null)} className={formInputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">物件タイプ</label>
                  <select value={property.property_type} onChange={e => setEditForm(p => p ? { ...p, property_type: e.target.value as any } : null)} className={formSelectClass}>
                    {propertyTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">購入価格</label>
                        <input type="number" value={property.purchase_price || ''} onChange={e => setEditForm(p => p ? { ...p, purchase_price: Number(e.target.value) } : null)} className={formInputClass} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">月額家賃</label>
                        <input type="number" value={property.monthly_rent || ''} onChange={e => setEditForm(p => p ? { ...p, monthly_rent: Number(e.target.value) } : null)} className={formInputClass} />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">購入日</label>
                    <input type="date" value={property.purchase_date ? new Date(property.purchase_date).toISOString().split('T')[0] : ''} onChange={e => setEditForm(p => p ? { ...p, purchase_date: e.target.value } : null)} className={formInputClass} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">説明</label>
                    <textarea value={property.description || ''} onChange={e => setEditForm(p => p ? { ...p, description: e.target.value } : null)} className={formTextareaClass} />
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">物件名</label>
                  <div className="text-lg font-semibold text-foreground">{property.name}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">住所</label>
                  <div className="text-foreground">{property.address}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">物件タイプ</label>
                    <div className="font-semibold text-foreground">{propertyTypeOptions.find(o=>o.value === property.property_type)?.label || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">購入日</label>
                    <div className="font-semibold text-foreground">{property.purchase_date}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">購入価格</label>
                    <div className="font-semibold text-foreground">{formatCurrency(property.purchase_price)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">月額家賃</label>
                    <div className="font-semibold text-foreground">{property.monthly_rent ? formatCurrency(property.monthly_rent) : 'N/A'}</div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">説明</label>
                  <div className="text-sm text-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-3 border min-h-[60px]">
                      {property.description || <span className="text-muted-foreground">（説明なし）</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer with buttons */}
          <div className="p-4 flex justify-between items-center border-t bg-muted/50 rounded-b-lg">
            <div>
              {!isEditMode && (
                <button onClick={handleDelete} disabled={loading} className="flex items-center gap-2 text-sm font-semibold text-destructive hover:text-destructive/80 transition disabled:opacity-50">
                  <Trash2 className="w-4 h-4" />
                  {loading ? '削除中...' : '削除'}
                </button>
              )}
            </div>
            <div className="flex items-center gap-4">
              {isEditMode ? (
                <>
                  <button onClick={() => setIsEditMode(false)} className="px-6 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 font-semibold transition">キャンセル</button>
                  <button onClick={handleUpdate} disabled={loading} className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-semibold transition disabled:opacity-50">
                    {loading ? '保存中...' : '保存'}
                  </button>
                </>
              ) : (
                 <>
                  <button onClick={onClose} className="px-6 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 font-semibold transition">閉じる</button>
                  <button onClick={() => setIsEditMode(true)} className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-semibold transition">編集</button>
                 </>
              )}
            </div>
          </div>
          {error && <div className="p-4 text-sm text-center text-destructive bg-destructive/10">{error}</div>}
        </div>
      </div>
    </Portal>
  );
}; 