import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  ChevronDown,
  Briefcase,
  GraduationCap,
  BookOpen,
  Calendar,
  MessageCircle,
  CreditCard,
  Users,
  User,
  School,
  Star,
  ChevronRight,
  Heart,
  Zap,
  Globe,
  Home as HomeIcon,
  ArrowRight,
  Sparkles,
  Clock,
  ShieldCheck,
  TrendingUp,
  Venus,
  Mars,
  LayoutGrid,
  Building,
  CheckCircle2,
  Navigation,
  Laptop,
  Monitor,
  Trophy
} from 'lucide-react';
import { JobLead, TutorProfile, UserType } from '../types';
import { cn, formatCurrency, getJobId, getTutorId, toTitleCase } from '../utils';
import { JobCard } from './JobCard';
import { TutorCard } from './TutorCard';

interface HomeViewProps {
  userName: string | null;
  userType: UserType | null;
  userCity: string;
  activeLeadsCount: number;
  activeTutorsCount: number;
  featuredJobs: JobLead[];
  featuredTutors: TutorProfile[];
  playTapSound: () => void;
  setFormType: (type: 'parent' | 'teacher') => void;
  setShowFormModal: (show: boolean) => void;
  onSignUpClick: () => void;
  setActiveTab: (tab: 'home' | 'jobs' | 'tutors' | 'alerts' | 'admin' | 'support' | 'shortlist' | 'payments') => void;
  getDynamicGreeting: () => string;
  setShowFilterDrawer: (show: boolean) => void;
  onJobClick: (job: JobLead) => void;
  onTutorClick: (tutor: TutorProfile) => void;
  shortlistedIds: string[];
  onShortlistToggle: (id: string, e: React.MouseEvent) => void;
  profileCompletion: number;
  setShowProfileSetup: (show: boolean) => void;
  localities: string[];
  allTutors: TutorProfile[];
  allJobs?: JobLead[];
  onClassClick?: (className: string) => void;
  onLocalityClick?: (locality: string) => void;
  onGenderClick?: (gender: 'Male' | 'Female') => void;
  onModeClick?: (mode: string) => void;
  onCityClick?: (city: string) => void;
}

const CLASS_GROUP_MAPPING: Record<string, string[]> = {
  'Class I to V': ['Class I to V', 'Primary', 'Nursery', 'KG', '1st', '2nd', '3rd', '4th', '5th'],
  'Class VI to VIII': ['Class VI to VIII', 'Middle', '6th', '7th', '8th'],
  'Class IX to X': ['Class IX to X', 'Secondary', '9th', '10th'],
  'Class XI to XII': ['Class XI to XII', 'Sr. Secondary', '11th', '12th'],
  'Competitive': ['NEET', 'JEE', 'Entrance', 'Competitive', 'UPSC', 'SSC'],
  'Language': ['Languages', 'IELTS', 'French', 'German', 'Spanish', 'Spoken English']
};

export const HomeView = React.memo(({
  userName,
  userType,
  userCity,
  activeLeadsCount,
  activeTutorsCount,
  featuredJobs,
  featuredTutors,
  playTapSound,
  setFormType,
  setShowFormModal,
  onSignUpClick,
  setActiveTab,
  getDynamicGreeting,
  setShowFilterDrawer,
  onJobClick,
  onTutorClick,
  shortlistedIds,
  onShortlistToggle,
  profileCompletion,
  setShowProfileSetup,
  localities,
  allTutors,
  allJobs = [],
  onClassClick,
  onLocalityClick,
  onGenderClick,
  onModeClick,
  onCityClick
}: HomeViewProps) => {
  const [currentBanner, setCurrentBanner] = React.useState(0);

  // Pre-calculate counts to avoid expensive filtering inside loops
  const counts = React.useMemo(() => {
    const jobCounts: Record<string, number> = {};
    const tutorCounts: Record<string, number> = {};
    
    // Class Counts
    Object.keys(CLASS_GROUP_MAPPING).forEach(group => {
      const mapped = CLASS_GROUP_MAPPING[group];
      jobCounts[`job_class_${group}`] = allJobs.filter(l => {
        const jc = (l.Class || l['Class / Board'] || (l as any).class_group || '').toLowerCase();
        return jc.includes(group.toLowerCase()) || (mapped && mapped.some(m => jc.includes(m.toLowerCase())));
      }).length;
      
      tutorCounts[`tutor_class_${group}`] = allTutors.filter(t => {
        const classes = Array.isArray(t.class_group) ? t.class_group : [];
        return classes.some(c => (c || '').toLowerCase().includes(group.toLowerCase()));
      }).length;
    });

    // Mode Counts
    ['Home Tuition', 'Online Class'].forEach(mode => {
      const m = mode.toLowerCase().trim();
      jobCounts[`job_mode_${mode}`] = allJobs.filter(l => {
        const jm = ((l as any).Mode || (l as any).mode || (l as any)['Mode of Teaching'] || (l as any)['Mode of teaching'] || '').toLowerCase().trim();
        if (jm.includes('any') || jm.includes('both')) return true;
        if (m.includes('online')) return jm.includes('online');
        if (m.includes('home')) return jm.includes('home') || jm.includes('offline') || jm === '';
        return jm.includes(m);
      }).length;
    });

    // Locality Counts (only for current city to keep it fast)
    localities.forEach(loc => {
      const searchLoc = loc.toLowerCase().trim();
      const escapedLoc = searchLoc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedLoc}\\b`, 'i');
      
      jobCounts[`job_loc_${loc}`] = allJobs.filter(l => regex.test((l.Locations || (l as any).location || '').toString().toLowerCase())).length;
      tutorCounts[`tutor_loc_${loc}`] = allTutors.filter(t => (Array.isArray(t.location) ? t.location.join(', ') : String(t.location || '')).toLowerCase().includes(searchLoc)).length;
    });

    return { jobCounts, tutorCounts };
  }, [allJobs, allTutors, localities]);

  // Dynamic Count Calculations (Tutors)
  const femaleExpertCount = React.useMemo(() => 
    (allTutors || []).filter(t => (t.gender || '').toLowerCase() === 'female').length, 
  [allTutors]);
  
  const maleExpertCount = React.useMemo(() => 
    (allTutors || []).filter(t => (t.gender || '').toLowerCase() === 'male').length, 
  [allTutors]);

  // Dynamic Count Calculations (Jobs)
  const femaleJobCount = React.useMemo(() => 
    (allJobs || []).filter(l => {
      const g = ((l as any).gender || l.Gender || (l as any).preferred_gender || (l as any).requiredGender || '').toLowerCase().trim();
      const hasFemale = /female/i.test(g);
      const hasMale = /\bmale\b/i.test(g);
      const isAny = g === '' || /any/i.test(g) || /both/i.test(g) || g.includes('/') || (hasFemale && hasMale);
      return hasFemale || isAny;
    }).length, 
  [allJobs]);
  
  const maleJobCount = React.useMemo(() => 
    (allJobs || []).filter(l => {
      const g = ((l as any).gender || l.Gender || (l as any).preferred_gender || (l as any).requiredGender || '').toLowerCase().trim();
      const hasFemale = /female/i.test(g);
      const hasMale = /\bmale\b/i.test(g);
      const isAny = g === '' || /any/i.test(g) || /both/i.test(g) || g.includes('/') || (hasFemale && hasMale);
      return hasMale || isAny;
    }).length, 
  [allJobs]);

  const banners = [
    {
      title: "Elite Network",
      emoji: "🎓",
      sub: "Prestigious Educators ✨",
      desc: "Connect with the most prestigious private educators across the nation.",
      bg: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
      accent: "#fde047",
      icon: <GraduationCap size={72} />,
      cta: "Join the Elite",
      type: 'teacher' as const,
      text: "text-white"
    },
    {
      title: "Premium Tuition",
      emoji: "⭐",
      sub: "Excellence Redefined 🏆",
      desc: "Experience world-class learning with our verified top-tier educators.",
      bg: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
      accent: "#fde047",
      icon: <Star size={72} />,
      cta: "Find Experts",
      type: 'parent' as const,
      text: "text-white"
    },
    {
      title: "Direct Connect",
      emoji: "⚡",
      sub: "Pure Transparency 💎",
      desc: "Direct contact with leads. No intermediaries. Just pure opportunity.",
      bg: "linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)",
      accent: "#fde047",
      icon: <Zap size={72} />,
      cta: "Get Started",
      type: 'teacher' as const,
      text: "text-white"
    },
    {
      title: "109+ Cities",
      emoji: "📍",
      sub: "Pan India Reach 🇮🇳",
      desc: "The largest network of elite tutors operating in every major Indian city.",
      bg: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
      accent: "#fde047",
      icon: <MapPin size={72} />,
      cta: "Explore Map",
      type: 'parent' as const,
      text: "text-white"
    },
    {
      title: "Global Impact",
      emoji: "🌍",
      sub: "World Class Reach ✈️",
      desc: "Present in USA, UK, Canada, Australia, Germany, France, Singapore, UAE & 15+ countries.",
      bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      accent: "#fde047",
      icon: <Globe size={72} />,
      cta: "Global Portal",
      type: 'parent' as const,
      text: "text-white"
    }
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <div className="space-y-4 pb-24">
      {/* 1. Header Section */}
      <section className="px-5 pt-4">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-0.5 overflow-hidden flex-1 text-left">
            <h1 className="text-[18px] font-[900] text-[#0F172A] tracking-tighter whitespace-nowrap truncate">
              Welcome, <span className="text-primary">{userName ? toTitleCase(userName).split(' ')[0] : (userType === 'teacher' ? 'Educator' : 'Parent')}</span> <span className="text-amber-400">👋</span>
            </h1>
            <p className="text-slate-500 text-[9px] font-bold tracking-tight whitespace-nowrap truncate">
              {getDynamicGreeting()}! Let's create impact today.
            </p>
          </div>
          <button 
            onClick={() => { playTapSound(); setShowFilterDrawer(true); }}
            className="flex items-center gap-1 bg-white px-2 py-1 rounded-full border border-slate-100 text-[#0F172A] text-[9px] font-bold shadow-sm active:scale-95 transition-all shrink-0 ml-1.5"
          >
            <MapPin size={10} className="text-[#2563EB]" />
            <span className="tracking-tight uppercase max-w-[65px] truncate">{userCity || 'City'}</span>
            <ChevronDown size={9} className="text-slate-300" />
          </button>
        </div>
      </section>

      {/* 2. Dynamic Carousel Banner */}
      <section className="px-5 relative mt-4">
        <div className="relative h-[165px] w-full rounded-[28px] overflow-hidden shadow-xl bg-gradient-to-r from-[#FF8C00] to-[#EC4899]">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={currentBanner}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "linear" }}
              className="absolute inset-0 p-6 flex flex-col justify-center"
              style={{ background: banners[currentBanner].bg }}
            >
              {/* Animated Right-Side Icon */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-60">
                 <motion.div 
                   animate={{ 
                     y: [0, -12, 0],
                     rotate: [0, 5, 0],
                     scale: [1, 1.05, 1]
                   }}
                   transition={{ 
                     duration: 4, 
                     repeat: Infinity, 
                     ease: "easeInOut" 
                   }}
                 >
                    {React.cloneElement(banners[currentBanner].icon as React.ReactElement, { size: 80, color: "#FFD700" })}
                 </motion.div>
              </div>

              <div className="relative z-10 text-left">
                <div className="space-y-0.5 mb-2.5">
                  <span className="text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-1" style={{ color: banners[currentBanner].accent }}>
                    {banners[currentBanner].sub}
                  </span>
                  <h2 className={cn("text-[21px] font-[900] tracking-tighter leading-none whitespace-nowrap", banners[currentBanner].text)}>
                    {banners[currentBanner].title} <span className="text-amber-400">{banners[currentBanner].emoji}</span>
                  </h2>
                </div>
                
                <p className={cn("text-[9.5px] font-medium mb-4 leading-snug max-w-[200px] opacity-80", banners[currentBanner].text)}>
                  {banners[currentBanner].desc}
                </p>

                <button
                  onClick={() => { playTapSound(); onSignUpClick(); }}
                  className="bg-white text-slate-900 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all w-fit"
                >
                  {banners[currentBanner].cta}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* 3. Quick Actions Section */}
      <section className="px-5 space-y-2.5">
        <div className="flex justify-between items-center text-left">
          <h3 className="text-[16px] font-bold text-[#0F172A] tracking-tight font-sans">Quick Actions</h3>
          <button onClick={() => setActiveTab('jobs')} className="text-[11.5px] font-[600] text-[#2563EB] tracking-tight">
            View all
          </button>
        </div>
        
        <div className="flex justify-between gap-1.5 overflow-hidden">
          <ExploreCard icon={<Briefcase size={14} fill="white" className="text-white" />} label="Jobs" sub="Live" onClick={() => setActiveTab('jobs')} iconBg="bg-purple-500" />
          <ExploreCard icon={<GraduationCap size={14} fill="white" className="text-white" />} label="Tutors" sub="Elite" onClick={() => setActiveTab('tutors')} iconBg="bg-emerald-500" />
          <ExploreCard icon={<CreditCard size={14} fill="white" className="text-white" />} label="Pay" sub="Now" onClick={() => { playTapSound(); window.open("https://zohosecurepay.in/checkout/i9db4wt2-verz1l6gn6ogo/Make-a-secure-payment-now", "_system"); }} iconBg="bg-orange-500" />
          <ExploreCard icon={<Calendar size={14} fill="white" className="text-white" />} label="Trial" sub="Book" onClick={() => { setFormType('parent'); setShowFormModal(true); }} iconBg="bg-pink-500" />
          <ExploreCard icon={<MessageCircle size={14} fill="white" className="text-white" />} label="Help" sub="Care" onClick={() => setActiveTab('support')} iconBg="bg-[#347475]" />
        </div>
      </section>

      {/* Conditional Rendering for Parents */}
      {userType === 'parent' && (
        <>
          <section className="px-4 space-y-2.5">
            <div className="flex items-center gap-2 px-1 text-left">
              <div className="w-1 h-5 bg-primary rounded-full" />
              <h3 className="text-[13px] font-[900] text-[#0F172A] tracking-tight">Expert Instructors</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => { 
                  playTapSound(); 
                  if (onGenderClick) {
                    onGenderClick('Female');
                  } else {
                    setActiveTab('tutors');
                  }
                }}
                className="group relative bg-white border border-rose-100 rounded-[28px] p-5 overflow-hidden active:scale-95 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-rose-500/10 text-left"
              >
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-50 rounded-full group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10 flex flex-col gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-200">
                    <Venus size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-[14px] font-[900] text-rose-950 tracking-tight leading-tight">Female Tutors</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                      <span className="text-[9px] font-black text-rose-600/60 uppercase tracking-widest">
                        {femaleExpertCount > 0 ? `${femaleExpertCount} Verified` : 'Elite Profiles'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div 
                onClick={() => { 
                  playTapSound(); 
                  if (onGenderClick) {
                    onGenderClick('Male');
                  } else {
                    setActiveTab('tutors');
                  }
                }}
                className="group relative bg-white border border-blue-100 rounded-[28px] p-5 overflow-hidden active:scale-95 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-blue-500/10 text-left"
              >
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10 flex flex-col gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <Mars size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-[14px] font-[900] text-blue-950 tracking-tight leading-tight">Male Tutors</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                      <span className="text-[9px] font-black text-blue-600/60 uppercase tracking-widest">
                        {maleExpertCount > 0 ? `${maleExpertCount} Experts` : 'Top Mentors'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tutors by Class Group */}
          <section className="px-4 space-y-2.5">
            <div className="flex justify-between items-center px-1 text-left">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                <h3 className="text-[13px] font-[900] text-[#0F172A] tracking-tight">Academic Circles</h3>
              </div>
              <button onClick={() => setActiveTab('tutors')} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                All Grades
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Class I to V', sub: 'Primary', match: 'I to V', color: 'bg-amber-500', bg: 'bg-amber-50/30', border: 'border-amber-100' },
                { label: 'Class VI to VIII', sub: 'Middle', match: 'VI to VIII', color: 'bg-indigo-500', bg: 'bg-indigo-50/30', border: 'border-indigo-100' },
                { label: 'Class IX to X', sub: 'Secondary', match: 'IX to X', color: 'bg-blue-500', bg: 'bg-blue-50/30', border: 'border-blue-100' },
                { label: 'Class XI to XII', sub: 'Sr. Secondary', match: 'XI to XII', color: 'bg-emerald-500', bg: 'bg-emerald-50/30', border: 'border-emerald-100' },
                { label: 'NEET/JEE', sub: 'Entrance', match: 'Competitive', color: 'bg-rose-500', bg: 'bg-rose-50/30', border: 'border-rose-100' },
                { label: 'Languages', sub: 'IELTS/French', match: 'Language', color: 'bg-purple-500', bg: 'bg-rose-50/30', border: 'border-purple-100' }
              ].map((group, i) => {
                const count = counts.tutorCounts[`tutor_class_${group.match}`] || 0;
                return (
                  <div 
                    key={i}
                    onClick={() => { 
                      playTapSound(); 
                      if (onClassClick) {
                        onClassClick(group.match);
                      } else {
                        setActiveTab('tutors');
                      }
                    }}
                    className={cn("p-2 rounded-[16px] border flex flex-col items-center text-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm relative overflow-hidden", group.bg, group.border)}
                  >
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm", group.color)}>
                      <LayoutGrid size={14} strokeWidth={3} />
                    </div>
                    <div className="flex flex-col -space-y-0.5">
                      <div className="text-[9px] font-[900] text-slate-800 leading-tight truncate w-full">{group.label}</div>
                      <div className="text-[8px] font-bold text-slate-400 truncate w-full">{group.sub}</div>
                    </div>
                    <div className="text-[8px] font-black text-primary/80 bg-white px-1.5 py-0.5 rounded-full border border-slate-100">
                      {count}+
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Locations or Cities */}
          <section className="px-4 space-y-2.5 pb-6">
            <div className="flex items-center justify-between px-1 text-left">
              <div className="flex items-center gap-2">
                <div className={cn("w-1 h-5 rounded-full", userCity && userCity !== 'All' ? "bg-emerald-500" : "bg-rose-500")} />
                <h3 className="text-[15px] font-[900] text-[#0F172A] tracking-tight">
                  {userCity && userCity !== 'All' ? `Top Locations in ${userCity}` : 'Premium Locations'}
                </h3>
              </div>
              {userCity && userCity !== 'All' && (
                <button 
                  onClick={() => { playTapSound(); setShowFilterDrawer(true); }}
                  className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1"
                >
                  Change City <ChevronRight size={10} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-left">
              {userCity && userCity !== 'All' && (localities || []).length > 0 ? (
                (localities || []).map((loc, i) => {
                  const count = counts.tutorCounts[`tutor_loc_${loc}`] || 0;
                  return (
                    <div 
                      key={i}
                      onClick={() => { 
                        playTapSound(); 
                        if (onLocalityClick) {
                          onLocalityClick(loc);
                        } else {
                          setActiveTab('tutors');
                        }
                      }}
                      className="group bg-white border border-slate-100 rounded-[16px] p-2 flex items-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner border border-emerald-100/50 group-hover:scale-110 transition-transform shrink-0">
                        <MapPin size={13} strokeWidth={3} />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[9px] font-[900] text-slate-800 tracking-tight truncate leading-tight block">{loc}</span>
                        <span className="text-[7.5px] font-black text-emerald-600/70 uppercase tracking-tighter truncate">
                          {count}+ Experts
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                [
                  { city: 'Agra', img: '🏰', tutors: '850+' },
                  { city: 'Lucknow', img: '🕌', tutors: '1.2K+' },
                  { city: 'Gwalior', img: '⛰️', tutors: '420+' },
                  { city: 'Kanpur', img: '🏭', tutors: '960+' }
                ].map((item, i) => (
                  <div 
                    key={i}
                    onClick={() => { playTapSound(); setActiveTab('tutors'); }}
                    className="group bg-white border border-slate-100 rounded-[16px] p-2 flex items-center gap-2.5 shadow-sm active:scale-95 transition-all cursor-pointer hover:border-primary/20 hover:shadow-lg"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-xl shadow-inner border border-slate-100/50 group-hover:bg-primary/5 group-hover:scale-110 transition-all duration-300 shrink-0">
                      {item.img}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <span className="text-[13px] font-[900] text-slate-800 tracking-tight truncate block">{item.city}</span>
                      <span className="text-[9px] font-black text-primary/70 uppercase tracking-tighter truncate">{item.tutors} Experts</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}

      {/* Conditional Rendering for Tutors (NEW Parallel Structure) */}
      {userType === 'teacher' && (
        <>
          {/* Jobs by Gender (Mirror Parent Experts by Gender) */}
          <section className="px-4 space-y-2.5">
            <div className="flex items-center gap-2 px-1 text-left">
              <div className="w-1 h-5 bg-indigo-600 rounded-full" />
              <h3 className="text-[14px] font-bold text-[#0F172A] tracking-tight">Jobs by Gender</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => { playTapSound(); onGenderClick?.('Female'); }}
                className="group relative bg-white border border-rose-100 rounded-[28px] p-5 overflow-hidden active:scale-95 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-rose-500/10 text-left"
              >
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-50 rounded-full group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10 flex flex-col gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-200">
                    <Venus size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-[13px] font-[900] text-rose-950 tracking-tight leading-tight font-black">Female Teachers</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                      <span className="text-[9px] font-black text-rose-600/60 uppercase tracking-widest">
                        {femaleJobCount}+ Jobs
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div 
                onClick={() => { playTapSound(); onGenderClick?.('Male'); }}
                className="group relative bg-white border border-blue-100 rounded-[28px] p-5 overflow-hidden active:scale-95 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-blue-500/10 text-left"
              >
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10 flex flex-col gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <Mars size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-[13px] font-[900] text-blue-950 tracking-tight leading-tight font-black">Male Teachers</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                      <span className="text-[9px] font-black text-blue-600/60 uppercase tracking-widest">
                        {maleJobCount}+ Jobs
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Jobs by Class Group (Mirror Parent Academic Circles) */}
          <section className="px-4 space-y-2.5">
            <div className="flex justify-between items-center px-1 text-left">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                <h3 className="text-[14px] font-bold text-[#0F172A] tracking-tight">Jobs by Class Group</h3>
              </div>
              <button onClick={() => setActiveTab('jobs')} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                All Grades
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Class I to V', sub: 'Primary', match: 'Class I to V', color: 'bg-amber-500', bg: 'bg-amber-50/30', border: 'border-amber-100', icon: <BookOpen size={14} strokeWidth={3} /> },
                { label: 'Class VI to VIII', sub: 'Middle', match: 'Class VI to VIII', color: 'bg-indigo-500', bg: 'bg-indigo-50/30', border: 'border-indigo-100', icon: <Users size={14} strokeWidth={3} /> },
                { label: 'Class IX to X', sub: 'Secondary', match: 'Class IX to X', color: 'bg-blue-500', bg: 'bg-blue-50/30', border: 'border-blue-100', icon: <Trophy size={14} strokeWidth={3} /> },
                { label: 'Class XI to XII', sub: 'Sr. Sec', match: 'Class XI to XII', color: 'bg-emerald-500', bg: 'bg-emerald-50/30', border: 'border-emerald-100', icon: <Star size={14} strokeWidth={3} /> },
                { label: 'NEET/JEE', sub: 'Entrance', match: 'Competitive', color: 'bg-rose-500', bg: 'bg-rose-50/30', border: 'border-rose-100', icon: <Zap size={14} strokeWidth={3} /> },
                { label: 'Language', sub: 'IELTS/FR', match: 'Language', color: 'bg-purple-500', bg: 'bg-rose-50/30', border: 'border-purple-100', icon: <Globe size={14} strokeWidth={3} /> }
              ].map((group, i) => {
                const count = counts.jobCounts[`job_class_${group.match}`] || 0;
                return (
                  <div 
                    key={i}
                    onClick={() => { playTapSound(); onClassClick?.(group.match); }}
                    className={cn("p-2 rounded-[16px] border flex flex-col items-center text-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm relative overflow-hidden", group.bg, group.border)}
                  >
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm", group.color)}>
                      {group.icon}
                    </div>
                    <div className="flex flex-col -space-y-0.5 overflow-hidden w-full">
                      <div className="text-[9px] font-[1000] text-slate-800 truncate uppercase tracking-widest">{group.label}</div>
                      <div className="text-[8px] font-bold text-slate-400 truncate uppercase tracking-tighter">{group.sub}</div>
                    </div>
                    <div className="text-[8px] font-black text-indigo-600 bg-white px-1.5 py-0.5 rounded-full border border-indigo-100">
                      {count}+
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Mode (Teaching Modes Redesigned) */}
          <section className="px-4 space-y-2.5">
            <div className="flex justify-between items-center px-1 text-left">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-purple-500 rounded-full" />
                <h3 className="text-[14px] font-bold text-[#0F172A] tracking-tight">Jobs by Mode</h3>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
               {[
                 { label: "Student's Place", match: 'Home Tuition', color: 'text-indigo-600', gradient: 'from-indigo-400 to-indigo-600', bg: 'bg-indigo-50', icon: <HomeIcon size={16} /> },
                 { label: "Tutor's Place", match: "At Tutor's Place", color: 'text-emerald-600', gradient: 'from-emerald-400 to-emerald-600', bg: 'bg-emerald-50', icon: <User size={16} /> },
                 { label: "Online Class", match: 'Online Class', color: 'text-purple-600', gradient: 'from-purple-400 to-purple-600', bg: 'bg-purple-50', icon: <Laptop size={16} /> },
                 { label: "At Institute", match: 'At Institute', color: 'text-orange-600', gradient: 'from-orange-400 to-orange-600', bg: 'bg-orange-50', icon: <Monitor size={16} /> },
                 { label: "At School", match: 'At School', color: 'text-rose-600', gradient: 'from-rose-400 to-rose-600', bg: 'bg-rose-50', icon: <Briefcase size={16} /> },
                 { label: "All Modes", match: 'All', color: 'text-slate-600', gradient: 'from-slate-500 to-slate-700', bg: 'bg-slate-50', icon: <Sparkles size={16} /> }
               ].map((mode, i) => {
                 const count = counts.jobCounts[`job_mode_${mode.match}`] || 0;
                 return (
                   <div
                     key={i}
                     onClick={() => { playTapSound(); onModeClick?.(mode.match); }}
                     className={cn(
                       "group relative bg-white border rounded-[24px] p-3 overflow-hidden active:scale-95 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 text-center flex flex-col items-center gap-2",
                       mode.bg.replace('50', '100/50') // Light border matching theme
                     )}
                   >
                     <div className={cn("absolute -top-6 -right-6 w-16 h-16 rounded-full group-hover:scale-150 transition-transform duration-500 opacity-50", mode.bg)} />

                     <div className={cn("relative z-10 w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-110", mode.gradient)}>
                       {mode.icon}
                     </div>

                     <div className="relative z-10 flex flex-col items-center gap-0.5 w-full">
                       <div className="text-[8.5px] font-[1000] text-slate-900 tracking-tight leading-tight uppercase line-clamp-1">{mode.label}</div>
                       <div className="flex items-center gap-1 mt-0.5">
                         <div className={cn("w-1 h-1 rounded-full animate-pulse", mode.color.replace('text-', 'bg-'))} />
                         <span className={cn("text-[7.5px] font-black uppercase tracking-widest opacity-60", mode.color)}>
                           {count}+ Jobs
                         </span>
                       </div>
                     </div>
                   </div>
                 );
               })}
            </div>
          </section>

          {/* Jobs in City (Mirror Parent Top Locations) */}
          <section className="px-4 space-y-2.5 pb-6">
            <div className="flex items-center justify-between px-1 text-left">
              <div className="flex items-center gap-2">
                <div className={cn("w-1 h-5 rounded-full", userCity && userCity !== 'All' ? "bg-emerald-500" : "bg-rose-500")} />
                <h3 className="text-[14px] font-bold text-[#0F172A] tracking-tight">
                  {userCity && userCity !== 'All' ? `Jobs in ${userCity}` : 'Popular Cities'}
                </h3>
              </div>
              <button onClick={() => setShowFilterDrawer(true)} className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1 shadow-sm px-2 py-1 bg-white rounded-full border border-slate-50">Change City <ChevronRight size={10} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-left">
              {userCity && userCity !== 'All' ? (
                [...localities].sort((a, b) => (counts.jobCounts[`job_loc_${b}`] || 0) - (counts.jobCounts[`job_loc_${a}`] || 0)).map((loc, i) => (
                  <div key={i} onClick={() => onLocalityClick?.(loc)} className="bg-white border border-slate-100 rounded-[16px] p-2 flex items-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer hover:border-emerald-200">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0"><MapPin size={13} strokeWidth={3} /></div>
                    <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                      <span className="text-[9px] font-[1000] text-slate-800 truncate leading-tight block">{loc}</span>
                      <span className="text-[7.5px] font-black text-emerald-600/70 uppercase truncate">{counts.jobCounts[`job_loc_${loc}`] || 0}+ Jobs</span>
                    </div>
                  </div>
                ))
              ) : (
                ['Mumbai', 'Delhi', 'Bangalore', 'Pune'].map((city, i) => (
                  <div key={i} onClick={() => onCityClick?.(city)} className="bg-white border border-slate-100 rounded-[16px] p-2 flex items-center gap-2.5 shadow-sm active:scale-95 transition-all cursor-pointer">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-xl shrink-0">📍</div>
                    <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                      <span className="text-[13px] font-[1000] text-slate-800 truncate block">{city}</span>
                      <span className="text-[9px] font-black text-primary/70 uppercase truncate">{(allJobs || []).filter(l => (l.City || '').toLowerCase().includes(city.toLowerCase())).length}+ Jobs</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
});

export default HomeView;

const ExploreCard = ({ icon, label, sub, onClick, iconBg }: { icon: React.ReactNode, label: string, sub: string, onClick: () => void, iconBg: string }) => (
  <button 
    onClick={onClick}
    className="flex-1 flex flex-col items-center gap-1.5 p-2 bg-white border border-slate-100 rounded-[20px] shadow-sm active:scale-95 transition-all group"
  >
    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 text-white", iconBg)}>
      {React.cloneElement(icon as React.ReactElement, { size: 14, fill: 'currentColor' })}
    </div>
    <div className="text-center">
      <div className="text-[9.5px] font-black text-slate-800 uppercase tracking-tight leading-none">{label}</div>
      <div className="text-[7.5px] font-bold text-slate-400 uppercase tracking-tighter leading-none mt-0.5">{sub}</div>
    </div>
  </button>
);

const ImpactStat = ({ icon, value, label, label2 }: { icon: React.ReactNode, value: string, label: string, label2: string }) => (
  <div className="flex-1 flex flex-col items-center text-center gap-1">
    <div className="flex items-center gap-1.5">
       {icon}
       <span className="text-[13px] font-black text-slate-900 tracking-tight">{value}</span>
    </div>
    <div className="flex flex-col -space-y-1">
      <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-[0.1em]">{label}</span>
      <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-[0.1em]">{label2}</span>
    </div>
  </div>
);
