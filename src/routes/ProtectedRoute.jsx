import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// A component that protects routes from unauthenticated access
// It redirects unauthenticated users to the home page('/')
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // or a spinner
  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  return children;
}