// src/components/TimerDisplay.jsx
export function TimerDisplay({ remaining }) {
  if (remaining === null) return null;

  return (
    <div className="mt-4 text-lg font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-4 rounded-xl border-2 border-red-200 dark:border-red-900/50 shadow-sm inline-flex items-center gap-2">
      ⏳ Time Remaining: {Math.floor(remaining / 60)}:
      {String(remaining % 60).padStart(2, "0")}
    </div>
  );
}