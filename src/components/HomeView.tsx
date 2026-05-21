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
  ArrowRight,
  Sparkles,
  Clock
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
  setActiveTab: (tab: 'home' | 'jobs' | 'tutors' | 'alerts' | 'admin' | 'support' | 'shortlist' | 'payments') => void;
  getDynamicGreeting: () => string;
  setShowFilterDrawer: (show: boolean) => void;
  onJobClick: (job: JobLead) => void;
  onTutorClick: (tutor: TutorProfile) => void;
  shortlistedIds: string[];
  onShortlistToggle: (id: string, e: React.MouseEvent) => void;
}

export default function HomeView({
  userName,
  userType,
  userCity,
  playTapSound,
  setFormType,
  setShowFormModal,
  setActiveTab,
  setShowFilterDrawer,
  getDynamicGreeting,
  featuredJobs,
  featuredTutors,
  onJobClick,
  onTutorClick,
  shortlistedIds,
  onShortlistToggle
}: HomeViewProps) {
  const [currentBanner, setCurrentBanner] = React.useState(0);
  const banners = [
    {
      title: "Elite Network 🎓",
      sub: "Established 2022 ✨",
      desc: "Connect with the most prestigious private educators across the nation.",
      bg: "linear-gradient(135deg, #354B61, #243342)",
      accent: "#fbbf24",
      icon: <GraduationCap size={72} />,
      cta: "Join the Elite",
      type: 'teacher',
      text: "text-white"
    },
    {
      title: "Premium Tuition ⭐",
      sub: "Excellence Redefined 🏆",
      desc: "Experience world-class learning with our verified top-tier educators.",
      bg: "linear-gradient(135deg, #417C85, #2d585e)",
      accent: "#fbbf24",
      icon: <Star size={72} />,
      cta: "Find Experts",
      type: 'parent',
      text: "text-white"
    },
    {
      title: "Direct Connect ⚡",
      sub: "Pure Transparency 💎",
      desc: "Direct contact with leads. No intermediaries. Just pure opportunity.",
      bg: "linear-gradient(135deg, #854174, #5c2d50)",
      accent: "#fbbf24",
      icon: <Zap size={72} />,
      cta: "Get Started",
      type: 'teacher',
      text: "text-white"
    },
    {
      title: "100+ Cities 📍",
      sub: "Pan India Reach 🇮🇳",
      desc: "The largest network of elite tutors operating in every major Indian city.",
      bg: "linear-gradient(135deg, #614185, #442d5c)",
      accent: "#fbbf24",
      icon: <MapPin size={72} />,
      cta: "Explore Map",
      type: 'parent',
      text: "text-white"
    },
    {
      title: "Global Impact 🌍",
      sub: "World Class Reach ✈️",
      desc: "Transcending boundaries to provide elite education on a global scale.",
      bg: "linear-gradient(135deg, #854152, #5c2d38)",
      accent: "#fbbf24",
      icon: <Globe size={72} />,
      cta: "Global Portal",
      type: 'parent',
      text: "text-white"
    }
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col gap-6 pb-32 bg-[#FAFBFF] font-sans">
      
      {/* 1. Greeting Section */}
      <section className="px-5 pt-4">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <h1 className="text-[18px] font-[900] text-[#0F172A] tracking-tighter whitespace-nowrap">
              Welcome, {userName || (userType === 'teacher' ? 'Educator' : 'Parent')} 👋
            </h1>
            <p className="text-[#64748B] text-[10.5px] font-[500] tracking-tight">
              {getDynamicGreeting()} Let's create impact today.
            </p>
          </div>
          <button 
            onClick={() => { playTapSound(); setShowFilterDrawer(true); }}
            className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-full border border-slate-100 text-[#0F172A] text-[10px] font-bold shadow-sm active:scale-90 transition-all shrink-0"
          >
            <MapPin size={12} className="text-primary" />
            <span className="tracking-tight">{toTitleCase(userCity) || 'All'}</span>
            <ChevronDown size={10} className="text-slate-300" />
          </button>
        </div>
      </section>

      {/* 2. Dynamic Carousel Banner */}
      <section className="px-5 relative">
        <div className="relative h-[165px] w-full rounded-[28px] overflow-hidden shadow-xl bg-slate-900">
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
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
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
                   className="w-16 h-16 rounded-[24px] bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl"
                 >
                    {React.cloneElement(banners[currentBanner].icon as React.ReactElement, { size: 32, className: "opacity-100", color: "#fbbf24" })}
                 </motion.div>
              </div>

              <div className="relative z-10">
                <div className="space-y-0.5 mb-2.5">
                  <span className="text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: banners[currentBanner].accent }}>
                    {banners[currentBanner].sub}
                  </span>
                  <h2 className={cn("text-[21px] font-[900] tracking-tighter leading-none", (banners[currentBanner] as any).text)}>
                    {banners[currentBanner].title}
                  </h2>
                </div>
                
                <p className={cn("text-[9.5px] font-medium mb-4 leading-snug max-w-[200px] opacity-80", (banners[currentBanner] as any).text)}>
                  {banners[currentBanner].desc}
                </p>
                
                <button 
                  onClick={() => { playTapSound(); setFormType(banners[currentBanner].type as any); setShowFormModal(true); }}
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

      {/* 3. Explore Opportunities Section */}
      <section className="px-5 space-y-2.5">
        <div className="flex justify-between items-center">
          <h3 className="text-[16px] font-bold text-[#0F172A] tracking-tight">Explore Opportunities</h3>
          <button onClick={() => setActiveTab('jobs')} className="text-[11.5px] font-[600] text-[#2563EB] tracking-tight">
            View all
          </button>
        </div>
        
        <div className="flex justify-between gap-1.5 overflow-hidden">
          <ExploreCard icon={<Briefcase size={14} fill="white" className="text-white" />} label="Jobs" sub="Openings" onClick={() => setActiveTab('jobs')} iconBg="bg-purple-500" />
          <ExploreCard icon={<GraduationCap size={14} fill="white" className="text-white" />} label="Tutors" sub="Experts" onClick={() => setActiveTab('tutors')} iconBg="bg-emerald-500" />
          <ExploreCard icon={<CreditCard size={14} fill="white" className="text-white" />} label="Pay" sub="Now" onClick={() => { playTapSound(); window.open("https://zohosecurepay.in/checkout/i9db4wt2-verz1l6gn6ogo/Make-a-secure-payment-now", "_system"); }} iconBg="bg-orange-500" />
          <ExploreCard icon={<Calendar size={14} fill="white" className="text-white" />} label="Trial" sub="Book now" onClick={() => { setFormType('parent'); setShowFormModal(true); }} iconBg="bg-pink-500" />
          <ExploreCard icon={<MessageCircle size={14} fill="white" className="text-white" />} label="Help" sub="Support" onClick={() => setActiveTab('support')} iconBg="bg-[#347475]" />
        </div>
      </section>

      {/* 4. Our Impact Section */}
      <section className="px-5">
        <div className="bg-white border border-slate-100 rounded-[24px] p-4 space-y-3 shadow-sm">
          <div className="space-y-0.5 px-1">
            <h3 className="text-[15px] font-[900] text-[#0F172A] tracking-tighter uppercase">Our Network</h3>
            <p className="text-[#64748B] text-[10px] font-bold tracking-tight opacity-70">Empowering abilities across India.</p>
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

      {/* 5. Latest Jobs Section */}
      <section className="px-5 space-y-4">
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
             <div className="py-10 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest bg-white rounded-[32px] border border-dashed border-slate-200">
               Updating Signals...
             </div>
          )}
        </div>
      </section>

      {/* 6. Premium Tutors Section */}
      <section className="px-5 space-y-4 pb-10">
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
             <div className="py-10 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest bg-white rounded-[32px] border border-dashed border-slate-200">
               Syncing Experts...
             </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ExploreCard({ icon, label, sub, onClick, iconBg = "bg-slate-50" }: { 
  icon: React.ReactNode; 
  label: string; 
  sub: string;
  onClick: () => void;
  iconBg?: string;
}) {
  return (
    <button 
      onClick={onClick}
      className="flex-shrink-0 bg-white p-2 rounded-[16px] flex flex-col items-center text-center gap-1 shadow-sm border border-slate-100 active:scale-95 transition-all flex-1 min-w-0"
    >
      <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center mb-0.5 shadow-sm", iconBg)}>
        {icon}
      </div>
      <div className="space-y-0.5 w-full overflow-hidden">
        <span className="block text-[10px] font-[900] text-[#0F172A] truncate w-full tracking-tighter leading-none">{label}</span>
        <span className="block text-[8px] text-[#64748B] font-[600] leading-none truncate w-full tracking-tighter opacity-80">{sub}</span>
      </div>
    </button>
  );
}

function ImpactStat({ icon, value, label, label2 }: { icon: React.ReactNode; value: string; label: string; label2: string }) {
  return (
    <div className="flex flex-col items-center flex-1 text-center min-w-0">
      <div className="flex items-center gap-1 mb-0.5">
        {icon}
        <span className="text-[13px] font-[800] text-[#0F172A] tracking-tighter whitespace-nowrap leading-none">{value}</span>
      </div>
      <div className="flex flex-col leading-none">
         <span className="text-[8px] font-[700] text-[#64748B] tracking-tight opacity-70 truncate">{label}</span>
         <span className="text-[8px] font-[700] text-[#64748B] tracking-tight opacity-70 truncate">{label2}</span>
      </div>
    </div>
  );
}
