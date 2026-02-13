// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBzndPkCZsFFrFqWU8zP-x-TUaohxX-5ps",
  authDomain: "lodomonitoring.firebaseapp.com",
  projectId: "lodomonitoring",
  storageBucket: "lodomonitoring.firebasestorage.app",
  messagingSenderId: "713350442868",
  appId: "1:713350442868:web:1f659f73bc3c5060064621",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);