import { useState, useCallback } from 'react';

export type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset';
export type AuthStep = 'email' | 'selection' | 'auth' | 'otp';

export function useAuthState() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [password, setPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [resetPin, setResetPin] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setRetypePassword] = useState('');
  const [userName, setUserName] = useState('');
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [authStep, setAuthStep] = useState<AuthStep>('email');
  const [emailChecked, setEmailChecked] = useState(false);
  const [isEmailExist, setEmailExist] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const resetAuthForm = useCallback(() => {
    setEmail('');
    setPhone('');
    setPassword('');
    setAuthError(null);
    setResetPin('');
    setGeneratedOtp('');
    setNewPassword('');
    setRetypePassword('');
    setUserName('');
    setLoginMethod('phone');
    setEmailChecked(false);
    setEmailExist(false);
    setShowPassword(false);
    setResendTimer(0);
  }, []);

  return {
    email, setEmail,
    phone, setPhone,
    countryCode, setCountryCode,
    password, setPassword,
    isAuthLoading, setIsAuthLoading,
    authError, setAuthError,
    resetPin, setResetPin,
    generatedOtp, setGeneratedOtp,
    newPassword, setNewPassword,
    confirmPassword, setRetypePassword,
    userName, setUserName,
    loginMethod, setLoginMethod,
    authMode, setAuthMode,
    authStep, setAuthStep,
    emailChecked, setEmailChecked,
    isEmailExist, setEmailExist,
    showPassword, setShowPassword,
    resendTimer, setResendTimer,
    resetAuthForm
  };
}
