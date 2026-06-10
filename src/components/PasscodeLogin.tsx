import React, { useState, useRef, useEffect } from 'react';
import { Lock, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';

interface PasscodeLoginProps {
  onSuccess: () => void;
  adminEmail: string;
  adminPass: string;
}

const PasscodeLogin: React.FC<PasscodeLoginProps> = ({ onSuccess, adminEmail, adminPass }) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  // The secret PIN - ideally this would be matched after login, 
  // but for "bs 4 digit passcode" we check it before triggerring the background auth.
  const CORRECT_PIN = "1234"; 

  const handleInput = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleLogin = async (finalPin: string) => {
    if (finalPin !== CORRECT_PIN) {
      setError('Invalid Passcode');
      setPin(['', '', '', '']);
      inputRefs[0].current?.focus();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Trigger background secure login
      await signInWithEmailAndPassword(auth, adminEmail, adminPass);
      onSuccess();
    } catch (err: any) {
      console.error('Passcode Auth Error:', err);
      setError('System Access Error. Please check admin account.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pin.every(digit => digit !== '')) {
      handleLogin(pin.join(''));
    }
  }, [pin]);

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-8 max-w-sm mx-auto bg-white rounded-[40px] shadow-2xl border border-slate-100 font-auth">
      <div className="w-20 h-20 bg-primary/10 rounded-[32px] flex items-center justify-center text-primary shadow-inner">
        <Lock size={36} strokeWidth={2.5} />
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Admin Access</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Enter 4-Digit Passcode</p>
      </div>

      <div className="flex gap-3">
        {pin.map((digit, idx) => (
          <input
            key={idx}
            ref={inputRefs[idx]}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleInput(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            disabled={loading}
            className="w-14 h-18 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center text-2xl font-black text-slate-900 focus:border-primary focus:bg-white outline-none transition-all shadow-sm disabled:opacity-50"
          />
        ))}
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-500/10 text-rose-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
        >
          {error}
        </motion.div>
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-primary" size={24} />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verifying Identity...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-slate-300">
          <ShieldCheck size={16} />
          <span className="text-[9px] font-black uppercase tracking-widest">Encrypted Tunnel Active</span>
        </div>
      )}
    </div>
  );
};

export default PasscodeLogin;
