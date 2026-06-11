import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as path from "path";

// Initialize Admin SDK with Service Account for full permissions
const serviceAccountPath = path.join(__dirname, "..", "service-account.json");

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath)
    });
    console.log("✅ Admin SDK initialized with Service Account");
} catch (error) {
    console.warn("⚠️ Service Account not found, falling back to default initialization");
    admin.initializeApp();
}

const CUSTOM_DB_ID = "(default)"; // Using default database ID

// Using v2 trigger for custom database support in us-central1
export const sendAlertNotification = onDocumentCreated({
    document: "alerts/{alertId}",
    database: CUSTOM_DB_ID,
    region: "us-central1" 
}, async (event) => {
    try {
        const snap = event.data;
        if (!snap) {
            console.log("⚠️ No data in event");
            return;
        }

        const newValue = snap.data();
        const message = newValue.message || "New Alert from DoAble India";
        const sender = newValue.sender || "Notification 🔔";
        
        const displayTitle = sender.startsWith("📢") ? sender : `📢 ${sender}`;

        console.log(`📨 Alert Created - Message: ${message} | Sender: ${sender}`);

        const db = getFirestore(CUSTOM_DB_ID);
        const tokensSnap = await db.collection("fcm_tokens").get();
        
        const registrationTokensSet = new Set<string>();

        const targetCity = (newValue.city || "All").toString().toLowerCase().trim();
        const targetUserType = (newValue.targetUserType || "all").toString().toLowerCase().trim();
        const targetClass = (newValue.targetClass || "All").toString().toLowerCase().trim();
        const targetGender = (newValue.gender || "Any").toString().toLowerCase().trim();
        const targetTutorId = (newValue.targetTutorId || "all").toString().toLowerCase().trim();

        tokensSnap.forEach(doc => {
            const data = doc.data();
            const token = data.token || doc.id;

            // 0.1 Tutor ID Targeting
            const userTutorId = (data.tutorId || data.targetTutorId || 'all').toString().toLowerCase().trim();
            if (targetTutorId !== 'all' && userTutorId !== targetTutorId) return;

            // 1. City Filter
            const userCity = (data.city || 'All').toString().toLowerCase().trim();
            if (targetCity !== 'all' && userCity !== 'all' && targetCity !== userCity) return;

            // 2. User Type Filter
            const userType = (data.targetUserType || 'all').toString().toLowerCase().trim();
            if (targetUserType !== 'all' && userType !== 'all' && targetUserType !== userType) return;

            // 3. Gender Filter
            const userGender = (data.gender || 'Any').toString().toLowerCase().trim();
            if (targetGender !== 'any' && userGender !== 'any' && targetGender !== userGender) return;

            // 4. Class Filter
            const userClasses = (data.targetClass || 'All').toString().toLowerCase().trim();
            if (targetClass !== 'all' && userClasses !== 'all') {
                const matches = userClasses.split(',').some((c: string) => {
                    const uCls = c.trim().toLowerCase().replace('class ', '');
                    const tCls = targetClass.toLowerCase().replace('class ', '');
                    return tCls.includes(uCls) || uCls.includes(tCls);
                });
                if (!matches) return;
            }

            if (token && typeof token === 'string' && token.length > 20) {
                registrationTokensSet.add(token);
            }
        });

        const registrationTokens = Array.from(registrationTokensSet);
        console.log(`📊 Filtered tokens: ${registrationTokens.length} (City: ${targetCity}, Type: ${targetUserType}, Class: ${targetClass})`);

        if (registrationTokens.length === 0) return;

        const payload = {
            notification: {
                title: displayTitle,
                body: message,
            },
            data: {
                title: displayTitle,
                body: message,
                notificationId: event.id,
                type: newValue.type || 'alert'
            },
            android: {
                priority: "high" as const,
                notification: {
                    channelId: "doable_channel_v10",
                    sound: "blackberry"
                }
            },
            apns: {
                headers: {
                    "apns-priority": "10",
                    "apns-push-type": "alert"
                },
                payload: {
                    aps: {
                        alert: {
                            title: displayTitle,
                            body: message
                        },
                        sound: "blackberry.mp3", 
                        badge: 1,
                        "content-available": 1,
                        "mutable-content": 1
                    }
                }
            },
            tokens: registrationTokens,
        };

        const response = await admin.messaging().sendEachForMulticast(payload);
        console.log(`✅ Sent ${response.successCount}, Failed ${response.failureCount}`);
        
    } catch (error) {
        console.error("❌ Error in sendAlertNotification:", error);
    }
});

// Emergency Dispatch
export const emergencyDispatchAlert = functions.https.onCall({ region: "us-central1" }, async (request) => {
    const data = request.data;
    const auth = request.auth;
    const adminEmails = ['d9717018219@gmail.com', 'doableindia@gmail.com'];
    if (!auth || !adminEmails.includes(auth.token.email || '')) {
        throw new functions.https.HttpsError('permission-denied', 'Unauthorized access');
    }
    try {
        const db = getFirestore(CUSTOM_DB_ID);
        const docRef = await db.collection('alerts').add({
            ...data,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            via: 'Emergency Dispatch'
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, message: String(error) };
    }
});

// Test function
export const sendTestNotification = functions.https.onCall({ region: "us-central1" }, async (request) => {
    try {
        const db = getFirestore(CUSTOM_DB_ID);
        
        // SAVE TO ALERTS COLLECTION FIRST
        const alertData = {
            message: "🔥 Test Alert: Backend optimized!",
            sender: "System Test 🛠️",
            type: "broadcast",
            city: "All",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            via: "Test Function"
        };
        await db.collection("alerts").add(alertData);

        const tokensSnap = await db.collection("fcm_tokens").get();
        const registrationTokens: string[] = [];
        tokensSnap.forEach(doc => {
            const token = doc.data().token || doc.id;
            if (token && token.length > 20) registrationTokens.push(token);
        });
        if (registrationTokens.length === 0) return { success: true, message: "Alert saved to history, but no tokens found for push." };
        
        const testPayload = {
            notification: { title: "🔥 Test Alert", body: "Backend optimized!" },
            apns: {
                payload: { aps: { alert: { title: "🔥 Test Alert", body: "Backend optimized!" }, sound: "default", badge: 1 } },
                headers: { "apns-priority": "10" }
            },
            tokens: registrationTokens
        };
        const response = await admin.messaging().sendEachForMulticast(testPayload);
        return { success: true, count: response.successCount, message: "Alert saved and notification sent!" };
    } catch (error) {
        return { success: false, error: String(error) };
    }
});
