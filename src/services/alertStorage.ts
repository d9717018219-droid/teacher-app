import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, query, orderBy, serverTimestamp, writeBatch, limit } from 'firebase/firestore';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: any;
  read: boolean;
  data?: any;
}

class AlertStorage {
  private static instance: AlertStorage;
  private collectionName = 'user_notifications';

  private constructor() {}

  public static getInstance(): AlertStorage {
    if (!AlertStorage.instance) {
      AlertStorage.instance = new AlertStorage();
    }
    return AlertStorage.instance;
  }

  private getDeviceId() {
    let id = localStorage.getItem('persistent_device_id');
    if (!id) {
      // Use a timestamp + random to be unique enough
      id = 'user_' + Date.now() + Math.random().toString(36).substring(2, 7);
      localStorage.setItem('persistent_device_id', id);
    }
    return id;
  }

  public async saveNotification(notification: any) {
    try {
      console.log("alertStorage: saveNotification called with:", notification);
      
      const deviceId = this.getDeviceId();
      // Try to get ID from various possible fields in the FCM payload
      const id = notification.id || notification.messageId || notification.google_message_id || Date.now().toString();
      
      const notificationData = {
        id: id,
        title: notification.title || notification.notification?.title || 'New Job Alert',
        body: notification.body || notification.notification?.body || 'Tap to see details',
        timestamp: new Date().toISOString(),
        read: false,
        data: notification.data || {}
      };

      console.log("alertStorage: Prepared notification data:", notificationData);

      // 1. ALWAYS Save to Local Cache first
      let localHistory = [];
      try {
        const stored = localStorage.getItem('notification_history');
        localHistory = stored ? JSON.parse(stored) : [];
      } catch (e) {
        console.error("alertStorage: Local parse error:", e);
        localHistory = [];
      }

      // Avoid duplicates
      if (!localHistory.find((n: any) => n.id === id)) {
        localHistory.unshift(notificationData);
        localStorage.setItem('notification_history', JSON.stringify(localHistory.slice(0, 100)));
        console.log("alertStorage: Saved to Local Storage successfully");
      } else {
        console.log("alertStorage: Notification already exists in local storage, skipping save.");
      }

      // 2. Trigger UI refresh IMMEDIATELY
      console.log("alertStorage: Dispatching app:history_updated event");
      window.dispatchEvent(new CustomEvent('app:history_updated'));

      // 3. Save to Firestore (Persistent backup)
      try {
        const docRef = doc(db, this.collectionName, deviceId, 'history', id);
        await setDoc(docRef, {
          ...notificationData,
          timestamp: serverTimestamp()
        }, { merge: true });
        console.log("alertStorage: Synced to Firestore successfully");
      } catch (fsError) {
        console.warn("alertStorage: Firestore sync failed:", fsError);
      }
      
    } catch (error) {
      console.error("alertStorage: Critical error in saveNotification:", error);
    }
  }

  public async getNotifications(): Promise<AppNotification[]> {
    try {
      // 1. Return Local Cache IMMEDIATELY for best UX
      let localData = [];
      try {
        localData = JSON.parse(localStorage.getItem('notification_history') || '[]');
      } catch (e) {
        localData = [];
      }

      // 2. Fetch from Firestore in background to update local cache
      const deviceId = this.getDeviceId();
      const q = query(
        collection(db, this.collectionName, deviceId, 'history'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      
      getDocs(q).then(snapshot => {
        if (!snapshot.empty) {
          const remoteData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString()
            };
          });
          // Update local cache with remote data (merging would be better but let's keep it simple for now)
          localStorage.setItem('notification_history', JSON.stringify(remoteData));
          window.dispatchEvent(new CustomEvent('app:history_updated'));
        }
      }).catch(e => console.warn("Background firestore fetch failed:", e));
      
      return localData;
    } catch (error) {
      console.error("Error in getNotifications:", error);
      return JSON.parse(localStorage.getItem('notification_history') || '[]');
    }
  }

  public async markAsRead(id: string) {
    try {
      const deviceId = this.getDeviceId();
      const docRef = doc(db, this.collectionName, deviceId, 'history', id);
      await setDoc(docRef, { read: true }, { merge: true });
      
      // Update local cache
      const localHistory = JSON.parse(localStorage.getItem('notification_history') || '[]');
      const index = localHistory.findIndex((n: any) => n.id === id);
      if (index !== -1) {
        localHistory[index].read = true;
        localStorage.setItem('notification_history', JSON.stringify(localHistory));
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  }

  public async clearAll() {
    try {
      const deviceId = this.getDeviceId();
      const q = query(collection(db, this.collectionName, deviceId, 'history'));
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      
      localStorage.setItem('notification_history', '[]');
      console.log("All notifications cleared from Firestore & Local");
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  }
}

export const alertStorage = AlertStorage.getInstance();
