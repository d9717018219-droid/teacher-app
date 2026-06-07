import { useState, useCallback } from 'react';

export type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset';
export type AuthStep = 'email' | 'selection' | 'auth';

export function useAuthState() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [resetPin, setResetPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setRetypePassword] = useState('');
  
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [authStep, setAuthStep] = useState<AuthStep>('email');
  const [emailChecked, setEmailChecked] = useState(false);
  const [isEmailExist, setEmailExist] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const resetAuthForm = useCallback(() => {
    setEmail('');
    setPassword('');
    setAuthError(null);
    setResetPin('');
    setNewPassword('');
    setRetypePassword('');
    setEmailChecked(false);
    setEmailExist(false);
    setShowPassword(false);
    setResendTimer(0);
  }, []);

  return {
    email, setEmail,
    password, setPassword,
    isAuthLoading, setIsAuthLoading,
    authError, setAuthError,
    resetPin, setResetPin,
    newPassword, setNewPassword,
    confirmPassword, setRetypePassword,
    authMode, setAuthMode,
    authStep, setAuthStep,
    emailChecked, setEmailChecked,
    isEmailExist, setEmailExist,
    showPassword, setShowPassword,
    resendTimer, setResendTimer,
    resetAuthForm
  };
}
