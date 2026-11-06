// src/App.jsx
import { BrowserRouter, HashRouter, Routes, Route, useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { Suspense, lazy, useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import WelcomePreferences from "./components/WelcomePreferences";
import ProtectedRoute from "./routes/ProtectedRoute";
import RedirectIfAuthed from "./routes/RedirectIfAuthed";
import { AnalyticsService } from "./services/analyticsService"; // ✅ Import
import { apiBaseUrl } from "./config/api";

const Signup = lazy(() => import("./pages/Signup"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Assistant = lazy(() => import("./pages/Assistant"));
const Ingredients = lazy(() => import("./pages/Ingredients"));
const Profile = lazy(() => import("./pages/Profile"));
const RecipeView = lazy(() => import("./pages/RecipeView"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Help = lazy(() => import("./pages/Help"));
const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter;

function RecipeRoute() {
  const location = useLocation();
  return <RecipeView key={location.pathname} />;
}

function AssistantRoute() {
  const location = useLocation();
  return <Assistant key={location.search} />;
}

// ✅ Component to track page views
function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    AnalyticsService.trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
}

function App() {
  // ✅ Initialize GA and ping backend on mount
  useEffect(() => {
    AnalyticsService.initialize();
    
    // Ping the backend to wake it up from Render hibernation
    fetch(`${apiBaseUrl}/health`).catch(() => {/* silent — server may be cold starting */});
  }, []);

  return (
    <Router>
      <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <WelcomePreferences />
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
              path="/signup"
              element={
                <RedirectIfAuthed>
                  <Signup />
                </RedirectIfAuthed>
              }
            />

            {/* Public app routes */}
            <Route
              path="/"
              element={<Dashboard />}
            />
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />
            <Route
              path="/assistant"
              element={<AssistantRoute />}
            />
            <Route
              path="/ingredients"
              element={<Ingredients />}
            />
            <Route
              path="/recipe/:recipeId"
              element={<RecipeRoute />}
            />
            <Route
              path="/help"
              element={<Help />}
            />

            {/* Protected routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
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
        </ToastProvider>
      </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
