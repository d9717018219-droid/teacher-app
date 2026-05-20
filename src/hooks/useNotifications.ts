/**
 * Push Notifications Hook
 * Firebase Cloud Messaging + Capacitor Push Notifications Setup
 */

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import {
  getWebFCMToken,
  initForegroundMessaging,
  requestNotificationPermission
} from '../firebase';

export const useNotifications = (
  userCity: string,
  userGender: string,
  userClasses: string[],
  userType: string
) => {
  useEffect(() => {
    const initializeNotifications = async () => {
      console.log('🔔 Initializing notifications...');

      try {
        // 1. Local Notifications Setup (Channels)
        if (Capacitor.isNativePlatform()) {
          await LocalNotifications.createChannel({
            id: 'doable_channel_v6',
            name: 'Tuition Alerts',
            description: 'Custom sound alerts for tuition jobs',
            sound: 'blackberry.mp3', // Extension needed for LocalNotifications
            importance: 5,
            visibility: 1,
            vibration: true,
          });
        }

        // 2. Web-Push Initialization (Only if not native)
        if (!Capacitor.isNativePlatform()) {
           const permissionGranted = await requestNotificationPermission();
           if (permissionGranted) {
              initForegroundMessaging();
              const fcmToken = await getWebFCMToken();
              if (fcmToken) {
                console.log('✅ Web FCM Token:', fcmToken);
                localStorage.setItem('fcmToken', fcmToken);
                await saveTokenToFirestore(fcmToken, 'web', userCity, userGender, userClasses, userType);
              }
           }
        }

      // 3. Native Push Initialization
        if (Capacitor.isNativePlatform()) {
          console.log('📱 Native platform detected, setting up Capacitor Push...');
          await setupCapacitorPushNotifications(userCity, userGender, userClasses, userType);
        }

        console.log('✅ Notifications initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing notifications:', error);
      }
    };

    initializeNotifications();
  }, [userCity, userGender, userClasses, userType]);
};

/**
 * Save token to Firestore with user preferences
 */
async function saveTokenToFirestore(
  token: string, 
  platform: string,
  city: string,
  gender: string,
  classes: string[],
  userType: string
) {
  try {
    const user = auth.currentUser;
    console.log(`💾 Attempting to save ${platform} token to Firestore...`);
    const tokenData = {
      token,
      platform,
      lastUpdated: serverTimestamp(),
      userId: user ? user.uid : 'anonymous',
      userEmail: user ? user.email : 'anonymous',
      city: city || 'All',
      gender: gender || 'Any',
      targetClass: Array.isArray(classes) && classes.length > 0 ? classes.join(', ') : 'All',
      targetUserType: userType || 'all',
      appVersion: '1.0.121_ULTIMATE_v5',
      lastSeen: new Date().toISOString()
    };

    // Sanitize token for use as document ID (Firestore IDs cannot have slashes)
    // We also store the original token as a field for the Cloud Function to use
    const sanitizedId = token.replace(/[\/\.]/g, '_');
    await setDoc(doc(db, 'fcm_tokens', sanitizedId), tokenData, { merge: true });
    console.log('✅ Token saved to Firestore successfully (ID: ' + sanitizedId + ')');
    
    // Dispatch event to update UI with token
    window.dispatchEvent(new CustomEvent('fcmTokenUpdated', { detail: token }));
  } catch (e) {
    console.error('❌ Error saving token to Firestore:', e);
    window.dispatchEvent(new CustomEvent('fcmRegistrationError', { detail: String(e) }));
  }
}

/**
 * Setup Capacitor Push Notifications for native platforms
 */
async function setupCapacitorPushNotifications(
  city: string,
  gender: string,
  classes: string[],
  userType: string
) {
  try {
    console.log('🔑 Requesting Push permissions...');
    const result = await PushNotifications.requestPermissions();
    console.log('📊 Permission result:', result.receive);

    if (result.receive === 'granted') {
      // Clear all listeners first to avoid duplicates
      await PushNotifications.removeAllListeners();

      // Subscribe to registration errors
      await PushNotifications.addListener('registrationError', (error) => {
        console.error('❌ Push Registration Error:', error);
        window.dispatchEvent(new CustomEvent('fcmRegistrationError', { detail: error.error }));
      });

      // Subscribe to push notifications
      await PushNotifications.addListener(
        'registration',
        async (token) => {
          const fcmToken = token.value;
          console.log('✅ Native FCM Token Registered:', fcmToken);
          localStorage.setItem('fcmToken', fcmToken);
          await saveTokenToFirestore(fcmToken, 'android', city, gender, classes, userType);
        }
      );

      // Handle incoming push notifications (Foreground)
      let lastNotificationId = '';
      await PushNotifications.addListener(
        'pushNotificationReceived',
        (notification) => {
          console.log('📬 Push received (foreground):', notification);
          
          // De-duplication logic
          const currentId = notification.id || 
                           (notification.data?.notificationId) || 
                           `${notification.title}-${notification.body}`;
          
          if (currentId === lastNotificationId) {
            console.log('🚫 Skipping duplicate notification in foreground');
            return;
          }
          lastNotificationId = currentId;

          // Trigger custom event for UI updates (like alert count)
          window.dispatchEvent(new CustomEvent('firebaseNotification', { detail: notification }));

          // Show a local notification so the user sees it in foreground
          showLocalNotification(
            notification.title || 'New Job Alert 🆕',
            notification.body || 'Check the latest tuition requirements!'
          );
        }
      );

      // Handle push notification action (Tap)
      await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notification) => {
          console.log('👆 Push action performed:', notification);
          const data = notification.notification.data;
          handleNotificationAction(data);
        }
      );

      // Finally Register
      await PushNotifications.register();
      console.log('✅ Capacitor Push Notifications registered');
    } else {
      console.warn('⚠️ Push notification permission denied');
      window.dispatchEvent(new CustomEvent('fcmRegistrationError', { detail: 'Permission denied by user' }));
    }
  } catch (error) {
    console.error('❌ Error setting up Capacitor notifications:', error);
    window.dispatchEvent(new CustomEvent('fcmRegistrationError', { detail: String(error) }));
  }
}

/**
 * Show local notification
 */
async function showLocalNotification(title: string, body: string) {
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: Math.floor(Math.random() * 10000),
          schedule: {
            at: new Date(Date.now() + 500) // Immediate
          },
          sound: 'blackberry.mp3',
          channelId: 'doable_channel_v6'
        }
      ]
    });
  } catch (error) {
    console.error('Error showing local notification:', error);
  }
}

/**
 * Handle notification action/tap
 */
function handleNotificationAction(data: any) {
  console.log('Handling notification action with data:', data);
  if (data?.type === 'job' || data?.jobId) {
    window.dispatchEvent(new CustomEvent('navigateToTab', { detail: 'jobs' }));
  } else if (data?.type === 'alert' || data?.type === 'support') {
    window.dispatchEvent(new CustomEvent('navigateToTab', { detail: 'alerts' }));
  } else {
    // Default fallback
    window.dispatchEvent(new CustomEvent('navigateToTab', { detail: 'home' }));
  }
}

export default useNotifications;
