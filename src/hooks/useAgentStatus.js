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

      setIsLoggedInToday(true);
      setTodayLoginTime(new Date());
      setLastActivity(new Date());
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

    try {
      await updateStatusInFirestore(AGENT_STATUS.BREAK, {
        breakStartTime: serverTimestamp(),
      });

      setBreakStartTime(new Date());
      setBreakTimeRemaining(BREAK_MAX_DURATION / 1000); // Convert to seconds
    } catch (error) {
      console.error('[useAgentStatus] Error starting break:', error);
    }
  }, [agentId, collectionName, status, updateStatusInFirestore]);

  // End break
  const endBreak = useCallback(async () => {
    if (!agentId || !collectionName) return;

    console.log('[useAgentStatus] Ending break');

    try {
      await updateStatusInFirestore(AGENT_STATUS.LOGIN, {
        breakStartTime: null,
      });

      setBreakStartTime(null);
      setBreakTimeRemaining(0);
      await recordActivity();

      // Clear break timer
      if (breakTimerRef.current) {
        clearInterval(breakTimerRef.current);
        breakTimerRef.current = null;
      }
    } catch (error) {
      console.error('[useAgentStatus] Error ending break:', error);
    }
  }, [agentId, collectionName, updateStatusInFirestore, recordActivity]);

  // Set status to On Call
  const setOnCall = useCallback(async () => {
    // Can't go on call if logged out
    if (status === AGENT_STATUS.LOGOUT || status === "Logout" || status === "Logged Out") return;

    await updateStatusInFirestore(AGENT_STATUS.ON_CALL);
  }, [status, updateStatusInFirestore]);

  // Set status back to Login after call ends
  const setAvailableAfterCall = useCallback(async () => {
    // Can't change status if logged out
    if (status === AGENT_STATUS.LOGOUT || status === "Logout" || status === "Logged Out") return;

    await updateStatusInFirestore(AGENT_STATUS.LOGIN);
    await recordActivity();
  }, [status, updateStatusInFirestore, recordActivity]);

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
      const startTime = breakStartTime instanceof Date ? breakStartTime : new Date(breakStartTime);
      const elapsed = now - startTime;
      const remaining = Math.max(0, Math.floor((BREAK_MAX_DURATION - elapsed) / 1000));

      setBreakTimeRemaining(remaining);

      // Auto-end break when time is up
      if (remaining <= 0) {
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

    // Initial fetch to check today's login status
    const initializeState = async () => {
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
            } else {
              setIsLoggedInToday(false);
              setStatus(AGENT_STATUS.LOGOUT);
            }
          } else {
            // Not logged in today
            setIsLoggedInToday(false);
            setStatus(AGENT_STATUS.LOGOUT);
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
          }
        } else {
          // Document doesn't exist - agent hasn't logged in today
          setIsLoggedInToday(false);
          setStatus(AGENT_STATUS.LOGOUT);
        }
        isInitializedRef.current = true;
      } catch (error) {
        console.error('[useAgentStatus] Error initializing state:', error);
        // On error, default to not logged in so modal shows
        setIsLoggedInToday(false);
      } finally {
        setIsStatusLoading(false); // Done loading - NOW show modal if needed
      }
    };

    initializeState();

    // Real-time listener
    unsubscribeRef.current = onSnapshot(agentDocRef, (docSnap) => {
      if (docSnap.exists() && isInitializedRef.current) {
        const data = docSnap.data();

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
          }
        }

        // Update break start time
        if (data.breakStartTime && data.status === AGENT_STATUS.BREAK) {
          const breakStart = data.breakStartTime.toDate ?
            data.breakStartTime.toDate() :
            new Date(data.breakStartTime);
          setBreakStartTime(breakStart);
        } else if (data.status !== AGENT_STATUS.BREAK) {
          setBreakStartTime(null);
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
  }, [agentId, collectionName]);

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
