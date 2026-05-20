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
      if (Capacitor.isNativePlatform()) {
        alert('DEBUG: Starting v1.0.134-B7');
      }

      try {
        if (Capacitor.isNativePlatform()) {
          // 1. Setup Push Notifications First (Most Important)
          await setupCapacitorPushNotifications(userCity, userGender, userClasses, userType);
          
          // 2. Setup Local Channels (Optional, mostly for Android)
          try {
            await LocalNotifications.createChannel({
              id: 'doable_channel_v6',
              name: 'Tuition Alerts',
              description: 'Custom sound alerts for tuition jobs',
              sound: 'blackberry.mp3',
              importance: 5,
              visibility: 1,
              vibration: true,
            });
            console.log('✅ Local Channel Created');
          } catch (channelError) {
            console.warn('⚠️ Channel Creation Error:', channelError);
          }
        } else {
           // Web-Push Initialization
           const permissionGranted = await requestNotificationPermission();
           if (permissionGranted) {
              initForegroundMessaging();
              const fcmToken = await getWebFCMToken();
              if (fcmToken) {
                await saveTokenToFirestore(fcmToken, 'web', userCity, userGender, userClasses, userType);
              }
           }
        }
      } catch (error) {
        alert('❌ GLOBAL ERROR: ' + String(error));
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
      appVersion: '1.0.134-DIAGNOSTIC-B7',
      lastSeen: new Date().toISOString()
    };

    const sanitizedId = token.replace(/[\/\.]/g, '_');
    await setDoc(doc(db, 'fcm_tokens', sanitizedId), tokenData, { merge: true });
    
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
    alert('DEBUG: Requesting Push Permissions...');
    const result = await PushNotifications.requestPermissions();
    alert('DEBUG: Permission Result = ' + result.receive);

    if (result.receive === 'granted') {
      await PushNotifications.removeAllListeners();

      await PushNotifications.addListener('registrationError', (error) => {
        alert('❌ Push Reg Error: ' + JSON.stringify(error));
      });

      await PushNotifications.addListener(
        'registration',
        async (token) => {
          const fcmToken = token.value;
          alert('✅ Token Received: ' + fcmToken.substring(0, 10) + '...');
          const platform = Capacitor.getPlatform();
          localStorage.setItem('fcmToken', fcmToken);
          await saveTokenToFirestore(fcmToken, platform, city, gender, classes, userType);
        }
      );

      await PushNotifications.addListener(
        'pushNotificationReceived',
        (notification) => {
          // Foreground notification handling
          window.dispatchEvent(new CustomEvent('firebaseNotification', { detail: notification }));
          showLocalNotification(
            notification.title || 'New Job Alert 🆕',
            notification.body || 'Check the latest tuition requirements!'
          );
        }
      );

      await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notification) => {
          handleNotificationAction(notification.notification.data);
        }
      );

      await PushNotifications.register();
      alert('DEBUG: Push Registered Successfully');
    } else {
      alert('⚠️ Push Permission Denied by User');
    }
  } catch (error) {
    alert('❌ Push Setup Crash: ' + String(error));
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
            at: new Date(Date.now() + 500)
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
  if (data?.type === 'job' || data?.jobId) {
    window.dispatchEvent(new CustomEvent('navigateToTab', { detail: 'jobs' }));
  } else if (data?.type === 'alert' || data?.type === 'support') {
    window.dispatchEvent(new CustomEvent('navigateToTab', { detail: 'alerts' }));
  } else {
    window.dispatchEvent(new CustomEvent('navigateToTab', { detail: 'home' }));
  }
}

export default useNotifications;
