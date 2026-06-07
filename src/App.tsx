import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, MapPin, Loader2, Home as HomeIcon, FileText, User as LucideUser, Sparkles, BookOpen, GraduationCap, CheckCircle, LogOut, Settings, Edit3, Save, Bell, ChevronRight, Share2, Filter, X, MessageSquare, ExternalLink, Zap, ArrowRight, Navigation, Check, Sun, Cloud, Moon, Briefcase, BookText, ChevronDown, CreditCard, Heart, Volume2, Play, Info, Clock, MessageCircle, Calendar, Globe, ShieldCheck, TrendingUp, Hash, AlertCircle, Mail, Lock, Camera, Phone, Plus, Trash2, BadgeCheck, LogIn, UserPlus, ChevronLeft, Eye, EyeOff, Smartphone } from 'lucide-react';
import { collection, onSnapshot, query, where, orderBy, limit, addDoc, serverTimestamp, doc, getDoc, getDocs, setDoc, getDocsFromServer, enableNetwork } from 'firebase/firestore';
import { db, auth, auth as firebaseAuth, getFirebaseApiKey } from './firebase';
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
import { SuccessPop } from './components/common/SuccessPop';
import { FloatingToast } from './components/common/FloatingToast';
import { DetailItem } from './components/common/DetailItem';
import { NavButton } from './components/common/NavButton';
import { SelectionDrawer } from './components/common/SelectionDrawer';
import { FormModal } from './components/modals/FormModal';
import { JobDetailModal } from './components/modals/JobDetailModal';
import { TutorDetailModal } from './components/modals/TutorDetailModal';
import { ConfirmPostJobModal } from './components/modals/ConfirmPostJobModal';
import { ProfileSetupWizard } from './components/modals/ProfileSetupWizard';
import { AuthModal } from './components/modals/AuthModal';
import { AuthMode, AuthStep } from './hooks/useAuthState';
import { AuthService } from './services/auth.service';

import { requestNotificationPermission } from './firebase';
import { useNotifications } from './hooks/useNotifications';
import { useProfileState } from './hooks/useProfileState';
import { cn, getCityTheme, formatCurrency, getCityPhone, toTitleCase, getJobId, getTutorId, openWhatsApp, cleanValue, saveToLargeStorage, getFromLargeStorage, calculateProfileCompletion } from './utils';
import {
  CITIES_LIST,
  CLASSES_LIST,
  SPECIALIZED_SUB_CATEGORIES,
  SPECIALIZED_SUBJECTS,
  CLASS_SUBJECTS_DATA,
  CLASS_GROUP_MAPPING,
  CITY_TO_LOCATIONS_DATA,
  TUTOR_QUALIFICATIONS_LIST,
  TUTOR_EXPERIENCE_LIST,
  TUTOR_FEE_LIST,
  TIME_LIST
} from './utils/constants';

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
  const [authModalMode, setAuthModalMode] = useState<AuthMode>('signup');
  const [authModalStep, setAuthModalStep] = useState<AuthStep>('email');

  const handleAuthSuccess = (data: any) => {
    const isSignup = !!data.userId;
    const finalUserType = data.user?.userType || userType || 'teacher';
    const finalEmail = data.user?.email || data.email;
    const userData = { 
      email: finalEmail, 
      userType: finalUserType, 
      uid: data.user?.id || data.userId 
    };

    setCustomUser(userData);
    localStorage.setItem('customUser', JSON.stringify(userData));
    setUserType(finalUserType);
    localStorage.setItem('userType', finalUserType);

    if (!isSignup) {
      localStorage.removeItem('lastProfileUpdate');
      setTimeout(() => loadData(), 10);
      setActiveToast({ title: 'Welcome Back! 👋', body: `Signed in as ${userData.email}` });
      setShowProfileSetup(false);
    } else {
      setShowSuccess(true);
      setActiveToast({ title: 'Welcome! 🎊', body: 'Your account has been created.' });
      setShowProfileSetup(false); // Do not open automatically
    }
    
    playTapSound();
    setShowOnboarding(false);
  };

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [customUser, setCustomUser] = useState<any>(JSON.parse(localStorage.getItem('customUser') || 'null'));
  const activeUser = currentUser || customUser;

  const [deleteProfileText, setDeleteProfileText] = useState('');
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [showConfirmPost, setShowConfirmPost] = useState(false);

  const handleHideNeed = async () => {
    if (!activeUser?.email) return;
    setIsUpdatingProfile(true);
    try {
      const url = 'https://doableindia.com/app-sys/api.php';
      const params = new URLSearchParams();
      params.append('action', 'upsert');
      params.append('email', activeUser.email);
      params.append('status', 'Not Converted');

      const isNative = Capacitor.isNativePlatform();
      let responseOk = false;

      if (isNative) {
        const response = await CapacitorHttp.post({
          url: url,
          headers: { 'Content-Type': 'application/json' },
          data: { action: 'upsert', email: activeUser.email, status: 'Not Converted' }
        });
        responseOk = response.status === 200;
      } else {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        });
        responseOk = response.ok;
      }

      if (responseOk) {
        setActiveToast({ title: 'Status Updated', body: 'Your need is now hidden.' });

      }
    } catch (error) {
      console.error('Error hiding need:', error);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleConfirmPost = async () => {
    if (!activeUser?.email) return;
    setIsUpdatingProfile(true);
    try {
      const url = 'https://doableindia.com/app-sys/api.php';
      
      const fullPhone = (userCountryCode + userPhone).replace(/\s+/g, '');
      const parentData = {
        action: 'upsert',
        email: activeUser.email,
        Email: activeUser.email,
        name: `${userFirstName} ${userLastName}`.trim() || userName,
        Name: `${userFirstName} ${userLastName}`.trim() || userName,
        First_Name: userFirstName,
        Last_Name: userLastName,
        'First Name': userFirstName,
        'Last Name': userLastName,
        phone: fullPhone,
        Phone: fullPhone,
        userType: 'parent',
        status: 'Searching',
        Status: 'Searching',
        classes: userClasses, // Zoho Multi-select
        class: userClasses[1] || userClasses[0] || '',
        Class: userClasses[1] || userClasses[0] || '',
        class_group: userClasses[0] || '',
        'Class / Board': userClasses.includes('Entrance Exam & Specialization') 
          ? userBoard 
          : `${userClasses[1] || userClasses[0] || ''} (${userBoard})`,
        subjects: userSubjects, // Zoho Multi-select
        Subjects: userSubjects,
        'Subject(s)': userSubjects.join(', '),
        city: userCity,
        City: userCity,
        locality: userLocalities.join(', '),
        Locality: userLocalities.join(', '),
        location: userLocalities.map(loc => `${loc}-${userCity}`).join(', '),
        Location: userLocalities.map(loc => `${loc}-${userCity}`).join(', '),
        residency: userResidency,
        Residency: userResidency,
        block: userResidency,
        Block: userResidency,
        society: userResidency,
        Society: userResidency,
        gender: userGender,
        Gender: userGender,
        'Tutor Gender Preference': userGender,
        address: userAddress,
        Address: userAddress,
        board: userBoard,
        Board: userBoard,
        mode: userMode,
        Mode: userMode,
        'Mode of Teaching': userMode,
        time: userTime,
        Time: userTime,
        'Preferred Time': userTime,
        days: userDays,
        Days: userDays,
        'Available Days': userDays,
        duration: userDuration,
        Duration: userDuration,
        fee: userFee,
        Fee: userFee,
        'Fee/Month': userFee,
        notes: aboutMe,
        Notes: aboutMe,
        About: aboutMe,
        created_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
        locations: userLocalities.map(loc => `${loc}-${userCity}`).join(', ')
      };

      const isNative = Capacitor.isNativePlatform();
      let responseOk = false;

      if (isNative) {
        const response = await CapacitorHttp.post({
          url: url,
          headers: { 'Content-Type': 'application/json' },
          data: parentData
        });
        responseOk = response.status === 200;
      } else {
        const params = new URLSearchParams();
        Object.entries(parentData).forEach(([key, val]) => {
          params.append(key, String(val));
        });

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        });
        responseOk = response.ok;
      }
      
      if (responseOk) {
        loadData();
        setActiveToast({ title: 'Requirement Posted! 🚀', body: 'Tutors can now see your requirement.' });
        setShowConfirmPost(false);

      }
    } catch (error) {
      console.error('Error posting requirement:', error);
      setActiveToast({ title: 'Posting Failed ❌', body: 'Could not connect to server.' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

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
    setAuthModalMode('signup');
    setAuthModalStep('email');
    setShowOnboarding(true);
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
    setAuthModalMode('signin');
  };

  const handleDeleteProfile = async () => {
    if (!window.confirm("Are you absolutely sure? This will delete your profile completely. This action cannot be undone.")) return;

    setIsDeletingProfile(true);
    try {
      await AuthService.deleteProfile(activeUser?.email || '', tutorId);
      
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
      setActiveToast({ title: 'Delete Failed ❌', body: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsDeletingProfile(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!activeUser?.email) return;
    setIsUpdatingProfile(true);

    try {
      const data = await AuthService.updateProfile(
        { ...profile, email: activeUser.email },
        userType || 'teacher',
        tutors
      );

      if (data && (data.status === 'success' || data.message?.includes('success'))) {
        const finalId = data.tutor_id || data.order_id || data.zoho_id || data.id;
        if (finalId) {
          localStorage.setItem('tutorId', finalId.toString());
          setTutorId(finalId.toString());
        }

        // Save all fields for persistence (Email specific)
        if (userType === 'parent') {
          localStorage.setItem('userName', `${userFirstName} ${userLastName}`.trim());
          localStorage.setItem('userFirstName', userFirstName);
          localStorage.setItem('userLastName', userLastName);
          localStorage.setItem('userPhone', userPhone);
          localStorage.setItem('userCountryCode', userCountryCode);
          localStorage.setItem('userCity', userCity);
          localStorage.setItem('userGender', userGender || '');
          localStorage.setItem('userBoard', userBoard);
          localStorage.setItem('userMode', userMode);
          localStorage.setItem('userResidency', userResidency);
          localStorage.setItem('userClasses', JSON.stringify(userClasses));
          localStorage.setItem('userSubjects', JSON.stringify(userSubjects));
          localStorage.setItem('userLocalities', JSON.stringify(userLocalities));
          localStorage.setItem('userDays', userDays);
          localStorage.setItem('userTime', userTime);
          localStorage.setItem('userDuration', userDuration);
          localStorage.setItem('userFee', userFee);
          localStorage.setItem('aboutMe', aboutMe);
        }

        localStorage.setItem(`lastProfileUpdate_${activeUser.email}`, Date.now().toString());

        loadData();
        setShowSuccess(true);
        setShowProfileSetup(false);
      } else {
        setActiveToast({ title: 'Update Failed ❌', body: data?.message || 'Server error occurred' });
      }
    } catch (error: any) {
      console.error('Error syncing profile:', error);
      setActiveToast({ title: 'Connection Error', body: error.message || 'Please check your internet connection.' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const { profile, setProfile, updateField } = useProfileState();
  const {
    userCity, userName, userFirstName, userLastName, userCountryCode,
    tutorId, userGender, userType, userClasses, userSubjects,
    userLocalities, userPhone, userDob, userAge, userQualifications,
    userExperience, isSchoolTeacher, hasVehicle, aboutMe, profilePhoto,
    userBoard, userMode, userCommunication, userAddress, userDays,
    userTime, userDuration, userFee, userResidency, userAadhar, userSelfie
  } = profile;

  const setUserCity = (val: string) => updateField('userCity', val);
  const setUserName = (val: string | null) => updateField('userName', val);
  const setUserFirstName = (val: string) => updateField('userFirstName', val);
  const setUserLastName = (val: string) => updateField('userLastName', val);
  const setUserCountryCode = (val: string) => updateField('userCountryCode', val);
  const setTutorId = (val: string | null) => updateField('tutorId', val);
  const setUserGender = (val: string | null) => updateField('userGender', val);
  const setUserType = (val: UserType | null) => updateField('userType', val);
  const setUserClasses = (val: string[]) => updateField('userClasses', val);
  const setUserSubjects = (val: string[]) => updateField('userSubjects', val);
  const setUserLocalities = (val: string[]) => updateField('userLocalities', val);
  const setUserPhone = (val: string) => updateField('userPhone', val);
  const setUserDob = (val: string) => updateField('userDob', val);
  const setUserAge = (val: string) => updateField('userAge', val);
  const setUserQualifications = (val: string[]) => updateField('userQualifications', val);
  const setUserExperience = (val: string) => updateField('userExperience', val);
  const setIsSchoolTeacher = (val: string) => updateField('isSchoolTeacher', val);
  const setHasVehicle = (val: string) => updateField('hasVehicle', val);
  const setAboutMe = (val: string) => updateField('aboutMe', val);
  const setProfilePhoto = (val: string | null) => updateField('profilePhoto', val);
  const setUserBoard = (val: string) => updateField('userBoard', val);
  const setUserMode = (val: string) => updateField('userMode', val);
  const setUserCommunication = (val: string) => updateField('userCommunication', val);
  const setUserAddress = (val: string) => updateField('userAddress', val);
  const setUserDays = (val: string) => updateField('userDays', val);
  const setUserTime = (val: string) => updateField('userTime', val);
  const setUserDuration = (val: string) => updateField('userDuration', val);
  const setUserFee = (val: string) => updateField('userFee', val);
  const setUserResidency = (val: string) => updateField('userResidency', val);
  const setUserAadhar = (val: string) => updateField('userAadhar', val);
  const setUserSelfie = (val: string | null) => updateField('userSelfie', val);

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

  // Job Filters
  const [jobFilterClasses, setJobFilterClasses] = useState<string[]>([]);
  const [jobFilterGender, setJobFilterGender] = useState<string>('All');
  const [jobFilterLocalities, setJobFilterLocalities] = useState<string[]>([]);
  const [jobCityFilter, setJobCityFilter] = useState('all');
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [jobSortBy, setJobSortBy] = useState<'newest' | 'fee_high' | 'fee_low' | 'verified'>('newest');
  const [jobFilterMode, setJobFilterMode] = useState<string>('All'); // NEW: Mode Filter

  // Tutor Filters
  const [tutorFilterClasses, setTutorFilterClasses] = useState<string[]>([]);
  const [tutorFilterGender, setTutorFilterGender] = useState<string>('All');
  const [tutorFilterLocalities, setTutorFilterLocalities] = useState<string[]>([]);
  const [tutorCityFilter, setTutorCityFilter] = useState('all');
  const [tutorSearchQuery, setTutorSearchQuery] = useState('');
  const [tutorSortBy, setTutorSortBy] = useState<'newest' | 'fee_high' | 'fee_low' | 'verified'>('newest');

  const [showAdvancedFilterDrawer, setShowAdvancedFilterDrawer] = useState(false);
  const [showQuickPicker, setShowQuickPicker] = useState<'city' | 'locality' | 'class' | 'gender' | null>(null);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formType, setFormType] = useState<'teacher' | 'parent'>('teacher');
  const [activeTab, setActiveTab] = useState<'home' | 'jobs' | 'tutors' | 'alerts' | 'support' | 'admin' | 'earnings' | 'post_need'>('home');
  const [alertsInitialTab, setAlertsInitialTab] = useState<'feed' | 'support' | 'setup'>('feed');
  const [unseenAlertsCount, setUnseenAlertsCount] = useState(0);
  const [activeToast, setActiveToast] = useState<{ title: string, body: string } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [shortlistedIds, setShortlistedIds] = useState<string[]>(JSON.parse(localStorage.getItem('shortlistedIds') || '[]'));
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('customUser'));

  // Auto-open profile setup for new users or incomplete profiles
  useEffect(() => {
    if (activeUser && !showOnboarding && !showProfileSetup) {
      const userData = {
        name: userName,
        email: activeUser?.email,
        city: userCity,
        gender: userGender,
        phone: userPhone,
        dob: userDob,
        age: userAge,
        qualification: userQualifications,
        experience: userExperience,
        about: aboutMe,
        classes: userClasses,
        subjects: userSubjects,
        photo: profilePhoto,
        address: userAddress,
        mode: userMode,
        board: userBoard,
        aadhar: userAadhar,
        communication: userCommunication,
        localities: userLocalities,
        days: userDays,
        time: userTime,
        residency: userResidency,
        fee: userFee
      };
      const completion = calculateProfileCompletion(userData, userType);
      
      // Automatic popup disabled per user request
      /*
      if (completion < 40) {
        setShowProfileSetup(true);
      }
      */
    }
  }, [activeUser, showOnboarding, userType]);
  const [isSkipping, setIsSkipping] = useState(false);


  const [tutorStatus, setTutorStatus] = useState<'registered' | 'new' | null>(null);
  
  // Profile Auto-fill Logic
  const [tutorIdInput, setTutorIdInput] = useState('');
  const [isFetchingTutor, setIsFetchingTutor] = useState(false);
  const [tutorFetchError, setTutorFetchError] = useState<string | null>(null);
  const [isTutorFetched, setIsTutorFetched] = useState(false);

  // -------------------------------------------------------------
  // NEW: Robust Auto-fill Logic using existing data
  // -------------------------------------------------------------
  useEffect(() => {
    if (!activeUser?.email || !userType) {
      return;
    }
    
    const lastUpdate = parseInt(localStorage.getItem(`lastProfileUpdate_${activeUser.email}`) || '0');
    // If recently updated manually, don't auto-revert
    if (Date.now() - lastUpdate < 300000) {
      return;
    }

    const email = activeUser.email.toLowerCase().replace(/\s+/g, '');
    let lead: any = null;

    const parseMulti = (val: any) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      try { return JSON.parse(val); } catch { return val.toString().split(',').map((s: string) => s.trim()).filter(Boolean); }
    };

    if (userType === 'teacher' && tutors.length > 0) {
        const matches = tutors.filter(t => {
          const tEmail = (t.email || (t as any).Email || '').toString().toLowerCase().replace(/\s+/g, '');
          return tEmail === email;
        });
        
        if (matches.length > 0) {
          lead = matches.sort((a, b) => parseInt(b.tutor_id || '0') - parseInt(a.tutor_id || '0'))[0];
        }
    } else if (userType === 'parent' && (leads.length > 0 || firestoreLeads.length > 0)) {
        const combinedLeads = [...firestoreLeads, ...leads];
        const userLeads = combinedLeads.filter(l => {
          const lEmail = (l.email || (l as any).Email || (l as any).email || '').toString().toLowerCase().replace(/\s+/g, '');
          return lEmail === email && email.length > 5;
        });

        if (userLeads.length > 0) {
          lead = userLeads.sort((a, b) => new Date(b['Updated Time'] || (b as any).updated_at || 0).getTime() - new Date(a['Updated Time'] || (a as any).updated_at || 0).getTime())[0];
        }
    }

    if (lead) {
        // Bulletproof Case-Insensitive Extractor
        const getVal = (obj: any, keys: string[], fallback: string = '') => {
          const objKeys = Object.keys(obj);
          for (const searchKey of keys) {
            if (obj[searchKey] !== undefined && obj[searchKey] !== null && obj[searchKey] !== '' && obj[searchKey] !== 'undefined') return obj[searchKey];
            const foundKey = objKeys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === searchKey.toLowerCase().replace(/[^a-z0-9]/g, ''));
            if (foundKey && obj[foundKey] !== undefined && obj[foundKey] !== null && obj[foundKey] !== '' && obj[foundKey] !== 'undefined') return obj[foundKey];
          }
          return fallback;
        };

        const normalizeCommaStr = (val: any) => {
          if (!val) return '';
          return val.toString().split(',').map((s: string) => s.trim()).filter(Boolean).join(', ');
        };

        const foundId = getVal(lead, ['tutor_id', 'order_id', 'orderId', 'Order ID', 'id', 'ID']).toString();
        const fullName = getVal(lead, ['name', 'Name', 'Full_Name', 'fullName']); 
        const city = getVal(lead, ['city', 'City', 'Preferred_City']);
        const phone = getVal(lead, ['phone', 'Phone', 'Mobile']).toString().replace('+91', '').trim();
        const gender = getVal(lead, ['gender', 'Gender', 'Sex']) || 'Male';
        const dob = getVal(lead, ['dob', 'DOB', 'Date_of_Birth', 'birth_date']);
        const age = getVal(lead, ['age', 'Age']);
        const qualification = parseMulti(getVal(lead, ['qualification', 'Qualification', 'qualifications']));
        const experience = getVal(lead, ['experience', 'Experience']);
        const subjects = parseMulti(getVal(lead, ['subjects', 'Subjects', 'subject', 'Subject'])); 
        const aadhar = getVal(lead, ['aadhar', 'Aadhar', 'Aadhar_Number']);
        const address = getVal(lead, ['address', 'Address', 'Full_Address']);
        const communication = getVal(lead, ['communication', 'Communication']);
        const vehicle = getVal(lead, ['have_vehicle', 'vehicle', 'Vehicle']);
        const schoolExp = getVal(lead, ['school_teacher', 'school_exp', 'School_Teacher']);

        const dbClassGrp = getVal(lead, ['class_group', 'Class', 'class', 'classGroup']);
        const dbLocs = parseMulti(getVal(lead, ['location', 'locality', 'locations', 'Locality', 'Locations']));
        const dbDays = normalizeCommaStr(getVal(lead, ['days', 'Days', 'Available_Day_s', 'weekly_days', 'Weekly Days']));
        const dbTime = normalizeCommaStr(getVal(lead, ['time', 'Time', 'Available_Time_s', 'preferred_time', 'Preferred Time']));
        const dbFee = getVal(lead, ['fee', 'Fee', 'Fee_hour', 'monthly_fee', 'budget']);
        const dbAbout = getVal(lead, ['about', 'About', 'Notes', 'requirement', 'requirement_details']);
        const dbResidency = getVal(lead, ['residency', 'Residency', 'society', 'Block', 'block', 'society_name']);
        const dbDuration = getVal(lead, ['duration', 'Duration', 'avg_duration']);
        const dbMode = getVal(lead, ['mode', 'Mode', 'Mode of Teaching']);

        // BATCH UPDATE
        const nextProfile: any = { ...profile };

        if (foundId) { nextProfile.tutorId = foundId; localStorage.setItem('tutorId', foundId); }
        if (fullName) {
          const parts = fullName.trim().split(/\s+/);
          nextProfile.userFirstName = parts[0] || '';
          nextProfile.userLastName = parts.slice(1).join(' ') || '';
          nextProfile.userName = fullName;
          localStorage.setItem('userFirstName', nextProfile.userFirstName);
          localStorage.setItem('userLastName', nextProfile.userLastName);
          localStorage.setItem('userName', fullName);
        }
        if (city) { nextProfile.userCity = city; localStorage.setItem('userCity', city); }
        if (phone) { nextProfile.userPhone = phone; localStorage.setItem('userPhone', phone); }
        if (gender) { nextProfile.userGender = gender; localStorage.setItem('userGender', gender); }
        if (dob) { nextProfile.userDob = dob; localStorage.setItem('userDob', dob); }
        if (age) { nextProfile.userAge = age; localStorage.setItem('userAge', age); }
        if (experience) { nextProfile.userExperience = experience; localStorage.setItem('userExperience', experience); }
        if (qualification.length > 0) { nextProfile.userQualifications = qualification; localStorage.setItem('userQualifications', JSON.stringify(qualification)); }
        if (subjects.length > 0) { nextProfile.userSubjects = subjects; localStorage.setItem('userSubjects', JSON.stringify(subjects)); }
        if (aadhar) { nextProfile.userAadhar = aadhar; localStorage.setItem('userAadhar', aadhar); }
        if (address) { nextProfile.userAddress = address; localStorage.setItem('userAddress', address); }
        if (communication) { nextProfile.userCommunication = communication; localStorage.setItem('userCommunication', communication); }
        if (vehicle) { nextProfile.hasVehicle = vehicle; localStorage.setItem('hasVehicle', vehicle); }
        if (schoolExp) { nextProfile.isSchoolTeacher = schoolExp; localStorage.setItem('isSchoolTeacher', schoolExp); }
        if (dbLocs.length > 0) { nextProfile.userLocalities = dbLocs; localStorage.setItem('userLocalities', JSON.stringify(dbLocs)); }
        if (dbDays) { nextProfile.userDays = dbDays; localStorage.setItem('userDays', dbDays); }
        if (dbTime) { nextProfile.userTime = dbTime; localStorage.setItem('userTime', dbTime); }
        if (dbFee) { nextProfile.userFee = dbFee; localStorage.setItem('userFee', dbFee); }
        if (dbAbout) { nextProfile.aboutMe = dbAbout; localStorage.setItem('aboutMe', dbAbout); }
        if (dbResidency) { nextProfile.userResidency = dbResidency; localStorage.setItem('userResidency', dbResidency); }
        if (dbDuration) { nextProfile.userDuration = dbDuration; localStorage.setItem('userDuration', dbDuration); }
        if (dbMode) { nextProfile.userMode = dbMode; localStorage.setItem('userMode', dbMode); }

        if (userType === 'teacher' && dbClassGrp) {
          const groups = ['Class I to V', 'Class VI to VIII', 'Class IX to X', 'Class XI to XII', 'Entrance Exam & Specialization'];
          const matched = groups.find(g => dbClassGrp.includes(g));
          if (matched) { nextProfile.userClasses = [matched]; localStorage.setItem('userClasses', JSON.stringify([matched])); }
          setIsTutorFetched(true);
        } else if (userType === 'parent') {
          let extractedClass = '';
          if (dbClassGrp && dbClassGrp.includes('(')) {
            extractedClass = dbClassGrp.split('(')[0].trim();
            const board = dbClassGrp.match(/\((.*?)\)/)?.[1] || '';
            if (board) { nextProfile.userBoard = board; localStorage.setItem('userBoard', board); }
          } else if (dbClassGrp) extractedClass = dbClassGrp;
          if (extractedClass) { nextProfile.userClasses = [extractedClass]; localStorage.setItem('userClasses', JSON.stringify([extractedClass])); }
        }
        
        setProfile(nextProfile);
        setShowOnboarding(false);
      } else {
       const dataLoaded = (userType === 'teacher' && tutors.length > 0) || (userType === 'parent' && (leads.length > 0 || firestoreLeads.length > 0));
       if (dataLoaded) {
          setTutorId(null);
          localStorage.removeItem('tutorId');
          setIsTutorFetched(false);
       }
    }
  }, [activeUser, userType, tutors, leads, firestoreLeads]);
  // -------------------------------------------------------------


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

        if (name) {
          const parts = name.trim().split(/\s+/);
          const fName = parts[0] || '';
          const lName = parts.slice(1).join(' ') || '';
          setUserFirstName(fName); 
          setUserLastName(lName);
          localStorage.setItem('userFirstName', fName);
          localStorage.setItem('userLastName', lName);
        }

        setUserName(toTitleCase(name));
        localStorage.setItem('userName', toTitleCase(name));
        setUserGender(toTitleCase(gender));
        localStorage.setItem('userGender', toTitleCase(gender));
        setUserCity(toTitleCase(city));
        localStorage.setItem('userCity', toTitleCase(city));
        
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
    if (userCity) {
      localStorage.setItem('userCity', userCity);
      const finalFilter = userCity.toLowerCase() === 'all' ? 'all' : userCity.toLowerCase();
      setJobCityFilter(finalFilter);
      setTutorCityFilter(finalFilter);
    }
  }, [userCity]);

  // Automatically fetch alerts from server when user enters the alerts tab
  useEffect(() => {
    if (activeTab === 'alerts' && !alertsLoading) {
      fetchAlertsFromServer();
    }
  }, [activeTab]);

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
    } catch (e: any) {
      console.error('Server Fetch Error: ' + e.message);
      setAlertsLoading(false);
    }
  };

  useEffect(() => {
    setAlertsLoading(true);
    let isMounted = true;
    let fallbackTimeout: any = null;
    
    // 1. Primary Real-time Sync
    const q = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'), limit(50));
    
    // Safety: If Firestore doesn't return anything in 6 seconds, try REST fallback
    fallbackTimeout = setTimeout(() => {
      if (isMounted && alertsLoading && alerts.length === 0) {
         // console.warn('⏱️ Firestore Alerts timeout - Triggering REST Fallback');
        initializeAlertsFallback();
      }
    }, 6000);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
      if (!isMounted) return;

      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        // Ensure timestamp is consistent
        timestamp: (doc.data() as any).timestamp?.toDate?.() || new Date((doc.data() as any).timestamp || Date.now())
      })) as Alert[];
      
      // console.log(`SYNC_SUCCESS: ${data.length} alerts.`);
      setAlerts(data);
      setAlertsLoading(false);
      setIsServerData(true);
    }, (err) => {
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
      console.error('Snapshot Error, falling back to REST:', err);
      // 2. Fallback REST Sync (if Firestore listener fails due to network/perms)
      initializeAlertsFallback();
    });

    const initializeAlertsFallback = async () => {
      try {
        const API_KEY = getFirebaseApiKey();
        const REST_URL = `https://firestore.googleapis.com/v1/projects/doable-india-app-9564b-496310/databases/(default)/documents/alerts?pageSize=50&key=${API_KEY}`;
        
         // console.log('📡 Fetching alerts via REST Fallback...');
        const response = await fetch(REST_URL);
        const data = await response.json();
        
        if (data.documents && isMounted) {
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
        if (isMounted) {
          console.error('Fallback Error:', e);
          setAlertsLoading(false);
        }
      }
    };

    return () => {
      isMounted = false;
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
      unsubscribe();
    };
  }, [userCity]);

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
    // Helper to get value with case-insensitive key search
    const getSafe = (keys: string[], fallback: any = '') => {
      const objKeys = Object.keys(t);
      for (const searchKey of keys) {
        // 1. Try exact match
        if (t[searchKey] !== undefined && t[searchKey] !== null && t[searchKey] !== '' && t[searchKey] !== 'undefined') return t[searchKey];
        // 2. Try case-insensitive fuzzy match
        const foundKey = objKeys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === searchKey.toLowerCase().replace(/[^a-z0-9]/g, ''));
        if (foundKey && t[foundKey] !== undefined && t[foundKey] !== null && t[foundKey] !== '' && t[foundKey] !== 'undefined') return t[foundKey];
      }
      return fallback;
    };

    const safeParse = (str: any) => {
      if (Array.isArray(str)) return str;
      if (!str) return [];
      try {
        const parsed = JSON.parse(str);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        return str.toString().split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    };

    const normalized = {
      tutor_id: getSafe(['tutor_id', 'Tutor ID', 'id', 'ID']),
      name: getSafe(['name', 'Name', 'Full Name', 'fullName']),
      email: getSafe(['email', 'Email']),
      phone: getSafe(['phone', 'Phone', 'Mobile']),
      internal_phone: getSafe(['phone', 'Phone', 'internal_phone']),
      gender: getSafe(['gender', 'Gender', 'Sex', 'tutor_gender', 'Tutor_Gender']),
      age: getSafe(['age', 'Age', 'tutor_age', 'Tutor_Age']),
      dob: getSafe(['dob', 'DOB', 'Date of Birth', 'birth_date', 'Date_of_Birth']),
      qualification: safeParse(getSafe(['qualification', 'Qualification(s)', 'Qualification'])),
      experience: getSafe(['experience', 'Experience', 'Teaching Experience']),
      school_teacher: getSafe(['school_teacher', 'School Exp.', 'school_exp'], 'No'),
      days: getSafe(['days', 'Days', 'Available Days', 'Available Day(s)', 'weekly days', 'Weekly Day(s)', 'Weekly Days', 'weekly_days']),
      time: getSafe(['time', 'Time', 'Preferred Time', 'preferred time', 'Available Time']),
      class_group: safeParse(getSafe(['class_group', 'Class', 'Preferred Class Group', 'classes'])),
      subjects: safeParse(getSafe(['subjects', 'Subjects', 'Preferred Subject(s)', 'subject', 'Subject'])),
      city: getSafe(['city', 'City', 'Preferred City', 'preferred city']),
      location: safeParse(getSafe(['location', 'Locality', 'Preferred Location(s)', 'Teaching Locality', 'Address'])),
      have_vehicle: getSafe(['have_vehicle', 'Have own Vehicle', 'vehicle'], 'No'),
      communication: getSafe(['communication', 'Communication']),
      mode: getSafe(['mode', 'Mode', 'Mode of Teaching']),
      fee: getSafe(['fee', 'Fee', 'Fee/Month', 'Monthly Fee', 'Fee_hour']),
      aadhar: getSafe(['aadhar', 'Aadhar', 'Aadhar Number', 'Aadhar_Number']),
      address: getSafe(['address', 'Address', 'Full Address', 'Full_Address']),
      residency: getSafe(['residency', 'Residency', 'society', 'block']),
      about: getSafe(['about', 'About', 'bio', 'Notes', 'requirement']),
      status: getSafe(['status', 'Status'], 'Active'),
      photo: getSafe(['photo', 'Photo', 'Profile Pic', 'userPhoto']),
      verified: getSafe(['verified', 'Verified', 'is_verified'], 'No'),
      selfie: getSafe(['selfie', 'Selfie']),
      active_tuitions: parseInt(getSafe(['active_tuitions', 'Active_Tuitions', 'tuitions', 'Active Tuitions'], '0')),
      monthly_earnings: parseFloat(getSafe(['monthly_earnings', 'Monthly_Earnings', 'earnings', 'Monthly Earnings'], '0')),
      created_time: getSafe(['created_time', 'Record Added', 'timestamp'])
    };

    return normalized;
  };

  const normalizeLead = (l: any): JobLead => {
    // Helper to get value with case-insensitive key search
    const getSafe = (keys: string[], fallback: string = '') => {
      for (const k of keys) {
        if (l[k] !== undefined && l[k] !== null && l[k] !== '' && l[k] !== 'undefined') return l[k];
      }
      // Case-insensitive fallback
      const objKeys = Object.keys(l);
      for (const searchKey of keys) {
        const foundKey = objKeys.find(k => k.toLowerCase() === searchKey.toLowerCase());
        if (foundKey && l[foundKey] !== undefined && l[foundKey] !== null && l[foundKey] !== '') return l[foundKey];
      }
      return fallback;
    };

    const orderId = getSafe(['Order ID', 'order_id', 'id', 'ID']).toString();
    
    const normalized: JobLead = {
      'Order ID': orderId,
      id: orderId,
      order_id: orderId,
      'Internal Remark': getSafe(['Internal Remark', 'status', 'internal_remark']),
      'Updated Time': getSafe(['Updated Time', 'Record Added', 'updated_at', 'created_time', 'timestamp']),
      City: getSafe(['City', 'city', 'Preferred_City']),
      Name: getSafe(['Name', 'name', 'fullName'], 'Student Lead'),
      'Class / Board': getSafe(['Class / Board', 'class_group', 'Class', 'class']),
      Class: getSafe(['Class', 'class', 'class_group']),
      Board: getSafe(['Board', 'board']),
      Locations: getSafe(['Locations', 'locations', 'location', 'locality']),
      Gender: getSafe(['Gender', 'gender', 'preferred_gender'], 'Any'),
      Fee: getSafe(['Fee', 'fee', 'monthly_fee', 'budget', 'Fee_hour'], '0'),
      Notes: getSafe(['Notes', 'notes', 'requirement', 'requirement_details']),
      subjects: getSafe(['subjects', 'Subjects', 'Preferred Subject(s)', 'subject']),
      residency: getSafe(['residency', 'society', 'society_name']),
      duration: getSafe(['duration', 'Duration', 'avg_duration'], '1.5 Hours'),
      days: getSafe(['days', 'Days', 'Available Days', 'Available Day(s)', 'weekly days', 'Weekly Day(s)', 'Weekly Days', 'weekly_days', 'Weekly_Days']),
      time: getSafe(['time', 'Time', 'Preferred Time', 'Available Time', 'Available time', 'preferred_time']),
      mode: getSafe(['mode', 'Mode', 'Mode of Teaching', 'Mode of teaching'], 'Home Tuition'),
      status: getSafe(['status', 'Internal Remark', 'internal_remark'], 'Active'),
      email: getSafe(['email', 'Email']),
      phone: getSafe(['phone', 'Phone']),
      address: getSafe(['address', 'Address']),
      locality: getSafe(['locality', 'Locality', 'location', 'locations'])
    };

    // Fix Class / Board if it's just class_group
    if (normalized['Class / Board'] && !normalized['Class / Board'].includes('(') && normalized.Board) {
      normalized['Class / Board'] = `${normalized['Class / Board']} (${normalized.Board})`;
    }
    
    // Debug logging for weekly days field identification
    if (!normalized.days) {
      const dayKeys = Object.keys(l).filter(k => k.toLowerCase().includes('day') || k.toLowerCase().includes('weekly'));
      if (dayKeys.length > 0) {
         // console.log(`🔍 [Normalize-Lead-Days-Debug] Order #${orderId} missing days. Found potential keys:`, dayKeys.map(k => `${k}: "${l[k]}"`));
      }
    }

    if (orderId === '7752') {
      console.log('🔍 [Normalize-Lead-Debug] Order #7752 Raw:', l);
      console.log('🔍 [Normalize-Lead-Debug] Order #7752 Normalized:', normalized);
    }
    
    return normalized;
  };

  const handleApplyJob = async (job: any) => {
    try {
      playTapSound();
      const currentTutorId = localStorage.getItem('tutorId');
      const orderId = getJobId(job);
      
      if (!currentTutorId) {
        setActiveToast({ title: 'Profile Needed', body: 'Please complete your profile to apply for jobs.' });
        setShowProfileSetup(true);
        return;
      }

      // 1. Silent Background API Call to record application
      fetch('https://doableindia.com/app-sys/api_copy.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply_job',
          order_id: orderId,
          tutor_id: currentTutorId
        })
      }).catch(e => console.warn('Silent apply failed:', e));

      // 2. Immediate WhatsApp Redirection
      const whatsappMsg = `Hi, I am interested in Job Order ID: #${orderId}.
Subjects: ${job.subjects || 'General'}

Regards,
${userName || 'Tutor'}
Tutor ID: #${currentTutorId}
Phone: ${userPhone}
City: ${userCity}`;

      openWhatsApp(whatsappMsg);
      
    } catch (error) {
      console.error('Apply Job Error:', error);
    }
  };

  const loadData = async () => {
     // console.log('🚀 [Data-Loader] STARTING Version: 2.5.0 (Parent-Fix)');
    try {
      // Cleanup old bulky localStorage cache if it exists
      if (localStorage.getItem('cachedTutors')) {
        localStorage.removeItem('cachedTutors');
        console.log('🗑️ Old localStorage cache purged.');
      }

      // 1. Instantly load from cache if available
      const cachedLeads = localStorage.getItem('cachedLeads');
      const cachedTutors = await getFromLargeStorage('cachedTutors');
      
      if (cachedLeads) setLeads(JSON.parse(cachedLeads).map(normalizeLead));
      if (cachedTutors) setTutors(cachedTutors.map(normalizeTutor));

      if (leads.length === 0 && tutors.length === 0 && !cachedLeads) {
        setLoading(true);
      }
      
      const isNative = Capacitor.isNativePlatform();
      const ts = Date.now();
      
      // Fix: Tutors see ALL jobs, Parents see only THEIR jobs
      const leadsEmailParam = (userType === 'parent' && activeUser?.email) ? `&email=${encodeURIComponent(activeUser.email.toLowerCase().replace(/\s+/g, ''))}` : '';
      
      const LEADS_URL = Capacitor.isNativePlatform() ? `https://doableindia.com/app-sys/api_data.php?t=${ts}${leadsEmailParam}` : `/api/leads?t=${ts}${leadsEmailParam}`;
      
      // Fix: Never filter Tutors list by email, otherwise 'Featured Tutors' and matching will break
      const TUTORS_URL = Capacitor.isNativePlatform() ? `https://doableindia.com/app-sys/api_copy_data.php?force_refresh=${ts}` : `/api/tutors?t=${ts}`;

       // console.log('📡 [Network] Fetching Leads from:', LEADS_URL);

      if (isNative) {
        // Use native fetch to bypass CORS
        const [leadsRes, tutorsRes] = await Promise.all([
          CapacitorHttp.get({ 
            url: LEADS_URL,
            headers: { 'Accept': 'application/json' }
          }),
          CapacitorHttp.get({ 
            url: TUTORS_URL,
            headers: { 
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/json'
            }
          })
        ]);
        
        if (leadsRes.data) {
           const data = typeof leadsRes.data === 'string' ? JSON.parse(leadsRes.data) : leadsRes.data;
           console.log('📡 RAW LEADS DATA:', data);
           if (data.status === 'success') {
             const normalized = data.data.map(normalizeLead);
             setLeads(normalized);
             localStorage.setItem('cachedLeads', JSON.stringify(normalized));
           } else if (Array.isArray(data)) {
             const normalized = data.map(normalizeLead);
             setLeads(normalized);
             localStorage.setItem('cachedLeads', JSON.stringify(normalized));
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
        
        if (userType === 'parent') {
          console.log('🔍 [Network-Parent-Debug] Raw API Response for Parent:', leadsJson);
        } else {
           // console.log('🌐 WEB RAW LEADS DATA:', leadsJson);
        }

        if (leadsJson.status === 'success') {
          const normalized = leadsJson.data.map(normalizeLead);
          setLeads(normalized);
          localStorage.setItem('cachedLeads', JSON.stringify(normalized));
        } else if (Array.isArray(leadsJson)) {
          const normalized = leadsJson.map(normalizeLead);
          setLeads(normalized);
          localStorage.setItem('cachedLeads', JSON.stringify(normalized));
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
    if (activeUser?.email) {
      console.log('🔄 [Auth] Triggering data refresh for:', activeUser.email, 'UserType:', userType);
      loadData();
    }
  }, [activeUser?.email, userType]);

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
      const leadsData = snapshot.docs.map(doc => normalizeLead({ id: doc.id, ...doc.data() }));
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

  const handleGoogleSignIn = async () => {
    try {
      playTapSound();
      console.log('🔄 handleGoogleSignIn started...');
      
      if (Capacitor.isNativePlatform()) {
        console.log('📱 Native Platform: Initializing GoogleAuth.signIn()...');
        const user = await GoogleAuth.signIn();
        console.log('✅ GoogleAuth.signIn() Success:', JSON.stringify(user));
        
        if (!user.authentication.idToken) {
          console.error('❌ No idToken in user.authentication');
          setActiveToast({ title: 'Sign-in Error', body: 'idToken missing from Google response.' });
    
          return;
        }

        console.log('🔥 Firebase: signInWithCredential starting...');
        const credential = GoogleAuthProvider.credential(user.authentication.idToken);
        const result = await signInWithCredential(auth, credential);
        console.log('🎉 Firebase: Login Success!', result.user.email);
        if (userType) localStorage.setItem('userType', userType);
        setShowOnboarding(false);
        setShowSuccess(true);
        setActiveToast({ title: 'Welcome! 👋', body: `Signed in as: ${result.user.email}` });

      } else {
        console.log('🌐 Web Platform: signInWithPopup starting...');
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        console.log('🎉 Firebase: Web Login Success!', result.user.email);
        if (userType) localStorage.setItem('userType', userType);
        setShowOnboarding(false);
        setShowSuccess(true);
        setActiveToast({ title: 'Welcome! 👋', body: `Signed in as: ${result.user.email}` });

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

      
      if (errorMsg.includes('10:') || errorMsg.includes('DEVELOPER_ERROR')) {
        console.warn('DEBUG HINT: This is usually a SHA-1 or Client ID mismatch in Firebase/Google Console.');
      }
    }
  };

  const isAdminUser = useMemo(() => {
    const email = activeUser?.email?.toLowerCase().trim();
    return email === 'd9717018219@gmail.com' || email === 'doableindia@gmail.com';
  }, [activeUser]);

  const profileCompletion = useMemo(() => {
    const userData = {
      name: userName,
      email: activeUser?.email,
      city: userCity,
      gender: userGender,
      phone: userPhone,
      dob: userDob,
      age: userAge,
      qualification: userQualifications,
      experience: userExperience,
      communication: userCommunication,
      about: aboutMe,
      classes: userClasses,
      subjects: userSubjects,
      photo: profilePhoto,
      address: userAddress,
      mode: userMode,
      board: userBoard,
      residency: userResidency,
      localities: userLocalities,
      days: userDays,
      time: userTime,
      duration: userDuration,
      fee: userFee,
      aadhar: userAadhar
    };
    return calculateProfileCompletion(userData, userType);
  }, [userName, activeUser, userCity, userGender, userPhone, userDob, userAge, userQualifications, userExperience, userCommunication, aboutMe, userClasses, userSubjects, profilePhoto, userAddress, userMode, userBoard, userResidency, userLocalities, userDays, userTime, userDuration, userFee, userAadhar, userType]);

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
    setJobFilterMode('All');
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
    if (filter.toLowerCase() === 'all') return true;
    if (!city) return false;
    const c = city.toString().toLowerCase().trim();
    const f = filter.toLowerCase().trim();
    if (c === f) return true;
    if (f === 'noida' && c === 'greater noida') return false;
    if (f === 'greater noida' && c === 'noida') return false;
    return c.includes(f) || f.includes(c);
  }, []);

  const rawActiveJobs = useMemo(() => {
    const combined = [...firestoreLeads, ...leads];
    const unique = new Map<string, JobLead>();
    combined.forEach(l => {
      const id = l['Order ID'] || (l as any).id || (l as any).order_id;
      if (id && !unique.has(id)) unique.set(id, l);
    });
    return Array.from(unique.values()).filter(l => {
      const internalRemark = (l['Internal Remark'] || (l as any).status || (l as any).Status || '').toString().trim().toLowerCase();
      return internalRemark === 'searching';
    });
  }, [leads, firestoreLeads]);

  const rawActiveTutors = useMemo(() => {
    return tutors; // Show all tutors, no status filtering
  }, [tutors]);

  const finalJobs = useMemo(() => {
    return rawActiveJobs.filter(l => {
      // City Filter
      if (jobCityFilter && jobCityFilter.toLowerCase() !== 'all') {
        const cityVal = l.City || (l as any).city;
        if (!isCityMatch(cityVal, jobCityFilter)) return false;
      }

      // Localities Filter
      if (jobFilterLocalities.length > 0) {
        const jobLocs = (l.Locations || (l as any).location || (l as any).locations || '').toLowerCase();
        const hasMatch = jobFilterLocalities.some(loc => {
          const escapedLoc = loc.toLowerCase().trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\b${escapedLoc}\\b`, 'i');
          return regex.test(jobLocs);
        });
        if (!hasMatch) return false;
      }

      // Classes Filter
      if (jobFilterClasses.length > 0) {
        const jobClass = (l.Class || l['Class / Board'] || (l as any).class_group || (l as any).class || '').toLowerCase();
        const matchesClass = jobFilterClasses.some(cls => {
          if (jobClass.includes(cls.toLowerCase())) return true;
          const mappedClasses = CLASS_GROUP_MAPPING[cls];
          if (mappedClasses && mappedClasses.some(m => jobClass.includes(m.toLowerCase()))) return true;
          return false;
        });
        if (!matchesClass) return false;
      }

      // Gender Filter (Handles 'Any', 'Both', 'Male/Female', and partial matches)
      if (jobFilterGender !== 'All') {
        // Prioritize 'gender' column as requested by the user, then fallbacks
        const jobGender = ((l as any).gender || l.Gender || (l as any).preferred_gender || (l as any).requiredGender || '').toLowerCase().trim();
        const fGender = jobFilterGender.toLowerCase().trim();

        // Use regex for precise matching (prevents "female" matching "male")
        const hasFemale = /female/i.test(jobGender);
        const hasMale = /\bmale\b/i.test(jobGender); // \b ensures it doesn't match "female"
        
        const isAny = jobGender === '' || /any/i.test(jobGender) || /both/i.test(jobGender) || jobGender.includes('/') || (hasFemale && hasMale);
        
        if (!isAny) {
          if (fGender === 'female') {
            if (!hasFemale) return false;
          } else if (fGender === 'male') {
            if (!hasMale) return false;
          }
        }
      }

      // Mode Filter
      if (jobFilterMode !== 'All') {
        const jobMode = (l.Mode || (l as any).mode || (l as any)['Mode of Teaching'] || (l as any)['Mode of teaching'] || '').toLowerCase().trim();
        const fMode = jobFilterMode.toLowerCase().trim();
        
        const isOnlineFilter = fMode.includes('online');
        const isHomeFilter = fMode.includes('home');
        
        const isOnlineJob = jobMode.includes('online');
        const isHomeJob = jobMode.includes('home') || jobMode.includes('offline') || jobMode === '';
        const isAny = jobMode.includes('any') || jobMode.includes('both');
        
        if (!isAny) {
          if (isOnlineFilter && !isOnlineJob) return false;
          if (isHomeFilter && !isHomeJob) return false;
          if (!isOnlineFilter && !isHomeFilter && !jobMode.includes(fMode)) return false;
        }
      }

      if (jobSearchQuery) {
        const sl = jobSearchQuery.toLowerCase();
        const jName = (l.Name || (l as any).name || '').toLowerCase();
        const jID = (l['Order ID'] || (l as any).id || (l as any).order_id || '').toString().toLowerCase();
        const subjects = (l.subjects || (l as any).subjects || '').toLowerCase();
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
    return rawActiveTutors.filter(t => {
      const cityVal = t.city || (t as any).City;
      if (!isCityMatch(cityVal, tutorCityFilter)) return false;

      // Localities Filter
      if (tutorFilterLocalities.length > 0) {
        const tutorLocs = (Array.isArray(t.location) ? t.location.join(', ') : (t.location || '')).toString().toLowerCase();
        const hasMatch = tutorFilterLocalities.some(loc => {
          const escapedLoc = loc.toLowerCase().trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\b${escapedLoc}\\b`, 'i');
          return regex.test(tutorLocs);
        });
        if (!hasMatch) return false;
      }

      // Classes Filter
      if (tutorFilterClasses.length > 0) {
        const tutorClassArr = t.class_group || (t as any).classes || [];
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

      // Gender Filter (Handles 'Any', 'Both', 'Male/Female')
      if (tutorFilterGender !== 'All') {
        const tGender = (t.gender || (t as any).Gender || '').toLowerCase().trim();
        const fGender = tutorFilterGender.toLowerCase().trim();
        
        if (tGender !== '') {
          const isAny = tGender.includes('any') || tGender.includes('both') || tGender.includes('/');
          const isExactMatch = tGender === fGender;
          
          if (!isAny && !isExactMatch) return false;
        }
      }

      if (tutorSearchQuery) {
        const sl = tutorSearchQuery.toLowerCase();
        const tName = (t.name || '').toLowerCase();
        const tID = (t.tutor_id || (t as any).id || '').toString().toLowerCase();
        const subjects = JSON.stringify(t.subjects || []).toLowerCase();
        if (!(tName.includes(sl) || tID.includes(sl) || subjects.includes(sl))) return false;
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

  const localActiveJobs = useMemo(() => {
    return rawActiveJobs.filter(l => userCity === 'All' || isCityMatch(l.City || (l as any).city, userCity));
  }, [rawActiveJobs, userCity, isCityMatch]);

  const localActiveTutors = useMemo(() => {
    return rawActiveTutors.filter(t => userCity === 'All' || isCityMatch(t.city || (t as any).City, userCity));
  }, [rawActiveTutors, userCity, isCityMatch]);

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
      <AuthModal 
        show={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onSuccess={handleAuthSuccess}
        onGoogleSignIn={handleGoogleSignIn}
        playTapSound={playTapSound}
        setActiveToast={setActiveToast}
        userType={userType}
        setUserType={setUserType}
        userName={userName}
        initialMode={authModalMode}
        initialStep={authModalStep}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@300..700&display=swap');
        
        :root {
          --safe-area-top: env(safe-area-inset-top, 0px);
          --safe-area-bottom: env(safe-area-inset-bottom, 0px);
        }
        
        .font-genz { font-family: 'Comfortaa', cursive; }

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

      {/* Main App UI - Only visible when authenticated */}
      {activeUser && !showOnboarding && (
        <>
          <header className="sticky top-0 z-[100] bg-gradient-to-r from-[#F97316] to-[#EC4899] px-5 pb-3 flex items-center justify-between shadow-[0_10px_40px_rgba(249,115,22,0.3)] border-b border-white/10 relative overflow-hidden pt-[calc(0.6rem+var(--safe-area-top,20px))]">
        <div className="absolute -top-24 -left-20 w-48 h-48 bg-white/10 blur-3xl rounded-full" />
        <div className="flex items-center gap-3 relative z-10" onClick={() => { setDebugClicks(prev => prev + 1); if (debugClicks > 3) window.alert('FCM: ' + fcmToken + '\nDB: ' + dbStatus); }}>
          <div className="flex flex-col">
            <span className="text-[20px] font-[1000] text-white tracking-tighter leading-none">DoAble India</span>
            <span className="text-[8px] font-black text-white/90 tracking-wide mt-1 flex items-center gap-1.5">
              India's Leading Tuitions Network <div className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" /> {debugClicks > 3 && ' [DEBUG ON]'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10">
             <div className="flex items-center gap-1.5 bg-white/10 p-0.5 rounded-2xl border border-white/10">
                <button
                  onClick={() => { 
                    playTapSound(); 
                    if (!activeUser) { 
                      setAuthModalMode('signin'); 
                      setAuthModalStep('email'); 
                      setShowOnboarding(true); 
                    } else { 
                      setShowProfileSetup(true); 
                    } 
                  }}
                  className="p-1.5 text-white hover:text-white transition-all active:scale-90 flex items-center gap-2 relative"
                >
                  <div className="relative w-7 h-7 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90 absolute inset-0">
                      <circle cx="14" cy="14" r="12" fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
                      <motion.circle
                        cx="14" cy="14" r="12" fill="transparent" stroke="#FBBF24" strokeWidth="2.5"
                        strokeDasharray="75.4"
                        initial={{ strokeDashoffset: 75.4 }}
                        animate={{ strokeDashoffset: 75.4 - (75.4 * profileCompletion) / 100 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        strokeLinecap="round"
                      />
                    </svg>
                    <LucideUser size={14} strokeWidth={3} color="#FFFFFF" className="relative z-10" />
                  </div>
                  {profileCompletion < 100 && (
                    <span className="text-[9px] font-black text-white bg-amber-500/80 px-1.5 py-0.5 rounded-full shadow-sm">
                      {profileCompletion}%
                    </span>
                  )}
                </button>
              </div>
        </div>
      </header>

      <main className="container mx-auto p-0 sm:p-[10px] max-w-[1200px] pb-32">
       {activeTab === 'home' && (
          <HomeView 
            userName={userName} 
            userType={userType} 
            userCity={userCity} 
            activeLeadsCount={localActiveJobs.length} 
            activeTutorsCount={localActiveTutors.length} 
            featuredJobs={localActiveJobs.slice(0, 3)} 
            featuredTutors={localActiveTutors.slice(0, 3)} 
            allTutors={localActiveTutors}
            allJobs={localActiveJobs}
            playTapSound={playTapSound}
            setFormType={setFormType}
            setShowFormModal={setShowFormModal}
            onSignUpClick={() => { 
              setAuthModalMode('signup'); 
              setAuthModalStep('email'); 
              setShowOnboarding(true); 
            }}
            setActiveTab={setActiveTab}
            setShowFilterDrawer={setShowFilterDrawer} 
            getDynamicGreeting={getDynamicGreeting} 
            onJobClick={setSelectedJob} 
            onTutorClick={setSelectedTutor} 
            shortlistedIds={shortlistedIds} 
            onShortlistToggle={toggleShortlist}
            profileCompletion={profileCompletion}
            setShowProfileSetup={setShowProfileSetup}
            localities={CITY_TO_LOCATIONS_DATA[userCity] || []}
            onClassClick={(cls) => {
              playTapSound();
              if (userType === 'teacher') {
                setJobFilterClasses([cls]);
                setJobFilterLocalities([]);
                setJobFilterGender('All');
                setJobSearchQuery('');
                setActiveTab('jobs');
                setVisibleJobsCount(10);
              } else {
                setTutorFilterClasses([cls]);
                setTutorFilterLocalities([]);
                setTutorFilterGender('All');
                setTutorSearchQuery('');
                setActiveTab('tutors');
                setVisibleTutorsCount(10);
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onLocalityClick={(loc) => {
              playTapSound();
              if (userType === 'teacher') {
                setJobFilterLocalities([loc]);
                setJobFilterClasses([]);
                setJobFilterGender('All');
                setJobSearchQuery('');
                setActiveTab('jobs');
                setVisibleJobsCount(10);
              } else {
                setTutorFilterLocalities([loc]);
                setTutorFilterClasses([]);
                setTutorFilterGender('All');
                setTutorSearchQuery('');
                setActiveTab('tutors');
                setVisibleTutorsCount(10);
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onGenderClick={(gender) => {
              playTapSound();
              if (userType === 'teacher') {
                setJobFilterGender(gender);
                setJobFilterClasses([]);
                setJobFilterLocalities([]);
                setJobFilterMode('All');
                setJobSearchQuery('');
                setActiveTab('jobs');
                setVisibleJobsCount(10);
              } else {
                setTutorFilterGender(gender);
                setTutorFilterClasses([]);
                setTutorFilterLocalities([]);
                setTutorSearchQuery('');
                setActiveTab('tutors');
                setVisibleTutorsCount(10);
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onModeClick={(mode) => {
              playTapSound();
              if (userType === 'teacher') {
                setJobFilterMode(mode);
                setJobFilterGender('All');
                setJobFilterClasses([]);
                setJobFilterLocalities([]);
                setJobSearchQuery('');
                setActiveTab('jobs');
                setVisibleJobsCount(10);
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onCityClick={(city) => {
              playTapSound();
              const c = city.toLowerCase();
              setJobCityFilter(c);
              setTutorCityFilter(c);
              setUserCity(city);
              localStorage.setItem('userCity', city);
              setTutorFilterClasses([]);
              setTutorFilterLocalities([]);
              setTutorFilterGender('All');
              setTutorSearchQuery('');
              setActiveTab('tutors');
              setVisibleTutorsCount(10);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
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
            userFirstName={userFirstName}
            userGender={userGender}
          />
        )}
       {activeTab === 'earnings' && (
          <EarningsView 
            tutorProfile={tutors.find(t => {
              const tEmail = (t.email || '').toLowerCase().trim();
              const aEmail = (activeUser?.email || '').toLowerCase().trim();
              return tEmail === aEmail || (aEmail.includes(tEmail) && tEmail.length > 5);
            })}
            allTutors={tutors}
            userCity={userCity}
            profilePhoto={profilePhoto}
            playTapSound={playTapSound}
            onEditProfile={() => setShowProfileSetup(true)}
            onRequestApproval={() => {
              playTapSound();
              openWhatsApp(`Hi RMN Support, my profile is 100% complete (Tutor ID: #${tutorId}). Please verify and make it live for parents.`);
            }}
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
       {activeTab === 'support' && (<SupportView userName={userName} userFirstName={userFirstName} userType={userType} userCity={userCity} />)}
       {activeTab === 'post_need' && (
          <ParentHubView 
            userName={userName} 
            playTapSound={playTapSound} 
            setActiveTab={setActiveTab} 
            onHideNeed={handleHideNeed}
            onPostRequirement={() => {
              if (profileCompletion < 1) {
                setActiveToast({ title: 'Profile Incomplete', body: 'Please complete your profile to post a requirement.' });
                setShowProfileSetup(true);
              } else {
                setShowConfirmPost(true);
              }
            }}
          />
       )}
      </main>

      {/* Post Requirement Confirmation Modal */}
      <ConfirmPostJobModal
        show={showConfirmPost}
        onClose={() => setShowConfirmPost(false)}
        onEdit={() => { playTapSound(); setShowConfirmPost(false); setShowProfileSetup(true); }}
        onConfirm={handleConfirmPost}
        isUpdating={isUpdatingProfile}
        tutorId={tutorId}
        userClasses={userClasses}
        userBoard={userBoard}
        userSubjects={userSubjects}
        userGender={userGender}
        userCity={userCity}
        userResidency={userResidency}
        userLocalities={userLocalities}
        userMode={userMode}
        userDuration={userDuration}
        userDays={userDays}
        userTime={userTime}
        userFee={userFee}
      />

      <ProfileSetupWizard 
        show={showProfileSetup} 
        onClose={() => setShowProfileSetup(false)} 
        profile={{ ...profile, email: activeUser?.email || '' }}
        updateField={updateField}
        onUpdate={handleUpdateProfile}
        onDelete={handleDeleteProfile}
        onLogout={handleLogout}
        isUpdating={isUpdatingProfile}
        isDeleting={isDeletingProfile}
        playTapSound={playTapSound}
        tutors={tutors}
      />

      <JobDetailModal 
        job={selectedJob} 
        onClose={() => setSelectedJob(null)} 
        onApply={handleApplyJob} 
      />

      <TutorDetailModal 
        tutor={selectedTutor} 
        onClose={() => setSelectedTutor(null)} 
        playTapSound={playTapSound} 
      />

      <SelectionDrawer
        config={showSelectionDrawer}
        onClose={() => setShowSelectionDrawer(null)}
        onSelect={handleSelection}
      />

      <FormModal 
        show={showFormModal} 
        onClose={() => setShowFormModal(false)} 
        formType={formType as any} 
      />

      {/* ─── BOTTOM NAVIGATION ─── */}
      <nav className="fixed bottom-0 left-0 right-0 z-[10000] px-4 pb-[calc(1rem+var(--safe-area-bottom,20px))] pt-3 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex items-center justify-between gap-1 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <NavButton active={activeTab === 'home'} onClick={() => { playTapSound(); setActiveTab('home'); window.scrollTo(0,0); }} icon={<HomeIcon className="w-[18px] h-[18px]" />} label="Home" activeColor="text-white" activeBg="bg-primary" inactiveColor="text-slate-400" inactiveBg="bg-slate-50" />
        
        {userType === 'teacher' && (
          <>
            <NavButton active={activeTab === 'jobs'} onClick={() => { playTapSound(); setActiveTab('jobs'); window.scrollTo(0,0); }} icon={<Briefcase className="w-[18px] h-[18px]" />} label="Jobs" activeColor="text-white" activeBg="bg-indigo-600" inactiveColor="text-indigo-400" inactiveBg="bg-indigo-50" />
            <NavButton active={activeTab === 'earnings'} onClick={() => { playTapSound(); setActiveTab('earnings'); window.scrollTo(0,0); }} icon={<TrendingUp className="w-[18px] h-[18px]" />} label="Earnings" activeColor="text-white" activeBg="bg-emerald-600" inactiveColor="text-emerald-500" inactiveBg="bg-emerald-50" />
          </>
        )}

        {userType === 'parent' && (
          <>
            <NavButton active={activeTab === 'tutors'} onClick={() => { playTapSound(); setActiveTab('tutors'); window.scrollTo(0,0); }} icon={<GraduationCap className="w-[18px] h-[18px]" />} label="Tutors" activeColor="text-white" activeBg="bg-amber-500" inactiveColor="text-amber-500" inactiveBg="bg-amber-50" />
            <NavButton active={activeTab === 'post_need'} onClick={() => { playTapSound(); setActiveTab('post_need'); window.scrollTo(0,0); }} icon={<Sparkles className="w-[18px] h-[18px]" />} label="Post Need" activeColor="text-white" activeBg="bg-[#572149]" inactiveColor="text-[#572149]" inactiveBg="bg-[#572149]/5" />
          </>
        )}

        <NavButton 
          active={activeTab === 'alerts'} 
          onClick={() => { playTapSound(); setActiveTab('alerts'); setAlertsInitialTab('feed'); setUnseenAlertsCount(0); window.scrollTo(0,0); }} 
          icon={<Bell className="w-[18px] h-[18px]" />} 
          label="Alerts" 
          badge={unseenAlertsCount}
          activeColor="text-white" 
          activeBg="bg-rose-500" 
          inactiveColor="text-rose-400" 
          inactiveBg="bg-rose-50" 
        />

        <NavButton active={activeTab === 'support'} onClick={() => { playTapSound(); setActiveTab('support'); window.scrollTo(0,0); }} icon={<MessageSquare className="w-[18px] h-[18px]" />} label="Support" activeColor="text-white" activeBg="bg-[#347475]" inactiveColor="text-[#347475]" inactiveBg="bg-[#347475]/5" />
      </nav>
        </>
      )}
      
      <SuccessPop show={showSuccess} onComplete={() => setShowSuccess(false)} />
      <FloatingToast toast={activeToast} onClear={() => setActiveToast(null)} />
    </div>
  );
}






