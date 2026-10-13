import { useState, useEffect, useCallback } from 'react';
import { secondsUntil } from '../utils/cookingSession';
import { toast } from '../contexts/ToastContext';

export function useTimer() {
  const [deadline, setDeadline] = useState(null);
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (deadline === null) {
      setRemaining(null);
      return;
    }
    let notified = false;
    const tick = () => {
      if (notified) return;
      const seconds = secondsUntil(deadline);
      setRemaining(seconds);
      if (seconds === 0) {
        notified = true;
        setDeadline(null);
        toast.info("Timer finished. Check your dish.");
      }
    };
    tick();
    const interval = setInterval(tick, 250);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [deadline]);

  const stopTimer = useCallback(() => {
    setDeadline(null);
    setRemaining(null);
  }, []);
  const startTimer = useCallback((seconds) => {
    if (!Number.isFinite(Number(seconds)) || Number(seconds) <= 0) return;
    setDeadline(Date.now() + Number(seconds) * 1000);
    setRemaining(Number(seconds));
  }, []);
  const restoreTimer = useCallback((savedDeadline) => {
    setDeadline(Number.isFinite(savedDeadline) ? savedDeadline : null);
    setRemaining(secondsUntil(savedDeadline));
  }, []);
  const addMinute = useCallback(() => setDeadline(value => value === null ? null : value + 60000), []);
  return { remaining, deadline, startTimer, stopTimer, restoreTimer, addMinute };
}
