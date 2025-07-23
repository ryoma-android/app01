'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';
import PropertyManagement from '@/components/PropertyManagement';
import AISuggestions from '@/components/AISuggestions';
import Analytics from '@/components/Analytics';
import Documents from '@/components/Documents';
import AuthGuard from '@/components/auth/AuthGuard';
import Settings from '@/components/Settings';
import { Property, Transaction, Account } from '@/types';
import { supabase } from '@/utils/supabase';

type Page = 'dashboard' | 'properties' | 'analytics' | 'ai-advisor' | 'documents' | 'settings';

const HomePage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [properties, setProperties] = useState<Property[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const [{ data: properties }, { data: transactions }, { data: accounts }] = await Promise.all([
        supabase.from('properties').select('*'),
        supabase.from('transactions').select('*'),
        supabase.from('accounts').select('*'),
      ]);
      if (properties) {
        const unique = Array.from(new Map(properties.map(p => [p.id, p])).values());
        setProperties(unique);
      }
      if (transactions) setTransactions(transactions);
      if (accounts) setAccounts(accounts);
    };
    fetchAll();
  }, []);

  const handlePropertyAdded = useCallback((newProperty: Property) => {
    setProperties(prev => [...prev, newProperty]);
  }, []);

  const handleNavigate = useCallback((page: string) => {
    setCurrentPage(page as Page);
  }, []);

  const renderPage = () => {
    if (currentPage === 'dashboard') {
      return <Dashboard properties={properties} transactions={transactions} accounts={accounts} setProperties={setProperties} />;
    }
    if (currentPage === 'properties') {
      return <PropertyManagement properties={properties} setProperties={setProperties} onPropertyAdded={handlePropertyAdded} />;
    }
    if (currentPage === 'analytics') {
      return <Analytics properties={properties} transactions={transactions} />;
    }
    if (currentPage === 'ai-advisor') {
      return <AISuggestions properties={properties} transactions={transactions} />;
    }
    if (currentPage === 'documents') {
      return <Documents onPropertyAdded={handlePropertyAdded} />;
    }
    if (currentPage === 'settings') {
      return <Settings />;
    }
    // fallback
    return <Dashboard properties={properties} transactions={transactions} accounts={accounts} setProperties={setProperties} />;
  };

  return (
    <AuthGuard>
      <Layout currentPage={currentPage} onNavigate={handleNavigate}>
        {renderPage()}
      </Layout>
    </AuthGuard>
  );
};

export default HomePage; 