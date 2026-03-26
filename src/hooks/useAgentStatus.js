import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, updateDoc, onSnapshot, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Agent Status Types:
 * - "Login" - Agent has started their day and is ready to work
 * - "On Call" - Agent is currently on a call
 * - "Break" - Agent is on a break (max 30 minutes)
 * - "Logout" - Agent has ended their day or was auto-logged out
 */
export const AGENT_STATUS = {
  LOGIN: "Login",
  ON_CALL: "On Call",
  BREAK: "Break",
  LOGOUT: "Logout",
  // Legacy status mappings for backwards compatibility
  AVAILABLE: "Login",
  UNAVAILABLE: "Logout",
  IDLE: "Login",
  BUSY: "On Call",
};

// Timing constants
const BREAK_MAX_DURATION = 60 * 60 * 1000;    // 1 hour max break
const AUTO_LOGOUT_HOUR = 18;                   // 6 PM auto logout
const CHECK_INTERVAL = 60 * 1000;             // Check every 1 minute
const BREAK_GUARD_PERIOD = 5 * 1000;          // 5 second guard after starting break
const INIT_RETRY_DELAY = 2000;                // 2 second retry delay
const MAX_INIT_RETRIES = 3;                   // Max retry attempts for initial fetch

// localStorage keys for session fallback
const LS_PREFIX = 'mswasth_agent_';
const LS_STATUS_KEY = (id) => `${LS_PREFIX}${id}_status`;
const LS_LOGIN_TIME_KEY = (id) => `${LS_PREFIX}${id}_loginTime`;
const LS_LOGIN_DATE_KEY = (id) => `${LS_PREFIX}${id}_loginDate`;
const LS_BREAK_START_KEY = (id) => `${LS_PREFIX}${id}_breakStart`;

/**
 * Helper to check if a timestamp is from today
 */
const isToday = (timestamp) => {
  if (!timestamp) return false;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

/**
 * Save session state to localStorage as a fallback for network failures.
 * Only used when Firestore is unreachable on page refresh.
 */
const saveSessionToLocal = (agentId, data) => {
  try {
    if (data.status) localStorage.setItem(LS_STATUS_KEY(agentId), data.status);
    if (data.loginTime) localStorage.setItem(LS_LOGIN_TIME_KEY(agentId), data.loginTime.toISOString());
    localStorage.setItem(LS_LOGIN_DATE_KEY(agentId), new Date().toDateString());
    if (data.breakStartTime) {
      localStorage.setItem(LS_BREAK_START_KEY(agentId), data.breakStartTime.toISOString());
    } else {
      localStorage.removeItem(LS_BREAK_START_KEY(agentId));
    }
  } catch (e) {
    // localStorage not available - ignore
  }
};

/**
 * Load session state from localStorage fallback.
 * Returns null if no valid session found or session is from a different day.
 */
const loadSessionFromLocal = (agentId) => {
  try {
    const savedDate = localStorage.getItem(LS_LOGIN_DATE_KEY(agentId));
    const today = new Date().toDateString();

    if (savedDate !== today) {
      clearLocalSession(agentId);
      return null;
    }

    const status = localStorage.getItem(LS_STATUS_KEY(agentId));
    const loginTimeStr = localStorage.getItem(LS_LOGIN_TIME_KEY(agentId));
    const breakStartStr = localStorage.getItem(LS_BREAK_START_KEY(agentId));

    if (!status || !loginTimeStr) return null;

    return {
      status,
      loginTime: new Date(loginTimeStr),
      breakStartTime: breakStartStr ? new Date(breakStartStr) : null,
    };
  } catch (e) {
    return null;
  }
};

/**
 * Clear localStorage session data
 */
const clearLocalSession = (agentId) => {
  try {
    localStorage.removeItem(LS_STATUS_KEY(agentId));
    localStorage.removeItem(LS_LOGIN_TIME_KEY(agentId));
    localStorage.removeItem(LS_LOGIN_DATE_KEY(agentId));
    localStorage.removeItem(LS_BREAK_START_KEY(agentId));
  } catch (e) {
    // ignore
  }
};

/**
 * Custom hook for managing agent status with real-time updates
 * Enhanced with daily login tracking, inactivity detection, break management, and 6 PM auto-logout
 *
 * @param {string} agentId - The agent's Firebase document ID
 * @param {string} collectionName - The Firestore collection name
 * @param {boolean} isLoggedIn - Whether the agent is currently logged into the app
 * @returns {Object} - Status management utilities
 */
export const useAgentStatus = (agentId, collectionName, isLoggedIn = true) => {
  // Core status state
  const [status, setStatus] = useState(AGENT_STATUS.LOGOUT);
  const [lastActivity, setLastActivity] = useState(null);
  const [todayLoginTime, setTodayLoginTime] = useState(null);
  const [breakStartTime, setBreakStartTime] = useState(null);

  // Derived state
  const [isLoggedInToday, setIsLoggedInToday] = useState(false);
  const [workingDuration, setWorkingDuration] = useState(0);
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(0);
  const [isStatusLoading, setIsStatusLoading] = useState(true); // Track if we're still loading initial state

  // Refs
  const checkIntervalRef = useRef(null);
  const workingTimerRef = useRef(null);
  const breakTimerRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const isInitializedRef = useRef(false);
  const breakGuardRef = useRef(false); // Guard to prevent immediate break cancellation from stale data
  const breakStartTimeRef = useRef(null); // Stable ref for break start during guard period

  // Update status in Firestore
  const updateStatusInFirestore = useCallback(async (newStatus, additionalFields = {}) => {
    if (!agentId || !collectionName) return;

    try {
      const agentDocRef = doc(db, collectionName, agentId);
      await updateDoc(agentDocRef, {
        status: newStatus,
        lastStatusUpdate: serverTimestamp(),
        lastActivityTime: serverTimestamp(),
        ...additionalFields,
      });
      setStatus(newStatus);
    } catch (error) {
      console.error('[useAgentStatus] Error updating status:', error);
    }
  }, [agentId, collectionName]);

  // Record activity
  const recordActivity = useCallback(async () => {
    if (!agentId || !collectionName) return;

    const now = new Date();
    setLastActivity(now);

    try {
      const agentDocRef = doc(db, collectionName, agentId);
      await updateDoc(agentDocRef, {
        lastActivityTime: serverTimestamp(),
      });
    } catch (error) {
      console.error('[useAgentStatus] Error recording activity:', error);
    }
  }, [agentId, collectionName]);

  // Start the day - agent manually logs in
  const startDay = useCallback(async () => {
    if (!agentId || !collectionName) return;

    console.log('[useAgentStatus] Starting day for agent');

    try {
      await updateStatusInFirestore(AGENT_STATUS.LOGIN, {
        todayLoginTime: serverTimestamp(),
        logoutReason: null,
        breakStartTime: null,
      });

      const now = new Date();
      setIsLoggedInToday(true);
      setTodayLoginTime(now);
      setLastActivity(now);

      // Save to localStorage as fallback for network issues on refresh
      saveSessionToLocal(agentId, {
        status: AGENT_STATUS.LOGIN,
        loginTime: now,
        breakStartTime: null,
      });
    } catch (error) {
      console.error('[useAgentStatus] Error starting day:', error);
    }
  }, [agentId, collectionName, updateStatusInFirestore]);

  // End the day - agent logs out (manual or auto)
  const endDay = useCallback(async (reason = 'manual') => {
    if (!agentId || !collectionName) return;

    console.log(`[useAgentStatus] Ending day for agent. Reason: ${reason}`);

    try {
      await updateStatusInFirestore(AGENT_STATUS.LOGOUT, {
        logoutReason: reason,
        breakStartTime: null,
      });

      setBreakTimeRemaining(0);
      setBreakStartTime(null);
      setIsLoggedInToday(false);
      breakGuardRef.current = false;
      breakStartTimeRef.current = null;

      // Clear local session so refresh won't restore it
      clearLocalSession(agentId);

      // Clear timers
      if (breakTimerRef.current) {
        clearInterval(breakTimerRef.current);
        breakTimerRef.current = null;
      }
    } catch (error) {
      console.error('[useAgentStatus] Error ending day:', error);
    }
  }, [agentId, collectionName, updateStatusInFirestore]);

  // Start break
  const startBreak = useCallback(async () => {
    // Allow break from Login status or legacy statuses (Idle, Available)
    const canTakeBreak = status === AGENT_STATUS.LOGIN || status === "Idle" || status === "Available";
    if (!agentId || !collectionName || !canTakeBreak) {
      console.log('[useAgentStatus] Cannot start break - status:', status);
      return;
    }

    console.log('[useAgentStatus] Starting break');

    // Activate break guard to prevent stale listener data from cancelling the break
    breakGuardRef.current = true;
    const breakStart = new Date();
    breakStartTimeRef.current = breakStart;

    try {
      await updateStatusInFirestore(AGENT_STATUS.BREAK, {
        breakStartTime: serverTimestamp(),
      });

      setBreakStartTime(breakStart);
      setBreakTimeRemaining(BREAK_MAX_DURATION / 1000); // Convert to seconds

      // Save to localStorage
      saveSessionToLocal(agentId, {
        status: AGENT_STATUS.BREAK,
        loginTime: todayLoginTime || breakStart,
        breakStartTime: breakStart,
      });

      // Release guard after the guard period
      setTimeout(() => {
        breakGuardRef.current = false;
      }, BREAK_GUARD_PERIOD);
    } catch (error) {
      console.error('[useAgentStatus] Error starting break:', error);
      breakGuardRef.current = false;
      breakStartTimeRef.current = null;
    }
  }, [agentId, collectionName, status, todayLoginTime, updateStatusInFirestore]);

  // End break
  const endBreak = useCallback(async () => {
    if (!agentId || !collectionName) return;

    console.log('[useAgentStatus] Ending break');
    breakGuardRef.current = false;
    breakStartTimeRef.current = null;

    try {
      await updateStatusInFirestore(AGENT_STATUS.LOGIN, {
        breakStartTime: null,
      });

      setBreakStartTime(null);
      setBreakTimeRemaining(0);
      await recordActivity();

      // Update localStorage
      saveSessionToLocal(agentId, {
        status: AGENT_STATUS.LOGIN,
        loginTime: todayLoginTime || new Date(),
        breakStartTime: null,
      });

      // Clear break timer
      if (breakTimerRef.current) {
        clearInterval(breakTimerRef.current);
        breakTimerRef.current = null;
      }
    } catch (error) {
      console.error('[useAgentStatus] Error ending break:', error);
    }
  }, [agentId, collectionName, todayLoginTime, updateStatusInFirestore, recordActivity]);

  // Set status to On Call
  const setOnCall = useCallback(async () => {
    // Can't go on call if logged out
    if (status === AGENT_STATUS.LOGOUT || status === "Logout" || status === "Logged Out") return;

    await updateStatusInFirestore(AGENT_STATUS.ON_CALL);

    // Keep localStorage in sync
    if (agentId) {
      saveSessionToLocal(agentId, {
        status: AGENT_STATUS.ON_CALL,
        loginTime: todayLoginTime || new Date(),
        breakStartTime: null,
      });
    }
  }, [agentId, status, todayLoginTime, updateStatusInFirestore]);

  // Set status back to Login after call ends
  const setAvailableAfterCall = useCallback(async () => {
    // Can't change status if logged out
    if (status === AGENT_STATUS.LOGOUT || status === "Logout" || status === "Logged Out") return;

    await updateStatusInFirestore(AGENT_STATUS.LOGIN);
    await recordActivity();

    // Keep localStorage in sync
    if (agentId) {
      saveSessionToLocal(agentId, {
        status: AGENT_STATUS.LOGIN,
        loginTime: todayLoginTime || new Date(),
        breakStartTime: null,
      });
    }
  }, [agentId, status, todayLoginTime, updateStatusInFirestore, recordActivity]);

  // Check for 6 PM auto-logout
  const check6PMLogout = useCallback(() => {
    if (!isLoggedInToday || status === AGENT_STATUS.LOGOUT) return;

    const now = new Date();
    if (now.getHours() >= AUTO_LOGOUT_HOUR) {
      console.log('[useAgentStatus] Auto-logout at 6 PM');
      endDay('auto_6pm');
    }
  }, [isLoggedInToday, status, endDay]);

  // Setup periodic check for 6 PM auto-logout only
  useEffect(() => {
    if (!isLoggedIn || !agentId || !collectionName) return;

    // Run check every minute for 6 PM logout
    checkIntervalRef.current = setInterval(() => {
      check6PMLogout();
    }, CHECK_INTERVAL);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [isLoggedIn, agentId, collectionName, check6PMLogout]);

  // Track working duration
  useEffect(() => {
    if (!isLoggedInToday || !todayLoginTime || status === AGENT_STATUS.LOGOUT) {
      if (workingTimerRef.current) {
        clearInterval(workingTimerRef.current);
        workingTimerRef.current = null;
      }
      return;
    }

    // Update working duration every second
    const updateWorkingDuration = () => {
      const now = new Date();
      const loginTime = todayLoginTime instanceof Date ? todayLoginTime : new Date(todayLoginTime);
      const duration = Math.floor((now - loginTime) / 1000);
      setWorkingDuration(duration);
    };

    updateWorkingDuration();
    workingTimerRef.current = setInterval(updateWorkingDuration, 1000);

    return () => {
      if (workingTimerRef.current) {
        clearInterval(workingTimerRef.current);
        workingTimerRef.current = null;
      }
    };
  }, [isLoggedInToday, todayLoginTime, status]);

  // Track break countdown
  useEffect(() => {
    if (status !== AGENT_STATUS.BREAK || !breakStartTime) {
      if (breakTimerRef.current) {
        clearInterval(breakTimerRef.current);
        breakTimerRef.current = null;
      }
      return;
    }

    // Update break countdown every second
    const updateBreakCountdown = () => {
      const now = new Date();
      // Use the ref value during guard period to prevent stale timestamps from cancelling break
      const startTime = breakGuardRef.current && breakStartTimeRef.current
        ? breakStartTimeRef.current
        : (breakStartTime instanceof Date ? breakStartTime : new Date(breakStartTime));
      const elapsed = now - startTime;
      const remaining = Math.max(0, Math.floor((BREAK_MAX_DURATION - elapsed) / 1000));

      setBreakTimeRemaining(remaining);

      // Auto-end break when time is up (but not during guard period)
      if (remaining <= 0 && !breakGuardRef.current) {
        console.log('[useAgentStatus] Break time exceeded, auto-ending break');
        endBreak();
      }
    };

    updateBreakCountdown();
    breakTimerRef.current = setInterval(updateBreakCountdown, 1000);

    return () => {
      if (breakTimerRef.current) {
        clearInterval(breakTimerRef.current);
        breakTimerRef.current = null;
      }
    };
  }, [status, breakStartTime, endBreak]);

  // Setup real-time listener for status changes and initial state check
  useEffect(() => {
    if (!agentId || !collectionName) return;

    const agentDocRef = doc(db, collectionName, agentId);

    // Initial fetch to check today's login status (with retry on failure)
    const initializeState = async (retryCount = 0) => {
      setIsStatusLoading(true); // Start loading
      try {
        const docSnap = await getDoc(agentDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();

          // Check if agent already logged in today
          if (data.todayLoginTime && isToday(data.todayLoginTime)) {
            const loginTime = data.todayLoginTime.toDate ? data.todayLoginTime.toDate() : new Date(data.todayLoginTime);
            setTodayLoginTime(loginTime);

            // Only mark as logged in if status is not Logout
            if (data.status !== AGENT_STATUS.LOGOUT) {
              setIsLoggedInToday(true);
              setStatus(data.status || AGENT_STATUS.LOGIN);

              // Save to localStorage for future fallback
              saveSessionToLocal(agentId, {
                status: data.status || AGENT_STATUS.LOGIN,
                loginTime,
                breakStartTime: data.breakStartTime && data.status === AGENT_STATUS.BREAK
                  ? (data.breakStartTime.toDate ? data.breakStartTime.toDate() : new Date(data.breakStartTime))
                  : null,
              });
            } else {
              setIsLoggedInToday(false);
              setStatus(AGENT_STATUS.LOGOUT);
              clearLocalSession(agentId);
            }
          } else {
            // Not logged in today
            setIsLoggedInToday(false);
            setStatus(AGENT_STATUS.LOGOUT);
            clearLocalSession(agentId);
          }

          // Set last activity
          if (data.lastActivityTime) {
            const activityTime = data.lastActivityTime.toDate ?
              data.lastActivityTime.toDate() :
              new Date(data.lastActivityTime);
            setLastActivity(activityTime);
          }

          // Set break start time if on break
          if (data.breakStartTime && data.status === AGENT_STATUS.BREAK) {
            const breakStart = data.breakStartTime.toDate ?
              data.breakStartTime.toDate() :
              new Date(data.breakStartTime);
            setBreakStartTime(breakStart);
            breakStartTimeRef.current = breakStart;
          }
        } else {
          // Document doesn't exist - agent hasn't logged in today
          setIsLoggedInToday(false);
          setStatus(AGENT_STATUS.LOGOUT);
          clearLocalSession(agentId);
        }
        isInitializedRef.current = true;
      } catch (error) {
        console.error('[useAgentStatus] Error initializing state:', error);

        // On network error, use localStorage fallback to preserve session
        const cachedSession = loadSessionFromLocal(agentId);
        if (cachedSession && cachedSession.status !== AGENT_STATUS.LOGOUT) {
          console.log('[useAgentStatus] Using localStorage fallback for session state');
          setStatus(cachedSession.status);
          setIsLoggedInToday(true);
          setTodayLoginTime(cachedSession.loginTime);
          if (cachedSession.breakStartTime && cachedSession.status === AGENT_STATUS.BREAK) {
            setBreakStartTime(cachedSession.breakStartTime);
            breakStartTimeRef.current = cachedSession.breakStartTime;
          }
          isInitializedRef.current = true;
        } else if (retryCount < MAX_INIT_RETRIES) {
          // Retry the fetch after a delay
          console.log(`[useAgentStatus] Retrying initialization (attempt ${retryCount + 1}/${MAX_INIT_RETRIES})...`);
          setTimeout(() => initializeState(retryCount + 1), INIT_RETRY_DELAY);
          return; // Don't set loading to false yet - retry in progress
        } else {
          // All retries exhausted, no localStorage fallback
          console.error('[useAgentStatus] All retries exhausted, defaulting to not logged in');
          setIsLoggedInToday(false);
          isInitializedRef.current = true;
        }
      } finally {
        if (isInitializedRef.current) {
          setIsStatusLoading(false); // Done loading - NOW show modal if needed
        }
      }
    };

    initializeState();

    // Real-time listener
    unsubscribeRef.current = onSnapshot(agentDocRef, (docSnap) => {
      if (docSnap.exists() && isInitializedRef.current) {
        const data = docSnap.data();

        // During break guard period, ignore status changes that would cancel the break
        // This prevents stale Firestore listener data from immediately ending a break
        if (breakGuardRef.current && data.status !== AGENT_STATUS.BREAK) {
          console.log('[useAgentStatus] Ignoring stale status during break guard period');
          return;
        }

        // Update status
        if (data.status) {
          setStatus(data.status);
        }

        // Update last activity
        if (data.lastActivityTime) {
          const activityTime = data.lastActivityTime.toDate ?
            data.lastActivityTime.toDate() :
            new Date(data.lastActivityTime);
          setLastActivity(activityTime);
        }

        // Update today login time
        if (data.todayLoginTime && isToday(data.todayLoginTime)) {
          const loginTime = data.todayLoginTime.toDate ?
            data.todayLoginTime.toDate() :
            new Date(data.todayLoginTime);
          setTodayLoginTime(loginTime);

          if (data.status !== AGENT_STATUS.LOGOUT) {
            setIsLoggedInToday(true);

            // Keep localStorage in sync with Firestore
            saveSessionToLocal(agentId, {
              status: data.status,
              loginTime,
              breakStartTime: data.breakStartTime && data.status === AGENT_STATUS.BREAK
                ? (data.breakStartTime.toDate ? data.breakStartTime.toDate() : new Date(data.breakStartTime))
                : null,
            });
          }
        }

        // Update break start time
        if (data.breakStartTime && data.status === AGENT_STATUS.BREAK) {
          const breakStart = data.breakStartTime.toDate ?
            data.breakStartTime.toDate() :
            new Date(data.breakStartTime);

          // Validate break start time is within max duration to prevent stale data issues
          const breakAge = Date.now() - breakStart.getTime();
          if (breakAge < BREAK_MAX_DURATION) {
            setBreakStartTime(breakStart);
            breakStartTimeRef.current = breakStart;
          } else {
            // Break has expired based on the stored timestamp - auto end it
            console.log('[useAgentStatus] Stale breakStartTime detected, auto-ending expired break');
            endBreak();
          }
        } else if (data.status !== AGENT_STATUS.BREAK) {
          setBreakStartTime(null);
          breakStartTimeRef.current = null;
        }
      }
    }, (error) => {
      console.error('[useAgentStatus] Error listening to status:', error);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [agentId, collectionName]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (workingTimerRef.current) clearInterval(workingTimerRef.current);
      if (breakTimerRef.current) clearInterval(breakTimerRef.current);
    };
  }, []);

  return {
    // State
    status,
    isLoggedInToday,
    isStatusLoading, // Indicates if initial status check is in progress
    workingDuration,
    breakTimeRemaining,
    lastActivity,
    todayLoginTime,

    // Actions
    startDay,
    endDay,
    startBreak,
    endBreak,
    setOnCall,
    setAvailableAfterCall,
    recordActivity,

    // Constants
    AGENT_STATUS,
  };
};

/**
 * Hook for managers/TLs to listen to multiple agents' statuses in real-time
 * @param {Array} agents - Array of {id, collection} objects
 * @returns {Object} - Map of agentId -> status
 */
export const useAgentStatusesRealtime = (agents = []) => {
  const [statuses, setStatuses] = useState({});
  const unsubscribersRef = useRef([]);

  useEffect(() => {
    // Cleanup previous listeners
    unsubscribersRef.current.forEach(unsub => unsub());
    unsubscribersRef.current = [];

    if (!agents || agents.length === 0) {
      setStatuses({});
      return;
    }

    agents.forEach(agent => {
      if (!agent.id || !agent.collection) return;

      const agentDocRef = doc(db, agent.collection, agent.id);

      const unsubscribe = onSnapshot(agentDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStatuses(prev => ({
            ...prev,
            [agent.id]: {
              status: data.status || AGENT_STATUS.LOGOUT,
              lastActivityTime: data.lastActivityTime,
              todayLoginTime: data.todayLoginTime,
              name: data.name || agent.name,
            }
          }));
        }
      }, (error) => {
        console.error(`[useAgentStatusesRealtime] Error for agent ${agent.id}:`, error);
      });

      unsubscribersRef.current.push(unsubscribe);
    });

    return () => {
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
    };
  }, [agents]);

  // Calculate summary stats
  const summary = {
    total: Object.keys(statuses).length,
    login: Object.values(statuses).filter(s => s.status === AGENT_STATUS.LOGIN).length,
    onCall: Object.values(statuses).filter(s => s.status === AGENT_STATUS.ON_CALL).length,
    onBreak: Object.values(statuses).filter(s => s.status === AGENT_STATUS.BREAK).length,
    logout: Object.values(statuses).filter(s => s.status === AGENT_STATUS.LOGOUT).length,
    // Backwards compatibility
    available: Object.values(statuses).filter(s => s.status === AGENT_STATUS.LOGIN).length,
    unavailable: Object.values(statuses).filter(s => s.status === AGENT_STATUS.LOGOUT).length,
  };

  return { statuses, summary };
};

export default useAgentStatus;
