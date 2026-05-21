import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, memoryLocalCache, terminate, clearIndexedDbPersistence } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
  apiKey: "AIzaSyD5espRj-NwGzzbnhGnPKP4uvO0zjt8y7s",
  authDomain: "doable-india-app-9564b-496310.firebaseapp.com",
  projectId: "doable-india-app-9564b-496310",
  storageBucket: "doable-india-app-9564b-496310.firebasestorage.app",
  messagingSenderId: "237759117673",
  appId: "1:237759117673:web:77f0b3ce12b5f4e71ce5f8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const db = initializeFirestore(app, {
  // Build 185: Using standard settings for maximum compatibility
});

// Build 116: Helper to force-clear firestore cache if it hangs
export const forceResetFirestore = async () => {
    try {
        await terminate(db);
        await clearIndexedDbPersistence(db);
        console.log('✅ Firestore Cache Cleared');
        window.location.reload();
    } catch (e) {
        console.error('❌ Reset failed:', e);
    }
};

export const functions = getFunctions(app, 'us-central1');

export const messaging = Capacitor.isNativePlatform() ? null : (() => {
  try {
    const { getMessaging } = require('firebase/messaging');
    return getMessaging(app);
  } catch { return null; }
})();

export const requestNotificationPermission = async () => {};
export const initForegroundMessaging = () => {};
export const getWebFCMToken = async () => null;

export default app;
