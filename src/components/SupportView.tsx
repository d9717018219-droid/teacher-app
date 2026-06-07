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
  ChevronDown,
  Home as HomeIcon
} from 'lucide-react';
import { createChat } from '@n8n/chat';
import '@n8n/chat/style.css';
import { cn } from '../utils';

interface SupportViewProps {
  userName?: string | null;
  userFirstName?: string | null;
  userType?: string | null;
  userCity?: string | null;
  userPhone?: string | null;
}

const SupportView: React.FC<SupportViewProps> = ({ 
  userName, 
  userFirstName,
  userType, 
  userCity,
  userPhone
}) => {
  const chatInstanceRef = useRef<any>(null);
  const mountNodeRef = useRef<HTMLDivElement | null>(null);

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
              closeButtonTooltip: 'Close',
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
      const chatElem = document.getElementById('support-chat-section');
      if (chatElem) chatElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const scrollToChat = () => {
    const chatElem = document.getElementById('support-chat-section');
    if (chatElem) chatElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
       {/* SECTION 1 – PREMIUM HEADER (Compact & Mixed Case) */}
       <motion.div variants={itemVariants} className="relative h-[80px] px-6 text-slate-900 flex items-center">
          <div className="relative z-10 text-left">
             <h1 className="text-lg font-[900] tracking-tight leading-none">Support Center</h1>
             <p className="text-slate-400 text-[8.5px] font-bold mt-1 uppercase tracking-wider opacity-70">24/7 Smart Assistance</p>
          </div>
          <div className="absolute bottom-[-10px] right-[-5px] opacity-5">
             <HelpCircle size={60} strokeWidth={3} className="text-slate-900" />
          </div>
       </motion.div>

       <div className="px-5 space-y-5 relative z-20 -mt-2">
          {/* SECTION 4 – AI ASSISTANT BANNER (WITH MULTILINGUAL TEXT) */}
          <motion.div 
            variants={itemVariants} 
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="bg-[#37345E] rounded-[32px] p-6 shadow-2xl shadow-[#37345E]/20 relative overflow-hidden group border border-white/5"
          >
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-3xl group-hover:scale-110 transition-transform duration-700" />
             <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-10 -mb-10 blur-2xl opacity-10" />
             
             <div className="relative z-10 space-y-4">
                <div className="space-y-1.5">
                   <h3 className="text-white text-[19px] font-[1000] tracking-tight leading-tight">
                      🚀 Let's Scale Your Success, {userFirstName || 'Teacher'}! 💎
                   </h3>
                   <p className="text-white/80 text-[11px] font-bold leading-relaxed max-w-[95%]">
                      Talk to our assistant in <span className="text-indigo-300">Hindi, Bangla, Tamil, Telugu, Marathi</span> or any language! Ask "How it works" or anything about Jobs & Payments.
                   </p>
                </div>
                
                <div className="flex items-center gap-3">
                   <button 
                      onClick={scrollToChat}
                      className="bg-white text-[#37345E] px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all flex items-center gap-2"
                   >
                      Chat with AI <ArrowRight size={13} strokeWidth={3} />
                   </button>
                </div>
             </div>
          </motion.div>

          {/* SECTION 5 – HERO CHAT SECTION (SUPPORT BOT) */}
          <motion.div variants={itemVariants} id="support-chat-section" className="space-y-4">
             <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Instant Support Bot</h3>
             </div>
             <div className="bg-white rounded-[40px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] border border-slate-100 overflow-hidden flex flex-col h-[60vh] relative group">
                <div className="absolute top-0 left-0 right-0 z-50 px-7 py-3.5 bg-white/80 backdrop-blur-xl border-b border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="relative">
                         <div className="w-10 h-10 bg-[#37345E] rounded-2xl flex items-center justify-center text-white shadow-xl">
                            <Sparkles size={16} className="animate-pulse text-amber-300" />
                         </div>
                         <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[3px] border-white shadow-sm" />
                      </div>
                      <div className="text-left">
                         <h3 className="text-[12px] font-[1000] text-slate-900 uppercase tracking-widest leading-none">Support Bot</h3>
                         <p className="text-[9px] font-bold text-slate-400 uppercase mt-1.5 tracking-tight flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Online
                         </p>
                      </div>
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

          {/* SECTION 6 – CONTACT SUPPORT METHODS */}
          <div className="space-y-3">
             <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Direct Contact</h3>
             </div>
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
          </div>

          {/* SECTION 8 – TRUST & STATISTICS (SINGLE ROW REDESIGN) */}
          <motion.div variants={itemVariants} className="pt-6 pb-10 space-y-3">
             <div className="flex items-center justify-between px-1">
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Our Impact</h3>
             </div>
             <div className="grid grid-cols-4 gap-1.5">
                {[
                   { label: 'Total Tutors', val: '10,000+', icon: <User size={12} fill="currentColor" />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                   { label: 'Home Tuition', val: '1-on-1', icon: <HomeIcon size={12} fill="currentColor" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                   { label: 'Active Support', val: '24×7', icon: <Headphones size={12} fill="currentColor" />, color: 'text-rose-600', bg: 'bg-rose-50' },
                   { label: 'Live Cities', val: '109+', icon: <Globe size={12} fill="currentColor" />, color: 'text-blue-600', bg: 'bg-blue-50' }
                ].map((stat, i) => (
                   <motion.div 
                      key={i} 
                      className="bg-white p-2 rounded-[16px] border border-slate-50 shadow-sm flex flex-col items-center text-center gap-1.5 min-w-0"
                   >
                      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm", stat.bg, stat.color)}>
                         {stat.icon}
                      </div>
                      <div className="flex flex-col min-w-0 w-full overflow-hidden">
                         <span className="text-[10px] font-[1000] text-slate-900 leading-none truncate">{stat.val}</span>
                         <span className="text-[6.5px] font-black text-slate-400 uppercase tracking-tighter mt-1 opacity-80 truncate">{stat.label}</span>
                      </div>
                   </motion.div>
                ))}
             </div>
          </motion.div>
       </div>
    </motion.div>
  );
};

export default SupportView;
