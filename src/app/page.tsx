'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';
import PropertyManagement from '@/components/PropertyManagement';
import AISuggestions from '@/components/AISuggestions';
import Analytics from '@/components/Analytics';
import Documents from '@/components/Documents';
import AuthGuard from '@/components/auth/AuthGuard';

type Page = 'dashboard' | 'properties' | 'analytics' | 'ai-advisor' | 'documents' | 'settings';

const HomePage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard properties={[]} transactions={[]} accounts={[]} />;
      case 'properties':
        return <PropertyManagement />;
      case 'analytics':
        return <Analytics />;
      case 'ai-advisor':
        return <AISuggestions />;
      case 'documents':
        return <Documents />;
      case 'settings':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">設定</h2>
            <p className="text-gray-600">設定ページは開発中です。</p>
          </div>
        );
      default:
        return <Dashboard properties={[]} transactions={[]} accounts={[]} />;
    }
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