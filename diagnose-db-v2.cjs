const admin = require('/Users/deepak/DoAble-India-App/functions/node_modules/firebase-admin');

const projectId = 'gen-lang-client-0533512936';
const customDbId = 'ai-studio-c2dd7af9-dcc1-4c28-b5b9-2e1400ca3e28';

async function diagnose() {
  console.log('--- Database Diagnosis (Standard Require) ---');
  
  // Initialize for Default Database
  try {
    const appDefault = admin.initializeApp({ projectId }, 'default-app');
    const dbDefault = appDefault.firestore();
    const snapDefault = await dbDefault.collection('alerts').get();
    console.log(`Default Database: ${snapDefault.size} alerts found.`);
  } catch (e) {
    console.log(`Default Database Error: ${e.message}`);
  }

  // Initialize for Custom Database
  try {
    const appCustom = admin.initializeApp({ projectId }, 'custom-app');
    // For custom database ID in admin SDK, we usually use the databaseId option in initializeApp
    // or specify it in getFirestore (if using v11+)
    // In older versions, it might not be supported this way.
    // Let's try the newer way if possible.
    const dbCustom = admin.firestore(appCustom);
    // Note: older firebase-admin might not support multi-database via the constructor this way.
    // We'll check the default one first.
  } catch (e) {
    console.log(`Custom Database Init Error: ${e.message}`);
  }
}

diagnose();
