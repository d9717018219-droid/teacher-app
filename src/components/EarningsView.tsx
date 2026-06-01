import React, { useMemo } from 'react';
import { 
  Trophy, 
  Briefcase,
  MapPin,
  BadgeCheck,
  Crown,
  Flame,
  User,
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
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { TutorProfile } from '../types';
import { cn, formatCurrency, toTitleCase, getTutorId } from '../utils';

interface EarningsViewProps {
  tutorProfile?: TutorProfile | null;
  allTutors?: TutorProfile[];
  userCity?: string | null;
  playTapSound: () => void;
  onEditProfile: () => void;
  onRequestApproval: () => void;
}

export const EarningsView: React.FC<EarningsViewProps> = ({ tutorProfile, allTutors = [], userCity, playTapSound, onEditProfile, onRequestApproval }) => {
  
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

  // Real-time Ranking Logic
  const topEarners = useMemo(() => {
    return [...allTutors]
      .sort((a, b) => {
        const scoreA = (Number(a.monthly_earnings) || 0) + (Number(a.active_tuitions) || 0) * 1000;
        const scoreB = (Number(b.monthly_earnings) || 0) + (Number(b.active_tuitions) || 0) * 1000;
        return scoreB - scoreA;
      })
      .slice(0, 3);
  }, [allTutors]);

  // Calculate filled fields count for 24-point profile
  const filledFieldsCount = useMemo(() => {
    const fields = [
      'name', 'email', 'phone', 'gender', 'dob', 'age', 'qualification', 'experience', 
      'school_teacher', 'days', 'time', 'class_group', 'subjects', 'city', 'location', 
      'have_vehicle', 'communication', 'fee', 'aadhar', 'address', 'residency', 'about', 'photo', 'status',
      'active_tuitions', 'monthly_earnings'
    ];
    return fields.filter(f => {
      const val = (tutorProfile as any)[f];
      if (Array.isArray(val)) return val.length > 0;
      return val && val.toString().trim() !== '';
    }).length;
  }, [tutorProfile]);

  const activeTuitions = Number(tutorProfile.active_tuitions) || 0;
  const totalIncome = Number(tutorProfile.monthly_earnings) || 0;
  const goal = 50000;
  const progress = Math.min((totalIncome / goal) * 100, 100);
  const cityLabel = userCity && userCity.toLowerCase() !== 'all' ? `in ${userCity}` : 'in India';

  return (
    <div className="flex flex-col p-5 pb-40 space-y-7 max-w-lg mx-auto bg-slate-50 min-h-screen font-sans">
      
      {/* ─── HERO DASHBOARD ─── */}
      <div className="bg-[#0F172A] rounded-[40px] p-8 relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-[-10%] right-[-10%] w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full" />
        <div className="relative z-10 space-y-6 text-center">
           <div className="space-y-1">
             <div className="flex items-center justify-center gap-2 text-orange-400">
               <Flame size={14} className="fill-orange-500" />
               <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Verified Earnings • {cityLabel.toUpperCase()}</p>
             </div>
             <div className="text-5xl font-black text-white tracking-tighter">₹{totalIncome.toLocaleString()}</div>
             <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Admin Confirmed Monthly Active</p>
           </div>

           <div className="grid grid-cols-2 gap-3">
             <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/5">
                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Active Jobs</p>
                <p className="text-xl font-black text-white">{activeTuitions}</p>
             </div>
             <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/5">
                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Goal Progress</p>
                <p className="text-xl font-black text-emerald-400">{Math.round(progress)}%</p>
             </div>
           </div>
        </div>
      </div>

      {/* ─── PUBLIC IDENTITY PREVIEW ─── */}
      <div className="space-y-4">
        <div className="flex flex-col gap-1 px-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye size={18} className="text-indigo-600" />
              <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest">Public Identity</h3>
            </div>
            <div className="flex items-center gap-1.5 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
               <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
               <span className="text-[9px] font-black text-indigo-700 uppercase tracking-tight">{filledFieldsCount}/24 Fields Verified</span>
            </div>
          </div>
          <div className="w-full h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
             <motion.div initial={{ width: 0 }} animate={{ width: `${(filledFieldsCount/24)*100}%` }} className="h-full bg-indigo-500" />
          </div>
        </div>

        <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden">
           {/* Verified Identity Header */}
           <div className="p-6 bg-gradient-to-br from-[#191445] to-indigo-900 text-white flex items-center gap-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-2xl rounded-full -mr-16 -mt-16" />
              <div className="relative">
                 <div className="w-20 h-20 rounded-[32px] bg-white/20 flex items-center justify-center border-4 border-white/30 overflow-hidden shadow-2xl">
                    {tutorProfile.selfie ? (
                      <img src={tutorProfile.selfie} className="w-full h-full object-cover" />
                    ) : tutorProfile.photo ? (
                      <img src={tutorProfile.photo} className="w-full h-full object-cover" />
                    ) : (
                      <User size={40} />
                    )}
                 </div>
                 <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full border-2 border-[#191445] shadow-lg">
                    <ShieldCheck size={12} strokeWidth={3} />
                 </div>
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                 <h4 className="text-2xl font-black tracking-tight truncate">{toTitleCase(tutorProfile.name) || 'Set Name'}</h4>
                 <div className="flex items-center gap-1.5 text-emerald-400">
                    <BadgeCheck size={12} strokeWidth={3} />
                    <span className="text-[10px] font-black uppercase tracking-[0.15em]">Verified Identity</span>
                 </div>
                 <div className="flex items-center gap-1.5 opacity-60 text-[10px] font-bold">
                    <MapPin size={10} />
                    <span className="uppercase tracking-widest">{tutorProfile.city || 'Select City'}</span>
                 </div>
              </div>
           </div>

           <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                 <PreviewItem icon={<GraduationCap size={13} />} label="Qualification" value={Array.isArray(tutorProfile.qualification) ? tutorProfile.qualification.join(', ') : tutorProfile.qualification || 'N/A'} />
                 <PreviewItem icon={<Briefcase size={13} />} label="Experience" value={tutorProfile.experience || 'N/A'} />
                 <PreviewItem icon={<BookOpen size={13} />} label="Class Group" value={Array.isArray(tutorProfile.class_group) ? tutorProfile.class_group.join(', ') : tutorProfile.class_group || 'N/A'} />
                 <PreviewItem icon={<Target size={13} />} label="Subjects" value={Array.isArray(tutorProfile.subjects) ? tutorProfile.subjects.join(', ') : tutorProfile.subjects || 'N/A'} />
                 
                 <PreviewItem icon={<Smartphone size={13} />} label="Phone" value={`${tutorProfile.phone || 'N/A'} (Private)`} isPrivate />
                 <PreviewItem icon={<ShieldCheck size={13} />} label="Email" value={`${tutorProfile.email || 'N/A'} (Private)`} isPrivate />
                 
                 <PreviewItem icon={<Calendar size={13} />} label="Birth Date" value={tutorProfile.dob || 'N/A'} />
                 <PreviewItem icon={<TrendingUp size={13} />} label="Age" value={tutorProfile.age || 'N/A'} />
                 <PreviewItem icon={<User size={13} />} label="Gender" value={tutorProfile.gender || 'N/A'} />
                 <PreviewItem icon={<MapPin size={13} />} label="Locality" value={Array.isArray(tutorProfile.location) ? tutorProfile.location.join(', ') : tutorProfile.location || 'N/A'} />
                 
                 <PreviewItem icon={<Clock size={13} />} label="Pref. Time" value={tutorProfile.time || 'Flexible'} />
                 <PreviewItem icon={<Calendar size={13} />} label="Available Days" value={tutorProfile.days || 'All Days'} />
                 <PreviewItem icon={<Navigation size={13} />} label="Teaching Mode" value={tutorProfile.communication || 'Home Tuition'} />
                 <PreviewItem icon={<Flame size={13} />} label="Fee Expectation" value={`₹${formatCurrency(tutorProfile.fee)}`} />

                 <PreviewItem icon={<ShieldCheck size={13} />} label="Aadhar Card" value={`${tutorProfile.aadhar || 'N/A'} (Private)`} isPrivate />
                 <PreviewItem icon={<MapPin size={13} />} label="Full Address" value={`${tutorProfile.address || 'N/A'} (Private)`} isPrivate />
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Public Bio / Pitch</p>
                 <p className="text-[10px] font-bold text-slate-600 italic leading-relaxed line-clamp-3">
                   "{tutorProfile.about || 'Complete your bio to get noticed by parents.'}"
                 </p>
              </div>

              <div className="flex gap-3 pt-2">
                 <button onClick={() => { playTapSound(); onEditProfile(); }} className="flex-1 bg-slate-100 text-slate-900 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 border border-slate-200 shadow-sm"><Edit3 size={14} /> Refine Info</button>
                 <button onClick={() => { playTapSound(); onRequestApproval(); }} className="flex-[1.2] bg-[#191445] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-2"><CheckCircle2 size={14} /> Go Live Now</button>
              </div>
           </div>
        </div>
      </div>

      {/* ─── HALL OF FAME: COMPETITIVE LEADERBOARD ─── */}
      <div className="space-y-4 pt-4 pb-10">
        <div className="flex items-center justify-between px-1 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shrink-0 shadow-lg shadow-amber-200">
              <Trophy size={20} className="text-white" />
            </div>
            <div className="flex flex-col">
               <motion.h3 
                 animate={{ opacity: [0.7, 1, 0.7] }}
                 transition={{ duration: 3, repeat: Infinity }}
                 className="text-[15px] font-[1000] bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 bg-clip-text text-transparent uppercase tracking-tight leading-none"
               >
                 Top 20 Earners of Month
               </motion.h3>
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{cityLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 shrink-0 shadow-sm">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[8px] font-black text-emerald-700 uppercase tracking-widest">Live</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {topEarners.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-[32px] border border-dashed border-slate-200">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculating Standings...</p>
            </div>
          ) : (
            topEarners.map((t, i) => (
              <motion.div 
                key={t.tutor_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "p-5 rounded-[36px] flex flex-col gap-3 overflow-hidden group transition-all active:scale-[0.98]",
                  i === 0 ? "bg-gradient-to-br from-[#FFF9E6] to-[#FFF1CC] border border-amber-200 shadow-xl shadow-amber-500/10" : "bg-white border border-slate-100 shadow-sm"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0",
                    i === 0 ? "bg-gradient-to-br from-amber-400 to-yellow-600 border-2 border-white/50" : "bg-slate-100 text-slate-400"
                  )}>
                    {i === 0 ? <Crown size={20} /> : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className={cn("text-[15px] font-black truncate", i === 0 ? "text-amber-950" : "text-slate-900")}>{toTitleCase(t.name)}</h4>
                      {i === 0 && <BadgeCheck size={14} className="text-blue-500" />}
                    </div>
                    <div className="flex items-center gap-2 text-[8.5px] font-black uppercase tracking-widest opacity-60">
                      <span>ID: #{getTutorId(t)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn("text-[17px] font-black tracking-tighter", i === 0 ? "text-amber-600" : "text-slate-900")}>₹{Number(t.monthly_earnings).toLocaleString()}</div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.active_tuitions} Tuitions</p>
                  </div>
                </div>
                {i === 0 && (
                   <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-3 border border-amber-200/50">
                      <p className="text-[9.5px] font-bold text-amber-900 leading-tight">
                        ⭐ <span className="font-black">Success Tip:</span> High profile completion and fast response leads to top ranking!
                      </p>
                   </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

function PreviewItem({ icon, label, value, isPrivate }: { icon: React.ReactNode; label: string; value: string; isPrivate?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0 overflow-hidden">
      <div className="flex items-center gap-1 text-slate-400">
        {icon}
        <span className="text-[7.5px] font-black uppercase tracking-widest truncate">{label}</span>
      </div>
      <p className={cn(
        "text-[9.5px] font-[900] leading-tight break-words",
        isPrivate ? "text-slate-400 font-bold" : "text-slate-800"
      )}>
        {value}
      </p>
    </div>
  );
}
