import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideUser, GraduationCap, Loader2, Smartphone, MapPin, Mail } from 'lucide-react';
import { useAuthState, AuthMode, AuthStep } from '../../hooks/useAuthState';
import { AuthHandlers } from '../../services/auth.handlers';
import { cn } from '../../utils';
import { UserType } from '../../types';
import { CITIES_LIST } from '../../utils/constants';

interface AuthModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  playTapSound: () => void;
  setActiveToast: (toast: { title: string; body: string }) => void;
  userType: UserType | null;
  setUserType: (type: UserType | null) => void;
  userName?: string | null;
  initialMode?: AuthMode;
  initialStep?: AuthStep;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  show,
  onClose,
  onSuccess,
  playTapSound,
  setActiveToast,
  userType,
  setUserType,
  userName,
  initialMode,
  initialStep
  }) => {
  const authState = useAuthState();
  const {
  email, setEmail,
  phone, setPhone,
  userName: authUserName, setUserName: setAuthUserName,
  userCity, setUserCity,
  userEmail, setUserEmail,
  loginMethod, setLoginMethod,
  countryCode, setCountryCode,
  password, setPassword,
  isAuthLoading, setIsAuthLoading,
  authError, setAuthError,
  resetPin, setResetPin,
  generatedOtp, setGeneratedOtp,
  newPassword, setNewPassword,
  confirmPassword, setRetypePassword,
  authMode, setAuthMode,
  authStep, setAuthStep,
  emailChecked, setEmailChecked,
  isEmailExist, setEmailExist,
  showPassword, setShowPassword,
  resendTimer, setResendTimer
  } = authState;

  const countryCodes = [
    { code: '+91', country: 'India', flag: '🇮🇳' }
  ];

  React.useEffect(() => {
  if (show) {
    if (initialMode) setAuthMode(initialMode);
    if (initialStep) setAuthStep(initialStep);
    setCountryCode('+91');
  }
  }, [show, initialMode, initialStep, setAuthMode, setAuthStep, setCountryCode]);

  // Countdown logic for Resend PIN
  React.useEffect(() => {
  let interval: any;
  if (resendTimer > 0) {
    interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
  }
  return () => clearInterval(interval);
  }, [resendTimer, setResendTimer]);

  if (!show) return null;

  const handleSuccess = (data: any) => {
    const finalEmail = data.user?.email || (userEmail ? userEmail : (email.includes('@') ? email : (phone ? `${phone}@whatsapp.com` : (email ? `${email}@whatsapp.com` : ''))));
    onSuccess({ ...data, email: finalEmail });
  };

  const ctx = {
  email, phone, countryCode, password, userType, resetPin, generatedOtp, setGeneratedOtp, newPassword, confirmPassword,
  setIsAuthLoading, setAuthError, setEmailChecked, setEmailExist,
  setAuthMode, setAuthStep, setUserType, onSuccess: handleSuccess, setActiveToast, playTapSound, setPhone, 
  userName: authUserName, setUserName: setAuthUserName, userCity, setUserCity, userEmail, setUserEmail, isEmailExist
  };

  const handleAction = () => {
    if (authStep === 'email') {
      AuthHandlers.handleEmailProceed(ctx);
    } else if (authStep === 'otp') {
      AuthHandlers.handleVerifyOTP(ctx);
    } else if (authStep === 'auth') {
      AuthHandlers.handleRegistration(ctx);
    }
  };

  return (
  <div className="fixed inset-0 z-[20000] flex flex-col font-auth bg-[#F9FAFB] overflow-y-auto no-scrollbar">
    <div className="min-h-full w-full flex flex-col items-center justify-center px-8 pb-10">

      {/* Logo Section */}
      <div className="mb-8 text-center w-full">
        <h1 className="text-[24px] sm:text-[28px] font-black tracking-tighter bg-linear-to-r from-[#C82333] to-[#2563EB] bg-clip-text text-transparent whitespace-nowrap overflow-hidden">
          DoAble India Enterprises
        </h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">India's Leading Tuitions Network</p>
      </div>

      <AnimatePresence mode="wait">
        {authStep === 'email' ? (
          <motion.div key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col items-center space-y-8">
            <div className="text-center space-y-3 px-4">
              <h3 className="text-[20px] font-bold text-black leading-tight">Log in or Sign up</h3>
              <p className="text-slate-600 text-[13px] font-medium">Enter your WhatsApp number</p>
            </div>

            <div className="w-full space-y-5">
              <div className="relative flex items-center bg-slate-100/60 rounded-2xl px-5 focus-within:bg-white focus-within:ring-4 focus-within:ring-rose-50/50 transition-all duration-300 shadow-sm">
                <div className="relative flex items-center mr-4 border-r border-slate-200/50 pr-4">
                  <select 
                    value={countryCode} 
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="appearance-none bg-transparent text-[17px] font-bold text-slate-700 outline-none pr-1 cursor-pointer"
                  >
                    {countryCodes.map(c => (
                      <option key={`${c.country}-${c.code}`} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                </div>
                <input 
                  type="tel"
                  maxLength={10}
                  value={email} 
                  onChange={(e) => setEmail(e.target.value.replace(/\D/g, ''))} 
                  onKeyDown={(e) => e.key === 'Enter' && handleAction()}
                  placeholder="9876543210" 
                  className="w-full py-5 text-[17px] font-semibold text-slate-800 outline-none bg-transparent placeholder:text-slate-400/50" 
                  autoFocus
                />
              </div>

                {authError && <div className="text-rose-500 text-[11px] font-medium text-center">{authError}</div>}

                <div className="space-y-3">
                <button 
                  onClick={handleAction}
                  disabled={isAuthLoading}
                  className="w-full bg-linear-to-r from-[#C82333] to-[#2563EB] text-white py-3.5 rounded-xl font-bold text-[13px] uppercase tracking-wider shadow-md active:scale-[0.98] transition-all flex items-center justify-center"
                >
                  {isAuthLoading ? <Loader2 size={18} className="animate-spin" /> : 'REQUEST OTP'}
                </button>
                </div>
              </div>
            </motion.div>
          ) : authStep === 'otp' ? (
            <motion.div key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col items-center space-y-8">
              <div className="text-center space-y-2">
                <span className={cn(
                  "text-[11px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full",
                  isEmailExist ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                )}>
                  {isEmailExist ? `Welcome Back${authUserName ? ', ' + authUserName : ''}! 👋` : 'Creating New Account ✨'}
                </span>
                <h3 className="text-[20px] font-bold text-black uppercase tracking-tight pt-2">Verify Code</h3>
                <p className="text-slate-500 text-[12px] font-medium">OTP sent to {countryCode} {phone || email}</p>
              </div>

              <div className="w-full space-y-5">
                <input 
                  type="text" 
                  maxLength={4}
                  value={resetPin} 
                  onChange={(e) => setResetPin(e.target.value.replace(/\D/g, ''))} 
                  onKeyDown={(e) => e.key === 'Enter' && handleAction()}
                  placeholder="Enter OTP" 
                  className="w-full bg-white border border-slate-200 rounded-xl py-4 text-center text-xl font-bold tracking-[0.5em] text-slate-800 outline-none focus:border-[#C82333] shadow-sm" 
                  autoFocus
                />

                {authError && <div className="text-rose-500 text-[11px] font-medium text-center">{authError}</div>}

                <button 
                  onClick={handleAction}
                  disabled={isAuthLoading}
                  className="w-full bg-linear-to-r from-[#C82333] to-[#2563EB] text-white py-3.5 rounded-xl font-bold text-[13px] uppercase tracking-wider shadow-md active:scale-[0.98] transition-all flex items-center justify-center"
                >
                  {isAuthLoading ? <Loader2 size={18} className="animate-spin" /> : 'VERIFY & SIGN IN'}
                </button>

                <button 
                  onClick={() => setAuthStep('email')}
                  className="w-full text-slate-500 py-1 text-[14px] font-normal hover:underline"
                >
                  Edit Number
                </button>
              </div>
            </motion.div>
          ) : authStep === 'selection' ? (
            <motion.div key="selection" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col items-center space-y-8">
              <div className="text-center space-y-2">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] bg-blue-50 text-blue-600 px-3 py-1 rounded-full">One Last Step ✨</span>
                <h3 className="text-[20px] font-bold text-black pt-2">Join DoAble India as</h3>
                <p className="text-slate-500 text-[12px] font-medium">Select your role to continue</p>
              </div>

              <div className="w-full grid grid-cols-1 gap-4">
                <button 
                  onClick={() => { 
                    playTapSound(); 
                    setUserType('teacher'); 
                    setEmail(''); // Clear for name input
                    setAuthStep('auth');
                  }}
                  className="group relative flex flex-col items-center p-6 bg-white border-2 border-slate-100 rounded-2xl hover:border-[#C82333] transition-all"
                >
                  <div className="w-14 h-14 bg-rose-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <GraduationCap className="text-[#C82333]" size={28} />
                  </div>
                  <span className="text-[15px] font-bold text-slate-800">Teacher / Tutor</span>
                  <span className="text-[11px] text-slate-400 mt-1">I want to teach students</span>
                </button>

                <button 
                  onClick={() => { 
                    playTapSound(); 
                    setUserType('parent'); 
                    handleSuccess({ status: 'success', user: { email: `${phone}@whatsapp.com`, phone, userType: 'parent' } }); 
                  }}
                  className="group relative flex flex-col items-center p-6 bg-white border-2 border-slate-100 rounded-2xl hover:border-[#2563EB] transition-all"
                >
                  <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <LucideUser className="text-[#2563EB]" size={28} />
                  </div>
                  <span className="text-[15px] font-bold text-slate-800">Parent / Student</span>
                  <span className="text-[11px] text-slate-400 mt-1">I am looking for a tutor</span>
                </button>
              </div>

              <button 
                onClick={() => setAuthStep('email')}
                className="text-slate-400 text-[13px] font-medium hover:underline"
              >
                Back to Login
              </button>
            </motion.div>
          ) : authStep === 'auth' ? (
            <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col items-center space-y-8">
              <div className="text-center space-y-2">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] bg-rose-50 text-[#C82333] px-3 py-1 rounded-full">New Teacher Profile ✨</span>
                <h3 className="text-[20px] font-bold text-black pt-2">Complete your profile</h3>
                <p className="text-slate-500 text-[12px] font-medium">To start exploring jobs</p>
              </div>

              <div className="w-full space-y-4">
                {/* Name Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                  <div className="relative flex items-center bg-slate-100/60 rounded-2xl px-5 focus-within:bg-white focus-within:ring-4 focus-within:ring-rose-50/50 transition-all duration-300 shadow-sm">
                    <LucideUser className="mr-4 text-slate-400" size={18} />
                    <input 
                      type="text"
                      value={authUserName} 
                      onChange={(e) => setAuthUserName(e.target.value)} 
                      placeholder="Enter your full name" 
                      className="w-full py-5 text-[15px] font-semibold text-slate-800 outline-none bg-transparent placeholder:text-slate-400/50" 
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                  <div className="relative flex items-center bg-slate-100/60 rounded-2xl px-5 focus-within:bg-white focus-within:ring-4 focus-within:ring-rose-50/50 transition-all duration-300 shadow-sm">
                    <Mail className="mr-4 text-slate-400" size={18} />
                    <input 
                      type="email"
                      value={userEmail} 
                      onChange={(e) => setUserEmail(e.target.value)} 
                      placeholder="Enter your email address" 
                      className="w-full py-5 text-[15px] font-semibold text-slate-800 outline-none bg-transparent placeholder:text-slate-400/50" 
                    />
                  </div>
                </div>

                {/* City Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Select City</label>
                  <div className="relative flex items-center bg-slate-100/60 rounded-2xl px-5 focus-within:bg-white focus-within:ring-4 focus-within:ring-rose-50/50 transition-all duration-300 shadow-sm">
                    <MapPin className="mr-4 text-slate-400" size={18} />
                    <select 
                      value={userCity} 
                      onChange={(e) => setUserCity(e.target.value)}
                      className="w-full py-5 text-[15px] font-semibold text-slate-800 outline-none bg-transparent appearance-none"
                    >
                      <option value="">Select your city</option>
                      {CITIES_LIST.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {authError && <div className="text-rose-500 text-[11px] font-medium text-center">{authError}</div>}

                <button 
                  onClick={handleAction}
                  disabled={isAuthLoading}
                  className="w-full bg-linear-to-r from-[#C82333] to-[#2563EB] text-white py-4 rounded-xl font-bold text-[14px] uppercase tracking-wider shadow-md active:scale-[0.98] transition-all flex items-center justify-center"
                >
                  {isAuthLoading ? <Loader2 size={18} className="animate-spin" /> : 'Explore Jobs'}
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="w-full pt-8">
              <button 
                onClick={() => setAuthStep('email')}
                className="w-full bg-linear-to-r from-[#C82333] to-[#2563EB] text-white py-3.5 rounded-xl font-bold text-[13px] uppercase tracking-wider shadow-md active:scale-[0.98] transition-all flex items-center justify-center"
              >
                Return to Mobile Login
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
