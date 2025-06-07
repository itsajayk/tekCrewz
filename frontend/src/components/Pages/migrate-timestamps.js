// migrate-timestamps.js
const admin = require("firebase-admin");
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

async function migrate() {
  const snap = await db.collection("students").get();
  for (const doc of snap.docs) {
    // doc.createTime is a Firestore Timestamp
    await doc.ref.update({
      attendedDate: doc.createTime,
    });
    console.log(`Migrated ${doc.id}`);
  }
}

migrate()
  .then(() => {
    console.log("Migration complete!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error migrating:", err);
    process.exit(1);
  });
