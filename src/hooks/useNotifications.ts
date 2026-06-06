/**
 * Push Notifications Hook
 * Firebase Cloud Messaging + Capacitor Push Notifications Setup
 */

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { FCM } from '@capacitor-community/fcm';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, getFirebaseApiKey } from '../firebase';
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
           await requestNotificationPermission();
           if (Notification.permission === 'granted') {
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
    const timestamp = new Date().toISOString();
    const tokenData = {
      token,
      platform,
      lastUpdated: timestamp,
      userId: user ? user.uid : 'anonymous',
      userEmail: user ? user.email : 'anonymous',
      city: city || 'All',
      gender: gender || 'Any',
      targetClass: Array.isArray(classes) && classes.length > 0 ? classes.join(', ') : 'All',
      targetUserType: userType || 'all',
      appVersion: '345.1.1',
      lastSeen: timestamp
    };

    const sanitizedId = token.replace(/[\/\.]/g, '_');
    console.log('📝 Attempting to save token (REST Bypass):', sanitizedId);
    
    // Build 265: Use REST API to save token since SDK is hanging
    const API_KEY = getFirebaseApiKey();
    const REST_URL = `https://firestore.googleapis.com/v1/projects/doable-india-app-9564b-496310/databases/(default)/documents/fcm_tokens/${sanitizedId}?key=${API_KEY}`;
    
    // Format for Firestore REST write
    const restPayload = {
      fields: {
        token: { stringValue: token },
        platform: { stringValue: platform },
        lastUpdated: { timestampValue: timestamp },
        userId: { stringValue: user ? user.uid : 'anonymous' },
        userEmail: { stringValue: user ? user.email : 'anonymous' },
        city: { stringValue: city || 'All' },
        gender: { stringValue: gender || 'Any' },
        targetClass: { stringValue: Array.isArray(classes) && classes.length > 0 ? classes.join(', ') : 'All' },
        targetUserType: { stringValue: userType || 'all' },
        appVersion: { stringValue: '1.13.0' },
        lastSeen: { stringValue: timestamp }
      }
    };

    const response = await fetch(REST_URL, {
      method: 'PATCH', // PATCH with query param creates/updates doc
      body: JSON.stringify(restPayload)
    });

    if (response.ok) {
      console.log('✅ Token saved successfully via REST');
    } else {
      const err = await response.text();
      console.error('REST TOKEN ERROR: ' + response.status, err);
    }
    
    window.dispatchEvent(new CustomEvent('fcmTokenUpdated', { detail: token }));
  } catch (e: any) {
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
          let fcmToken = token.value;
          console.log('🚀 RAW TOKEN RECEIVED:', fcmToken);
          
          // Build 346: Force FCM Token on iOS
          if (Capacitor.getPlatform() === 'ios') {
            try {
              const fcmRes = await FCM.getToken();
              if (fcmRes.token) {
                fcmToken = fcmRes.token;
                console.log('✅ FCM TOKEN (iOS):', fcmToken);
              }
            } catch (e) {
              console.error('❌ FCM GetToken Error:', e);
            }
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
