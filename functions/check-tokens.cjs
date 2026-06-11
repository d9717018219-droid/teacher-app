const admin = require("firebase-admin");
const path = require("path");

const serviceAccountPath = path.join(__dirname, "service-account.json");
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath)
  });
} catch (e) {
  admin.initializeApp();
}

const db = admin.firestore();

async function check() {
  const snap = await db.collection("fcm_tokens").get();
  console.log(`Total tokens: ${snap.size}`);
  let found = false;
  snap.forEach(doc => {
    const data = doc.data();
    if (String(data.tutorId) === "11599" || String(data.userEmail).includes("11599") || String(data.targetTutorId) === "11599") {
      console.log("Found matching token:", data);
      found = true;
    }
  });
  if (!found) {
    console.log("No token found with tutorId 11599. Let's see some samples:");
    let count = 0;
    snap.forEach(doc => {
      if (count++ < 3) console.log(doc.id, doc.data());
    });
  }
}
check().catch(console.error);