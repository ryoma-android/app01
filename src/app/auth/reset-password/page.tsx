'use client';

import { supabase } from "../../../utils/supabase";
import { useState } from "react";
import { useRouter } from 'next/navigation';

export default function PasswordReset() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordConf, setPasswordConf] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // e.preventDefault();
    setError(null);

    if (!password || !passwordConf) {
      setError("すべてのフィールドを入力してください");
      return;
    }
    if (password !== passwordConf) {
      setError("パスワードが一致しません");
      return;
    }
    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      return;
    }

    try {
      const { error: passwordResetError } = await supabase.auth.updateUser({
        password
      });
      if (passwordResetError) {
        throw passwordResetError;
      }
      alert('パスワード変更が完了しました');
      await router.push("/auth");
    } catch (error) {
      setError('エラーが発生しました');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="flex flex-col items-center">
          <div className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mb-2">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">パスワード再登録</h2>
          <p className="text-gray-500 text-sm">新しいパスワードを入力してください</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm flex items-center">
              <svg className="w-5 h-5 mr-2 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-1.414 1.414A9 9 0 105.636 18.364l1.414-1.414M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-colors"
              placeholder="新しいパスワード"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">パスワード（確認）</label>
            <input
              type="password"
              required
              value={passwordConf}
              onChange={e => setPasswordConf(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-colors"
              placeholder="新しいパスワード（確認）"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-md hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
          >
            パスワード変更
          </button>
        </form>
      </div>
    </div>
  );
}

