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
import { THEME } from "../theme/theme";
import { useAgentStatus, AGENT_STATUS } from "../hooks/useAgentStatus";

// Status color mapping
const getStatusColor = (status) => {
  switch (status) {
    case AGENT_STATUS.LOGIN:
    case AGENT_STATUS.AVAILABLE:
    case "Idle": // Legacy status - treat as active
    case "Available": // Legacy status
      return "#22c55e"; // Green
    case AGENT_STATUS.ON_CALL:
      return "#f59e0b"; // Orange/Amber
    case AGENT_STATUS.BREAK:
      return "#f97316"; // Orange for break
    case AGENT_STATUS.LOGOUT:
    case AGENT_STATUS.UNAVAILABLE:
    default:
      return "#ef4444"; // Red
  }
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

  if (loading) {
    return <Typography>Loading agent data...</Typography>;
  }

  if (!agent) {
    return <Typography>No agent data available</Typography>;
  }

  return (
    <Box
      sx={{
        background: THEME.background,
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      {/* Loading overlay while checking login status */}
      {isStatusLoading && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              border: "4px solid rgba(255,255,255,0.3)",
              borderTop: "4px solid #fff",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              "@keyframes spin": {
                "0%": { transform: "rotate(0deg)" },
                "100%": { transform: "rotate(360deg)" },
              },
            }}
          />
          <Typography sx={{ color: "#fff", mt: 2 }}>
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

      {/* Break Message Overlay */}
      {isOnBreak && (
        <Paper
          elevation={3}
          sx={{
            bgcolor: "warning.light",
            color: "warning.contrastText",
            p: 3,
            mb: 2,
            borderRadius: 2,
            textAlign: "center",
          }}
        >
          <Coffee sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="h6" fontWeight="bold">
            You are currently on break
          </Typography>
          <Typography variant="body2">
            Dashboard features are disabled during break. Click "End Break" to resume work.
          </Typography>
        </Paper>
      )}
      {/* Modern Header Section */}
      <Paper
        elevation={0}
        sx={{
          background: `linear-gradient(135deg, ${THEME.primary} 0%, #1e8a7f 100%)`,
          color: "#fff",
          padding: "32px",
          borderRadius: "16px",
          marginBottom: "24px",
          border: "none",
          boxShadow: `0 4px 20px ${THEME.primary}33`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              background: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(10px)",
              border: "2px solid rgba(255, 255, 255, 0.3)",
            }}
          >
            <Person sx={{ fontSize: "32px", color: "#fff" }} />
          </Avatar>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "#fff",
                margin: 0,
                fontSize: { xs: "1.5rem", md: "2rem" },
              }}
            >
              Welcome back, {agent.name}
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                color: "rgba(255, 255, 255, 0.9)",
                margin: "4px 0 0 0",
                fontWeight: 500,
              }}
            >
              Ready to make some calls today?
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          {/* Today's Call Stats - Only for Health Agents */}
          {isHealthAgent && (
            <Tooltip title="Today's Calls" arrow>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  bgcolor: "rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                <Today sx={{ color: "#fff", fontSize: 20 }} />
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Tooltip title="Connected Calls" arrow>
                    <Chip
                      icon={<Phone sx={{ fontSize: "16px !important" }} />}
                      label={todayCallStats.connected}
                      size="small"
                      sx={{
                        bgcolor: "rgba(34, 197, 94, 0.3)",
                        color: "#fff",
                        fontWeight: 700,
                        "& .MuiChip-icon": { color: "#22c55e" },
                      }}
                    />
                  </Tooltip>
                  <Tooltip title="Not Connected Calls" arrow>
                    <Chip
                      icon={<PhoneDisabled sx={{ fontSize: "16px !important" }} />}
                      label={todayCallStats.notConnected}
                      size="small"
                      sx={{
                        bgcolor: "rgba(239, 68, 68, 0.3)",
                        color: "#fff",
                        fontWeight: 700,
                        "& .MuiChip-icon": { color: "#ef4444" },
                      }}
                    />
                  </Tooltip>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontWeight: 500,
                    ml: 0.5,
                  }}
                >
                  Total: {todayCallStats.total}
                </Typography>
              </Box>
            </Tooltip>
          )}

          {/* Real-time Status Indicator */}
          <Chip
            icon={<Circle sx={{ fontSize: "12px !important", color: getStatusColor(agentStatus) }} />}
            label={agentStatus}
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(10px)",
              color: "#fff",
              fontWeight: 600,
              fontSize: "14px",
              padding: "8px 4px",
              height: "auto",
              border: `2px solid ${getStatusColor(agentStatus)}`,
              "& .MuiChip-icon": {
                color: getStatusColor(agentStatus),
                animation: agentStatus === AGENT_STATUS.ON_CALL ? "pulse 1.5s infinite" : "none",
              },
              "@keyframes pulse": {
                "0%": { opacity: 1 },
                "50%": { opacity: 0.4 },
                "100%": { opacity: 1 },
              },
            }}
          />
        </Box>
      </Paper>

      {/* Modern Tabs */}
      <Paper
        elevation={0}
        sx={{
          backgroundColor: THEME.cardBg,
          borderRadius: "16px",
          marginBottom: "24px",
          border: `1px solid ${THEME.primary}20`,
          overflow: "hidden",
          opacity: isOnBreak ? 0.5 : 1,
          pointerEvents: isOnBreak ? "none" : "auto",
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTab-root": {
              color: THEME.textSecondary,
              fontWeight: 600,
              fontSize: "14px",
              textTransform: "none",
              minHeight: "64px",
              transition: "all 0.3s ease",
              "&:hover": {
                color: THEME.primary,
                backgroundColor: `${THEME.primary}10`,
              },
              "&.Mui-selected": {
                color: THEME.primary,
                fontWeight: 700,
              },
            },
            "& .MuiTabs-indicator": {
              backgroundColor: THEME.primary,
              height: "3px",
              borderRadius: "3px 3px 0 0",
            },
          }}
        >
          <Tab label="Call History" disabled={isOnBreak} />
          <Tab label="ExoPhones" disabled={isOnBreak} />
          <Tab label="Manual Leads" disabled={isOnBreak} />
          <Tab label="Inbound Calls" disabled={isOnBreak} />
          {/* Daily Task tab - Only for Health Agents */}
          {(currentUser?.role === "Health Agent" ||
            currentUser?.role === "healthAgent" ||
            currentUser?.collection === "healthAgents") && (
            <Tab label="Daily Task" disabled={isOnBreak} />
          )}
          {/* BM Review tab - Only for Health Agents */}
          {(currentUser?.role === "Health Agent" ||
            currentUser?.role === "healthAgent" ||
            currentUser?.collection === "healthAgents") && (
            <Tab label="BM Review" icon={<RateReview />} iconPosition="start" disabled={isOnBreak} />
          )}
        </Tabs>
      </Paper>

      {/* Tab Content - Disabled when on break */}
      <Box sx={{ marginTop: "24px", opacity: isOnBreak ? 0.5 : 1, pointerEvents: isOnBreak ? "none" : "auto" }}>
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

        {/* BM Review tab content - Only for Health Agents */}
        {tabValue === 5 &&
          agent &&
          currentUser &&
          !isOnBreak &&
          (currentUser?.role === "Health Agent" ||
            currentUser?.role === "healthAgent" ||
            currentUser?.collection === "healthAgents") && (
            <Paper
              elevation={0}
              sx={{
                bgcolor: "white",
                borderRadius: "16px",
                p: 4,
                border: `1px solid ${THEME.primary}20`,
                boxShadow: `0 4px 20px ${THEME.primary}10`,
              }}
            >
              <Box sx={{ textAlign: "center", py: 6 }}>
                <RateReview sx={{ fontSize: 80, color: THEME.primary, mb: 3 }} />
                <Typography variant="h4" fontWeight={700} color={THEME.primary} gutterBottom>
                  BM Review Portal
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: "auto" }}>
                  Access the Brand Manager Review system to track your performance, review metrics, and view evaluations.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<OpenInNew />}
                  onClick={() => window.open("https://bm-review-agentstatus.web.app", "_blank")}
                  sx={{
                    bgcolor: THEME.primary,
                    color: "white",
                    px: 4,
                    py: 1.5,
                    fontSize: "16px",
                    fontWeight: 600,
                    borderRadius: "12px",
                    textTransform: "none",
                    boxShadow: `0 4px 12px ${THEME.primary}40`,
                    "&:hover": {
                      bgcolor: THEME.primaryDark,
                      boxShadow: `0 6px 16px ${THEME.primary}60`,
                      transform: "translateY(-2px)",
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  Open BM Review Portal
                </Button>
              </Box>
            </Paper>
          )}
      </Box>
    </Box>
  );
};

export default AgentView;
