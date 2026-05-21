import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, MapPin, Loader2, Home as HomeIcon, FileText, User as LucideUser, Sparkles, BookOpen, GraduationCap, CheckCircle, LogOut, Settings, Edit3, Save, Bell, ChevronRight, Share2, Filter, X, MessageSquare, ExternalLink, Zap, ArrowRight, Navigation, Check, Sun, Cloud, Moon, Briefcase, BookText, ChevronDown, CreditCard, Heart, Volume2, Play, Info, Clock, MessageCircle, Calendar, Globe, ShieldCheck, TrendingUp, Hash, AlertCircle } from 'lucide-react';
import { collection, onSnapshot, query, where, orderBy, limit, addDoc, serverTimestamp, doc, getDoc, getDocs, setDoc, getDocsFromServer, enableNetwork } from 'firebase/firestore';
import { db, auth, auth as firebaseAuth } from './firebase';
import { handleFirestoreError, OperationType } from './lib/firestore-errors';
import { User as FirebaseUser, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
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

import { requestNotificationPermission } from './firebase';
import { useNotifications } from './hooks/useNotifications';
import { cn, getCityTheme, formatCurrency, getCityPhone, toTitleCase, getJobId, getTutorId, openWhatsApp } from './utils';
import { 
  CITIES_LIST, 
  CLASSES_LIST,
  CLASS_SUBJECTS_DATA,
  CLASS_GROUP_MAPPING,
  CITY_TO_LOCATIONS_DATA} from './constants';

// ─── Dynamic greeting ───────────────────────────────────────────────
function getDynamicGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning ☀️';
  if (hour < 17) return 'Good Afternoon 🌤️';
  return 'Good Evening 🌙';
}

// ─── Haptic-like tap sound & vibrate ───────────────────────────────
const TAP_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3';
const tapAudio = new Audio(TAP_SOUND_URL);
tapAudio.load();

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
  const [userSubjects, setUserSubjects] = useState<string[]>(JSON.parse(localStorage.getItem('userSubjects') || '[]'));
  const [userLocalities, setUserLocalities] = useState<string[]>(JSON.parse(localStorage.getItem('userLocalities') || '[]'));

  // Job Filters
  const [jobFilterClasses, setJobFilterClasses] = useState<string[]>([]);
  const [jobFilterGender, setJobFilterGender] = useState<string>('All');
  const [jobFilterLocalities, setJobFilterLocalities] = useState<string[]>([]);
  const [jobCityFilter, setJobCityFilter] = useState(localStorage.getItem('userCity') || 'all');
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [jobSortBy, setJobSortBy] = useState<'newest' | 'fee_high' | 'fee_low' | 'verified'>('newest');

  // Tutor Filters
  const [tutorFilterClasses, setTutorFilterClasses] = useState<string[]>([]);
  const [tutorFilterGender, setTutorFilterGender] = useState<string>('All');
  const [tutorFilterLocalities, setTutorFilterLocalities] = useState<string[]>([]);
  const [tutorCityFilter, setTutorCityFilter] = useState(localStorage.getItem('userCity') || 'all');
  const [tutorSearchQuery, setTutorSearchQuery] = useState('');
  const [tutorSortBy, setTutorSortBy] = useState<'newest' | 'fee_high' | 'fee_low' | 'verified'>('newest');

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [showAdvancedFilterDrawer, setShowAdvancedFilterDrawer] = useState(false);
  const [showQuickPicker, setShowQuickPicker] = useState<'city' | 'locality' | 'class' | 'gender' | null>(null);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formType, setFormType] = useState<'teacher' | 'parent'>('teacher');
  const [activeTab, setActiveTab] = useState<'home' | 'jobs' | 'tutors' | 'alerts' | 'support' | 'admin' | 'earnings' | 'concierge'>('home');
  const [alertsInitialTab, setAlertsInitialTab] = useState<'feed' | 'support' | 'setup'>('feed');
  const [unseenAlertsCount, setUnseenAlertsCount] = useState(0);
  const [activeToast, setActiveToast] = useState<{ title: string, body: string } | null>(null);
  const [shortlistedIds, setShortlistedIds] = useState<string[]>(JSON.parse(localStorage.getItem('shortlistedIds') || '[]'));
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [tutorStatus, setTutorStatus] = useState<'registered' | 'new' | null>(null);
  
  // Profile Auto-fill Logic
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
        const name = (tutor['Full Name'] || (tutor as any).fullName || tutor.Name || '').toString();
        const gender = (tutor.Gender || (tutor as any).gender || 'Male').toString();
        const city = (tutor['Preferred City'] || (tutor as any).preferredCity || (tutor as any).City || 'Ghaziabad').toString();
        const classGroup = (tutor['Preferred Class Group'] || (tutor as any).preferredClassGroup || (tutor as any).classGroup || '').toString();

        setUserName(toTitleCase(name));
        setUserGender(toTitleCase(gender));
        setUserCity(toTitleCase(city));
        
        // Match Class Groups
        const groups = ['Class I to V', 'Class VI to VIII', 'Class IX to X', 'Class XI to XII'];
        const matchedGroups = groups.filter(g => classGroup.toLowerCase().includes(g.toLowerCase().replace('class ', '')));
        if (matchedGroups.length > 0) setUserClasses(matchedGroups);
        
        // Save to LocalStorage
        localStorage.setItem('userName', toTitleCase(name));
        localStorage.setItem('userGender', toTitleCase(gender));
        localStorage.setItem('userCity', toTitleCase(city));
        if (matchedGroups.length > 0) localStorage.setItem('userClasses', JSON.stringify(matchedGroups));
        
        setIsTutorFetched(true);
        setTutorIdInput('');
      } else {
        setTutorFetchError('Tutor ID not found.');
      }
      setIsFetchingTutor(false);
    }, 800);
  };

  const mainScrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlocked = useRef(false);

  useEffect(() => {
    const unlock = () => {
      if (audioUnlocked.current) return;
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current?.pause();
          if (audioRef.current) audioRef.current.currentTime = 0;
          audioUnlocked.current = true;
          console.log('Audio unlocked for this session');
        }).catch(() => {});
      }
    };
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  // Notifications are handled by the useNotifications hook below
  useNotifications(userCity, userGender || 'All', userClasses, userType || 'all');

  useEffect(() => {
    const handleNav = (e: any) => {
      if (e.detail) setActiveTab(e.detail);
    };
    window.addEventListener('navigateToTab', handleNav);
    return () => window.removeEventListener('navigateToTab', handleNav);
  }, []);

  useEffect(() => {
    localStorage.setItem('userCity', userCity);
  }, [userCity]);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState<string | null>(null);

  const fetchAlertsFromServer = async () => {
    setAlertsLoading(true);
    try {
      const q = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'), limit(100));
      const snap = await getDocsFromServer(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Alert[];
      setAlerts(data);
      setAlertsLoading(false);
      if (data.length === 0) window.alert('No alerts found on SERVER.');
      else window.alert(`Loaded ${data.length} alerts from SERVER.`);
    } catch (e: any) {
      window.alert('Server Fetch Error: ' + e.message);
      setAlertsLoading(false);
    }
  };

  useEffect(() => {
    setAlertsLoading(true);
    try {
      const q = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'), limit(150));
      const unsub = onSnapshot(q, (snapshot) => {
        const source = snapshot.metadata.fromCache ? 'Cache' : 'Server';
        console.log(`📡 Alerts: ${snapshot.size} items from ${source}`);
        const alertsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Alert[];
        
        if (!isAlertsInitialLoad.current) {
          const newAlerts = snapshot.docChanges().filter(change => change.type === 'added');
          if (newAlerts.length > 0) {
            setUnseenAlertsCount(prev => prev + newAlerts.length);
            playTapSound();
          }
        } else {
          isAlertsInitialLoad.current = false;
        }

        setAlerts(alertsData);
        setAlertsLoading(false);
      }, (err) => {
        console.error('❌ Firestore Error:', err);
        setAlertsError(err.message);
        setAlertsLoading(false);
      });
      return () => unsub();
    } catch (e: any) {
      setAlertsError(e.message);
      setAlertsLoading(false);
    }
  }, []); // Re-subscribe if userCity changes for filtering logic within listener if needed

  const [debugClicks, setDebugClicks] = useState(0);
  const [fcmToken, setFcmToken] = useState<string>(localStorage.getItem('fcmToken') || 'Initializing...');
  const [registrationStatus, setRegistrationStatus] = useState<string>('Initializing...');
  const [dbStatus, setDbStatus] = useState<'Checking...' | 'Connected' | 'Error'>('Checking...');
  const [isServerData, setIsServerData] = useState(false);

  useEffect(() => {
    const handleTokenUpdate = (e: any) => {
      setFcmToken(e.detail);
      setRegistrationStatus('Registered ✅');
    };

    const playBlackberrySound = () => {
      if (audioRef.current) {
        audioRef.current.src = '/blackberry.mp3';
        audioRef.current.play().catch(err => console.error('Audio play error:', err));
      }
    };

    const handleForegroundPush = (e: any) => {
      console.log('🔔 Foreground Notification Event:', e.detail);
      setUnseenAlertsCount(prev => prev + 1);

      const payload = e.detail;
      const title = payload.notification?.title || payload.data?.title || 'New Alert 📢';
      const body = payload.notification?.body || payload.data?.body || 'A new update is available in the network.';

      setActiveToast({ title, body });
      setTimeout(() => setActiveToast(null), 6000);
      playBlackberrySound();
    };

    window.addEventListener('fcmTokenUpdated', handleTokenUpdate);
    window.addEventListener('firebaseNotification', handleForegroundPush);

    return () => {
      window.removeEventListener('fcmTokenUpdated', handleTokenUpdate);
      window.removeEventListener('firebaseNotification', handleForegroundPush);
    };
  }, [userCity]);

  const testAlertSound = async () => {
    try {
      if (audioRef.current) {
        audioRef.current.src = '/blackberry.mp3';
        audioRef.current.load();
        await audioRef.current.play();
      }
      if (Capacitor.isNativePlatform()) {
         await LocalNotifications.schedule({
           notifications: [{
             title: "DoAble India | Sound Test 🔊",
             body: "If you hear the blackberry sound, your notifications are working!",
             id: Date.now(),
             schedule: { at: new Date(Date.now() + 1000) },
             sound: 'blackberry.mp3',
             channelId: 'doable_channel_v6'
           }]
         });
      }
    } catch (e) {
      console.error('Sound Test Error:', e);
    }
  };

  const [selectedJob, setSelectedJob] = useState<JobLead | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<TutorProfile | null>(null);

  const loadData = async () => {
    try {
      if (leads.length === 0 && tutors.length === 0) setLoading(true);
      
      const isNative = Capacitor.isNativePlatform();

      const LEADS_URL = isNative 
        ? 'https://doableindia.com/api_data.php' 
        : '/api/leads';
      const TUTORS_URL = isNative 
        ? 'https://doableindia.com/api_data_copy.php' 
        : '/api/tutors';

      if (isNative) {
        // Use native fetch to bypass CORS
        const [leadsRes, tutorsRes] = await Promise.all([
          CapacitorHttp.get({ url: LEADS_URL }),
          CapacitorHttp.get({ url: TUTORS_URL })
        ]);
        
        if (leadsRes.data) {
           const data = typeof leadsRes.data === 'string' ? JSON.parse(leadsRes.data) : leadsRes.data;
           if (data.status === 'success') setLeads(data.data);
           else if (Array.isArray(data)) setLeads(data);
        }

        if (tutorsRes.data) {
           const data = typeof tutorsRes.data === 'string' ? JSON.parse(tutorsRes.data) : tutorsRes.data;
           if (data.status === 'success') setTutors(data.data);
           else if (Array.isArray(data)) setTutors(data);
        }
      } else {
        const [leadsRes, tutorsRes] = await Promise.all([fetch(LEADS_URL), fetch(TUTORS_URL)]);
        const [leadsJson, tutorsJson] = await Promise.all([leadsRes.json(), tutorsRes.json()]);
        if (leadsJson.status === 'success') setLeads(leadsJson.data);
        if (tutorsJson.status === 'success') setTutors(tutorsJson.data);
      }
    } catch (err) {
      console.error('❌ Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize({
        clientId: '237759117673-t8sj47mgt7c982rdvjhmqlp5n676o0u8.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
      });
    }
    loadData();
    const qLeads = query(collection(db, 'leads'), orderBy('Updated Time', 'desc'), limit(50));
    const unsubscribeLeads = onSnapshot(qLeads, (snapshot) => {
      setDbStatus('Connected');
      setIsServerData(!snapshot.metadata.fromCache);
      const leadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as JobLead[];
      setFirestoreLeads(leadsData);
    }, (err) => {
      console.error('❌ Leads Firestore Error:', err);
      setDbStatus('Error');
    });
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => { 
      console.log('Auth State Changed:', user ? user.email : 'No User');
      setCurrentUser(user); 
    });
    return () => { unsubscribeLeads(); unsubscribeAuth(); };
  }, []);

  const handleSignIn = async () => {
    try {
      playTapSound();
      console.log('🔄 handleSignIn started...');
      
      if (Capacitor.isNativePlatform()) {
        console.log('📱 Native Platform: Initializing GoogleAuth.signIn()...');
        const user = await GoogleAuth.signIn();
        console.log('✅ GoogleAuth.signIn() Success:', JSON.stringify(user));
        
        if (!user.authentication.idToken) {
          console.error('❌ No idToken in user.authentication');
          alert('Error: idToken missing from Google response.');
          return;
        }

        console.log('🔥 Firebase: signInWithCredential starting...');
        const credential = GoogleAuthProvider.credential(user.authentication.idToken);
        const result = await signInWithCredential(auth, credential);
        console.log('🎉 Firebase: Login Success!', result.user.email);
        alert('Welcome! Signed in as: ' + result.user.email);
      } else {
        console.log('🌐 Web Platform: signInWithPopup starting...');
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        console.log('🎉 Firebase: Web Login Success!', result.user.email);
      }
    } catch (err: any) {
      console.error('❌ Sign-in Error:', err);
      let errorMsg = 'Unknown Error';
      
      if (typeof err === 'object') {
        errorMsg = err.message || err.error || JSON.stringify(err);
      } else {
        errorMsg = String(err);
      }
      
      alert('Sign-in failed!\n\nError: ' + errorMsg);
      
      if (errorMsg.includes('10:') || errorMsg.includes('DEVELOPER_ERROR')) {
        alert('DEBUG HINT: This is usually a SHA-1 or Client ID mismatch in Firebase/Google Console.');
      }
    }
  };

  const isAdminUser = useMemo(() => {
    const email = currentUser?.email?.toLowerCase().trim();
    return email === 'd9717018219@gmail.com' || email === 'doableindia@gmail.com';
  }, [currentUser]);

  const toggleShortlist = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    playTapSound();
    setShortlistedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('shortlistedIds', JSON.stringify(next));
      return next;
    });
  }, []);

  const clearJobsFilters = () => {
    playTapSound();
    setJobCityFilter('all');
    setJobFilterLocalities([]);
    setJobFilterClasses([]);
    setJobFilterGender('All');
    setJobSearchQuery('');
    setVisibleJobsCount(10);
  };

  const clearTutorsFilters = () => {
    playTapSound();
    setTutorCityFilter('all');
    setTutorFilterLocalities([]);
    setTutorFilterClasses([]);
    setTutorFilterGender('All');
    setTutorSearchQuery('');
    setVisibleTutorsCount(10);
  };

  const isCityMatch = useCallback((city: string | undefined, filter: string) => {
    if (!city || filter.toLowerCase() === 'all') return true;
    const c = city.toString().toLowerCase().trim();
    const f = filter.toLowerCase().trim();
    if (c === f) return true;
    if (f === 'noida' && c === 'greater noida') return false;
    if (f === 'greater noida' && c === 'noida') return false;
    return c.includes(f) || f.includes(c);
  }, []);

  const finalJobs = useMemo(() => {
    const combined = [...firestoreLeads, ...leads];
    const unique = new Map<string, JobLead>();
    combined.forEach(l => {
      const id = l['Order ID'] || (l as any).id;
      if (id && !unique.has(id)) unique.set(id, l);
    });
    let result = Array.from(unique.values());

    return result.filter(l => {
      if ((l['Internal Remark'] || '').trim().toLowerCase() !== 'searching') return false;
      if (!isCityMatch(l.City, jobCityFilter)) return false;

      // Localities Filter
      if (jobFilterLocalities.length > 0) {
        const jobLocs = (l.Locations || '').toLowerCase();
        if (!jobFilterLocalities.some(loc => jobLocs.includes(loc.toLowerCase()))) return false;
      }

      // Classes Filter
      if (jobFilterClasses.length > 0) {
        const jobClass = (l.Class || '').toLowerCase();
        if (!jobFilterClasses.some(cls => jobClass.includes(cls.toLowerCase()))) return false;
      }

      // Gender Filter
      if (jobFilterGender !== 'All') {
        const jobGender = (l.Gender || '').toLowerCase();
        if (!jobGender.includes(jobFilterGender.toLowerCase()) && !jobGender.includes('any')) return false;
      }

      if (jobSearchQuery) {
        const sl = jobSearchQuery.toLowerCase();
        const jName = (l.Name || '').toLowerCase();
        const jID = (l['Order ID'] || '').toString().toLowerCase();
        const subjects = (l.subjects || '').toLowerCase();
        if (!(jName.includes(sl) || jID.includes(sl) || subjects.includes(sl))) return false;
      }
      return true;
    }).sort((a, b) => {
      if (jobSortBy === 'fee_high' || jobSortBy === 'fee_low') {
        const fA = parseInt((a.Fee || (a as any)['Fee/Month'] || '0').toString().replace(/[^0-9]/g, '')) || 0;
        const fB = parseInt((b.Fee || (b as any)['Fee/Month'] || '0').toString().replace(/[^0-9]/g, '')) || 0;
        return jobSortBy === 'fee_high' ? fB - fA : fA - fB;
      }
      if (jobSortBy === 'verified') {
        const vA = (a as any).verified === 'yes' ? 1 : 0;
        const vB = (b as any).verified === 'yes' ? 1 : 0;
        return vB - vA;
      }
      
      const parseJobDate = (d: any) => {
        if (!d) return 0;
        if (typeof d === 'string') {
          if (d === '0000-00-00 00:00:00') return 0;
          return new Date(d.replace(/-/g, "/")).getTime() || 0;
        }
        if (d && typeof d === 'object' && 'seconds' in d) return d.seconds * 1000;
        return new Date(d).getTime() || 0;
      };

      const dateA = parseJobDate(a['Updated Time'] || a['Record Added']);
      const dateB = parseJobDate(b['Updated Time'] || b['Record Added']);
      
      return dateB - dateA;
    });
  }, [leads, firestoreLeads, jobCityFilter, jobSearchQuery, isCityMatch, jobFilterLocalities, jobFilterClasses, jobFilterGender, jobSortBy]);

  const finalTutors = useMemo(() => {
    return tutors.filter(t => {
      const cityVal = (t['Preferred City'] || (t as any).preferredCity || (t as any).City || (t as any).city || 'India').toString().toLowerCase();
      if (!isCityMatch(cityVal, tutorCityFilter)) return false;

      // Localities Filter
      if (tutorFilterLocalities.length > 0) {
        const tutorLocs = (t['Preferred Location(s)'] || '').toLowerCase();
        if (!tutorFilterLocalities.some(loc => tutorLocs.includes(loc.toLowerCase()))) return false;
      }

      // Classes Filter
      if (tutorFilterClasses.length > 0) {
        const tutorClass = (t['Preferred Class Group'] || '').toLowerCase();
        if (!tutorFilterClasses.some(cls => tutorClass.includes(cls.toLowerCase()))) return false;
      }

      // Gender Filter
      if (tutorFilterGender !== 'All') {
        const tutorGender = (t.Gender || '').toLowerCase();
        if (!tutorGender.includes(tutorFilterGender.toLowerCase())) return false;
      }

      if (tutorSearchQuery) {
        const sl = tutorSearchQuery.toLowerCase();
        const tName = (t['Full Name'] || (t as any).fullName || (t.Name || '')).toLowerCase();
        const tID = (t['Tutor ID'] || (t as any).tutorId || '').toString().toLowerCase();
        const skills = (t.Skills || '').toLowerCase();
        if (!(tName.includes(sl) || tID.includes(sl) || skills.includes(sl))) return false;
      }
      return true;
    }).sort((a, b) => {
      if (tutorSortBy === 'verified') {
        const vA = a.Verified === 'Yes' ? 1 : 0;
        const vB = b.Verified === 'Yes' ? 1 : 0;
        if (vA !== vB) return vB - vA;
      }

      if (tutorSortBy === 'fee_high' || tutorSortBy === 'fee_low') {
        const fA = parseInt(a['Fee/Month']?.replace(/[^0-9]/g, '') || '0');
        const fB = parseInt(b['Fee/Month']?.replace(/[^0-9]/g, '') || '0');
        return tutorSortBy === 'fee_high' ? fB - fA : fA - fB;
      }

      const idA = parseInt((a['Tutor ID'] || a.tutorId || '0').toString().replace(/[^0-9]/g, ''));
      const idB = parseInt((b['Tutor ID'] || b.tutorId || '0').toString().replace(/[^0-9]/g, ''));
      if (idB !== idA) return idB - idA;

      const parseTutorDate = (d: any) => {
        if (!d) return 0;
        if (typeof d === 'string') {
          if (d === '0000-00-00 00:00:00') return 0;
          return new Date(d.replace(/-/g, "/")).getTime() || 0;
        }
        if (d && typeof d === 'object' && 'seconds' in d) return d.seconds * 1000;
        return new Date(d).getTime() || 0;
      };

      const dateA = parseTutorDate(a['Record Added']);
      const dateB = parseTutorDate(b['Record Added']);
      return dateB - dateA;
    });
  }, [tutors, tutorCityFilter, tutorSearchQuery, isCityMatch, tutorFilterLocalities, tutorFilterClasses, tutorFilterGender, tutorSortBy]);
  const [visibleJobsCount, setVisibleJobsCount] = useState(10);
  const [visibleTutorsCount, setVisibleTutorsCount] = useState(10);
  const resetCounts = () => { setVisibleJobsCount(10); setVisibleTutorsCount(10); };

  const isJobs = activeTab === 'jobs';
  const currentCityFilter = isJobs ? jobCityFilter : tutorCityFilter;
  const setCityFilter = isJobs ? setJobCityFilter : setTutorCityFilter;
  const currentFilterLocalities = isJobs ? jobFilterLocalities : tutorFilterLocalities;
  const setFilterLocalities = isJobs ? setJobFilterLocalities : setTutorFilterLocalities;
  const currentFilterClasses = isJobs ? jobFilterClasses : tutorFilterClasses;
  const setFilterClasses = isJobs ? setJobFilterClasses : setTutorFilterClasses;
  const currentFilterGender = isJobs ? jobFilterGender : tutorFilterGender;
  const setFilterGender = isJobs ? setJobFilterGender : setTutorFilterGender;
  const currentClearFilters = isJobs ? clearJobsFilters : clearTutorsFilters;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans select-none overflow-x-hidden relative" ref={mainScrollRef}>
      <audio ref={audioRef} preload="auto" />

      <style>{`
        :root {
          --safe-area-top: env(safe-area-inset-top, 0px);
          --safe-area-bottom: env(safe-area-inset-bottom, 0px);
        }
        .no-line { border: none !important; box-shadow: none !important; outline: none !important; }
        .sticky-fix { background-color: #F8FAFC !important; }
        
        /* Mobile specific safe area adjustments */
        @media (max-width: 768px) {
          header {
            padding-top: calc(12px + var(--safe-area-top)) !important;
          }
          nav {
            padding-bottom: calc(24px + var(--safe-area-bottom)) !important;
          }
        }
      `}</style>

      <AnimatePresence>
        {showFilterDrawer && (
          <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFilterDrawer(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden p-6">
              <h3 className="text-[14px] font-black uppercase tracking-widest text-slate-900 mb-4">Select City</h3>
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {['All', ...CITIES_LIST].map((city, idx) => (
                  <button key={city} onClick={() => { 
                    playTapSound(); 
                    const c = city.toLowerCase();
                    setJobCityFilter(c === 'all' ? 'all' : c);
                    setTutorCityFilter(c === 'all' ? 'all' : c);
                    setUserCity(city); 
                    localStorage.setItem('userCity', city); 
                    setShowFilterDrawer(false); 
                  }} className={cn("py-3 rounded-xl border text-[11px] font-bold transition-all", city.toLowerCase() === userCity.toLowerCase() ? "bg-primary/5 border-primary text-primary" : "border-slate-100 text-slate-500 hover:border-slate-200")}>
                    {city === 'All' ? city : `${idx}. ${city}`}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
        {showAdvancedFilterDrawer && (
          <div className="fixed inset-0 z-[12000] flex items-end sm:items-center justify-center">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdvancedFilterDrawer(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
             <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-[14px] font-black uppercase tracking-widest text-slate-900">Advanced Filters</h3>
                  <button onClick={() => setShowAdvancedFilterDrawer(false)} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm transition-all"><X size={18} /></button>
               </div>
               <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                  {/* 1. City & Localities */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">1. Location</label>
                    <div className="relative group mb-3">
                       <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                       <select value={currentCityFilter} onChange={e => { setCityFilter(e.target.value); resetCounts(); }} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold outline-none focus:border-primary transition-all appearance-none">
                          <option value="all">Everywhere (All Cities)</option>
                          {CITIES_LIST.map((c, i) => <option key={c} value={c}>{i + 1}. {c}</option>)}
                       </select>
                    </div>
                    
                    {currentCityFilter !== 'all' && (() => {
                       const actualCityKey = CITIES_LIST.find(c => c.toLowerCase() === currentCityFilter.toLowerCase());
                       const localities = actualCityKey ? (CITY_TO_LOCATIONS_DATA as any)[actualCityKey] : null;
                       if (!localities) return null;
                       return (
                         <div className="space-y-3 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                            <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest px-1">Localities in {actualCityKey}</span>
                            <div className="flex flex-wrap gap-2">
                               {localities.map((loc: string) => (
                                 <button key={loc} onClick={() => {
                                   const next = currentFilterLocalities.includes(loc) ? currentFilterLocalities.filter(x => x !== loc) : [...currentFilterLocalities, loc];
                                   setFilterLocalities(next);
                                   resetCounts();
                                 }} className={cn("px-4 py-2 rounded-xl text-[10px] font-bold transition-all border", currentFilterLocalities.includes(loc) ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-slate-500 border-slate-100")}>{loc}</button>
                               ))}
                            </div>
                         </div>
                       );
                    })()}
                  </div>

                  {/* 2. Class & Subjects */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">2. Academics</label>
                    <div className="flex flex-wrap gap-2">
                      {CLASSES_LIST.map(cls => (
                        <button key={cls} onClick={() => {
                            const next = currentFilterClasses.includes(cls) ? currentFilterClasses.filter(x => x !== cls) : [...currentFilterClasses, cls];
                            setFilterClasses(next);
                            resetCounts();
                        }} className={cn("px-4 py-2 rounded-xl text-[10px] font-bold transition-all border", currentFilterClasses.includes(cls) ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-slate-500 border-slate-100")}>{cls}</button>
                      ))}
                    </div>

                    {currentFilterClasses.length > 0 && (
                       <div className="space-y-3 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest px-1">Specific Subjects</span>
                          <div className="flex flex-wrap gap-2">
                             {Array.from(new Set(currentFilterClasses.flatMap(cls => {
                               const actualClassKey = CLASSES_LIST.find(c => c.toLowerCase() === cls.toLowerCase());
                               return (CLASS_SUBJECTS_DATA as any)[actualClassKey || cls] || [];
                             }))).map((sub: any) => (
                               <button key={sub} className={cn("px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all border bg-white text-slate-400 border-slate-100")}>{sub}</button>
                             ))}
                          </div>
                       </div>
                    )}
                  </div>

                  {/* 3. Gender */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">3. Gender Preference</label>
                    <div className="flex gap-2">
                       {['All', 'Male', 'Female'].map(g => (
                         <button key={g} onClick={() => { setFilterGender(g); resetCounts(); }} className={cn("flex-1 py-4 rounded-2xl border-2 font-bold transition-all", currentFilterGender === g ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-400")}>{g}</button>
                       ))}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-6 px-6 pb-[calc(1.5rem+var(--safe-area-bottom,20px))] flex gap-3 sticky bottom-0 bg-white border-t border-slate-50">
                    <button onClick={currentClearFilters} className="flex-1 bg-slate-100 text-slate-900 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all">Reset</button>
                    <button onClick={() => setShowAdvancedFilterDrawer(false)} className="flex-[2] bg-primary text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Show Results</button>
                  </div>
               </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQuickPicker && (
          <div className="fixed inset-0 z-[14000] flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowQuickPicker(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative bg-white w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-900">
                  {showQuickPicker === 'city' ? 'Select City' : showQuickPicker === 'locality' ? 'Select Locality' : showQuickPicker === 'class' ? 'Select Class' : 'Select Gender'}
                </h3>
                <button onClick={() => setShowQuickPicker(null)} className="p-2 bg-white rounded-full text-slate-400 shadow-sm"><X size={16} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {showQuickPicker === 'city' && (
                  <div className="grid grid-cols-2 gap-2">
                    {['All', ...CITIES_LIST].map((city, idx) => (
                      <button key={city} onClick={() => { playTapSound(); setCityFilter(city.toLowerCase()); setShowQuickPicker(null); resetCounts(); }} className={cn("py-3 rounded-xl border text-[10px] font-bold transition-all", (city === 'All' ? 'all' : city.toLowerCase()) === currentCityFilter ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-slate-500 border-slate-100")}>
                        {city}
                      </button>
                    ))}
                  </div>
                )}
                {showQuickPicker === 'locality' && (
                  <div className="space-y-2">
                    {(() => {
                      const actualCityKey = CITIES_LIST.find(c => c.toLowerCase() === currentCityFilter.toLowerCase());
                      const localities = actualCityKey ? (CITY_TO_LOCATIONS_DATA as any)[actualCityKey] : null;
                      if (!localities) return <div className="py-10 text-center text-[10px] font-black uppercase text-slate-400">Select a city first</div>;
                      return (
                        <div className="grid grid-cols-1 gap-1.5">
                           {localities.map((loc: string) => (
                             <button key={loc} onClick={() => {
                               playTapSound();
                               const next = currentFilterLocalities.includes(loc) ? currentFilterLocalities.filter(x => x !== loc) : [...currentFilterLocalities, loc];
                               setFilterLocalities(next);
                               resetCounts();
                             }} className={cn("px-4 py-3 rounded-xl text-[10px] font-bold transition-all border flex items-center justify-between", currentFilterLocalities.includes(loc) ? "bg-primary/5 border-primary text-primary" : "bg-white text-slate-500 border-slate-100")}>
                               {loc}
                               {currentFilterLocalities.includes(loc) && <Check size={14} />}
                             </button>
                           ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
                {showQuickPicker === 'class' && (
                  <div className="grid grid-cols-1 gap-1.5">
                    {CLASSES_LIST.map(cls => (
                      <button key={cls} onClick={() => {
                        playTapSound();
                        const next = currentFilterClasses.includes(cls) ? currentFilterClasses.filter(x => x !== cls) : [...currentFilterClasses, cls];
                        setFilterClasses(next);
                        resetCounts();
                      }} className={cn("px-4 py-3 rounded-xl text-[10px] font-bold transition-all border flex items-center justify-between", currentFilterClasses.includes(cls) ? "bg-primary/5 border-primary text-primary" : "bg-white text-slate-500 border-slate-100")}>
                        {cls}
                        {currentFilterClasses.includes(cls) && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                )}
                {showQuickPicker === 'gender' && (
                  <div className="grid grid-cols-1 gap-1.5 pb-2">
                    {['All', 'Male', 'Female'].map(g => (
                      <button key={g} onClick={() => { playTapSound(); setFilterGender(g); setShowQuickPicker(null); resetCounts(); }} className={cn("px-4 py-3 rounded-xl border text-[10px] font-bold transition-all", currentFilterGender === g ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-slate-500 border-slate-100")}>
                        {g}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {showQuickPicker !== 'city' && showQuickPicker !== 'gender' && (
                <div className="p-4 bg-slate-50 border-t border-slate-100 pb-[calc(1.5rem+var(--safe-area-bottom,24px))]">
                  <button onClick={() => setShowQuickPicker(null)} className="w-full bg-primary text-white py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Apply Filter</button>
                </div>
              )}
              {showQuickPicker === 'gender' && (
                <div className="h-[calc(1rem+var(--safe-area-bottom,20px))] bg-white" />
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-[100] bg-gradient-to-r from-[#6C3475] via-[#4A2350] to-[#6C3475] px-5 pb-2 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.2)] border-b border-white/10 relative overflow-hidden pt-[calc(0.4rem+var(--safe-area-top,20px))]">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="flex flex-col relative z-10" onClick={() => { setDebugClicks(prev => prev + 1); if (debugClicks > 3) window.alert('FCM: ' + fcmToken + '\nDB: ' + dbStatus); }}>
          <span className="text-[18px] font-[900] text-white tracking-tighter leading-none [text-shadow:_0_2px_10px_rgba(0,0,0,0.3)]">DoAble India</span>
          <span className="text-[7.5px] font-black text-purple-100/80 uppercase tracking-[0.2em] mt-1.5">Elite Private Tuition Network {debugClicks > 3 && ' [DEBUG ON]'}</span>
        </div>
        <div className="flex items-center gap-3 relative z-10">
             <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-xl p-0.5 rounded-2xl border border-white/10">
                <button onClick={() => { playTapSound(); setAlertsInitialTab('feed'); setActiveTab('alerts'); setUnseenAlertsCount(0); }} className="relative p-1.5 text-white hover:text-white transition-all active:scale-90">
                  <Bell size={18} strokeWidth={2.5} color="#FFFFFF" />
                  {unseenAlertsCount > 0 && <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-orange-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full border border-white shadow-lg animate-pulse">{unseenAlertsCount}</span>}
                </button>
                <div className="w-[1px] h-3 bg-white/10" />
                <button onClick={() => setShowProfileSetup(true)} className="p-1.5 text-white hover:text-white transition-all active:scale-90"><LucideUser size={18} strokeWidth={2.5} color="#FFFFFF" /></button>
              </div>
        </div>
      </header>

      <main className="container mx-auto p-0 sm:p-[10px] max-w-[1200px] pb-32">
       {activeTab === 'home' && (
          <HomeView userName={userName} userType={userType} userCity={userCity} activeLeadsCount={finalJobs.length} activeTutorsCount={finalTutors.length} featuredJobs={finalJobs.slice(0, 3)} featuredTutors={finalTutors.slice(0, 3)} playTapSound={playTapSound} setFormType={setFormType} setShowFormModal={setShowFormModal} setActiveTab={setActiveTab} setShowFilterDrawer={setShowFilterDrawer} getDynamicGreeting={getDynamicGreeting} onJobClick={setSelectedJob} onTutorClick={setSelectedTutor} shortlistedIds={shortlistedIds} onShortlistToggle={toggleShortlist} />
        )}
       {activeTab === 'jobs' && (
          <JobsView 
            finalJobs={finalJobs}
            loading={loading}
            searchQuery={jobSearchQuery}
            setSearchQuery={setJobSearchQuery}
            setShowAdvancedFilterDrawer={setShowAdvancedFilterDrawer}
            cityFilter={jobCityFilter}
            filterLocalities={jobFilterLocalities}
            filterClasses={jobFilterClasses}
            filterGender={jobFilterGender as any}
            clearFilters={clearJobsFilters}
            setShowQuickPicker={setShowQuickPicker}
            sortBy={jobSortBy}
            setSortBy={setJobSortBy}
            visibleJobsCount={visibleJobsCount}
            setVisibleJobsCount={setVisibleJobsCount}
            setSelectedJob={setSelectedJob}
            shortlistedIds={shortlistedIds}
            toggleShortlist={toggleShortlist}
          />
       )}
       {activeTab === 'tutors' && (
          <TutorsView 
            finalTutors={finalTutors}
            loading={loading}
            searchQuery={tutorSearchQuery}
            setSearchQuery={setTutorSearchQuery}
            setShowAdvancedFilterDrawer={setShowAdvancedFilterDrawer}
            cityFilter={tutorCityFilter}
            filterLocalities={tutorFilterLocalities}
            filterClasses={tutorFilterClasses}
            filterGender={tutorFilterGender as any}
            clearFilters={clearTutorsFilters}
            setShowQuickPicker={setShowQuickPicker}
            sortBy={tutorSortBy}
            setSortBy={setTutorSortBy}
            visibleTutorsCount={visibleTutorsCount}
            setVisibleTutorsCount={setVisibleTutorsCount}
            setSelectedTutor={setSelectedTutor}
            shortlistedIds={shortlistedIds}
            toggleShortlist={toggleShortlist}
          />
       )}
       {activeTab === 'alerts' && (
          <div className="px-0"><AlertsView city={userCity} userGender={userGender} userClasses={userClasses} userType={userType} isAdminUser={isAdminUser} onAdminClick={() => setActiveTab('admin')} currentUser={currentUser} showFormModal={showFormModal} setShowFormModal={setShowFormModal} setUserCity={setUserCity} setUserGender={setUserGender} setUserClasses={setUserClasses} setUserType={setUserType} userName={userName} setUserName={setUserName} initialTab={alertsInitialTab} alerts={alerts} loading={alertsLoading} error={alertsError} dbStatus={dbStatus} leadsCount={firestoreLeads.length} authEmail={currentUser?.email} isServerData={isServerData} onRefresh={fetchAlertsFromServer} /></div>
       )}
       {activeTab === 'support' && (<SupportView userName={userName} userType={userType} userCity={userCity} />)}
       {activeTab === 'concierge' && (<ParentHubView userName={userName} playTapSound={playTapSound} setActiveTab={setActiveTab} setShowFormModal={setShowFormModal} setFormType={setFormType} />)}
       {activeTab === 'earnings' && (<EarningsView leads={leads} firestoreLeads={firestoreLeads} userName={userName} userCity={userCity} playTapSound={playTapSound} setSelectedJob={setSelectedJob} />)}
       {activeTab === 'admin' && (
         <div className="px-6 py-10">
           {isAdminUser ? (
             <AdminPanel currentCity={userCity} />
           ) : (
             <PasscodeLogin 
               onSuccess={() => setActiveTab('admin')} 
               adminEmail="doableindia@gmail.com"
               adminPass="admin123"
             />
           )}
         </div>
       )}
      </main>



      {!selectedJob && !selectedTutor && !showAdvancedFilterDrawer && !showFilterDrawer && !showProfileSetup && !showFormModal && (
        <nav className="fixed bottom-0 left-0 right-0 z-[8000] bg-white/90 backdrop-blur-xl border-t border-slate-100 px-3 pt-2 pb-[calc(1.2rem+var(--safe-area-bottom,20px))] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between gap-1 max-w-[600px] mx-auto">
            <NavButton active={activeTab === 'home'} onClick={() => { playTapSound(); setActiveTab('home'); window.scrollTo(0,0); }} icon={<HomeIcon className="w-[18px] h-[18px]" />} label="Home" activeColor="text-white" activeBg="bg-[#CC2570]" inactiveColor="text-[#CC2570]" inactiveBg="bg-[#CC2570]/5" />
            <NavButton active={activeTab === 'jobs'} onClick={() => { playTapSound(); setActiveTab('jobs'); window.scrollTo(0,0); }} icon={<FileText className="w-[18px] h-[18px]" />} label="Jobs" activeColor="text-white" activeBg="bg-indigo-600" inactiveColor="text-indigo-600" inactiveBg="bg-indigo-50" />
            <NavButton active={activeTab === 'tutors'} onClick={() => { playTapSound(); setActiveTab('tutors'); window.scrollTo(0,0); }} icon={<GraduationCap className="w-[18px] h-[18px]" />} label="Tutors" activeColor="text-white" activeBg="bg-emerald-500" inactiveColor="text-emerald-600" inactiveBg="bg-emerald-50" />
            
            {userType === 'teacher' && (
              <NavButton active={activeTab === 'earnings'} onClick={() => { playTapSound(); setActiveTab('earnings'); window.scrollTo(0,0); }} icon={<TrendingUp className="w-[18px] h-[18px]" />} label="Earnings" activeColor="text-white" activeBg="bg-[#7A2157]" inactiveColor="text-[#7A2157]" inactiveBg="bg-[#7A2157]/5" />
            )}
            
            {userType === 'parent' && (
              <NavButton active={activeTab === 'concierge'} onClick={() => { playTapSound(); setActiveTab('concierge'); window.scrollTo(0,0); }} icon={<Sparkles className="w-[18px] h-[18px]" />} label="Concierge" activeColor="text-white" activeBg="bg-[#572149]" inactiveColor="text-[#572149]" inactiveBg="bg-[#572149]/5" />
            )}

            <NavButton active={activeTab === 'support'} onClick={() => { playTapSound(); setActiveTab('support'); window.scrollTo(0,0); }} icon={<MessageSquare className="w-[18px] h-[18px]" />} label="Support" activeColor="text-white" activeBg="bg-[#347475]" inactiveColor="text-[#347475]" inactiveBg="bg-[#347475]/5" />
          </div>
        </nav>
      )}

      <AnimatePresence>
        {activeToast && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            onClick={() => { setActiveToast(null); setActiveTab('alerts'); }}
            className="fixed top-[env(safe-area-inset-top,20px)] left-4 right-4 z-[20000] bg-white rounded-[24px] shadow-2xl border border-slate-100 p-4 flex items-center gap-4 cursor-pointer active:scale-95 transition-all"
          >
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/20">
              <Bell size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[13px] font-black text-slate-900 truncate">{activeToast.title}</h4>
              <p className="text-[11px] font-bold text-slate-500 line-clamp-2 leading-snug">{activeToast.body}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setActiveToast(null); }} className="p-2 text-slate-300 hover:text-slate-500">
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedJob && (
          <div className="fixed inset-0 z-[15000] flex items-end sm:items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedJob(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative bg-[#F8FAFC] w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] shadow-2xl flex flex-col max-h-[96vh] overflow-hidden">
               <div className="p-8 text-center text-white relative shrink-0 pt-[calc(2rem+var(--safe-area-top,24px))]" style={{ background: getCityTheme(selectedJob.City).grad }}>
                  <button onClick={() => setSelectedJob(null)} className="absolute top-8 left-6 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-all"><X size={20} /></button>
                  <div className="text-[22px] font-[900] text-white mb-1 tracking-tight">
                    ✨ {toTitleCase((selectedJob.Name || (selectedJob.subjects?.split(',')[0] || 'Tutor') + ' Required').replace(/\s*[Jj]i\s*$/, '').replace(/\s*[Jj]i\s+/g, ' '))}
                  </div>
                  <div className="text-[11px] font-black bg-black/20 px-3 py-1 rounded-lg inline-block uppercase tracking-widest mt-1">Order ID: {selectedJob['Order ID']}</div>
               </div>
               <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-[calc(8rem+var(--safe-area-bottom,20px))]">
                  {/* Info List - 11 Lines Stacked with Solid Emojis */}
                  <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 divide-y divide-slate-50">
                      {[
                        { label: 'Job ID (Order ID)', value: `#${selectedJob['Order ID']}`, icon: '🆔', color: 'bg-amber-500', valColor: 'text-primary font-black' },
                        { label: 'Target Class / Board', value: selectedJob['Class / Board'] || (selectedJob.Class ? (selectedJob.Board ? `${selectedJob.Class} - ${selectedJob.Board}` : selectedJob.Class) : (selectedJob.Board || 'General')), icon: '📚', color: 'bg-blue-600' },
                        { label: 'Teaching Subjects', value: selectedJob.subjects || 'General', icon: '📖', color: 'bg-rose-500' },
                        { label: 'Tutor Gender Preference', value: selectedJob.Gender || 'Any Gender', icon: '👤', color: 'bg-indigo-500' },
                        { label: 'Monthly Tuition Fee', value: `₹${formatCurrency(selectedJob.Fee || '0')}`, icon: '💰', color: 'bg-emerald-600', valColor: 'text-emerald-600 font-black' },
                        { label: 'Class Duration (Daily)', value: selectedJob.duration || '1 Hr/Day', icon: '⏳', color: 'bg-purple-500' },
                        { label: 'Days per Week', value: selectedJob.days || 'Regular', icon: '📅', color: 'bg-orange-500' },
                        { label: 'Preferred Class Time', value: selectedJob.time || 'Flexible', icon: '🕒', color: 'bg-amber-400' },
                        { label: 'Student Address / Area', value: (selectedJob as any).residency || 'Student Home Address', icon: '📍', color: 'bg-rose-600' },
                        { label: 'Current City', value: selectedJob.City || 'N/A', icon: '🏙️', color: 'bg-emerald-500' },
                        { label: 'Job Posted Date', value: selectedJob['Updated Time'] || 'Recently', icon: '🗓️', color: 'bg-slate-400' }
                      ].map((item, idx) => (
                        <div key={idx} className="p-4 flex items-center gap-4">
                          <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-lg", item.color)}>
                            {item.icon}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.15em] mb-0.5">{item.label}</span>
                            <span className={cn("text-[13px] font-bold text-slate-900", item.valColor || "")}>{item.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Job Description (Extra) */}
                  <div className="p-5 bg-orange-50/50 rounded-3xl border border-dashed border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                       <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white shadow-sm"><FileText size={14} /></div>
                       <span className="text-[10px] font-black uppercase text-orange-600 tracking-widest">Job Description</span>
                    </div>
                    <p className="text-[12px] text-slate-700 font-medium leading-relaxed">{selectedJob.Notes || 'Professional tutor needed for home tuition.'}</p>
                  </div>

                  {/* Guidelines & Platform Policy - Unified White Card Style */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-2">
                       <div className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm"><CheckCircle size={12} /></div>
                       <span className="text-[10px] font-[1000] uppercase text-slate-900 tracking-widest">Platform Policy & Guidelines</span>
                    </div>
                    
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                      <div className="grid grid-cols-1 divide-y divide-slate-50">
                        {/* 1. Zero Registration Fee */}
                        <div className="p-4 flex items-start gap-4">
                           <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 text-lg shrink-0">✨</div>
                           <div className="space-y-0.5">
                              <h5 className="text-[11.5px] font-black uppercase text-emerald-700 tracking-tight leading-none">Zero Registration Fees</h5>
                              <p className="text-[10.5px] font-medium text-emerald-600/80 leading-snug">No upfront charges or hidden costs to join our elite network. 100% Free Signup.</p>
                           </div>
                        </div>

                        {/* 2. First Month Commission */}
                        <div className="p-4 flex items-start gap-4 bg-[#304B70]/5">
                           <div className="w-10 h-10 rounded-2xl bg-[#304B70] flex items-center justify-center text-white text-lg shadow-md shrink-0">💰</div>
                           <div className="space-y-0.5">
                              <h5 className="text-[11.5px] font-black uppercase text-[#304B70] tracking-tight leading-none">First-Month Commission</h5>
                              <p className="text-[10.5px] font-bold text-[#304B70] leading-snug">50% service fee is only collected AFTER you receive your first payment from the parent. 🤝</p>
                           </div>
                        </div>

                        {/* 3. Second Month Onwards */}
                        <div className="p-4 flex items-start gap-4">
                           <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 text-lg shrink-0">📈</div>
                           <div className="space-y-0.5">
                              <h5 className="text-[11.5px] font-black uppercase text-blue-800 tracking-tight leading-none">100% Earnings for You</h5>
                              <p className="text-[10.5px] font-medium text-blue-600/80 leading-snug">You deserve success. Keep 100% earnings from month 2. After 11 months, a small 25% renewal fee helps us sustain this community for you. ❤️🔄</p>
                           </div>
                        </div>

                        {/* 4. Trial Policy */}
                        <div className="p-4 flex items-start gap-4">
                           <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 text-lg shrink-0">🎁</div>
                           <div className="space-y-0.5">
                              <h5 className="text-[11.5px] font-black uppercase text-rose-800 tracking-tight leading-none">1 Free Trial Class</h5>
                              <p className="text-[10.5px] font-medium text-rose-600/80 leading-snug">To ensure a perfect match, one free trial demo is required for every new lead.</p>
                           </div>
                        </div>

                        {/* 5-7. Professional Guidelines */}
                        {[
                          { title: 'Selective Matching', desc: 'Selection depends on profile fit. Apply only for roles that match your expertise.', icon: '🎯' },
                          { title: 'Commitment & Reliability', desc: 'Ensure punctuality and avoid last-minute cancellations for demos.', icon: '⏰' },
                          { title: 'Ethical Conduct', desc: 'Communicate respectfully with parents and keep your profile updated.', icon: '👔' }
                        ].map((g, i) => (
                          <div key={i} className="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                             <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-lg shrink-0">{g.icon}</div>
                             <div className="space-y-0.5">
                                <h5 className="text-[11.5px] font-black uppercase text-slate-800 tracking-tight leading-none">{g.title}</h5>
                                <p className="text-[10.5px] font-medium text-slate-500 leading-snug">{g.desc}</p>
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
               </div>
               <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-white/80 backdrop-blur-md border-t border-slate-100 flex gap-2 sm:gap-3 pb-[calc(1rem+var(--safe-area-bottom,24px))]">
                  <a href="tel:9971969197" className="flex-1 py-3.5 sm:py-4 rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest text-center border-2 border-primary text-primary active:scale-95 transition-all">📞 Call</a>
                  <a 
                    href={`https://wa.me/919971969197?text=${encodeURIComponent(`Hi, I want to apply for Job Order ID: #${selectedJob['Order ID'] || (selectedJob as any).id || 'N/A'}`)}`}
                    target="_system"
                    className="flex-[1.8] py-3.5 sm:py-4 rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest text-center text-white shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2" 
                    style={{ background: 'linear-gradient(135deg, #FF1493 0%, #FF69B4 100%)' }}
                  >
                    💬 Apply Now
                  </a>
               </div>            </motion.div>
          </div>
        )}

        {selectedTutor && (
          <div className="fixed inset-0 z-[15000] flex items-end sm:items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTutor(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }} 
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative bg-[#F8FAFC] w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] shadow-2xl flex flex-col max-h-[96vh] overflow-hidden"
            >
               <div className="p-8 text-center text-white relative shrink-0 pt-[calc(2rem+var(--safe-area-top,24px))]" style={{ background: 'linear-gradient(135deg, #4ECDC4 0%, #2563EB 100%)' }}>
                  <button onClick={() => setSelectedTutor(null)} className="absolute top-8 left-6 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-all"><X size={20} /></button>
                  <div className="text-[22px] font-[900] text-white mb-1 tracking-tight">
                    ✨ {toTitleCase(selectedTutor.Name || 'Premium Tutor')}
                  </div>
                  <div className="flex items-center justify-center gap-3 mt-1">
                    <div className="text-[11px] font-[600] opacity-80 uppercase tracking-widest">🆔 Tutor ID: {selectedTutor['Tutor ID']}</div>
                  </div>

                  {/* Status & Verification Badges */}
                  <div className="flex items-center justify-center gap-6 mt-4">
                    <div className="flex items-center gap-1.5">
                      {selectedTutor.Verified === 'Yes' ? (
                        <>
                          <div className="relative">
                            <CheckCircle size={20} className="text-white fill-blue-500" />
                            <Check size={10} strokeWidth={4} className="absolute inset-0 m-auto text-white" />
                          </div>
                          <span className="text-[15px] font-[800] text-white tracking-tight">Verified</span>
                        </>
                      ) : (
                        <>
                          <div className="relative">
                            <CheckCircle size={20} className="text-white fill-slate-400" />
                            <X size={10} strokeWidth={4} className="absolute inset-0 m-auto text-white" />
                          </div>
                          <span className="text-[15px] font-[800] text-white/70 tracking-tight">Not Verified</span>
                        </>
                      )}
                    </div>

                    {selectedTutor.Status && (
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm transition-all",
                          selectedTutor.Status === 'Active' ? "bg-[#FFD700]" : 
                          selectedTutor.Status === 'Not Available' ? "bg-slate-400" : "bg-rose-500"
                        )}>
                           <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                              {selectedTutor.Status === 'Active' ? (
                                <Check size={10} className="text-[#FFD700]" strokeWidth={4} />
                              ) : selectedTutor.Status === 'Not Available' ? (
                                <Clock size={10} className="text-slate-400" strokeWidth={3} />
                              ) : (
                                <X size={10} className="text-rose-500" strokeWidth={4} />
                              )}
                           </div>
                           <span className={cn(
                             "text-[11px] font-black uppercase tracking-tighter",
                             selectedTutor.Status === 'Active' ? "text-[#856404]" : "text-white"
                           )}>
                             {selectedTutor.Status === 'Not Available' ? 'Busy' : selectedTutor.Status}
                           </span>
                        </div>
                        <span className="text-[15px] font-[800] text-white tracking-tight">Status</span>
                      </div>
                    )}
                  </div>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-[calc(8rem+var(--safe-area-bottom,20px))]">
                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <DetailStat emoji="🎓" label="Qualification" value={selectedTutor['Qualification(s)']?.split(',')[0] || 'Graduate'} color="bg-purple-600" />
                    <DetailStat emoji="📚" label="Experience" value={selectedTutor.Experience || '1-3 Years'} color="bg-emerald-600" />
                    <DetailStat emoji="🏫" label="Class Group" value={selectedTutor['Preferred Class Group'] || 'All Classes'} color="bg-blue-600" />
                    <DetailStat emoji="👩‍🏫" label="School Teacher" value={selectedTutor['School Exp.'] || 'No'} color="bg-orange-500" />
                  </div>

                  {/* Expert Subjects Section (Full Width) */}
                  <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-xl bg-rose-500 flex items-center justify-center text-white shadow-sm"><BookText size={16} /></div>
                       <span className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Expert Subjects</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {(selectedTutor['Preferred Subject(s)'] || 'General').split(/[;,]/).map((s, i) => (
                         <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-700">📖 {s.trim()}</span>
                       ))}
                    </div>
                  </div>

                  {/* Personal & Professional Details Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
                      <div className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Age / Gender</div>
                      <div className="text-[13px] font-black text-slate-900">🎂 {selectedTutor.Age || '25+'} / {selectedTutor.Gender || 'Any'}</div>
                    </div>
                    <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
                      <div className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Own Vehicle</div>
                      <div className="text-[13px] font-black text-slate-900">🚗 {selectedTutor['Have own Vehicle'] || 'No'}</div>
                    </div>
                  </div>

                  {/* About Me Section */}
                  <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-3">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-sm"><Info size={16} /></div>
                       <span className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">About Me</span>
                    </div>
                    <p className="text-[13px] text-slate-700 font-medium leading-relaxed">
                       {(() => {
                         const about = selectedTutor.About || "Dedicated educator committed to student success.";
                         const lastDot = about.lastIndexOf('.');
                         return lastDot !== -1 ? about.substring(0, lastDot + 1) : about;
                       })()}
                    </p>
                  </div>

                  {/* Communication */}
                  <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-3">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-sm"><MessageCircle size={16} /></div>
                       <span className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Communication</span>
                    </div>
                    <p className="text-[12px] font-bold text-slate-700 leading-snug">
                       {selectedTutor['Mode of Teaching']?.includes('English') ? 'Fluent: Teaches the entire session strictly in English.' : 'Bilingual: Comfortable in both English and Hindi.'}
                    </p>
                  </div>

                  {/* Preferred City */}
                  <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-sm"><MapPin size={16} /></div>
                       <span className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Preferred City</span>
                    </div>
                    <div className="text-[13px] font-black text-slate-800">{selectedTutor['Preferred City'] || 'India'}</div>
                  </div>

                  {/* Teaching Localities (Location) */}
                  <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-xl bg-rose-500 flex items-center justify-center text-white shadow-sm"><MapPin size={16} /></div>
                       <span className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Teaching Localities</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {(selectedTutor['Preferred Location(s)'] || selectedTutor['Address'] || 'Citywide').split(/[;,]/).map((l, i) => {
                         const cleanLocality = l.toString().split('-')[0].trim();
                         return (
                           <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-700">📍 {cleanLocality}</span>
                         );
                       })}
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
                       <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-sm"><Sun size={16} /></div>
                          <span className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Available Days</span>
                       </div>
                       <div className="flex flex-wrap gap-2">
                          {(selectedTutor['Mode of Teaching'] || 'Monday to Friday').split(/[;,]/).map((d, i) => (
                            <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-700">📅 {d.trim()}</span>
                          ))}
                       </div>
                    </div>

                    <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
                       <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-sm"><Clock size={16} /></div>
                          <span className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Preferred Time</span>
                       </div>
                       <div className="flex flex-wrap gap-2">
                          {(selectedTutor['Preferred Time'] || 'Flexible').split(/[;,]/).map((t, i) => (
                            <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-700">🕐 {t.trim()}</span>
                          ))}
                       </div>
                    </div>
                  </div>

                  {/* Update Time */}
                  <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest pt-4">
                     <Clock size={12} /> Last Updated: {selectedTutor['Record Added']}
                  </div>
               </div>

               <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-slate-100 flex gap-3 pb-[calc(1.5rem+var(--safe-area-bottom,24px))]">
                  <a href="tel:9971969197" className="flex-1 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-center border-2 border-primary text-primary active:scale-95 transition-all">📞 Call</a>
                  <a 
                    href={`https://wa.me/919971969197?text=${encodeURIComponent(`Hi, I want to book a free demo with Tutor ID: #${selectedTutor['Tutor ID'] || (selectedTutor as any).id || 'N/A'}`)}`}
                    target="_system"
                    className="flex-[1.5] py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-center bg-primary text-white shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    💬 Book a Free Demo
                  </a>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showProfileSetup && (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center p-6">
          <div onClick={() => setShowProfileSetup(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div className="relative bg-white w-full max-w-[340px] rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
             <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-900">Profile Setup</h3>
                <button onClick={() => setShowProfileSetup(false)} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm transition-all"><X size={16} /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-[1000] uppercase text-slate-900 ml-1 tracking-[0.2em]">I'm here as...</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'parent', label: 'Parent', icon: '👨‍👩‍👧‍👦', desc: 'Looking for a Tutor' },
                        { id: 'teacher', label: 'Teacher', icon: '👩‍🏫', desc: 'Looking for Jobs' }
                      ].map(type => (
                        <button 
                          key={type.id} 
                          onClick={() => { 
                            playTapSound(); 
                            const newType = type.id as UserType;
                            setUserType(newType); 
                            localStorage.setItem('userType', type.id);
                            setActiveTab('home');
                            setTutorStatus(null);
                            setIsTutorFetched(false);

                            // Clear Details for fresh start in new role
                            setUserName(null);
                            setUserGender('All');
                            setUserCity('Ghaziabad');
                            setUserClasses([]);
                            
                            localStorage.removeItem('userName');
                            localStorage.removeItem('userGender');
                            localStorage.setItem('userCity', 'Ghaziabad');
                            localStorage.removeItem('userClasses');
                          }} 
                          className={cn(
                            "py-5 rounded-[24px] border-2 flex flex-col items-center gap-1 transition-all relative overflow-hidden", 
                            userType === type.id ? "border-primary bg-primary/5 text-primary shadow-inner" : "border-slate-100 text-slate-400 bg-white"
                          )}
                        >
                          <span className="text-2xl mb-1">{type.icon}</span>
                          <span className="text-[10px] font-black uppercase tracking-tight">{type.label}</span>
                          <span className="text-[8px] font-bold opacity-60">{type.desc}</span>
                          {userType === type.id && (
                            <motion.div layoutId="role-check" className="absolute top-2 right-2 w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center">
                              <Check size={10} strokeWidth={4} />
                            </motion.div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={userType || 'initial'} 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-5"
                    >
                      {userType === 'teacher' && (
                        <div className="space-y-4">
                           <div className="grid grid-cols-2 gap-2">
                             <button onClick={() => { playTapSound(); setTutorStatus('registered'); }} className={cn("py-3 rounded-xl border-2 font-[900] uppercase text-[9px] transition-all", tutorStatus === 'registered' ? "border-[#572149] bg-[#572149]/5 text-[#572149]" : "border-slate-100 text-slate-400 bg-white")}>Already Registered</button>
                             <button onClick={() => { playTapSound(); setTutorStatus('new'); setIsTutorFetched(false); }} className={cn("py-3 rounded-xl border-2 font-[900] uppercase text-[9px] transition-all", tutorStatus === 'new' ? "border-[#572149] bg-[#572149]/5 text-[#572149]" : "border-slate-100 text-slate-400 bg-white")}>I'm New</button>
                           </div>

                           {tutorStatus === 'registered' && !isTutorFetched && (
                             <div className="bg-slate-900 rounded-[28px] p-6 space-y-4 shadow-xl">
                               <div className="space-y-1.5">
                                 <label className="text-[10px] font-black uppercase text-white/40 ml-1 tracking-widest">Verify Identity</label>
                                 <div className="relative">
                                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                                    <input 
                                      type="text" 
                                      value={tutorIdInput} 
                                      onChange={(e) => setTutorIdInput(e.target.value)} 
                                      placeholder="Enter your Tutor ID" 
                                      className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-10 pr-12 text-white font-bold placeholder:text-white/20 outline-none focus:border-primary/50 transition-all text-sm" 
                                    />
                                    <button 
                                      onClick={fetchTutorDetails} 
                                      disabled={isFetchingTutor || !tutorIdInput} 
                                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center active:scale-90 transition-all disabled:opacity-30 shadow-lg"
                                    >
                                      {isFetchingTutor ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} strokeWidth={3} />}
                                    </button>
                                 </div>
                               </div>
                               {tutorFetchError && (
                                 <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1.5 text-rose-400 text-[9px] font-bold px-1">
                                    <AlertCircle size={10} /> {tutorFetchError}
                                 </motion.div>
                               )}
                               <div className="space-y-2">
                                 <p className="text-[8.5px] font-medium text-white/30 px-1 leading-relaxed">Entering your ID will automatically fill your profile details from our records.</p>
                                 <button onClick={() => { playTapSound(); setActiveTab('support'); setShowProfileSetup(false); }} className="text-[8.5px] font-black text-primary uppercase tracking-widest px-1 hover:underline">Don't remember your Tutor ID?</button>
                               </div>
                             </div>
                           )}

                           {tutorStatus === 'new' && (
                              <div className="bg-gradient-to-br from-[#572149] to-[#3a1631] rounded-[28px] p-6 text-white space-y-4 shadow-xl">
                                 <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10"><Sparkles size={20} className="text-amber-300 fill-amber-300" /></div>
                                    <div className="min-w-0">
                                       <h4 className="text-[13px] font-black tracking-tight truncate">Become an Elite Tutor</h4>
                                       <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest leading-none mt-0.5">Join the network</p>
                                    </div>
                                 </div>
                                 <p className="text-[10.5px] font-medium leading-relaxed opacity-90">Start your journey with India's most prestigious tuition network. Click below to register.</p>
                                 <button onClick={() => { playTapSound(); setFormType('teacher'); setShowFormModal(true); }} className="w-full bg-white text-[#572149] py-4 rounded-xl font-[1000] text-[10px] uppercase tracking-[0.2em] shadow-2xl active:scale-[0.98] transition-all">Join the Elite</button>
                              </div>
                           )}
                        </div>
                      )}

                      {(userType === 'parent' || (userType === 'teacher' && tutorStatus === 'registered' && isTutorFetched)) && (
                        <>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">{userType === 'parent' ? "Student's Full Name" : "Full Name"}</label>
                             <input 
                               type="text" 
                               value={userName || ''} 
                               onChange={(e) => { if (!isTutorFetched) { setUserName(e.target.value); localStorage.setItem('userName', e.target.value); } }} 
                               readOnly={isTutorFetched}
                               placeholder={userType === 'parent' ? "e.g. Aryan Sharma" : "e.g. Deepak Sharma"} 
                               className={cn(
                                 "w-full p-4 rounded-2xl border font-bold outline-none transition-all text-sm",
                                 isTutorFetched ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed" : "bg-slate-50 border-slate-100 focus:border-primary text-slate-700"
                               )}
                             />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">{userType === 'parent' ? "Tutor's Gender Preference" : "My Gender"}</label>
                            <div className="grid grid-cols-3 gap-2">
                              {['Male', 'Female', 'Any'].map(gender => (
                                <button 
                                  key={gender} 
                                  disabled={isTutorFetched}
                                  onClick={() => { playTapSound(); setUserGender(gender); localStorage.setItem('userGender', gender); }} 
                                  className={cn(
                                    "py-3.5 rounded-xl border font-black uppercase text-[10px] transition-all", 
                                    userGender === gender ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-400 bg-white",
                                    isTutorFetched && userGender !== gender && "opacity-30 grayscale"
                                  )}
                                >
                                  {gender}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">{userType === 'parent' ? "City where you need Service?" : "Preferred City"}</label>
                            <div className="relative group">
                              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                              <select 
                                value={userCity} 
                                disabled={isTutorFetched}
                                onChange={(e) => { 
                                  const newCity = e.target.value;
                                  setUserCity(newCity); 
                                  setCityFilter(newCity.toLowerCase() === 'all' ? 'all' : newCity.toLowerCase());
                                  localStorage.setItem('userCity', newCity); 
                                }} 
                                className={cn(
                                  "w-full border rounded-2xl p-4 pl-10 text-sm font-bold outline-none transition-all appearance-none",
                                  isTutorFetched ? "bg-slate-100 border-slate-200 text-slate-500" : "bg-slate-50 border-slate-100 focus:border-primary focus:bg-white text-slate-700"
                                )}
                              >
                                <option value="All">0. All Cities (Everywhere)</option>
                                {CITIES_LIST.map((city, i) => <option key={city} value={city}>{i + 1}. {city}</option>)}
                              </select>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">{userType === 'parent' ? "Class Group Preference" : "Class Group"}</label>
                            <div className="grid grid-cols-2 gap-2">
                              {['Class I to V', 'Class VI to VIII', 'Class IX to X', 'Class XI to XII'].map(cls => (
                                <button 
                                  key={cls} 
                                  disabled={isTutorFetched}
                                  onClick={() => {
                                    playTapSound();
                                    const next = userClasses.includes(cls) ? userClasses.filter(x => x !== cls) : [...userClasses, cls];
                                    setUserClasses(next);
                                    localStorage.setItem('userClasses', JSON.stringify(next));
                                  }} 
                                  className={cn(
                                    "px-3 py-3 rounded-xl border font-bold text-[9px] transition-all", 
                                    userClasses.includes(cls) ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-400 bg-white",
                                    isTutorFetched && !userClasses.includes(cls) && "opacity-30"
                                  )}
                                >
                                  {cls}
                                </button>
                              ))}
                            </div>
                          </div>

                          {isTutorFetched && (
                            <div className="pt-2">
                              <button 
                                onClick={() => { playTapSound(); setFormType('teacher'); setShowFormModal(true); }}
                                className="w-full py-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                              >
                                 <Edit3 size={14} /> Update my details
                              </button>
                              <p className="text-center text-[8px] font-medium text-slate-400 mt-2 px-4 leading-snug italic">Fields are locked for verified accounts. Tap above to request an update.</p>
                            </div>
                          )}
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                     {currentUser ? (
                       <div className="space-y-3">
                         <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                           {currentUser.photoURL ? (
                             <img src={currentUser.photoURL} alt="User" className="w-10 h-10 rounded-full border border-white shadow-sm" />
                           ) : (
                             <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><LucideUser size={20} /></div>
                           )}
                           <div className="min-w-0">
                             <div className="text-[11px] font-black text-slate-900 truncate">{currentUser.displayName || 'Signed In'}</div>
                             <div className="text-[9px] font-bold text-slate-400 truncate">{currentUser.email}</div>
                           </div>
                         </div>
                         {isAdminUser && (
                           <button onClick={() => { playTapSound(); setActiveTab('admin'); setShowProfileSetup(false); }} className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all">
                             <Settings size={16} /> Admin Panel
                           </button>
                         )}
                         <button onClick={() => { playTapSound(); auth.signOut(); }} className="w-full bg-rose-50 text-rose-500 p-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all">
                           <LogOut size={16} /> Sign Out
                         </button>
                       </div>
                     ) : null}
                   </div>

                   {(userType === 'parent' || (userType === 'teacher' && isTutorFetched)) && (
                     <button onClick={() => { playTapSound(); setShowProfileSetup(false); }} className="w-full bg-primary text-white p-4 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl active:scale-95 transition-all mt-6">Save & Close</button>
                   )}

                   <div className="text-[7px] font-black text-slate-300 text-center uppercase tracking-[0.3em] pt-8 pb-2">DoAble India Network • v1.13.0</div>                   
                   {/* FCM Token Debug Section */}
                   <div className="px-4 pb-4">
                     <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-2">
                       <div className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Your FCM Token (iOS Debug)</div>
                       <div className="text-[9px] font-mono text-slate-600 break-all bg-white p-2 rounded border border-slate-100 select-all">
                         {localStorage.getItem('fcmToken') || 'Token not registered yet...'}
                       </div>
                       <button 
                         onClick={() => {
                           const token = localStorage.getItem('fcmToken');
                           if (token) {
                             navigator.clipboard.writeText(token);
                             alert('Token copied to clipboard!');
                           }
                         }}
                         className="text-[9px] font-bold text-primary flex items-center gap-1"
                       >
                         <Check size={10} /> Copy Full Token
                       </button>
                     </div>
                   </div>
                </div>
             </div>
          </div>
        )}

      {showFormModal && (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4">
          <div onClick={() => setShowFormModal(false)} className="absolute inset-0 bg-slate-900/60" />
          <div className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[85vh]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50"><h3 className="text-lg font-black uppercase">{formType === 'teacher' ? 'Tutor Registration' : 'Requirement Details'}</h3><button onClick={() => setShowFormModal(false)} className="p-3 bg-white rounded-2xl text-slate-400 shadow-sm"><X size={20} strokeWidth={3} /></button></div>
            <div className="flex-1 overflow-y-auto">
              <iframe 
                className="w-full h-full min-h-[600px] border-none" 
                src={formType === 'teacher' 
                  ? 'https://forms.doableindia.com/info2701/form/UpdateForm/formperma/5q6-EFWKiWGtqhyYNfjqMGyCYXXst3OOPqOmQCD7yT8?zf_enablecamera=true' 
                  : 'https://forms.doableindia.com/info2701/form/ShareRequirement/formperma/Y-6ujBL2ntI_ufnw8JPcHpyFOAGHButgY6SigoCfs6o'
                } 
                allow={formType === 'teacher' ? "camera;" : "geolocation;"}
                allowFullScreen={formType !== 'teacher'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NavButton({ active, onClick, icon, label, activeColor, activeBg, inactiveColor, inactiveBg }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; activeColor: string; activeBg: string; inactiveColor: string; inactiveBg: string }) {
  return (
    <button onClick={onClick} className={cn("flex-1 flex flex-col items-center gap-1 py-1.5 rounded-full transition-all duration-300 active:scale-95 mx-0.5", active ? activeBg + " " + activeColor + " shadow-lg scale-105" : inactiveBg + " " + inactiveColor + " opacity-60")}>
      {icon}<span className="text-[7px] font-[1000] tracking-tight">{label}</span>
    </button>
  );
}
