// src/App.jsx
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import RedirectIfAuthed from "./routes/RedirectIfAuthed";
import { AnalyticsService } from "./services/analyticsService"; // ✅ Import

const Signup = lazy(() => import("./pages/Signup"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Assistant = lazy(() => import("./pages/Assistant"));
const Ingredients = lazy(() => import("./pages/Ingredients"));
const Profile = lazy(() => import("./pages/Profile"));
const RecipeView = lazy(() => import("./pages/RecipeView"));
const Favorites = lazy(() => import("./pages/Favorites"));

// ✅ Component to track page views
function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    AnalyticsService.trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
}

function App() {
  // ✅ Initialize GA on mount
  useEffect(() => {
    AnalyticsService.initialize();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <AnalyticsTracker /> {/* ✅ Track page views */}
        <Suspense fallback={<div>Loading…</div>}>
          <Routes>
            {/* Public routes (redirect if already logged in) */}
            <Route
              path="/login"
              element={
                <RedirectIfAuthed>
                  <Login />
                </RedirectIfAuthed>
              }
            />
            <Route
              path="/"
              element={
                <RedirectIfAuthed>
                  <Signup />
                </RedirectIfAuthed>
              }
            />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistant"
              element={
                <ProtectedRoute>
                  <Assistant />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ingredients"
              element={
                <ProtectedRoute>
                  <Ingredients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recipe/:recipeId"
              element={
                <ProtectedRoute>
                  <RecipeView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/favorites"
              element={
                <ProtectedRoute>
                  <Favorites />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;
