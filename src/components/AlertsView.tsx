import React, { useEffect, useState, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Alert, UserType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Info, AlertTriangle, CheckCircle, Zap, X, MessageSquare } from 'lucide-react';
import { cn, openWhatsApp } from '../utils';

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
  const orderId = msg.match(/Order ID:\s*(\d+)/i)?.[1] || msg.match(/ID:\s*(\d+)/i)?.[1] || '';
  const classInfo = msg.match(/📚\s*([^\n]*)/)?.[1] || msg.match(/Class:\s*([^\n]*)/i)?.[1] || '';
  const genderInfo = msg.match(/👩\s*([^\n]*)/)?.[1] || msg.match(/Gender:\s*([^\n]*)/i)?.[1] || '';
  const locationInfo = msg.match(/📍\s*([^\n]*)/)?.[1] || msg.match(/Location:\s*([^\n]*)/i)?.[1] || '';
  const timeInfo = msg.match(/⏰\s*([^\n]*)/)?.[1] || msg.match(/Time:\s*([^\n]*)/i)?.[1] || '';
  const feeInfo = msg.match(/💰\s*([^\n]*)/)?.[1] || msg.match(/Fee:\s*([^\n]*)/i)?.[1] || '';
  const lastDate = msg.match(/⏳\s*Last Date:\s*([^\n]*)/i)?.[1] || '';
  
  const timestampDate = alert.timestamp?.toDate ? alert.timestamp.toDate() : (alert.timestamp ? new Date(alert.timestamp) : new Date());
  const isNew = (Date.now() - timestampDate.getTime()) < 24 * 60 * 60 * 1000;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.05)] overflow-hidden relative"
    >
      <div className="p-7 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-xl">📢</div>
            <h3 className="text-[12px] font-black text-rose-500 uppercase tracking-widest leading-tight">
              Tuition Job Alert <span className="mx-1 opacity-30">|</span> Order ID: {orderId}
            </h3>
          </div>
          <button onClick={onHide} className="text-slate-300 hover:text-slate-500 transition-colors p-1"><X size={16} /></button>
        </div>
        <div className="space-y-4 pt-1">
          <DetailItem emoji="📚" text={classInfo} />
          <DetailItem emoji="👩" text={genderInfo} />
          <DetailItem emoji="📍" text={locationInfo} />
          <DetailItem emoji="⏰" text={timeInfo} />
          <DetailItem emoji="💰" text={feeInfo} />
        </div>
        <button 
          onClick={() => openWhatsApp(`Hi, I am interested in Job Order ID: #${orderId}. Please provide more details.`)}
          className="w-full bg-[#25D366] text-white h-[58px] rounded-2xl flex items-center justify-center gap-3 active:scale-[0.97] shadow-lg"
        >
          <MessageSquare size={18} fill="currentColor" />
          <span className="text-[13px] font-black uppercase tracking-widest">WhatsApp Reply</span>
        </button>
        <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
          {timestampDate.toLocaleDateString('en-IN')} • {timestampDate.toLocaleTimeString('en-IN')}
        </div>
      </div>
    </motion.div>
  );
};

const AlertsView: React.FC<AlertsViewProps> = ({ 
  city, alerts, loading, error 
}) => {
  const [hiddenAlertIds, setHiddenAlertIds] = useState<string[]>([]);
  const hideAlert = (id: string) => setHiddenAlertIds(prev => [...prev, id]);

  const filteredAlerts = alerts.filter(a => {
     if (hiddenAlertIds.includes(a.id)) return false;
     const alertCity = (a.city || (a as any).City || 'All').toLowerCase();
     const userCity = (city || 'all').toLowerCase();
     return userCity === 'all' || alertCity === 'all' || alertCity === userCity;
  });

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
    <div className="px-6 space-y-4 pb-24 mt-8">
      <div className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-fit">
        <Bell size={12} /> Live Alerts ({filteredAlerts.length})
      </div>

      {loading && (
        <div className="py-20 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
           Updating Network...
        </div>
      )}

      {error && <div className="p-4 bg-rose-50 text-rose-500 rounded-2xl text-xs font-bold">{error}</div>}

      <AnimatePresence>
        <div className="space-y-4">
          {filteredAlerts.length === 0 && !loading && (
            <div className="py-20 text-center bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
              <div className="text-4xl mb-2">📡</div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No signals detected in {city || 'your area'}.</p>
            </div>
          )}
          {filteredAlerts.map((alert) => {
            const msg = (alert.message || (alert as any).Message || '').toString();
            if (msg.toLowerCase().includes('job alert')) {
              return <JobAlertCard key={alert.id} alert={alert} onHide={() => hideAlert(alert.id)} />;
            }
            return (
              <motion.div key={alert.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn("p-6 rounded-[32px] border-2 shadow-sm relative", getBg(alert.type))}>
                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 bg-white rounded-2xl flex items-center justify-center">{getIcon(alert.type)}</div>
                  <div className="flex-1">
                    <div className="font-black text-[10px] uppercase mb-1 text-slate-500">{alert.sender || 'System'}</div>
                    <div className="text-[14px] font-bold text-slate-800">{msg}</div>
                  </div>
                  <button onClick={() => hideAlert(alert.id)} className="text-slate-400"><X size={18} /></button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>
    </div>
  );
};

export default AlertsView;
