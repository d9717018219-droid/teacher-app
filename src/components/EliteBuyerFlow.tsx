import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Zap, 
  Phone, 
  Pin, 
  Crown, 
  PlayCircle, 
  Info, 
  X, 
  Minus, 
  Plus, 
  CreditCard, 
  ShieldCheck, 
  Wallet, 
  Building2, 
  Smartphone,
  CheckCircle2,
  HelpCircle,
  MapPin,
  Briefcase,
  Users,
  Loader2
} from 'lucide-react';
import { cn } from '../utils';

interface EliteBuyerFlowProps {
  onClose: () => void;
  userName: string | null;
  userCity?: string;
  userLocalities?: string[];
  userPhone?: string;
}

type FlowStep = 'landing' | 'packages' | 'cart';

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

export const EliteBuyerFlow: React.FC<EliteBuyerFlowProps> = ({ 
    onClose, 
    userName,
    userCity = 'Ghaziabad',
    userLocalities = ['Vaishali'],
    userPhone = ''
}) => {
  const [step, setStep] = useState<FlowStep>('landing');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<{
    id: string;
    name: string;
    contacts: number;
    validity: number;
    price: number;
    originalPrice: number;
    discount: number;
  } | null>(null);

  const handlePayment = async (amount: number) => {
    setIsProcessing(true);
    
    try {
        // 1. Load Zoho SDK
        const loaded = await loadZohoPayments();
        if (!loaded) {
          alert('Zoho Payments SDK failed to load. Are you online?');
          setIsProcessing(false);
          return;
        }

        // 2. Create Payment Session via Local API
        const sessionRes = await fetch('/api/payment/create-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: amount,
                description: selectedPackage?.name || 'Premium Support',
                customer_name: userName || 'Parent',
                customer_email: `${userPhone}@whatsapp.com`,
                customer_phone: userPhone
            })
        });

        const sessionData = await sessionRes.json();
        
        if (sessionData.status !== 'success' || !sessionData.payment_session_id) {
            console.error('Zoho Session Error:', sessionData);
            alert(`Failed to initialize payment session: ${sessionData.message || 'Unknown Error'}`);
            setIsProcessing(false);
            return;
        }

        // 3. Initialize Zoho ZPayments
        const config = {
          account_id: "60036233618",
          domain: "IN",
          otherOptions: {
            api_key: "1003.f6e071972486380d3a600428da7931d5.5098f6ce3823951aaaf3227560d9b912",
            is_test_mode: false
          }
        };

        if (!(window as any).ZPayments) {
            alert('Zoho Payments instance not found.');
            setIsProcessing(false);
            return;
        }

        const instance = new (window as any).ZPayments(config);

        // 4. Show Checkout Widget (Using requestPaymentMethod as per Zoho SDK)
        instance.requestPaymentMethod({
          payments_session_id: sessionData.payment_session_id,
          amount: String(amount),
          currency_code: 'INR',
          description: selectedPackage?.name || 'Premium Support',
          business: 'DoAble India',
          address: {
            name: userName || 'Parent',
            email: `${userPhone}@whatsapp.com`,
            phone: userPhone
          }
        }).then((response: any) => {
          console.log("Zoho Payment Success:", response);
          alert('Payment Successful! Payment ID: ' + response.payment_id);
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
        alert(`An error occurred: ${error.message || 'Check console for details'}`);
        setIsProcessing(false);
    }
  };

  const packages = [
    { id: '1-month', name: 'Standard Support', contacts: 1, validity: 30, price: 1500, originalPrice: 2000, discount: 25 },
    { id: '3-month', name: 'Premium Support', contacts: 3, validity: 90, price: 3000, originalPrice: 4500, discount: 33 },
    { id: '6-month', name: 'Ultimate Support', contacts: 6, validity: 180, price: 5000, originalPrice: 9000, discount: 44 },
  ];

  const handleShowPackages = () => setStep('packages');
  const handleSelectPackage = (pkg: typeof packages[0]) => {
    setSelectedPackage(pkg);
  };
  const handleViewCart = () => setStep('cart');

  const renderStep = () => {
    switch (step) {
      case 'landing':
        return <LandingStep onNext={handleShowPackages} city={userCity} localities={userLocalities} />;
      case 'packages':
        return (
          <PackagesStep 
            onNext={handleViewCart} 
            onBack={() => setStep('landing')} 
            onSelect={handleSelectPackage}
            selectedId={selectedPackage?.id || null}
            packages={packages}
            city={userCity}
            localities={userLocalities}
          />
        );
      case 'cart':
        return (
          <CartStep 
            onNext={() => handlePayment(selectedPackage?.price || 0)} 
            onBack={() => setStep('packages')} 
            pkg={selectedPackage!}
            city={userCity}
            isProcessing={isProcessing}
          />
        );
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-0 z-[20000] bg-white flex flex-col overflow-hidden h-screen max-h-screen"
    >
      {/* Top Right Close Button - Persistent */}
      <button 
        onClick={onClose}
        className={cn(
            "absolute top-6 right-6 p-2 rounded-full z-[20001] transition-all active:scale-95",
            step === 'landing' || step === 'packages' ? "bg-white/10 text-white hover:bg-white/20" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
        )}
      >
        <X size={20} strokeWidth={3} />
      </button>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full flex flex-col min-h-0 overflow-hidden"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ─── STEP 1: LANDING ────────────────────────────────────────────────
const LandingStep = ({ onNext, city, localities }: { onNext: () => void, city: string, localities: string[] }) => (
  <div className="flex flex-col bg-[#011B41] h-screen max-h-screen overflow-hidden">
    {/* Header */}
    <div className="pt-14 pb-4 px-6 flex flex-col items-center text-center shrink-0">
      <Crown className="text-amber-400 mb-2" size={20} />
      <h1 className="text-xl font-black text-white tracking-tight uppercase">Premium Support</h1>
      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Priority Matching</p>
    </div>

    {/* Benefits Card - Static Grid */}
    <div className="px-6 shrink-0">
      <div className="bg-[#0A2E5E] rounded-3xl p-5 border border-white/5 space-y-4 shadow-2xl">
        {[
            { icon: <Users size={16} />, title: 'Expert Coordinator', desc: 'Personal assistance' },
            { icon: <Zap size={16} />, title: 'Priority Match', desc: 'Fast track connection' },
            { icon: <ShieldCheck size={16} />, title: 'Match Guarantee', desc: '100% Refund policy' }
        ].map((item, i) => (
            <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white">
                    {item.icon}
                </div>
                <div className="space-y-0.5">
                    <h3 className="text-[11px] font-bold text-white leading-none">{item.title}</h3>
                    <p className="text-[9px] font-medium text-white/40">{item.desc}</p>
                </div>
            </div>
        ))}
      </div>
    </div>

    {/* Selection Area - Flush to Bottom */}
    <div className="flex-1 bg-white mt-6 rounded-t-[40px] px-6 pt-6 pb-10 flex flex-col justify-between overflow-hidden">
      <div className="space-y-4 min-h-0">
        <div className="flex items-center gap-2 px-1">
            <MapPin size={14} className="text-[#011B41]" />
            <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Service for</span>
                <span className="text-xs font-bold text-slate-900">{localities[0] || 'Ghaziabad'}, {city}</span>
            </div>
        </div>

        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50 space-y-2">
            <div className="flex items-center gap-2 text-emerald-700">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-bold uppercase tracking-tight">Service Guarantee</span>
            </div>
            <p className="text-[9px] font-medium text-emerald-800 leading-relaxed">
                Tutor not found? Get 100% refund. Includes Coordinator call, Demos, and continuous support.
            </p>
        </div>
      </div>

      <button 
        onClick={onNext}
        className="w-full bg-[#011B41] text-white py-4.5 rounded-2xl font-bold text-sm shadow-xl active:scale-[0.98] transition-all shrink-0 mt-4"
      >
        View Service Plans
      </button>
    </div>
  </div>
);

const BenefitItem = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="flex items-center justify-between gap-4">
    <div className="space-y-1">
      <h3 className="text-sm font-black text-white tracking-tight">{title}</h3>
      <p className="text-[11px] font-medium text-white/50">{desc}</p>
    </div>
    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/5">
      {icon}
    </div>
  </div>
);

const SelectionItem = ({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) => (
  <button className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group hover:border-slate-200 transition-all">
    <div className="flex flex-col items-start gap-0.5">
      <span className="text-[11px] font-black text-slate-900">{label}</span>
      <span className="text-[13px] font-medium text-slate-500">{value}</span>
    </div>
    <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
  </button>
);

// ─── STEP 2: PACKAGES ───────────────────────────────────────────────
const PackagesStep = ({ onNext, onBack, onSelect, selectedId, packages, city, localities }: { 
    onNext: () => void, 
    onBack: () => void, 
    onSelect: (pkg: any) => void,
    selectedId: string | null,
    packages: any[],
    city: string,
    localities: string[]
}) => (
  <div className="flex flex-col bg-[#F8F9FD] h-screen max-h-screen overflow-hidden">
    {/* Header */}
    <div className="bg-[#011B41] pt-14 pb-12 px-6 shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
            <h2 className="text-white font-bold text-lg">Select Plan</h2>
            <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={10} className="text-white/60" />
                <span className="text-white/60 text-[10px] font-medium">{localities[0] || ''}, {city}</span>
            </div>
        </div>
        <button className="text-white text-[10px] font-bold border border-white/20 px-3 py-1 rounded-lg">Help</button>
      </div>
    </div>

    {/* Content - Static List */}
    <div className="flex-1 -mt-6 px-4 space-y-3 min-h-0 flex flex-col">
      <div className="bg-white rounded-3xl p-3.5 shadow-sm flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 bg-[#011B41]/5 px-3 py-1 rounded-full border border-[#011B41]/10">
            <span className="text-[#011B41] text-[10px] font-bold tracking-tight">Premium Support</span>
            <span className="bg-amber-400 text-[7px] font-black px-1 rounded uppercase">Plus</span>
        </div>
        <button className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold">Service Details</button>
      </div>

      <div className="flex-1 space-y-3 overflow-hidden flex flex-col justify-around py-2">
        {packages.map(pkg => (
            <button 
                key={pkg.id}
                onClick={() => onSelect(pkg)}
                className={cn(
                    "w-full bg-white p-4 rounded-[24px] border transition-all flex items-center justify-between relative overflow-hidden",
                    selectedId === pkg.id ? "border-emerald-500 shadow-lg ring-2 ring-emerald-500/10" : "border-slate-100"
                )}
            >
                <div className="flex flex-col items-start gap-0.5">
                    <span className="text-[13px] font-bold text-slate-900">{pkg.name}</span>
                    <span className="text-[9px] font-medium text-slate-400">{pkg.validity} Days Validity</span>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                        <span className="bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                            {pkg.discount}% Off
                        </span>
                        <span className="text-base font-black text-slate-900">₹{pkg.price}</span>
                    </div>
                </div>

                {selectedId === pkg.id && (
                    <div className="absolute top-0 right-0 p-1 bg-emerald-500 rounded-bl-lg">
                        <CheckCircle2 size={10} className="text-white" />
                    </div>
                )}
            </button>
        ))}
      </div>
    </div>

    {/* Bottom Bar - Static */}
    <div className="h-28 bg-white border-t border-slate-100 px-6 py-4 shrink-0 flex flex-col justify-center">
        {selectedId ? (
            <div className="flex items-center gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">Total ₹ {packages.find(p => p.id === selectedId)?.price}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-500">Savings Applied</span>
                </div>
                <button 
                    onClick={onNext}
                    className="bg-[#011B41] text-white px-10 py-4 rounded-2xl font-bold text-sm tracking-wide"
                >
                    Proceed
                </button>
            </div>
        ) : (
            <p className="text-center text-slate-400 text-xs font-medium">Please select a plan to continue</p>
        )}
    </div>
  </div>
);

// ─── STEP 3: CART ──────────────────────────────────────────────────
const CartStep = ({ onNext, onBack, pkg, city, isProcessing }: { onNext: () => void, onBack: () => void, pkg: any, city: string, isProcessing: boolean }) => (
  <div className="flex flex-col bg-[#F8F9FD] h-screen max-h-screen overflow-hidden">
    {/* Header */}
    <div className="bg-white pt-14 pb-4 px-6 flex items-center gap-4 shrink-0">
      <button onClick={onBack} className="p-2 -ml-2"><ChevronLeft size={24} /></button>
      <h2 className="text-xl font-black text-slate-900">My Cart</h2>
    </div>

    <div className="p-6 space-y-6 flex-1 overflow-hidden flex flex-col justify-center">
      {/* Item Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-start gap-4">
        <div className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-1.5 py-0.5 rounded h-fit">
            -{pkg.discount}%
        </div>
        <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <h3 className="text-[15px] font-bold text-slate-900 leading-tight">Premium Support</h3>
                    <p className="text-[11px] font-medium text-slate-400">{pkg.validity} Days support for {city}</p>
                </div>
            </div>
            <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-slate-900">₹ {pkg.price}</span>
                    <span className="text-xs text-slate-300 line-through">₹ {pkg.originalPrice}</span>
                </div>
                
                <div className="flex items-center gap-3 border border-slate-200 rounded-lg p-1 px-3">
                    <span className="text-[10px] font-bold text-slate-500">1 Service</span>
                </div>
            </div>
        </div>
      </div>

      {/* Price Details */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Order Summary</h3>
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-500">Service Fee</span>
                <span className="font-bold text-slate-900">₹ {pkg.originalPrice}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-500">Discount Applied</span>
                <span className="font-bold text-emerald-500">- ₹ {pkg.originalPrice - pkg.price}</span>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-base">Amount Payable</span>
                <span className="font-black text-slate-900 text-lg">₹ {pkg.price}</span>
            </div>
        </div>
      </div>
    </div>

    {/* Footer */}
    <div className="p-6 bg-white border-t border-slate-100 shrink-0 pb-12">
        <button 
            onClick={onNext}
            disabled={isProcessing}
            className="w-full bg-[#011B41] text-white py-5 rounded-2xl font-bold text-sm shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70"
        >
            {isProcessing ? (
                <>
                    <Loader2 size={20} className="animate-spin" />
                    Processing...
                </>
            ) : (
                `Pay ₹ ${pkg.price}`
            )}
        </button>
    </div>
  </div>
);

const PaymentOption = ({ icon, title, content, onSelect }: { icon: React.ReactNode, title: string, content?: React.ReactNode, onSelect: () => void }) => (
  <button 
    onClick={onSelect}
    className="w-full bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col items-start gap-4 hover:border-slate-200 transition-all"
  >
    <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                {icon}
            </div>
            <span className="text-sm font-black text-slate-900">{title}</span>
        </div>
        <ChevronRight size={18} className="text-slate-300" />
    </div>
    {content}
  </button>
);

const ChevronDownIcon = ({ size, className }: { size: number, className?: string }) => (
  <ChevronDown size={size} className={className} />
);
