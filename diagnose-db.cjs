const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const projectId = 'gen-lang-client-0533512936';
const customDbId = 'ai-studio-c2dd7af9-dcc1-4c28-b5b9-2e1400ca3e28';

async function diagnose() {
  console.log('--- Database Diagnosis ---');
  
  // Try Default Database
  try {
    const appDefault = initializeApp({ projectId }, 'default-app');
    const dbDefault = getFirestore(appDefault);
    const snapDefault = await dbDefault.collection('alerts').get();
    console.log(`Default Database: ${snapDefault.size} alerts found.`);
  } catch (e) {
    console.log(`Default Database Error: ${e.message}`);
  }

  // Try Custom Database
  try {
    const appCustom = initializeApp({ projectId }, 'custom-app');
    const dbCustom = getFirestore(appCustom, customDbId);
    const snapCustom = await dbCustom.collection('alerts').get();
    console.log(`Custom Database (${customDbId}): ${snapCustom.size} alerts found.`);
  } catch (e) {
    console.log(`Custom Database Error: ${e.message}`);
  }
}

diagnose();
