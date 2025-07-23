'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import SignUpForm from '@/components/auth/SignUpForm';

type AuthMode = 'login' | 'signup';

const AuthPage: React.FC = () => {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const handleSwitchToSignUp = () => {
    setAuthMode('signup');
  };

  const handleSwitchToLogin = () => {
    setAuthMode('login');
  };

  const handleSwitchToResetPassword = () => {
    router.push('/auth/sendemail');
  };

  return (
    <div>
      {authMode === 'login' ? (
        <LoginForm
          onSwitchToSignUp={handleSwitchToSignUp}
          onSwitchToResetPassword={handleSwitchToResetPassword}
        />
      ) : (
        <SignUpForm onSwitchToLogin={handleSwitchToLogin} />
      )}
    </div>
  );
};

export default AuthPage; 