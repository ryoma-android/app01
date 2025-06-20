import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PropertyManagement from './components/PropertyManagement';
import Analytics from './components/Analytics';
import AISuggestions from './components/AISuggestions';
import Documents from './components/Documents';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
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
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚙️</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">設定</h3>
            <p className="text-gray-500">アカウント設定や各種設定は準備中です</p>
            <p className="text-gray-400 text-sm mt-2">近日公開予定</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderCurrentPage()}
    </Layout>
  );
}

export default App;