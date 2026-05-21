import React, { useEffect, useState, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, forceResetFirestore } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Alert, UserType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Info, AlertTriangle, CheckCircle, Zap, ExternalLink, Clock, X, MessageSquare, Phone, Mail, ChevronRight, Settings, User as UserIcon, CreditCard, Play, Volume2, Instagram, Facebook, Linkedin, Twitter, Calendar, Filter, ChevronDown } from 'lucide-react';
import { cn, getCityPhone, formatCurrency, openWhatsApp } from '../utils';

import { createChat } from '@n8n/chat';
import '@n8n/chat/style.css';

import { CITIES_LIST, CLASSES_LIST } from '../constants';

interface AlertsViewProps {
  city: string;
  userGender?: string | null;
  userClasses?: string[];
  userType?: UserType | null;
  isAdminUser?: boolean;
  onAdminClick?: () => void;
  currentUser?: any;
  showFormModal: boolean;
  setShowFormModal: (show: boolean) => void;
  setUserCity: (city: string) => void;
  setUserGender: (gender: string | null) => void;
  setUserClasses: (classes: string[]) => void;
  setUserType: (type: UserType | null) => void;
  userName?: string | null;
  setUserName: (name: string | null) => void;
  initialTab?: 'feed' | 'support' | 'setup';
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  dbStatus?: string;
  leadsCount?: number;
  authEmail?: string | null;
  isServerData?: boolean;
}

const TAP_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3';
let tapAudio: HTMLAudioElement | null = null;
try {
  tapAudio = new Audio(TAP_SOUND_URL);
  tapAudio.load();
} catch (e) {}

function playTapSound() {
  try {
    if (tapAudio) {
      tapAudio.currentTime = 0;
      tapAudio.volume = 0.4;
      tapAudio.play().catch(() => {});
    }
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }
  } catch {}
}

const DetailItem: React.FC<{ emoji: string; text: string }> = ({ emoji, text }) => {
  if (!text) return null;
  return (
    <div className="flex gap-4 items-start group">
      <span className="text-xl shrink-0 leading-none group-hover:scale-110 transition-transform">{emoji}</span>
      <span className="text-[14px] font-bold text-slate-700 leading-snug">{text}</span>
    </div>
  );
};

const JobAlertCard: React.FC<{ alert: Alert; onHide: () => void }> = ({ alert, onHide }) => {
  const msg = (alert.message || (alert as any).Message || '').toString();
  
  // Extracting data using regex
  const orderId = msg.match(/Order ID:\s*(\d+)/i)?.[1] || msg.match(/ID:\s*(\d+)/i)?.[1] || '';
  const classInfo = msg.match(/📚\s*([^\n]*)/)?.[1] || msg.match(/Class:\s*([^\n]*)/i)?.[1] || '';
  const genderInfo = msg.match(/👩\s*([^\n]*)/)?.[1] || msg.match(/Gender:\s*([^\n]*)/i)?.[1] || '';
  const locationInfo = msg.match(/📍\s*([^\n]*)/)?.[1] || msg.match(/Location:\s*([^\n]*)/i)?.[1] || '';
  const timeInfo = msg.match(/⏰\s*([^\n]*)/)?.[1] || msg.match(/Time:\s*([^\n]*)/i)?.[1] || '';
  const feeInfo = msg.match(/💰\s*([^\n]*)/)?.[1] || msg.match(/Fee:\s*([^\n]*)/i)?.[1] || '';
  const lastDate = msg.match(/⏳\s*Last Date:\s*([^\n]*)/i)?.[1] || '';
  
  const whatsappNumber = '9971969197';
  const encodedText = encodeURIComponent(`Hi, I am interested in Job Order ID: #${orderId}. Please provide more details.`);
  const whatsappLink = `https://wa.me/91${whatsappNumber}?text=${encodedText}`;

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.preventDefault();
    playTapSound();
    openWhatsApp(`Hi, I am interested in Job Order ID: #${orderId}. Please provide more details.`);
  };

  const timestampDate = alert.timestamp?.toDate ? alert.timestamp.toDate() : new Date();
  const isNew = (Date.now() - timestampDate.getTime()) < 24 * 60 * 60 * 1000;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.05)] overflow-hidden relative"
    >
      <div className="p-7 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-xl">📢</div>
            <h3 className="text-[12px] font-black text-rose-500 uppercase tracking-widest leading-tight">
              Tuition Job Alert <span className="mx-1 opacity-30">|</span> Order ID: {orderId}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {isNew && (
              <span className="bg-slate-100 text-slate-500 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                New
              </span>
            )}
            <button onClick={onHide} className="text-slate-300 hover:text-slate-500 transition-colors p-1">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="space-y-4 pt-1">
          <DetailItem emoji="📚" text={classInfo} />
          <DetailItem emoji="👩" text={genderInfo} />
          <DetailItem emoji="📍" text={locationInfo} />
          <DetailItem emoji="⏰" text={timeInfo} />
          <DetailItem emoji="💰" text={feeInfo} />
        </div>

        {/* WhatsApp Button */}
        <a 
          href={`https://wa.me/919971969197?text=${encodeURIComponent(`Hi, I am interested in Job Order ID: #${orderId}. Please provide more details.`)}`}
          target="_system"
          className="w-full bg-[#25D366] hover:bg-[#22c35e] text-white h-[58px] rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.97] shadow-lg shadow-green-100 border-b-4 border-green-600/20"
        >
          <MessageSquare size={18} fill="currentColor" />
          <span className="text-[13px] font-black uppercase tracking-widest">WhatsApp Reply</span>
        </a>

        {/* Footer */}
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-500/80">
              <span className="text-sm">⏳</span>
              <span className="text-[9px] font-black uppercase tracking-widest">Last Date: {lastDate}</span>
            </div>
            <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
              {timestampDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {timestampDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Utility to parse *bold* text in messages
 */
const FormattedMessage: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  
  // Split by * but keep the delimiters to know what was inside
  const parts = text.split(/(\*[^*]+\*)/g);
  
  return (
    <div className="text-[15px] font-bold text-slate-800 leading-snug whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.startsWith('*') && part.endsWith('*')) {
          // Remove the stars and render as extra bold
          return <span key={i} className="font-[900] text-slate-900">{part.slice(1, -1)}</span>;
        }
        return part;
      })}
    </div>
  );
};

const AlertsView: React.FC<AlertsViewProps> = ({ 
  city, userGender, userClasses, userType, 
  isAdminUser, onAdminClick, currentUser, showFormModal, setShowFormModal,
  setUserCity, setUserGender, setUserClasses, setUserType,
  userName, setUserName, initialTab = 'feed',
  alerts, loading, error, dbStatus,
  leadsCount, authEmail, isServerData
}) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'support' | 'setup'>(initialTab);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const domAudioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [hiddenAlertIds, setHiddenAlertIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('hiddenAlertIds');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const hideAlert = (id: string) => {
    try {
      playTapSound();
      const newHidden = [...hiddenAlertIds, id];
      setHiddenAlertIds(newHidden);
      localStorage.setItem('hiddenAlertIds', JSON.stringify(newHidden));
    } catch (e) {}
  };

  const [showAllDebug, setShowAllDebug] = useState(false);
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('all');

  const filterAlertsByDate = (items: Alert[]) => {
    let results = items;

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const yesterdayStart = todayStart - (24 * 60 * 60 * 1000);
      const weekStart = todayStart - (7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      results = results.filter(a => {
        const timestamp = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : (a.timestamp ? new Date(a.timestamp).getTime() : Date.now());
        
        if (dateFilter === 'today') return timestamp >= todayStart;
        if (dateFilter === 'yesterday') return timestamp >= yesterdayStart && timestamp < todayStart;
        if (dateFilter === 'week') return timestamp >= weekStart;
        if (dateFilter === 'month') return timestamp >= monthStart;
        return true;
      });
    }

    return results;
  };

  const filteredAlerts = filterAlertsByDate(alerts);

  const [fcmToken, setFcmToken] = useState(localStorage.getItem('fcmToken') || 'Not Registered');
  const [fcmError, setFcmError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('Checking...');

  useEffect(() => {
    const checkPermission = async () => {
      if ('Notification' in window) {
        setPermissionStatus(Notification.permission);
      }
    };
    checkPermission();

    const handleTokenUpdate = (e: any) => setFcmToken(e.detail);
    const handleError = (e: any) => setFcmError(e.detail);
    window.addEventListener('fcmTokenUpdated', handleTokenUpdate);
    window.addEventListener('fcmRegistrationError', handleError);
    return () => {
      window.removeEventListener('fcmTokenUpdated', handleTokenUpdate);
      window.removeEventListener('fcmRegistrationError', handleError);
    };
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'urgent': return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'broadcast': return <Zap className="w-5 h-5 text-amber-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBg = (type: string) => {
    switch (type) {
      case 'urgent': return 'bg-rose-50 border-rose-200';
      case 'success': return 'bg-emerald-50 border-emerald-200';
      case 'broadcast': return 'bg-amber-50 border-amber-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
  const addLog = (msg: string) => setDebugLogs(prev => [new Date().toLocaleTimeString() + ': ' + msg, ...prev].slice(0, 5));

  const createLocalTestAlert = async () => {
    try {
      addLog('Attempting write...');
      await addDoc(collection(db, 'alerts'), {
        message: '🚀 Local iOS Test Alert ' + new Date().toLocaleTimeString(),
        sender: 'Device Debug',
        type: 'success',
        city: 'All',
        timestamp: serverTimestamp()
      });
      addLog('Write Successful! ✅');
    } catch (e: any) {
      addLog('Write Error: ' + e.message);
    }
  };

  useEffect(() => {
     addLog('AlertsView Initialized');
     addLog('City: ' + city);
     addLog('Alerts count: ' + alerts.length);
     if (loading) addLog('Status: SYNCING...');
     else addLog('Status: READY');
  }, [loading, alerts.length]);

  useEffect(() => {
     const handleTimeout = () => addLog('⚠️ SYNC TIMEOUT (Using Cache)');
     window.addEventListener('dbSyncTimeout', handleTimeout);
     return () => window.removeEventListener('dbSyncTimeout', handleTimeout);
  }, []);

  const manualFetch = async () => {
    try {
      addLog('Manual Fetch started...');
      const q = query(collection(db, 'alerts'), limit(50));
      const snap = await getDocs(q);
      addLog(`Fetch Success: ${snap.size} docs`);
    } catch (e: any) {
      addLog('Fetch Error: ' + e.message);
    }
  };

  return (
    <div className="space-y-4 pb-24 mt-8">
      {/* BUILD 125 DEBUG CONSOLE */}
      <div className="mx-6 p-4 bg-slate-100 rounded-2xl border border-slate-200 text-[9px] font-mono text-slate-500 overflow-hidden">
        <div className="flex justify-between items-center mb-2 gap-2">
          <span className="font-bold uppercase tracking-widest text-[8px] shrink-0">Device Debug</span>
          <button onClick={manualFetch} className="px-2 py-0.5 bg-emerald-500 text-white text-[7px] font-black rounded-full">FETCH</button>
          <button onClick={createLocalTestAlert} className="px-2 py-0.5 bg-indigo-500 text-white text-[7px] font-black rounded-full">WRITE</button>
          <button 
            onClick={() => { if(window.confirm('Reset Firestore Sync?')) forceResetFirestore(); }}
            className="px-2 py-0.5 bg-rose-500 text-white text-[7px] font-black rounded-full"
          >
            RESET
          </button>
          <span className={cn("px-2 py-0.5 rounded-full text-white text-[7px] font-black ml-auto", loading ? "bg-amber-500" : "bg-emerald-500")}>
            {loading ? "SYNC" : "READY"}
          </span>
        </div>
        {debugLogs.map((log, i) => <div key={i} className="truncate opacity-80">{log}</div>)}
      </div>

      <audio ref={domAudioRef} onEnded={() => setIsPlaying(null)} className="hidden" preload="auto" crossOrigin="anonymous" />
      
      {/* Modern Filter Bar */}
      <div className="px-6 mb-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="bg-slate-900 border-slate-900 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-fit shadow-lg">
            <Bell size={12} /> Live Alerts ({filteredAlerts.length})
          </div>
          
          <div className="flex items-center gap-3">
            {loading && (
              <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
                <Settings size={10} className="animate-spin" /> Syncing...
              </div>
            )}
          </div>
        </div>

        {/* Date Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar -mx-6 px-6">
          {[
            { id: 'all', label: 'All Alerts' },
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => { playTapSound(); setDateFilter(f.id as any); }}
              className={cn(
                "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2",
                dateFilter === f.id 
                  ? "bg-primary border-primary text-white shadow-lg scale-105" 
                  : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 space-y-4">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-[24px] text-rose-500">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Network Error</span>
            </div>
            <p className="text-[11px] font-bold leading-relaxed opacity-80">{error}</p>
          </div>
        )}

        {/* Removed: Project Config Diagnostic block */}
        
        {alerts.length > 0 && filteredAlerts.length === 0 && (
          <div className="p-6 text-center space-y-4 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
             <div className="text-3xl">🔍</div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
               No alerts found for this {dateFilter === 'all' ? 'area' : 'period'}.<br/>
               {showAllDebug ? 'Try changing filters.' : 'Try setting "Global Feed" or changing date.'}
             </p>
             <button 
               onClick={() => { setDateFilter('all'); setShowAllDebug(true); }}
               className="bg-white border-2 border-slate-100 px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 active:scale-95 transition-all"
             >
               Reset Filters
             </button>
          </div>
        )}

        <AnimatePresence mode="wait">
            <motion.div 
              key="feed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {filteredAlerts.length === 0 ? (
                <div className="py-20 text-center space-y-4 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                  <div className="text-4xl">📡</div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">No signals detected in {city || 'your area'}.</p>
                </div>
              ) : 
                filteredAlerts.filter(a => !hiddenAlertIds.includes(a.id)).map((alert) => {
                  const msg = (alert.message || (alert as any).Message || '').toString();
                  const isJobAlert = msg.includes('📢') || msg.toLowerCase().includes('tuition job alert');
                  
                  if (isJobAlert) {
                    return <JobAlertCard key={alert.id} alert={alert} onHide={() => hideAlert(alert.id)} />;
                  }

                  return (
                    <div key={alert.id} className={cn("p-6 rounded-[32px] border-2 shadow-sm relative transition-all hover:scale-[1.01]", getBg(alert.type))}>
                      <div className="flex gap-4">
                        <div className="shrink-0 w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">{getIcon(alert.type)}</div>
                        <div className="flex-1">
                          <div className="font-black text-[10px] uppercase mb-1 tracking-wider text-slate-500">{alert.sender || 'System Broadcast'}</div>
                          <FormattedMessage text={msg} />
                        </div>
                        <button onClick={() => hideAlert(alert.id)} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"><X size={18} /></button>
                      </div>
                    </div>
                  );
                })
              }
            </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AlertsView;
