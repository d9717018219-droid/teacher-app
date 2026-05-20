import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc, query, orderBy, limit } from 'firebase/firestore';
import { db, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Send, Zap, AlertTriangle, Info, CheckCircle, Globe, Trash2 } from 'lucide-react';
import { CITIES_LIST, CLASSES_LIST } from '../constants';

interface AdminPanelProps {
  currentCity: string;
}

// ─── Haptic-like tap sound ──────────────────────────────────────────
const TAP_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3';
function playTapSound() {
  try {
    const a = new Audio(TAP_SOUND_URL);
    a.volume = 0.3; // Subtle volume
    a.play().catch(() => {});
  } catch {}
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentCity }) => {
  const [message, setMessage] = useState('');
  const [targetCity, setTargetCity] = useState(currentCity || 'All');
  const [targetGender, setTargetGender] = useState('Any');
  const [targetClass, setTargetClass] = useState('All');
  const [targetUserType, setTargetUserType] = useState<'parent' | 'teacher' | 'all'>('all');
  const [type, setType] = useState<'urgent' | 'info' | 'success' | 'broadcast'>('info');
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', msg: string } | null>(null);

  const citiesForAdmin = ['All', ...CITIES_LIST];
  const classesForAdmin = ['All', ...CLASSES_LIST];

  const handleTestPush = async () => {
    playTapSound();
    setTesting(true);
    setStatus(null);
    try {
      const sendTest = httpsCallable(functions, 'sendTestNotification');
      const result: any = await sendTest();
      if (result.data?.success) {
        setStatus({ type: 'success', msg: `Sync Success: ${result.data.message}` });
      } else {
        setStatus({ type: 'error', msg: `Sync Failed: ${result.data?.message || 'Unknown error'}` });
      }
    } catch (err: any) {
      console.error('Test push error:', err);
      setStatus({ type: 'error', msg: 'Cloud Function Error: ' + err.message });
    } finally {
      setTesting(false);
    }
  };

  const [emergencySending, setEmergencySending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    playTapSound();
    setSending(true);
    setStatus(null);

    try {
      console.log('AdminPanel: Attempting direct Firestore send...');
      const docRef = await addDoc(collection(db, 'alerts'), {
        message,
        city: targetCity,
        gender: targetGender,
        targetClass: targetClass,
        targetUserType: targetUserType,
        type,
        sender: 'Notification 🔔',
        timestamp: serverTimestamp(),
      });
      console.log('AdminPanel: Successfully sent alert with ID:', docRef.id);
      setMessage('');
      setStatus({ type: 'success', msg: 'Broadcast Deployed Successfully! ✨🚀' });
    } catch (err: any) {
      console.error('AdminPanel: Firestore Send Failed:', err);
      let errorMsg = err.message || 'Check your permissions';
      if (err.code === 'permission-denied') {
        errorMsg = 'Permission Denied: You are not authorized as an Admin.';
      }
      setStatus({ type: 'error', msg: 'Broadcast Failed: ' + errorMsg });
    } finally {
      setSending(false);
    }
  };

  const handleClearAll = async () => {
    playTapSound();
    if (!window.confirm('Are you sure you want to delete ALL broadcast alerts? This cannot be undone.')) return;
    
    setClearing(true);
    setStatus(null);

    try {
      const q = query(collection(db, 'alerts'), limit(150));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setStatus({ type: 'info' as any, msg: 'No alerts found to clear.' });
        return;
      }

      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'alerts', d.id)));
      await Promise.all(deletePromises);
      
      setStatus({ type: 'success', msg: `Successfully cleared ${snapshot.size} alerts.` });
    } catch (err: any) {
      console.error('Clear error:', err);
      setStatus({ type: 'error', msg: 'Failed to clear alerts: ' + (err.message || 'Permission denied') });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-slate-900 rounded-[32px] p-8 text-white">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                <Zap className="text-amber-400" /> Admin Broadcast
            </h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Send targeted alerts to users</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleTestPush}
              disabled={testing}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-900/40 active:scale-95 disabled:opacity-50"
            >
              {testing ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Zap size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Test Sync</span>
                </>
              )}
            </button>
            <button 
              onClick={handleClearAll}
              disabled={clearing}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-all shadow-lg shadow-rose-900/40 active:scale-95 disabled:opacity-50"
            >
            {clearing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Trash2 size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Clear All</span>
              </>
            )}
          </button>
        </div>
      </div>
        
      <div className="mt-8 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target City</label>
                <select 
                    value={targetCity}
                    onChange={(e) => setTargetCity(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary"
                >
                    {citiesForAdmin.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Gender</label>
                <select 
                    value={targetGender}
                    onChange={(e) => setTargetGender(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary"
                >
                    <option value="Any" className="bg-slate-900">Any Gender</option>
                    <option value="Male" className="bg-slate-900">Male Only</option>
                    <option value="Female" className="bg-slate-900">Female Only</option>
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Class</label>
                <select 
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary"
                >
                    {classesForAdmin.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target User Role</label>
                <select 
                    value={targetUserType}
                    onChange={(e) => setTargetUserType(e.target.value as any)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary"
                >
                    <option value="all" className="bg-slate-900">All (Parents & Teachers)</option>
                    <option value="parent" className="bg-slate-900">Parents Only</option>
                    <option value="teacher" className="bg-slate-900">Teachers Only</option>
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alert Level</label>
                <div className="flex gap-2">
                    {[
                        { id: 'info', icon: <Info size={14} />, color: 'text-blue-400' },
                        { id: 'urgent', icon: <AlertTriangle size={14} />, color: 'text-rose-400' },
                        { id: 'broadcast', icon: <Zap size={14} />, color: 'text-amber-400' },
                        { id: 'success', icon: <CheckCircle size={14} />, color: 'text-emerald-400' }
                    ].map(t => (
                        <button 
                            key={t.id}
                            onClick={() => { playTapSound(); setType(t.id as any); }}
                            className={`flex-1 h-10 rounded-xl border flex items-center justify-center transition-all ${type === t.id ? 'bg-white/10 border-white/40 ' + t.color : 'border-white/5 text-slate-600'}`}
                        >
                            {t.icon}
                        </button>
                    ))}
                </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Message Body</label>
            <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your announcement here..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-medium focus:outline-none focus:border-primary min-h-[120px]"
            />
          </div>

          <button 
            onClick={handleSend}
            disabled={sending || !message.trim()}
            className="w-full bg-primary hover:bg-blue-500 disabled:opacity-50 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            {sending ? 'Processing Network...' : <><Send size={16} /> Deploy Broadcast</>}
          </button>

          {status && (
              <div className={`p-4 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {status.msg}
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
