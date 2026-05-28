import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, MapPin, Loader2, Home as HomeIcon, FileText, User as LucideUser, Sparkles, BookOpen, GraduationCap, CheckCircle, LogOut, Settings, Edit3, Save, Bell, ChevronRight, Share2, Filter, X, MessageSquare, ExternalLink, Zap, ArrowRight, Navigation, Check, Sun, Cloud, Moon, Briefcase, BookText, ChevronDown, CreditCard, Heart, Volume2, Play, Info, Clock, MessageCircle, Calendar, Globe, ShieldCheck, TrendingUp, Hash, AlertCircle, Mail, Lock, Camera, Phone, Plus, Trash2, BadgeCheck } from 'lucide-react';
import { collection, onSnapshot, query, where, orderBy, limit, addDoc, serverTimestamp, doc, getDoc, getDocs, setDoc, getDocsFromServer, enableNetwork } from 'firebase/firestore';
import { db, auth, auth as firebaseAuth } from './firebase';
import { handleFirestoreError, OperationType } from './lib/firestore-errors';
import { User as FirebaseUser, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword, createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
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
import { cn, getCityTheme, formatCurrency, getCityPhone, toTitleCase, getJobId, getTutorId, openWhatsApp, cleanValue, saveToLargeStorage, getFromLargeStorage } from './utils';
import { 
  CITIES_LIST, 
  CLASSES_LIST,
  CLASS_SUBJECTS_DATA,
  CLASS_GROUP_MAPPING,
  CITY_TO_LOCATIONS_DATA} from './constants';

// ─── Dynamic Font Scaling ──────────────────────────────────────────
function getDynamicFontSize(text: string, baseSize: number = 14): string {
  if (!text) return `${baseSize}px`;
  const len = text.length;
  if (len < 20) return `${baseSize}px`;
  if (len < 40) return `${baseSize - 2}px`;
  if (len < 60) return `${baseSize - 3}px`;
  return `${baseSize - 4}px`;
}

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

const QUALIFICATIONS_LIST = [
  "B.Arch", "B.Com", "B.Ed", "B.LLB", "B.Lib", "B.Ped", "B.Pharma", "B.Sc", "B.Tech", "BA", "BBA", "BBM", "BCA", "BDS", "BFA", "BHM", "BJ", "BPT", "CA", "CFA", "CS", "D.Ed", "D.El.Ed", "DM", "DNB", "Ed.D.", "ICWA", "LLB", "LLM", "M.Arch", "M.Com", "M.Ed", "M.Ped", "M.Pharma", "M.Sc", "M.Tech", "MA", "MBA", "MBBS", "MCA", "MD", "MDS", "MS", "NTT", "PGDCA", "PGDM", "Ph.D."
];

const EXPERIENCE_LIST = [
  "Less than 1 Year",
  "1 to 3 Years",
  "3 to 5 Years",
  "5 to 10 Years",
  "More than 10 Years"
];

const DAYS_LIST = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_LIST = [
  '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM',
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM'
];

export default function App() {
  const [leads, setLeads] = useState<JobLead[]>([]);
  const [firestoreLeads, setFirestoreLeads] = useState<JobLead[]>([]);
  const [showSelectionDrawer, setShowSelectionDrawer] = useState<{
    type: 'qualification' | 'experience' | 'classGroup' | 'subjects' | 'localities' | 'days' | 'time' | null;
    title: string;
    options: string[];
    selected: string[];
    isMulti: boolean;
  } | null>(null);

  const handleSelection = (value: string) => {
    if (!showSelectionDrawer) return;
    const { type, isMulti, selected } = showSelectionDrawer;
    playTapSound();

    if (isMulti) {
      const next = selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value];
      setShowSelectionDrawer({ ...showSelectionDrawer, selected: next });
      
      if (type === 'qualification' || type === 'qualifications') { setUserQualifications(next); localStorage.setItem('userQualifications', JSON.stringify(next)); }
      if (type === 'subjects') { setUserSubjects(next); localStorage.setItem('userSubjects', JSON.stringify(next)); }
      if (type === 'localities') { setUserLocalities(next); localStorage.setItem('userLocalities', JSON.stringify(next)); }
      if (type === 'days') { setUserDays(next.join(', ')); localStorage.setItem('userDays', next.join(', ')); }
      if (type === 'time') { setUserTime(next.join(', ')); localStorage.setItem('userTime', next.join(', ')); }
    } else {
      const next = [value];
      setShowSelectionDrawer(null); // Close on single select

      if (type === 'experience') { setUserExperience(value); localStorage.setItem('userExperience', value); }
      if (type === 'classGroup') { 
        setUserClasses(next); 
        localStorage.setItem('userClasses', JSON.stringify(next)); 
        setUserSubjects([]); // Reset subjects on class change
        localStorage.setItem('userSubjects', JSON.stringify([]));
      }
    }
  };

  const [tutors, setTutors] = useState<TutorProfile[]>([]);

  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [resetPin, setResetPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setRetypePassword] = useState('');
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [customUser, setCustomUser] = useState<any>(JSON.parse(localStorage.getItem('customUser') || 'null'));
  const activeUser = currentUser || customUser;

  const [deleteProfileText, setDeleteProfileText] = useState('');
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);

  const handleLogout = () => {
    playTapSound();
    auth.signOut();
    setCustomUser(null);
    
    // Clear All User Data
    localStorage.removeItem('customUser');
    localStorage.removeItem('userType');
    localStorage.removeItem('userName');
    localStorage.removeItem('userGender');
    localStorage.removeItem('userCity');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('aboutMe');
    localStorage.removeItem('userDob');
    localStorage.removeItem('userAge');
    localStorage.removeItem('userQualifications');
    localStorage.removeItem('userExperience');
    localStorage.removeItem('isSchoolTeacher');
    localStorage.removeItem('hasVehicle');
    localStorage.removeItem('userSubjects');
    localStorage.removeItem('userLocalities');
    localStorage.removeItem('userClasses');
    localStorage.removeItem('tutorId');
    localStorage.removeItem('tutorStatus');
    localStorage.removeItem('isVerified');

    setUserType(null);
    setUserName(null);
    setUserGender('All');
    setUserCity('All');
    setUserPhone('');
    setAboutMe('');
    setUserDob('');
    setUserAge('');
    setUserQualifications([]);
    setUserExperience('');
    setIsSchoolTeacher('No');
    setHasVehicle('No');
    setUserSubjects([]);
    setUserLocalities([]);
    setUserClasses([]);
    setTutorId(null);
    setIsTutorFetched(false);

    setShowOnboarding(true);
    setAuthMode('signin');
  };

  const handleDeleteProfile = async () => {
    if (!window.confirm("Are you absolutely sure? This will delete your profile completely. This action cannot be undone.")) return;

    setIsDeletingProfile(true);
    try {
      const isNative = Capacitor.isNativePlatform();
      const apiUrl = isNative ? 'https://doableindia.com/app-sys/api_copy.php' : '/api-crm/api_copy.php';

      const tutorId = localStorage.getItem('tutorId');
      
      const payload: any = {
        action: 'delete',
        email: activeUser?.email
      };
      if (tutorId) {
         payload['tutor_id'] = tutorId;
      }

      if (isNative) {
        await CapacitorHttp.post({
          url: apiUrl,
          headers: {
            'Content-Type': 'application/json'
          },          data: payload
        });
      } else {
        await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },          body: JSON.stringify(payload)
        });
      }
      
      // Attempt to delete Firebase Auth user if it's a current FirebaseUser
      if (currentUser) {
        try {
          await deleteUser(currentUser);
        } catch (e: any) {
          console.warn("Could not delete Firebase auth directly: ", e.message);
        }
      }

      setActiveToast({ title: 'Profile Deleted 🗑️', body: 'Your profile has been removed successfully.' });
      handleLogout();
    } catch (error: any) {
      console.error(error);
      setActiveToast({ title: 'Delete Failed ❌', body: error.message });
    } finally {
      setIsDeletingProfile(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!activeUser?.email) return;
    setIsUpdatingProfile(true);

    try {
      const isNative = Capacitor.isNativePlatform();
      
      if (userType === 'teacher') {
        const url = 'https://doableindia.com/app-sys/api_copy.php';
        // Map frontend state to EXACT 24 database columns provided by user
        let tutorId = localStorage.getItem('tutorId') || '';
        if (tutorId === 'NEW_USER' || tutorId === 'NEW') tutorId = ''; // Clean legacy bad data

        const profileData: any = {
          action: 'upsert',
          tutor_id: tutorId,
          name: userName || 'Tutor',
          email: activeUser.email,
          phone: userPhone,
          gender: userGender,
          age: userAge,
          dob: userDob,
          qualification: userQualifications.join(', '),
          experience: userExperience,
          school_teacher: isSchoolTeacher === 'Yes' ? 'Yes' : 'No',
          days: userDays,
          time: userTime,
          class_group: userClasses.join(', '),
          subjects: userSubjects.join(', '),
          city: userCity,
          location: userLocalities.join(', '),
          have_vehicle: hasVehicle === 'Yes' ? 'Yes' : 'No',
          communication: userCommunication,
          fee: userFee,
          about: aboutMe,
          status: localStorage.getItem('tutorStatus') || 'Active',
          verified: localStorage.getItem('isVerified') || 'No',
          created_time: new Date().toISOString().split('T')[0]
        };

        console.log(`Syncing profile to ${url} with clean schema (omitting photo for stability)...`, profileData);
        let data;
        if (isNative) {
          try {
            const response = await CapacitorHttp.post({
              url: url,
              headers: { 
                'Content-Type': 'application/json'
              },
              data: profileData
            });
            console.log('📡 Profile sync native response:', response.status, response.data);
            
            if (response.status >= 400) {
               throw new Error(`Server Error (${response.status})`);
            }
            
            if (!response.data) {
               throw new Error('Empty response from server');
            }
            
            data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
          } catch (nativeErr: any) {
             console.error('Native Request Failed:', nativeErr);
             throw new Error(nativeErr.message || 'Network request failed');
          }
        } else {
          const params = new URLSearchParams();
          Object.entries(profileData).forEach(([key, val]) => {
            params.append(key, String(val));
          });

          const response = await fetch(url, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
          });
          
          if (!response.ok) {
             const text = await response.text();
             console.error("SERVER RAW ERROR (Tutor Sync):", text);
             throw new Error(`HTTP Error (${response.status})`);
          }
          
          const text = await response.text();
          data = text ? JSON.parse(text) : {};
          console.log('🌐 Profile sync web response:', data);
        }
        console.log('Profile sync response:', data);
        
        if (data && (data.status === 'success' || data.message?.includes('success'))) {
          const newId = data.tutor_id || data.id;
          if (newId) {
            localStorage.setItem('tutorId', newId.toString());
            setTutorId(newId.toString());
          }
          loadData();
          setActiveToast({ title: 'Success ✅', body: 'Profile updated successfully!' });
          setShowProfileSetup(false);
          setTimeout(() => setActiveToast(null), 4000);
        } else {
          setActiveToast({ title: 'Update Failed ❌', body: data?.message || 'Server error occurred' });
          setTimeout(() => setActiveToast(null), 5000);
        }
      } 
      else if (userType === 'parent') {
        const url = 'https://doableindia.com/app-sys/api.php';
        // Map frontend state to lowercase database column names
        const parentData: any = {
          action: 'upsert',
          order_id: activeUser.email, 
          name: userName,
          class: userClasses.join(', '),
          subjects: userSubjects.join(', '),
          city: userCity,
          gender: userGender,
          address: userAddress,
          board: userBoard,
          mode: userMode,
          preferred_time: userTime,
          days: userDays,
          duration: userDuration,
          fee: userFee,
          notes: aboutMe,
          created_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
          locations: userLocalities.join(', ')
        };

        console.log(`Syncing parent profile to ${url}...`, parentData);
        let data;
        if (isNative) {
          const response = await CapacitorHttp.post({
            url: url,
            headers: {
              'Content-Type': 'application/json'
            },            data: parentData
          });
          console.log('📡 Parent profile sync native response:', response.status, response.data);
          data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        } else {
          const params = new URLSearchParams();
          Object.entries(parentData).forEach(([key, val]) => {
            params.append(key, String(val));
          });

          const response = await fetch(url, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
          });
          
          if (!response.ok) {
             const text = await response.text();
             console.error("SERVER RAW ERROR (Parent Sync):", text);
             throw new Error(`HTTP Error (${response.status})`);
          }
          
          const text = await response.text();
          data = text ? JSON.parse(text) : {};
          console.log('🌐 Parent profile sync web response:', data);
        }
        console.log('Parent profile sync response:', data);
        
        if (data && (data.status === 'success' || data.message?.includes('success'))) {
          loadData(); // Run in background
          setActiveToast({ title: 'Success ✅', body: 'Your profile has been updated!' });
          setShowProfileSetup(false);
          setTimeout(() => setActiveToast(null), 4000);
        } else {
          setActiveToast({ title: 'Update Failed ❌', body: data?.message || 'Server error occurred' });
          setTimeout(() => setActiveToast(null), 5000);
        }
      }
    } catch (error: any) {
      console.error('Error syncing profile:', error);
      setActiveToast({ title: 'Connection Error', body: error.message || 'Please check your internet connection.' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const [userCity, setUserCity] = useState<string>(localStorage.getItem('userCity') || 'Delhi');
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('userName'));
  const [tutorId, setTutorId] = useState<string | null>(localStorage.getItem('tutorId'));
  const [userGender, setUserGender] = useState<string | null>(localStorage.getItem('userGender') || 'All');
  const [userType, setUserType] = useState<UserType | null>(localStorage.getItem('userType') as UserType);
  const [userClasses, setUserClasses] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('userClasses') || '[]');
      return Array.isArray(saved) ? saved.filter(c => c && c.trim() !== '') : [];
    } catch { return []; }
  });
  const [userSubjects, setUserSubjects] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('userSubjects') || '[]');
      return Array.isArray(saved) ? saved.filter(s => s && s.trim() !== '') : [];
    } catch { return []; }
  });
  const [userLocalities, setUserLocalities] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('userLocalities') || '[]');
      return Array.isArray(saved) ? saved.filter(l => l && l.trim() !== '') : [];
    } catch { return []; }
  });
  const [userPhone, setUserPhone] = useState<string>(localStorage.getItem('userPhone') || '');
  const [userDob, setUserDob] = useState<string>(localStorage.getItem('userDob') || '');
  const [userAge, setUserAge] = useState<string>(localStorage.getItem('userAge') || '');
  const [userQualifications, setUserQualifications] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('userQualifications') || '[]');
      return Array.isArray(saved) ? saved.filter(q => q && q.trim() !== '') : [];
    } catch { return []; }
  });
  const [userExperience, setUserExperience] = useState<string>(localStorage.getItem('userExperience') || '');
  const [isSchoolTeacher, setIsSchoolTeacher] = useState<string>(localStorage.getItem('isSchoolTeacher') || 'No');
  const [hasVehicle, setHasVehicle] = useState<string>(localStorage.getItem('hasVehicle') || 'No');
  const [aboutMe, setAboutMe] = useState<string>(localStorage.getItem('aboutMe') || '');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(localStorage.getItem('userPhoto'));
  
  // Parent Specific States
  const [userBoard, setUserBoard] = useState<string>(localStorage.getItem('userBoard') || 'CBSE');
  const [userMode, setUserMode] = useState<string>(localStorage.getItem('userMode') || 'Home Tuition');
  const [userCommunication, setUserCommunication] = useState<string>(localStorage.getItem('userCommunication') || '');
  const [userAddress, setUserAddress] = useState<string>(localStorage.getItem('userAddress') || '');
  const [userDays, setUserDays] = useState<string>(localStorage.getItem('userDays') || '');
  const [userTime, setUserTime] = useState<string>(localStorage.getItem('userTime') || '');
  const [userDuration, setUserDuration] = useState<string>(localStorage.getItem('userDuration') || '');
  const [userFee, setUserFee] = useState<string>(localStorage.getItem('userFee') || '');

  // Calculate age from DOB
  useEffect(() => {
    if (userDob) {
      const birthDate = new Date(userDob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      const ageStr = age.toString();
      setUserAge(ageStr);
      localStorage.setItem('userAge', ageStr);
    }
  }, [userDob]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        alert("Image is too large. Please select an image under 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfilePhoto(base64String);
        localStorage.setItem('userPhoto', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

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
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem('userType'));
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot' | 'reset'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [tutorStatus, setTutorStatus] = useState<'registered' | 'new' | null>(null);
  
  // Profile Auto-fill Logic
  const [tutorIdInput, setTutorIdInput] = useState('');
  const [isFetchingTutor, setIsFetchingTutor] = useState(false);
  const [tutorFetchError, setTutorFetchError] = useState<string | null>(null);
  const [isTutorFetched, setIsTutorFetched] = useState(false);

  // Auto-fill profile from tutors list when user signs in
  useEffect(() => {
    if (activeUser?.email && tutors.length > 0 && !isTutorFetched) {
      const email = activeUser.email.toLowerCase().trim();
      const tutor = tutors.find(t => {
        const tEmail = (t.Email || (t as any).email || '').toString().toLowerCase().trim();
        return tEmail === email;
      });

      if (tutor) {
        console.log('Found matching tutor profile for:', email);
        const name = (tutor['Full Name'] || (tutor as any).fullName || tutor.Name || '').toString();
        const gender = (tutor.Gender || (tutor as any).gender || 'Male').toString();
        const city = (tutor['Preferred City'] || (tutor as any).preferredCity || (tutor as any).City || 'All').toString();
        const classGroup = (tutor['Preferred Class Group'] || (tutor as any).preferredClassGroup || (tutor as any).classGroup || '').toString();
        const tutorId = (tutor['Tutor ID'] || (tutor as any).tutorId || (tutor as any).id || '').toString();
        const phone = (tutor.Phone || (tutor as any).phone || '').toString();
        const about = (tutor.About || (tutor as any).about || '').toString();
        const dob = (tutor.DOB || (tutor as any).dob || '').toString();
        let qualification: string[] = [];
        try {
          const rawQ = (tutor.Qualification || (tutor as any).qualification || '').toString();
          qualification = rawQ.startsWith('[') ? JSON.parse(rawQ) : (rawQ ? [rawQ] : []);
        } catch { qualification = []; }
        
        const experience = (tutor.Experience || (tutor as any).experience || '').toString();
        const schoolExp = (tutor['School Exp.'] || tutor.School_Experience || 'No').toString();
        const vehicle = (tutor['Have own Vehicle'] || tutor.Vehicle || 'No').toString();
        let subjects: string[] = [];
        try {
          const rawS = (tutor['Preferred Subject(s)'] || tutor.Subject_Field || '[]').toString();
          subjects = rawS.startsWith('[') ? JSON.parse(rawS) : (rawS ? rawS.split(',').map((s: any) => s.trim()).filter(Boolean) : []);
        } catch { subjects = []; }

        let localities: string[] = [];
        try {
          const rawL = (tutor['Preferred Location(s)'] || tutor.Preferred_Location || '[]').toString();
          localities = rawL.startsWith('[') ? JSON.parse(rawL) : (rawL ? rawL.split(',').map((l: any) => l.trim()).filter(Boolean) : []);
        } catch { localities = []; }

        setUserName(toTitleCase(name));
        setUserGender(toTitleCase(gender));
        setUserCity(toTitleCase(city));
        setUserPhone(phone);
        setAboutMe(about);
        setUserDob(dob);
        setUserQualifications(qualification);
        setUserExperience(experience);
        setIsSchoolTeacher(schoolExp);
        setHasVehicle(vehicle);
        setUserSubjects(subjects);
        setUserLocalities(localities);

        if (tutorId) {
          localStorage.setItem('tutorId', tutorId);
          setTutorId(tutorId);
        }

        // Set User Type as Teacher automatically
        setUserType('teacher');
        localStorage.setItem('userType', 'teacher');
        setShowOnboarding(false);
        
        // Match Class Groups - Enforce single selection
        const groups = ['Class I to V', 'Class VI to VIII', 'Class IX to X', 'Class XI to XII'];
        const matchedGroups = groups.filter(g => classGroup.toLowerCase().includes(g.toLowerCase().replace('class ', '')));
        if (matchedGroups.length > 0) {
          const singleGroup = [matchedGroups[0]];
          setUserClasses(singleGroup);
          localStorage.setItem('userClasses', JSON.stringify(singleGroup));
        } else {
          setUserClasses([]);
          localStorage.setItem('userClasses', JSON.stringify([]));
        }
        
        // Save to LocalStorage
        localStorage.setItem('userName', toTitleCase(name));
        localStorage.setItem('userGender', toTitleCase(gender));
        localStorage.setItem('userCity', toTitleCase(city));
        localStorage.setItem('userPhone', phone);
        localStorage.setItem('aboutMe', about);
        localStorage.setItem('userDob', dob);
        localStorage.setItem('userQualifications', JSON.stringify(qualification));
        localStorage.setItem('userExperience', experience);
        localStorage.setItem('isSchoolTeacher', schoolExp);
        localStorage.setItem('hasVehicle', vehicle);
        localStorage.setItem('userSubjects', JSON.stringify(subjects));
        localStorage.setItem('userLocalities', JSON.stringify(localities));
        if (matchedGroups.length > 0) localStorage.setItem('userClasses', JSON.stringify(matchedGroups));
        
        setIsTutorFetched(true);
      }
    }
  }, [activeUser, tutors, isTutorFetched]);

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
        const city = (tutor['Preferred City'] || (tutor as any).preferredCity || (tutor as any).City || 'All').toString();
        const classGroup = (tutor['Preferred Class Group'] || (tutor as any).preferredClassGroup || (tutor as any).classGroup || '').toString();

        setUserName(toTitleCase(name));
        setUserGender(toTitleCase(gender));
        setUserCity(toTitleCase(city));
        
        // Match Class Groups - Enforce single selection
        const groups = ['Class I to V', 'Class VI to VIII', 'Class IX to X', 'Class XI to XII'];
        const matchedGroups = groups.filter(g => classGroup.toLowerCase().includes(g.toLowerCase().replace('class ', '')));
        if (matchedGroups.length > 0) {
          const singleGroup = [matchedGroups[0]];
          setUserClasses(singleGroup);
          localStorage.setItem('userClasses', JSON.stringify(singleGroup));
        } else {
          setUserClasses([]);
          localStorage.setItem('userClasses', JSON.stringify([]));
        }
        
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

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      setAuthError('Please enter both email and password.');
      return;
    }
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const isNative = Capacitor.isNativePlatform();
      const url = isNative ? 'https://doableindia.com/app-sys/app_auth.php' : '/api/auth/signin';
      
      let data;
      if (isNative) {
        const payload = { 
          action: 'signin',
          email, 
          password,
          userType: userType || 'teacher'
        };

        const response = await CapacitorHttp.post({
          url: url,
          headers: {
            'Content-Type': 'application/json'
          },          data: payload
        });
        
        console.log('📡 Auth Response:', url, response.status, JSON.stringify(response.data));

        if (response.status >= 500) {
           setAuthError(`Server Error (${response.status}).`);
           setIsAuthLoading(false);
           return;
        }

        data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      } else {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },          body: JSON.stringify({ 
            action: 'signin', 
            email, 
            password,
            userType: userType || 'teacher'
          })
        });
        data = await response.json();
      }
      
      if (data.status === 'success') {
        const userData = { email: data.user.email, userType: data.user.userType, uid: data.user.id };
        setCustomUser(userData);
        localStorage.setItem('customUser', JSON.stringify(userData));
        setUserType(data.user.userType);
        localStorage.setItem('userType', data.user.userType);
        playTapSound();
        setShowProfileSetup(false);
        setShowOnboarding(false);
      } else {
        setAuthError(data.message || 'Invalid email or password.');
      }
    } catch (error: any) {
      console.error('Sign In Error:', error);
      setAuthError('Connection error. Please try again.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    if (!email || !password) {
      setAuthError('Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password should be at least 6 characters.');
      return;
    }
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const isNative = Capacitor.isNativePlatform();
      const url = isNative ? 'https://doableindia.com/app-sys/app_auth.php' : '/api/auth/signup';

      let data;
      if (isNative) {
        const payload = { 
          action: 'signup',
          email, 
          password, 
          userType: userType || 'teacher' 
        };

        const response = await CapacitorHttp.post({
          url: url,
          headers: {
            'Content-Type': 'application/json'
          },          data: payload
        });
        
        console.log('📡 Auth Response:', url, response.status, JSON.stringify(response.data));

        if (response.status >= 500) {
           setAuthError(`Server Error (${response.status}).`);
           setIsAuthLoading(false);
           return;
        }

        data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      } else {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },          body: JSON.stringify({ 
            action: 'signup', 
            email, 
            password, 
            userType: userType || 'teacher' 
          })
        });
        data = await response.json();
      }

      if (data.status === 'success') {
        const userData = { email: email, userType: userType || 'teacher', uid: data.userId };
        setCustomUser(userData);
        localStorage.setItem('customUser', JSON.stringify(userData));
        setUserType(userType || 'teacher');
        localStorage.setItem('userType', userType || 'teacher');
        playTapSound();
        setShowProfileSetup(false);
        setShowOnboarding(false);
      } else {
        setAuthError(data.message || 'Failed to sign up.');
      }
    } catch (error: any) {
      console.error('Sign Up Error:', error);
      setAuthError('Connection error. Please try again.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setAuthError('Please enter your email address.');
      return;
    }
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const isNative = Capacitor.isNativePlatform();
      const url = isNative ? 'https://doableindia.com/app-sys/app_auth.php' : '/api/auth/forgot-password';

      let data;
      if (isNative) {
        const response = await CapacitorHttp.post({
          url: url,
          headers: {
            'Content-Type': 'application/json'
          },          data: { 
            action: 'forgot_password',
            email 
          }
        });
        data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      } else {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },          body: JSON.stringify({ 
            action: 'forgot_password', 
            email 
          })
        });
        data = await response.json();
      }
      if (data.status === 'success') {
        setAuthMode('reset');
        setAuthError(null);
      } else {
        setAuthError(data.message || 'Failed to send reset PIN.');
      }
    } catch (error: any) {
      setAuthError('Connection error.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPin || !newPassword || !confirmPassword) {
      setAuthError('Please fill all fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const isNative = Capacitor.isNativePlatform();
      const url = isNative ? 'https://doableindia.com/app-sys/app_auth.php' : '/api/auth/reset-password';

      let data;
      if (isNative) {
        const response = await CapacitorHttp.post({
          url: url,
          headers: {
            'Content-Type': 'application/json'
          },          data: { 
            action: 'reset_password',
            email, 
            pin: resetPin, 
            password: newPassword 
          }
        });
        data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      } else {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },          body: JSON.stringify({ 
            action: 'reset_password', 
            email, 
            pin: resetPin, 
            password: newPassword 
          })
        });
        data = await response.json();
      }

      if (data.status === 'success') {
        alert('Password updated successfully. Please Sign In.');
        setAuthMode('signin');
        setResetPin('');
        setNewPassword('');
        setRetypePassword('');
      } else {
        setAuthError(data.message || 'Reset failed.');
      }
    } catch (error: any) {
      setAuthError('Connection error.');
    } finally {
      setIsAuthLoading(false);
    }
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
  const isAlertsInitialLoad = useRef(true);

  const fetchAlertsFromServer = async () => {
    setAlertsLoading(true);
    try {
      const q = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'), limit(100));
      const snap = await getDocsFromServer(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Alert[];
      setAlerts(data);
      setAlertsLoading(false);
      if (data.length === 0) console.log('No alerts found on SERVER.');
      else console.log(`Loaded ${data.length} alerts from SERVER.`);
    } catch (e: any) {
      console.error('Server Fetch Error: ' + e.message);
      setAlertsLoading(false);
    }
  };

  useEffect(() => {
    setAlertsLoading(true);
    
    // 1. Primary Real-time Sync
    const q = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        // Ensure timestamp is consistent
        timestamp: (doc.data() as any).timestamp?.toDate?.() || new Date((doc.data() as any).timestamp || Date.now())
      })) as Alert[];
      
      console.log(`SYNC_SUCCESS: ${data.length} alerts.`);
      setAlerts(data);
      setAlertsLoading(false);
      setIsServerData(true);
    }, (err) => {
      console.error('Snapshot Error, falling back to REST:', err);
      // 2. Fallback REST Sync (if Firestore listener fails due to network/perms)
      initializeAlertsFallback();
    });

    const initializeAlertsFallback = async () => {
      try {
        const API_KEY = "AIzaSyD5espRj-NwGzzbnhGnPKP4uvO0zjt8y7s";
        const REST_URL = `https://firestore.googleapis.com/v1/projects/doable-india-app-9564b-496310/databases/(default)/documents/alerts?pageSize=50&key=${API_KEY}`;
        
        const response = await fetch(REST_URL);
        const data = await response.json();
        
        if (data.documents) {
          const initialData = data.documents.map((doc: any) => {
            const parts = doc.name.split('/');
            const fields = doc.fields || {};
            return {
              id: parts[parts.length - 1],
              message: fields.message?.stringValue || fields.Message?.stringValue || 'No Message',
              sender: fields.sender?.stringValue || 'System',
              type: fields.type?.stringValue || 'info',
              city: fields.city?.stringValue || 'All',
              gender: fields.gender?.stringValue || 'Any',
              targetClass: fields.targetClass?.stringValue || 'All',
              targetUserType: fields.targetUserType?.stringValue || 'all',
              localities: fields.localities?.arrayValue?.values?.map((v: any) => v.stringValue) || [],
              timestamp: fields.timestamp?.timestampValue || new Date().toISOString()
            };
          }) as Alert[];
          
          setAlerts(initialData);
          setAlertsLoading(false);
        }
      } catch (e: any) {
        console.error('Fallback Error:', e);
        setAlertsLoading(false);
      }
    };

    return () => unsubscribe();
  }, [userCity]); // Re-subscribe if userCity changes for filtering logic within listener if needed

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

  const normalizeTutor = (t: any) => {
    const safeParse = (str: any) => {
      if (Array.isArray(str)) return str;
      if (!str) return [];
      try {
        // Try JSON parse first
        const parsed = JSON.parse(str);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        // Fallback: Split by comma and trim
        return str.toString().split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    };

    return {
      tutor_id: t.tutor_id || t['Tutor ID'] || t.id || '',
      name: t.name || t.Name || '',
      email: t.email || t.Email || '',
      internal_phone: t.phone || t.Phone || '', 
      gender: t.gender || t.Gender || '',
      age: t.age || t.Age || '',
      dob: t.dob || t.DOB || '',
      qualification: safeParse(t.qualification || t['Qualification(s)'] || t.Qualification),
      experience: t.experience || t.Experience || '',
      school_teacher: t.school_teacher || t['School Exp.'] || 'No',
      days: t.days || '',
      time: t.time || t.Time || '',
      class_group: safeParse(t.class_group || t['Preferred Class Group'] || t.Class),
      subjects: safeParse(t.subjects || t['Preferred Subject(s)'] || t['Subject(s)']),
      city: t.city || t.City || t['Preferred City'] || '',
      location: safeParse(t.location || t['Preferred Location(s)'] || t.Location),
      have_vehicle: t.have_vehicle || t['Have own Vehicle'] || 'No',
      communication: t.communication || t.Communication || '',
      fee: t.fee || t.Fee || t['Fee/Month'] || '',
      about: t.about || t.About || '',
      status: t.status || t.Status || 'Active',
      photo: t.photo || t.Photo || '',
      verified: t.verified || t.Verified || 'No',
      created_time: t.created_time || t['Record Added'] || ''
    };
  };

  const loadData = async () => {
    try {
      // Cleanup old bulky localStorage cache if it exists
      if (localStorage.getItem('cachedTutors')) {
        localStorage.removeItem('cachedTutors');
        console.log('🗑️ Old localStorage cache purged.');
      }

      // 1. Instantly load from cache if available
      const cachedLeads = localStorage.getItem('cachedLeads');
      const cachedTutors = await getFromLargeStorage('cachedTutors');
      
      if (cachedLeads) setLeads(JSON.parse(cachedLeads));
      if (cachedTutors) setTutors(cachedTutors.map(normalizeTutor));

      if (leads.length === 0 && tutors.length === 0 && !cachedLeads) {
        setLoading(true);
      }
      
      const isNative = Capacitor.isNativePlatform();

      const LEADS_URL = Capacitor.isNativePlatform() ? 'https://doableindia.com/app-sys/api_data.php' : '/api/leads';
      const TUTORS_URL = Capacitor.isNativePlatform() ? 'https://doableindia.com/app-sys/api_copy_data.php' : '/api/tutors';

      if (isNative) {
        // Use native fetch to bypass CORS
        const [leadsRes, tutorsRes] = await Promise.all([
          CapacitorHttp.get({ 
            url: LEADS_URL
          }),
          CapacitorHttp.get({ 
            url: TUTORS_URL,
            headers: { 
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          })
        ]);
        
        if (leadsRes.data) {
           const data = typeof leadsRes.data === 'string' ? JSON.parse(leadsRes.data) : leadsRes.data;
           if (data.status === 'success') {
             setLeads(data.data);
             localStorage.setItem('cachedLeads', JSON.stringify(data.data));
           } else if (Array.isArray(data)) {
             setLeads(data);
             localStorage.setItem('cachedLeads', JSON.stringify(data));
           }
        }

        if (tutorsRes.data) {
           const data = typeof tutorsRes.data === 'string' ? JSON.parse(tutorsRes.data) : tutorsRes.data;
           const rawTutors = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
           const normalized = rawTutors.map(normalizeTutor);
           setTutors(normalized);
           await saveToLargeStorage('cachedTutors', normalized);
        }
      } else {
        const [leadsRes, tutorsRes] = await Promise.all([
          fetch(LEADS_URL),
          fetch(TUTORS_URL)
        ]);
        
        const leadsText = await leadsRes.text();
        const tutorsText = await tutorsRes.text();

        if (!leadsRes.ok) {
           console.error("SERVER RAW ERROR (Leads Fetch):", leadsText);
           console.warn(`Leads HTTP Error (${leadsRes.status})`);
        }
        if (!tutorsRes.ok) {
           console.error("SERVER RAW ERROR (Tutors Fetch):", tutorsText);
           console.warn(`Tutors HTTP Error (${tutorsRes.status})`);
        }
        
        const leadsJson = leadsText ? JSON.parse(leadsText) : { status: 'error', data: [] };
        const tutorsJson = tutorsText ? JSON.parse(tutorsText) : { status: 'error', data: [] };
        
        if (leadsJson.status === 'success') {
          setLeads(leadsJson.data);
          localStorage.setItem('cachedLeads', JSON.stringify(leadsJson.data));
        }
        if (tutorsJson.status === 'success') {
          const normalized = tutorsJson.data.map(normalizeTutor);
          setTutors(normalized);
          await saveToLargeStorage('cachedTutors', normalized);
        }
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
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => { 
      console.log('Auth State Changed:', user ? user.email : 'No User');
      setCurrentUser(user); 
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.userType) {
              setUserType(userData.userType as UserType);
              localStorage.setItem('userType', userData.userType);
            }
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      }
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
          setActiveToast({ title: 'Sign-in Error', body: 'idToken missing from Google response.' });
          setTimeout(() => setActiveToast(null), 6000);
          return;
        }

        console.log('🔥 Firebase: signInWithCredential starting...');
        const credential = GoogleAuthProvider.credential(user.authentication.idToken);
        const result = await signInWithCredential(auth, credential);
        console.log('🎉 Firebase: Login Success!', result.user.email);
        if (userType) localStorage.setItem('userType', userType);
        setShowOnboarding(false);
        setActiveToast({ title: 'Welcome!', body: `Signed in as: ${result.user.email}` });
        setTimeout(() => setActiveToast(null), 4000);
      } else {
        console.log('🌐 Web Platform: signInWithPopup starting...');
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        console.log('🎉 Firebase: Web Login Success!', result.user.email);
        if (userType) localStorage.setItem('userType', userType);
        setShowOnboarding(false);
      }
    } catch (err: any) {
      console.error('❌ Sign-in Error:', err);
      let errorMsg = 'Unknown Error';
      
      if (typeof err === 'object') {
        errorMsg = err.message || err.error || JSON.stringify(err);
      } else {
        errorMsg = String(err);
      }
      
      setActiveToast({ title: 'Sign-in Failed', body: errorMsg });
      setTimeout(() => setActiveToast(null), 6000);
      
      if (errorMsg.includes('10:') || errorMsg.includes('DEVELOPER_ERROR')) {
        console.warn('DEBUG HINT: This is usually a SHA-1 or Client ID mismatch in Firebase/Google Console.');
      }
    }
  };

  const isAdminUser = useMemo(() => {
    const email = activeUser?.email?.toLowerCase().trim();
    return email === 'd9717018219@gmail.com' || email === 'doableindia@gmail.com';
  }, [activeUser]);

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
        const matchesClass = jobFilterClasses.some(cls => {
          // Direct match
          if (jobClass.includes(cls.toLowerCase())) return true;
          // Group mapping match
          const mappedClasses = CLASS_GROUP_MAPPING[cls];
          if (mappedClasses && mappedClasses.some(m => jobClass.includes(m.toLowerCase()))) return true;
          return false;
        });
        if (!matchesClass) return false;
      }

      // Gender Filter
      if (jobFilterGender !== 'All') {
        const jobGender = (l.Gender || '').toLowerCase();
        const filterGender = jobFilterGender.toLowerCase();
        
        // Exact match or 'any' in job
        if (jobGender === filterGender || jobGender === 'any') return true;
        
        // Handle cases where jobGender might be "Male/Female" or "Female/Male"
        if (filterGender === 'male' && jobGender.includes('male') && !jobGender.includes('female')) return true;
        if (filterGender === 'female' && jobGender.includes('female')) return true;
        
        return false;
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
      // 🚨 CRITICAL: Visibility Check
      // Only show 'Active' tutors. Hide 'Hidden' or 'Blocked' profiles.
      const status = (t.status || '').toString().toLowerCase();
      if (status === 'hidden' || status === 'blocked') return false;

      const cityVal = (t.city || 'India').toString().toLowerCase();
      if (!isCityMatch(cityVal, tutorCityFilter)) return false;

      // Localities Filter
      if (tutorFilterLocalities.length > 0) {
        const tutorLocs = JSON.stringify(t.location || []).toLowerCase();
        if (!tutorFilterLocalities.some(loc => tutorLocs.includes(loc.toLowerCase()))) return false;
      }

      // Classes Filter
      if (tutorFilterClasses.length > 0) {
        const tutorClassArr = t.class_group || [];
        const tutorClassStr = JSON.stringify(tutorClassArr).toLowerCase();
        
        const matchesClass = tutorFilterClasses.some(cls => {
          // Direct match in array
          if (tutorClassStr.includes(cls.toLowerCase())) return true;
          // Group mapping match
          const mappedClasses = CLASS_GROUP_MAPPING[cls];
          if (mappedClasses && mappedClasses.some(m => tutorClassStr.includes(m.toLowerCase()))) return true;
          return false;
        });
        if (!matchesClass) return false;
      }

      // Gender Filter
      if (tutorFilterGender !== 'All') {
        const tutorGender = (t.gender || '').toLowerCase();
        const filterGender = tutorFilterGender.toLowerCase();
        
        // Exact match or 'any' (unlikely for tutors but for safety)
        if (tutorGender === filterGender || tutorGender === 'any') return true;
        
        // Handle cases like "Male/Female"
        if (filterGender === 'male' && tutorGender.includes('male') && !tutorGender.includes('female')) return true;
        if (filterGender === 'female' && tutorGender.includes('female')) return true;
        
        return false;
      }

      if (tutorSearchQuery) {
        const sl = tutorSearchQuery.toLowerCase();
        const tName = (t.name || '').toLowerCase();
        const tID = (t.tutor_id || '').toString().toLowerCase();
        const skills = JSON.stringify(t.subjects || []).toLowerCase();
        if (!(tName.includes(sl) || tID.includes(sl) || skills.includes(sl))) return false;
      }
      return true;
    }).sort((a, b) => {
      if (tutorSortBy === 'verified') {
        const vA = a.verified === 'Yes' ? 1 : 0;
        const vB = b.verified === 'Yes' ? 1 : 0;
        if (vA !== vB) return vB - vA;
      }

      if (tutorSortBy === 'fee_high' || tutorSortBy === 'fee_low') {
        const fA = parseInt(a.fee?.toString().replace(/[^0-9]/g, '') || '0');
        const fB = parseInt(b.fee?.toString().replace(/[^0-9]/g, '') || '0');
        return tutorSortBy === 'fee_high' ? fB - fA : fA - fB;
      }

      const idA = parseInt((a.tutor_id || '0').toString().replace(/[^0-9]/g, ''));
      const idB = parseInt((b.tutor_id || '0').toString().replace(/[^0-9]/g, ''));
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

      const dateA = parseTutorDate(a.created_time);
      const dateB = parseTutorDate(b.created_time);
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
    <div className="min-h-screen bg-transparent flex flex-col font-sans select-none overflow-x-hidden relative" ref={mainScrollRef}>
      <audio ref={audioRef} preload="auto" />

      {/* Onboarding & Auth Flow Overlay */}
      <AnimatePresence>
        {showOnboarding && (
          <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" />
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="relative w-full max-w-sm">
              {!userType ? (
                <div className="space-y-6 text-center">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Welcome to DoAble</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">How would you like to continue?</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <button 
                      onClick={() => { playTapSound(); setUserType('parent'); localStorage.setItem('userType', 'parent'); }}
                      className="group bg-white p-6 rounded-[32px] flex items-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                        <LucideUser size={24} strokeWidth={3} />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">I'm a Parent</h4>
                        <p className="text-[10px] font-bold text-slate-400">Looking for professional tutors</p>
                      </div>
                    </button>
                    <button 
                      onClick={() => { playTapSound(); setUserType('teacher'); localStorage.setItem('userType', 'teacher'); }}
                      className="group bg-white p-6 rounded-[32px] flex items-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                        <GraduationCap size={24} strokeWidth={3} />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">I'm a Tutor</h4>
                        <p className="text-[10px] font-bold text-slate-400">Want to join the elite network</p>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-[40px] p-8 shadow-2xl space-y-6">
                  <div className="flex justify-between items-center">
                    <button onClick={() => setUserType(null)} className="text-slate-300 hover:text-slate-500"><ChevronRight size={20} className="rotate-180" /></button>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">
                      {authMode === 'signin' ? 'Sign In' : authMode === 'signup' ? 'Create Account' : authMode === 'forgot' ? 'Forgot Password' : 'Reset Password'}
                    </h3>
                    <div className="w-5" />
                  </div>

                  <div className="space-y-4">
                    {authMode !== 'reset' ? (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Email Address</label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all" />
                          </div>
                        </div>

                        {authMode !== 'forgot' && (
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Password</label>
                            <div className="relative">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-10 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all" />
                              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px]">
                                {showPassword ? "🙈" : "👁️"}
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                          <p className="text-[10px] font-bold text-primary text-center leading-relaxed">Enter the 6-digit PIN sent to <br/><span className="underline">{email}</span></p>
                        </div>
                        
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Security PIN</label>
                          <div className="relative">
                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                            <input type="text" maxLength={6} value={resetPin} onChange={(e) => setResetPin(e.target.value)} placeholder="000000" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-center text-lg font-black tracking-[1em] text-slate-700 outline-none focus:border-primary transition-all" />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">New Password</label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                            <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 chars" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-10 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px]">
                              {showPassword ? "🙈" : "👁️"}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Confirm Password</label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                            <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setRetypePassword(e.target.value)} placeholder="Repeat password" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-10 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all" />
                          </div>
                        </div>
                      </div>
                    )}

                    {authError && <div className="text-rose-500 text-[10px] font-bold px-1 flex items-center gap-1.5"><AlertCircle size={12} /> {authError}</div>}

                    <button 
                      onClick={authMode === 'signin' ? handleEmailSignIn : authMode === 'signup' ? handleEmailSignUp : authMode === 'forgot' ? handleForgotPassword : handleResetPassword}
                      disabled={isAuthLoading}
                      className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      {isAuthLoading ? <Loader2 size={16} className="animate-spin" /> : (authMode === 'signin' ? 'Sign In' : authMode === 'signup' ? 'Sign Up' : authMode === 'forgot' ? 'Send PIN' : 'Verify & Reset')}
                    </button>

                    <div className="flex flex-col gap-3 pt-2">
                      {authMode === 'signin' && (
                        <>
                          <button onClick={() => { setAuthMode('forgot'); setAuthError(null); }} className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-widest">Forgot Password?</button>
                          <div className="h-px bg-slate-100 w-full" />
                          <button onClick={() => { setAuthMode('signup'); setAuthError(null); }} className="text-[10px] font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-widest text-center">New to DoAble? <span className="text-primary underline">Sign Up</span></button>
                        </>
                      )}
                      {(authMode === 'signup' || authMode === 'forgot' || authMode === 'reset') && (
                        <button onClick={() => { setAuthMode('signin'); setAuthError(null); }} className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-widest text-center">Back to <span className="text-primary underline">Sign In</span></button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        :root {
          --safe-area-top: env(safe-area-inset-top, 0px);
          --safe-area-bottom: env(safe-area-inset-bottom, 0px);
        }
        .no-line { border: none !important; box-shadow: none !important; outline: none !important; }
        .sticky-fix { background-color: rgba(255, 255, 255, 0.7) !important; backdrop-filter: blur(8px); }
        
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

                  <div className="pt-6 px-6 pb-[calc(1.5rem+var(--safe-area-bottom,20px))] flex gap-3 sticky bottom-0 bg-white border-t border-slate-50">
                    <button onClick={currentClearFilters} className="flex-1 bg-[#7A2153] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-[#7A2153]/20">Reset</button>
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

      <header className="sticky top-0 z-[100] bg-gradient-to-r from-[#FF8C00] via-[#F97316] to-[#EC4899] px-5 pb-3 flex items-center justify-between shadow-[0_10px_40px_rgba(249,115,22,0.3)] border-b border-white/10 relative overflow-hidden pt-[calc(0.6rem+var(--safe-area-top,20px))]">
        <div className="absolute -top-24 -left-20 w-48 h-48 bg-white/10 blur-3xl rounded-full" />
        <div className="flex flex-col relative z-10" onClick={() => { setDebugClicks(prev => prev + 1); if (debugClicks > 3) window.alert('FCM: ' + fcmToken + '\nDB: ' + dbStatus); }}>
          <span className="text-[20px] font-[1000] text-white tracking-tighter leading-none">DoAble India</span>
          <span className="text-[7.5px] font-black text-white/80 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
            Premium Home Tuition Network <div className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" /> {debugClicks > 3 && ' [DEBUG ON]'}
          </span>
        </div>
        <div className="flex items-center gap-3 relative z-10">
             <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-xl p-0.5 rounded-2xl border border-white/10">
                <button onClick={() => { playTapSound(); setAlertsInitialTab('feed'); setActiveTab('alerts'); setUnseenAlertsCount(0); }} className="relative p-1.5 text-white hover:text-white transition-all active:scale-90">
                  <Bell size={18} strokeWidth={2.5} color="#FFFFFF" />
                  {unseenAlertsCount > 0 && <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-orange-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full border border-white shadow-lg animate-pulse">{unseenAlertsCount}</span>}
                </button>
                <div className="w-[1px] h-3 bg-white/10" />
                <button onClick={() => { playTapSound(); if (!activeUser) { setAuthMode('signin'); setShowOnboarding(true); } else { setShowProfileSetup(true); } }} className="p-1.5 text-white hover:text-white transition-all active:scale-90"><LucideUser size={18} strokeWidth={2.5} color="#FFFFFF" /></button>
              </div>
        </div>
      </header>

      <main className="container mx-auto p-0 sm:p-[10px] max-w-[1200px] pb-32">
       {activeTab === 'home' && (
          <HomeView userName={userName} userType={userType} userCity={userCity} activeLeadsCount={finalJobs.length} activeTutorsCount={finalTutors.length} featuredJobs={finalJobs.slice(0, 3)} featuredTutors={finalTutors.slice(0, 3)} playTapSound={playTapSound} setFormType={setFormType} setShowFormModal={setShowFormModal} onSignUpClick={() => { setAuthMode('signup'); setShowOnboarding(true); }} setActiveTab={setActiveTab} setShowFilterDrawer={setShowFilterDrawer} getDynamicGreeting={getDynamicGreeting} onJobClick={setSelectedJob} onTutorClick={setSelectedTutor} shortlistedIds={shortlistedIds} onShortlistToggle={toggleShortlist} />
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
          <div className="px-0"><AlertsView city={userCity} userGender={userGender} userClasses={userClasses} userLocalities={userLocalities} userType={userType} isAdminUser={isAdminUser} onAdminClick={() => setActiveTab('admin')} currentUser={activeUser} showFormModal={showFormModal} setShowFormModal={setShowFormModal} setUserCity={setUserCity} setUserGender={setUserGender} setUserClasses={setUserClasses} setUserType={setUserType} userName={userName} setUserName={setUserName} initialTab={alertsInitialTab} alerts={alerts} loading={alertsLoading} error={alertsError} dbStatus={dbStatus} leadsCount={firestoreLeads.length} authEmail={activeUser?.email} isServerData={isServerData} onRefresh={fetchAlertsFromServer} /></div>
       )}
       {activeTab === 'support' && (<SupportView userName={userName} userType={userType} userCity={userCity} />)}
       {activeTab === 'concierge' && (<ParentHubView userName={userName} playTapSound={playTapSound} setActiveTab={setActiveTab} setShowFormModal={setShowFormModal} setFormType={setFormType} />)}
       {activeTab === 'earnings' && (<EarningsView leads={leads} firestoreLeads={firestoreLeads} userName={userName} userCity={userCity} tutorId={tutorId} playTapSound={playTapSound} setSelectedJob={setSelectedJob} />)}
       {activeTab === 'admin' && (
         <div className="px-6 py-10">
           {isAdminUser ? (
             <AdminPanel 
            currentCity={userCity} 
            tutors={tutors}
            playTapSound={playTapSound}
          />
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
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative bg-transparent w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] shadow-2xl flex flex-col max-h-[96vh] overflow-hidden">
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
                  <button 
                    onClick={() => openWhatsApp(`Hi, I want to apply for Job Order ID: #${selectedJob['Order ID'] || (selectedJob as any).id || 'N/A'}`)}
                    className="flex-[1.8] py-3.5 sm:py-4 rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest text-center text-white shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2" 
                    style={{ background: 'linear-gradient(135deg, #FF1493 0%, #FF69B4 100%)' }}
                  >
                    💬 Apply Now
                  </button>
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
              className="relative bg-transparent w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] shadow-2xl flex flex-col max-h-[96vh] overflow-hidden"
            >
               <div className="p-8 text-center text-white relative shrink-0 pt-[calc(2rem+var(--safe-area-top,24px))]" style={{ background: 'linear-gradient(135deg, #4ECDC4 0%, #2563EB 100%)' }}>
                  <button onClick={() => setSelectedTutor(null)} className="absolute top-8 left-6 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-all"><X size={20} /></button>
                  <div className="text-[22px] font-[900] text-white mb-1 tracking-tight">
                    ✨ {toTitleCase(selectedTutor.name || 'Premium Tutor')}
                  </div>
                  <div className="flex items-center justify-center gap-3 mt-1">
                    <div className="text-[11px] font-[600] opacity-80 uppercase tracking-widest">🆔 Tutor ID: {selectedTutor.tutor_id}</div>
                  </div>

                  {/* Status & Verification Badges */}
                  <div className="flex items-center justify-center gap-6 mt-4">
                    <div className="flex items-center gap-1.5">
                      {selectedTutor.verified === 'Yes' ? (
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

                    {selectedTutor.status && (
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm transition-all",
                          selectedTutor.status === 'Active' ? "bg-[#FFD700]" : 
                          selectedTutor.status === 'Not Available' ? "bg-slate-400" : "bg-rose-500"
                        )}>
                           <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                              {selectedTutor.status === 'Active' ? (
                                <Check size={10} className="text-[#FFD700]" strokeWidth={4} />
                              ) : selectedTutor.status === 'Not Available' ? (
                                <Clock size={10} className="text-slate-400" strokeWidth={3} />
                              ) : (
                                <X size={10} className="text-rose-500" strokeWidth={4} />
                              )}
                           </div>
                           <span className={cn(
                             "text-[11px] font-black uppercase tracking-tighter",
                             selectedTutor.status === 'Active' ? "text-[#856404]" : "text-white"
                           )}>
                             {selectedTutor.status === 'Not Available' ? 'Busy' : selectedTutor.status}
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
                    <DetailStat emoji="🎓" label="Qualification" value={(selectedTutor.qualification || []).join(', ') || 'Graduate'} color="bg-purple-600" />
                    <DetailStat emoji="📚" label="Experience" value={selectedTutor.experience || '1-3 Years'} color="bg-emerald-600" />
                    <DetailStat emoji="🏫" label="Class Group" value={(selectedTutor.class_group || []).join(', ') || 'All Classes'} color="bg-blue-600" />
                    <DetailStat emoji="👩‍🏫" label="School Teacher" value={selectedTutor.school_teacher || 'No'} color="bg-orange-500" />
                  </div>

                  {/* Expert Subjects Section (Full Width) */}
                  <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-xl bg-rose-500 flex items-center justify-center text-white shadow-sm"><BookText size={16} /></div>
                       <span className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Expert Subjects</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {(selectedTutor.subjects || []).map((s: string, i: number) => (
                         <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-700">📖 {s.trim()}</span>
                       ))}
                    </div>
                  </div>

                  {/* Personal & Professional Details Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
                      <div className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Age / Gender</div>
                      <div className="text-[13px] font-black text-slate-900">🎂 {selectedTutor.age || '25+'} / {selectedTutor.gender || 'Any'}</div>
                    </div>
                    <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
                      <div className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Own Vehicle</div>
                      <div className="text-[13px] font-black text-slate-900">🚗 {selectedTutor.have_vehicle || 'No'}</div>
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
                         const about = selectedTutor.about || "Dedicated educator committed to student success.";
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
                       {(selectedTutor['Preferred Location(s)'] || selectedTutor['Address'] || 'Citywide').toString().replace(/[\[\]"]/g, '').split(/[;,]/).map((l, i) => {
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
                  <button 
                    onClick={() => openWhatsApp(`Hi, I want to book a free demo with Tutor ID: #${selectedTutor['Tutor ID'] || (selectedTutor as any).id || 'N/A'}`)}
                    className="flex-[1.5] py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-center bg-primary text-white shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    💬 Book a Free Demo
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showProfileSetup && (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4">
          <div onClick={() => setShowProfileSetup(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div className="relative bg-transparent w-full max-w-[360px] rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[92vh]">
             <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-900">
                  {activeUser ? `${userType === 'teacher' ? 'Tutor' : 'Parent'} Profile` : 'Profile Setup'}
                </h3>
                <button onClick={() => setShowProfileSetup(false)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-all"><X size={16} /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                <div className="space-y-6">
                  {!activeUser && (
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
                              setUserCity('All');
                              setUserClasses([]);
                              
                              localStorage.removeItem('userName');
                              localStorage.removeItem('userGender');
                              localStorage.setItem('userCity', 'All');
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
                  )}

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
                           {/* Individual auth buttons removed in favor of unified Onboarding flow */}
                        </div>
                      )}

                      {(userType === 'parent' || (userType === 'teacher' && activeUser)) && (
                        <div className="space-y-4">
                          {/* Top Profile Header (Pic) Compact */}
                          <div className="flex items-center gap-4 p-4 bg-white rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                            <div className="relative shrink-0">
                              {profilePhoto ? (
                                <img src={profilePhoto} alt="User" className="w-16 h-16 rounded-full border-2 border-slate-100 object-cover" />
                              ) : activeUser?.photoURL ? (
                                <img src={activeUser.photoURL} alt="User" className="w-16 h-16 rounded-full border-2 border-slate-100 object-cover" />
                              ) : (
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary border-2 border-slate-100">
                                  <LucideUser size={32} />
                                </div>
                              )}
                              <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-pointer active:scale-90 transition-all z-10">
                                <Camera size={14} strokeWidth={3} />
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                              </label>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest truncate">{userName || activeUser?.displayName || 'Welcome'}</h4>
                                {localStorage.getItem('isVerified') === 'Yes' && <BadgeCheck size={14} className="text-blue-500 fill-blue-50" />}
                              </div>
                              <p className="text-[9px] font-bold text-slate-400 truncate mb-1">{activeUser?.email}</p>
                              {userType === 'teacher' && (
                                 <div className="flex flex-col gap-1 mt-1">
                                   <div className="flex items-center gap-2">
                                      <p className="text-[10px] font-black text-primary uppercase tracking-widest">🆔 ID: {localStorage.getItem('tutorId') || 'NEW'}</p>
                                      <span className={cn(
                                        "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-sm",
                                        localStorage.getItem('tutorStatus') === 'Active' ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                                      )}>
                                        {localStorage.getItem('tutorStatus') || 'Active'}
                                      </span>
                                   </div>
                                   {activeUser?.metadata?.creationTime && (
                                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                       Since: {new Date(activeUser.metadata.creationTime).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                     </p>
                                   )}
                                 </div>
                               )}
                            </div>
                          </div>

                          {/* Grid for Inputs (2 Columns to save vertical space) */}
                          <div className="grid grid-cols-2 gap-3">
                              {/* Name */}
                              <div className="p-3 bg-white border border-slate-100 rounded-2xl flex flex-col justify-between group relative">
                                <div className="space-y-0.5">
                                  <label className="text-[8px] font-black uppercase text-slate-300 tracking-[0.1em]">Name</label>
                                  <div className="text-[11px] font-bold text-slate-700 truncate">{userName || "Not set"}</div>
                                </div>
                                <button onClick={() => { const val = prompt("Enter name:", userName || ""); if (val !== null) { setUserName(val); localStorage.setItem('userName', val); }}} className="absolute right-2 top-2 p-1.5 bg-slate-50 text-slate-400 rounded-lg"><Edit3 size={12} /></button>
                              </div>

                              {/* Phone */}
                              {userType === 'teacher' && (
                                <div className="p-3 bg-white border border-slate-100 rounded-2xl flex flex-col justify-between group relative">
                                  <div className="space-y-0.5">
                                    <label className="text-[8px] font-black uppercase text-slate-300 tracking-[0.1em]">Phone</label>
                                    <div className="text-[11px] font-bold text-slate-700 truncate">{userPhone || "Not set"}</div>
                                  </div>
                                  <button onClick={() => { 
                                    const cleanPhone = userPhone ? userPhone.replace('+91 ', '').replace('+91', '') : '';
                                    const val = prompt("Enter phone:", cleanPhone);
                                    if (val !== null) { 
                                      const digits = val.replace(/\D/g, '').slice(-10);
                                      if (digits.length === 10) {
                                        const formatted = "+91 " + digits;
                                        setUserPhone(formatted); 
                                        localStorage.setItem('userPhone', formatted);
                                      } else {
                                        alert("Please enter exactly 10 digits.");
                                      }
                                    }
                                  }} className="absolute right-2 top-2 p-1.5 bg-slate-50 text-slate-400 rounded-lg"><Edit3 size={12} /></button>
                                </div>
                              )}

                              {/* DOB */}
                              {userType === 'teacher' && (
                                <div className="p-3 bg-white border border-slate-100 rounded-2xl flex flex-col justify-between group relative overflow-hidden">
                                  <div className="space-y-0.5">
                                    <label className="text-[8px] font-black uppercase text-slate-300 tracking-[0.1em]">Age (DOB)</label>
                                    <div className="text-[11px] font-bold text-slate-700 truncate">{userAge ? `${userAge} yrs` : 'Not set'}</div>
                                  </div>
                                  <input type="date" value={userDob} onChange={(e) => { const date = e.target.value; setUserDob(date); localStorage.setItem('userDob', date); if (date) { const birthDate = new Date(date); const today = new Date(); let age = today.getFullYear() - birthDate.getFullYear(); const m = today.getMonth() - birthDate.getMonth(); if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; } const ageStr = age.toString(); setUserAge(ageStr); localStorage.setItem('userAge', ageStr); } }} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10" />
                                  <button className="absolute right-2 top-2 p-1.5 bg-slate-50 text-slate-400 rounded-lg"><Calendar size={12} /></button>
                                </div>
                              )}

                              {/* Gender */}
                              <div className="p-3 bg-white border border-slate-100 rounded-2xl flex flex-col justify-between group relative">
                                <div className="space-y-0.5">
                                  <label className="text-[8px] font-black uppercase text-slate-300 tracking-[0.1em]">Gender</label>
                                  <select value={userGender} onChange={(e) => { setUserGender(e.target.value); localStorage.setItem('userGender', e.target.value); }} className="w-full bg-transparent text-[11px] font-bold text-slate-700 outline-none p-0 mt-1 cursor-pointer">
                                    <option value="Any">Any</option><option value="Male">Male</option><option value="Female">Female</option>
                                  </select>
                                </div>
                              </div>

                              {/* Qualification */}
                              {userType === 'teacher' && (
                                <div className="p-3 bg-white border border-slate-100 rounded-2xl flex flex-col justify-between group relative">
                                  <div className="space-y-0.5">
                                    <label className="text-[8px] font-black uppercase text-slate-300 tracking-[0.1em]">Qualification</label>
                                    <div className="text-[11px] font-bold text-slate-700 truncate">{(userQualifications || []).length > 0 ? userQualifications[0] : "Not set"}</div>
                                  </div>
                                  <button onClick={() => setShowSelectionDrawer({ type: 'qualification', title: 'Qualification', options: QUALIFICATIONS_LIST, selected: userQualifications || [], isMulti: true })} className="absolute right-2 top-2 p-1.5 bg-slate-50 text-slate-400 rounded-lg"><Edit3 size={12} /></button>                                </div>
                              )}

                              {/* Fee */}
                              {userType === 'teacher' && (
                                <div className="p-3 bg-white border border-slate-100 rounded-2xl flex flex-col justify-between group relative">
                                  <div className="space-y-0.5">
                                    <label className="text-[8px] font-black uppercase text-slate-300 tracking-[0.1em]">Expected Fee</label>
                                    <div className="text-[11px] font-bold text-slate-700 truncate">{userFee ? `₹${userFee}/mo` : "Not set"}</div>
                                  </div>
                                  <button onClick={() => { const val = prompt("Enter expected monthly fee:", userFee); if (val !== null) { setUserFee(val); localStorage.setItem('userFee', val); }}} className="absolute right-2 top-2 p-1.5 bg-slate-50 text-slate-400 rounded-lg"><Edit3 size={12} /></button>
                                </div>
                              )}
                              
                              {/* City */}
                              <div className="p-3 bg-white border border-slate-100 rounded-2xl flex flex-col justify-between group relative col-span-2">
                                <div className="space-y-0.5">
                                  <label className="text-[8px] font-black uppercase text-slate-300 tracking-[0.1em]">City</label>
                                  <select value={userCity} onChange={(e) => { setUserCity(e.target.value); localStorage.setItem('userCity', e.target.value); setUserLocalities([]); }} className="w-full bg-transparent text-[11px] font-bold text-slate-700 outline-none p-0 mt-1 cursor-pointer">
                                    {['All', ...CITIES_LIST].map(city => <option key={city} value={city}>{city}</option>)}
                                  </select>
                                </div>
                              </div>
                          </div>

                          {/* 2. ABOUT ME SECTION (Only for Teachers) */}
                          {userType === 'teacher' && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 px-2">
                                 <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500"><BookText size={14} /></div>
                                 <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">About Me</h3>
                              </div>
                              <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm group space-y-4">
                                <textarea 
                                  value={aboutMe}
                                  onChange={(e) => { setAboutMe(e.target.value); localStorage.setItem('aboutMe', e.target.value); }}
                                  placeholder="Write a short, catchy bio. Mention your teaching style and why parents should hire you. (e.g., 'Passionate about making Maths easy for kids through fun shortcuts.')"
                                  className="w-full min-h-[120px] text-[13px] font-medium text-slate-600 leading-relaxed outline-none border-none resize-none bg-transparent placeholder:text-slate-300"
                                />
                                <div className="pt-3 border-t border-slate-50">
                                   <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50">
                                      <p className="text-[10px] font-bold text-blue-600 flex items-center gap-1.5 leading-relaxed">
                                        <span>💡</span> 
                                        <span>Pro-Tip: You can use AI like ChatGPT or Gemini. Limit 100 words</span>
                                      </p>
                                   </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 3. PROFESSIONAL DETAILS (Only for Teachers) */}
                          {userType === 'teacher' && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 px-2">
                                 <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500"><Briefcase size={14} /></div>
                                 <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Professional Details</h3>
                              </div>
                              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-3 grid grid-cols-2 gap-3">
                                {/* Experience */}
                                <div className="p-2 border border-slate-100 rounded-xl relative group">
                                  <label className="text-[8px] font-black uppercase text-slate-300 tracking-[0.1em]">Experience</label>
                                  <div className="text-[10px] font-bold text-slate-700 truncate mt-1">{userExperience || "Not selected"}</div>
                                  <button onClick={() => setShowSelectionDrawer({ type: 'experience', title: 'Experience', options: EXPERIENCE_LIST, selected: userExperience ? [userExperience] : [], isMulti: false })} className="absolute right-1 top-1 p-1 bg-slate-50 text-slate-400 rounded-md"><Edit3 size={10} /></button>
                                </div>
                                {/* Available Days */}
                                <div className="p-2 border border-slate-100 rounded-xl relative group">
                                  <label className="text-[8px] font-black uppercase text-slate-300 tracking-[0.1em]">Days</label>
                                  <div className="text-[10px] font-bold text-slate-700 truncate mt-1">{userDays || "Not selected"}</div>
                                  <button onClick={() => setShowSelectionDrawer({ type: 'days', title: 'Days', options: DAYS_LIST, selected: userDays ? userDays.split(', ') : [], isMulti: true })} className="absolute right-1 top-1 p-1 bg-slate-50 text-slate-400 rounded-md"><Edit3 size={10} /></button>
                                </div>
                                {/* Preferred Time */}
                                <div className="p-2 border border-slate-100 rounded-xl relative group col-span-2">
                                  <label className="text-[8px] font-black uppercase text-slate-300 tracking-[0.1em]">Preferred Time</label>
                                  <div className="text-[10px] font-bold text-slate-700 truncate mt-1">{userTime || "Not selected"}</div>
                                  <button onClick={() => setShowSelectionDrawer({ type: 'time', title: 'Preferred Time', options: TIME_LIST, selected: userTime ? userTime.split(', ') : [], isMulti: true })} className="absolute right-2 top-2 p-1 bg-slate-50 text-slate-400 rounded-md"><Edit3 size={12} /></button>
                                </div>
                                {/* School Teacher & Vehicle dropdowns */}
                                <div className="col-span-2 flex justify-between gap-3 border-t border-slate-50 pt-2">
                                  <div className="flex-1">
                                    <label className="text-[8px] font-black uppercase text-slate-300 tracking-[0.1em]">School Exp?</label>
                                    <select value={isSchoolTeacher} onChange={(e) => { setIsSchoolTeacher(e.target.value); localStorage.setItem('isSchoolTeacher', e.target.value); }} className="w-full bg-transparent text-[10px] font-bold text-slate-700 mt-1 outline-none"><option value="Yes">Yes</option><option value="No">No</option></select>
                                  </div>
                                  <div className="flex-1">
                                    <label className="text-[8px] font-black uppercase text-slate-300 tracking-[0.1em]">Vehicle?</label>
                                    <select value={hasVehicle} onChange={(e) => { setHasVehicle(e.target.value); localStorage.setItem('hasVehicle', e.target.value); }} className="w-full bg-transparent text-[10px] font-bold text-slate-700 mt-1 outline-none"><option value="Yes">Yes</option><option value="No">No</option></select>
                                  </div>
                                </div>
                                {/* Communication */}
                                <div className="col-span-2 border-t border-slate-50 pt-2">
                                  <label className="text-[8px] font-black uppercase text-slate-300 tracking-[0.1em]">Communication Skills</label>
                                  <select value={userCommunication} onChange={(e) => { setUserCommunication(e.target.value); localStorage.setItem('userCommunication', e.target.value); }} className="w-full bg-transparent text-[10px] font-bold text-slate-700 mt-1 outline-none">
                                    <option value="">Select Level</option>
                                    <option value="Excellent">Excellent</option>
                                    <option value="Good">Good</option>
                                    <option value="Average">Average</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 4. ACADEMIC EXPERTISE SECTION (Class & Subjects) */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 px-2">
                               <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500"><BookOpen size={14} /></div>
                               <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">{userType === 'parent' ? 'Requirement Details' : 'Academic Expertise'}</h3>
                            </div>
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                              {/* Class Groups */}
                              <div className="p-4 flex items-center justify-between group hover:bg-slate-50/50 transition-all">
                                <div className="space-y-0.5">
                                  <label className="text-[8px] font-black uppercase text-slate-300 tracking-[0.15em]">{userType === 'parent' ? "Student's Class" : "Class Group"}</label>
                                  <div className="text-sm font-bold text-slate-700">{(userClasses || []).length > 0 ? userClasses[0] : "Not selected"}</div>
                                </div>
                                <button 
                                  onClick={() => setShowSelectionDrawer({
                                    type: 'classGroup',
                                    title: 'Select Class Group',
                                    options: CLASSES_LIST,
                                    selected: userClasses,
                                    isMulti: false
                                  })}
                                  className="p-2.5 bg-slate-50 text-primary rounded-xl active:scale-95 transition-all border border-slate-100 shadow-sm"
                                >
                                  <Edit3 size={16} />
                                </button>
                              </div>

                              {/* Subjects */}
                              {userClasses.length > 0 && (
                                <div className="p-4 flex items-center justify-between group hover:bg-slate-50/50 transition-all">
                                  <div className="space-y-0.5 flex-1 min-w-0 mr-4">
                                    <label className="text-[8px] font-black uppercase text-slate-300 tracking-[0.15em]">Expert Subjects</label>
                                    <div 
                                      className="font-bold text-slate-700 leading-tight"
                                      style={{ fontSize: getDynamicFontSize((userSubjects || []).join(', ')) }}
                                    >
                                      {((userSubjects || [])).length > 0 ? (userSubjects || []).join(', ') : "Select Subjects"}
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => setShowSelectionDrawer({
                                      type: 'subjects',
                                      title: 'Select Subjects',
                                      options: Array.from(new Set(userClasses.flatMap(cls => CLASS_SUBJECTS_DATA[cls] || []))),
                                      selected: userSubjects,
                                      isMulti: true
                                    })}
                                    className="p-2.5 bg-slate-50 text-primary rounded-xl active:scale-95 transition-all border border-slate-100 shadow-sm shrink-0"
                                  >
                                    <Edit3 size={16} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 5. LOCATIONS SECTION */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 px-2">
                               <div className="w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500"><MapPin size={14} /></div>
                               <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">{userType === 'parent' ? 'Select Location' : 'Preferred Locations'}</h3>
                            </div>
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                              <div className="p-4 flex items-center justify-between group hover:bg-slate-50/50 transition-all">
                                <div className="space-y-0.5">
                                  <label className="text-[8px] font-black uppercase text-slate-300 tracking-[0.15em]">City</label>
                                  <div className="text-sm font-bold text-slate-700">{userCity}</div>
                                </div>
                                <select 
                                  value={userCity} 
                                  onChange={(e) => { 
                                    const val = e.target.value;
                                    setUserCity(val); 
                                    localStorage.setItem('userCity', val); 
                                    setUserLocalities([]); // Reset localities when city changes
                                    localStorage.setItem('userLocalities', JSON.stringify([]));
                                  }}
                                  className="bg-slate-50 text-slate-500 text-[9px] font-bold p-2 rounded-xl border-none outline-none max-w-[120px]"
                                >
                                  {['All', ...CITIES_LIST].map(city => <option key={city} value={city}>{city}</option>)}
                                </select>
                              </div>

                              {userCity !== 'All' && (() => {
                                const cityKey = Object.keys(CITY_TO_LOCATIONS_DATA).find(k => k.toLowerCase() === userCity.toLowerCase());
                                const localities = cityKey ? CITY_TO_LOCATIONS_DATA[cityKey] : null;
                                if (!localities) return null;
                                return (
                                  <div className="p-4 flex items-center justify-between group hover:bg-slate-50/50 transition-all">
                                    <div className="space-y-0.5 flex-1 min-w-0 mr-4">
                                      <label className="text-[8px] font-black uppercase text-slate-300 tracking-[0.15em]">Specific Localities</label>
                                      <div 
                                        className="font-bold text-slate-700 leading-tight"
                                        style={{ fontSize: getDynamicFontSize((userLocalities || []).join(', ')) }}
                                      >
                                        {((userLocalities || [])).length > 0 ? (userLocalities || []).join(', ') : "Select Localities"}
                                      </div>                                    </div>
                                    <button 
                                      onClick={() => setShowSelectionDrawer({
                                        type: 'localities',
                                        title: 'Select Localities',
                                        options: localities,
                                        selected: userLocalities,
                                        isMulti: true
                                      })}
                                      className="p-2.5 bg-slate-50 text-primary rounded-xl active:scale-95 transition-all border border-slate-100 shadow-sm shrink-0"
                                    >
                                      <Edit3 size={16} />
                                    </button>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-50">
                             <button 
                               onClick={() => { playTapSound(); handleUpdateProfile(); }}
                               disabled={isUpdatingProfile}
                               className={cn(
                                 "w-full py-4 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2",
                                 isUpdatingProfile ? "bg-slate-400 cursor-not-allowed" : "bg-primary"
                               )}
                             >
                                {isUpdatingProfile ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save size={16} /> Save & Close
                                  </>
                                )}
                             </button>
                             <p className="text-center text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] mt-6">Last sync: {new Date().toLocaleDateString()}</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                     {activeUser ? (
                       <div className="space-y-3">
                         <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                           <div className="relative">
                             {profilePhoto ? (
                               <img src={profilePhoto} alt="User" className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover" />
                             ) : activeUser.photoURL ? (
                               <img src={activeUser.photoURL} alt="User" className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover" />
                             ) : (
                               <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border-2 border-white shadow-md">
                                 <LucideUser size={24} />
                               </div>
                             )}
                             <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-pointer active:scale-90 transition-all">
                               <Camera size={12} strokeWidth={3} />
                               <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                             </label>
                           </div>
                           <div className="min-w-0 flex-1">
                             <div className="text-[12px] font-black text-slate-900 truncate">{userName || activeUser.displayName || 'Signed In'}</div>
                             <div className="text-[10px] font-bold text-slate-400 truncate">{activeUser.email}</div>
                           </div>
                         </div>

                         {isAdminUser && (
                           <button onClick={() => { playTapSound(); setActiveTab('admin'); setShowProfileSetup(false); }} className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all">
                             <Settings size={16} /> Admin Panel
                           </button>
                         )}
                         <button onClick={handleLogout} className="w-full bg-rose-50 text-rose-500 p-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all mb-4">
                           <LogOut size={16} /> Sign Out
                         </button>

                         {/* Delete Profile Section */}
                         <div className="pt-4 border-t border-slate-100/50">
                           <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><AlertCircle size={12} /> Danger Zone</p>
                           <p className="text-[9px] font-medium text-slate-500 leading-snug mb-3">
                             Deleting your profile is permanent and will remove your data from our database.
                           </p>
                           <button
                             onClick={handleDeleteProfile}
                             disabled={isDeletingProfile}
                             className="w-full bg-rose-500 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                           >
                             {isDeletingProfile ? <Loader2 size={16} className="animate-spin" /> : (
                               <>
                                 <Trash2 size={16} /> Delete My Profile
                               </>
                             )}
                           </button>
                         </div>                       </div>
                     ) : null}
                   </div>

                   <div className="text-[7px] font-black text-slate-300 text-center uppercase tracking-[0.3em] pt-8 pb-2">DoAble India Network • v1.13.1</div>                   
                </div>
             </div>
          </div>
        )}

      <AnimatePresence>
        {showSelectionDrawer && (
          <div className="fixed inset-0 z-[16000] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSelectionDrawer(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                 <div className="space-y-0.5">
                   <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">{showSelectionDrawer.title}</h3>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                     {showSelectionDrawer.isMulti ? 'Multi-select enabled' : 'Choose one option'}
                   </p>
                 </div>
                 <button onClick={() => setShowSelectionDrawer(null)} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm transition-all">
                   <X size={16} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {showSelectionDrawer.options.map(opt => {
                  const active = showSelectionDrawer.selected.includes(opt);
                  return (
                    <button 
                      key={opt}
                      onClick={() => handleSelection(opt)}
                      className={cn(
                        "w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all active:scale-[0.98]",
                        active ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-slate-50 bg-white text-slate-600 hover:border-slate-100"
                      )}
                    >
                      <span className="text-[13px] font-bold tracking-tight">{opt}</span>
                      <div className={cn(
                        "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all",
                        active ? "bg-primary border-primary" : "border-slate-200"
                      )}>
                        {active && <Check size={14} strokeWidth={4} className="text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {showSelectionDrawer.isMulti && (
                <div className="p-5 border-t border-slate-100 bg-slate-50/50">
                  <button 
                    onClick={() => setShowSelectionDrawer(null)}
                    className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
                  >
                    Done ({showSelectionDrawer.selected.length} Selected)
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

