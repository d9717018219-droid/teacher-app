/**
 * Push Notifications Hook
 * Firebase Cloud Messaging + Capacitor Push Notifications Setup
 */

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import {
  getFCMToken,
  setupMessageHandler,
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
        // 1. Web-Push Initialization (Only if not native)
        if (!Capacitor.isNativePlatform()) {
           const permissionGranted = await requestNotificationPermission();
           if (permissionGranted) {
              setupMessageHandler();
              const fcmToken = await getFCMToken();
              if (fcmToken) {
                console.log('✅ Web FCM Token:', fcmToken);
                localStorage.setItem('fcmToken', fcmToken);
                await saveTokenToFirestore(fcmToken, 'web', userCity, userGender, userClasses, userType);
              }
           }
        }

        // 2. Native Push Initialization
        if (Capacitor.isNativePlatform()) {
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
    const tokenData = {
      token,
      platform,
      lastUpdated: serverTimestamp(),
      city: city || 'All',
      gender: gender || 'Any',
      targetClass: classes.length > 0 ? classes.join(', ') : 'All',
      targetUserType: userType || 'all',
      appVersion: '1.0.121_ULTIMATE'
    };

    await setDoc(doc(db, 'fcm_tokens', token), tokenData, { merge: true });
    console.log('💾 Token saved to Firestore:', platform);
  } catch (e) {
    console.error('❌ Error saving token to Firestore:', e);
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
    // Request push notifications permission
    const result = await PushNotifications.requestPermissions();

    if (result.receive === 'granted') {
      // Subscribe to push notifications
      await PushNotifications.addListener(
        'registration',
        async (token) => {
          let cleanToken = token.value;
          if (cleanToken.includes(':')) {
            cleanToken = cleanToken.split(':')[1].trim();
          }
          console.log('✅ Native FCM Token:', cleanToken);
          localStorage.setItem('fcmToken', cleanToken);
          await saveTokenToFirestore(cleanToken, 'android', city, gender, classes, userType);
        }
      );

      // Handle incoming push notifications
      await PushNotifications.addListener(
        'pushNotificationReceived',
        (notification) => {
          console.log('📬 Push received:', notification);
          showLocalNotification(
            notification.title || 'New Notification',
            notification.body || ''
          );
        }
      );

      // Handle push notification action
      await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notification) => {
          console.log('👆 Push action performed:', notification);
          const data = notification.notification.data;
          handleNotificationAction(data);
        }
      );

      await PushNotifications.register();
      console.log('✅ Capacitor Push Notifications registered');
    } else {
      console.warn('⚠️ Push notification permission denied');
    }
  } catch (error) {
    console.error('❌ Error setting up Capacitor notifications:', error);
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
            at: new Date(Date.now() + 1000)
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
  } else if (data?.type === 'alert') {
    window.dispatchEvent(new CustomEvent('navigateToTab', { detail: 'alerts' }));
  }
}

export default useNotifications;
