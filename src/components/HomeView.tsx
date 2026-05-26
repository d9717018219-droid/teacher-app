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
  TrendingUp
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
  onShortlistToggle
}) => {
  const [currentBanner, setCurrentBanner] = React.useState(0);
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
    <div className="space-y-6 pb-24">
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
      <section className="px-5 relative">
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

      {/* 4. Impact Statistics Section (Moved up here) */}
      <section className="px-5">
        <div className="bg-white border border-slate-100 rounded-[24px] p-4 space-y-3 shadow-sm">
          <div className="space-y-0.5 px-1">
            <h3 className="text-[15px] font-bold text-[#0F172A] tracking-tight">Impact Statistics</h3>
            <p className="text-[#64748B] text-[10px] font-medium tracking-tight opacity-70">Empowering abilities across India.</p>
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
            <h3 className="text-[15px] font-bold text-[#0F172A] tracking-tight">Why Parents Trust Us</h3>
            <p className="text-[#64748B] text-[10px] font-medium tracking-tight opacity-70">Empowering your child's learning journey.</p>
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

      {/* Why Tutors Choose Us Section */}
      <section className="px-5">
        <div className="bg-white border border-slate-100 rounded-[24px] p-5 space-y-4 shadow-sm">
          <div className="space-y-0.5 px-1">
            <h3 className="text-[15px] font-bold text-[#0F172A] tracking-tight">The Expert's Choice</h3>
            <p className="text-[#64748B] text-[10px] font-medium tracking-tight opacity-70">Fueling the future of elite educators.</p>
          </div>
          
          <div className="grid grid-cols-4 gap-2 pt-1">
            <div className="flex flex-col items-center text-center gap-1.5">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Zap size={18} />
              </div>
              <span className="text-[9px] font-bold text-slate-700 leading-tight">Direct Leads</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1.5">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                <ShieldCheck size={18} />
              </div>
              <span className="text-[9px] font-bold text-slate-700 leading-tight">No Upfront Fees</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1.5">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <MessageCircle size={18} />
              </div>
              <span className="text-[9px] font-bold text-slate-700 leading-tight">Dedicated Support</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1.5">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                <Sparkles size={18} />
              </div>
              <span className="text-[9px] font-bold text-slate-700 leading-tight">Elite Network</span>
            </div>
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
               Discovering Talent...
            </div>
          )}
        </div>
      </section>
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
