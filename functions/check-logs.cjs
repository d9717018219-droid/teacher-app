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
  const alertsSnap = await db.collection("alerts").orderBy("timestamp", "desc").limit(3).get();
  console.log("Recent Alerts:");
  alertsSnap.forEach(doc => {
    console.log(doc.id, doc.data());
  });

  console.log("\n--- Checking tokens for 11599 ---");
  const tokensSnap = await db.collection("fcm_tokens").get();
  let found = false;
  tokensSnap.forEach(doc => {
    const data = doc.data();
    if (String(data.tutorId) === "11599" || String(data.userEmail).includes("11599") || String(data.targetTutorId) === "11599" || String(doc.id).includes("11599")) {
      console.log("Found matching token:", data);
      found = true;
    }
  });
  if (!found) {
    console.log("Still no token found with anything matching 11599.");
  }
}
check().catch(console.error);
