import React, { useState } from 'react';
import { Home, Building, TrendingUp, Brain, FileText, Settings, LogOut, HelpCircle, X, BookOpen } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  const [showHelp, setShowHelp] = useState(false);

  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'ホーム', 
      icon: Home,
      description: '全体の収支状況をひと目で確認できます'
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

  const HelpModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">「次の一手」の使い方</h3>
          <button 
            onClick={() => setShowHelp(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* サイドバー */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
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

        <nav className="mt-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center px-6 py-4 text-left transition-colors group ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  {!isActive && (
                    <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                      {item.description}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-64 p-6 space-y-2">
          <button 
            onClick={() => setShowHelp(true)}
            className="w-full flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <BookOpen className="w-5 h-5 mr-3" />
            <div className="text-left">
              <div className="font-medium">使い方ガイド</div>
              <div className="text-xs text-gray-400">操作方法を確認</div>
            </div>
          </button>
          <button className="w-full flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <LogOut className="w-5 h-5 mr-3" />
            <div className="text-left">
              <div className="font-medium">ログアウト</div>
              <div className="text-xs text-gray-400">安全に終了</div>
            </div>
          </button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {currentMenuItem?.label || 'ホーム'}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {currentMenuItem?.description || '全体の収支状況をひと目で確認できます'}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('ja-JP', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'short'
                  })}
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">田</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>

      {showHelp && <HelpModal />}
    </div>
  );
};

export default Layout;