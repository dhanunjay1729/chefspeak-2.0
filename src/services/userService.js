// src/services/userService.js
// this code provides a service wrapper around Firebase Firestore to fetch user-specific data

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
import { AnalyticsService } from "./analyticsService"; // ✅ Import

// Helper to reference a user's doc
const usersRef = (uid) => doc(db, "users", uid);

// Fetch user's preferred language 
export class UserService {
  static async getUserLanguage(user) {
    if (!user) return "English";
    
    try {
      const docRef = doc(db, "users", user.uid);
      // docSnap represents the document snapshot
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
export async function addRecentDish(
  uid,
  { dishName, imageUrl, language, people, notes, recipeSteps, nutritionInfo }
) {
  if (!uid || !dishName) return;
  const colRef = collection(db, "users", uid, "recentDishes");
  await addDoc(colRef, {
    dishName,
    imageUrl: imageUrl || "",
    language: language || "English",
    people: people ?? null,
    notes: notes || "",
    recipeSteps: recipeSteps || [],
    nutritionInfo: nutritionInfo || "",
    createdAt: serverTimestamp(),
  });
}

// Read recent dishes (latest first)
export async function getRecentDishes(uid, { limit = 12 } = {}) {
  if (!uid) return [];
  const colRef = collection(db, "users", uid, "recentDishes");
  const q = query(colRef, orderBy("createdAt", "desc"), qLimit(limit));
  const snap = await getDocs(q);
  // it returns an array of recent dishes with their IDs and data.
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Get a specific dish by ID (check both recent and favorites)
export async function getDishById(uid, dishId) {
  if (!uid || !dishId) return null;
  
  // First try recent dishes
  let ref = doc(db, "users", uid, "recentDishes", dishId);
  let snap = await getDoc(ref);

  // if found in recent dishes, return the dish data
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }
  
  // If not found, try favorites
  ref = doc(db, "users", uid, "favoriteDishes", dishId);
  snap = await getDoc(ref);
  
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
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

// Add favorite dishes functionality
export async function addFavoriteDish(
  uid,
  { dishName, imageUrl, language, people, notes, recipeSteps, nutritionInfo }
) {
  if (!uid || !dishName) return;
  const colRef = collection(db, "users", uid, "favoriteDishes");
  await addDoc(colRef, {
    dishName,
    imageUrl: imageUrl || "",
    language: language || "English",
    people: people ?? null,
    notes: notes || "",
    recipeSteps: recipeSteps || [],
    nutritionInfo: nutritionInfo || null,
    createdAt: serverTimestamp(),
  });
  
  // ✅ Track the event
  AnalyticsService.trackRecipeFavorited(dishName);
}

// Get favorite dishes (latest first)
export async function getFavoriteDishes(uid, { limit = 12 } = {}) {
  if (!uid) return [];
  const colRef = collection(db, "users", uid, "favoriteDishes");
  const q = query(colRef, orderBy("createdAt", "desc"), qLimit(limit));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Remove from favorites
export async function removeFavoriteDish(uid, dishId) {
  if (!uid || !dishId) return;
  
  // Get dish name before deleting
  const ref = doc(db, "users", uid, "favoriteDishes", dishId);
  const snap = await getDoc(ref);
  const dishName = snap.exists() ? snap.data().dishName : "Unknown";
  
  await deleteDoc(ref);
  
  // ✅ Track the event
  AnalyticsService.trackRecipeUnfavorited(dishName);
}

// Check if dish is in favorites (by dish name)
export async function isDishFavorited(uid, dishName) {
  if (!uid || !dishName) return false;
  const colRef = collection(db, "users", uid, "favoriteDishes");
  const q = query(colRef);
  const snap = await getDocs(q);
  return snap.docs.some(doc => doc.data().dishName === dishName);
}