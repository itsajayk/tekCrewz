// src/components/Pages/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";  // ← add this

const firebaseConfig = {
  apiKey: "AIzaSyDsrgK1gx_Oei8yGRTiCFLdMv9kLDOUDXE",
  authDomain: "tekcrewz-auth.firebaseapp.com",
  projectId: "tekcrewz-auth",
  storageBucket: "tekcrewz-auth.appspot.com",    // ← make sure this matches your Console URL
  messagingSenderId: "548082622718",
  appId: "1:548082622718:web:61a88d7abc62caccbb85af",
  measurementId: "G-077FTRCZ6Q",
};

const app = initializeApp(firebaseConfig);

export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);           // ← export storage
