const admin = require("firebase-admin");
admin.initializeApp({ projectId: "doable-india-app-9564b-496310" });
const db = admin.firestore();

async function check() {
  const snap = await db.collection("fcm_tokens").get();
  console.log(`Total tokens: ${snap.size}`);
  let found = false;
  snap.forEach(doc => {
    const data = doc.data();
    if (String(data.tutorId) === "11599" || String(data.userEmail).includes("11599") || String(data.targetTutorId) === "11599" || String(doc.id).includes("11599")) {
      console.log("Found matching token:", data);
      found = true;
    }
  });
  if (!found) {
    console.log("Still no token found with anything matching 11599. Let's see all emails:");
    let count = 0;
    snap.forEach(doc => {
       const d = doc.data();
       if (d.userEmail && d.userEmail !== 'anonymous' && count < 20) {
         console.log(d.userEmail, d.tutorId, d.platform);
         count++;
       }
    });
  }
}
check().catch(console.error);