import React, { useState, useMemo } from 'react';
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc, query, orderBy, limit } from 'firebase/firestore';
import { db, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Send, Zap, AlertTriangle, Info, CheckCircle, Globe, Trash2, Search, User, Mail, Phone, Hash, Edit3, X, Save, ShieldCheck, Loader2 } from 'lucide-react';
import { CITIES_LIST, CLASSES_LIST } from '../utils/constants';
import { TutorProfile } from '../types';
import { cn, cleanValue, toTitleCase } from '../utils';

interface AdminPanelProps {
  currentCity: string;
  tutors: TutorProfile[];
  playTapSound: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentCity, tutors, playTapSound }) => {
  const [activeTab, setActiveTab] = useState<'broadcast' | 'tutors' | 'reports'>('broadcast');
  
  // Broadcast State
  const [message, setMessage] = useState('');
  const [targetCity, setTargetCity] = useState(currentCity || 'All');
  const [targetGender, setTargetGender] = useState('Any');
  const [targetClass, setTargetClass] = useState('All');
  const [targetUserType, setTargetUserType] = useState<'parent' | 'teacher' | 'all'>('all');
  const [targetTutorId, setTargetTutorId] = useState('');
  const [type, setType] = useState<'urgent' | 'info' | 'success' | 'broadcast'>('info');
  const [template, setTemplate] = useState<'none' | 'booking' | 'job'>('none');
  
  // Professional Fields
  const [orderId, setOrderId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [address, setAddress] = useState('');
  const [subjects, setSubjects] = useState('');
  const [fee, setFee] = useState('');
  const [days, setDays] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [demoTime, setDemoTime] = useState('');

  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', msg: string } | null>(null);

  // Apply Template Logic
  const applyTemplate = (t: 'none' | 'booking' | 'job') => {
    setTemplate(t);
    if (t === 'booking') {
      setType('success');
      setTargetUserType('teacher');
      setMessage(`🎉 Congratulations! You are selected for Demo. \n\n📍 Address: ${address || '[Address]'} \n⏰ Demo Time: ${demoTime || '[Time]'} \n💰 Fee: ${fee || '[Fee]'} \n📅 Days: ${days || '[Days]'} \n⏳ Duration: ${duration || '[Duration]'}`);
    } else if (t === 'job') {
      setType('broadcast');
      setMessage(`📢 New Tuition Job Alert! \n\n📚 Class: ${targetClass} \n📖 Subjects: ${subjects || '[Subjects]'} \n📍 Location: ${targetCity} \n💰 Monthly Fee: ${fee || '[Fee]'} \n⏰ Schedule: ${time || '[Time]'}`);
    } else {
      setMessage('');
    }
  };

  // Update message when fields change if template is active
  React.useEffect(() => {
    if (template === 'booking') {
       setMessage(`🎉 Congratulations! You are selected for Demo. \n\n📍 Address: ${address || '[Address]'} \n⏰ Demo Time: ${demoTime || '[Time]'} \n💰 Fee: ${fee || '[Fee]'} \n📅 Days: ${days || '[Days]'} \n⏳ Duration: ${duration || '[Duration]'}`);
    } else if (template === 'job') {
       setMessage(`📢 New Tuition Job Alert! \n\n📚 Class: ${targetClass} \n📖 Subjects: ${subjects || '[Subjects]'} \n📍 Location: ${targetCity} \n💰 Monthly Fee: ${fee || '[Fee]'} \n⏰ Schedule: ${time || '[Time]'}`);
    }
  }, [address, demoTime, fee, days, duration, subjects, targetClass, targetCity, template]);

  // Tutor Management State
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTutor, setEditingTutor] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Reports State
  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  React.useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    }
  }, [activeTab]);

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const q = query(collection(db, 'reports'), orderBy('timestamp', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setReports(docs);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleResolveReport = async (reportId: string) => {
    playTapSound();
    if (!window.confirm('Mark this report as resolved?')) return;
    try {
      await deleteDoc(doc(db, 'reports', reportId));
      setReports(reports.filter(r => r.id !== reportId));
    } catch (error) {
      alert('Failed to resolve report.');
    }
  };

  const filteredTutors = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return tutors.filter(t => {
      const name = (t.name || '').toLowerCase();
      const id = (t.tutor_id || '').toLowerCase();
      const email = (t.email || '').toLowerCase();
      const phone = (t.internal_phone || '').toLowerCase();
      return name.includes(q) || id.includes(q) || email.includes(q) || phone.includes(q);
    }).slice(0, 50);
  }, [tutors, searchQuery]);

  const handleUpdateTutor = async (updatedData: any) => {
    playTapSound();
    setIsUpdating(true);
    try {
      const response = await fetch('https://doableindia.com/api_data.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert',
          ...updatedData,
          status: 'Active',
          record_added: new Date().toISOString().slice(0, 19).replace('T', ' ')
        })
      });
      const result = await response.json();
      if (result.status === 'success') {
        alert('Tutor profile updated successfully!');
        setEditingTutor(null);
      } else {
        alert('Update failed: ' + result.message);
      }
    } catch (error) {
      console.error('Error updating tutor:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTutor = async (tutor: any) => {
    playTapSound();
    const name = tutor.name || 'this tutor';
    if (!window.confirm(`Are you sure you want to DELETE ${name}? This action might be permanent.`)) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch('https://doableindia.com/api_data.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert',
          email: tutor.email,
          status: 'Inactive', 
          about: 'DELETED_BY_ADMIN'
        })
      });
      const result = await response.json();
      if (result.status === 'success') {
        alert('Tutor marked as Inactive/Deleted.');
      } else {
        alert('Delete failed: ' + result.message);
      }
    } catch (error) {
      alert('Delete operation failed.');
    } finally {
      setIsUpdating(false);
    }
  };

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

  const handleSend = async () => {
    if (!message.trim()) return;
    playTapSound();
    setSending(true);
    setStatus(null);

    try {
      const docRef = await addDoc(collection(db, 'alerts'), {
        message,
        city: targetCity,
        gender: targetGender,
        targetClass: targetClass,
        targetUserType: targetUserType,
        targetTutorId: targetTutorId || 'all',
        type,
        sender: template === 'booking' ? 'Booking Confirmation' : 'Notification 🔔',
        timestamp: serverTimestamp(),
        // New Professional Fields
        orderId,
        studentName,
        studentPhone,
        address,
        subjects,
        fee,
        days,
        time,
        duration,
        demoTime,
        isBooking: template === 'booking'
      });
      
      // Clear fields on success
      if (template !== 'none') {
        setMessage('');
        setOrderId('');
        setStudentName('');
        setStudentPhone('');
        setAddress('');
        setSubjects('');
        setFee('');
        setDays('');
        setTime('');
        setDuration('');
        setDemoTime('');
        setTargetTutorId('');
      } else {
        setMessage('');
      }

      setStatus({ type: 'success', msg: 'Broadcast Deployed Successfully! ✨🚀' });
    } catch (err: any) {
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
      setStatus({ type: 'error', msg: 'Failed to clear alerts: ' + (err.message || 'Permission denied') });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="p-5 space-y-6 pb-40">
      {/* Tab Switcher */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
        <button 
          onClick={() => { playTapSound(); setActiveTab('broadcast'); }}
          className={cn(
            "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            activeTab === 'broadcast' ? "bg-white text-primary shadow-sm" : "text-slate-400"
          )}
        >
          📣 Broadcast
        </button>
        <button 
          onClick={() => { playTapSound(); setActiveTab('tutors'); }}
          className={cn(
            "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            activeTab === 'tutors' ? "bg-white text-primary shadow-sm" : "text-slate-400"
          )}
        >
          👤 Tutors
        </button>
        <button 
          onClick={() => { playTapSound(); setActiveTab('reports'); }}
          className={cn(
            "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            activeTab === 'reports' ? "bg-white text-primary shadow-sm" : "text-slate-400"
          )}
        >
          🚩 Reports
        </button>
      </div>

      {activeTab === 'broadcast' ? (
        <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16" />
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <div>
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                  <Zap className="text-amber-400" /> Admin Broadcast
              </h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Targeted Alerts</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleTestPush}
                disabled={testing}
                className="p-2.5 bg-indigo-600 text-white rounded-xl active:scale-95 disabled:opacity-50"
              >
                {testing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
              </button>
              <button 
                onClick={handleClearAll}
                disabled={clearing}
                className="p-2.5 bg-rose-600 text-white rounded-xl active:scale-95 disabled:opacity-50"
              >
                {clearing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              </button>
            </div>
          </div>
            
          <div className="space-y-4 relative z-10">
            {/* Template Selector */}
            <div className="flex gap-2">
              {[
                { id: 'none', label: 'Plain Text', color: 'bg-slate-700' },
                { id: 'job', label: 'Job Alert', color: 'bg-amber-600' },
                { id: 'booking', label: 'Booking Details', color: 'bg-emerald-600' }
              ].map(t => (
                <button 
                  key={t.id}
                  onClick={() => applyTemplate(t.id as any)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all",
                    template === t.id ? t.color + " ring-2 ring-white/20" : "bg-white/5 text-slate-400"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">City</label>
                  <select 
                      value={targetCity}
                      onChange={(e) => setTargetCity(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-xs font-bold focus:outline-none focus:border-primary"
                  >
                      {['All', ...CITIES_LIST].map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                  </select>
              </div>
              <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Tutor ID (Target)</label>
                  <input 
                      type="text"
                      value={targetTutorId}
                      onChange={(e) => setTargetTutorId(e.target.value)}
                      placeholder="e.g. T1025 (or leave empty)"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-xs font-bold focus:outline-none focus:border-primary placeholder:text-slate-700"
                  />
              </div>
            </div>

            {/* Conditional Detailed Fields */}
            {(template === 'booking' || template === 'job') && (
              <div className="bg-white/5 rounded-2xl p-4 space-y-3 border border-white/5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Order ID</label>
                    <input type="text" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="#1234" className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Fee / Amount</label>
                    <input type="text" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="₹25,000" className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold outline-none" />
                  </div>
                  {template === 'booking' ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Student Name</label>
                        <input type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Rahul Sharma" className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Student Phone</label>
                        <input type="text" value={studentPhone} onChange={(e) => setStudentPhone(e.target.value)} placeholder="8182XXXXXX" className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Demo Date/Time</label>
                        <input type="text" value={demoTime} onChange={(e) => setDemoTime(e.target.value)} placeholder="15 June, 4:00 PM" className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Duration</label>
                        <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="1.5 Hours" className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold outline-none" />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Address</label>
                        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House No. 123, Sector 5..." className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold outline-none" />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Days (Schedule)</label>
                        <input type="text" value={days} onChange={(e) => setDays(e.target.value)} placeholder="Mon, Wed, Fri" className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold outline-none" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-span-2 space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Subjects</label>
                        <input type="text" value={subjects} onChange={(e) => setSubjects(e.target.value)} placeholder="Maths, Science" className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold outline-none" />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Time (Slot)</label>
                        <input type="text" value={time} onChange={(e) => setTime(e.target.value)} placeholder="Evening slots after 5 PM" className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold outline-none" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Gender</label>
                  <select 
                      value={targetGender}
                      onChange={(e) => setTargetGender(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-xs font-bold focus:outline-none focus:border-primary"
                  >
                      <option value="Any" className="bg-slate-900">Any</option>
                      <option value="Male" className="bg-slate-900">Male</option>
                      <option value="Female" className="bg-slate-900">Female</option>
                  </select>
              </div>
              <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Class</label>
                  <select 
                      value={targetClass}
                      onChange={(e) => setTargetClass(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-xs font-bold focus:outline-none focus:border-primary"
                  >
                      {['All', ...CLASSES_LIST].map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                  </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Alert Level</label>
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
                          className={cn(
                            "flex-1 h-12 rounded-xl border flex items-center justify-center transition-all",
                            type === t.id ? "bg-white/10 border-white/40 " + t.color : "border-white/5 text-slate-600"
                          )}
                      >
                          {t.icon}
                      </button>
                  ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Message Preview</label>
              <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your announcement here..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-medium focus:outline-none focus:border-primary min-h-[100px]"
              />
            </div>

            <button 
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Deploy Broadcast</>}
            </button>

            {status && (
                <div className={cn(
                  "p-4 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest",
                  status.type === 'success' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                )}>
                    {status.msg}
                </div>
            )}
          </div>
        </div>
      ) : activeTab === 'tutors' ? (
        <div className="space-y-5">
          {/* Tutor Management Search */}
          <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-black tracking-tight text-slate-900">Tutor Management</h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Search, Edit & Delete Profiles</p>
            </div>
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Name, ID, Phone or Email..."
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-3">
            {filteredTutors.length > 0 ? (
              filteredTutors.map(t => (
                <div key={t.tutor_id || t.email} className="bg-white rounded-[28px] p-4 border border-slate-100 shadow-sm space-y-3 relative overflow-hidden group">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <User size={24} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[14px] font-black text-slate-900 truncate">{toTitleCase(t.name || 'Premium Tutor')}</h4>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black text-primary uppercase tracking-tighter">ID: {t.tutor_id || 'N/A'}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-200" />
                          <span className="text-[10px] font-bold text-slate-400">{t.gender || 'Any'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => { playTapSound(); setEditingTutor(t); }}
                        className="p-2.5 bg-slate-50 text-blue-600 rounded-xl active:scale-95 transition-all border border-slate-100"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteTutor(t)}
                        className="p-2.5 bg-rose-50 text-rose-600 rounded-xl active:scale-95 transition-all border border-rose-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <Phone size={12} className="text-slate-300" />
                      <span className="text-[11px] font-bold text-slate-600">{t.internal_phone || 'No Phone'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={12} className="text-slate-300" />
                      <span className="text-[11px] font-bold text-slate-600 truncate">{t.email || 'No Email'}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : searchQuery.trim() ? (
              <div className="py-12 text-center bg-white rounded-[32px] border border-dashed border-slate-200">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No Tutors Found</p>
              </div>
            ) : (
              <div className="py-12 text-center bg-white rounded-[32px] border border-dashed border-slate-200">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">Start searching to manage database</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Reports Tab Content */
        <div className="space-y-5">
          <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex justify-between items-center">
             <div>
               <h2 className="text-xl font-black tracking-tight text-slate-900">User Reports</h2>
               <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Chat Safety & Violations</p>
             </div>
             <button onClick={fetchReports} className="p-2 text-primary active:rotate-180 transition-all duration-500">
               <Zap size={20} />
             </button>
          </div>

          <div className="space-y-3">
            {loadingReports ? (
              <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>
            ) : reports.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">All clear! No pending reports.</p>
              </div>
            ) : (
              reports.map(report => (
                <div key={report.id} className="bg-white rounded-[28px] p-5 border-l-4 border-l-rose-500 border-y border-r border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em]">New Violation Report</p>
                      <h4 className="text-[14px] font-black text-slate-900">Against: {toTitleCase(report.reportedName)}</h4>
                    </div>
                    <button 
                      onClick={() => handleResolveReport(report.id)}
                      className="p-2 bg-emerald-50 text-emerald-600 rounded-xl active:scale-90 transition-all"
                    >
                      <CheckCircle size={18} />
                    </button>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                    <p className="text-[12px] font-bold text-slate-700 leading-relaxed italic">"{report.reason}"</p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                    <div className="flex items-center gap-1">
                      <User size={12} />
                      <span>Reporter: {toTitleCase(report.reporterName)}</span>
                    </div>
                    <span>{report.timestamp?.toDate ? report.timestamp.toDate().toLocaleDateString() : 'Just now'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2">
                    <div className="px-3 py-1 bg-slate-100 rounded-full text-[8px] font-black text-slate-500 uppercase tracking-widest">
                      Conn ID: {report.connectionId?.slice(-6)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTutor && (
        <div className="fixed inset-0 z-[16000] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div onClick={() => setEditingTutor(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div className="relative bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <div>
                 <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Edit Tutor Profile</h3>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Modify CRM Database Record</p>
               </div>
               <button onClick={() => setEditingTutor(null)} className="p-2 bg-white rounded-full text-slate-400 shadow-sm"><X size={18} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <TutorEditField label="Full Name" value={editingTutor.name || ''} onChange={(val) => setEditingTutor({...editingTutor, name: val})} icon={<User size={14}/>} />
              <TutorEditField label="Phone Number" value={editingTutor.internal_phone || ''} onChange={(val) => setEditingTutor({...editingTutor, internal_phone: val})} icon={<Phone size={14}/>} />
              <TutorEditField label="Email Address" value={editingTutor.email || ''} onChange={(val) => setEditingTutor({...editingTutor, email: val})} icon={<Mail size={14}/>} />
              <TutorEditField label="Tutor ID" value={editingTutor.tutor_id || ''} onChange={(val) => setEditingTutor({...editingTutor, tutor_id: val})} icon={<Hash size={14}/>} />
              
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-[10px] font-bold text-amber-600 flex items-center gap-2">
                  <ShieldCheck size={14} /> Only Name, Phone, Email and ID are currently editable via Admin.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100">
              <button 
                onClick={() => handleUpdateTutor(editingTutor)}
                disabled={isUpdating}
                className="w-full py-4 rounded-2xl bg-primary text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-95 flex items-center justify-center gap-2"
              >
                {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TutorEditField = ({ label, value, onChange, icon }: { label: string, value: string, onChange: (val: string) => void, icon: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">{icon}</div>
      <input 
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all"
      />
    </div>
  </div>
);

export default AdminPanel;
