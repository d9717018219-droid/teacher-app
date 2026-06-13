import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ShieldCheck, 
  BadgeCheck,
  Crown, 
  Zap,
  TrendingUp,
  Loader2,
  CheckCircle2,
  Star,
  Search
} from 'lucide-react';
import { cn } from '../utils';

interface TutorVerificationFlowProps {
  onClose: () => void;
  tutorName: string | null;
  tutorPhone?: string;
  tutorId?: string;
  playTapSound: () => void;
}

type FlowStep = 'landing' | 'plans' | 'cart';

const loadZohoPayments = () => {
  return new Promise((resolve) => {
    if ((window as any).ZPayments) {
        resolve(true);
        return;
    }
    const script = document.createElement('script');
    script.src = 'https://static.zohocdn.com/zpay/zpay-js/v1/zpayments.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const TutorVerificationFlow: React.FC<TutorVerificationFlowProps> = ({ 
    onClose, 
    tutorName,
    tutorPhone = '',
    tutorId = '',
    playTapSound
}) => {
  const [step, setStep] = useState<FlowStep>('landing');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    id: string;
    name: string;
    validity: string;
    price: number;
    originalPrice: number;
    discount: number;
  } | null>(null);

  const plans = [
    { id: 'monthly', name: 'Monthly Verified', validity: '1 Month', price: 99, originalPrice: 199, discount: 50 },
    { id: 'yearly', name: 'Yearly Pro', validity: '1 Year', price: 999, originalPrice: 2388, discount: 58 },
  ];

  const handlePayment = async (amount: number) => {
    setIsProcessing(true);
    
    try {
        const loaded = await loadZohoPayments();
        if (!loaded) {
          alert('Zoho Payments SDK failed to load. Please check your connection.');
          setIsProcessing(false);
          return;
        }

        const API_URL = Capacitor.isNativePlatform() 
          ? 'https://doableindia.com/app-sys/api_create_session.php' 
          : '/api/payment/create-session';

        const sessionRes = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: amount,
                description: `Tutor Verification - ${selectedPlan?.name}`,
                customer_name: tutorName || 'Tutor',
                customer_email: `${tutorPhone}@tutor.doableindia.com`,
                customer_phone: tutorPhone
            })
        });

        const sessionData = await sessionRes.json();
        
        if (sessionData.status !== 'success' || !sessionData.payment_session_id) {
            console.error('Zoho Session Error:', sessionData);
            alert(`Failed to initialize payment: ${sessionData.message || 'Unknown Error'}`);
            setIsProcessing(false);
            return;
        }

        const config = {
          account_id: "60036233618",
          domain: "IN",
          otherOptions: {
            api_key: "1003.f6e071972486380d3a600428da7931d5.5098f6ce3823951aaaf3227560d9b912",
            is_test_mode: false
          }
        };

        const instance = new (window as any).ZPayments(config);

        instance.requestPaymentMethod({
          payments_session_id: sessionData.payment_session_id,
          amount: String(amount),
          currency_code: 'INR',
          description: `Verification: ${selectedPlan?.name}`,
          business: 'DoAble India',
          address: {
            name: tutorName || 'Tutor',
            email: `${tutorPhone}@tutor.doableindia.com`,
            phone: tutorPhone
          }
        }).then(async (response: any) => {
          console.log("Zoho Payment Success:", response);
          
          // Update verification status in DB
          try {
            await fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: tutorPhone,
                    verified: 'Yes',
                    action: 'upsert'
                })
            });
          } catch (e) {
            console.error('Failed to update verification status:', e);
          }

          alert('Payment Successful! Your profile is now being verified.');
          onClose();
        }).catch((error: any) => {
          if (error && error.code !== 'widget_closed') {
            console.error('Zoho Payment Error:', error);
            alert(`Payment Failed: ${error.message || 'Unknown Error'}`);
          }
          setIsProcessing(false);
        });

    } catch (error: any) {
        console.error('Zoho Payment Catch:', error);
        alert(`An error occurred: ${error.message || 'Check console'}`);
        setIsProcessing(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'landing':
        return (
          <div className="flex flex-col bg-[#0F172A] h-full overflow-hidden relative">
            {/* Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full" />
            <div className="absolute bottom-[20%] right-[-10%] w-80 h-80 bg-indigo-600/10 blur-[120px] rounded-full" />

            <div className="relative z-10 flex flex-col h-full">
              <div className="pt-20 pb-10 px-8 flex flex-col items-center text-center shrink-0">
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[28px] flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/20 border border-white/20"
                >
                  <ShieldCheck className="text-white" size={40} strokeWidth={2.5} />
                </motion.div>
                <h1 className="text-3xl font-[1000] text-white tracking-tight uppercase leading-none">Verified Tutor</h1>
                <p className="text-[11px] font-black text-blue-400 tracking-[0.4em] mt-4 opacity-80 uppercase">Elite Professional Program</p>
              </div>

              <div className="px-8 space-y-4 flex-1 overflow-y-auto no-scrollbar pb-32">
                {[
                  { icon: <BadgeCheck className="text-emerald-400" />, title: 'Trusted Seal', desc: 'Get a blue checkmark on your profile' },
                  { icon: <Search className="text-sky-400" />, title: 'Top Visibility', desc: 'Appear at the top of parent searches' },
                  { icon: <TrendingUp className="text-amber-400" />, title: '5x More Leads', desc: 'Verified tutors get contacted more often' },
                  { icon: <Star className="text-purple-400" />, title: 'Priority Support', desc: 'Direct access to support coordinators' }
                ].map((item, i) => (
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="flex items-center gap-5 bg-white/5 backdrop-blur-md p-5 rounded-[24px] border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/5">
                      {item.icon}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-[14px] font-black text-white leading-none tracking-tight">{item.title}</h3>
                      <p className="text-[11px] font-bold text-slate-400/80 leading-snug">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-[#0F172A] via-[#0F172A] to-transparent pt-20">
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-5 rounded-[24px] border border-amber-500/20 mb-6 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2 text-amber-500">
                    <Crown size={18} strokeWidth={2.5} />
                    <span className="text-[10px] font-black uppercase tracking-[0.1em]">Instant Trust Factor</span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-300 leading-relaxed">
                    Parents prefer verified profiles for safety and quality assurance. Increase your hiring chance by <span className="text-emerald-400">400%</span> today.
                  </p>
                </div>

                <button 
                  onClick={() => { playTapSound(); setStep('plans'); }}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-5 rounded-[22px] font-black text-[13px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  Join Verified Program <ChevronRight size={18} strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        );
      case 'plans':
        return (
          <div className="flex flex-col bg-[#F8FAFC] h-full overflow-hidden">
            <div className="bg-[#0F172A] pt-16 pb-12 px-6 shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex flex-col">
                    <h2 className="text-white font-black text-xl tracking-tight uppercase">Select Plan</h2>
                    <span className="text-blue-400/60 text-[10px] font-black uppercase tracking-widest mt-1">Unlock All Benefits</span>
                </div>
                <button onClick={() => { playTapSound(); setStep('landing'); }} className="p-2 bg-white/10 rounded-xl text-white"><ChevronLeft size={20}/></button>
              </div>
            </div>

            <div className="flex-1 -mt-6 px-6 space-y-4 pt-2 overflow-y-auto no-scrollbar">
              {plans.map(plan => (
                <button 
                  key={plan.id}
                  onClick={() => { playTapSound(); setSelectedPlan(plan); }}
                  className={cn(
                    "w-full bg-white p-6 rounded-[32px] border-2 transition-all flex items-center justify-between relative overflow-hidden active:scale-[0.98]",
                    selectedPlan?.id === plan.id ? "border-blue-500 shadow-xl shadow-blue-500/10 bg-blue-50/30" : "border-slate-100"
                  )}
                >
                  <div className="flex flex-col items-start gap-1">
                      <span className="text-[14px] font-black text-slate-900 uppercase tracking-tight">{plan.name}</span>
                      <span className="text-[10px] font-bold text-slate-400">{plan.validity} Access</span>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                          <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                              {plan.discount}% Off
                          </span>
                          <span className="text-xl font-black text-slate-900">₹{plan.price}</span>
                      </div>
                      <span className="text-[9px] text-slate-300 line-through font-bold">₹{plan.originalPrice}</span>
                  </div>

                  {selectedPlan?.id === plan.id && (
                      <div className="absolute top-0 right-0 p-1.5 bg-blue-500 rounded-bl-xl">
                          <CheckCircle2 size={12} className="text-white" />
                      </div>
                  )}
                </button>
              ))}
            </div>

            <div className="p-6 bg-white border-t border-slate-100 pb-12">
              <button 
                onClick={() => { playTapSound(); setStep('cart'); }}
                disabled={!selectedPlan}
                className="w-full bg-[#0F172A] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
              >
                Proceed to Pay
              </button>
            </div>
          </div>
        );
      case 'cart':
        return (
          <div className="flex flex-col bg-[#F8FAFC] h-full overflow-hidden">
            <div className="bg-white pt-16 pb-6 px-6 flex items-center gap-4 shrink-0 border-b border-slate-100">
              <button onClick={() => { playTapSound(); setStep('plans'); }} className="p-2 bg-slate-50 rounded-xl"><ChevronLeft size={20} /></button>
              <h2 className="text-lg font-[1000] text-slate-900 uppercase tracking-tight">Checkout</h2>
            </div>

            <div className="p-6 space-y-6 flex-1 flex flex-col justify-center">
              <div className="bg-white rounded-[32px] p-6 border-2 border-slate-100 shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
                  <ShieldCheck className="text-blue-500" size={24} />
                </div>
                <div className="flex-1 space-y-1">
                    <h3 className="text-[16px] font-black text-slate-900 leading-none">{selectedPlan?.name}</h3>
                    <p className="text-[11px] font-bold text-slate-400">Professional Tutor Verification</p>
                    <div className="flex items-center gap-2 pt-2">
                        <span className="text-xl font-black text-slate-900">₹{selectedPlan?.price}</span>
                        <span className="text-[10px] font-bold text-emerald-500">Includes Verified Badge</span>
                    </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Price Details</h3>
                <div className="bg-white rounded-[32px] p-6 border-2 border-slate-100 space-y-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-slate-500">Subscription Fee</span>
                        <span className="font-bold text-slate-900">₹{selectedPlan?.originalPrice}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-slate-500">Offer Discount</span>
                        <span className="font-bold text-emerald-500">-₹{selectedPlan!.originalPrice - selectedPlan!.price}</span>
                    </div>
                    <div className="h-px bg-slate-100" />
                    <div className="flex items-center justify-between">
                        <span className="font-black text-slate-900 text-base uppercase tracking-tight">Total Amount</span>
                        <span className="font-black text-blue-600 text-2xl tracking-tighter">₹{selectedPlan?.price}</span>
                    </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border-t border-slate-100 pb-12">
                <button 
                    onClick={() => { playTapSound(); handlePayment(selectedPlan?.price || 0); }}
                    disabled={isProcessing}
                    className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Processing...
                        </>
                    ) : (
                        `Pay Securely ₹${selectedPlan?.price}`
                    )}
                </button>
            </div>
          </div>
        );
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-[30000] bg-white flex flex-col overflow-hidden"
    >
      <button 
        onClick={onClose}
        className={cn(
            "absolute top-6 right-6 p-2.5 rounded-full z-[30001] transition-all active:scale-95",
            step === 'landing' || step === 'plans' ? "bg-white/10 text-white" : "bg-slate-100 text-slate-400"
        )}
      >
        <X size={20} strokeWidth={3} />
      </button>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
