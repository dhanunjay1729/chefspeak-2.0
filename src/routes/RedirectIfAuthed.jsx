import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RedirectIfAuthed({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null; // or a spinner
  return user ? <Navigate to="/dashboard" replace /> : children;
}