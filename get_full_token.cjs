const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, orderBy, limit, getDocs } = require('firebase/firestore');

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

async function fetchToken() {
  console.log("🔍 Fetching latest FCM token from Firestore...");
  try {
    const q = query(collection(db, "fcm_tokens"), orderBy("lastUpdated", "desc"), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log("❌ No tokens found in Firestore.");
      return;
    }

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log("\n🚀 CORRECT FULL FCM TOKEN:");
      console.log(data.token || doc.id);
      console.log("\n(Platform: " + data.platform + " | Version: " + data.appVersion + ")");
    });
  } catch (error) {
    console.error("❌ Error fetching token:", error);
  }
}

fetchToken();
