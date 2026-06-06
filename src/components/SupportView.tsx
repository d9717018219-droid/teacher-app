import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Wallet, 
  User, 
  ClipboardList, 
  Phone, 
  Mail, 
  HelpCircle, 
  ChevronRight, 
  Bot,
  MessageCircle, 
  Sparkles, 
  Briefcase, 
  Heart, 
  FileText,
  Clock,
  ArrowRight,
  Bell,
  CheckCircle,
  ShieldCheck,
  Zap,
  Check,
  Star,
  Globe,
  Headphones,
  Info,
  ChevronDown
} from 'lucide-react';
import { createChat } from '@n8n/chat';
import '@n8n/chat/style.css';
import { cn } from '../utils';

interface SupportViewProps {
  userName?: string | null;
  userType?: string | null;
  userCity?: string | null;
  userPhone?: string | null;
}

const SupportView: React.FC<SupportViewProps> = ({ 
  userName, 
  userType, 
  userCity,
  userPhone
}) => {
  const chatInstanceRef = useRef<any>(null);
  const mountNodeRef = useRef<HTMLDivElement | null>(null);
  const faqSectionRef = useRef<HTMLDivElement | null>(null);
  const [expandedFaq, setExpandedExpandedFaq] = useState<number | null>(null);

  // Initialize Chat
  useEffect(() => {
    const cleanup = () => {
      if (chatInstanceRef.current) {
        try {
          if (typeof chatInstanceRef.current.unmount === 'function') chatInstanceRef.current.unmount();
          else if (typeof chatInstanceRef.current.destroy === 'function') chatInstanceRef.current.destroy();
        } catch (e) {}
        chatInstanceRef.current = null;
      }
    };

    if (mountNodeRef.current && !chatInstanceRef.current) {
      try {
        const chatInstance = createChat({
          target: mountNodeRef.current,
          mode: 'fullscreen',
          showWelcomeScreen: false,
          webhookUrl: 'https://n8n.srv1497567.hstgr.cloud/webhook/a468d691-f1fd-4cb8-b259-3aba116f45b7/chat',
          initialMessages: [
            'Hi! 👋 Welcome to DoAble India Support.',
            'How can we help you today? Please type your query below.',
          ],
          i18n: {
            en: { 
              title: '', 
              subtitle: '', 
              footer: '', 
              getStarted: 'Start Chatting', 
              inputPlaceholder: 'Type your message here...', 
            },
          },
        });
        chatInstanceRef.current = chatInstance;
      } catch (error) {
        console.error('Failed to init n8n chat:', error);
      }
    }
    return cleanup;
  }, []);

  const sendToChat = (text: string) => {
    if (chatInstanceRef.current && typeof chatInstanceRef.current.sendMessage === 'function') {
      chatInstanceRef.current.sendMessage(text);
      // Scroll to chat
      const chatElem = document.getElementById('support-chat-section');
      if (chatElem) chatElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const scrollToFaq = (index: number) => {
    setExpandedExpandedFaq(index);
    if (faqSectionRef.current) {
      faqSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCall = () => {
    const city = (userCity || 'Delhi').toLowerCase();
    const group1 = ['ahmedabad', 'mumbai', 'pune', 'jaipur', 'guwahati', 'delhi', 'faridabad', 'ghaziabad', 'changigarh', 'mohali', 'panchkula'];
    const phone = group1.includes(city) ? '9711898248' : '9711738891';
    window.open(`tel:+91${phone}`, '_system');
  };

  const handleWhatsApp = () => {
    const msg = `Hi DoAble India, I am ${userName || 'a User'}.
Phone: ${userPhone || 'N/A'}
City: ${userCity || 'N/A'}
    
Regards,
${userName || 'User'}`;
    window.open(`https://wa.me/919971969197?text=${encodeURIComponent(msg)}`, '_system');
  };

  const handleEmail = () => {
    const subject = `Support Request - ${userName || 'User'}`;
    const body = `Hello DoAble Team,

I need help with:

My Details:
Name: ${userName || 'N/A'}
Phone: ${userPhone || 'N/A'}
City: ${userCity || 'N/A'}`;
    window.open(`mailto:info@doableindia.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_system');
  };

  const faqs = [
    { 
      title: "Terms for Tutors: Earnings & Fees", 
      icon: <Wallet size={16} />,
      color: "bg-emerald-600",
      answer: "DoAble India is transparent: There are ZERO upfront registration fees. We only charge a one-time service fee of 50% from your FIRST month's earnings. From the second month onwards, you keep 100% of your earnings. This ensures we only grow when you earn!"
    },
    { 
      title: "How to build a profile that gets hired?", 
      icon: <User size={16} />,
      color: "bg-indigo-600",
      answer: "Upload a clear professional photo and write a catchy 'About Me'. Tutors with Aadhaar verification and 90%+ profile completion get priority and 5x more leads from our matching system."
    },
    { 
      title: "Terms for Parents: Free Trial Session", 
      icon: <ShieldCheck size={16} />,
      color: "bg-blue-600",
      answer: "We offer one free trial session so you can evaluate the mentor's teaching style before committing. You only proceed and pay if you are satisfied with the trial. Registration is 100% free! If the first mentor isn't a fit, we provide a replacement within 48 hours."
    },
    { 
      title: "Safety & Attendance Tracking", 
      icon: <CheckCircle size={16} />,
      color: "bg-rose-500",
      answer: "Safety is our priority. An adult family member must be present during sessions. Also, daily In/Out logs in the dedicated WhatsApp group are mandatory to ensure accurate billing and prevent disputes."
    },
    { 
      title: "The Verification Process", 
      icon: <ShieldCheck size={16} />,
      color: "bg-slate-700",
      answer: "Our team manually verifies your Identity (Aadhaar/National ID), educational docs, and conducts a multi-stage interview. Once verified, you get a 'Blue Badge' which builds instant trust with parents."
    },
    { 
      title: "Refund & Payment Security", 
      icon: <Zap size={16} />,
      color: "bg-amber-500",
      answer: "The first month's fee acts as a security wall. If a tutor leaves, your balance is 100% safe and transferable. You can review full terms at doableindia.com/terms-and-conditions/"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="min-h-screen bg-[#FDFDFF] pb-32 font-sans overflow-x-hidden"
    >
       {/* SECTION 1 – PREMIUM HEADER (Ultra Compact) */}
       <motion.div variants={itemVariants} className="relative h-[100px] bg-gradient-to-r from-[#FF7A18] to-[#FF4F8B] rounded-b-[24px] px-6 text-white shadow-lg overflow-hidden flex items-center">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[80px] rounded-full -mr-24 -mt-24" />
          <div className="relative z-10 text-left">
             <h1 className="text-xl font-[1000] tracking-tighter uppercase leading-none drop-shadow-md">Support Center</h1>
             <p className="text-white/80 text-[9px] font-black mt-1 uppercase tracking-[0.2em] opacity-80">24/7 Smart Assistance</p>
          </div>
          <div className="absolute bottom-[-20px] right-[-10px] opacity-10">
             <HelpCircle size={80} strokeWidth={3} />
          </div>
       </motion.div>

       <div className="px-5 -mt-5 space-y-5 relative z-20">
          {/* SECTION 2 – SEARCH BAR */}
          <motion.div variants={itemVariants} className="relative group shadow-2xl shadow-slate-200/50 rounded-2xl">
             <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <Search size={20} className="text-slate-300 group-focus-within:text-[#FF4F8B] transition-colors" />
             </div>
             <input
                type="text"
                placeholder="Search help articles, payments, jobs..."
                className="w-full h-14 bg-white rounded-2xl pl-14 pr-6 border-none outline-none font-bold text-sm text-slate-700 placeholder:text-slate-200 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-inner"
                onChange={(e) => { if(e.target.value.length > 5) sendToChat(`Tell me about ${e.target.value}`) }}
             />
          </motion.div>

          {/* SECTION 3 – QUICK HELP (Inter-connected) */}
          <motion.div variants={itemVariants} className="space-y-3">
             <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quick Help</h3>
             </div>
             <div className="grid grid-cols-3 gap-2">
                {[
                   { icon: <Briefcase size={16} />, title: 'Find Jobs', faqIdx: 1, color: 'text-orange-500', bg: 'bg-orange-50' },
                   { icon: <Wallet size={16} />, title: 'Payment', faqIdx: 4, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                   { icon: <User size={16} />, title: 'Profile', faqIdx: 0, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                   { icon: <ClipboardList size={16} />, title: 'Status', faqIdx: 2, color: 'text-blue-500', bg: 'bg-blue-50' },
                   { icon: <Headphones size={16} />, title: 'Support', faqIdx: 3, color: 'text-rose-500', bg: 'bg-rose-50' },
                ].map((item, i) => (
                   <motion.div 
                      key={i} 
                      whileTap={{ scale: 0.96 }}
                      onClick={() => scrollToFaq(item.faqIdx)}
                      className="bg-white rounded-2xl p-3 shadow-sm border border-slate-50 flex flex-col items-center text-center gap-2 cursor-pointer active:bg-slate-50 transition-colors"
                   >
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-inner", item.bg, item.color)}>
                         {item.icon}
                      </div>
                      <h4 className="font-bold text-[10px] text-slate-700 leading-tight whitespace-nowrap">{item.title}</h4>
                   </motion.div>
                ))}
             </div>
          </motion.div>

          {/* SECTION 4 – AI ASSISTANT */}
          <motion.div variants={itemVariants} className="bg-gradient-to-br from-[#6C5CE7] to-[#8E7CFF] rounded-[32px] p-6 shadow-2xl shadow-indigo-100 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-1000" />
             <div className="flex items-center gap-5 relative z-10">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-[24px] flex items-center justify-center border border-white/20 shadow-2xl shrink-0">
                   <Bot size={36} className="text-white animate-pulse" />
                </div>
                <div className="flex-1 text-left">
                   <h3 className="text-white font-black text-xl tracking-tight leading-none">AI Smart Assistant</h3>
                   <p className="text-white/80 font-bold text-sm mt-1.5 truncate">Hello {userName || 'Tutor'} 👋</p>
                </div>
             </div>
             <div className="flex gap-2 mt-5 relative z-10 overflow-x-auto scrollbar-hide">
                {['Apply Guide', 'Profile Help', 'Wallet Status'].map((chip) => (
                   <button key={chip} onClick={() => sendToChat(chip)} className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white rounded-xl px-4 py-2 text-[10px] font-bold whitespace-nowrap active:scale-95 transition-all shadow-sm">
                      {chip}
                   </button>
                ))}
             </div>
          </motion.div>

          {/* SECTION 5 – HERO CHAT SECTION */}
          <motion.div variants={itemVariants} id="support-chat-section" className="space-y-4">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Instant Support Chat</h3>
             <div className="bg-white rounded-[40px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] border border-slate-100 overflow-hidden flex flex-col h-[65vh] relative group">
                <div className="absolute top-0 left-0 right-0 z-50 px-7 py-3.5 bg-white/80 backdrop-blur-xl border-b border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="relative">
                         <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                            <Sparkles size={16} className="animate-pulse text-amber-300" />
                         </div>
                         <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[3px] border-white shadow-sm" />
                      </div>
                      <div className="text-left">
                         <h3 className="text-[12px] font-[1000] text-slate-900 uppercase tracking-widest leading-none">Support Bot</h3>
                         <p className="text-[9px] font-bold text-slate-400 uppercase mt-1.5 tracking-tight flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> 24×7 AI Agent
                         </p>
                      </div>
                   </div>
                   <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100/50">
                      <ShieldCheck size={18} />
                   </div>
                </div>
                <div id="support-chat-mount" ref={mountNodeRef} className="flex-1 w-full bg-white relative overflow-hidden pt-[65px]" />
                <style>{`
                   #support-chat-mount { height: 100% !important; }
                   .n8n-chat-container { height: 100% !important; font-family: inherit !important; }
                   .n8n-chat-messages-container { padding: 24px !important; background: #fff !important; }
                   .n8n-chat-input-container { padding: 20px 24px !important; border-top: 1px solid #F8FAFC !important; background: #fff !important; margin-bottom: 5px !important; }
                   .n8n-chat-input { background: #F1F5F9 !important; border-radius: 18px !important; border: 1px solid transparent !important; font-weight: 600 !important; padding: 12px 16px !important; font-size: 13px !important; transition: all 0.3s ease !important; }
                   .n8n-chat-message-bubble { border-radius: 22px !important; padding: 12px 16px !important; font-weight: 500 !important; font-size: 13px !important; line-height: 1.6 !important; max-width: 85% !important; box-shadow: 0 2px 4px rgba(0,0,0,0.02) !important; }
                   .n8n-chat-message-bubble-user { background: #FF4F8B !important; color: white !important; border-bottom-right-radius: 6px !important; }
                   .n8n-chat-message-bubble-bot { background: #F1F5F9 !important; color: #1E293B !important; border-bottom-left-radius: 6px !important; }
                `}</style>
             </div>
          </motion.div>

          {/* SECTION 6 – CONTACT SUPPORT */}
          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2">
             <motion.div whileTap={{ scale: 0.95 }} onClick={handleWhatsApp} className="bg-white rounded-2xl p-3 shadow-sm border border-slate-50 flex flex-col items-center text-center gap-2 cursor-pointer active:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner bg-emerald-50 text-emerald-500"><MessageCircle size={18} /></div>
                <h4 className="font-bold text-[10px] text-slate-700 uppercase tracking-tight">WhatsApp</h4>
             </motion.div>
             <motion.div whileTap={{ scale: 0.95 }} onClick={handleCall} className="bg-white rounded-2xl p-3 shadow-sm border border-slate-50 flex flex-col items-center text-center gap-2 cursor-pointer active:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner bg-indigo-50 text-indigo-500"><Phone size={18} /></div>
                <h4 className="font-bold text-[10px] text-slate-700 uppercase tracking-tight">Call</h4>
             </motion.div>
             <motion.div whileTap={{ scale: 0.95 }} onClick={handleEmail} className="bg-white rounded-2xl p-3 shadow-sm border border-slate-50 flex flex-col items-center text-center gap-2 cursor-pointer active:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner bg-rose-50 text-[#FF4F8B]"><Mail size={18} /></div>
                <h4 className="font-bold text-[10px] text-slate-700 uppercase tracking-tight">Email</h4>
             </motion.div>
          </motion.div>

          {/* SECTION 7 – HELP ARTICLES (Premium Knowledge Base) */}
          <motion.div variants={itemVariants} ref={faqSectionRef} className="bg-white rounded-[36px] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] border border-slate-100 relative">
             <div className="px-8 py-7 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                      <FileText size={18} className="text-white" />
                   </div>
                   <h3 className="font-black text-[13px] text-slate-900 uppercase tracking-[0.2em]">Knowledge Base</h3>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-100 shadow-sm">
                   <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                   <span className="text-[9px] font-[1000] text-slate-500 uppercase tracking-widest">Self Help</span>
                </div>
             </div>
             <div className="divide-y divide-slate-50">
                {faqs.map((item, i) => (
                   <div key={i} className="group">
                      <motion.div 
                         onClick={() => setExpandedExpandedFaq(expandedFaq === i ? null : i)}
                         className="flex items-center justify-between px-8 py-6 cursor-pointer group transition-all active:bg-slate-50"
                      >
                         <div className="flex items-center gap-4 text-left">
                            <div className={cn("w-10 h-10 rounded-[14px] flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110", item.color)}>
                               {item.icon}
                            </div>
                            <span className="font-[900] text-[14px] text-slate-800 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">{item.title}</span>
                         </div>
                         <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300", expandedFaq === i ? "bg-indigo-600 text-white rotate-180 shadow-indigo-200 shadow-lg" : "bg-slate-50 text-slate-300 group-hover:bg-slate-100 group-hover:text-slate-400")}>
                            <ChevronDown size={18} />
                         </div>
                      </motion.div>
                      <AnimatePresence>
                        {expandedFaq === i && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                             <div className="px-8 pb-7 pt-1">
                                <div className="p-6 bg-slate-50 rounded-[28px] border border-slate-100 shadow-inner">
                                   <p className="text-[13px] font-bold text-slate-600 leading-relaxed text-left opacity-90">{item.answer}</p>
                                   <div className="mt-4 flex items-center gap-2">
                                      <button onClick={() => sendToChat(`More info on: ${item.title}`)} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                                         Read Detailed Guide <ArrowRight size={10} />
                                      </button>
                                   </div>
                                </div>
                             </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </div>
                ))}
             </div>
          </motion.div>

          {/* SECTION 8 – TRUST & STATISTICS */}
          <motion.div variants={itemVariants} className="pt-8 pb-10 space-y-10">
             <div className="grid grid-cols-2 gap-3 px-1">
                {[
                   { label: 'Active Tutors', val: '50,000+', icon: <User size={14} />, color: 'text-orange-500', bg: 'bg-orange-50' },
                   { label: 'Cities Covered', val: '109+', icon: <Globe size={14} />, color: 'text-blue-500', bg: 'bg-blue-50' },
                   { label: 'Expert Support', val: '24×7', icon: <Clock size={14} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                   { label: 'Security Core', val: 'Verified', icon: <ShieldCheck size={14} />, color: 'text-[#FF4F8B]', bg: 'bg-rose-50' }
                ].map((stat, i) => (
                   <motion.div variants={itemVariants} key={i} className="bg-white p-4 rounded-3xl border border-slate-50 shadow-lg shadow-slate-100/40 flex items-center gap-3">
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-inner", stat.bg, stat.color)}>{stat.icon}</div>
                      <div className="flex flex-col min-w-0 text-left">
                         <span className="text-[13px] font-[1000] text-slate-900 leading-none">{stat.val}</span>
                         <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-70 truncate">{stat.label}</span>
                      </div>
                   </motion.div>
                ))}
             </div>
             <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-1 text-amber-400 drop-shadow-sm">
                   {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" strokeWidth={0} />)}
                </div>
                <div className="flex flex-col items-center gap-2">
                   <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300 flex items-center justify-center gap-2">
                      <Heart size={12} className="fill-slate-100 stroke-slate-200" /> DoAble India Secure Core
                   </p>
                </div>
             </div>
          </motion.div>
       </div>
    </motion.div>
  );
};

export default SupportView;
