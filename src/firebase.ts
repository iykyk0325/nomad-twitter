import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAUlUiQ3B0h7_GridE8XKUn0W070Eiv0BU",
  authDomain: "nomad-twitter-38b1c.firebaseapp.com",
  projectId: "nomad-twitter-38b1c",
  storageBucket: "nomad-twitter-38b1c.firebasestorage.app",
  messagingSenderId: "1010463441536",
  appId: "1:1010463441536:web:22f65ca0dd67c988429c65",
  measurementId: "G-EFTGKYKEKR",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);
