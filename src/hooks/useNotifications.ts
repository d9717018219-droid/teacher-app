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
      try {
        if (Capacitor.isNativePlatform()) {
          // 1. Setup Push Notifications
          await setupCapacitorPushNotifications(userCity, userGender, userClasses, userType);
          
          // 2. Setup Local Channels (Android focus)
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
          } catch (e) {}
        } else {
           // Web-Push
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
        console.error('❌ Error initializing notifications:', error);
      }
    };

    initializeNotifications();
  }, [userCity, userGender, userClasses, userType]);
};

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
      appVersion: '1.13.0',
      lastSeen: new Date().toISOString()
    };

    const sanitizedId = token.replace(/[\/\.]/g, '_');
    await setDoc(doc(db, 'fcm_tokens', sanitizedId), tokenData, { merge: true });
    window.dispatchEvent(new CustomEvent('fcmTokenUpdated', { detail: token }));
  } catch (e) {
    console.error('❌ Error saving token:', e);
  }
}

async function setupCapacitorPushNotifications(
  city: string,
  gender: string,
  classes: string[],
  userType: string
) {
  try {
    const result = await PushNotifications.requestPermissions();

    if (result.receive === 'granted') {
      await PushNotifications.removeAllListeners();

      await PushNotifications.addListener('registrationError', (error) => {
        console.error('❌ Push Registration Error:', error);
      });

      await PushNotifications.addListener(
        'registration',
        async (token) => {
          const fcmToken = token.value;
          console.log('🚀 RAW TOKEN RECEIVED:', fcmToken);
          
          // Debug alert for visibility on device
          if (Capacitor.getPlatform() === 'ios') {
             alert('DEBUG: iOS Token Length: ' + fcmToken.length);
          }

          if (fcmToken && fcmToken.length > 10) {
            console.log('✅ Valid Token Format');
            const platform = Capacitor.getPlatform();
            localStorage.setItem('fcmToken', fcmToken);
            await saveTokenToFirestore(fcmToken, platform, city, gender, classes, userType);
          } else {
            console.error('❌ Invalid or empty token received');
          }
        }
      );

      await PushNotifications.addListener(
        'pushNotificationReceived',
        (notification) => {
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
    }
  } catch (error) {
    console.error('❌ Push Setup Error:', error);
  }
}

async function showLocalNotification(title: string, body: string) {
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: Math.floor(Math.random() * 10000),
          schedule: { at: new Date(Date.now() + 500) },
          sound: 'blackberry.mp3',
          channelId: 'doable_channel_v6'
        }
      ]
    });
  } catch (e) {}
}

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
