import AuthTest from '@/components/auth/AuthTest';
import DatabaseTest from '@/components/DatabaseTest';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          システムテスト
        </h1>
        <p className="text-center mb-8 text-gray-600">
          このページで認証機能とデータベース接続をテストできます
        </p>
        
        <div className="space-y-8">
          <AuthTest />
          <DatabaseTest />
        </div>
      </div>
    </div>
  );
} 