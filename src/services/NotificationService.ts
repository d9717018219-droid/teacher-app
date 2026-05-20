import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { alertStorage } from './alertStorage';

export interface NotificationUser {
  city: string;
  gender: string | null;
  classes: string[];
  userType: string | null;
}

class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async init(
    user: NotificationUser, 
    onToken?: (token: string) => void,
    onStatus?: (status: string) => void
  ) {
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications not supported on web.');
      onStatus?.('Web Mode');
      return;
    }

    if (this.isInitialized) {
        onStatus?.('Already Init');
        return;
    }

    try {
      onStatus?.('Checking Perms...');
      
      // Request Push Permissions
      let pushPerm = await PushNotifications.checkPermissions();
      if (pushPerm.receive !== 'granted') {
        onStatus?.('Requesting Push...');
        pushPerm = await PushNotifications.requestPermissions();
      }

      // Request Local Notification Permissions (Android 13+)
      if (Capacitor.isNativePlatform()) {
        try {
          const { LocalNotifications } = await import('@capacitor/local-notifications');
          let localPerm = await LocalNotifications.checkPermissions();
          if (localPerm.display !== 'granted') {
            onStatus?.('Requesting Local...');
            await LocalNotifications.requestPermissions();
          }
        } catch (e) {
          console.error('Local Notification permission error:', e);
        }
      }

      if (pushPerm.receive === 'granted') {
        onStatus?.('Creating Channel...');
        // Create custom channel for Android
        await PushNotifications.createChannel({
          id: 'doable_channel_v10',
          name: 'Tuition Alerts',
          description: 'Custom sound alerts for tuition jobs',
          sound: 'blackberry',
          importance: 5,
          visibility: 1,
          vibration: true,
        });

        onStatus?.('Registering...');
        
        // IMPORTANT: Add listeners BEFORE registration to catch the initial token and any early messages
        this.addListeners(user, onToken, onStatus);

        // Register with FCM
        await PushNotifications.register();
        this.isInitialized = true;
      } else {
        onStatus?.('Perm Denied');
      }
    } catch (error) {
      console.error('Notification Service Init Error:', error);
      onStatus?.('Error: ' + error);
    }
  }

  private addListeners(
    user: NotificationUser,
    onToken?: (token: string) => void,
    onStatus?: (status: string) => void
  ) {
    PushNotifications.removeAllListeners();

    PushNotifications.addListener('registration', async (token: Token) => {
      let cleanToken = token.value;
      if (cleanToken.includes(':')) {
        cleanToken = cleanToken.split(':')[1].trim();
      }
      
      console.log('FCM Token Registered:', cleanToken);
      onToken?.(cleanToken);
      onStatus?.('Registered ✅');
      await this.saveTokenToFirestore(cleanToken, user);
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push Registration Error:', error);
      onStatus?.('Reg Error: ' + JSON.stringify(error));
    });

    PushNotifications.addListener('pushNotificationReceived', async (notification: PushNotificationSchema) => {
      console.log('Notification Received:', notification);
      await alertStorage.saveNotification({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        data: notification.data
      });
      console.log("Notification Saved to Local History");
    });

    PushNotifications.addListener('pushNotificationActionPerformed', async (action: ActionPerformed) => {
      console.log('Notification Action Performed:', action);
      const notification = action.notification;
      
      // Save notification in case it wasn't caught in background
      await alertStorage.saveNotification({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        data: notification.data
      });

      // Mark as read when clicked
      if (notification.id) {
        await alertStorage.markAsRead(notification.id);
      }

      // Handle navigation if needed (e.g., if data has a screen property)
      if (notification.data && notification.data.screen === 'alerts') {
        // We might need a callback here to trigger tab change in App.tsx
        window.dispatchEvent(new CustomEvent('app:navigate', { detail: 'alerts' }));
      }
    });
  }

  private async saveTokenToFirestore(token: string, user: NotificationUser) {
    try {
      const tokenData = {
        token,
        lastUpdated: serverTimestamp(),
        platform: 'android',
        city: user.city,
        gender: user.gender,
        classes: user.classes,
        userType: user.userType,
        appVersion: '1.0.133'
      };

      await setDoc(doc(db, 'fcm_tokens', token), tokenData, { merge: true });
      console.log('FCM Token saved to Firestore');
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }
}

export const notificationService = NotificationService.getInstance();
