const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy, limit } = require('firebase/firestore');

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

async function fetchTokens() {
  console.log("🔍 Searching for iOS tokens starting with 'fHfq'...");
  try {
    const q = query(collection(db, "fcm_tokens"), orderBy("lastUpdated", "desc"), limit(20));
    const querySnapshot = await getDocs(q);
    
    let found = false;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const token = data.token || doc.id;
      if (token.startsWith('fHfq')) {
        console.log("\n✅ FOUND YOUR iOS TOKEN:");
        console.log(token);
        console.log("\n(Platform: " + data.platform + " | Version: " + data.appVersion + ")");
        found = true;
      }
    });

    if (!found) {
      console.log("\n❌ Could not find token starting with 'fHfq' in the last 20 entries.");
      console.log("Here are the latest 5 tokens instead:");
      querySnapshot.docs.slice(0, 5).forEach(doc => {
         console.log("- " + doc.id.substring(0, 10) + "... (" + doc.data().platform + ")");
      });
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

fetchTokens();
