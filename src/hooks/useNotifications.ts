/**
 * Push Notifications Hook
 * Firebase Cloud Messaging + Capacitor Push Notifications Setup
 */

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import {
  getFCMToken,
  setupMessageHandler,
  requestNotificationPermission
} from '../firebase';

export const useNotifications = () => {
  useEffect(() => {
    const initializeNotifications = async () => {
      console.log('🔔 Initializing notifications...');

      try {
        // Request notification permission
        const permissionGranted = await requestNotificationPermission();
        if (!permissionGranted) {
          console.warn('⚠️ Notification permission not granted');
          return;
        }

        // Setup Firebase Cloud Messaging
        setupMessageHandler();

        // Get and log FCM token
        const fcmToken = await getFCMToken();
        if (fcmToken) {
          console.log('✅ FCM Token:', fcmToken);
          // Store token in localStorage for backend use
          localStorage.setItem('fcmToken', fcmToken);
        }

        // Setup Capacitor Push Notifications for native
        if (Capacitor.isNativePlatform()) {
          await setupCapacitorPushNotifications();
        }

        console.log('✅ Notifications initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing notifications:', error);
      }
    };

    initializeNotifications();
  }, []);
};

/**
 * Setup Capacitor Push Notifications for native platforms
 */
async function setupCapacitorPushNotifications() {
  try {
    // Request push notifications permission
    const result = await PushNotifications.requestPermissions();

    if (result.receive === 'granted') {
      // Subscribe to push notifications
      await PushNotifications.addListener(
        'registration',
        (token) => {
          console.log('✅ Capacitor Push Token:', token.value);
          localStorage.setItem('capacitorPushToken', token.value);
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
          // Handle notification tap/action
          const data = notification.notification.data;
          handleNotificationAction(data);
        }
      );

      console.log('✅ Capacitor Push Notifications setup complete');
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
          }
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

  // Handle different notification types
  if (data?.type === 'job') {
    // Navigate to job detail
    window.dispatchEvent(
      new CustomEvent('navigateToJob', { detail: { jobId: data.jobId } })
    );
  } else if (data?.type === 'tutor') {
    // Navigate to tutor detail
    window.dispatchEvent(
      new CustomEvent('navigateToTutor', { detail: { tutorId: data.tutorId } })
    );
  } else if (data?.type === 'alert') {
    // Navigate to alerts
    window.dispatchEvent(
      new CustomEvent('navigateToAlerts')
    );
  }
}

export default useNotifications;
