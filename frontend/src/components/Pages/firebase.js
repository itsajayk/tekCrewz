// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDsrgK1gx_Oei8yGRTiCFLdMv9kLDOUDXE",
  authDomain: "tekcrewz-auth.firebaseapp.com",
  projectId: "tekcrewz-auth",
  storageBucket: "tekcrewz-auth.firebasestorage.app",
  messagingSenderId: "548082622718",
  appId: "1:548082622718:web:61a88d7abc62caccbb85af",
  measurementId: "G-077FTRCZ6Q",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
