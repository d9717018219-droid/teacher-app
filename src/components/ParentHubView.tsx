import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck, Star, Users, Calendar, ArrowRight, MessageCircle, Search, CheckCircle2, Trophy, CreditCard } from 'lucide-react';
import { cn } from '../utils';

interface ParentHubViewProps {
  userName: string | null;
  playTapSound: () => void;
  setActiveTab: (tab: any) => void;
  setShowFormModal: (show: boolean) => void;
  setFormType: (type: 'teacher' | 'parent') => void;
}

export const ParentHubView: React.FC<ParentHubViewProps> = ({ 
  userName, 
  playTapSound, 
  setActiveTab,
  setShowFormModal,
  setFormType
}) => {
  return (
    <div className="flex flex-col p-5 pb-40 space-y-7 max-w-lg mx-auto font-sans bg-[#FAFBFF]">
      
      {/* ─── ELITE CONCIERGE HEADER ─── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 bg-[#572149] rounded-full" />
            <h2 className="text-2xl font-[1000] text-slate-900 tracking-tighter">Concierge</h2>
          </div>
          {userName && (
            <div className="flex items-center gap-1.5 px-1 whitespace-nowrap">
              <Star size={9} className="text-amber-500 fill-amber-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Exclusive Access: {userName}</span>
            </div>
          )}
        </div>
        <div className="bg-[#572149]/5 px-2 py-1 rounded-full border border-[#572149]/10 shrink-0 whitespace-nowrap">
           <span className="text-[8.5px] font-black text-[#572149] uppercase tracking-tight">Premium Member</span>
        </div>
      </motion.div>

      {/* ─── HERO ACTION CARD ─── */}
      <motion.div layout className="bg-slate-900 rounded-[36px] p-8 relative overflow-hidden shadow-[0_30px_60px_-12px_rgba(87,33,73,0.3)] group">
        <div className="absolute top-[-20%] right-[-10%] w-[200px] h-[200px] bg-[#572149]/30 blur-[60px] rounded-full group-hover:scale-125 transition-transform duration-1000" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[150px] h-[150px] bg-blue-500/20 blur-[50px] rounded-full group-hover:scale-125 transition-transform duration-1000" />
        
        <div className="relative z-10 space-y-7">
           <div className="space-y-2">
             <div className="flex items-center gap-2">
                <Trophy size={16} className="text-amber-400" />
                <p className="text-[10px] font-black text-white/40 tracking-[0.3em] uppercase">Elite Tutor Matching</p>
             </div>
             <h3 className="text-3xl font-[1000] text-white tracking-tighter leading-tight">Your Child Deserves<br/>the Absolute Best.</h3>
           </div>

           <div className="flex flex-col gap-3">
              <button 
                onClick={() => { playTapSound(); setFormType('parent'); setShowFormModal(true); }}
                className="w-full bg-[#572149] hover:bg-[#572149]/90 text-white py-5 rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-xl shadow-black/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                <Calendar size={20} strokeWidth={3} /> Post a Requirement
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => { playTapSound(); setActiveTab('tutors'); }}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                >
                  <Search className="text-white/60" size={18} />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Find Tutors</span>
                </button>
                <button 
                  onClick={() => { playTapSound(); setActiveTab('support'); }}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                >
                  <MessageCircle className="text-white/60" size={18} />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Talk to Expert</span>
                </button>
              </div>
           </div>
        </div>
      </motion.div>

      {/* ─── CONCIERGE SERVICES ─── */}
      <div className="space-y-4">
        <div className="px-1 flex items-center gap-2">
           <Sparkles size={14} className="text-[#572149]" />
           <h3 className="text-[12px] font-extrabold text-slate-900 tracking-tight">Personalized Concierge Benefits</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
           {[
             { title: 'Identity Verified Tutors', desc: 'We verify Aadhaar, Qualifications, and Address for your peace of mind.', icon: <CheckCircle2 size={18} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
             { title: 'Collaborative Success Group', desc: 'A dedicated group with Tutor & RMN for daily attendance, curriculum tracking, and PTM feedback.', icon: <Users size={18} />, color: 'text-blue-500', bg: 'bg-blue-50' },
             { title: 'Flexible Payment Methods', desc: 'Pay via UPI, Cards, Netbanking, or Cash. Payments are due 1 week after trial confirmation.', icon: <CreditCard size={18} />, color: 'text-[#572149]', bg: 'bg-[#572149]/5' },
             { title: 'Priority Scheduling', desc: 'Get your demo session scheduled within 24 hours of posting.', icon: <Clock size={18} />, color: 'text-amber-500', bg: 'bg-amber-50' }
           ].map((item, i) => (
             <div key={i} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex items-start gap-4 hover:border-[#572149]/20 transition-colors">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", item.bg, item.color)}>
                  {item.icon}
                </div>
                <div className="space-y-1">
                  <h4 className="text-[13px] font-black text-slate-900 leading-none">{item.title}</h4>
                  <p className="text-[10px] font-medium text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* ─── TRUST BADGE ─── */}
      <div className="bg-emerald-50 rounded-[32px] p-6 border border-emerald-100 flex items-center gap-4">
         <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-200">
            <ShieldCheck size={24} />
         </div>
         <div className="space-y-0.5">
            <h4 className="text-[13px] font-black text-emerald-900 uppercase tracking-tight">Zero Platform Fees</h4>
            <p className="text-[10px] font-medium text-emerald-700/70 leading-snug">Our concierge service is 100% free for parents. You only pay the tutor after successful trials.</p>
         </div>
      </div>
    </div>
  );
};

const Clock = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  ><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
