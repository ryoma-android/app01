import React, { useState } from 'react';
import { Home, Building, TrendingUp, Brain, FileText, Settings, LogOut, HelpCircle, X, BookOpen, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  const [showHelp, setShowHelp] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, signOut } = useAuth();

  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'ホーム', 
      icon: Home,
      description: ''
    },
    { 
      id: 'properties', 
      label: '物件管理', 
      icon: Building,
      description: '所有している物件の情報を管理します'
    },
    { 
      id: 'analytics', 
      label: '収支分析', 
      icon: TrendingUp,
      description: '詳しい収支データとグラフを見ることができます'
    },
    { 
      id: 'ai-advisor', 
      label: 'AI相談', 
      icon: Brain,
      description: 'AIが収益改善のアドバイスをしてくれます'
    },
    { 
      id: 'documents', 
      label: '書類管理', 
      icon: FileText,
      description: '領収書や契約書などの書類を保存・管理します'
    },
    { 
      id: 'settings', 
      label: '設定', 
      icon: Settings,
      description: 'アカウント設定や各種設定を変更できます'
    }
  ];

  const currentMenuItem = menuItems.find(item => item.id === currentPage);

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await signOut();
  };

  const HelpModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">「次の一手」の使い方</h3>
          <button 
            onClick={() => setShowHelp(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">🏠 はじめに</h4>
            <p className="text-blue-800 text-sm">
              「次の一手」へようこそ！まずは「物件管理」から所有している物件を登録してください。
              その後、領収書などの書類をアップロードすると、AIが自動で収支を分析します。
            </p>
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Icon className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">{item.label}</h4>
                </div>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            );
          })}

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">💡 上手な使い方のコツ</h4>
            <ul className="text-green-800 text-sm space-y-1">
              <li>• 領収書は写真を撮ってすぐにアップロードしましょう</li>
              <li>• 週に1回はAI相談をチェックして改善提案を確認しましょう</li>
              <li>• 収支分析で物件の成績を比較してみましょう</li>
              <li>• 銀行口座と連携すると自動で取引が記録されます</li>
            </ul>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-900 mb-2">❓ よくある質問</h4>
            <div className="text-yellow-800 text-sm space-y-2">
              <div>
                <p className="font-medium">Q: パソコンが苦手でも使えますか？</p>
                <p>A: はい！簡単な操作だけで使えるように設計されています。</p>
              </div>
              <div>
                <p className="font-medium">Q: データは安全ですか？</p>
                <p>A: 銀行レベルの暗号化でデータを保護しています。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const LogoutConfirmModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">ログアウト確認</h3>
          <button 
            onClick={() => setShowLogoutConfirm(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600">本当にログアウトしますか？</p>
          <p className="text-sm text-gray-500 mt-2">ログアウトすると、再度ログインが必要になります。</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowLogoutConfirm(false)}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-gray-50 flex ${sidebarOpen ? 'overflow-hidden' : ''}`}>
      {/* モバイルオーバーレイ */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* サイドバー */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* ヘッダー */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">次の一手</h1>
                <p className="text-sm text-gray-500">不動産AI会計</p>
              </div>
            </div>
          </div>

          {/* ナビゲーション */}
          <nav className="flex-1 overflow-y-auto py-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    // モバイルではサイドバーを閉じる
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`w-full flex items-center px-6 py-4 text-left transition-all duration-200 group ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? 'text-blue-600' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.label}</div>
                    <div className={`text-xs text-gray-500 mt-1 transition-opacity duration-200 ${
                      isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'
                    }`}>
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* フッター */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            <button 
              onClick={() => setShowHelp(true)}
              className="w-full flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              aria-label="使い方ガイドを開く"
            >
              <BookOpen className="w-5 h-5 mr-3 flex-shrink-0" />
              <div className="text-left min-w-0">
                <div className="font-medium truncate">使い方ガイド</div>
                <div className="text-xs text-gray-400">操作方法を確認</div>
              </div>
            </button>
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              aria-label="ログアウト"
            >
              <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
              <div className="text-left min-w-0">
                <div className="font-medium truncate">ログアウト</div>
                <div className="text-xs text-gray-400">安全に終了</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className={`flex-1 flex flex-col lg:ml-0 ${sidebarOpen ? 'lg:overflow-hidden' : ''}`}>
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* モバイルメニューボタン */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200 shadow-sm"
                  aria-label="メニューを開く"
                >
                  <Menu className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">メニュー</span>
                </button>
                
                <div>
                  <h2 className="text-xl lg:text-2xl font-semibold text-gray-900">
                    {currentMenuItem?.label || 'ホーム'}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1 hidden sm:block">
                    {currentMenuItem?.description || '全体の収支状況をひと目で確認できます'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500 hidden sm:block">
                  {new Date().toLocaleDateString('ja-JP', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'short'
                  })}
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>

      {showHelp && <HelpModal />}
      {showLogoutConfirm && <LogoutConfirmModal />}
    </div>
  );
};

export default Layout;