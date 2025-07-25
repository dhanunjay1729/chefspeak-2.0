import { useState, useRef, useCallback } from "react";

export function useTimer() {
  const [remaining, setRemaining] = useState(null);
  const timerRef = useRef(null);

  const startTimer = useCallback((seconds) => {
    console.log("⏱️ startTimer called with seconds:", seconds);
    
    if (!seconds || seconds <= 0) {
      console.error("❌ Invalid timer duration:", seconds);
      return;
    }
    
    if (timerRef.current) {
      console.log("🛑 Clearing existing timer:", timerRef.current);
      clearInterval(timerRef.current);
    }
    
    console.log("🎯 Setting remaining time to:", seconds);
    setRemaining(seconds);
    
    console.log("🚀 Starting new timer interval");
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        console.log("⏰ Timer callback - prev value:", prev);
        
        if (prev === null || prev <= 1) {
          console.log("🔔 Timer finished! Clearing interval");
          clearInterval(timerRef.current);
          if (prev === 1) {
            alert("⏱️ Time's up!");
          }
          return null;
        }
        
        const newValue = prev - 1;
        console.log("⏰ Timer decremented to:", newValue);
        return newValue;
      });
    }, 1000);
    
    console.log("✅ Timer interval created with ID:", timerRef.current);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRemaining(null);
  }, []);

  return { remaining, startTimer, stopTimer };
}