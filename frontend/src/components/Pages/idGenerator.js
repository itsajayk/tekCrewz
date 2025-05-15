// src/Helper/idGeneratorFirestore.js
import { getFirestore, runTransaction, doc } from "firebase/firestore";

export async function generateUniqueIdFromFirestore(accountType) {
  const db = getFirestore();
  const counterDocRef = doc(db, "counters", "userCounters");

  // map each accountType → { prefix, counterField }
  const map = {
    Admin:     { prefix: "EMPAD", counterField: "adminCounter" },
    Referrer:  { prefix: "REFSD", counterField: "referrerCounter" },
    DevTutor:  { prefix: "EMPDT", counterField: "devTutorCounter" },
    Tutor:     { prefix: "EMPTR", counterField: "tutorCounter" },
    Developer: { prefix: "EMPDV", counterField: "developerCounter" },
    Student:   { prefix: "STUD", counterField: "studentCounter" }  // ← NEW!
  };

  const cfg = map[accountType];
  if (!cfg) throw new Error(`Invalid accountType: ${accountType}`);

  const newCount = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterDocRef);
    if (!snap.exists()) {
      throw new Error("Counter document does not exist!");
    }
    const current = snap.data()[cfg.counterField] || 0;
    tx.update(counterDocRef, { [cfg.counterField]: current + 1 });
    return current + 1;
  });

  const num = String(newCount).padStart(3, "0");
  return cfg.prefix + num;     // e.g. "STUD005"
}
