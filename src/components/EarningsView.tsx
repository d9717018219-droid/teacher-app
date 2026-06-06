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
  X
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

  // Real-time Ranking Logic (Top 20 Across India)
  const topEarners = useMemo(() => {
    return [...allTutors]
      .filter(t => (Number(t.monthly_earnings) || 0) > 0) // Only show tutors with actual earnings
      .sort((a, b) => {
        const earningsA = Number(a.monthly_earnings) || 0;
        const earningsB = Number(b.monthly_earnings) || 0;
        // Primary sort by earnings, secondary by active tuitions
        if (earningsB !== earningsA) return earningsB - earningsA;
        return (Number(b.active_tuitions) || 0) - (Number(a.active_tuitions) || 0);
      })
      .slice(0, 20);
  }, [allTutors]);

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
  const goal = 30000;
  const progress = Math.min((totalIncome / goal) * 100, 100);
  const cityLabel = userCity && userCity.toLowerCase() !== 'all' ? `in ${userCity}` : 'in India';

  return (
    <div className="flex flex-col p-5 pb-40 space-y-10 max-w-lg mx-auto bg-slate-50 min-h-screen font-sans">
      
      {/* SECTION 0: MY EARNINGS & PERFORMANCE (MOVED TO TOP) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-100 border border-white">
                <CreditCard size={20} strokeWidth={3} />
             </div>
             <div className="flex flex-col">
                <h3 className="text-[16px] font-[1000] text-slate-900 uppercase tracking-tight leading-none">My Earnings</h3>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Wallet & Milestones</span>
             </div>
          </div>
          <div className="bg-orange-50 px-3 py-1 rounded-full border border-orange-100 flex items-center gap-1.5 shadow-sm">
             <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
             <span className="text-[9px] font-black text-orange-700 uppercase tracking-widest">Active</span>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[40px] p-8 relative overflow-hidden shadow-2xl shadow-slate-200 border border-white/5 group">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-primary/20 blur-[100px] rounded-full group-hover:scale-125 transition-transform duration-1000" />
          <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full" />
          
          <div className="relative z-10 space-y-8">
             <div className="text-center space-y-2">
               <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
                 <Flame size={14} className="text-orange-400 fill-orange-400/20" />
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Monthly Active Income</p>
               </div>
               <div className="flex flex-col items-center">
                 <div className="text-[54px] font-[1000] text-white tracking-tighter leading-none flex items-start">
                   <span className="text-2xl mt-2 mr-1 text-emerald-400">₹</span>
                   {totalIncome.toLocaleString()}
                 </div>
                 <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.1em] mt-2">Verified Growth Earnings</p>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div className="bg-white/5 backdrop-blur-xl rounded-[28px] p-5 border border-white/10 flex flex-col items-center gap-1 group/item hover:bg-white/10 transition-colors">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Classes</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50" />
                    <p className="text-2xl font-black text-white">{activeTuitions}</p>
                  </div>
               </div>
               <div className="bg-white/5 backdrop-blur-xl rounded-[28px] p-5 border border-white/10 flex flex-col items-center gap-1 group/item hover:bg-white/10 transition-colors">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Target Reach</p>
                  <p className="text-2xl font-black text-emerald-400">{Math.round(progress)}%</p>
               </div>
             </div>

             <div className="bg-white/5 backdrop-blur-md rounded-[32px] p-6 border border-white/10 space-y-4">
                <div className="flex justify-between items-end">
                   <div className="space-y-0.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Milestone</p>
                      <p className="text-lg font-black text-white tracking-tight">₹30,000 Target</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[12px] font-black text-emerald-400 tracking-tighter">₹{Math.max(0, 30000 - totalIncome).toLocaleString()} Left</p>
                   </div>
                </div>
                <div className="relative w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                   <motion.div 
                     initial={{ width: 0 }} 
                     animate={{ width: `${progress}%` }} 
                     transition={{ duration: 1.5, ease: "easeOut" }}
                     className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
                   />
                </div>
                <div className="flex justify-between items-center text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
                   <span>₹0</span>
                   <span className="text-emerald-400">Achieved: ₹{totalIncome.toLocaleString()}</span>
                   <span>₹30K</span>
                </div>
             </div>
          </div>
        </div>
      </div>
      
      {/* SECTION 1: MY PROFESSIONAL IDENTITY (Premium LinkedIn Style) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-[#0077B5] flex items-center justify-center text-white shadow-lg shadow-blue-100 border border-white">
                <User size={20} strokeWidth={2.5} />
             </div>
             <div className="flex flex-col">
                <h3 className="text-[16px] font-[1000] text-slate-900 uppercase tracking-tight leading-none">Professional Identity</h3>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Professional Network</span>
             </div>
          </div>
          <div className="flex flex-col items-end">
             <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100 flex items-center gap-1.5 shadow-sm">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-tight">Verified Expert</span>
             </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative pb-8">
           {/* Professional Banner */}
           <div className="h-28 bg-gradient-to-r from-[#1E293B] to-[#0F172A] relative">
              <div className="absolute inset-0 opacity-10">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl -mr-16 -mt-16" />
              </div>
           </div>

           {/* Profile Content */}
           <div className="px-6 relative">
              {/* Profile Picture Overlap */}
              <div className="relative -mt-14 mb-5">
                 <div className="w-28 h-28 rounded-full border-4 border-white bg-slate-100 overflow-hidden shadow-2xl flex items-center justify-center text-slate-300">
                    {(profilePhoto || tutorProfile.photo) ? (
                      <img src={profilePhoto || tutorProfile.photo || ''} className="w-full h-full object-cover" alt="Profile" />
                    ) : (
                      <User size={48} strokeWidth={1.5} />
                    )}
                 </div>
                 <div className="absolute bottom-1 right-1 bg-blue-600 text-white p-1.5 rounded-full border-2 border-white shadow-lg">
                    <BadgeCheck size={14} strokeWidth={3} fill="currentColor" />
                 </div>
              </div>

              {/* Identity Details */}
              <div className="space-y-6">
                 <div className="space-y-1">
                    <h4 className="text-[24px] font-[1000] text-slate-900 tracking-tight leading-none">
                      {toTitleCase(tutorProfile?.name || '') || 'Verified Tutor'}
                    </h4>
                    <p className="text-[15px] font-bold text-slate-700 mt-1">Professional Educator • Subject Matter Expert</p>
                    <div className="flex items-center gap-2 text-[12px] font-bold text-slate-400 mt-2">
                       <span className="flex items-center gap-1"><MapPin size={12} /> {tutorProfile?.city || 'India'}</span>
                       <span className="text-[#0077B5] font-black">•</span>
                       <span className="text-[#0077B5] font-black">Contact Info</span>
                    </div>
                 </div>

                 {/* Action Buttons */}
                 <div className="flex gap-2">
                    <button onClick={() => { playTapSound(); onEditProfile(); }} className="flex-[1.5] bg-[#0077B5] text-white h-11 rounded-full font-black text-[10px] uppercase tracking-wider active:scale-95 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
                       Open to Opportunities
                    </button>
                    <button onClick={() => { playTapSound(); onRequestApproval(); }} className="flex-1 border-2 border-[#0077B5] text-[#0077B5] h-11 rounded-full font-black text-[10px] uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center">
                       Go Live
                    </button>
                 </div>

                 {/* Experience & Education Section */}
                 <div className="space-y-5 pt-2">
                    <div className="flex items-start gap-4">
                       <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                          <GraduationCap size={22} />
                       </div>
                       <div className="space-y-1 min-w-0">
                          <p className="text-[13px] font-black text-slate-900 truncate">
                             {Array.isArray(tutorProfile?.qualification) ? tutorProfile.qualification.join(', ') : (tutorProfile?.qualification || 'Education Detail')}
                          </p>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Academic Excellence</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-4">
                       <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                          <Briefcase size={22} />
                       </div>
                       <div className="space-y-1 min-w-0">
                          <p className="text-[13px] font-black text-slate-900 truncate">
                             {tutorProfile?.experience || '0'} Years Experience
                          </p>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Professional Journey</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-4">
                       <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                          <Target size={22} />
                       </div>
                       <div className="space-y-1 min-w-0">
                          <p className="text-[13px] font-black text-slate-900 truncate">
                             ₹{formatCurrency(tutorProfile?.fee || '0')}/hr Expert Fee
                          </p>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Service Valuation</p>
                       </div>
                    </div>
                 </div>

                 {/* About Section */}
                 <div className="pt-4 border-t border-slate-50">
                    <h5 className="text-[14px] font-black text-slate-900 mb-2">About</h5>
                    <p className="text-[13px] font-medium text-slate-600 leading-relaxed line-clamp-4">
                       {tutorProfile?.about || 'Professional educator committed to student success through personalized learning and clear concept building.'}
                    </p>
                 </div>
              </div>
           </div>
        </div>

        {/* SYSTEMATIC DATA SECTIONS */}
        <div className="space-y-10 pt-4">
           {/* 1. Academic & Professional Expertise */}
           <div className="space-y-4 text-left">
              <SectionTitle label="Academic & Expertise" color="text-indigo-600" bg="bg-indigo-50" />
              <div className="grid grid-cols-2 gap-3">
                 <ColorfulCard icon={<GraduationCap size={14} />} label="Qualification" value={Array.isArray(tutorProfile?.qualification) ? tutorProfile.qualification.join(', ') : (tutorProfile?.qualification || 'N/A')} color="bg-white text-slate-700" border="border-slate-100 shadow-sm" />
                 <ColorfulCard icon={<Briefcase size={14} />} label="Experience" value={tutorProfile?.experience || 'Fresh'} color="bg-white text-slate-700" border="border-slate-100 shadow-sm" />
                 <div className="col-span-2">
                    <ColorfulCard icon={<BookOpen size={14} />} label="Class Group" value={Array.isArray(tutorProfile?.class_group) ? tutorProfile.class_group.join(', ') : (tutorProfile?.class_group || 'N/A')} color="bg-white text-slate-700" border="border-slate-100 shadow-sm" />
                 </div>
                 <div className="col-span-2">
                    <ColorfulCard icon={<Target size={14} />} label="Key Subjects" value={Array.isArray(tutorProfile?.subjects) ? tutorProfile.subjects.join(', ') : (tutorProfile?.subjects || 'N/A')} color="bg-white text-slate-700" border="border-slate-100 shadow-sm" />
                 </div>
                 <ColorfulCard icon={<School size={14} />} label="School Teacher" value={tutorProfile?.school_teacher || 'No'} color="bg-white text-slate-700" border="border-slate-100 shadow-sm" />
              </div>
           </div>

           {/* 2. Service & Logistics */}
           <div className="space-y-4 text-left">
              <SectionTitle label="Service & Schedule" color="text-rose-600" bg="bg-rose-50" />
              <div className="grid grid-cols-2 gap-3">
                 <ColorfulCard icon={<Navigation size={14} />} label="Teaching Mode" value={tutorProfile?.mode || 'Home Tuition'} color="bg-white text-slate-700" border="border-slate-100 shadow-sm" />
                 <ColorfulCard icon={<Calendar size={14} />} label="Available Days" value={tutorProfile?.days || 'All Days'} color="bg-white text-slate-700" border="border-slate-100 shadow-sm" />
                 <ColorfulCard icon={<Clock size={14} />} label="Preferred Time" value={tutorProfile?.time || 'Flexible'} color="bg-white text-slate-700" border="border-slate-100 shadow-sm" />
                 <ColorfulCard icon={<Flame size={14} />} label="Expected Fee" value={`₹${formatCurrency(tutorProfile?.fee || '0')}/hr`} color="bg-white text-slate-700" border="border-slate-100 shadow-sm" />
                 <ColorfulCard icon={<Volume2 size={14} />} label="Communication" value={tutorProfile?.communication || 'N/A'} color="bg-white text-slate-700" border="border-slate-100 shadow-sm" />
                 <ColorfulCard icon={<Smartphone size={14} />} label="Own Vehicle" value={tutorProfile?.have_vehicle || 'No'} color="bg-white text-slate-700" border="border-slate-100 shadow-sm" />
              </div>
           </div>

           {/* 3. Personal Details */}
           <div className="space-y-4 text-left">
              <SectionTitle label="Personal Details" color="text-amber-600" bg="bg-amber-50" />
              <div className="grid grid-cols-2 gap-3">
                 <ColorfulCard icon={<Calendar size={14} />} label="Birth Date" value={tutorProfile?.dob || 'N/A'} color="bg-white text-slate-700" border="border-slate-100 shadow-sm" />
                 <ColorfulCard icon={<TrendingUp size={14} />} label="Age" value={`${tutorProfile?.age || '–'} Yrs`} color="bg-white text-slate-700" border="border-slate-100 shadow-sm" />
                 <ColorfulCard icon={<User size={14} />} label="Gender" value={tutorProfile?.gender || '–'} color="bg-white text-slate-700" border="border-slate-100 shadow-sm" />
              </div>
           </div>

           {/* 4. Location & Address */}
           <div className="space-y-4 text-left">
              <SectionTitle label="Location & Address" color="text-emerald-600" bg="bg-emerald-50" />
              <div className="grid grid-cols-2 gap-3">
                 <ColorfulCard icon={<MapPin size={14} />} label="City" value={tutorProfile?.city || 'N/A'} color="bg-white text-slate-700" border="border-slate-100 shadow-sm" />
                 <ColorfulCard icon={<MapPin size={14} />} label="Localities" value={Array.isArray(tutorProfile?.location) ? tutorProfile.location.join(', ') : (tutorProfile?.location || 'N/A')} color="bg-white text-slate-700" border="border-slate-100 shadow-sm" />
                 <div className="col-span-2">
                    <ColorfulCard icon={<MapPin size={14} />} label="Full Address (Private)" value={tutorProfile?.address || 'N/A'} isPrivate />
                 </div>
              </div>
           </div>

           {/* 5. Secure Identifiers */}
           <div className="space-y-4 text-left">
              <SectionTitle label="Account & Security" color="text-slate-600" bg="bg-slate-100" />
              <div className="grid grid-cols-2 gap-3 opacity-80">
                 <ColorfulCard icon={<Smartphone size={14} />} label="Phone Number" value={tutorProfile?.phone || 'N/A'} isPrivate />
                 <ColorfulCard icon={<ShieldCheck size={14} />} label="Email Address" value={tutorProfile?.email || 'N/A'} isPrivate />
                 <div className="col-span-2">
                    <ColorfulCard icon={<ShieldCheck size={14} />} label="Aadhar Number (Verified)" value={tutorProfile?.aadhar || 'N/A'} isPrivate />
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* SECTION 3: TOP PERFORMERS HALL OF FAME (Spaced Out & Premium) */}
      <div className="space-y-8 pb-20">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-5">
             <div className="w-14 h-14 rounded-[24px] bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-xl shadow-orange-100 border-2 border-white ring-4 ring-orange-50">
                <Trophy size={28} strokeWidth={2} />
             </div>
             <div className="flex flex-col">
                <h3 className="text-[20px] font-[1000] text-slate-900 uppercase tracking-tight leading-none">Hall of Fame</h3>
                <div className="flex items-center gap-2 mt-1.5">
                   <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Global Ranking</span>
                   <div className="w-1 h-1 bg-slate-300 rounded-full" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2026-27</span>
                </div>
             </div>
          </div>
          <div className="bg-emerald-500 text-white px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg shadow-emerald-100">
             <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest">Live</span>
          </div>
        </div>

        <div className="flex flex-col gap-6 px-1">
          {topEarners.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-[48px] border border-dashed border-slate-200">
               <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-5 text-slate-300">
                  <Flame size={32} />
               </div>
               <p className="text-[11px] font-[900] text-slate-400 uppercase tracking-[0.25em]">Syncing Rankings...</p>
            </div>
          ) : (
            topEarners.map((t, i) => (
              <motion.div 
                key={t.tutor_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "p-6 rounded-[40px] bg-white border relative overflow-hidden transition-all active:scale-[0.97] group",
                  i === 0 ? "border-amber-200 shadow-2xl shadow-amber-500/15" : "border-slate-100 shadow-xl shadow-slate-200/40"
                )}
              >
                {/* Background Decorations for Top 3 */}
                {i < 3 && (
                  <div className={cn(
                    "absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-10 rounded-full",
                    i === 0 ? "bg-amber-500" : i === 1 ? "bg-blue-500" : "bg-orange-500"
                  )} />
                )}

                <div className="flex items-center justify-between relative z-10">
                   <div className="flex items-center gap-5">
                      {/* Rank Indicator */}
                      <div className="relative">
                         <div className={cn(
                           "w-14 h-14 rounded-[22px] flex items-center justify-center font-black text-xl shadow-inner transition-transform group-hover:rotate-12 duration-500",
                           i === 0 ? "bg-gradient-to-tr from-amber-400 to-yellow-500 text-white shadow-amber-200" : 
                           i === 1 ? "bg-slate-100 text-slate-500" :
                           i === 2 ? "bg-orange-50 text-orange-600" : "bg-slate-50 text-slate-400"
                         )}>
                           {i === 0 ? <Crown size={28} strokeWidth={2.5} /> : i + 1}
                         </div>
                         {i < 3 && (
                            <div className="absolute -top-2 -left-2 flex items-center justify-center">
                               <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md">
                                  <Sparkles size={10} className={i === 0 ? "text-amber-500" : "text-blue-500"} />
                               </div>
                            </div>
                         )}
                      </div>

                      <div className="flex flex-col space-y-0.5">
                         <div className="flex items-center gap-2">
                            <h4 className="text-[15px] font-[1000] text-slate-900 tracking-tight leading-none">{toTitleCase(t.name)}</h4>
                            <BadgeCheck size={14} className={i === 0 ? "text-amber-500" : "text-blue-500"} fill="currentColor" />
                         </div>
                         <div className="flex items-center gap-2.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">#{getTutorId(t)}</span>
                            <div className="w-1 h-1 bg-slate-200 rounded-full" />
                            <div className="flex items-center gap-1.5">
                               <MapPin size={10} className="text-primary/70" />
                               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t.city || 'India'}</span>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="text-right flex flex-col items-end gap-1">
                      <div className="flex items-baseline">
                         <span className="text-[10px] font-black text-emerald-500 mr-0.5">₹</span>
                         <div className="text-[19px] font-[1000] text-slate-900 tracking-tighter leading-none">{Number(t.monthly_earnings).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-50 rounded-full border border-slate-100">
                         <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                         <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{t.active_tuitions} Active</span>
                      </div>
                   </div>
                </div>

                {i === 0 && (
                   <div className="mt-5 bg-amber-50 rounded-[20px] p-4 border border-amber-100/50 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                         <Sparkles size={16} className="text-amber-500" />
                      </div>
                      <p className="text-[11px] font-[900] text-amber-900 leading-tight uppercase tracking-widest">
                         Top Performer: <span className="text-amber-600">Elite Educator</span>
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

function MiniStat({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1">
      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm", color)}>
        {icon}
      </div>
      <div className="flex flex-col -space-y-0.5">
        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        <span className="text-[12px] font-[1000] text-slate-800 tracking-tighter">{value}</span>
      </div>
    </div>
  );
}

function SectionTitle({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("px-3 py-1 rounded-full border border-current/10 text-[9px] font-[1000] uppercase tracking-[0.15em]", color, bg)}>
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
