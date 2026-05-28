import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, MessageCircle, ShieldCheck, Clock, Zap, ArrowRight, Loader2, Sparkles, GraduationCap, Briefcase, Globe, Heart, X, MapPin } from 'lucide-react';
import { createChat } from '@n8n/chat';
import '@n8n/chat/style.css';
import { cn } from '../utils';

interface SupportViewProps {
  userName?: string | null;
  userType?: string | null;
  userCity?: string | null;
  jobsCount?: number;
  tutorsCount?: number;
}

const SupportView: React.FC<SupportViewProps> = ({ 
  userName, 
  userType, 
  userCity,
  jobsCount = 0, 
  tutorsCount = 0 
}) => {
  const chatInstanceRef = useRef<any>(null);
  const mountNodeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
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
              closeButtonTooltip: 'Close' 
            },
          },
        });
        chatInstanceRef.current = chatInstance;
        
        // Auto-open if possible
        setTimeout(() => {
          if (chatInstanceRef.current) {
            if (typeof chatInstanceRef.current.open === 'function') chatInstanceRef.current.open();
            else if (typeof chatInstanceRef.current.toggle === 'function') chatInstanceRef.current.toggle(true);
          }
        }, 300);
      } catch (error) {
        console.error('Failed to init n8n chat:', error);
      }
    }

    return () => {
      if (chatInstanceRef.current) {
        try {
          if (typeof chatInstanceRef.current.unmount === 'function') chatInstanceRef.current.unmount();
          else if (typeof chatInstanceRef.current.destroy === 'function') chatInstanceRef.current.destroy();
        } catch (e) {
          console.warn('Error during chat cleanup:', e);
        }
        chatInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col p-4 space-y-4">
      <div className="flex flex-col gap-1 shrink-0 px-1">
        <h2 className="text-2xl font-[1000] text-slate-900 tracking-tighter leading-none">Help & Support</h2>
        <p className="text-slate-500 text-[10px] font-medium tracking-tight">Our AI assistant is here to help you 24/7.</p>
      </div>

      {/* ─── SOLID CHAT INTERFACE ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[32px] border border-slate-100 shadow-2xl overflow-hidden flex-1 flex flex-col relative h-[65vh]"
      >
        <div className="sticky top-0 z-[200] px-5 py-3 bg-[#347475] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center text-white">
              <Sparkles size={14} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[9px] font-black tracking-widest text-white uppercase leading-none">AI Support Bot</h3>
              <div className="flex items-center gap-1.5 mt-1">
                 <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                 <p className="text-[7.5px] font-bold text-emerald-400 uppercase tracking-tighter">Online</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 px-2 py-1 rounded-md border border-white/10">
             <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">v4.2</p>
          </div>
        </div>

        <div 
          id="support-chat-mount" 
          ref={mountNodeRef}
          className="flex-1 w-full bg-white relative overflow-hidden h-full" 
        />
        
        {/* Universal CSS Fix for n8n chat input visibility */}
        <style>{`
          /* Force the container to take full height of the parent */
          #support-chat-mount, 
          #support-chat-mount > div {
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
          }

          /* Force messages to scroll and input to stay at bottom */
          .n8n-chat-container, 
          [class*="chat-container"] {
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            position: relative !important;
          }

          .n8n-chat-messages-container, 
          [class*="messages-container"] {
            flex: 1 1 auto !important;
            overflow-y: auto !important;
            padding-bottom: 70px !important; /* Space for input */
          }

          .n8n-chat-input-container, 
          [class*="input-container"] {
            position: absolute !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            background: white !important;
            border-top: 2px solid #f1f5f9 !important;
            padding: 10px !important;
            z-index: 9999 !important;
          }

          /* Ensure input box itself is visible */
          .n8n-chat-input, 
          [class*="chat-input"] {
            background: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 12px !important;
          }
        `}</style>
      </motion.div>

      <div className="text-center opacity-10 shrink-0 pb-20">
        <p className="text-[7px] font-black uppercase tracking-[0.4em] text-slate-900 flex items-center justify-center gap-2">
           <Heart size={8} className="text-primary fill-primary" /> DoAble India Secure Core
        </p>
      </div>
    </div>
  );
};

export default SupportView;
