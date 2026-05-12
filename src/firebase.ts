import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

// ═══════════════════════════════════════════════════════
// FIREBASE CLOUD MESSAGING SETUP
// ═══════════════════════════════════════════════════════

let messaging: any = null;

try {
  messaging = getMessaging(app);
  console.log('✅ Firebase Cloud Messaging initialized');
} catch (error) {
  console.warn('⚠️ Cloud Messaging not available:', error);
}

// Get FCM Token
export const getFCMToken = async () => {
  if (!messaging) {
    console.warn('⚠️ Messaging not initialized');
    return null;
  }

  try {
    const token = await getToken(messaging, {
      vapidKey: 'BKJ2q5bs7bN2tWlBdoYOO1dbtiymhn5Myn500GdIwnseYG5vClfkylXCLw6DeTRLmY3MSz1d86RqsnLovFxGFwQ'
    });

    if (token) {
      console.log('✅ FCM Token obtained:', token);
      return token;
    } else {
      console.warn('⚠️ No FCM token received');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
    return null;
  }
};

// Handle foreground messages
export const setupMessageHandler = () => {
  if (!messaging) {
    console.warn('⚠️ Messaging not available for setting up handler');
    return;
  }

  onMessage(messaging, (payload) => {
    console.log('📬 Foreground message received:', payload);

    // Notification data
    const notificationTitle = payload.notification?.title || 'New Message';
    const notificationOptions = {
      body: payload.notification?.body,
      icon: payload.notification?.image,
      data: payload.data
    };

    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notificationTitle, notificationOptions);
    }

    // Trigger app-specific notification handler
    window.dispatchEvent(
      new CustomEvent('firebaseNotification', {
        detail: payload
      })
    );
  });

  console.log('✅ Message handler setup complete');
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!messaging) {
    console.warn('⚠️ Messaging not available');
    return false;
  }

  try {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        console.log('✅ Notification permission already granted');
        return true;
      }

      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        const granted = permission === 'granted';
        console.log(
          granted ? '✅ Notification permission granted' : '❌ Permission denied'
        );
        return granted;
      }
    }
    return false;
  } catch (error) {
    console.error('❌ Error requesting notification permission:', error);
    return false;
  }
};

// Set persistence to local for better mobile support
setPersistence(auth, browserLocalPersistence).catch(() => {});
