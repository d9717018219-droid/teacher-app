import React, { useEffect, useState, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db, forceResetFirestore } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Alert, UserType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Info, AlertTriangle, CheckCircle, Zap, ExternalLink, Clock, X, MessageSquare, Phone, Mail, ChevronRight, Settings, User as UserIcon, CreditCard, Play, Volume2, Instagram, Facebook, Linkedin, Twitter, Calendar, Filter, ChevronDown } from 'lucide-react';
import { cn, getCityPhone, formatCurrency, openWhatsApp, formatWhatsAppStyle } from '../utils';

import { createChat } from '@n8n/chat';
import '@n8n/chat/style.css';

import { CITIES_LIST, CLASSES_LIST } from '../constants';

interface AlertsViewProps {
  city: string;
  userGender?: string | null;
  userClasses?: string[];
  userLocalities?: string[];
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
  onRefresh?: () => void;
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

const DetailItem: React.FC<{ emoji: string; label: string; text: string }> = ({ emoji, label, text }) => {
  if (!text) return null;
  return (
    <div className="bg-white rounded-[16px] p-3 border border-slate-100 shadow-sm flex items-center gap-3 transition-all">
      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl shrink-0">
        {emoji}
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-0.5">{label}</span>
        <span className="text-[12px] font-bold text-slate-800 leading-snug whitespace-normal break-words">{text.replace(/\*/g, '')}</span>
      </div>
    </div>
  );
};

const JobAlertCard: React.FC<{ alert: Alert; onHide: () => void }> = ({ alert, onHide }) => {
  const msg = (alert.message || (alert as any).Message || '').toString();
  
  // ─── ROBUST MAPPING LOGIC ───
  const orderIdMatch = msg.match(/(?:Order ID|ID):\s*([0-9]+)/i);
  const orderId = orderIdMatch ? orderIdMatch[1] : '';
  
  const classPart = msg.match(/📚\s*([^-–\n]+)/)?.[1]?.trim() || '';
  const subjectsPart = msg.match(/[–-]\s*([^\n]+)/)?.[1]?.trim() || '';
  const classInfo = subjectsPart ? `${classPart} – ${subjectsPart}` : classPart;
  
  const genderMatch = msg.match(/(?:👩|👩‍🏫|👨‍🏫|👤)\s*([^\n]+?)\s*Tutor Required/i);
  const genderInfo = (genderMatch && genderMatch[1]) ? genderMatch[1].trim() : (msg.match(/([^\n]+?)\s*Tutor Required/i)?.[1]?.trim() || 'Any');

  const locationInfo = msg.match(/📍\s*([^\n]+)/)?.[1]?.trim() || '';
  const scheduleInfo = msg.match(/⏰\s*([^\n]+)/)?.[1]?.trim() || '';
  
  const feeMatch = msg.match(/💰\s*₹?([0-9,]+)/);
  const feeInfo = feeMatch ? feeMatch[1] : '';

  const lastDate = msg.match(/Last Date:\s*([^\n]+)/i)?.[1]?.trim() || '';

  const handleApplyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    playTapSound();
    openWhatsApp(`Hi, I am interested in Job Order ID: #${orderId || 'N/A'}. Please provide more details.`);
  };

  const timestampDate = alert.timestamp?.toDate ? alert.timestamp.toDate() : new Date();
  const isNew = (Date.now() - timestampDate.getTime()) < 24 * 60 * 60 * 1000;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden relative w-full mb-3"
    >
      {/* Premium Header */}
      <div className="bg-[#1E293B] p-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-2xl rounded-full" />
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-2xl shrink-0">
              {msg.includes('🚨') ? '🚨' : '📢'}
            </div>
            <div className="flex flex-col">
              <h3 className="text-[14px] font-black text-white uppercase tracking-wider mb-1">Tuition Job Alert</h3>
              <div className="text-[12px] font-bold text-slate-400">
                Order ID: <span className="text-[#FFD166]">{orderId || 'PENDING'}</span>
                {isNew && (
                  <span className="ml-3 bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                    Live
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onHide} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl text-white/60">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-2.5">
          <DetailItem emoji="📚" label="Class & Subjects" text={classInfo} />
          <DetailItem emoji="👤" label="Gender Pref." text={genderInfo} />
          <DetailItem emoji="📍" label="Location" text={locationInfo} />
          <DetailItem emoji="⏰" label="Schedule" text={scheduleInfo} />
        </div>

        {/* Fee Highlight */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group overflow-hidden relative mt-1">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl text-emerald-600 shrink-0 font-black">₹</div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-0.5">Monthly Tuition Fee</span>
                <span className="text-[18px] font-black text-slate-900 tracking-tighter leading-none">₹{feeInfo}/month</span>
              </div>
           </div>
           <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight border border-emerald-100/50">Verified</div>
        </div>

        {/* Action Button */}
        <button 
          onClick={handleApplyClick}
          className="w-full bg-[#25D366] hover:bg-[#22c35e] text-white h-[58px] rounded-[20px] flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-green-100 border-b-4 border-green-700/30 mt-2"
        >
          <MessageSquare size={20} fill="currentColor" />
          <div className="flex flex-col items-start">
            <span className="text-[15px] font-bold tracking-wide leading-none">Apply Now</span>
            <span className="text-[9.5px] font-medium opacity-80 mt-1">Fast response from coordinator</span>
          </div>
        </button>

        {/* Footer */}
        <div className="flex items-center justify-between px-1 pt-3 border-t border-slate-200/40">
           <div className="flex items-center gap-3">
             <div className="text-2xl">⏳</div>
             <div className="flex flex-col">
               <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Deadline</span>
               <span className="text-[11px] font-black text-rose-600 uppercase">{lastDate || 'Asap'}</span>
             </div>
           </div>
           
           <div className="flex flex-col items-end">
             <span className="text-[9px] font-black uppercase text-slate-300 tracking-wider">Signals Detected</span>
             <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400/80 uppercase">
                <Clock size={12} strokeWidth={3} /> {formatWhatsAppStyle(timestampDate)}
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
  city, userGender, userClasses, userLocalities, userType, 
  isAdminUser, onAdminClick, currentUser, showFormModal, setShowFormModal,
  setUserCity, setUserGender, setUserClasses, setUserType,
  userName, setUserName, initialTab = 'feed',
  alerts, loading, error, dbStatus,
  leadsCount, authEmail, isServerData, onRefresh
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
    if (dateFilter === 'all') return items;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    return items.filter(a => {
      const t = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || Date.now());
      if (dateFilter === 'today') return t >= today;
      if (dateFilter === 'yesterday') return t >= yesterday && t < today;
      if (dateFilter === 'week') return t >= lastWeek;
      return true;
    });
  };

  const filterAlertsByTargeting = (items: Alert[]) => {
    const userCityLower = (city || '').toString().toLowerCase().trim();
    const userTypeLower = (userType || '').toString().toLowerCase().trim();
    const userGenderLower = (userGender || '').toString().toLowerCase().trim();
    const uLocs = (userLocalities || []).map(l => l.toLowerCase().trim());

    return items.filter(a => {
      const aData = a as any;
      // 1. City Filter - ABSOLUTE MATCH
      const targetCity = (a.city || aData.City || 'All').toString().toLowerCase().trim();
      if (targetCity !== 'all' && userCityLower !== targetCity) {
        console.log(`[Targeting] Rejecting Alert ${a.id}: City mismatch. User: "${userCityLower}", Target: "${targetCity}"`);
        return false;
      }

      // 1.5 Localities Filter - STRICT MATCH
      const targetLocs = (a.localities || aData.Localities || []);
      if (Array.isArray(targetLocs) && targetLocs.length > 0) {
        // If an alert targets specific localities, user MUST be in one of them
        const hasLocMatch = targetLocs.some(l => {
          const tLoc = l.toLowerCase().trim();
          return uLocs.some(uLoc => uLoc === tLoc || uLoc.includes(tLoc) || uLoc.includes(tLoc));
        });

        if (!hasLocMatch) {
          console.log(`[Targeting] Rejecting Alert ${a.id}: Locality mismatch. User Areas: [${uLocs.join(', ')}], Target Areas: [${targetLocs.join(', ')}]`);
          return false;
        }
      }

      // 2. User Type Filter
      const targetUserRole = (a.targetUserType || aData.targetUserType || 'all').toString().toLowerCase().trim();
      if (targetUserRole !== 'all' && userTypeLower && userTypeLower !== targetUserRole) {
        console.log(`[Targeting] Rejecting Alert ${a.id}: Role mismatch. User: "${userTypeLower}", Target: "${targetUserRole}"`);
        return false;
      }

      // 3. Gender Filter
      const targetGender = (a.gender || aData.Gender || 'Any').toString().toLowerCase().trim();
      if (targetGender !== 'any' && userGenderLower && userGenderLower !== targetGender) {
        console.log(`[Targeting] Rejecting Alert ${a.id}: Gender mismatch. User: "${userGenderLower}", Target: "${targetGender}"`);
        return false;
      }

      // 4. Class Filter
      const targetClassStr = (a.targetClass || aData.targetClass || 'All').toString().toLowerCase().trim();
      if (targetClassStr !== 'all' && userClasses && userClasses.length > 0) {
        const matchesClass = userClasses.some(c => {
          const uCls = c.toLowerCase().trim().replace('class ', '');
          const tCls = targetClassStr.toLowerCase().trim().replace('class ', '');
          return tCls.includes(uCls) || uCls.includes(tCls);
        });
        if (!matchesClass) {
          console.log(`[Targeting] Rejecting Alert ${a.id}: Class mismatch. User Classes: [${userClasses.join(', ')}], Target: "${targetClassStr}"`);
          return false;
        }
      }

      return true;
    });
  };

  const filteredAlerts = filterAlertsByDate(filterAlertsByTargeting(alerts));

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

  return (
    <div className="space-y-4 pb-24 mt-8">
      <audio ref={domAudioRef} onEnded={() => setIsPlaying(null)} className="hidden" preload="auto" crossOrigin="anonymous" />
      
      {/* Modern Filter Bar */}
      <div className="px-6 mb-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="bg-slate-900 border-slate-900 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-fit shadow-lg">
            <Bell size={12} /> Live Alerts ({filteredAlerts.length})
          </div>
          
          <div className="flex items-center gap-3">
            {onRefresh && (
              <button 
                onClick={() => { playTapSound(); onRefresh(); }}
                className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md"
              >
                Refresh
              </button>
            )}
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
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'week', label: 'This Week' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => { playTapSound(); setDateFilter(f.id as any); }}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[8.5px] font-black uppercase tracking-tight whitespace-nowrap transition-all border-2",
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
                  const isJobAlert = msg.includes('📢') || msg.includes('🚨') || msg.toLowerCase().includes('tuition job alert');
                  const timestampDate = alert.timestamp?.toDate ? alert.timestamp.toDate() : new Date(alert.timestamp || Date.now());
                  
                  if (isJobAlert) {
                    return <JobAlertCard key={alert.id} alert={alert} onHide={() => hideAlert(alert.id)} />;
                  }

                  return (
                    <div key={alert.id} className={cn("p-6 rounded-[32px] border-2 shadow-sm relative transition-all hover:scale-[1.01]", getBg(alert.type))}>
                      {/* Diagnostic Overlay (Visible to All during Debug) */}
                      <div className="mb-4 p-2 bg-slate-900 rounded-xl text-[8px] font-mono text-slate-300 grid grid-cols-2 gap-2">
                        <div><span className="text-amber-400">Target City:</span> {alert.city || 'All'}</div>
                        <div><span className="text-amber-400">Target Role:</span> {alert.targetUserType || 'All'}</div>
                        <div className="col-span-2"><span className="text-amber-400">Target Locs:</span> {JSON.stringify(alert.localities || [])}</div>
                      </div>

                      <div className="flex gap-4">
                        <div className="shrink-0 w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">{getIcon(alert.type)}</div>
                        <div className="flex-1">
                          <div className="font-black text-[10px] uppercase mb-1 tracking-wider text-slate-500">{alert.sender || 'System Broadcast'}</div>
                          <FormattedMessage text={msg} />
                          
                          {/* WhatsApp Style Timestamp */}
                          <div className="mt-3 flex items-center gap-1.5 text-[9px] font-bold text-slate-400/60 uppercase tracking-tighter">
                            <Clock size={10} strokeWidth={3} />
                            {formatWhatsAppStyle(timestampDate)} • {timestampDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </div>
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
