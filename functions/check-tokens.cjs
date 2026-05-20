const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const projectId = 'gen-lang-client-0533512936';
const databaseId = 'ai-studio-c2dd7af9-dcc1-4c28-b5b9-2e1400ca3e28';

initializeApp({ projectId: projectId });
const db = getFirestore(databaseId);

async function checkTokens() {
  console.log("Checking fcm_tokens...");
  try {
    const snap = await db.collection('fcm_tokens').orderBy('lastUpdated', 'desc').limit(5).get();
    if (snap.empty) {
      console.log("No tokens found!");
    } else {
      snap.forEach(doc => {
        const data = doc.data();
        console.log(doc.id, data.platform, data.lastUpdated?.toDate?.() || data.lastUpdated);
      });
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

checkTokens();
