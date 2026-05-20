const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize with the project ID and database ID from your config
const projectId = 'gen-lang-client-0533512936';
const databaseId = 'ai-studio-c2dd7af9-dcc1-4c28-b5b9-2e1400ca3e28';

initializeApp({ projectId: projectId });
const db = getFirestore(databaseId);

async function check() {
  console.log("--- Checking fcm_tokens ---");
  try {
    const snap = await db.collection('fcm_tokens').orderBy('lastUpdated', 'desc').limit(5).get();
    if (snap.empty) {
      console.log("No tokens found in collection 'fcm_tokens'");
    } else {
      snap.forEach(doc => {
        const d = doc.data();
        const date = d.lastUpdated?.toDate ? d.lastUpdated.toDate() : d.lastUpdated;
        console.log(`ID: ${doc.id.substring(0, 10)}... | Platform: ${d.platform} | Last Updated: ${date}`);
      });
    }
    
    console.log("\n--- Checking latest alerts ---");
    const alertSnap = await db.collection('alerts').orderBy('timestamp', 'desc').limit(1).get();
    alertSnap.forEach(doc => {
       console.log(`Latest Alert: ${doc.id} | Msg: ${doc.data().message}`);
    });
  } catch (e) {
    console.error("Error:", e.message);
  }
}

check();
