// src/services/userService.js
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

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