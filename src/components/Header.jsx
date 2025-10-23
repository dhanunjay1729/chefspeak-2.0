// src/components/Header.jsx
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChefHat, Menu, Settings, LogOut, User, SlidersHorizontal, X, Home, BookOpen, Heart } from "lucide-react"; // ✅ Add Home import
import { useAuth } from "../contexts/AuthContext";
import { WelcomeTooltip } from "./WelcomeTooltip"; // ✅ Import

export default function Header() {
  const navigate = useNavigate();
  const { logout, user } = useAuth(); // Get logout function and user from AuthContext
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showWelcomeTooltip, setShowWelcomeTooltip] = useState(false); // ✅ New state
  const menuRef = useRef(null);

  useEffect(() => {
    const onClickAway = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
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
      setOpen(false);
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navItems = [
    { to: "/dashboard", icon: Home, label: "Dashboard" },
    { to: "/assistant", icon: ChefHat, label: "Assistant" },
    { to: "/favorites", icon: Heart, label: "Favorites" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md shadow-sm">
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
          {user ? (
            <>
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-fuchsia-600 transition-colors"
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              ))}
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-zinc-700 hover:text-fuchsia-600 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/"
                className="rounded-lg bg-gradient-to-r from-fuchsia-600 to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-lg transition-all"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <div className="relative md:hidden">
          <button
            onClick={toggleMenu}
            className="flex items-center justify-center rounded-lg border border-zinc-200 bg-white p-2 text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm relative"
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
        <div className="md:hidden border-t border-zinc-200 bg-white shadow-lg animate-slideDown">
          <nav className="flex flex-col p-4 space-y-2">
            {user ? (
              <>
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-700 hover:bg-zinc-50 hover:text-fuchsia-600 transition-all"
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 text-center rounded-lg border border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/"
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
