// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyDZTpPbTUEsQQgvtVG2-WeuJ8_l_y_c4cY",
    authDomain: "ai-simulator-8cb2e.firebaseapp.com",
    projectId: "ai-simulator-8cb2e",
    storageBucket: "ai-simulator-8cb2e.firebasestorage.app",
    messagingSenderId: "61119687433",
    appId: "1:61119687433:web:a1579ca9d76547dd2981d8",
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

export { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, firebaseSignOut, db };
