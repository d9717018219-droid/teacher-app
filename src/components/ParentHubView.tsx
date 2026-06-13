import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck, Star, Users, Calendar, ArrowRight, MessageCircle, Search, CheckCircle2, Trophy, CreditCard, Zap } from 'lucide-react';
import { cn } from '../utils';

interface ParentHubViewProps {
  userName: string | null;
  playTapSound: () => void;
  setActiveTab: (tab: any) => void;
  onPostRequirement: () => void;
  onHideNeed: () => void;
  onShowElite: () => void;
}

export const ParentHubView: React.FC<ParentHubViewProps> = ({ 
  userName, 
  playTapSound, 
  setActiveTab,
  onPostRequirement,
  onHideNeed,
  onShowElite
}) => {
  return (
    <div className="h-screen max-h-screen flex flex-col p-5 pb-32 space-y-4 max-w-lg mx-auto font-sans bg-[#FAFBFF] overflow-hidden fixed inset-0">
      
      {/* ─── HEADER ─── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center shrink-0">
        <div className="space-y-0.5">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Parent Portal</h2>
          {userName && <span className="text-[10px] font-semibold text-slate-400">Welcome, {userName}</span>}
        </div>
        <div className="bg-[#572149]/5 px-2.5 py-1 rounded-full border border-[#572149]/10">
           <span className="text-[9px] font-bold text-[#572149]">Verified</span>
        </div>
      </motion.div>

      {/* ─── ACTION BOXES ─── */}
      <div className="flex-1 flex flex-col gap-4 min-h-0 py-2">
        
        {/* BOX 1: SELF POST */}
        <motion.button 
          whileTap={{ scale: 0.97 }}
          onClick={() => { playTapSound(); onPostRequirement(); }}
          className="flex-1 bg-gradient-to-br from-[#572149] to-[#3a1532] rounded-[32px] p-6 text-left relative overflow-hidden shadow-xl group border-2 border-white/10"
        >
          <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/5 blur-3xl rounded-full" />
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Calendar className="text-white" size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-white leading-tight">Post a<br/>Requirement</h3>
              <p className="text-white/40 text-[11px] font-medium tracking-wide">Post manually & wait for replies</p>
            </div>
          </div>
          <ArrowRight className="absolute bottom-6 right-6 text-white/20 group-hover:text-white/60 transition-all" size={28} />
        </motion.button>

        {/* BOX 2: COORDINATOR ASSIST */}
        <motion.button 
          whileTap={{ scale: 0.97 }}
          onClick={() => { playTapSound(); onShowElite(); }}
          className="flex-1 bg-white rounded-[32px] p-6 text-left relative overflow-hidden border border-slate-100 shadow-2xl group"
        >
          <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-[#572149]/5 blur-3xl rounded-full" />
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="w-12 h-12 bg-[#572149]/5 rounded-2xl flex items-center justify-center">
              <Users className="text-[#572149]" size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-slate-900 leading-tight">Expert<br/>Coordinator Support</h3>
              <p className="text-slate-400 text-[11px] font-medium tracking-wide">Guaranteed tutor matching</p>
            </div>
          </div>
          <Zap className="absolute bottom-6 right-6 text-[#572149]/10 group-hover:text-[#572149]/30 transition-all" size={28} />
        </motion.button>

      </div>

      {/* ─── TRUST BADGE ─── */}
      <div className="bg-slate-50/80 rounded-2xl p-4 flex items-center gap-3 border border-slate-100 shrink-0">
         <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
         <p className="text-[10px] font-medium text-slate-500 leading-tight">Verified profiles and secure payments guaranteed.</p>
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
