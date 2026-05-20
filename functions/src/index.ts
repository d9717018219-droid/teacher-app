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

// Test function to send manual notification
export const sendTestNotification = functions.https.onCall({ region: "us-central1" }, async (request) => {
    console.log("📨 Test Notification Request received");

    try {
        const db = getFirestore(CUSTOM_DB_ID);
        const tokensSnap = await db.collection("fcm_tokens").get();
        const registrationTokens: string[] = [];

        tokensSnap.forEach(doc => {
            const data = doc.data();
            const token = data.token || doc.id;
            // Basic validation: FCM tokens are long strings and shouldn't have slashes if using doc.id
            if (token && typeof token === 'string' && token.length > 20) {
                registrationTokens.push(token);
                console.log("📱 Found Valid Token:", token.substring(0, 10) + "...");
            }
        });

        console.log("📊 Total Valid Tokens Found:", registrationTokens.length);

        if (registrationTokens.length === 0) {
            console.log("⚠️ No registration tokens found in Firestore!");
            return { success: false, message: "No tokens found", tokenCount: 0 };
        }

        const testPayload = {
            notification: {
                title: "🔥 DoAble TEST Alert",
                body: "This is a test notification from DoAble India",
            },
            data: {
                title: "🔥 DoAble TEST Alert",
                body: "This is a test notification from DoAble India",
                testId: Date.now().toString(),
            },
            android: {
                priority: "high" as const,
                notification: {
                    channelId: "doable_channel_v6",
                },
            },
            tokens: registrationTokens,
        };

        const response = await admin.messaging().sendEachForMulticast(testPayload);

        console.log("✅ Sent to", response.successCount, "devices");
        return {
            success: true,
            message: `Sent to ${response.successCount} devices`,
            successCount: response.successCount,
            failureCount: response.failureCount,
            totalTokens: registrationTokens.length
        };
    } catch (error) {
        console.error("❌ Error in sendTestNotification:", error);
        return { success: false, message: String(error) };
    }
});

// New Emergency Dispatch function to bypass Firestore rules
export const emergencyDispatchAlert = functions.https.onCall({ region: "us-central1" }, async (request) => {
    const data = request.data;
    const auth = request.auth;

    // Check if user is authorized (hardcoded admin emails for safety)
    const adminEmails = ['d9717018219@gmail.com', 'doableindia@gmail.com'];
    if (!auth || !adminEmails.includes(auth.token.email || '')) {
        throw new functions.https.HttpsError('permission-denied', 'Unauthorized access');
    }

    try {
        const db = getFirestore(CUSTOM_DB_ID);
        
        // Save to Firestore using Admin SDK (bypasses rules)
        const docRef = await db.collection('alerts').add({
            ...data,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            via: 'Emergency Dispatch'
        });

        return { 
            success: true, 
            message: 'Alert dispatched successfully via Admin SDK',
            id: docRef.id 
        };
    } catch (error) {
        console.error("❌ Error in emergencyDispatchAlert:", error);
        return { success: false, message: String(error) };
    }
});

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
        
        // Ensure title has the emoji prefix if not already present
        const displayTitle = sender.startsWith("📢") ? sender : `📢 ${sender}`;

        console.log(`📨 Alert Created (v2) - Message: ${message} | Sender: ${sender}`);

        const db = getFirestore(CUSTOM_DB_ID);
        const tokensSnap = await db.collection("fcm_tokens").get();
        
        // Use a Set to de-duplicate tokens (just in case)
        const registrationTokensSet = new Set<string>();

        tokensSnap.forEach(doc => {
            const data = doc.data();
            const token = data.token || doc.id;
            if (token && typeof token === 'string' && token.length > 20) {
                // Avoid adding the same token multiple times
                registrationTokensSet.add(token);
            }
        });

        const registrationTokens = Array.from(registrationTokensSet);
        console.log("📊 Sending to", registrationTokens.length, "unique valid tokens");

        if (registrationTokens.length === 0) {
            return;
        }

        const payload = {
            notification: {
                title: displayTitle,
                body: message,
            },
            data: {
                title: displayTitle,
                body: message,
                notificationId: event.id,
                timestamp: new Date().toISOString(),
                type: newValue.type || 'alert'
            },
            android: {
                priority: "high" as const,
                notification: {
                    channelId: "doable_channel_v6",
                    tag: "doable_alert",
                    icon: "ic_launcher",
                    color: "#543F63",
                    sound: "default"
                },
                ttl: 86400 // 24 hours
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
                        sound: "blackberry.caf",
                        "mutable-content": 1,
                        badge: 1,
                        "content-available": 1
                    }
                }
            },
            tokens: registrationTokens,
        };

        const response = await admin.messaging().sendEachForMulticast(payload);
        console.log(`✅ Sent ${response.successCount} messages, ${response.failureCount} failed.`);
        
        // Optional: Clean up failed tokens
        if (response.failureCount > 0) {
            console.log(`🧹 Cleaning up ${response.failureCount} failed tokens...`);
            // Logic to delete tokens from Firestore could go here
        }
    } catch (error) {
        console.error("❌ Error in sendAlertNotification:", error);
    }
});
