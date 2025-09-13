import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { User, Shield, Bell, CreditCard, HelpCircle } from 'lucide-react';

const supabase = createClient();

type NotificationSettings = {
  important: boolean;
  ai_advice: boolean;
  promotion: boolean;
};

const defaultNotificationSettings: NotificationSettings = {
  important: true,
  ai_advice: true,
  promotion: false,
};

const Settings: React.FC = () => {
  const { user, loading: authLoading, error: authError } = useAuth();
  const [email, setEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      setEmail(user?.email ?? null);
      setUserId(user?.id ?? null);
      let displayName: string | null = null;
      if (user) {
        displayName = user.user_metadata?.displayName || user.user_metadata?.display_name || user.user_metadata?.full_name || null;
      }
      let profileFullName: string | null = null;
      if (user?.id) {
        // profilesテーブルからfull_nameとnotification_settings取得
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, notification_settings')
          .eq('id', user.id)
          .single();
        if (profile?.notification_settings) {
          setNotificationSettings({
            ...defaultNotificationSettings,
            ...profile.notification_settings,
          });
        }
        profileFullName = profile?.full_name ?? null;
      }
      setFullName(displayName || profileFullName || '-');
      setLoading(false);
    };
    fetchUser();
  }, []);

  // 通知設定の変更
  const handleNotifChange = async (key: keyof NotificationSettings, value: boolean) => {
    if (!userId) return;
    setNotifLoading(true);
    setNotifError(null);
    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);
    // DBに保存
    const { error } = await supabase
      .from('profiles')
      .update({ notification_settings: newSettings })
      .eq('id', userId);
    if (error) {
      setNotifError('保存に失敗しました');
    }
    setNotifLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">設定</h2>
      <p className="text-gray-600 mb-6">アカウントや通知など、各種設定をこちらで管理できます。</p>

      {/* アカウント情報 */}
      <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">アカウント情報</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">メールアドレス</span>
            <span className="font-mono text-gray-900">{loading ? '...' : email ?? '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">お名前</span>
            <span className="font-mono text-gray-900">{loading ? '...' : fullName ?? '-'}</span>
          </div>
        </div>
      </section>

      {/* パスワード変更 */}
      <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">パスワード変更</h3>
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          setPwError(null);
          setPwSuccess(null);
          if (!pwCurrent || !pwNew || !pwConfirm) {
            setPwError('すべての項目を入力してください');
            return;
          }
          if (pwNew !== pwConfirm) {
            setPwError('新しいパスワードが一致しません');
            return;
          }
          if (pwNew.length < 8) {
            setPwError('新しいパスワードは8文字以上で入力してください');
            return;
          }
          setPwLoading(true);
          // Supabaseのパスワード変更API
          const { error } = await supabase.auth.updateUser({ password: pwNew });
          if (error) {
            setPwError('パスワード変更に失敗しました: ' + error.message);
          } else {
            setPwSuccess('パスワードを変更しました');
            setPwCurrent(''); setPwNew(''); setPwConfirm('');
          }
          setPwLoading(false);
        }}>
          <div>
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="現在のパスワード"
              className="w-full px-3 py-2 border rounded-lg text-gray-800"
              value={pwCurrent}
              onChange={e => setPwCurrent(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div>
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="新しいパスワード"
              className="w-full px-3 py-2 border rounded-lg text-gray-800"
              value={pwNew}
              onChange={e => setPwNew(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="新しいパスワード（確認）"
              className="w-full px-3 py-2 border rounded-lg text-gray-800"
              value={pwConfirm}
              onChange={e => setPwConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="showPw" checked={showPw} onChange={() => setShowPw(v => !v)} />
            <label htmlFor="showPw" className="text-gray-800 text-sm">パスワードを表示</label>
          </div>
          {pwError && <div className="text-red-500 text-sm">{pwError}</div>}
          {pwSuccess && <div className="text-green-600 text-sm">{pwSuccess}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={pwLoading}
          >
            {pwLoading ? '変更中...' : 'パスワードを変更'}
          </button>
        </form>
      </section>

      {/* 通知設定 */}
      <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">通知設定</h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-3 text-gray-800">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={notificationSettings.important}
              onChange={e => handleNotifChange('important', e.target.checked)}
              disabled={notifLoading}
            />
            <span>重要なお知らせを受け取る</span>
          </label>
          <label className="flex items-center space-x-3 text-gray-800">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={notificationSettings.ai_advice}
              onChange={e => handleNotifChange('ai_advice', e.target.checked)}
              disabled={notifLoading}
            />
            <span>AIアドバイスの通知を受け取る</span>
          </label>
          <label className="flex items-center space-x-3 text-gray-800">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={notificationSettings.promotion}
              onChange={e => handleNotifChange('promotion', e.target.checked)}
              disabled={notifLoading}
            />
            <span>プロモーション情報を受け取る</span>
          </label>
          {notifError && <div className="text-red-500 text-sm mt-2">{notifError}</div>}
        </div>
      </section>

      {/* サポート */}
      <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">サポート</h3>
        <p className="mb-4 text-gray-700">ご不明な点やお困りごとがあれば、いつでもサポートまでご連絡ください。</p>
        <a href="mailto:support@example.com" className="inline-block bg-gray-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors">サポートに問い合わせる</a>
      </section>
    </div>
  );
};

export default Settings; 