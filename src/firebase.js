import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ------------------------------------------------------------------
// PASTE YOUR FIREBASE CONFIG HERE
// Firebase console -> Project settings (gear icon) -> General ->
// "Your apps" -> Web app -> the firebaseConfig object.
// ------------------------------------------------------------------
const firebaseConfig = {
    apiKey: "AIzaSyBmgI0SI73GKVvEANPdw74rEUFT1Ufo5zQ",
    authDomain: "t58-edge-analytics.firebaseapp.com",
    projectId: "t58-edge-analytics",
    storageBucket: "t58-edge-analytics.firebasestorage.app",
    messagingSenderId: "919226117283",
    appId: "1:919226117283:web:8f1d3414ff911fa7082316",
    measurementId: "G-ZYHY6R9DH5"
  };

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signOutUser = () => signOut(auth);
