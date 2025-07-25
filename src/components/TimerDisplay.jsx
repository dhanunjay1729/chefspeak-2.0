// src/components/TimerDisplay.jsx
export function TimerDisplay({ remaining }) {
  if (remaining === null) return null;

  return (
    <div className="mt-6 text-lg font-semibold text-red-600 bg-red-50 p-4 rounded-lg border-2 border-red-200">
      ⏳ Time Remaining: {Math.floor(remaining / 60)}:
      {String(remaining % 60).padStart(2, "0")}
    </div>
  );
}