// src/components/Header.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChefHat, Menu, Settings, LogOut, User, SlidersHorizontal } from "lucide-react";

export default function Header() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClickAway = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-zinc-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="h-14 flex items-center justify-between">
          {/* Brand */}
          <button
            onClick={() => navigate("/dashboard")}
            className="group flex items-center gap-2 select-none"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 text-white shadow-sm transition-transform group-hover:scale-105">
              <ChefHat size={20} />
            </span>
            <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900">
              ChefSpeak
            </span>
          </button>

          {/* Actions */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Open menu"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 h-10 w-10 hover:bg-zinc-50 active:scale-[0.98] transition shadow-sm"
            >
              <Menu size={20} className="text-zinc-700" />
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-zinc-200 bg-white shadow-xl ring-1 ring-black/5 overflow-hidden">
                <div className="px-3 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Quick actions
                </div>
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 text-zinc-800 text-sm"
                  onClick={() => {
                    setOpen(false);
                    navigate("/profile");
                  }}
                >
                  <User size={18} />
                  Profile
                </button>

                <div className="my-1 h-px bg-zinc-100" />

                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-rose-50 text-rose-600 text-sm"
                  onClick={() => {
                    setOpen(false);
                    navigate("/logout");
                  }}
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* subtle accent bar */}
      <div className="h-0.5 w-full bg-gradient-to-r from-amber-400 via-rose-500 to-fuchsia-500" />
    </header>
  );
}
