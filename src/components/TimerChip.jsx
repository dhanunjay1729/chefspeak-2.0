import React from "react";

function formatTime(totalSeconds = 0) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function TimerChip({ remaining, onStop, onAddMinute }) {
  if (!remaining || remaining <= 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 -translate-x-1/2 bottom-6 z-30
                 w-[min(92vw,22rem)] rounded-2xl border border-zinc-200 bg-white text-zinc-800 shadow-lg
                 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100
                 px-4 py-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span aria-hidden>⏱</span>
          <span className="text-sm font-medium">Timer</span>
        </div>
        <span className="tabular-nums text-lg font-semibold">{formatTime(remaining)}</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onStop}
          className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium
                     bg-red-50 text-red-700 hover:bg-red-100 active:bg-red-200
                     dark:bg-red-900/30 dark:text-red-200 dark:hover:bg-red-900/50"
          aria-label="Stop timer"
          title="Stop timer"
        >
          Stop
        </button>
        <button
          type="button"
          onClick={onAddMinute}
          className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium
                     bg-amber-50 text-amber-800 hover:bg-amber-100 active:bg-amber-200
                     dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/50"
          aria-label="Add one minute"
          title="Add one minute"
        >
          +1 min
        </button>
      </div>
    </div>
  );
}