import { useState, useEffect, useMemo, useRef } from 'react';

/**
 * Efficient timer hook that updates UI every 5 seconds instead of every 1 second
 * Reduces CPU wake-ups by 80% while maintaining good UX
 * Pauses when browser tab is hidden to save even more battery
 */
export const useLazyTimer = (startTime, options = {}) => {
  const {
    updateInterval = 5000, // Update every 5s instead of 1s (80% reduction)
    pauseWhenHidden = true,
  } = options;

  const [tick, setTick] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!startTime) {
      // Clear any existing interval if no startTime
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const update = () => setTick(t => t + 1);

    const handleVisibility = () => {
      if (document.hidden && pauseWhenHidden) {
        // Pause updates when tab is hidden (save battery)
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Resume when visible
        if (!intervalRef.current) {
          intervalRef.current = setInterval(update, updateInterval);
          // Trigger immediate update when becoming visible
          update();
        }
      }
    };

    // Start interval
    intervalRef.current = setInterval(update, updateInterval);

    // Listen to visibility changes
    if (pauseWhenHidden) {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (pauseWhenHidden) {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
  }, [startTime, updateInterval, pauseWhenHidden]);

  // Calculate elapsed time on demand (only when tick changes)
  const elapsed = useMemo(() => {
    if (!startTime) return 0;

    // Support both Date objects and ISO strings
    const start = startTime instanceof Date ? startTime : new Date(startTime);

    // Return milliseconds elapsed
    return Date.now() - start.getTime();
  }, [startTime, tick]);

  return elapsed;
};

/**
 * Format milliseconds into HH:MM:SS string
 */
export const formatDuration = (milliseconds) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
