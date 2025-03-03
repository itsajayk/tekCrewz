// getUserEmailFromUsername.js
import { getFirestore, doc, getDoc } from "firebase/firestore";

const db = getFirestore();

export const getUserEmailFromUsername = async (username) => {
  const docRef = doc(db, "users", username);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data().email;
  }
  return null;
};
