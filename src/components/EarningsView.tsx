import React, { useMemo } from 'react';
import { 
  Trophy, 
  Briefcase,
  MapPin,
  BadgeCheck,
  Crown,
  Flame,
  User,
  Camera,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Edit3,
  CheckCircle2,
  Eye,
  Smartphone,
  TrendingUp,
  Target,
  Clock,
  Navigation,
  Calendar,
  Plus,
  Sparkles,
  Volume2,
  Venus,
  Mars,
  School,
  Building,
  Laptop,
  CreditCard,
  Settings,
  LogOut,
  AlertCircle,
  Loader2,
  Check,
  X,
  Hash
} from 'lucide-react';
import { motion } from 'framer-motion';
import { TutorProfile } from '../types';
import { cn, formatCurrency, toTitleCase, getTutorId } from '../utils';

interface EarningsViewProps {
  tutorProfile?: TutorProfile | null;
  allTutors?: TutorProfile[];
  userCity?: string | null;
  profilePhoto?: string | null;
  playTapSound: () => void;
  onEditProfile: () => void;
  onRequestApproval: () => void;
}

export const EarningsView: React.FC<EarningsViewProps> = ({ tutorProfile, allTutors = [], userCity, profilePhoto, playTapSound, onEditProfile, onRequestApproval }) => {
  
  // DEBUG LOG
  React.useEffect(() => {
    if (tutorProfile) {
      console.log('📊 [Earnings-Debug] Current Tutor Profile Data:', tutorProfile);
    } else {
      console.log('📊 [Earnings-Debug] No Tutor Profile Found.');
    }
  }, [tutorProfile]);

  // FAIL-SAFE: Loading state
  if (!tutorProfile) {
    return (
      <div className="flex flex-col items-center justify-center p-10 space-y-4 min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
           <User size={40} />
        </div>
        <p className="text-slate-400 font-bold text-sm">Loading your growth dashboard...</p>
      </div>
    );
  }

  // Real-time Ranking Logic (Top 20 in Current City)
  const topEarners = useMemo(() => {
    const currentCity = userCity || 'Delhi';
    return [...allTutors]
      .filter(t => (Number(t.monthly_earnings) || 0) > 0 && t.city === currentCity) 
      .sort((a, b) => {
        const earningsA = Number(a.monthly_earnings) || 0;
        const earningsB = Number(b.monthly_earnings) || 0;
        if (earningsB !== earningsA) return earningsB - earningsA;
        return (Number(b.active_tuitions) || 0) - (Number(a.active_tuitions) || 0);
      })
      .slice(0, 20);
  }, [allTutors, userCity]);

  // Dynamic Date Helper
  const currentMonthYear = useMemo(() => {
    const d = new Date();
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  }, []);

  // Calculate filled fields count dynamically
  const profileFields = [
    'name', 'email', 'phone', 'gender', 'dob', 'age', 'qualification', 'experience', 
    'school_teacher', 'days', 'time', 'class_group', 'subjects', 'city', 'location', 
    'have_vehicle', 'communication', 'mode', 'fee', 'aadhar', 'address', 'about', 'photo'
  ];

  const { filledFieldsCount, totalFields } = useMemo(() => {
    if (!tutorProfile) return { filledFieldsCount: 0, totalFields: profileFields.length };
    const filled = profileFields.filter(f => {
      const val = (tutorProfile as any)[f];
      if (Array.isArray(val)) return val.length > 0;
      return val !== undefined && val !== null && val.toString().trim() !== '';
    }).length;
    return { filledFieldsCount: filled, totalFields: profileFields.length };
  }, [tutorProfile]);

  const activeTuitions = Number(tutorProfile.active_tuitions) || 0;
  const totalIncome = Number(tutorProfile.monthly_earnings) || 0;
  const goal = 50000;
  const progress = Math.min((totalIncome / goal) * 100, 100);
  const cityLabel = userCity && userCity.toLowerCase() !== 'all' ? `in ${userCity}` : 'in India';

  return (
    <div className="flex flex-col p-5 pb-40 space-y-10 max-w-lg mx-auto bg-slate-50 min-h-screen font-sans">
      
      {/* SECTION 0: MY EARNINGS & PERFORMANCE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-100 border border-white">
                <CreditCard size={20} strokeWidth={3} />
             </div>
             <div className="flex flex-col">
                <h3 className="text-[14px] font-[1000] text-slate-900 tracking-tight leading-none">My Earnings</h3>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Wallet & Milestones</span>
             </div>
          </div>
          <div className="bg-orange-50 px-3 py-1 rounded-full border border-orange-100 flex items-center gap-1.5 shadow-sm">
             <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
             <span className="text-[9px] font-black text-orange-700 uppercase tracking-widest">Active</span>
          </div>
        </div>

        <div className="bg-[#0A0F1E] rounded-[32px] p-5 relative overflow-hidden shadow-2xl shadow-slate-900/40 border border-white/10 group">
          {/* Detailed Background Elements */}
          <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '12px 12px' }} />
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-sky-500/20 blur-[100px] rounded-full group-hover:scale-125 transition-transform duration-1000" />
          <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-purple-500/10 blur-[80px] rounded-full" />
          
          <div className="relative z-10 space-y-5">
             <div className="flex justify-between items-start">
                <div className="space-y-1">
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/50">Secure Wallet • ID #{getTutorId(tutorProfile)}</p>
                   </div>
                   <div className="flex items-baseline">
                     <span className="text-xl mr-1 text-emerald-400 font-black opacity-80">₹</span>
                     <div className="text-[42px] font-[1000] text-white tracking-tighter leading-none">
                       {totalIncome.toLocaleString()}
                     </div>
                     <span className="text-slate-400 text-sm font-bold ml-2">/month</span>
                   </div>
                   <p className="text-[9px] font-bold text-sky-400/80 uppercase tracking-widest ml-1">Current Active Balance</p>
                </div>
                <div className="w-11 h-7 rounded-md bg-gradient-to-br from-amber-400/20 to-amber-500/10 border border-amber-500/20 flex items-center justify-center relative overflow-hidden shadow-inner">
                   <div className="absolute inset-0 bg-white/5" />
                   <div className="w-6 h-4 border border-amber-500/30 rounded-sm opacity-50" />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-2.5">
               <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 flex flex-col gap-0.5 hover:bg-white/10 transition-all active:scale-95">
                  <p className="text-[7.5px] font-black text-white/30 uppercase tracking-widest">Active Classes</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Briefcase size={12} className="text-emerald-400" />
                    <p className="text-lg font-black text-white">{activeTuitions}</p>
                  </div>
               </div>
               <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 flex flex-col gap-0.5 hover:bg-white/10 transition-all active:scale-95">
                  <p className="text-[7.5px] font-black text-white/30 uppercase tracking-widest">Target Reach</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <TrendingUp size={12} className="text-sky-400" />
                    <p className="text-lg font-black text-white">{Math.round(progress)}%</p>
                  </div>
               </div>
             </div>

             <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/5 space-y-2.5">
                <div className="flex justify-between items-center px-0.5">
                   <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Goal Progress</p>
                   <p className="text-[9px] font-black text-emerald-400 tracking-tighter">₹{Math.max(0, 50000 - totalIncome).toLocaleString()} more to hit ₹50K</p>
                </div>
                <div className="relative w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                   <motion.div 
                     initial={{ width: 0 }} 
                     animate={{ width: `${progress}%` }} 
                     transition={{ duration: 1.5, ease: "easeOut" }}
                     className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                   />
                </div>
                <div className="flex justify-between items-center text-[7px] font-black text-slate-500 uppercase tracking-widest px-0.5">
                   <span>₹0</span>
                   <span className="text-emerald-400">Current: ₹{totalIncome.toLocaleString()}</span>
                   <span>₹50K</span>
                </div>
             </div>
          </div>
        </div>
      </div>
      
      {/* SECTION 3: TOP CITY EARNERS (TABULAR VIEW) */}
      <div className="space-y-6 pb-20">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-lg border border-white">
                <Trophy size={20} strokeWidth={2} />
             </div>
             <div className="flex flex-col min-w-0 flex-1">
                <h3 className="text-[12px] font-[1000] text-slate-900 tracking-tight leading-tight truncate">Top 20 Earners in {userCity || 'Your City'}</h3>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Live Performance Rankings</span>
             </div>
          </div>
          <div className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5 shadow-sm">
             <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Live</span>
          </div>
        </div>

        <div className="bg-white rounded-[28px] shadow-xl border border-slate-100 overflow-hidden">
           <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[320px]">
                 <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-50">
                       <th className="px-2 py-3 text-[7.5px] font-black text-slate-400 uppercase tracking-widest text-center">#</th>
                       <th className="px-2 py-3 text-[7.5px] font-black text-slate-400 uppercase tracking-widest">Tutor</th>
                       <th className="px-2 py-3 text-[7.5px] font-black text-slate-400 uppercase tracking-widest text-right">Classes</th>
                       <th className="px-2 py-3 text-[7.5px] font-black text-slate-400 uppercase tracking-widest text-right">Earnings</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {topEarners.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No verified earners in this city yet.</td>
                      </tr>
                    ) : (
                      topEarners.map((t, i) => (
                        <tr key={t.tutor_id} className={cn("active:bg-slate-50 transition-colors", i === 0 && "bg-amber-50/30")}>
                           <td className="px-2 py-4">
                              <div className={cn(
                                "w-5 h-5 rounded-md mx-auto flex items-center justify-center text-[9px] font-black",
                                i === 0 ? "bg-amber-400 text-white shadow-lg shadow-amber-200" :
                                i === 1 ? "bg-slate-200 text-slate-600" :
                                i === 2 ? "bg-orange-100 text-orange-700" : "text-slate-400 border border-slate-100"
                              )}>
                                {i + 1}
                              </div>
                           </td>
                           <td className="px-2 py-4">
                              <div className="flex flex-col gap-0.5 min-w-0">
                                 <div className="flex items-center gap-1">
                                    <span className="text-[11px] font-[1000] text-slate-900 truncate max-w-[85px] leading-tight">{toTitleCase(t.name)}</span>
                                    {i < 3 && <BadgeCheck size={10} className="text-blue-500 shrink-0" />}
                                 </div>
                                 <span className="text-[8px] font-bold text-slate-400 tracking-tighter">ID #{getTutorId(t)}</span>
                              </div>
                           </td>
                           <td className="px-2 py-4 text-right">
                              <span className="text-[10px] font-black text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded-lg border border-slate-100">{t.active_tuitions}</span>
                           </td>
                           <td className="px-2 py-4 text-right">
                              <div className="flex flex-col items-end leading-none">
                                 <div className="text-[12px] font-[1000] text-emerald-600 tracking-tighter">₹{Number(t.monthly_earnings).toLocaleString()}</div>
                                 <span className="text-[6.5px] font-black text-slate-300 uppercase mt-0.5">/mo</span>
                              </div>
                           </td>
                        </tr>
                      ))
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
};

function ProfileRow({ label, value, icon, isPrivate }: { label: string; value: string; icon: React.ReactNode; isPrivate?: boolean }) {
  return (
    <div className="p-4 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
       <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
          {icon}
       </div>
       <div className="flex flex-col gap-1 min-w-0 flex-1">
          <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</span>
          <span className={cn(
            "text-[13px] font-black text-slate-800 tracking-tight break-words whitespace-normal leading-tight",
            isPrivate && "text-slate-400 font-bold"
          )}>
            {value}
          </span>
       </div>
    </div>
  );
}

function SectionTitle({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("px-2.5 py-1 rounded-full border border-current/10 text-[8.5px] font-[1000] tracking-widest", color, bg)}>
        {label}
      </div>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

function ColorfulCard({ icon, label, value, color, border, isPrivate }: { icon: React.ReactNode; label: string; value: string; color?: string; border?: string; isPrivate?: boolean }) {
  return (
    <div className={cn(
      "p-3.5 rounded-[20px] border flex flex-col gap-1.5 transition-all active:scale-95 h-full",
      isPrivate ? "bg-slate-50 border-slate-100 opacity-80" : (color || "bg-white"),
      border || "border-transparent"
    )}>
      <div className="flex items-center gap-2 opacity-60">
        {icon}
        <span className="text-[7.5px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className={cn(
        "text-[10px] font-black leading-tight break-words whitespace-normal",
        isPrivate ? "text-slate-500 italic" : "text-slate-900"
      )}>
        {value}
      </p>
    </div>
  );
}
