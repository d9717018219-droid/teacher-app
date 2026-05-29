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
  Home,
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
  Navigation
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
  onClassClick?: (className: string) => void;
  onLocalityClick?: (locality: string) => void;
  onGenderClick?: (gender: 'Male' | 'Female') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
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
  onClassClick,
  onLocalityClick,
  onGenderClick
}) => {
  const [currentBanner, setCurrentBanner] = React.useState(0);

  // Dynamic Count Calculations
  const femaleCount = React.useMemo(() => 
    allTutors.filter(t => (t.gender || '').toLowerCase() === 'female').length, 
  [allTutors]);
  
  const maleCount = React.useMemo(() => 
    allTutors.filter(t => (t.gender || '').toLowerCase() === 'male').length, 
  [allTutors]);

  const getTutorCountForClass = (group: string) => {
    return allTutors.filter(t => {
      const classes = Array.isArray(t.class_group) ? t.class_group : [];
      return classes.some(c => (c || '').toLowerCase().includes(group.toLowerCase()));
    }).length;
  };

  const getTutorCountForLocality = (loc: string) => {
    const searchLoc = (loc || '').toLowerCase().trim();
    if (!searchLoc) return 0;
    
    return allTutors.filter(t => {
      // Handle both array and string cases for robustness
      const tutorLocs = Array.isArray(t.location) 
        ? t.location.join(', ').toLowerCase() 
        : (t.location || '').toString().toLowerCase();
        
      return tutorLocs.includes(searchLoc);
    }).length;
  };

  const banners = [
    {
      title: "Elite Network",
      emoji: "🎓",
      sub: "Established 2022 ✨",
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
      title: "113+ Cities",
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
      desc: "Transcending boundaries to provide elite education on a global scale.",
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
          <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
            <h1 className="text-[18px] font-[900] text-[#0F172A] tracking-tighter whitespace-nowrap truncate">
              Welcome, <span className="text-primary">{userName ? toTitleCase(userName).split(' ')[0] : (userType === 'teacher' ? 'Educator' : 'Parent')}</span> <span className="text-amber-400">👋</span>
            </h1>
            <p className="text-[#64748B] text-[10.5px] font-[500] tracking-tight whitespace-nowrap truncate">
              {getDynamicGreeting()} Let's create impact today.
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

              <div className="relative z-10">
                <div className="space-y-0.5 mb-2.5">
                  <span className="text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-1" style={{ color: banners[currentBanner].accent }}>
                    {banners[currentBanner].sub.split(' ').map((word, i) => {
                      const hasEmoji = /\p{Extended_Pictographic}/u.test(word);
                      return (
                        <span key={i} className={cn(hasEmoji && "text-amber-400")}>
                          {word}
                        </span>
                      );
                    })}
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
                  className="bg-white/15 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl flex items-center gap-2 active:scale-95 transition-all shadow-md w-fit"
                >
                  <span className="text-[9px] font-black uppercase tracking-widest text-white">{banners[currentBanner].cta}</span>
                  <ArrowRight size={12} className="text-white" strokeWidth={3} />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* 3. Quick Actions Section */}
      <section className="px-5 space-y-2.5">
        <div className="flex justify-between items-center">
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
            <div className="flex items-center gap-2 px-1">
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
                className="group relative bg-white border border-rose-100 rounded-[28px] p-5 overflow-hidden active:scale-95 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-rose-500/10"
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
                        {femaleCount > 0 ? `${femaleCount} Verified` : 'Elite Profiles'}
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
                className="group relative bg-white border border-blue-100 rounded-[28px] p-5 overflow-hidden active:scale-95 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-blue-500/10"
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
                        {maleCount > 0 ? `${maleCount} Experts` : 'Top Mentors'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tutors by Class Group */}
          <section className="px-4 space-y-2.5">
            <div className="flex justify-between items-center px-1">
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
                const count = getTutorCountForClass(group.match);
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
                    className={cn("p-2 rounded-[16px] border flex flex-col items-center text-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm relative overflow-hidden backdrop-blur-md", group.bg, group.border)}
                  >
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm", group.color)}>
                      <LayoutGrid size={14} strokeWidth={3} />
                    </div>
                    <div className="flex flex-col -space-y-0.5">
                      <div className="text-[9px] font-[900] text-slate-800 leading-tight truncate w-full">{group.label}</div>
                      <div className="text-[8px] font-bold text-slate-400 truncate w-full">{group.sub}</div>
                    </div>
                    <div className="text-[8px] font-black text-primary/80 bg-white px-1.5 py-0.5 rounded-full border border-slate-100">
                      {count > 0 ? count : '50'}+
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Locations or Cities */}
          <section className="px-4 space-y-2.5 pb-6">
            <div className="flex items-center justify-between px-1">
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

            <div className="grid grid-cols-2 gap-2">
              {userCity && userCity !== 'All' && localities.length > 0 ? (
                localities.map((loc, i) => {
                  const count = getTutorCountForLocality(loc);
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
                          {count > 0 ? `${count} Experts` : 'Top Hub'}
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

      {/* Conditional Rendering for Tutors */}
      {userType === 'teacher' && (
        <>
          {/* Latest Jobs Section for Tutors */}
          <section className="px-4 space-y-2.5">
            <div className="flex justify-between items-center">
              <h3 className="text-[16px] font-bold text-[#0F172A] tracking-tighter">Available Jobs</h3>
              <button onClick={() => setActiveTab('jobs')} className="text-[11px] font-bold text-primary uppercase tracking-widest">
                View all
              </button>
            </div>
            
            <div className="space-y-3">
              {featuredJobs.length > 0 ? (
                featuredJobs.map((job, idx) => (
                  <motion.div
                    key={getJobId(job)}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <JobCard 
                      job={job} 
                      onClick={onJobClick} 
                      isShortlisted={shortlistedIds.includes(getJobId(job))}
                      onShortlistToggle={onShortlistToggle}
                    />
                  </motion.div>
                ))
              ) : (
                 <div className="py-10 text-center text-slate-400 text-[9px] font-black uppercase tracking-widest bg-white rounded-[32px] border border-dashed border-slate-200">
                   Updating Signals...
                 </div>
              )}
            </div>
          </section>

          {/* Job Categories for Tutors */}
          <section className="px-5 space-y-3 pb-6">
            <h3 className="text-[13px] font-bold text-[#0F172A] tracking-tight">Jobs by Category</h3>
            <div className="grid grid-cols-2 gap-2">
              <div 
                onClick={() => { playTapSound(); setActiveTab('jobs'); }}
                className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                  <BookOpen size={20} strokeWidth={3} />
                </div>
                <div>
                  <div className="text-[13px] font-black text-indigo-900">Academic</div>
                  <div className="text-[9px] font-bold text-indigo-600/70">School Subjects</div>
                </div>
              </div>
              <div 
                onClick={() => { playTapSound(); setActiveTab('jobs'); }}
                className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                  <Sparkles size={20} strokeWidth={3} />
                </div>
                <div>
                  <div className="text-[13px] font-black text-emerald-900">Competitive</div>
                  <div className="text-[9px] font-bold text-emerald-600/70">Exam Prep</div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Default Sections (shown for guest or fallback) */}
      {(!userType) && (
        <>
          {/* 4. Impact Statistics Section */}
          <section className="px-5">
            <div className="bg-white border border-slate-100 rounded-[24px] p-4 space-y-3 shadow-sm">
              <div className="space-y-0.5 px-1">
                <h3 className="text-[13px] font-bold text-[#0F172A] tracking-tight">Impact Statistics</h3>
                <p className="text-[#64748B] text-[9px] font-medium tracking-tight opacity-70">Empowering abilities across India.</p>
              </div>
              
              <div className="flex items-center justify-between gap-1 pt-2">
                <ImpactStat icon={<Users size={14} className="text-emerald-500" fill="currentColor" />} value="25K+" label="Students" label2="Impacted" />
                <div className="w-[1px] h-5 bg-slate-100" />
                <ImpactStat icon={<User size={14} className="text-indigo-500" fill="currentColor" />} value="10K+" label="Expert" label2="Educators" />
                <div className="w-[1px] h-5 bg-slate-100" />
                <ImpactStat icon={<MapPin size={14} className="text-rose-500" fill="currentColor" />} value="113+" label="Cities" label2="Network" />
                <div className="w-[1px] h-5 bg-slate-100" />
                <ImpactStat icon={<Star size={14} className="text-amber-500" fill="currentColor" />} value="4.8" label="Average" label2="Rating" />
              </div>
            </div>
          </section>

          {/* Why Parents Choose Us Section */}
          <section className="px-5">
            <div className="bg-white border border-slate-100 rounded-[24px] p-5 space-y-4 shadow-sm">
              <div className="space-y-0.5 px-1">
                <h3 className="text-[13px] font-bold text-[#0F172A] tracking-tight">Why Parents Trust Us</h3>
                <p className="text-[#64748B] text-[9px] font-medium tracking-tight opacity-70">Empowering your child's learning journey.</p>
              </div>
              
              <div className="grid grid-cols-4 gap-2 pt-1">
                <div className="flex flex-col items-center text-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <ShieldCheck size={18} />
                  </div>
                  <span className="text-[9px] font-bold text-slate-700 leading-tight">Verified Experts</span>
                </div>
                <div className="flex flex-col items-center text-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <CreditCard size={18} />
                  </div>
                  <span className="text-[9px] font-bold text-slate-700 leading-tight">No Service Charge</span>
                </div>
                <div className="flex flex-col items-center text-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                    <Home size={18} />
                  </div>
                  <span className="text-[9px] font-bold text-slate-700 leading-tight">At Student's Place</span>
                </div>
                <div className="flex flex-col items-center text-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                    <TrendingUp size={18} />
                  </div>
                  <span className="text-[9px] font-bold text-slate-700 leading-tight">Proven Results</span>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Latest Jobs Section */}
          <section className="px-4 space-y-2.5">
            <div className="flex justify-between items-center">
              <h3 className="text-[16px] font-bold text-[#0F172A] tracking-tighter">Latest Jobs</h3>
              <button onClick={() => setActiveTab('jobs')} className="text-[11px] font-bold text-primary uppercase tracking-widest">
                View all
              </button>
            </div>
            
            <div className="space-y-3">
              {featuredJobs.length > 0 ? (
                featuredJobs.map((job, idx) => (
                  <motion.div
                    key={getJobId(job)}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <JobCard 
                      job={job} 
                      onClick={onJobClick} 
                      isShortlisted={shortlistedIds.includes(getJobId(job))}
                      onShortlistToggle={onShortlistToggle}
                    />
                  </motion.div>
                ))
              ) : (
                 <div className="py-10 text-center text-slate-400 text-[9px] font-black uppercase tracking-widest bg-white rounded-[32px] border border-dashed border-slate-200">
                   Updating Signals...
                 </div>
              )}
            </div>
          </section>

          {/* 6. Premium Tutors Section */}
          <section className="px-4 space-y-2.5 pb-6">
            <div className="flex justify-between items-center">
              <h3 className="text-[16px] font-bold text-[#0F172A] tracking-tighter">Experts Hub</h3>
              <button onClick={() => setActiveTab('tutors')} className="text-[11px] font-bold text-primary uppercase tracking-widest">
                View all
              </button>
            </div>
            
            <div className="space-y-3">
              {featuredTutors.length > 0 ? (
                featuredTutors.map((tutor, idx) => (
                  <motion.div
                    key={getTutorId(tutor)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <TutorCard 
                      tutor={tutor} 
                      onClick={onTutorClick} 
                      isShortlisted={shortlistedIds.includes(getTutorId(tutor))}
                      onShortlistToggle={onShortlistToggle}
                    />
                  </motion.div>
                ))
              ) : (
                <div className="py-10 text-center text-slate-400 text-[9px] font-black uppercase tracking-widest bg-white rounded-[32px] border border-dashed border-slate-200">
                   Discovering Talent...
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default HomeView;

const ExploreCard = ({ icon, label, sub, onClick, iconBg }: { icon: React.ReactNode, label: string, sub: string, onClick: () => void, iconBg: string }) => (
  <button 
    onClick={onClick}
    className="flex-1 flex flex-col items-center gap-1.5 p-2 bg-white border border-slate-100 rounded-[20px] shadow-sm active:scale-95 transition-all group"
  >
    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110", iconBg)}>
      {React.cloneElement(icon as React.ReactElement, { size: 12 })}
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
