// src/components/Header.jsx
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChefHat, Menu, Settings, LogOut, User, SlidersHorizontal, X, Home, BookOpen, Heart, HelpCircle, Moon, Sun } from "lucide-react"; 
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { WelcomeTooltip } from "./WelcomeTooltip"; 

export default function Header() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showWelcomeTooltip, setShowWelcomeTooltip] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClickAway = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  // ✅ Check if user is new (first time after signup)
  useEffect(() => {
    if (user) {
      const hasSeenWelcome = localStorage.getItem(`welcome_seen_${user.uid}`);
      if (!hasSeenWelcome) {
        // Show tooltip after a short delay
        setTimeout(() => {
          setShowWelcomeTooltip(true);
        }, 1000);
      }
    }
  }, [user]);

  // ✅ Mark welcome as seen
  const handleCloseTooltip = () => {
    if (user) {
      localStorage.setItem(`welcome_seen_${user.uid}`, 'true');
    }
    setShowWelcomeTooltip(false);
  };

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
    // Close tooltip when menu is opened
    if (showWelcomeTooltip) {
      handleCloseTooltip();
    }
  };

  const handleLogout = async () => {
    try {
      setMenuOpen(false);
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navItems = [
    { to: "/dashboard", icon: Home, label: "Dashboard" },
    { to: "/assistant", icon: ChefHat, label: "Assistant" },
    { to: "/favorites", icon: Heart, label: "Favorites" },
    { to: "/help", icon: HelpCircle, label: "Help" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md shadow-sm transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2 group hover:scale-105 transition-transform"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-600 to-amber-600 shadow-lg group-hover:shadow-xl transition-shadow">
            <ChefHat size={24} className="text-white" />
          </div>
          <span className="text-xl font-extrabold bg-gradient-to-r from-fuchsia-600 to-amber-600 bg-clip-text text-transparent">
            ChefSpeak
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {user ? (
            <>
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 transition-colors"
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <LogOut size={18} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/help"
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 transition-colors"
              >
                <HelpCircle size={17} />
                <span>How it Works</span>
              </Link>
              <Link
                to="/login"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="rounded-lg bg-gradient-to-r from-fuchsia-600 to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-lg transition-all"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <div className="relative md:hidden flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={toggleMenu}
            className="flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm relative"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
            
            {/* ✅ Pulsing indicator when tooltip should show */}
            {showWelcomeTooltip && !menuOpen && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-fuchsia-500 to-amber-500 rounded-full animate-ping" />
            )}
          </button>

          {/* ✅ Welcome Tooltip */}
          {showWelcomeTooltip && !menuOpen && (
            <WelcomeTooltip onClose={handleCloseTooltip} />
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg animate-slideDown">
          <nav className="flex flex-col p-4 space-y-2">
            {user ? (
              <>
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 transition-all"
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all w-full text-left"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/help"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 transition-all"
                >
                  <HelpCircle size={20} />
                  <span className="font-medium">How it Works</span>
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 text-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 text-center rounded-lg bg-gradient-to-r from-fuchsia-600 to-amber-600 text-white font-semibold shadow hover:shadow-lg transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
