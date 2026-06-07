import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideUser, GraduationCap, Mail, Lock, Eye, EyeOff, Hash, AlertCircle, Loader2, ChevronLeft } from 'lucide-react';
import { useAuthState, AuthMode, AuthStep } from '../../hooks/useAuthState';
import { AuthHandlers } from '../../services/auth.handlers';
import { cn } from '../../utils';
import { UserType } from '../../types';

interface AuthModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  onGoogleSignIn: () => void;
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
  onGoogleSignIn,
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
    resendTimer, setResendTimer
  } = authState;

  React.useEffect(() => {
    if (show) {
      if (initialMode) setAuthMode(initialMode);
      if (initialStep) setAuthStep(initialStep);
    }
  }, [show, initialMode, initialStep, setAuthMode, setAuthStep]);

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
    onSuccess({ ...data, email: email });
  };

  const ctx = {
    email, password, userType, resetPin, newPassword, confirmPassword,
    setIsAuthLoading, setAuthError, setEmailChecked, setEmailExist,
    setAuthMode, setAuthStep, setUserType, onSuccess: handleSuccess, setActiveToast, playTapSound
  };

  const handleAction = () => {
    if (authStep === 'email') {
      AuthHandlers.handleEmailProceed(ctx);
    } else if (authMode === 'signin') {
      AuthHandlers.handleEmailSignIn(ctx);
    } else if (authMode === 'signup') {
      AuthHandlers.handleEmailSignUp(ctx);
    } else if (authMode === 'forgot') {
      setResendTimer(10); // Start timer when forgot password is first triggered
      AuthHandlers.handleForgotPassword(ctx);
    } else {
      AuthHandlers.handleResetPassword(ctx);
    }
  };

  const handleResendPIN = () => {
    if (resendTimer > 0) return;
    playTapSound();
    setResendTimer(10);
    AuthHandlers.handleForgotPassword(ctx);
  };

  return (
    <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 font-genz">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/95" onClick={onClose} />
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="relative w-full max-sm:max-w-sm max-w-sm">
        <AnimatePresence mode="wait">
          {authStep === 'email' ? (
            <motion.div key="email" initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -10, opacity: 0 }} className="bg-white rounded-[40px] p-8 shadow-2xl space-y-6">
              <div className="space-y-2 text-center">
                <h3 className="text-3xl font-black tracking-tighter text-slate-900 leading-tight">Welcome 👋</h3>
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.1em]">Ready to find your perfect match?</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && handleAction()}
                      placeholder="name@example.com" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all" 
                      autoFocus
                    />
                  </div>
                </div>

                {authError && <div className="text-rose-500 text-[10px] font-bold px-1 flex items-center gap-1.5"><AlertCircle size={12} /> {authError}</div>}

                <button 
                  onClick={handleAction}
                  disabled={isAuthLoading}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isAuthLoading ? <Loader2 size={16} className="animate-spin" /> : 'Continue'}
                </button>
              </div>
            </motion.div>
          ) : authStep === 'selection' ? (
            <motion.div key="selection" initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -10, opacity: 0 }} className="space-y-6 text-center">
              <div className="flex justify-between items-center px-2">
                <button onClick={() => { playTapSound(); setAuthStep('email'); }} className="text-slate-400 hover:text-white/50"><ChevronLeft size={20} /></button>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Setup Role</p>
                <div className="w-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Choose Your Path</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">How would you like to proceed?</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={() => { 
                    playTapSound(); 
                    setUserType('parent'); 
                    localStorage.setItem('userType', 'parent'); 
                    setAuthStep('auth'); 
                  }}
                  className="group bg-white p-6 rounded-[32px] flex items-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    <LucideUser size={24} strokeWidth={3} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">I'm a Parent</h4>
                    <p className="text-[10px] font-bold text-slate-400">Looking for professional tutors</p>
                  </div>
                </button>
                <button 
                  onClick={() => { 
                    playTapSound(); 
                    setUserType('teacher'); 
                    localStorage.setItem('userType', 'teacher'); 
                    setAuthStep('auth'); 
                  }}
                  className="group bg-white p-6 rounded-[32px] flex items-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    <GraduationCap size={24} strokeWidth={3} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">I'm a Tutor</h4>
                    <p className="text-[10px] font-bold text-slate-400">Want to join the elite network</p>
                  </div>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="auth" initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -10, opacity: 0 }} className="bg-white rounded-[40px] p-8 shadow-2xl space-y-6">
              <div className="flex justify-center items-center text-center relative">
                <div className="space-y-1.5">
                  <h3 className="text-2xl font-black tracking-tighter text-slate-900 leading-tight">
                    {authMode === 'signin' ? 'Welcome Back' : authMode === 'signup' ? 'Create Account' : authMode === 'forgot' ? 'Forgot Password' : 'Reset Password'}
                  </h3>
                  {authMode === 'signin' && (
                    <div className="flex flex-col items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-500">
                      <div className="px-4 py-1 bg-primary/10 rounded-full border border-primary/10">
                        <span className="text-[11px] font-black text-primary uppercase tracking-widest">
                          {userName ? `${userName} (${userType === 'teacher' ? 'Tutor' : 'Parent'})` : (userType === 'teacher' ? 'Tutor' : 'Parent')} 👋
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {authMode !== 'reset' ? (
                  <>
                    {emailChecked ? (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-center relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                         <p className="text-[11px] font-bold text-slate-800 break-all relative z-10">{email}</p>
                         <button 
                           onClick={() => { 
                             playTapSound(); 
                             setEmailChecked(false); 
                             setEmailExist(false);
                             setUserType(null);
                             setPassword('');
                             setAuthError(null);
                             setAuthStep('email'); 
                           }} 
                           className="text-[9px] font-black text-primary uppercase tracking-widest relative z-10 hover:opacity-70 transition-opacity"
                         >
                           Not you? <span className="underline">Change Email</span>
                         </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center ml-1">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email Address</label>
                        </div>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                          <input 
                            type="email" 
                            value={email} 
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 opacity-50 outline-none" 
                            readOnly
                          />
                          <button onClick={() => { setEmailChecked(false); setAuthStep('email'); setAuthError(null); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-primary uppercase tracking-widest">Change</button>
                        </div>
                      </div>
                    )}

                    {authMode !== 'forgot' && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-1.5 overflow-hidden">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Password</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                          <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAction()} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-10 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all" autoFocus />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                            {showPassword ? <Eye size={18} strokeWidth={2.5} /> : <EyeOff size={18} strokeWidth={2.5} />}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </>
                ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                      <p className="text-[10px] font-bold text-primary text-center leading-relaxed">Enter the 6-digit PIN sent to <br/><span className="underline">{email}</span></p>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Security PIN</label>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input type="text" maxLength={6} value={resetPin} onChange={(e) => setResetPin(e.target.value)} placeholder="000000" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-center text-lg font-black tracking-[1em] text-slate-700 outline-none focus:border-primary transition-all" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 chars" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-10 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                          {showPassword ? <Eye size={18} strokeWidth={2.5} /> : <EyeOff size={18} strokeWidth={2.5} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setRetypePassword(e.target.value)} placeholder="Repeat password" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-10 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all" />
                      </div>
                    </div>

                    <div className="text-center pt-2">
                       <button 
                         onClick={handleResendPIN}
                         disabled={resendTimer > 0 || isAuthLoading}
                         className={cn(
                           "text-[10px] font-black uppercase tracking-widest transition-all",
                           resendTimer > 0 ? "text-slate-300" : "text-primary hover:opacity-70"
                         )}
                       >
                         {resendTimer > 0 ? `Resend PIN in ${resendTimer}s` : "Didn't get code? Resend PIN"}
                       </button>
                    </div>
                  </div>
                )}

                {authError && <div className="text-rose-500 text-[10px] font-bold px-1 flex items-center gap-1.5"><AlertCircle size={12} /> {authError}</div>}

                <button 
                  onClick={handleAction}
                  disabled={isAuthLoading}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isAuthLoading ? <Loader2 size={16} className="animate-spin" /> : (
                    authMode === 'signin' 
                      ? 'Sign In' 
                      : authMode === 'signup' 
                        ? 'Create Account' 
                        : authMode === 'forgot' 
                          ? 'Send PIN' 
                          : 'Verify & Reset'
                  )}
                </button>

                <div className="flex flex-col gap-3 pt-2">
                  {authMode === 'signin' && (
                    <button onClick={() => { setAuthMode('forgot'); setAuthError(null); }} className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-widest text-center">Forgot Password?</button>
                  )}
                  <button onClick={() => { playTapSound(); setAuthStep('email'); setEmailChecked(false); setAuthError(null); }} className="text-[10px] font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-widest text-center">Back to <span className="text-primary underline">Start</span></button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
