import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, MapPin, Loader2, Home as HomeIcon, FileText, User as LucideUser, Sparkles, CheckCircle, LogOut, Settings, Edit3, Bell, X, MessageSquare, ExternalLink, Zap, ArrowRight, Check, Sun, Moon, Briefcase, BookText, ChevronDown, CreditCard, Heart, Volume2, Play, Info, Clock, MessageCircle, Calendar, Globe, Hash, AlertCircle } from 'lucide-react';
import { collection, onSnapshot, query, where, orderBy, limit, addDoc, serverTimestamp, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { motion, AnimatePresence } from 'framer-motion';
import { JobLead, TutorProfile, Alert, UserType } from './types';
import AlertsView from './components/AlertsView';
import AdminPanel from './components/AdminPanel';
import PasscodeLogin from './components/PasscodeLogin';
import SupportView from './components/SupportView';
import HomeView from './components/HomeView';
import { JobsView } from './components/JobsView';
import { TutorsView } from './components/TutorsView';
import { EarningsView } from './components/EarningsView';
import { ParentHubView } from './components/ParentHubView';

import { useNotifications } from './hooks/useNotifications';
import { cn, toTitleCase, openWhatsApp } from './utils';
import { 
  CITIES_LIST, 
  CLASSES_LIST } from './constants';

const TAP_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3';
const tapAudio = new Audio(TAP_SOUND_URL);

function playTapSound() {
  try {
    tapAudio.currentTime = 0;
    tapAudio.volume = 0.4;
    tapAudio.play().catch(() => {});
    if ('vibrate' in navigator) navigator.vibrate(15);
  } catch {}
}

function DetailStat({ emoji, label, value, color = "bg-slate-900" }: { emoji: string | React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div className="bg-white p-2.5 rounded-[24px] border border-slate-100 shadow-sm transition-all duration-300 flex items-center gap-2.5 overflow-hidden h-full">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm", color)}>
        <span className="text-base">{emoji}</span>
      </div>
      <div className="flex flex-col min-w-0">
        <div className="text-[10px] font-black text-slate-800 leading-tight truncate">{value}</div>
        <div className="text-[7.5px] text-slate-400 uppercase font-black tracking-widest mt-0.5 opacity-80">{label}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [leads, setLeads] = useState<JobLead[]>([]);
  const [firestoreLeads, setFirestoreLeads] = useState<JobLead[]>([]);
  const [tutors, setTutors] = useState<TutorProfile[]>([]);

  const [userCity, setUserCity] = useState<string>(localStorage.getItem('userCity') || 'Ghaziabad');
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('userName'));
  const [userGender, setUserGender] = useState<string | null>(localStorage.getItem('userGender') || 'All');
  const [userType, setUserType] = useState<UserType | null>(localStorage.getItem('userType') as UserType);
  const [userClasses, setUserClasses] = useState<string[]>(JSON.parse(localStorage.getItem('userClasses') || '[]'));

  const [jobCityFilter, setJobCityFilter] = useState(localStorage.getItem('userCity') || 'all');
  const [tutorCityFilter, setTutorCityFilter] = useState(localStorage.getItem('userCity') || 'all');

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [showQuickPicker, setShowQuickPicker] = useState<'city' | 'locality' | 'class' | 'gender' | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formType, setFormType] = useState<'teacher' | 'parent'>('teacher');
  const [activeTab, setActiveTab] = useState<'home' | 'jobs' | 'tutors' | 'alerts' | 'support' | 'admin' | 'earnings' | 'concierge'>('home');
  const [unseenAlertsCount, setUnseenAlertsCount] = useState(0);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [tutorStatus, setTutorStatus] = useState<'registered' | 'new' | null>(null);
  
  const [tutorIdInput, setTutorIdInput] = useState('');
  const [isFetchingTutor, setIsFetchingTutor] = useState(false);
  const [tutorFetchError, setTutorFetchError] = useState<string | null>(null);
  const [isTutorFetched, setIsTutorFetched] = useState(false);

  const fetchTutorDetails = () => {
    if (!tutorIdInput.trim()) return;
    setIsFetchingTutor(true);
    setTutorFetchError(null);
    setTimeout(() => {
      const tutor = tutors.find(t => {
        const tid = (t['Tutor ID'] || (t as any).tutorId || (t as any).id || '').toString().toLowerCase().trim();
        return tid === tutorIdInput.toLowerCase().trim();
      });
      if (tutor) {
        playTapSound();
        setUserName(toTitleCase(tutor['Full Name'] || (tutor as any).fullName || ''));
        setUserGender(toTitleCase(tutor.Gender || 'Male'));
        setUserCity(toTitleCase(tutor['Preferred City'] || 'Ghaziabad'));
        setIsTutorFetched(true);
        setTutorIdInput('');
      } else {
        setTutorFetchError('Tutor ID not found.');
      }
      setIsFetchingTutor(false);
    }, 800);
  };

  useNotifications(userCity, userGender || 'All', userClasses, userType || 'all');

  useEffect(() => {
    const handleNav = (e: any) => e.detail && setActiveTab(e.detail);
    window.addEventListener('navigateToTab', handleNav);
    return () => window.removeEventListener('navigateToTab', handleNav);
  }, []);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState<string | null>(null);

  useEffect(() => {
    setAlertsLoading(true);
    try {
      const q = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'), limit(150));
      const unsub = onSnapshot(q, (snapshot) => {
        const alertsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Alert[];
        setAlerts(alertsData);
        setAlertsLoading(false);
      }, (err) => {
        console.error('Firestore Error:', err);
        setAlertsError(err.message);
        setAlertsLoading(false);
      });
      return () => unsub();
    } catch (e: any) {
      setAlertsError(e.message);
      setAlertsLoading(false);
    }
  }, []);

  const loadData = async () => {
    try {
      const isNative = Capacitor.isNativePlatform();
      const LEADS_URL = isNative ? 'https://doableindia.com/api_data.php' : '/api/leads';
      const TUTORS_URL = isNative ? 'https://doableindia.com/api_data_copy.php' : '/api/tutors';
      if (isNative) {
        const [leadsRes, tutorsRes] = await Promise.all([CapacitorHttp.get({ url: LEADS_URL }), CapacitorHttp.get({ url: TUTORS_URL })]);
        if (leadsRes.data) setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : leadsRes.data.data || []);
        if (tutorsRes.data) setTutors(Array.isArray(tutorsRes.data) ? tutorsRes.data : tutorsRes.data.data || []);
      }
    } catch (err) { console.error('Error loading data:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (Capacitor.isNativePlatform()) GoogleAuth.initialize({ clientId: '237759117673-t8sj47mgt7c982rdvjhmqlp5n676o0u8.apps.googleusercontent.com', scopes: ['profile', 'email'] });
    loadData();
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsubscribeAuth();
  }, []);

  const isAdminUser = useMemo(() => {
    const email = currentUser?.email?.toLowerCase().trim();
    return email === 'd9717018219@gmail.com' || email === 'doableindia@gmail.com';
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none">
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-24">
        {activeTab === 'home' && <HomeView userCity={userCity} userType={userType} userName={userName} onSearchJobs={() => setActiveTab('jobs')} onPostRequirement={() => { setFormType('parent'); setShowFormModal(true); }} onPostTutor={() => { setFormType('teacher'); setShowFormModal(true); }} onProfileClick={() => setShowProfileSetup(true)} unseenAlertsCount={unseenAlertsCount} />}
        {activeTab === 'jobs' && <JobsView cityFilter={jobCityFilter} setCityFilter={setJobCityFilter} userCity={userCity} leads={leads} firestoreLeads={firestoreLeads} />}
        {activeTab === 'tutors' && <TutorsView cityFilter={tutorCityFilter} setCityFilter={setTutorCityFilter} userCity={userCity} tutors={tutors} />}
        {activeTab === 'alerts' && <AlertsView city={userCity} alerts={alerts} loading={alertsLoading} error={alertsError} />}
        {activeTab === 'support' && <SupportView />}
        {activeTab === 'admin' && <AdminPanel currentCity={userCity} />}
        {activeTab === 'earnings' && <EarningsView userCity={userCity} />}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex justify-around p-2 pb-[calc(1rem+var(--safe-area-bottom,20px))] z-[10000]">
        <NavButton active={activeTab === 'home'} onClick={() => { playTapSound(); setActiveTab('home'); }} icon={<HomeIcon size={18} />} label="Home" activeColor="text-primary" activeBg="bg-primary/5" inactiveColor="text-slate-400" inactiveBg="bg-transparent" />
        <NavButton active={activeTab === 'jobs'} onClick={() => { playTapSound(); setActiveTab('jobs'); }} icon={<Briefcase size={18} />} label="Jobs" activeColor="text-rose-500" activeBg="bg-rose-50" inactiveColor="text-slate-400" inactiveBg="bg-transparent" />
        <NavButton active={activeTab === 'tutors'} onClick={() => { playTapSound(); setActiveTab('tutors'); }} icon={<GraduationCap size={18} />} label="Tutors" activeColor="text-emerald-500" activeBg="bg-emerald-50" inactiveColor="text-slate-400" inactiveBg="bg-transparent" />
        <NavButton active={activeTab === 'alerts'} onClick={() => { playTapSound(); setActiveTab('alerts'); setUnseenAlertsCount(0); }} icon={<div className="relative"><Bell size={18} />{unseenAlertsCount > 0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[7px] flex items-center justify-center rounded-full font-black ring-2 ring-white">!</span>}</div>} label="Alerts" activeColor="text-amber-500" activeBg="bg-amber-50" inactiveColor="text-slate-400" inactiveBg="bg-transparent" />
        <NavButton active={activeTab === 'support'} onClick={() => { playTapSound(); setActiveTab('support'); }} icon={<MessageCircle size={18} />} label="Support" activeColor="text-blue-500" activeBg="bg-blue-50" inactiveColor="text-slate-400" inactiveBg="bg-transparent" />
      </nav>

      {showProfileSetup && <div className="fixed inset-0 z-[12000] flex items-center justify-center p-6"><div onClick={() => setShowProfileSetup(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" /><div className="relative bg-white w-full max-w-[340px] rounded-[32px] p-6 space-y-6"><button onClick={() => setShowProfileSetup(false)} className="absolute top-4 right-4 text-slate-400"><X size={20} /></button><h2 className="font-black uppercase tracking-widest text-xs">Profile Setup</h2><p className="text-[10px] text-slate-500 font-bold">Please update your preferences in the native settings or profile section.</p><button onClick={() => setShowProfileSetup(false)} className="w-full bg-primary text-white p-4 rounded-2xl font-black uppercase text-[10px]">Close</button></div></div>}
      
      {showFormModal && <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4"><div onClick={() => setShowFormModal(false)} className="absolute inset-0 bg-slate-900/60" /><div className="relative bg-white w-full max-w-2xl rounded-[32px] h-[85vh] flex flex-col"><div className="p-6 border-b flex justify-between items-center"><h3 className="font-black uppercase">{formType === 'teacher' ? 'Tutor Registration' : 'Requirement'}</h3><button onClick={() => setShowFormModal(false)}><X size={20} /></button></div><iframe className="flex-1 w-full border-none" src={formType === 'teacher' ? 'https://forms.doableindia.com/info2701/form/UpdateForm/formperma/5q6-EFWKiWGtqhyYNfjqMGyCYXXst3OOPqOmQCD7yT8' : 'https://forms.doableindia.com/info2701/form/ShareRequirement/formperma/Y-6ujBL2ntI_ufnw8JPcHpyFOAGHButgY6SigoCfs6o'} /></div></div>}
    </div>
  );
}

function NavButton({ active, onClick, icon, label, activeColor, activeBg, inactiveColor, inactiveBg }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; activeColor: string; activeBg: string; inactiveColor: string; inactiveBg: string }) {
  return (
    <button onClick={onClick} className={cn("flex-1 flex flex-col items-center gap-1 py-1.5 rounded-full transition-all active:scale-95", active ? activeBg + " " + activeColor : inactiveBg + " " + inactiveColor)}>
      {icon}<span className="text-[8px] font-black tracking-tight">{label}</span>
    </button>
  );
}
