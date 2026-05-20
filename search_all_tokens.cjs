const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyD5espRj-NwGzzbnhGnPKP4uvO0zjt8y7s",
  authDomain: "doable-india-app-9564b-496310.firebaseapp.com",
  projectId: "doable-india-app-9564b-496310",
  storageBucket: "doable-india-app-9564b-496310.firebasestorage.app",
  messagingSenderId: "237759117673",
  appId: "1:237759117673:web:77f0b3ce12b5f4e71ce5f8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function search() {
  console.log("🔍 Exhaustive search for 'fHfq' in ALL tokens...");
  try {
    const snap = await getDocs(collection(db, "fcm_tokens"));
    let found = false;
    snap.forEach(doc => {
      const data = doc.data();
      const token = data.token || doc.id;
      if (token.includes('fHfq')) {
        console.log("\n🚀 FOUND IT!");
        console.log("Full Token: " + token);
        console.log("Details: Platform=" + data.platform + ", Version=" + data.appVersion);
        found = true;
      }
    });
    if (!found) console.log("❌ Not found in " + snap.size + " total tokens.");
  } catch (e) {
    console.error(e);
  }
}
search();
