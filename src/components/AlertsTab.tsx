import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Trash2, Clock, CheckCircle2, MessageSquare, ChevronRight, X, Inbox, Sparkles, Zap, AlertTriangle, Info } from 'lucide-react';
import { alertStorage, AppNotification } from '../services/alertStorage';
import { cn } from '../utils';

const AlertsTab: React.FC = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'connecting' | 'online' | 'error' | 'offline'>('connecting');
  const [lastUpdate, setLastUpdate] = useState<string>('Never');
  const [errorLog, setErrorLog] = useState<string | null>(null);

  const mergeAndSort = useCallback(async (broadcasts: AppNotification[]) => {
    const pushHistory = await alertStorage.getNotifications();
    const merged = [...pushHistory, ...broadcasts].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // De-duplicate by ID
    const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
    setNotifications(unique);
    setLastUpdate(new Date().toLocaleTimeString());
    setLoading(false);
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const qBroadcasts = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'), limit(30));
      const snap = await getDocs(qBroadcasts);
      const broadcasts = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.sender || 'System Broadcast',
          body: data.message,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
          read: false,
          type: data.type || 'info'
        } as AppNotification;
      });
      mergeAndSort(broadcasts);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setLoading(false);
    }
  }, [mergeAndSort]);

  useEffect(() => {
    setDbStatus('connecting');
    setErrorLog(null);

    // 1. Listen for Global Broadcasts (Firestore)
    const qBroadcasts = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'), limit(30));
    const unsubFirestore = onSnapshot(qBroadcasts, (snapshot) => {
      console.log("AlertsTab: Firestore snapshot received, docs:", snapshot.size);
      
      const broadcasts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.sender || 'System Broadcast',
          body: data.message,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
          read: false,
          type: data.type || 'info'
        } as AppNotification;
      });
      
      setDbStatus('online');
      mergeAndSort(broadcasts);
    }, (err) => {
      console.error("AlertsTab: Firestore listener failed:", err);
      setDbStatus('error');
      setErrorLog(err.message);
      setLoading(false);
    });

    // 2. Listen for Local Push Updates
    const handleLocalUpdate = () => {
       // We don't have the firestore list here easily, so we just trigger a refresh
       // But mergeAndSort will be called by firestore unsub next time it changes.
       // For now, let's just re-fetch everything if a push arrives.
       getDocs(qBroadcasts).then(snap => {
          const currentBroadcasts = snap.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.sender || 'System Broadcast',
              body: data.message,
              timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
              read: false,
              type: data.type || 'info'
            } as AppNotification;
          });
          mergeAndSort(currentBroadcasts);
       });
    };
    
    window.addEventListener('app:history_updated', handleLocalUpdate);

    return () => {
      unsubFirestore();
      window.removeEventListener('app:history_updated', handleLocalUpdate);
    };
  }, [mergeAndSort]);

  const handleMarkAsRead = async (id: string) => {
    // Only local push notifications can be marked as read in storage
    await alertStorage.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleClearAll = async () => {
    if (window.confirm('Clear your local notification history? (Global broadcasts will remain)')) {
      await alertStorage.clearAll();
      loadNotifications();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'urgent': return <AlertTriangle size={20} />;
      case 'success': return <CheckCircle2 size={20} />;
      case 'broadcast': return <Zap size={20} />;
      default: return <Bell size={20} />;
    }
  };

  const getAccentColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'success': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'broadcast': return 'text-amber-600 bg-amber-50 border-amber-100';
      default: return 'text-indigo-600 bg-indigo-50 border-indigo-100';
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      {/* Header Section */}
      <div className="px-6 pt-8 pb-6 bg-white border-b border-slate-100 rounded-b-[40px] shadow-sm shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <Bell size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[24px] font-[1000] text-slate-900 tracking-tighter uppercase leading-none">Alerts</h2>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  dbStatus === 'online' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : 
                  dbStatus === 'connecting' ? "bg-amber-400 animate-pulse" : "bg-rose-500"
                )} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                {dbStatus === 'online' ? 'Live System Connected' : 
                 dbStatus === 'connecting' ? 'Synchronizing Network...' : 'Connection Interrupted'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => window.location.reload()}
              className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 active:scale-90 transition-all border border-indigo-100"
            >
              <Zap size={20} className={loading ? "animate-spin" : ""} />
            </button>
            {notifications.length > 0 && (
              <button 
                onClick={handleClearAll}
                className="p-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 active:scale-90 transition-all"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Stats Chips */}
        <div className="flex gap-2 mt-4 items-center">
           <div className="bg-slate-100 px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{notifications.length} Total</span>
           </div>
           <div className="text-[8px] font-bold text-slate-300 uppercase tracking-widest ml-auto">
             Synced: {lastUpdate}
           </div>
        </div>
      </div>

      {/* List Section */}
      <div className="flex-1 px-6 pt-6 pb-32">
        {/* Connection Error Message */}
        {errorLog && (
           <div className="mb-6 p-4 bg-rose-950 rounded-3xl border border-rose-500/20 text-rose-200">
              <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-tighter">
                <AlertTriangle size={14} /> Network Connectivity Error
              </div>
              <p className="font-mono text-[9px] break-all bg-black/40 p-2 rounded-xl border border-white/5">
                {errorLog}
              </p>
           </div>
        )}

        {loading && notifications.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syncing Inbox...</p>
          </div>
        ) : notifications.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-20 text-center space-y-6 bg-white rounded-[40px] border border-slate-100 border-dashed"
          >
            <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto text-slate-200">
              <Inbox size={48} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-[900] text-slate-900 uppercase tracking-tighter">Inbox is Empty</h3>
              <p className="text-[11px] text-slate-500 font-bold max-w-[200px] mx-auto leading-relaxed">
                New tuition jobs and updates will appear here as soon as they arrive.
              </p>
            </div>
            <button 
              onClick={loadNotifications}
              className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-xl"
            >
              Refresh Inbox
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {notifications.map((n, idx) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleMarkAsRead(n.id)}
                  className={cn(
                    "relative p-6 rounded-[32px] border transition-all active:scale-[0.98] group overflow-hidden",
                    n.read 
                      ? "bg-white border-slate-100 opacity-80" 
                      : "bg-white border-indigo-100 shadow-xl shadow-indigo-500/5 ring-1 ring-indigo-50"
                  )}
                >
                  {/* Unread Glow */}
                  {!n.read && (
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600" />
                  )}

                  <div className="flex gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-colors border",
                      n.read ? "bg-slate-100 text-slate-400 border-slate-200" : getAccentColor((n as any).type || 'info')
                    )}>
                      {getIcon((n as any).type || 'info')}
                    </div>
                    
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={cn(
                          "text-[15px] leading-tight break-words",
                          n.read ? "font-bold text-slate-700" : "font-[900] text-slate-900"
                        )}>
                          {n.title}
                        </h4>
                        <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-tighter whitespace-nowrap pt-1">
                          <Clock size={10} /> {getTimeAgo(n.timestamp)}
                        </div>
                      </div>
                      
                      <p className={cn(
                        "text-[13px] leading-relaxed line-clamp-3",
                        n.read ? "text-slate-500 font-medium" : "text-slate-600 font-bold"
                      )}>
                        {n.body}
                      </p>

                      {/* Action Hint */}
                      {!n.read && (
                        <div className="flex items-center gap-1.5 pt-3 text-[9px] font-black text-indigo-600 uppercase tracking-[0.15em]">
                          New Message <ChevronRight size={10} />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] pt-8">
              End of Notifications
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsTab;
