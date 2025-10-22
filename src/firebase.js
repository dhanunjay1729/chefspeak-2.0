// src/firebase.js


import { initializeApp } from "firebase/app";
// Import Auth modules. in simple words getAuth is used to initialize the authentication service, 
// setPersistence is used to define how the authentication state is persisted,
// browserLocalPersistence is a type of persistence that keeps the user signed in even after the browser is closed,
// and GoogleAuthProvider is used to enable Google sign-in functionality.
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider } from "firebase/auth";
// Import Firestore the database
import { getFirestore } from "firebase/firestore";
// Import Storage for file storage
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and set persistence to local (remains signed in after closing the browser)
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error("Error setting Firebase auth persistence:", err.message);
});

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore and Storage
const db = getFirestore(app);
const storage = getStorage(app);

// Export the initialized services for use in other parts of the application
export { auth, db, storage };
export default app;
