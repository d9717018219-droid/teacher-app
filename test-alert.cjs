const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const projectId = 'gen-lang-client-0533512936';
const databaseId = 'ai-studio-c2dd7af9-dcc1-4c28-b5b9-2e1400ca3e28';

// We use the default application credentials if available, or just initialize with projectId
// In this environment, we might need to be logged in via firebase cli
initializeApp({
  projectId: projectId
});

const db = getFirestore(databaseId);

async function triggerAlert() {
  console.log(`Adding test alert to database: ${databaseId}...`);
  try {
    const docRef = await db.collection('alerts').add({
      message: 'System Check: Alert with Sound',
      city: 'All',
      type: 'test',
      sender: 'Gemini-CLI',
      timestamp: new Date().toISOString()
    });
    console.log('Document written with ID: ', docRef.id);
    console.log('The Cloud Function should now be triggered!');
  } catch (e) {
    console.error('Error adding document: ', e);
  }
}

triggerAlert();
