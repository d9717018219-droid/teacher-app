import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Search, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  ChevronRight,
  Briefcase,
  Calendar,
  Wallet,
  MapPin,
  ArrowRight,
  Loader2,
  Trash2,
  User,
  MessageCircle,
  Phone,
  Sparkles,
  Trophy,
  Zap,
  Target,
  X,
  CreditCard,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { JobLead } from '../types';
import { cn, formatCurrency, toTitleCase, openWhatsApp } from '../utils';

interface EarningsViewProps {
  leads: JobLead[];
  firestoreLeads: JobLead[];
  userName?: string | null;
  userCity?: string | null;
  playTapSound: () => void;
  setSelectedJob: (job: JobLead | null) => void;
}

interface EarningRecord {
  orderId: string;
  amount: number;
  classGroup: string;
  city: string;
  days?: string;
  duration?: string;
  time?: string;
  assignedTutor?: string;
  startDate?: string;
  status: 'pending' | 'verified' | 'paid';
  date: string;
}

const CARD_ACCENTS = [
  { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', iconBg: 'bg-indigo-600' },
  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', iconBg: 'bg-emerald-600' },
  { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', iconBg: 'bg-amber-600' },
  { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', iconBg: 'bg-rose-600' },
  { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', iconBg: 'bg-blue-600' },
  { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', iconBg: 'bg-purple-600' },
];

export const EarningsView: React.FC<EarningsViewProps> = ({ leads, firestoreLeads, userName, userCity, playTapSound, setSelectedJob }) => {
  const [orderIdInput, setOrderIdInput] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const [myEarnings, setMyEarnings] = useState<EarningRecord[]>(() => {
    const saved = localStorage.getItem('userEarnings');
    return saved ? JSON.parse(saved) : [];
  });
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('userEarnings', JSON.stringify(myEarnings));
  }, [myEarnings]);

  const fetchJobDetails = () => {
    if (!orderIdInput.trim()) return;
    setIsFetching(true);
    setError(null);

    setTimeout(() => {
      const allLeads = [...leads, ...firestoreLeads];
      const job = allLeads.find(l => 
        (l['Order ID'] || (l as any).id || '').toString().toLowerCase().trim() === orderIdInput.toLowerCase().trim()
      );

      if (job) {
        const remark = (job['Internal Remark'] || '').trim().toLowerCase();
        
        if (remark !== 'hired') {
          setError(`Cannot add: Status is "${toTitleCase(remark)}". Please talk to RMN Support for verification.`);
          setIsFetching(false);
          return;
        }

        playTapSound();
        const amount = parseInt((job.Fee || (job as any)['Fee/Month'] || '0').toString().replace(/[^0-9]/g, '')) || 0;
        const classGroup = job.Class || job['Class / Board'] || (job as any).class || 'General';
        
        const locationStr = (job.Locations || job.City || (job as any).Area || 'India').toString();
        const cityPart = job.City || 'India';
        const localityPart = locationStr.split(/[;,]/)[0].trim().split('-')[0].trim();
        const displayLocation = (localityPart && localityPart.toLowerCase() !== cityPart.toLowerCase()) 
          ? `${toTitleCase(localityPart)}, ${toTitleCase(cityPart)}` 
          : toTitleCase(cityPart);

        const assignedTutor = (job as any).Assign_Tutor || (job as any).Tutor_s_Name || (job as any).assignedTutor || (job as any)['Assigned Tutor'] || (job as any).Tutor || 'N/A';
        const startDate = (job as any).Start_Date || (job as any).Date_of_Start || (job as any)['Start Date'] || (job as any).startDate || (job as any).Date || (job as any).date || (job as any).Start_Time || '';

        if (myEarnings.some(e => e.orderId.toLowerCase() === (job['Order ID'] || orderIdInput).toString().toLowerCase().trim())) {
          setError('Tuition already added.');
        } else {
          const newEarning: EarningRecord = {
            orderId: (job['Order ID'] || orderIdInput).toString().toUpperCase().trim(),
            amount: amount,
            classGroup: classGroup,
            city: displayLocation,
            days: job.days || (job as any).Days || '',
            duration: job.duration || (job as any).Duration || '',
            time: job.time || (job as any).Time || '',
            assignedTutor: assignedTutor,
            startDate: startDate,
            status: 'pending',
            date: new Date().toISOString()
          };
          setMyEarnings([newEarning, ...myEarnings]);
          setOrderIdInput('');
          setShowAddInput(false);
        }
      } else {
        setError('Job ID not found. Verify and try again.');
      }
      setIsFetching(false);
    }, 800);
  };

  const clearAll = () => {
    if (window.confirm('Reset all records?')) {
      setMyEarnings([]);
      localStorage.removeItem('userEarnings');
    }
  };

  const removeEarning = (orderId: string) => {
    playTapSound();
    if (window.confirm('Stop tracking this tuition?')) {
      setMyEarnings(prev => prev.filter(e => e.orderId !== orderId));
    }
  };

  const totalMonthlyIncome = myEarnings.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalTuitions = myEarnings.length;
  
  // FIXED GOAL: 50,000
  const nextGoal = 50000;
  const progress = Math.min((totalMonthlyIncome / nextGoal) * 100, 100);

  const recommendedJobs = [...leads, ...firestoreLeads]
    .filter(l => {
      const jobCity = (l.City || '').toLowerCase();
      const currentCity = (userCity || '').toLowerCase();
      const cityMatch = currentCity === 'all' || jobCity.includes(currentCity) || currentCity.includes(jobCity);
      const notAdded = !myEarnings.some(e => e.orderId === (l['Order ID'] || (l as any).id || '').toString().toUpperCase());
      const isSearching = (l['Internal Remark'] || '').trim().toLowerCase() === 'searching';
      return cityMatch && notAdded && isSearching;
    })
    .slice(0, 3);

  const getPaymentCycle = () => {
    const now = new Date();
    const firstDay = '1st';
    const monthName = now.toLocaleString('en-IN', { month: 'long' });
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const suffix = (n: number) => ["th", "st", "nd", "rd"][(n % 100 > 10 && n % 100 < 20) ? 0 : (n % 10 < 4) ? n % 10 : 0];
    return `${firstDay} ${monthName} - ${getOrdinal(lastDay)} ${monthName}`;
  };

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const getSupportContact = () => {
    const rmnCities = ['ghaziabad', 'faridabad', 'delhi', 'mumbai', 'pune', 'ahmedabad'];
    const currentCity = (userCity || '').toLowerCase().trim();
    if (rmnCities.some(c => currentCity.includes(c))) return { name: 'RMN Support', phone: '9971969197' };
    return { name: 'Kanishka Arora', phone: '9711898248' };
  };

  const handleSupportAction = () => {
    playTapSound();
    window.open(`tel:${getSupportContact().phone}`, '_system');
  };

  // If no records and not adding, show 'Hired Concierge' Landing Page
  if (myEarnings.length === 0 && !showAddInput) {
    return (
      <div className="flex flex-col items-center justify-center p-8 pt-20 space-y-10 max-w-lg mx-auto font-sans min-h-[80vh]">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-32 h-32 bg-[#7A2157]/10 rounded-[40px] flex items-center justify-center relative">
          <div className="absolute inset-0 bg-[#7A2157]/5 animate-ping rounded-[40px]" />
          <Trophy size={60} className="text-[#7A2157] relative z-10" />
        </motion.div>

        <div className="text-center space-y-3">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Are you Hired?</h2>
          <div className="flex items-center justify-center gap-2">
            <Sparkles size={18} className="text-amber-500 fill-amber-500" />
            <p className="text-xl font-extrabold text-[#7A2157] uppercase tracking-tighter">Congratulations! 🎉</p>
          </div>
          <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">We're thrilled to see you succeed. Add your job ID below to start tracking your professional earnings and milestones.</p>
        </div>

        <button onClick={() => { playTapSound(); setShowAddInput(true); }} className="bg-[#7A2157] hover:bg-[#7A2157]/90 text-white px-10 py-5 rounded-[24px] font-black text-sm uppercase tracking-[0.1em] shadow-2xl shadow-[#7A2157]/20 active:scale-95 transition-all flex items-center gap-3">
          <Plus size={20} strokeWidth={4} /> Add My Job
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-5 pb-40 space-y-7 max-w-lg mx-auto font-sans bg-[#FAFBFF]">
      
      {/* ─── PREMIUM HEADER ─── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 bg-[#7A2157] rounded-full" />
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Earnings Hub</h2>
          </div>
          {userName && (
            <div className="flex items-center gap-1.5 px-1">
              <Sparkles size={10} className="text-amber-500 fill-amber-500" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{userName}</span>
            </div>
          )}
        </div>
        {myEarnings.length > 0 && (
          <button onClick={clearAll} className="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors px-2 py-1">Reset All</button>
        )}
      </motion.div>

      {/* ─── DYNAMIC GLOW CARD ─── */}
      <motion.div layout className="bg-slate-900 rounded-[36px] p-8 relative overflow-hidden shadow-[0_20px_50px_rgba(15,23,42,0.3)] group">
        <div className="absolute top-[-20%] right-[-10%] w-[180px] h-[180px] bg-[#7A2157]/20 blur-[60px] rounded-full group-hover:scale-125 transition-transform duration-1000" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[140px] h-[140px] bg-blue-500/20 blur-[50px] rounded-full group-hover:scale-125 transition-transform duration-1000" />
        
        <div className="relative z-10 flex flex-col space-y-8">
           <div className="flex justify-between items-start">
             <div className="space-y-1">
               <p className="text-[11px] font-bold text-white/40 tracking-[0.2em] uppercase">Est. Monthly Income</p>
               <div className="text-5xl font-extrabold text-white tracking-tighter flex items-baseline gap-1">
                 <span className="text-[#7A2157] text-2xl font-black mr-1">₹</span>
                 {formatCurrency(totalMonthlyIncome)}
               </div>
             </div>
             <div className="w-12 h-12 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
               <Wallet className="text-white/80" size={24} />
             </div>
           </div>

           <div className="space-y-2.5">
             <div className="flex justify-between items-center text-[10px] font-bold text-white/40 uppercase tracking-wider">
               <span>Level Progress</span>
               <span className="text-white/60">Goal: ₹{formatCurrency(nextGoal)}</span>
             </div>
             <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: "easeOut" }} className="h-full bg-gradient-to-r from-[#7A2157] via-[#943973] to-blue-500 shadow-[0_0_15px_rgba(122,45,92,0.5)]" />
             </div>
           </div>

           <div className="space-y-2.5 pt-2">
             <div className="bg-white/5 backdrop-blur-md rounded-[22px] px-5 py-3 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase size={14} className="text-[#7A2157]" />
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Active Jobs</span>
                </div>
                <span className="text-[16px] font-extrabold text-white">{totalTuitions}/10</span>
             </div>
             <div className="bg-white/5 backdrop-blur-md rounded-[22px] px-5 py-3 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-orange-400" />
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Cycle Date</span>
                </div>
                <span className="text-[11px] font-extrabold text-white text-right leading-none">{getPaymentCycle()}</span>
             </div>
           </div>
        </div>
      </motion.div>

      {/* ─── ENGAGEMENT MILESTONES ─── */}
      <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
         {totalTuitions >= 1 && (
           <div className="shrink-0 flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-2.5 rounded-2xl">
             <Trophy size={14} className="text-emerald-600" />
             <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-tight">Active Educator</span>
           </div>
         )}
         {totalMonthlyIncome >= 10000 && (
           <div className="shrink-0 flex items-center gap-2 bg-amber-50 border border-amber-100 px-4 py-2.5 rounded-2xl">
             <Zap size={14} className="text-amber-600 fill-amber-500" />
             <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-tight">Pro Earner</span>
           </div>
         )}
         <div className="shrink-0 flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-2.5 rounded-2xl">
           <Target size={14} className="text-indigo-600" />
           <span className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-tight">Level 1</span>
         </div>
      </div>

      {/* ─── EARNINGS LIST ─── */}
      <div className="space-y-5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-slate-400" />
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Tuition History</h3>
          </div>
          <button onClick={() => { playTapSound(); setShowAddInput(!showAddInput); setError(null); }} className="bg-[#7A2157] hover:bg-[#7A2157]/90 text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-lg shadow-[#7A2157]/20 active:scale-95 transition-all flex items-center gap-1.5">{showAddInput ? <X size={12} strokeWidth={4} /> : <Plus size={12} strokeWidth={4} />} Add My Job</button>
        </div>

        <AnimatePresence>
          {showAddInput && (
            <motion.div initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0, y: -10 }} className="overflow-hidden">
              <div className="bg-slate-900 rounded-[28px] p-5 shadow-2xl border border-white/5 space-y-3 mx-1 mb-2">
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-white/30"><Plus size={16} /></div>
                  <input type="text" value={orderIdInput} onChange={(e) => setOrderIdInput(e.target.value)} placeholder="Enter Order ID (e.g. DL12345)" className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-10 pr-12 text-white font-bold placeholder:text-white/20 outline-none focus:border-[#7A2157]/50 transition-all text-sm" />
                  <button onClick={fetchJobDetails} disabled={isFetching || !orderIdInput} className="absolute right-2 w-9 h-9 bg-[#7A2157] text-white rounded-xl flex items-center justify-center active:scale-90 transition-all disabled:opacity-30">{isFetching ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} strokeWidth={3} />}</button>
                </div>
                {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2 text-rose-300 text-[10px] font-bold px-3 leading-tight"><AlertCircle size={12} className="shrink-0 mt-0.5" /><p>{error}</p></motion.div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {myEarnings.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[32px] border-2 border-dashed border-slate-100 p-16 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-[32px] flex items-center justify-center mx-auto"><TrendingUp size={40} /></div>
                <div className="space-y-1">
                  <p className="text-slate-400 text-[12px] font-extrabold uppercase tracking-widest">No Active Tuitions</p>
                  <p className="text-slate-300 text-[10px] font-medium">Add your first job ID above to start tracking.</p>
                </div>
              </motion.div>
            ) : (
              myEarnings.map((earning, i) => {
                const accent = CARD_ACCENTS[i % CARD_ACCENTS.length];
                return (
                  <motion.div key={earning.orderId} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={cn("bg-white p-4 rounded-[24px] border shadow-sm transition-all flex flex-col gap-3 relative overflow-hidden group", accent.border)} style={{ minHeight: '100px' }}>
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1", accent.iconBg)} />
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 border rounded-[16px] flex items-center justify-center shrink-0 font-black text-sm shadow-inner", accent.bg, accent.text, accent.border)}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                           <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[8.2px] font-bold">
                              <span className="text-slate-900 font-black">ID: {earning.orderId}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-[#2D7A53] flex items-center gap-0.5"><MapPin size={8} /> {earning.city}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-600 flex items-center gap-0.5"><Briefcase size={8} /> {toTitleCase(earning.classGroup || (earning as any).subject || 'General')}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-400 flex items-center gap-0.5"><Calendar size={8} /> {earning.startDate || 'N/A'}</span>
                           </div>
                           <button onClick={(e) => { e.stopPropagation(); removeEarning(earning.orderId); }} className="p-1 text-slate-200 hover:text-rose-500 transition-all shrink-0"><Trash2 size={12} /></button>
                        </div>
                        {(earning.duration || earning.days || earning.time) && (
                          <div className="flex flex-wrap items-center gap-x-1.5 mt-1.5 pt-1.5 border-t border-slate-50 text-[8px] font-bold text-slate-500">
                             {earning.duration && <span className="flex items-center gap-1"><Clock size={8} /> {earning.duration}</span>}
                             {earning.days && (<><span className="text-slate-200">•</span><span className="flex items-center gap-1"><Calendar size={8} /> {earning.days}</span></>)}
                             {earning.time && (<><span className="text-slate-200">•</span><span className="flex items-center gap-1"><Clock size={8} /> {earning.time}</span></>)}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className={cn("text-[14px] font-black tracking-tighter leading-none", accent.text)}>₹{formatCurrency(earning.amount)}</div>
                        <span className="text-[7px] font-bold text-slate-300 uppercase tracking-tight block mt-0.5">Monthly</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── EARN MORE: CITY RECOMMENDATIONS ─── */}
      {recommendedJobs.length > 0 && (
        <div className="space-y-5">
           <div className="flex flex-col gap-1 px-1">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-emerald-500 fill-emerald-500" />
                <h3 className="text-[13px] font-extrabold text-slate-900 tracking-tight">Earn More in {userCity || 'Your City'}</h3>
              </div>
              <p className="text-[10px] font-bold text-slate-400">You're only <span className="text-primary">₹{formatCurrency(50000 - totalMonthlyIncome)}</span> away from your ₹50,000 goal! 🚀</p>
           </div>
           <div className="space-y-4">
              {recommendedJobs.map((job) => (
                <motion.div key={job['Order ID'] || (job as any).id} className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-[32px] text-white shadow-xl relative overflow-hidden group">
                  <div className="absolute top-[-10%] right-[-10%] w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                  <div className="relative z-10 flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0 space-y-1.5">
                       <div className="bg-white/10 w-fit px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest text-primary-foreground border border-white/5">{job.Class || 'Premium'}</div>
                       <h4 className="text-[11px] font-extrabold text-white/90 leading-snug line-clamp-2">{job.subjects || 'General Tuition'}</h4>
                       <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400"><MapPin size={10} className="text-emerald-400" /> {job.Locations || job.City}</div>
                    </div>
                    <div className="text-right"><div className="text-[18px] font-black text-emerald-400">₹{formatCurrency(job.Fee || job['Fee/Month'] || 0)}</div><span className="text-[9px] font-bold text-white/30 uppercase tracking-tighter">Monthly Fee</span></div>
                  </div>
                  <button onClick={() => { playTapSound(); setSelectedJob(job); }} className="mt-5 w-full bg-white text-slate-900 py-4 rounded-2xl font-extrabold text-[11px] uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2">View Details <Search size={16} /></button>
                </motion.div>
              ))}
              <button onClick={() => { playTapSound(); window.dispatchEvent(new CustomEvent('navigateToTab', { detail: 'jobs' })); }} className="w-full py-4 text-slate-400 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:text-primary transition-colors">View all jobs in {userCity} <ChevronRight size={14} /></button>
           </div>
        </div>
      )}

      {/* ─── PREMIUM TUTOR PAYMENT SECTION ─── */}
      <div className="space-y-4">
        <div className="px-1 flex items-center gap-2">
           <CreditCard size={14} className="text-[#304B70]" />
           <h3 className="text-[12px] font-extrabold text-slate-900 tracking-tight">One-Time Service Fee</h3>
        </div>
        <div className="bg-gradient-to-br from-[#304B70] to-[#1D2E45] rounded-[32px] p-6 shadow-xl shadow-blue-100 relative overflow-hidden text-white">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full" />
           <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20"><Zap size={20} className="fill-white" /></div>
                 <div><h4 className="text-[14px] font-black tracking-tight">We Earn When You Earn</h4><p className="text-[9px] font-bold text-white/80 uppercase tracking-widest">Fair Transparent Growth</p></div>
              </div>
              <div className="space-y-2 bg-black/10 rounded-2xl p-4 border border-white/5">
                 <p className="text-[11px] font-semibold leading-relaxed">Pay <span className="font-black text-amber-300">50% one-time</span> service fee for your first month. 🤝</p>
                 <div className="h-px bg-white/10 w-full" />
                 <p className="text-[10px] font-medium opacity-90 leading-snug">After 11 months of excellence, a <span className="font-black text-amber-300">25% renewal fee</span> helps us keep supporting your journey. Let's grow together! ❤️🔄</p>
                 <div className="h-px bg-white/10 w-full" />
                 <p className="text-[10px] font-medium opacity-90 leading-snug">We only win when you win. Fee is due only AFTER your first payment. From month 2, you keep 100% of your hard-earned money! 🚀</p>
              </div>
              <button onClick={() => { playTapSound(); window.open("https://zohosecurepay.in/checkout/i9db4wt2-verz1l6gn6ogo/Make-a-secure-payment-now", "_system"); }} className="w-full bg-white text-[#304B70] py-4 rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2">Proceed to Pay <ArrowRight size={18} strokeWidth={3} /></button>
              <div className="flex items-center justify-center gap-2 opacity-60"><ShieldCheck size={12} /><span className="text-[8px] font-black uppercase tracking-widest text-white">100% Encrypted Gateway</span></div>
           </div>
        </div>
      </div>

      {/* ─── PREMIUM SUPPORT CONCIERGE ─── */}
      <div className="space-y-4">
        <div className="px-1 flex items-center gap-2">
           <User size={14} className="text-[#347475]" />
           <h3 className="text-[12px] font-extrabold text-slate-900 tracking-tight">Premium Support Concierge</h3>
        </div>
        <button onClick={handleSupportAction} className="w-full bg-slate-900 rounded-[36px] p-6 flex items-center justify-between group transition-all active:scale-[0.98] shadow-2xl relative overflow-hidden border border-white/5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#347475]/10 blur-3xl rounded-full" />
          <div className="flex flex-col items-start text-left gap-1 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#347475] rounded-[18px] flex items-center justify-center text-white shadow-lg shadow-[#347475]/30"><Phone size={20} /></div>
              <div className="flex flex-col min-w-0">
                 <div className="flex items-center gap-2">
                    <span className="text-[15px] font-black text-white tracking-tight truncate max-w-[120px]">{getSupportContact().name}</span>
                    <div className="bg-emerald-500 w-2 h-2 rounded-full animate-pulse shrink-0" />
                 </div>
                 <p className="text-[9.5px] font-bold text-white/40 leading-none mt-1 whitespace-nowrap">9am to 6pm • Mon to Fri</p>
              </div>
            </div>
          </div>
          <div className="relative z-10 shrink-0"><div className="bg-gradient-to-r from-[#347475] to-[#265354] text-[11px] font-black text-white px-7 py-3.5 rounded-[20px] uppercase tracking-widest shadow-xl shadow-black/40 group-hover:scale-105 transition-all">Call Now</div></div>
        </button>
      </div>
    </div>
  );
};
