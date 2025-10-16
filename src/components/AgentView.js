import React, { useState, useEffect, useRef, useCallback } from "react";
import CallLogForm from "./CallLogForm";
import ExoPhones from "./ExoPhones";
import ManualLeads from "./ManualLeads";
import InboundCalls from "./InboundCalls";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  FormControl,
  Select,
  MenuItem,
  Grid,
  List,
  ListItem,
  Divider,
  Paper,
  Chip,
  Avatar,
  Fade,
  Zoom,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Phone,
  PhoneDisabled,
  Person,
  AccessTime,
  TrendingUp,
} from "@mui/icons-material";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import styles from "./AgentView.module.css";

const AgentView = ({ currentUser, onStatusChange }) => {
  const [agent, setAgent] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [showCallForm, setShowCallForm] = useState(false);
  const [callLog, setCallLog] = useState([]);
  const [filteredCallLog, setFilteredCallLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [callStartTime, setCallStartTime] = useState(null);
  const [callEndTime, setCallEndTime] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [currentLeadNumber, setCurrentLeadNumber] = useState("");
  const unsubscribeRef = useRef(() => {});
  const isMountedRef = useRef(false);
  const timeoutRef = useRef(null);
  const isRevertingToIdle = useRef(false);

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

      // Check if user is a Team Leader (role is teamlead)
      let collectionName = currentUser.email.split("@")[0];

      // If user role is teamlead, use mswasth collection
      if (currentUser.role === "teamlead") {
        collectionName = "mswasth";
      }

      try {
        const userDocRef = doc(db, collectionName, currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (mounted) {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setAgent({
              id: currentUser.uid,
              ...userData,
              status: "Idle",
            });

            await updateDoc(userDocRef, { status: "Idle" });
            onStatusChange(currentUser.uid, "Idle");
          } else {
            await setDoc(userDocRef, {
              name: currentUser.displayName || "Agent",
              email: currentUser.email,
              status: "Logged Out",
            });

            await updateDoc(userDocRef, { status: "Idle" });
            setAgent({
              id: currentUser.uid,
              name: currentUser.displayName || "Agent",
              email: currentUser.email,
              status: "Idle",
            });
            onStatusChange(currentUser.uid, "Idle");
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
      // Check if user is a Team Leader
      let collectionName = currentUser.email.split("@")[0];
      if (currentUser.role === "teamlead") {
        collectionName = "mswasth";
      }

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
            const logs = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setCallLog(logs);
          }
        },
        (error) => {}
      );

      const unsubscribeAgentStatus = onSnapshot(
        agentDocRef,
        (docSnap) => {
          if (
            isMountedRef.current &&
            docSnap.exists() &&
            !isRevertingToIdle.current
          ) {
            const newStatus = docSnap.data().status || "Idle";
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
  }, [currentUser, onStatusChange]);

  useEffect(() => {
    const filterLogs = () => {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const filtered = callLog.filter((log) => {
        if (!log.timestamp) return false;
        const logTime = log.timestamp.toDate();
        return logTime >= twentyFourHoursAgo && logTime <= now;
      });
      setFilteredCallLog(filtered);
    };
    filterLogs();
  }, [callLog]);

  const handleStatusChange = useCallback(
    async (e) => {
      const newStatus = e.target.value;
      if (agent && agent.status !== newStatus) {
        onStatusChange(agent.id, newStatus);
        setAgent((prev) => ({ ...prev, status: newStatus }));
        try {
          let collectionName = currentUser.email.split("@")[0];
          if (currentUser.role === "teamlead") {
            collectionName = "mswasth";
          }
          await updateDoc(doc(db, collectionName, agent.id), {
            status: newStatus,
          });

          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }

          if (newStatus === "On Call" && !isCallActive) {
            timeoutRef.current = setTimeout(async () => {
              if (isMountedRef.current && !isCallActive) {
                setAgent((prev) => {
                  if (prev.status === "On Call") {
                    isRevertingToIdle.current = true;
                    onStatusChange(prev.id, "Idle");
                    return { ...prev, status: "Idle" };
                  }
                  return prev;
                });
                try {
                  await updateDoc(doc(db, collectionName, agent.id), {
                    status: "Idle",
                  });
                } catch (error) {
                } finally {
                  isRevertingToIdle.current = false;
                }
              }
            }, 300 * 1000);
          }
        } catch (error) {}
      }
    },
    [agent, currentUser, onStatusChange, isCallActive]
  );

  const startCall = useCallback(
    (leadNumber) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      const start = new Date();
      setCallStartTime(start);
      setCurrentLeadNumber(leadNumber);
      onStatusChange(agent.id, "Busy");
      setIsCallActive(true);
      let collectionName = currentUser.email.split("@")[0];
      if (currentUser.role === "teamlead") {
        collectionName = "mswasth";
      }
      updateDoc(doc(db, collectionName, agent.id), { status: "Busy" }).catch(
        (error) => {}
      );
    },
    [agent, currentUser, onStatusChange]
  );

  const endCall = useCallback(() => {
    const end = new Date();
    setCallEndTime(end);
    setIsCallActive(false);
    setShowCallForm(true);
    let collectionName = currentUser.email.split("@")[0];
    if (currentUser.role === "teamlead") {
      collectionName = "mswasth";
    }
    updateDoc(doc(db, collectionName, agent.id), { status: "Idle" }).catch(
      (error) => {}
    );
  }, [agent, currentUser, onStatusChange]);

  const handleFormSubmit = useCallback(
    async (logEntry) => {
      if (!currentUser || !currentUser.email || !agent) return;

      try {
        let collectionName = currentUser.email.split("@")[0];
        if (currentUser.role === "teamlead") {
          collectionName = "mswasth";
        }
        await addDoc(collection(db, collectionName, agent.id, "callLogs"), {
          agentId: agent.id,
          clientNumber: logEntry.clientNumber,
          time: logEntry.time,
          date: logEntry.date,
          callConnected: logEntry.callConnected,
          callStatus: logEntry.callConnected ? logEntry.callStatus : null,
          notConnectedReason: logEntry.callConnected
            ? null
            : logEntry.notConnectedReason,
          remarks: logEntry.remarks || null,
          duration: logEntry.duration || { hours: 0, minutes: 0, seconds: 0 },
          startTime: callStartTime ? callStartTime.toISOString() : null,
          endTime: callEndTime ? callEndTime.toISOString() : null,
          timestamp: serverTimestamp(),
        });
        onStatusChange(agent.id, "Idle");
        updateDoc(doc(db, collectionName, agent.id), { status: "Idle" }).catch(
          (error) => {}
        );
        setCallStartTime(null);
        setCallEndTime(null);
        setCurrentLeadNumber("");
      } catch (error) {}
      setShowCallForm(false);
    },
    [agent, currentUser, callStartTime, callEndTime, onStatusChange]
  );

  const statuses = ["Idle", "Break", "On Call", "Logout"];

  const getStatusColor = (status) => {
    switch (status) {
      case "Idle":
        return "success";
      case "Break":
        return "warning";
      case "On Call":
        return "info";
      case "Busy":
        return "error";
      case "Logout":
        return "default";
      default:
        return "default";
    }
  };

  const formatDuration = (duration) => {
    if (
      !duration ||
      typeof duration !== "object" ||
      (!duration.hours && !duration.minutes && !duration.seconds)
    )
      return null;
    return `${duration.hours || 0}h ${duration.minutes || 0}m ${
      duration.seconds || 0
    }s`;
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Reset call-related UI states and refresh "Call History" when switching to it
    if (newValue === 0) {
      // Call History tab
      setIsCallActive(false);
      setShowCallForm(false);
      // Force re-filter of logs to ensure latest data is displayed
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const filtered = callLog.filter((log) => {
        if (!log.timestamp) return false;
        const logTime = log.timestamp.toDate();
        return logTime >= twentyFourHoursAgo && logTime <= now;
      });
      setFilteredCallLog(filtered); // Recompute filtered logs
    }
  };

  if (loading) {
    return <Typography>Loading agent data...</Typography>;
  }

  if (!agent) {
    return <Typography>No agent data available</Typography>;
  }

  return (
    <Box className={styles.container}>
      <Box className={styles.headerSection}>
        <Avatar className={styles.agentAvatar}>
          <Person />
        </Avatar>
        <Box>
          <Typography variant="h4" className={styles.welcomeTitle}>
            Welcome back, {agent.name}
          </Typography>
          <Typography variant="subtitle1" className={styles.welcomeSubtitle}>
            Ready to make some calls today?
          </Typography>
        </Box>
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange} centered>
        <Tab label="Call History" />
        <Tab label="ExoPhones" />
        <Tab label="Manual Leads" />
        <Tab label="Inbound Calls" />
      </Tabs>

      {tabValue === 0 && (
        <Grid container spacing={3} className={styles.mainGrid}>
          <Grid item xs={12} lg={4}>
            <Card className={styles.controlCard} elevation={0}>
              <CardContent className={styles.controlContent}>
                <Box className={styles.cardHeader}>
                  <Typography variant="h6" className={styles.sectionHeader}>
                    Control Center
                  </Typography>
                  <Chip
                    label={agent.status}
                    color={getStatusColor(agent.status)}
                    size="small"
                    className={styles.statusChip}
                  />
                </Box>

                <Box className={styles.statusBox}>
                  {!isCallActive && !showCallForm && (
                    <Fade in={true}>
                      <Box className={styles.actionControls}>
                        <FormControl
                          variant="outlined"
                          size="small"
                          className={styles.statusSelect}
                        >
                          <Select
                            value={agent.status || "Idle"}
                            onChange={handleStatusChange}
                            displayEmpty
                          >
                            {statuses.map((status) => (
                              <MenuItem key={status} value={status}>
                                {status}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        {/* <Button
                          variant="contained"
                          startIcon={<Phone />}
                          onClick={startCall}
                          className={styles.startButton}
                          size="large"
                          disabled={agent.status === "Logout"}
                        >
                          Start Call
                        </Button> */}
                      </Box>
                    </Fade>
                  )}
                </Box>

                {isCallActive && (
                  <Zoom in={true}>
                    <Box className={styles.activeCallBox}>
                      <Box className={styles.pulseIcon}>
                        <Phone className={styles.phoneIcon} />
                      </Box>
                      <Typography
                        variant="h6"
                        className={styles.activeCallText}
                      >
                        Call in Progress
                      </Typography>
                      <Typography
                        variant="body2"
                        className={styles.callSubtext}
                      >
                        Stay focused and professional
                      </Typography>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<PhoneDisabled />}
                        onClick={endCall}
                        className={styles.endButton}
                        size="large"
                      >
                        End Call
                      </Button>
                    </Box>
                  </Zoom>
                )}

                {showCallForm && (
                  <Fade in={true}>
                    <Box className={styles.formContainer}>
                      <CallLogForm
                        onSubmit={handleFormSubmit}
                        initialClientNumber={currentLeadNumber}
                      />
                    </Box>
                  </Fade>
                )}
              </CardContent>
            </Card>

            <Card className={styles.statsCard} elevation={0}>
              <CardContent>
                <Box className={styles.statsHeader}>
                  <TrendingUp className={styles.statsIcon} />
                  <Typography variant="h6">Today's Stats</Typography>
                </Box>
                <Box className={styles.statsGrid}>
                  <Box className={styles.statItem}>
                    <Typography variant="h4" className={styles.statNumber}>
                      {filteredCallLog.length}
                    </Typography>
                    <Typography variant="body2" className={styles.statLabel}>
                      Total Calls
                    </Typography>
                  </Box>
                  <Box className={styles.statItem}>
                    <Typography variant="h4" className={styles.statNumber}>
                      {
                        filteredCallLog.filter((log) => log.callConnected)
                          .length
                      }
                    </Typography>
                    <Typography variant="body2" className={styles.statLabel}>
                      Connected
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={8}>
            <Box className={styles.logSection}>
              <Box className={styles.logHeader}>
                <Box>
                  <Typography variant="h5" className={styles.logTitle}>
                    Call History (Last 24 Hours)
                  </Typography>
                  <Typography variant="body2" className={styles.logSubtitle}>
                    Track your daily progress
                  </Typography>
                </Box>
                <AccessTime className={styles.timeIcon} />
              </Box>

              <Paper className={styles.logPaper} elevation={0}>
                <List disablePadding className={styles.logList}>
                  {filteredCallLog.length === 0 ? (
                    <ListItem className={styles.emptyLogItem}>
                      <Box className={styles.emptyState}>
                        <Phone className={styles.emptyIcon} />
                        <Typography className={styles.emptyText}>
                          No calls logged in the last 24 hours
                        </Typography>
                        <Typography
                          variant="body2"
                          className={styles.emptySubtext}
                        >
                          Start your first call to see it here
                        </Typography>
                      </Box>
                    </ListItem>
                  ) : (
                    filteredCallLog.map((log, index) => (
                      <React.Fragment key={log.id || index}>
                        <ListItem className={styles.logItem}>
                          <Box className={styles.logItemContent}>
                            <Box className={styles.logItemHeader}>
                              <Box className={styles.logItemLeft}>
                                <Box className={styles.phoneIconWrapper}>
                                  <Phone className={styles.logPhoneIcon} />
                                </Box>
                                <Box>
                                  <Typography className={styles.logPrimary}>
                                    {log.clientNumber}
                                  </Typography>
                                  <Typography className={styles.logTime}>
                                    {log.time}
                                  </Typography>
                                </Box>
                              </Box>
                              <Chip
                                label={
                                  log.callConnected
                                    ? "Connected"
                                    : "Not Connected"
                                }
                                color={log.callConnected ? "success" : "error"}
                                size="small"
                                className={styles.modernStatusChip}
                              />
                            </Box>

                            <Box className={styles.logDetails}>
                              <Box className={styles.logDetailItem}>
                                <Typography className={styles.logDetailLabel}>
                                  Status:
                                </Typography>
                                <Typography className={styles.logDetailValue}>
                                  {log.callConnected
                                    ? log.callStatus
                                    : log.notConnectedReason}
                                </Typography>
                              </Box>

                              {log.remarks && (
                                <Box className={styles.logDetailItem}>
                                  <Typography className={styles.logDetailLabel}>
                                    Remarks:
                                  </Typography>
                                  <Typography className={styles.logDetailValue}>
                                    {log.remarks}
                                  </Typography>
                                </Box>
                              )}

                              {log.callConnected &&
                                formatDuration(log.duration) && (
                                  <Box className={styles.logDetailItem}>
                                    <AccessTime
                                      className={styles.durationIcon}
                                    />
                                    <Typography
                                      className={styles.logDurationValue}
                                    >
                                      {formatDuration(log.duration)}
                                    </Typography>
                                  </Box>
                                )}
                            </Box>
                          </Box>
                        </ListItem>
                        {index < filteredCallLog.length - 1 && (
                          <Divider className={styles.logDivider} />
                        )}
                      </React.Fragment>
                    ))
                  )}
                </List>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && agent && currentUser && (
        <ExoPhones
          agentId={agent.id}
          agentCollection={currentUser.role === "teamlead" ? "mswasth" : currentUser.email.split("@")[0]}
          onStartCall={startCall}
          onEndCall={endCall}
        />
      )}

      {tabValue === 2 && agent && currentUser && (
        <ManualLeads
          agentId={agent.id}
          agentCollection={currentUser.role === "teamlead" ? "mswasth" : currentUser.email.split("@")[0]}
          onStartCall={startCall}
          onEndCall={endCall}
        />
      )}

      {tabValue === 3 && agent && currentUser && (
        <InboundCalls
          agentId={agent.id}
          agentCollection={currentUser.role === "teamlead" ? "mswasth" : currentUser.email.split("@")[0]}
          agentName={agent.name}
        />
      )}
    </Box>
  );
};

export default AgentView;
