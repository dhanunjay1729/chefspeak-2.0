// src/contexts/AuthContext.jsx

// Context to manage authentication state across the application
// that means it helps to share the auth state (like user info) between different components
import { createContext, useContext, useEffect, useState } from "react";
// Import the auth object from our firebase configuration
// which we will use to listen for auth state changes and perform sign-out
import { auth } from "../firebase";
// Import necessary Firebase Auth functions, specifically for listening to auth state changes and signing out
import { onAuthStateChanged, signOut } from "firebase/auth";

// Create the AuthContext
const AuthContext = createContext();

// Custom hook to use the AuthContext, making it easier to access the context in components
export function useAuth() {
  return useContext(AuthContext);
}

// AuthProvider component to wrap around parts of the app that need access to auth state
// It listens for auth state changes and provides user info and logout function
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    user,
    currentUser: user, // Alias for compatibility
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
