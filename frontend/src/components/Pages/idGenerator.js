// idGeneratorFirestore.js
import { getFirestore, runTransaction, doc } from "firebase/firestore";

export const generateUniqueIdFromFirestore = async (accountType) => {
  const db = getFirestore();
  const counterDocRef = doc(db, "counters", "userCounters");

  try {
    const newCounter = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterDocRef);
      if (!counterDoc.exists()) {
        throw new Error("Counter document does not exist!");
      }
      let currentCount;
      if (accountType === "Admin") {
        currentCount = counterDoc.data().adminCounter || 1;
        transaction.update(counterDocRef, { adminCounter: currentCount + 1 });
      } else if (accountType === "Referrer") {
        currentCount = counterDoc.data().referrerCounter || 1;
        transaction.update(counterDocRef, { referrerCounter: currentCount + 1 });
      }
      return currentCount;
    });

    return accountType === "Admin"
      ? `EMPAD${String(newCounter).padStart(3, "0")}`
      : `REFSD${String(newCounter).padStart(3, "0")}`;
  } catch (error) {
    console.error("Transaction failed: ", error);
    throw error;
  }
};
