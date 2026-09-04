// src/contexts/ToastContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react";

const ToastContext = createContext(null);

let globalToastHandler = null;

// Global helper callable from anywhere (even outside React components, e.g., in services)
export const toast = {
  error: (message, options = {}) => globalToastHandler?.({ type: "error", message, ...options }),
  info: (message, options = {}) => globalToastHandler?.({ type: "info", message, ...options }),
  success: (message, options = {}) => globalToastHandler?.({ type: "success", message, ...options }),
  warning: (message, options = {}) => globalToastHandler?.({ type: "warning", message, ...options }),
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return toast; // Fallback to global toast
  }
  return context;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ type = "info", message, duration = 4000, action }) => {
    const id = Date.now() + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev.slice(-3), { id, type, message, duration, action }]); // Keep at most 4 active

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  useEffect(() => {
    globalToastHandler = addToast;
    return () => {
      globalToastHandler = null;
    };
  }, [addToast]);

  const value = {
    toast,
    addToast,
    removeToast,
  };

  const getIcon = (type) => {
    switch (type) {
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />;
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
      case "info":
      default:
        return <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />;
    }
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Floating toast portal at top-center */}
      <div
        aria-live="polite"
        className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none w-full max-w-sm px-4"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="pointer-events-auto w-full flex items-start justify-between gap-3 p-3.5 rounded-xl bg-zinc-900/95 text-zinc-100 shadow-xl shadow-black/10 border border-zinc-800 backdrop-blur-md text-sm"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                {getIcon(t.type)}
                <div className="leading-snug font-medium text-zinc-200 break-words">
                  {t.message}
                  {t.action && (
                    <button
                      onClick={() => {
                        t.action.onClick();
                        removeToast(t.id);
                      }}
                      className="block mt-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-2"
                    >
                      {t.action.label}
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-zinc-400 hover:text-zinc-200 p-0.5 rounded transition-colors shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
