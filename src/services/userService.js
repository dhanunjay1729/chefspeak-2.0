// src/services/userService.js

//service wrapper around Firebase Firestore to fetch user-specific data 
import {
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit as qLimit,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";

// Helper to reference a user's doc
const usersRef = (uid) => doc(db, "users", uid);

export class UserService {
  static async getUserLanguage(user) {
    if (!user) return "English";
    
    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.language || "English";
      }
      return "English";
    } catch (err) {
      console.error("Failed to fetch language:", err);
      return "English";
    }
  }
}

// Write one recent dish entry under users/{uid}/recentDishes
export async function addRecentDish(uid, { dishName, imageUrl, language, people, notes }) {
  if (!uid || !dishName) return;
  const colRef = collection(db, "users", uid, "recentDishes");
  await addDoc(colRef, {
    dishName,
    imageUrl: imageUrl || "",
    language: language || "English",
    people: people ?? null,
    notes: notes || "",
    createdAt: serverTimestamp(),
  });
}

// Read recent dishes (latest first)
export async function getRecentDishes(uid, { limit = 12 } = {}) {
  if (!uid) return [];
  const colRef = collection(db, "users", uid, "recentDishes");
  const q = query(colRef, orderBy("createdAt", "desc"), qLimit(limit));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Get full user profile document at users/{uid}
export async function getUserProfile(uid) {
  if (!uid) return null;
  const snap = await getDoc(usersRef(uid));
  return snap.exists() ? snap.data() : null;
}

// Create or update user profile at users/{uid}
export async function updateUserProfile(uid, data) {
  if (!uid || !data || typeof data !== "object") return;
  const ref = usersRef(uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, data);
  } else {
    await setDoc(ref, { ...data, createdAt: serverTimestamp() });
  }
}

export async function deleteRecentDish(uid, dishId) {
  if (!uid || !dishId) return;
  const ref = doc(db, "users", uid, "recentDishes", dishId);
  await deleteDoc(ref);
}