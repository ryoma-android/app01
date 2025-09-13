'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle, Building } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SignUpCredentials } from '@/types';
import { cn } from '@/utils/format';

interface SignUpFormProps {
  onSwitchToLogin: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSwitchToLogin }) => {
  const { signUp, loading, error, success } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<SignUpCredentials>({
    email: '',
    password: '',
    full_name: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.full_name.trim()) errors.full_name = '氏名を入力してください';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = '有効なメールアドレスを入力してください';
    if (formData.password.length < 8) errors.password = 'パスワードは8文字以上で入力してください';
    if (formData.password !== confirmPassword) errors.confirmPassword = 'パスワードが一致しません';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    await signUp(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) setValidationErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (validationErrors.confirmPassword) setValidationErrors(prev => ({ ...prev, confirmPassword: '' }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border rounded-2xl shadow-lg p-8 space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-primary rounded-lg flex items-center justify-center mb-4">
              <Building className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              アカウントを作成
            </h1>
            <p className="text-muted-foreground mt-2">
              不動産投資の収益を最大化しましょう
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-destructive/10 border-l-4 border-destructive text-destructive-foreground p-4 rounded-md flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}
            
            {success && (
              <div className="bg-primary/10 border-l-4 border-primary text-primary p-4 rounded-md">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-medium">{success}</span>
                </div>
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="mt-2 text-sm font-semibold hover:underline"
                >
                  ログイン画面へ
                </button>
              </div>
            )}

            <div className="space-y-4">
              {/* Fields */}
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-foreground mb-1">氏名</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input id="full_name" name="full_name" type="text" required value={formData.full_name} onChange={handleInputChange} placeholder="田中 太郎" className={cn("w-full pl-10 pr-3 py-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background", validationErrors.full_name ? "border-destructive" : "border-input")} />
                </div>
                {validationErrors.full_name && <p className="mt-1 text-sm text-destructive">{validationErrors.full_name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">メールアドレス</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input id="email" name="email" type="email" required value={formData.email} onChange={handleInputChange} placeholder="your@email.com" className={cn("w-full pl-10 pr-3 py-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background", validationErrors.email ? "border-destructive" : "border-input")} />
                </div>
                {validationErrors.email && <p className="mt-1 text-sm text-destructive">{validationErrors.email}</p>}
              </div>

              <div>
                <label htmlFor="password"className="block text-sm font-medium text-foreground mb-1">パスワード</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input id="password" name="password" type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={handleInputChange} placeholder="8文字以上で入力" className={cn("w-full pl-10 pr-10 py-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background", validationErrors.password ? "border-destructive" : "border-input")} />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {validationErrors.password && <p className="mt-1 text-sm text-destructive">{validationErrors.password}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword"className="block text-sm font-medium text-foreground mb-1">パスワード（確認）</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required value={confirmPassword} onChange={handleConfirmPasswordChange} placeholder="パスワードを再入力" className={cn("w-full pl-10 pr-10 py-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background", validationErrors.confirmPassword ? "border-destructive" : "border-input")} />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {validationErrors.confirmPassword && <p className="mt-1 text-sm text-destructive">{validationErrors.confirmPassword}</p>}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    アカウント作成中...
                  </div>
                ) : (
                  'アカウントを作成'
                )}
              </button>
            </div>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">すでにアカウントをお持ちの方は</span>
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="ml-1 font-medium text-primary hover:underline"
              >
                ログイン
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUpForm; 