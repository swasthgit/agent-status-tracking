import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ExoPhones from "./ExoPhones";
import ManualLeads from "./ManualLeads";
import InboundCalls from "./InboundCalls";
import CallHistory from "./CallHistory";
import DailyTaskForm from "./DailyTaskForm";
import StatusLoginModal from "./StatusLoginModal";
import StatusHeader from "./StatusHeader";
import {
  Box,
  Typography,
  Avatar,
  Tabs,
  Tab,
  Paper,
  Chip,
  Tooltip,
  Button,
} from "@mui/material";
import {
  Person,
  Circle,
  Phone,
  PhoneDisabled,
  Today,
  RateReview,
  OpenInNew,
  Coffee,
  History as HistoryIcon,
  PhoneInTalk,
  EditNote,
  CallReceived,
  TaskAlt,
} from "@mui/icons-material";
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { THEME, GRADIENTS, SHADOWS, TYPOGRAPHY, ANIMATIONS, GLASS, STATUS_COLORS, RADIUS, SPACING } from "../theme/theme";
import { useAgentStatus, AGENT_STATUS } from "../hooks/useAgentStatus";
import styles from "./AgentView.module.css";
import "../styles/animations.css";

// Status color mapping using new design tokens
const getStatusColor = (status) => {
  switch (status) {
    case AGENT_STATUS.LOGIN:
    case AGENT_STATUS.AVAILABLE:
    case "Idle":
    case "Available":
      return STATUS_COLORS.available.color;
    case AGENT_STATUS.ON_CALL:
      return STATUS_COLORS.onCall.color;
    case AGENT_STATUS.BREAK:
      return STATUS_COLORS.break.color;
    case AGENT_STATUS.LOGOUT:
    case AGENT_STATUS.UNAVAILABLE:
    default:
      return STATUS_COLORS.offline.color;
  }
};

// Map agent status to CSS class suffix
const getStatusClassName = (status) => {
  switch (status) {
    case AGENT_STATUS.LOGIN:
    case AGENT_STATUS.AVAILABLE:
    case "Idle":
    case "Available":
      return "Available";
    case AGENT_STATUS.ON_CALL:
      return "OnCall";
    case AGENT_STATUS.BREAK:
      return "Break";
    case AGENT_STATUS.LOGOUT:
    case AGENT_STATUS.UNAVAILABLE:
    default:
      return "Offline";
  }
};

// Tab icons for the premium tab bar
const TAB_ICONS = {
  0: <HistoryIcon sx={{ fontSize: 18 }} />,
  1: <PhoneInTalk sx={{ fontSize: 18 }} />,
  2: <EditNote sx={{ fontSize: 18 }} />,
  3: <CallReceived sx={{ fontSize: 18 }} />,
  4: <TaskAlt sx={{ fontSize: 18 }} />,
  5: <RateReview sx={{ fontSize: 18 }} />,
};

const AgentView = ({ currentUser, onStatusChange }) => {
  const [agent, setAgent] = useState(null);
  const [callLog, setCallLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const unsubscribeRef = useRef(() => {});
  const isMountedRef = useRef(false);
  const timeoutRef = useRef(null);
  const isRevertingToIdle = useRef(false);

  // Helper function to get the correct collection name
  const getCollectionName = useCallback(() => {
    if (currentUser?.collection) {
      return currentUser.collection;
    }
    if (currentUser?.role === "teamlead") {
      return "mswasth";
    }
    if (currentUser?.role === "health_tl") {
      return "healthTeamLeads";
    }
    if (currentUser?.role === "healthAgent") {
      return "healthAgents";
    }
    return currentUser?.email?.split("@")[0] || "";
  }, [currentUser]);

  // Use the enhanced status management hook with new features
  const {
    status: agentStatus,
    isLoggedInToday,
    isStatusLoading, // NEW: tracks if initial status check is in progress
    workingDuration,
    breakTimeRemaining,
    setOnCall,
    setAvailableAfterCall,
    recordActivity,
    startDay,
    endDay,
    startBreak,
    endBreak,
  } = useAgentStatus(
    currentUser?.uid,
    getCollectionName(),
    true // isLoggedIn - hook auto-sets to Available on mount
  );

  // Check if agent is on break
  const isOnBreak = agentStatus === AGENT_STATUS.BREAK;

  useEffect(() => {
    let mounted = true;

    const fetchAgentData = async () => {
      if (!currentUser || !currentUser.email || !currentUser.uid) {
        if (mounted) {
          setAgent(null);
          setLoading(false);
        }
        return;
      }

      const collectionName = getCollectionName();

      try {
        const userDocRef = doc(db, collectionName, currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (mounted) {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setAgent({
              ...userData,
              id: currentUser.uid,  // Keep Firebase UID as id (overwrites userData.id)
              customId: userData.id,  // Store custom ID separately
              // Note: Don't override status here - let useAgentStatus hook manage it
            });
            // Don't update status to "Idle" here - the new status system handles this
            // Status is now managed by useAgentStatus hook with Login/Logout/Break/On Call states
          } else {
            await setDoc(userDocRef, {
              name: currentUser.displayName || "Agent",
              email: currentUser.email,
              status: AGENT_STATUS.LOGOUT, // Use new status system
            });

            setAgent({
              id: currentUser.uid,
              name: currentUser.displayName || "Agent",
              email: currentUser.email,
            });
            // Don't call onStatusChange here - useAgentStatus hook handles status
          }
        }
      } catch (error) {
        if (mounted) setAgent(null);
      }
      if (mounted) setLoading(false);
    };

    fetchAgentData();

    isMountedRef.current = true;
    if (
      isMountedRef.current &&
      currentUser &&
      currentUser.email &&
      currentUser.uid
    ) {
      const collectionName = getCollectionName();

      const callLogsRef = collection(
        db,
        collectionName,
        currentUser.uid,
        "callLogs"
      );
      const agentDocRef = doc(db, collectionName, currentUser.uid);

      unsubscribeRef.current();

      const unsubscribeCallLogs = onSnapshot(
        callLogsRef,
        (snapshot) => {
          if (isMountedRef.current) {
            console.log(`[AgentView] Call logs snapshot received for ${collectionName}/${currentUser.uid}`);
            console.log(`[AgentView] Number of call logs:`, snapshot.docs.length);
            const logs = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            console.log(`[AgentView] Mapped call logs:`, logs);
            setCallLog(logs);
          }
        },
        (error) => {
          console.error(`[AgentView] Error fetching call logs:`, error);
        }
      );

      const unsubscribeAgentStatus = onSnapshot(
        agentDocRef,
        (docSnap) => {
          if (
            isMountedRef.current &&
            docSnap.exists() &&
            !isRevertingToIdle.current
          ) {
            const newStatus = docSnap.data().status || AGENT_STATUS.LOGOUT;
            setAgent((prev) => {
              if (prev && prev.status !== newStatus) {
                return { ...prev, status: newStatus };
              }
              return prev;
            });
          }
        },
        (error) => {}
      );

      unsubscribeRef.current = () => {
        unsubscribeCallLogs();
        unsubscribeAgentStatus();
      };
    }

    return () => {
      isMountedRef.current = false;
      unsubscribeRef.current();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, onStatusChange]);


  const startCall = useCallback(
    () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Use new status hook to set "On Call"
      setOnCall();
      onStatusChange(agent.id, AGENT_STATUS.ON_CALL);
    },
    [agent, onStatusChange, setOnCall]
  );

  const endCall = useCallback(() => {
    // Use new status hook to set back to "Available"
    setAvailableAfterCall();
    onStatusChange(agent?.id, AGENT_STATUS.AVAILABLE);
  }, [agent, onStatusChange, setAvailableAfterCall]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Record activity when agent interacts with tabs
    recordActivity();
  };

  // Note: Status logout is now handled manually via StatusHeader's "End Day" button
  // or automatically via inactivity timeout (10 min) or 6 PM auto-logout

  // Calculate today's call counts (connected vs not connected)
  const todayCallStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCalls = callLog.filter((log) => {
      const logDate = log.timestamp?.toDate?.() || new Date(log.timestamp);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime();
    });

    const connected = todayCalls.filter(
      (log) => log.status === "Connected" || log.status === "connected" || log.callStatus === "Connected"
    ).length;

    const notConnected = todayCalls.filter(
      (log) => log.status === "Not Connected" || log.status === "not connected" || log.callStatus === "Not Connected"
    ).length;

    return {
      total: todayCalls.length,
      connected,
      notConnected,
    };
  }, [callLog]);

  // Check if user is a Health Agent
  const isHealthAgent = useMemo(() => {
    return (
      currentUser?.role === "Health Agent" ||
      currentUser?.role === "healthAgent" ||
      currentUser?.collection === "healthAgents"
    );
  }, [currentUser]);

  // Branded skeleton loading state
  if (loading) {
    return (
      <Box className={styles.pageWrapper}>
        <Box className={styles.skeletonPage}>
          <Box className={styles.skeletonBanner} />
          <Box className={styles.skeletonTabs} />
          <Box className={styles.skeletonContent} />
        </Box>
      </Box>
    );
  }

  if (!agent) {
    return (
      <Box className={styles.pageWrapper}>
        <Box className={styles.noDataContainer}>
          <Typography className={styles.noDataText}>No agent data available</Typography>
        </Box>
      </Box>
    );
  }

  const statusClass = getStatusClassName(agentStatus);

  return (
    <Box className={styles.pageWrapper}>
      <Box className={styles.pageContent}>
        {/* Premium loading overlay while checking login status */}
        {isStatusLoading && (
          <Box className={styles.loadingOverlay}>
            <Box className={styles.loadingSpinnerContainer}>
              <Box className={styles.loadingSpinnerOuter} />
              <Box className={styles.loadingSpinnerInner} />
            </Box>
            <Typography className={styles.loadingText}>
              Checking status...
            </Typography>
          </Box>
        )}

        {/* Status Login Modal - Blocks dashboard until agent starts their day */}
        {/* Only show modal AFTER status check is complete to prevent flash/delay issues */}
        <StatusLoginModal
          open={!isStatusLoading && !isLoggedInToday}
          agentName={agent?.name}
          onStartDay={startDay}
        />

        {/* Status Header with controls - Only shown when logged in */}
        {isLoggedInToday && (
          <StatusHeader
            status={agentStatus}
            workingDuration={workingDuration}
            breakTimeRemaining={breakTimeRemaining}
            onStartBreak={startBreak}
            onEndBreak={endBreak}
            onLogout={() => endDay("manual")}
          />
        )}

        {/* Break Message Overlay - Premium amber gradient design */}
        {isOnBreak && (
          <Box className={styles.breakOverlay}>
            <Box className={styles.breakIconWrapper}>
              <Coffee sx={{ fontSize: 32, color: "#fff" }} />
            </Box>
            <Typography className={styles.breakTitle}>
              You are currently on break
            </Typography>
            <Typography className={styles.breakSubtitle}>
              Dashboard features are disabled during break. Click "End Break" to resume work.
            </Typography>
          </Box>
        )}

        {/* ── Welcome Banner / Header ──────────────────────────────────────── */}
        <Box className={styles.welcomeBanner}>
          {/* Floating decorative shapes */}
          <Box className={`${styles.bannerDecor} ${styles.bannerDecor1}`} />
          <Box className={`${styles.bannerDecor} ${styles.bannerDecor2}`} />
          <Box className={`${styles.bannerDecor} ${styles.bannerDecor3}`} />

          <Box className={styles.bannerLeft}>
            {/* Avatar with animated gradient ring */}
            <Box className={styles.avatarWrapper}>
              <Box className={styles.avatarRing} />
              <Box className={styles.avatarInner}>
                <Person sx={{ fontSize: 32, color: "#fff" }} />
              </Box>
            </Box>
            <Box className={styles.bannerInfo}>
              <Typography className={styles.welcomeText}>
                Welcome back, {agent.name}
              </Typography>
              <Typography className={styles.welcomeSubText}>
                Ready to make some calls today?
              </Typography>
            </Box>
          </Box>

          <Box className={styles.bannerRight}>
            {/* Today's Call Stats - Glassmorphism chips - Only for Health Agents */}
            {isHealthAgent && (
              <Tooltip title="Today's Calls" arrow>
                <Box className={styles.statChipGroup}>
                  <Today sx={{ fontSize: 20, color: "rgba(255,255,255,0.9)" }} />
                  <Box className={styles.statChipPills}>
                    <Tooltip title="Connected Calls" arrow>
                      <Box className={styles.statPillConnected}>
                        <Phone className={styles.statPillIconConnected} sx={{ fontSize: 15 }} />
                        <span className={styles.statPillLabel}>{todayCallStats.connected}</span>
                      </Box>
                    </Tooltip>
                    <Tooltip title="Not Connected Calls" arrow>
                      <Box className={styles.statPillNotConnected}>
                        <PhoneDisabled className={styles.statPillIconNotConnected} sx={{ fontSize: 15 }} />
                        <span className={styles.statPillLabel}>{todayCallStats.notConnected}</span>
                      </Box>
                    </Tooltip>
                  </Box>
                  <Typography className={styles.statTotalLabel}>
                    Total: {todayCallStats.total}
                  </Typography>
                </Box>
              </Tooltip>
            )}

            {/* Status Badge with glowing pulse dot */}
            <Box
              className={`${styles.statusBadge} ${styles[`status${statusClass}`]}`}
              sx={{ borderColor: `${getStatusColor(agentStatus)}80` }}
            >
              <Box
                className={styles.statusDot}
                sx={{ background: getStatusColor(agentStatus) }}
              />
              <span>{agentStatus}</span>
            </Box>
          </Box>
        </Box>

        {/* ── Modern Pill-style Tab Navigation ─────────────────────────────── */}
        <Paper
          elevation={0}
          className={`${styles.tabContainer} ${isOnBreak ? styles.tabContainerDisabled : ""}`}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: "60px",
              px: 1,
              "& .MuiTab-root": {
                color: THEME.textSecondary,
                fontWeight: 600,
                fontSize: TYPOGRAPHY.size.base,
                fontFamily: TYPOGRAPHY.fontFamily,
                textTransform: "none",
                minHeight: "52px",
                borderRadius: RADIUS.lg,
                margin: "4px 3px",
                padding: "8px 18px",
                transition: ANIMATIONS.transition.all,
                letterSpacing: TYPOGRAPHY.tracking.tight,
                gap: "6px",
                "&:hover": {
                  color: THEME.primary,
                  backgroundColor: `${THEME.primary}0A`,
                  transform: "translateY(-1px)",
                },
                "&.Mui-selected": {
                  color: "#fff",
                  background: GRADIENTS.primary,
                  fontWeight: 700,
                  boxShadow: SHADOWS.primary,
                },
                "&.Mui-disabled": {
                  opacity: 0.4,
                },
              },
              "& .MuiTabs-indicator": {
                display: "none", // hidden since we use pill-style active bg
              },
              "& .MuiTabs-flexContainer": {
                gap: "2px",
                padding: "4px 0",
              },
            }}
          >
            <Tab icon={TAB_ICONS[0]} iconPosition="start" label="Call History" disabled={isOnBreak} />
            <Tab icon={TAB_ICONS[1]} iconPosition="start" label="ExoPhones" disabled={isOnBreak} />
            <Tab icon={TAB_ICONS[2]} iconPosition="start" label="Manual Leads" disabled={isOnBreak} />
            <Tab icon={TAB_ICONS[3]} iconPosition="start" label="Inbound Calls" disabled={isOnBreak} />
            {/* Daily Task tab - Only for Health Agents */}
            {(currentUser?.role === "Health Agent" ||
              currentUser?.role === "healthAgent" ||
              currentUser?.collection === "healthAgents") && (
              <Tab icon={TAB_ICONS[4]} iconPosition="start" label="Daily Task" disabled={isOnBreak} />
            )}
            {/* BM Review tab - Only for Health Agents */}
            {(currentUser?.role === "Health Agent" ||
              currentUser?.role === "healthAgent" ||
              currentUser?.collection === "healthAgents") && (
              <Tab icon={TAB_ICONS[5]} iconPosition="start" label="BM Review" disabled={isOnBreak} />
            )}
          </Tabs>
        </Paper>

        {/* Tab Content - Disabled when on break */}
        <Box className={`${styles.tabContent} ${isOnBreak ? styles.tabContentDisabled : ""}`}>
          {tabValue === 0 && !isOnBreak && (
            <CallHistory callLogs={callLog} agentName={agent.name} />
          )}

          {tabValue === 1 && agent && currentUser && !isOnBreak && (
            <ExoPhones
              agentId={agent.id}
              agentCollection={getCollectionName()}
              onStartCall={startCall}
              onEndCall={endCall}
            />
          )}

          {tabValue === 2 && agent && currentUser && !isOnBreak && (
            <ManualLeads
              agentId={agent.id}
              agentCollection={getCollectionName()}
              onStartCall={startCall}
              onEndCall={endCall}
            />
          )}

          {tabValue === 3 && agent && currentUser && !isOnBreak && (
            <InboundCalls
              agentId={agent.id}
              agentCollection={getCollectionName()}
              agentName={agent.name}
            />
          )}

          {/* Daily Task tab content - Only for Health Agents */}
          {tabValue === 4 &&
            agent &&
            currentUser &&
            !isOnBreak &&
            (currentUser?.role === "Health Agent" ||
              currentUser?.role === "healthAgent" ||
              currentUser?.collection === "healthAgents") && (
              <DailyTaskForm
                agentId={agent.id}
                agentName={agent.name}
                agentCollection={getCollectionName()}
                currentUser={currentUser}
              />
            )}

          {/* BM Review tab content - Premium redesigned card */}
          {tabValue === 5 &&
            agent &&
            currentUser &&
            !isOnBreak &&
            (currentUser?.role === "Health Agent" ||
              currentUser?.role === "healthAgent" ||
              currentUser?.collection === "healthAgents") && (
              <Box className={styles.bmReviewCard}>
                <Box className={styles.bmReviewIcon}>
                  <RateReview sx={{ fontSize: 44, color: THEME.primary }} />
                </Box>
                <Typography className={styles.bmReviewTitle}>
                  BM Review Portal
                </Typography>
                <Typography className={styles.bmReviewDescription}>
                  Access the Brand Manager Review system to track your performance, review metrics, and view evaluations.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<OpenInNew />}
                  onClick={() => window.open("https://bm-review-agentstatus.web.app", "_blank")}
                  sx={{
                    background: GRADIENTS.primary,
                    color: "#fff",
                    px: 4,
                    py: 1.5,
                    fontSize: "1rem",
                    fontWeight: 600,
                    fontFamily: TYPOGRAPHY.fontFamily,
                    borderRadius: RADIUS.lg,
                    textTransform: "none",
                    letterSpacing: TYPOGRAPHY.tracking.tight,
                    boxShadow: SHADOWS.primary,
                    border: "none",
                    "&:hover": {
                      background: GRADIENTS.primary,
                      boxShadow: SHADOWS.primaryLg,
                      transform: ANIMATIONS.hover.liftSm,
                    },
                    "&:active": {
                      transform: "translateY(0) scale(0.98)",
                    },
                    transition: ANIMATIONS.transition.all,
                  }}
                >
                  Open BM Review Portal
                </Button>
              </Box>
            )}
        </Box>
      </Box>
    </Box>
  );
};

export default AgentView;
