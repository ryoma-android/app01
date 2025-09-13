'use client';

import React, { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Toaster } from 'react-hot-toast';
import Dashboard from '@/components/Dashboard';
import AISuggestions from '@/components/AISuggestions';
import PropertyManagement from '@/components/PropertyManagement';
import Documents from '@/components/Documents';
import Analytics from '@/components/Analytics';
import Settings from '@/components/Settings';

type Page = 'dashboard' | 'ai-suggestions' | 'property-management' | 'documents' | 'analytics' | 'settings';

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const pageComponentMap = useMemo(() => ({
    'dashboard': <Dashboard />,
    'ai-suggestions': <AISuggestions />,
    'property-management': <PropertyManagement />,
    'documents': <Documents />,
    'analytics': <Analytics />,
    'settings': <Settings />,
  }), [currentPage]);

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate}>
      <Toaster position="bottom-right" />
      <div className="p-4 sm:p-6 lg:p-8">
        {pageComponentMap[currentPage]}
      </div>
    </Layout>
  );
} 