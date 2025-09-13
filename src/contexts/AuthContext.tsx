'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { AuthContextType, LoginCredentials, SignUpCredentials, User as AppUser } from '@/types';
import { useRouter } from 'next/navigation';

const supabase = createClient();

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
  const router = useRouter();

  useEffect(() => {                                                                                                                                                                                                                                               
    const fetchUserAndProfile = async () => {
      // 既存のセッションを取得
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (session?.user) {
        // セッションがあれば、プロフィールも取得
        await fetchUserProfile(session.user);
      } else {
        // セッションがなければローディング終了
        setLoading(false);
      }
    };
    
    fetchUserAndProfile();

    // 認証状態の変更をリッスン
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        // SIGNED_IN以外のイベント後もローディング状態を更新することが重要
        if (event === 'INITIAL_SESSION') {
             setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (supabaseUser: User) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) throw error;
      
      setUser(data);
    } catch (err: any) {
      console.error('Profile fetch error:', err);
      setUser(null); // エラー時はユーザー情報をクリア
    } finally {
      setLoading(false);
    }
  };

  // サインイン
  const signIn = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;

      // onAuthStateChangeが後続の処理（プロフィール取得など）をハンドルする
      setSuccess('ログインに成功しました！');
      //
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'サインインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // サインアウト
  const signOut = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null); // Explicitly set user to null for immediate UI update
      router.push('/');

    } catch (err: any) {
      console.error('Sign out error:', err);
      setError('サインアウトに失敗しました');
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
        setSuccess('アカウントが正常に作成されました！確認メールを送信しました。メールを確認してログインしてください。');
      }
    } catch (err) {
      console.error('Sign up error:', err);
      setError('サインアップに失敗しました');
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
        redirectTo: `${window.location.origin}/auth/change-password`,
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

  // パスワード更新
  const updatePassword = async (newPassword: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        setSuccess('パスワードが正常に更新されました！');
        // ユーザープロフィールを再取得
        await fetchUserProfile(data.user);
      }
    } catch (err) {
      console.error('Password update error:', err);
      setError('パスワード更新に失敗しました');
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
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 