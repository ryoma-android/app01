'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';
import { AuthContextType, LoginCredentials, SignUpCredentials, User as AppUser } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // ユーザーセッションの初期化
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 現在のセッションを取得
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          await fetchUserProfile(session.user);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError('認証の初期化に失敗しました');
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    // クライアントサイドでのみ初期化を実行
    if (typeof window !== 'undefined') {
      initializeAuth();

      // 認証状態の変更を監視
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user) {
            await fetchUserProfile(session.user);
          } else {
            setUser(null);
          }
          setLoading(false);
        }
      );

      return () => subscription.unsubscribe();
    }
  }, []);

  // ユーザープロフィールを取得
  const fetchUserProfile = async (supabaseUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        setError('プロフィールの取得に失敗しました');
        return;
      }

      setUser(data);
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError('プロフィールの取得に失敗しました');
    }
  };

  // サインイン
  const signIn = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        // ログイン成功時の処理
        await fetchUserProfile(data.user);
        setSuccess('ログインに成功しました！');
        
        // 少し遅延させてからリダイレクト
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError('サインインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // サインアップ
  const signUp = async (credentials: SignUpCredentials) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const { error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.full_name,
          },
        },
      });

      if (error) {
        setError(error.message);
      } else {
        // サインアップ成功時の処理
        setSuccess('アカウントが正常に作成されました！確認メールを送信しました。メールを確認してログインしてください。');
      }
    } catch (err) {
      console.error('Sign up error:', err);
      setError('サインアップに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // サインアウト
  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signOut();

      if (error) {
        setError(error.message);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Sign out error:', err);
      setError('サインアウトに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // パスワードリセット
  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess('パスワードリセットメールを送信しました。メールを確認してください。');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError('パスワードリセットに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    success,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 