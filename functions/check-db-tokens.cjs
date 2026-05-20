const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const projectId = 'gen-lang-client-0533512936';
const databaseId = 'ai-studio-c2dd7af9-dcc1-4c28-b5b9-2e1400ca3e28';

initializeApp({ projectId: projectId });
const db = getFirestore(databaseId);

async function check() {
  console.log("Checking tokens in database: " + databaseId);
  try {
    const snap = await db.collection('fcm_tokens').orderBy('lastUpdated', 'desc').limit(5).get();
    if (snap.empty) {
      console.log("No tokens found!");
    } else {
      snap.forEach(doc => {
        console.log("Token ID: " + doc.id.substring(0, 15) + "... | Platform: " + doc.data().platform);
      });
    }
  } catch (e) {
    console.error("Error: " + e.message);
  }
}
check();
