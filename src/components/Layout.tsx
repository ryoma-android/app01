'use client';

import React, { useState } from 'react';
import { Home, Building, TrendingUp, Brain, FileText, Settings, LogOut, X, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/format'; // shadcn/uiのcnユーティリティを想定

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, signOut } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'ホーム', icon: Home },
    { id: 'property-management', label: '物件管理', icon: Building },
    { id: 'analytics', label: '収支分析', icon: TrendingUp },
    { id: 'ai-suggestions', label: 'AI相談', icon: Brain },
    { id: 'documents', label: '書類管理', icon: FileText },
    { id: 'settings', label: '設定', icon: Settings }
  ];

  const currentMenuItem = menuItems.find(item => item.id === currentPage);

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await signOut();
  };

  const LogoutConfirmModal = () => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-card-foreground">ログアウト確認</h3>
          <button
            onClick={() => setShowLogoutConfirm(false)}
            className="p-1 rounded-full text-muted-foreground hover:bg-accent transition-colors"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-muted-foreground mb-6">本当にログアウトしますか？</p>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowLogoutConfirm(false)}
            className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn("min-h-screen bg-background text-foreground flex", { "overflow-hidden": sidebarOpen })}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-card border-r flex flex-col transition-transform duration-300 ease-in-out",
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">次の一手</h1>
              <p className="text-sm text-muted-foreground">不動産AI会計</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center px-6 py-3 text-left transition-colors duration-200 group rounded-r-full",
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-5 h-5 mr-4 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center px-4 py-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors duration-200"
            aria-label="ログアウト"
          >
            <LogOut className="w-5 h-5 mr-4 flex-shrink-0" />
            <span className="font-medium">ログアウト</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-30 border-b">
          <div className="px-4 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md bg-secondary text-secondary-foreground"
                aria-label="メニューを開く"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {currentMenuItem?.label || 'ホーム'}
                </h2>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold text-primary-foreground">
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
      {showLogoutConfirm && <LogoutConfirmModal />}
    </div>
  );
};

export default Layout;