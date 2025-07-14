'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // クライアントサイドでのみリダイレクトを実行
    if (typeof window !== 'undefined' && !loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  // ローディング中はスピナーを表示
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // ユーザーが認証されていない場合は何も表示しない（リダイレクト中）
  if (!user) {
    return null;
  }

  // 認証済みユーザーの場合は子コンポーネントを表示
  return <>{children}</>;
};

export default AuthGuard; 