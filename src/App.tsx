import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, MapPin, Loader2, Home as HomeIcon, FileText, User as LucideUser, Sparkles, BookOpen, GraduationCap, CheckCircle, LogOut, Settings, Edit3, Save, Bell, ChevronRight, Share2, Filter, X, MessageSquare, ExternalLink, Zap, ArrowRight, Navigation, Check, Sun, Cloud, Moon, Briefcase, BookText, ChevronDown, CreditCard, Heart, Volume2, Play, Info, Clock, MessageCircle, Calendar, Globe, ShieldCheck, TrendingUp, Hash, AlertCircle, Mail, Lock, Camera, Phone, Plus, Trash2, BadgeCheck, LogIn, UserPlus, ChevronLeft, Eye, EyeOff } from 'lucide-react';
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
import { cn, getCityTheme, formatCurrency, getCityPhone, toTitleCase, getJobId, getTutorId, openWhatsApp, cleanValue, saveToLargeStorage, getFromLargeStorage, calculateProfileCompletion } from './utils';
import {
  CITIES_LIST,
  CLASSES_LIST,
  CLASS_SUBJECTS_DATA,
  CLASS_GROUP_MAPPING,
  CITY_TO_LOCATIONS_DATA,
  TUTOR_QUALIFICATIONS_LIST,
  TUTOR_EXPERIENCE_LIST,
  TUTOR_FEE_LIST
} from './constants';

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
        setTimeout(() => setActiveToast(null), 4000);
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
      
      const parentData = {
        action: 'upsert',
        email: activeUser.email,
        Email: activeUser.email,
        name: userName || '',
        Name: userName || '',
        phone: userPhone || '',
        Phone: userPhone || '',
        userType: 'parent',
        status: 'Searching',
        Status: 'Searching',
        classes: userClasses.join(', '),
        class: userClasses.join(', '),
        Class: userClasses.join(', '),
        class_group: userClasses.join(', '),
        'Class / Board': `${userClasses.join(', ')} (${userBoard})`,
        subjects: userSubjects.join(', '),
        Subjects: userSubjects.join(', '),
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
        setTimeout(() => setActiveToast(null), 5000);
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
    setShowOnboarding(true);
    setAuthStep('landing');
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
        let currentTutorId = localStorage.getItem('tutorId') || '';
        
        // Fix: If tutorId contains email or legacy bad data, clear it
        if (currentTutorId.includes('@') || currentTutorId === 'NEW_USER' || currentTutorId === 'NEW') {
          currentTutorId = '';
        }

        // Auto-assign new ID if missing (23000+ range)
        if (!currentTutorId) {
          // Generate a unique 5-digit ID based on timestamp to avoid collisions
          const uniqueId = Math.floor(10000 + Math.random() * 90000);
          currentTutorId = uniqueId.toString();
          localStorage.setItem('tutorId', currentTutorId);
          setTutorId(currentTutorId);
        }

        const profileData: any = {
          action: 'upsert',
          tutor_id: currentTutorId,
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
          residency: userResidency,
          Residency: userResidency,
          block: userResidency,
          society: userResidency,
          have_vehicle: hasVehicle === 'Yes' ? 'Yes' : 'No',
          communication: userCommunication,
          fee: userFee,
          aadhar: userAadhar,
          Aadhar: userAadhar,
          address: userAddress,
          Address: userAddress,
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
        
        let currentParentId = localStorage.getItem('tutorId') || ''; // Reusing tutorId key for parent unique ID
        if (currentParentId.includes('@') || currentParentId === 'NEW_USER' || currentParentId === 'NEW') {
          currentParentId = '';
        }

        if (!currentParentId) {
          // Generate a unique 5-digit ID based on timestamp to avoid collisions
          const uniqueId = Math.floor(10000 + Math.random() * 90000);
          currentParentId = uniqueId.toString();
          localStorage.setItem('tutorId', currentParentId);
          setTutorId(currentParentId);
        }

        // Map frontend state to lowercase database column names
        const parentData: any = {
          action: 'upsert',
          order_id: currentParentId, // Use the generated ID
          Order_ID: currentParentId,
          'Order ID': currentParentId,
          email: activeUser.email,
          Email: activeUser.email,
          phone: userPhone,
          Phone: userPhone,
          name: userName,
          Name: userName,
          class_group: userClasses.join(', '), 
          Class: userClasses.join(', '),
          'Class / Board': `${userClasses.join(', ')} (${userBoard})`,
          subjects: userSubjects.join(', '),
          Subjects: userSubjects.join(', '),
          'Subject(s)': userSubjects.join(', '),
          city: userCity,
          City: userCity,
          locality: userLocalities.join(', '),
          Locality: userLocalities.join(', '),
          location: userLocalities.map(loc => `${loc}-${userCity}`).join(', '), // Mapped to location with city suffix (no spaces)
          Location: userLocalities.map(loc => `${loc}-${userCity}`).join(', '),
          residency: userResidency, // Mapped to residency
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
          time: userTime, // Mapped to time
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
  const [userResidency, setUserResidency] = useState<string>(localStorage.getItem('userResidency') || '');
  const [userAadhar, setUserAadhar] = useState<string>(localStorage.getItem('userAadhar') || '');
  const [currentStep, setCurrentStep] = useState<number>(1);

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
  const [jobFilterMode, setJobFilterMode] = useState<string>('All'); // NEW: Mode Filter

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
  const [activeTab, setActiveTab] = useState<'home' | 'jobs' | 'tutors' | 'alerts' | 'support' | 'admin' | 'earnings' | 'post_need'>('home');
  const [alertsInitialTab, setAlertsInitialTab] = useState<'feed' | 'support' | 'setup'>('feed');
  const [unseenAlertsCount, setUnseenAlertsCount] = useState(0);
  const [activeToast, setActiveToast] = useState<{ title: string, body: string } | null>(null);
  const [shortlistedIds, setShortlistedIds] = useState<string[]>(JSON.parse(localStorage.getItem('shortlistedIds') || '[]'));
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  
  const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem('userType'));

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
        qualification: userQualifications,
        experience: userExperience,
        about: aboutMe,
        classes: userClasses,
        subjects: userSubjects,
        photo: profilePhoto,
        address: userAddress,
        mode: userMode,
        board: userBoard
      };
      const completion = calculateProfileCompletion(userData, userType);
      
      // If profile is very incomplete (e.g. < 40%), show setup popup automatically
      if (completion < 40) {
        setShowProfileSetup(true);
      }
    }
  }, [activeUser, showOnboarding, userType]);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot' | 'reset'>('signin');
  const [authStep, setAuthStep] = useState<'landing' | 'selection' | 'auth'>('auth');
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
        setShowProfileSetup(true); // Open profile setup for new users
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
    setJobCityFilter(userCity.toLowerCase());
    setTutorCityFilter(userCity.toLowerCase());
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
      days: t.days || t['Available Days'] || t['Available Day(s)'] || t['Available days'] || t['vaialable days'] || t['available days'] || '',
      time: t.time || t.Time || t['Preferred Time'] || t['preferred time'] || '',
      class_group: safeParse(t.class_group || t['Preferred Class Group'] || t.Class),
      subjects: safeParse(t.subjects || t['Preferred Subject(s)'] || t['Subject(s)']),
      city: t.city || t.City || t['Preferred City'] || t['preferred city'] || '',
      location: safeParse(t.location || t['Preferred Location(s)'] || t.Location || t['Teaching Localtie'] || t['Teaching Locality(ies)'] || t['Teaching Locality'] || t.Address),
      have_vehicle: t.have_vehicle || t['Have own Vehicle'] || 'No',
      communication: t.communication || t.Communication || t['Mode of Teaching'] || t['Mode of teaching'] || '',
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
            url: LEADS_URL + (activeUser?.email ? `?email=${encodeURIComponent(activeUser.email)}` : ''),
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
          fetch(LEADS_URL + (activeUser?.email ? `?email=${encodeURIComponent(activeUser.email)}` : '')),
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
        
        console.log('🌐 WEB RAW LEADS DATA:', leadsJson);

        if (leadsJson.status === 'success') {
          setLeads(leadsJson.data);
          localStorage.setItem('cachedLeads', JSON.stringify(leadsJson.data));
        } else if (Array.isArray(leadsJson)) {
          setLeads(leadsJson);
          localStorage.setItem('cachedLeads', JSON.stringify(leadsJson));
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
      console.log('🔄 Re-loading data with user email:', activeUser.email);
      loadData();
    }
  }, [activeUser?.email]);

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
    return tutors.filter(t => {
      const status = (t.status || '').toString().toLowerCase();
      return status !== 'hidden' && status !== 'blocked';
    });
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
        if (!jobFilterLocalities.some(loc => jobLocs.includes(loc.toLowerCase()))) return false;
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

      // Gender Filter (Handles 'Any', 'Both', 'Male/Female')
      if (jobFilterGender !== 'All') {
        const jobGender = (l.Gender || (l as any).gender || '').toLowerCase().trim();
        const fGender = jobFilterGender.toLowerCase().trim();
        
        const isAny = jobGender.includes('any') || jobGender.includes('both') || jobGender.includes('/');
        const isExactMatch = jobGender === fGender;
        
        if (!isAny && !isExactMatch) return false;
      }

      // Mode Filter
      if (jobFilterMode !== 'All') {
        const jobMode = (l.Mode || (l as any).mode || (l as any)['Mode of Teaching'] || '').toLowerCase().trim();
        const fMode = jobFilterMode.toLowerCase().trim();
        if (!jobMode.includes(fMode) && !jobMode.includes('any') && !jobMode.includes('both')) return false;
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
        const tutorLocs = JSON.stringify(t.location || []).toLowerCase();
        if (!tutorFilterLocalities.some(loc => tutorLocs.includes(loc.toLowerCase()))) return false;
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
        
        const isAny = tGender.includes('any') || tGender.includes('both') || tGender.includes('/');
        const isExactMatch = tGender === fGender;
        
        if (!isAny && !isExactMatch) return false;
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
      <AnimatePresence>
        {showOnboarding && (
          <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" />
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="relative w-full max-sm:max-w-sm max-w-sm">
              {authStep === 'landing' ? (
                <div className="space-y-6 text-center">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Welcome to DoAble</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Start your journey with us</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <button 
                      onClick={() => { playTapSound(); setAuthMode('signin'); setAuthStep('auth'); }}
                      className="group bg-white p-6 rounded-[32px] flex items-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                        <LogIn size={24} strokeWidth={3} />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Sign In</h4>
                        <p className="text-[10px] font-bold text-slate-400">Already have an account?</p>
                      </div>
                    </button>
                    <button 
                      onClick={() => { playTapSound(); setAuthMode('signup'); setAuthStep('selection'); }}
                      className="group bg-white p-6 rounded-[32px] flex items-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                        <UserPlus size={24} strokeWidth={3} />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Sign Up</h4>
                        <p className="text-[10px] font-bold text-slate-400">Create a new account</p>
                      </div>
                    </button>
                  </div>
                </div>
              ) : authStep === 'selection' ? (
                <div className="space-y-6 text-center">
                  <div className="flex justify-between items-center px-2">
                    <button onClick={() => { playTapSound(); setAuthStep('landing'); }} className="text-slate-400 hover:text-white/50"><ChevronLeft size={20} /></button>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Step 1 of 2</p>
                    <div className="w-5" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Choose Your Path</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">How would you like to proceed?</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <button 
                      onClick={() => { playTapSound(); setUserType('parent'); localStorage.setItem('userType', 'parent'); setAuthStep('auth'); }}
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
                      onClick={() => { playTapSound(); setUserType('teacher'); localStorage.setItem('userType', 'teacher'); setAuthStep('auth'); }}
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
                    <button onClick={() => { playTapSound(); setAuthStep(authMode === 'signin' ? 'landing' : 'selection'); }} className="text-slate-300 hover:text-slate-500"><ChevronLeft size={20} /></button>
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
                              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                {showPassword ? <Eye size={18} strokeWidth={2.5} /> : <EyeOff size={18} strokeWidth={2.5} />}
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
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                              {showPassword ? <Eye size={18} strokeWidth={2.5} /> : <EyeOff size={18} strokeWidth={2.5} />}
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
                          <button onClick={() => { setAuthMode('signup'); setAuthError(null); setAuthStep('selection'); }} className="text-[10px] font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-widest text-center">New to DoAble? <span className="text-primary underline">Sign Up</span></button>
                        </>
                      )}
                      {(authMode === 'signup' || authMode === 'forgot' || authMode === 'reset') && (
                        <button onClick={() => { setAuthMode('signin'); setAuthError(null); setAuthStep('auth'); }} className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-widest text-center">Back to <span className="text-primary underline">Sign In</span></button>
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

      <header className="sticky top-0 z-[100] bg-gradient-to-r from-[#F97316] to-[#EC4899] px-5 pb-3 flex items-center justify-between shadow-[0_10px_40px_rgba(249,115,22,0.3)] border-b border-white/10 relative overflow-hidden pt-[calc(0.6rem+var(--safe-area-top,20px))]">
        <div className="absolute -top-24 -left-20 w-48 h-48 bg-white/10 blur-3xl rounded-full" />
        <div className="flex flex-col relative z-10" onClick={() => { setDebugClicks(prev => prev + 1); if (debugClicks > 3) window.alert('FCM: ' + fcmToken + '\nDB: ' + dbStatus); }}>
          <span className="text-[20px] font-[1000] text-white tracking-tighter leading-none">DoAble India <span className="text-[8px] align-top bg-white/20 px-1 rounded">v341.1</span></span>
          <span className="text-[7.5px] font-black text-white/80 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
            Premium Home Tuition Network <div className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" /> {debugClicks > 3 && ' [DEBUG ON]'}
          </span>
        </div>
        <div className="flex items-center gap-3 relative z-10">
             <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-xl p-0.5 rounded-2xl border border-white/10">
                <button
                  onClick={() => { playTapSound(); if (!activeUser) { setAuthMode('signin'); setAuthStep('auth'); setShowOnboarding(true); } else { setShowProfileSetup(true); } }}
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
            allJobs={localActiveJobs}
            allTutors={localActiveTutors}
            playTapSound={playTapSound}
            setFormType={setFormType}
            setShowFormModal={setShowFormModal}
            onSignUpClick={() => { setAuthMode('signup'); setAuthStep('selection'); setShowOnboarding(true); }}
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
      <AnimatePresence>
        {showConfirmPost && (
          <div className="fixed inset-0 z-[25000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirmPost(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Fixed Header */}
              <div className="p-6 pb-4 border-b border-slate-50 flex justify-between items-start shrink-0">
                <div className="space-y-1">
                  <h3 className="text-xl font-[1000] text-slate-900 tracking-tight leading-none pt-1">Confirm & Post Job</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Review your summary</p>
                </div>
                <button onClick={() => setShowConfirmPost(false)} className="p-2 bg-slate-50 rounded-full text-slate-400 active:scale-90 transition-all"><X size={18} /></button>
              </div>

              {/* Scrollable Summary Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {/* 1. Basic Info Section */}
                <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50 space-y-3">
                  <div className="flex items-center gap-2 border-b border-indigo-100 pb-2 mb-1">
                    <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center text-white"><Hash size={12} /></div>
                    <span className="text-[10px] font-black uppercase text-indigo-900 tracking-widest">Basic Details</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Order ID</p>
                      <p className="text-[12px] font-black text-primary">#{tutorId || 'Pending'}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Class & Board</p>
                      <p className="text-[12px] font-black text-slate-800">{userClasses.join(', ')} ({userBoard})</p>
                    </div>
                  </div>
                </div>

                {/* 2. Requirement Section */}
                <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100/50 space-y-3">
                  <div className="flex items-center gap-2 border-b border-amber-100 pb-2 mb-1">
                    <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center text-white"><BookText size={12} /></div>
                    <span className="text-[10px] font-black uppercase text-amber-900 tracking-widest">What You Need</span>
                  </div>
                  <div className="space-y-2">
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Subjects Needed</p>
                      <p className="text-[11px] font-black text-slate-800 leading-tight">{userSubjects.join(', ') || 'All Subjects'}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tutor Gender Preference</p>
                      <p className="text-[11px] font-black text-slate-800">{userGender}</p>
                    </div>
                  </div>
                </div>

                {/* 3. Location Section */}
                <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50 space-y-3">
                  <div className="flex items-center gap-2 border-b border-emerald-100 pb-2 mb-1">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white"><MapPin size={12} /></div>
                    <span className="text-[10px] font-black uppercase text-emerald-900 tracking-widest">Where You Need</span>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">City</p>
                        <p className="text-[11px] font-black text-slate-800">{userCity}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Society / Block</p>
                        <p className="text-[11px] font-black text-slate-800 leading-tight">{userResidency || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Locality</p>
                      <p className="text-[11px] font-black text-slate-800 leading-tight">{userLocalities.join(', ') || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* 4. Schedule & Fee Section */}
                <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100/50 space-y-3">
                  <div className="flex items-center gap-2 border-b border-rose-100 pb-2 mb-1">
                    <div className="w-6 h-6 rounded-lg bg-rose-500 flex items-center justify-center text-white"><Clock size={12} /></div>
                    <span className="text-[10px] font-black uppercase text-rose-900 tracking-widest">When & How Much</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Mode</p>
                      <p className="text-[11px] font-black text-indigo-600">{userMode}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Duration</p>
                      <p className="text-[11px] font-black text-slate-800">{userDuration || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Preferred Days</p>
                      <p className="text-[11px] font-black text-slate-800 leading-tight">{userDays || 'N/A'}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Preferred Time</p>
                      <p className="text-[11px] font-black text-slate-800 leading-tight">{userTime || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-rose-100 mt-2">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Final Budget / Fee</p>
                    <p className="text-[16px] font-black text-emerald-600">₹{userFee || 'TBD'}</p>
                  </div>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="p-6 border-t border-slate-100 bg-white shrink-0 space-y-4">
                <div className="bg-indigo-50 rounded-2xl p-3 border border-indigo-100 flex items-start gap-3">
                  <ShieldCheck className="text-indigo-500 shrink-0" size={16} />
                  <p className="text-[9px] font-bold text-indigo-700 leading-tight">
                    Tutors will see these details, but your <span className="underline">Phone and Email will remain hidden</span> for your privacy.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => { playTapSound(); setShowConfirmPost(false); setShowProfileSetup(true); }}
                    className="flex-1 h-14 rounded-2xl border-2 border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Edit3 size={14} /> Edit Need
                  </button>
                  <button 
                    onClick={handleConfirmPost}
                    disabled={isUpdatingProfile}
                    className="flex-[2] h-14 rounded-2xl bg-[#572149] text-white font-black text-[11px] uppercase tracking-[0.1em] shadow-xl shadow-[#572149]/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {isUpdatingProfile ? <Loader2 size={18} className="animate-spin" /> : <>Confirm & Post <Sparkles size={16} /></>}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

       {showProfileSetup && (
         <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4">
           <div onClick={() => setShowProfileSetup(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
           <div className="relative bg-white w-full max-w-[400px] rounded-[40px] shadow-2xl overflow-hidden flex flex-col h-[85vh] border border-white/20">
              {/* Progress Bar */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-50">
                 <motion.div
                   initial={{ width: 0 }}
                   animate={{ width: `${(currentStep / (userType === 'teacher' ? 8 : 5)) * 100}%` }}
                   className="h-full bg-primary"
                 />
              </div>

              <div className="p-6 border-b border-slate-50 flex items-center justify-between shrink-0 bg-white pt-8">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black">
                     {currentStep}
                   </div>
                   <div>
                     <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-900 leading-none">
                       Step {currentStep} of {userType === 'teacher' ? 8 : 5}
                     </h3>
                     <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">
                       {(() => {
                         if (userType === 'teacher') {
                           const titles = ['Identity', 'Personal', 'Bio & Comm', 'Academics', 'Professional', 'Logistics', 'Schedule', 'Settings'];
                           return titles[currentStep - 1] || 'Settings';
                         }
                         const titles = ['Personal Details', 'Academics', 'Location', 'Schedule', 'Settings'];
                         return titles[currentStep - 1] || 'Settings';
                       })()}
                     </p>
                   </div>
                 </div>
                 <div className="flex items-center gap-2">
                   {currentStep !== (userType === 'teacher' ? 8 : 5) && (
                     <button
                       onClick={() => { playTapSound(); setCurrentStep(userType === 'teacher' ? 8 : 5); }}
                       className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-primary transition-all"
                     >
                       <Settings size={16} />
                     </button>
                   )}
                   <button onClick={() => setShowProfileSetup(false)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-all"><X size={16} /></button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                 <AnimatePresence mode="wait">
                   <motion.div
                     key={currentStep}
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     className="space-y-6"
                   >
                     {/* ─── SHARED STEP 1: IDENTITY ─── */}
                     {currentStep === 1 && (
                       <div className="space-y-4">
                         <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                           {userType === 'teacher' ? "Let's start with your \nidentity." : "Let's get to know you! \nWhat's your name?"}
                         </h2>
                         <div className="space-y-1.5">
                           <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Full Name</label>
                           <div className="relative">
                             <LucideUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                             <input type="text" value={userName || ''} onChange={(e) => { setUserName(e.target.value); localStorage.setItem('userName', e.target.value); }} placeholder="e.g. Rahul Sharma" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all" />
                           </div>
                         </div>
                         <div className="space-y-1.5">
                           <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">WhatsApp Number</label>
                           <div className="relative">
                             <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                             <input type="tel" value={userPhone || ''} onChange={(e) => { setUserPhone(e.target.value); localStorage.setItem('userPhone', e.target.value); }} placeholder="e.g. 9971XXXXXX" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all" />
                           </div>
                         </div>
                         <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">{userType === 'parent' ? 'Tutor Gender Preference' : 'Gender'}</label>
                           <div className="flex flex-wrap gap-2">
                             {(userType === 'teacher' ? ['Male', 'Female', 'Transgender'] : ['Male', 'Female', 'All']).map(g => (
                               <button key={g} onClick={() => { playTapSound(); setUserGender(g); localStorage.setItem('userGender', g); }} className={cn("flex-1 px-4 py-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all", userGender === g ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-400 bg-white")}>{g}</button>
                             ))}
                           </div>
                         </div>
                       </div>
                     )}

                     {/* ─── TUTOR STEP 2: PERSONAL ─── */}
                     {currentStep === 2 && userType === 'teacher' && (
                       <div className="space-y-4">
                         <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Personal Details</h2>
                         <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                             <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Date of Birth</label>
                             <input type="date" value={userDob} onChange={(e) => { setUserDob(e.target.value); localStorage.setItem('userDob', e.target.value); }} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all" />
                           </div>
                           <div className="space-y-1.5">
                             <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Age</label>
                             <div className="w-full bg-slate-100 border border-slate-100 rounded-2xl py-4 px-4 text-sm font-bold text-slate-500">{userAge ? `${userAge} Years` : 'Select DOB'}</div>
                           </div>
                         </div>
                         <div className="space-y-1.5">
                           <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Aadhar Number</label>
                           <div className="relative">
                             <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                             <input type="text" maxLength={12} value={userAadhar} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); setUserAadhar(val); localStorage.setItem('userAadhar', val); }} placeholder="12-digit Aadhar Number" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all" />
                           </div>
                         </div>
                         <div className="space-y-1.5">
                           <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Full Address</label>
                           <div className="relative">
                             <MapPin className="absolute left-4 top-4 text-slate-300" size={16} />
                             <textarea value={userAddress} onChange={(e) => { setUserAddress(e.target.value); localStorage.setItem('userAddress', e.target.value); }} placeholder="House No, Street, Landmark..." rows={3} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all resize-none" />
                           </div>
                         </div>
                       </div>
                     )}

                     {/* ─── TUTOR STEP 3: BIO & COMM ─── */}
                     {currentStep === 3 && userType === 'teacher' && (
                       <div className="space-y-4">
                         <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Bio & Communication</h2>
                         <div className="space-y-1.5">
                           <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">About Me (Catchy Bio)</label>
                           <div className="relative">
                             <Edit3 className="absolute left-4 top-4 text-slate-300" size={16} />
                             <textarea value={aboutMe} onChange={(e) => { setAboutMe(e.target.value); localStorage.setItem('aboutMe', e.target.value); }} placeholder="Write a short, catchy bio. Mention teaching style & why parents should hire you." rows={4} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-[12px] font-bold text-slate-700 outline-none focus:border-primary transition-all resize-none" />
                             <div className="flex items-center gap-1.5 mt-2 ml-1 text-primary">
                               <Sparkles size={12} />
                               <span className="text-[9px] font-black uppercase tracking-tight">Pro-Tip: Use AI like ChatGPT or Gemini.</span>
                             </div>
                           </div>
                         </div>
                         <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Communication Proficiency</label>
                           <div className="space-y-2">
                             {[
                               { label: 'Beginner', desc: 'Hindi/Regional preferred', value: 'Beginner: Understands English prefers teaching in Hindi/Regional Language' },
                               { label: 'Intermediate', desc: 'Speaks/Explains in English', value: 'Intermediate: Speaks comfortably explains concepts in English.' },
                               { label: 'Fluent', desc: 'Strictly English sessions', value: 'Fluent: Teaches the entire session strictly in English.' }
                             ].map(item => (
                               <button key={item.label} onClick={() => { playTapSound(); setUserCommunication(item.value); localStorage.setItem('userCommunication', item.value); }} className={cn("w-full p-4 rounded-2xl border-2 text-left transition-all", userCommunication === item.value ? "border-primary bg-primary/5 shadow-md" : "border-slate-100 bg-white")}>
                                 <span className={cn("text-[11px] font-black uppercase tracking-wider block", userCommunication === item.value ? "text-primary" : "text-slate-700")}>{item.label}</span>
                                 <p className="text-[9px] font-bold text-slate-400 leading-tight">{item.desc}</p>
                               </button>
                             ))}
                           </div>
                         </div>
                       </div>
                     )}

                     {/* ─── PARENT STEP 2 or TUTOR STEP 4: ACADEMICS ─── */}
                     {((currentStep === 2 && userType === 'parent') || (currentStep === 4 && userType === 'teacher')) && (
                       <div className="space-y-4">
                         <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                           {userType === 'teacher' ? 'Teaching Classes' : 'Academic Details'}
                         </h2>
                         <div className="space-y-4">
                           <div className="space-y-1.5">
                             <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Class Group</label>
                             <div className="grid grid-cols-2 gap-2">
                               {CLASSES_LIST.map(c => {
                                 const isGroupActive = userClasses.includes(c);
                                 return (
                                   <button key={c} onClick={() => { playTapSound(); setUserClasses([c]); localStorage.setItem('userClasses', JSON.stringify([c])); setUserSubjects([]); }} className={cn("p-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-tighter text-center transition-all", isGroupActive ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-400 bg-white")}>{c}</button>
                                 );
                               })}
                             </div>
                           </div>
                           {userType === 'parent' && userClasses.length > 0 && (
                             <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                               <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Specific Class</label>
                               <div className="flex flex-wrap gap-2">
                                 {(CLASS_GROUP_MAPPING[CLASSES_LIST.find(g => userClasses.includes(g)) || ''] || []).map(sub => (
                                   <button key={sub} onClick={() => { playTapSound(); setUserClasses([sub]); localStorage.setItem('userClasses', JSON.stringify([sub])); }} className={cn("px-4 py-2 rounded-xl border-2 font-black text-[10px] uppercase tracking-tighter transition-all", userClasses.includes(sub) ? "border-primary bg-primary text-white" : "border-slate-100 text-slate-400 bg-white")}>{sub}</button>
                                 ))}
                               </div>
                             </div>
                           )}
                           <div className="space-y-1.5">
                             <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Board</label>
                             <div className="grid grid-cols-2 gap-2">
                               {['CBSE', 'ICSE', 'State Board', 'IB/IGCSE'].map(b => (
                                 <button key={b} onClick={() => { playTapSound(); setUserBoard(b); localStorage.setItem('userBoard', b); }} className={cn("p-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-tighter text-center transition-all", userBoard === b ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-400 bg-white")}>{b}</button>
                               ))}
                             </div>
                           </div>
                           <div className="space-y-1.5">
                             <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Subjects {userType === 'teacher' ? 'Teaching' : 'Needed'}</label>
                             <div className="flex flex-wrap gap-2">
                               {(() => {
                                 const groupName = userClasses[0];
                                 return (groupName ? CLASS_SUBJECTS_DATA[groupName] || [] : []);
                               })().map(s => (
                                 <button key={s} onClick={() => { playTapSound(); const next = userSubjects.includes(s) ? userSubjects.filter(v => v !== s) : [...userSubjects, s]; setUserSubjects(next); localStorage.setItem('userSubjects', JSON.stringify(next)); }} className={cn("px-4 py-2 rounded-full border-2 font-black text-[9px] uppercase tracking-widest transition-all", userSubjects.includes(s) ? "border-primary bg-primary text-white shadow-lg shadow-primary/20" : "border-slate-100 text-slate-400 bg-white")}>{s}</button>
                               ))}
                             </div>
                           </div>
                         </div>
                       </div>
                     )}

                     {/* ─── TUTOR STEP 5: PROFESSIONAL ─── */}
                     {currentStep === 5 && userType === 'teacher' && (
                       <div className="space-y-4">
                         <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Professional Details</h2>
                         <div className="space-y-1.5">
                           <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Qualifications (Select Multiple)</label>
                           <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-100 custom-scrollbar">
                             {TUTOR_QUALIFICATIONS_LIST.map(q => (
                               <button key={q} onClick={() => { playTapSound(); const next = userQualifications.includes(q) ? userQualifications.filter(v => v !== q) : [...userQualifications, q]; setUserQualifications(next); localStorage.setItem('userQualifications', JSON.stringify(next)); }} className={cn("px-3 py-2 rounded-xl border-2 font-bold text-[9px] uppercase transition-all", userQualifications.includes(q) ? "border-primary bg-primary text-white" : "border-slate-100 text-slate-400 bg-white")}>{q}</button>
                             ))}
                           </div>
                         </div>
                         <div className="space-y-1.5">
                           <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Teaching Experience</label>
                           <div className="grid grid-cols-1 gap-2">
                             {TUTOR_EXPERIENCE_LIST.map(exp => (
                               <button key={exp} onClick={() => { playTapSound(); setUserExperience(exp); localStorage.setItem('userExperience', exp); }} className={cn("w-full py-3 px-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest text-left transition-all", userExperience === exp ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-400 bg-white")}>{exp}</button>
                             ))}
                           </div>
                         </div>
                       </div>
                     )}

                     {/* ─── PARENT STEP 3 or TUTOR STEP 6: LOCATION ─── */}
                     {((currentStep === 3 && userType === 'parent') || (currentStep === 6 && userType === 'teacher')) && (
                       <div className="space-y-4">
                         <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                           {userType === 'teacher' ? 'Where you teach' : 'Where you learn'}
                         </h2>
                         <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Mode of {userType === 'teacher' ? 'Teaching' : 'Learning'}</label>
                           <div className="flex gap-2">
                             {['Home Tuition', 'Online Class'].map(m => (
                               <button key={m} onClick={() => { playTapSound(); setUserMode(m); localStorage.setItem('userMode', m); }} className={cn("flex-1 py-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all flex flex-col items-center gap-1", userMode === m ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-400 bg-white")}><span>{m === 'Home Tuition' ? '🏠' : '💻'}</span><span>{m}</span></button>
                             ))}
                           </div>
                         </div>
                         {userMode !== 'Online Class' && (
                           <div className="space-y-4">
                             <div className="space-y-1.5">
                               <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">City</label>
                               <select value={userCity} onChange={(e) => { setUserCity(e.target.value); localStorage.setItem('userCity', e.target.value); setUserLocalities([]); }} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all appearance-none">{CITIES_LIST.map(c => <option key={c} value={c}>{c}</option>)}</select>
                             </div>
                             <div className="space-y-1.5">
                               <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Locality {userType === 'teacher' && '(Select Multiple)'}</label>
                               {userType === 'teacher' ? (
                                 <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-100 custom-scrollbar">{(CITY_TO_LOCATIONS_DATA[userCity] || []).map(l => (
                                   <button key={l} onClick={() => { playTapSound(); const next = userLocalities.includes(l) ? userLocalities.filter(v => v !== l) : [...userLocalities, l]; setUserLocalities(next); localStorage.setItem('userLocalities', JSON.stringify(next)); }} className={cn("px-3 py-2 rounded-xl border-2 font-bold text-[10px] uppercase transition-all", userLocalities.includes(l) ? "border-primary bg-primary text-white" : "border-slate-100 text-slate-400 bg-white")}>{l}</button>
                                 ))}</div>
                               ) : (
                                 <select value={userLocalities[0] || ''} onChange={(e) => { setUserLocalities([e.target.value]); localStorage.setItem('userLocalities', JSON.stringify([e.target.value])); }} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all appearance-none"><option value="">Select Locality</option>{(CITY_TO_LOCATIONS_DATA[userCity] || []).map(l => <option key={l} value={l}>{l}</option>)}</select>
                               )}
                             </div>
                             {userType === 'parent' && (
                               <div className="space-y-1.5">
                                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Society / Block</label>
                                 <div className="relative"><MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} /><input type="text" value={userResidency || ''} onChange={(e) => { setUserResidency(e.target.value); localStorage.setItem('userResidency', e.target.value); }} placeholder="e.g. DLF Phase 3" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all" /></div>
                               </div>
                             )}
                             {userType === 'teacher' && (
                               <div className="space-y-3">
                                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Own Vehicle?</label>
                                 <div className="flex gap-2">
                                   {['Yes', 'No'].map(v => (
                                     <button key={v} onClick={() => { playTapSound(); setHasVehicle(v); localStorage.setItem('hasVehicle', v); }} className={cn("flex-1 py-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all", hasVehicle === v ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-400 bg-white")}>{v}</button>
                                   ))}
                                 </div>
                               </div>
                             )}
                           </div>
                         )}
                       </div>
                     )}

                     {/* ─── PARENT STEP 4 or TUTOR STEP 7: SCHEDULE & FEE ─── */}
                     {((currentStep === 4 && userType === 'parent') || (currentStep === 7 && userType === 'teacher')) && (
                       <div className="space-y-4">
                         <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Schedule & Fee</h2>
                         <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Preferred Days</label>
                           <div className="flex flex-wrap gap-2">
                             {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                               <button key={day} onClick={() => { playTapSound(); const currentDays = userDays ? userDays.split(', ') : []; const next = currentDays.includes(day) ? currentDays.filter(v => v !== day) : [...currentDays, day]; setUserDays(next.join(', ')); localStorage.setItem('userDays', next.join(', ')); }} className={cn("px-4 py-2 rounded-xl border-2 font-black text-[10px] uppercase tracking-tight transition-all", (userDays ? userDays.split(', ') : []).includes(day) ? "border-primary bg-primary text-white" : "border-slate-100 text-slate-400 bg-white")}>{day}</button>
                             ))}
                           </div>
                         </div>
                         <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Preferred Time</label>
                           <div className="grid grid-cols-3 gap-2 max-h-[180px] overflow-y-auto p-1 custom-scrollbar">
                             {TIME_LIST.map(time => (
                               <button key={time} onClick={() => { playTapSound(); const currentTimes = userTime ? userTime.split(', ') : []; const next = currentTimes.includes(time) ? currentTimes.filter(v => v !== time) : [...currentTimes, time]; setUserTime(next.join(', ')); localStorage.setItem('userTime', next.join(', ')); }} className={cn("py-2 px-1 rounded-lg border font-bold text-[9px] text-center transition-all", (userTime ? userTime.split(', ') : []).includes(time) ? "border-primary bg-primary/10 text-primary" : "border-slate-100 text-slate-400 bg-white")}>{time}</button>
                             ))}
                           </div>
                         </div>
                         {userType === 'teacher' ? (
                           <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Fee Charges (Per Hour)</label>
                             <div className="grid grid-cols-1 gap-2">
                               {TUTOR_FEE_LIST.map(f => (
                                 <button key={f} onClick={() => { playTapSound(); setUserFee(f); localStorage.setItem('userFee', f); }} className={cn("w-full py-3 px-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest text-left transition-all", userFee === f ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-400 bg-white")}>{f}</button>
                               ))}
                             </div>
                           </div>
                         ) : (
                           <div className="space-y-1.5">
                             <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Session Duration</label>
                             <select value={userDuration} onChange={(e) => { setUserDuration(e.target.value); localStorage.setItem('userDuration', e.target.value); }} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all appearance-none"><option value="1 Hour">1 Hour</option><option value="1.5 Hours">1.5 Hours</option><option value="2 Hours">2 Hours</option><option value="2.5 Hours">2.5 Hours</option></select>
                           </div>
                         )}
                       </div>
                     )}

                     {/* ─── PARENT STEP 5 or TUTOR STEP 8: SETTINGS ─── */}
                     {((currentStep === 5 && userType === 'parent') || (currentStep === 8 && userType === 'teacher')) && (
                       <div className="space-y-6">
                         <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Account Settings</h2>
                         {userType === 'parent' && (
                           <div className="space-y-1.5">
                             <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Student/Need Details</label>
                             <textarea value={aboutMe} onChange={(e) => { setAboutMe(e.target.value); localStorage.setItem('aboutMe', e.target.value); }} placeholder="Tell us more about the requirement..." rows={3} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all resize-none" />
                           </div>
                         )}
                         <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex items-center gap-4">
                           <div className="relative">{profilePhoto ? <img src={profilePhoto} alt="User" className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover" /> : <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border-2 border-white shadow-md"><LucideUser size={24} /></div>}</div>
                           <div className="min-w-0 flex-1">
                             <div className="text-[12px] font-black text-slate-900 truncate">{userName || (userType === 'teacher' ? 'Tutor' : 'Parent')}</div>
                             <div className="text-[10px] font-bold text-slate-400 truncate">{activeUser?.email}</div>
                             <div className="text-[9px] font-black text-primary uppercase tracking-widest mt-0.5">{userType === 'parent' ? 'Order ID' : 'Tutor ID'}: #{tutorId || 'Pending'}</div>
                           </div>
                         </div>
                         <button onClick={handleLogout} className="w-full bg-rose-50 text-rose-500 p-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all"><LogOut size={16} /> Sign Out</button>
                         <div className="pt-6 border-t border-slate-100/50">
                           <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><AlertCircle size={12} /> Danger Zone</p>
                           <button onClick={handleDeleteProfile} disabled={isDeletingProfile} className="w-full bg-rose-500 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-rose-200">{isDeletingProfile ? <Loader2 size={16} className="animate-spin" /> : <><Trash2 size={16} /> Delete Profile</>}</button>
                         </div>
                       </div>
                     )}
                   </motion.div>
                 </AnimatePresence>
              </div>

              <div className="p-6 border-t border-slate-50 bg-white flex items-center gap-3 shrink-0">
                 {currentStep > 1 && (
                   <button 
                     onClick={() => { playTapSound(); setCurrentStep(prev => prev - 1); }}
                     className="w-14 h-14 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 active:scale-95 transition-all"
                   >
                     <ChevronRight size={24} className="rotate-180" />
                   </button>
                 )}
                 
                 {(() => {
                   const totalSteps = userType === 'teacher' ? 8 : 5;
                   if (currentStep < totalSteps) {
                     return (
                       <button 
                         onClick={() => { playTapSound(); setCurrentStep(prev => prev + 1); }}
                         disabled={isUpdatingProfile}
                         className={cn(
                           "flex-1 h-14 rounded-2xl text-white font-black text-[12px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2",
                           isUpdatingProfile ? "bg-slate-400 cursor-not-allowed" : "bg-primary"
                         )}
                       >
                         {isUpdatingProfile ? <Loader2 size={20} className="animate-spin" /> : <>Next Step <ChevronRight size={18} strokeWidth={3} /></>}
                       </button>
                     );
                   } else {
                     return (
                       <div className="flex-1 flex gap-3">
                         <button 
                           onClick={handleUpdateProfile}
                           disabled={isUpdatingProfile}
                           className={cn(
                             "flex-[1.5] h-14 rounded-2xl text-white font-black text-[12px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2",
                             isUpdatingProfile ? "bg-slate-400 cursor-not-allowed" : "bg-emerald-500"
                           )}
                         >
                           {isUpdatingProfile ? <Loader2 size={20} className="animate-spin" /> : <>Complete Setup <Check size={18} strokeWidth={3} /></>}
                         </button>
                         <button 
                           onClick={() => setShowProfileSetup(false)}
                           className="flex-1 h-14 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                         >
                           Close
                         </button>
                       </div>
                     );
                   }
                 })()}
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
    </div>
  );
}

function NavButton({ active, onClick, icon, label, activeColor, activeBg, inactiveColor, inactiveBg, badge }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; activeColor: string; activeBg: string; inactiveColor: string; inactiveBg: string; badge?: number }) {
  return (
    <button onClick={onClick} className={cn("flex-1 flex flex-col items-center gap-1 py-1.5 rounded-full transition-all duration-300 active:scale-95 mx-0.5 relative", active ? activeBg + " " + activeColor + " shadow-lg scale-105" : inactiveBg + " " + inactiveColor + " opacity-60")}>
      {icon}
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-1 right-2 w-3.5 h-3.5 bg-orange-500 text-white text-[7px] font-black flex items-center justify-center rounded-full border border-white shadow-sm animate-pulse">
          {badge}
        </span>
      )}
      <span className="text-[7px] font-[1000] tracking-tight">{label}</span>
    </button>
  );
}
