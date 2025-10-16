import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  List,
  ListItem,
  Divider,
  Paper,
  Chip,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Phone,
  AccessTime,
  ArrowBack,
  FileDownload,
  Close,
  PhoneInTalk,
  Assignment,
  PhoneCallback,
} from "@mui/icons-material";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import styles from "./AgentDetails.module.css";

function AgentDetails() {
  const { collectionName, agentId } = useParams();
  const [agent, setAgent] = useState(null);
  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [csvFilter, setCsvFilter] = useState("all"); // all, daily, weekly, monthly
  const navigate = useNavigate();

  useEffect(() => {
    let agentUnsubscribe;
    let callLogsUnsubscribe;
    let exoCallDetailsUnsubscribe;
    let inboundCallsUnsubscribe;

    const fetchAgentData = async () => {
      try {
        // Fetch agent data
        agentUnsubscribe = onSnapshot(
          doc(db, collectionName, agentId),
          (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data();
              setAgent({
                id: agentId,
                name: userData.name || "Unknown Agent",
                status: userData.status || "Idle",
                avatar: userData.avatar || agentId.slice(0, 2).toUpperCase(),
                department: userData.department || "Unknown",
              });
            } else {
              console.warn(
                "No agent document found for UID:",
                agentId,
                "in",
                collectionName
              );
              setAgent({ id: agentId, name: "Unknown Agent", status: "Idle" });
            }
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching agent data:", error);
            setLoading(false);
          }
        );

        let manualLeadLogs = [];
        let assignedCallLogs = [];
        let inboundCallLogs = [];

        // Fetch manual lead call logs from callLogs collection
        const callLogsRef = collection(db, collectionName, agentId, "callLogs");
        callLogsUnsubscribe = onSnapshot(
          callLogsRef,
          (snapshot) => {
            manualLeadLogs = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp
                ? doc.data().timestamp.toDate()
                : null,
            }));

            // Combine and sort all three collections
            const allLogs = [...manualLeadLogs, ...assignedCallLogs, ...inboundCallLogs];
            allLogs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            setCallLogs(allLogs);
          },
          (error) => {
            console.error("Error fetching call logs:", error);
          }
        );

        // Fetch assigned call logs from exoCallDetails collection
        const exoCallDetailsRef = collection(db, collectionName, agentId, "exoCallDetails");
        exoCallDetailsUnsubscribe = onSnapshot(
          exoCallDetailsRef,
          (snapshot) => {
            assignedCallLogs = snapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                // Map exoCallDetails fields to match callLogs structure
                clientNumber: data.lead,
                agentName: data.agent,
                callerId: data.exophone,
                sid: data.sid,
                callType: data.callType || "Assigned Call",
                timestamp: data.time ? new Date(data.time) : (data.createdAt ? new Date(data.createdAt) : null),
                // exoCallDetails doesn't have these fields, so mark as N/A
                callConnected: true, // Assume connected since call was made
                callStatus: "Call Initiated",
              };
            });

            // Combine and sort all three collections
            const allLogs = [...manualLeadLogs, ...assignedCallLogs, ...inboundCallLogs];
            allLogs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            setCallLogs(allLogs);
          },
          (error) => {
            console.error("Error fetching exo call details:", error);
          }
        );

        // Fetch inbound call logs from inboundCalls collection
        const inboundCallsRef = collection(db, collectionName, agentId, "inboundCalls");
        inboundCallsUnsubscribe = onSnapshot(
          inboundCallsRef,
          (snapshot) => {
            inboundCallLogs = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp
                ? doc.data().timestamp.toDate()
                : null,
            }));

            // Combine and sort all three collections
            const allLogs = [...manualLeadLogs, ...assignedCallLogs, ...inboundCallLogs];
            allLogs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            setCallLogs(allLogs);
          },
          (error) => {
            console.error("Error fetching inbound calls:", error);
          }
        );
      } catch (error) {
        console.error("Error in useEffect:", error);
        setLoading(false);
      }

      return () => {
        if (agentUnsubscribe) agentUnsubscribe();
        if (callLogsUnsubscribe) callLogsUnsubscribe();
        if (exoCallDetailsUnsubscribe) exoCallDetailsUnsubscribe();
        if (inboundCallsUnsubscribe) inboundCallsUnsubscribe();
      };
    };

    fetchAgentData();
  }, [collectionName, agentId]);

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

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    return timestamp.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: true,
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleAssignCall = () => {
    navigate(`/assign-calls/${collectionName}/${agentId}`);
  };

  const handleCallClick = (log) => {
    setSelectedCall(log);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCall(null);
  };

  const handleDownloadCSV = () => {
    // Filter logs based on selected filter
    let filteredLogs = callLogs;
    const now = new Date();

    if (csvFilter === "daily") {
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      filteredLogs = callLogs.filter(log => log.timestamp && log.timestamp >= oneDayAgo);
    } else if (csvFilter === "weekly") {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredLogs = callLogs.filter(log => log.timestamp && log.timestamp >= oneWeekAgo);
    } else if (csvFilter === "monthly") {
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredLogs = callLogs.filter(log => log.timestamp && log.timestamp >= oneMonthAgo);
    }
    // if csvFilter === "all", use all callLogs

    const headers = [
      "Agent ID",
      "Agent Name",
      "Department",
      "Status",
      "Call ID",
      "Client Number",
      "Call Type",
      "Call Category",
      "Partner",
      "Timestamp",
      "Call Connected",
      "Call Status",
      "Not Connected Reason",
      "Remarks",
      "Duration",
      "SID",
      "Caller ID",
    ];

    const rows = filteredLogs.map((log) => [
      agent.id || "N/A",
      agent.name || "N/A",
      agent.department || "N/A",
      agent.status || "N/A",
      log.id || "N/A",
      log.clientNumber || "N/A",
      log.callType || "N/A",
      log.callCategory || "N/A",
      log.partner || "N/A",
      log.timestamp ? formatTimestamp(log.timestamp) : "N/A",
      log.callConnected ? "Connected" : "Not Connected",
      log.callConnected ? log.callStatus || "N/A" : "N/A",
      log.callConnected ? "N/A" : log.notConnectedReason || "N/A",
      log.remarks || "N/A",
      formatDuration(log.duration) || "N/A",
      log.sid || "N/A",
      log.callerId || "N/A",
    ]);

    // Add agent details as the first row if no call logs
    if (rows.length === 0) {
      rows.push([
        agent.id || "N/A",
        agent.name || "N/A",
        agent.department || "N/A",
        agent.status || "N/A",
        "N/A", // Call ID
        "N/A", // Client Number
        "N/A", // Call Type
        "N/A", // Call Category
        "N/A", // Partner
        "N/A", // Timestamp
        "N/A", // Call Connected
        "N/A", // Call Status
        "N/A", // Not Connected Reason
        "N/A", // Remarks
        "N/A", // Duration
        "N/A", // SID
        "N/A", // Caller ID
      ]);
    }

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `agent_${agentId}_details.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box className={styles.container}>
        <Typography variant="h5">Loading agent details...</Typography>
      </Box>
    );
  }

  if (!agent) {
    return (
      <Box className={styles.container}>
        <Typography variant="h5" color="error">
          No agent data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box className={styles.container}>
      <Box className={styles.headerSection}>
        <Button
          onClick={handleBack}
          sx={{
            color: "#f1f5f9",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            borderRadius: "12px",
            px: 1.5,
            py: 0.5,
            fontWeight: 500,
            textTransform: "none",
            fontSize: "0.9rem",
            transition: "all 0.3s ease",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              transform: "translateY(-1px)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            },
            marginRight: "12px",
          }}
          startIcon={<ArrowBack />}
        >
          Back
        </Button>
        <Button
          onClick={handleAssignCall}
          sx={{
            color: "#f1f5f9",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            borderRadius: "12px",
            px: 1.5,
            py: 0.5,
            fontWeight: 500,
            textTransform: "none",
            fontSize: "0.9rem",
            transition: "all 0.3s ease",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              transform: "translateY(-1px)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            },
            marginRight: "12px",
          }}
        >
          Assign Call
        </Button>
        <FormControl
          size="small"
          sx={{
            minWidth: 120,
            marginRight: "12px",
            "& .MuiOutlinedInput-root": {
              color: "#f1f5f9",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              borderRadius: "12px",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.15)",
              },
              "&.Mui-focused": {
                backgroundColor: "rgba(255, 255, 255, 0.15)",
              },
              "& fieldset": {
                border: "none",
              },
            },
            "& .MuiInputLabel-root": {
              color: "#94a3b8",
              "&.Mui-focused": {
                color: "#f1f5f9",
              },
            },
            "& .MuiSelect-icon": {
              color: "#f1f5f9",
            },
          }}
        >
          <InputLabel id="csv-filter-label">CSV Filter</InputLabel>
          <Select
            labelId="csv-filter-label"
            value={csvFilter}
            label="CSV Filter"
            onChange={(e) => setCsvFilter(e.target.value)}
            MenuProps={{
              PaperProps: {
                sx: {
                  backgroundColor: "#1e293b",
                  color: "#f1f5f9",
                  "& .MuiMenuItem-root": {
                    "&:hover": {
                      backgroundColor: "rgba(59, 130, 246, 0.1)",
                    },
                    "&.Mui-selected": {
                      backgroundColor: "rgba(59, 130, 246, 0.2)",
                      "&:hover": {
                        backgroundColor: "rgba(59, 130, 246, 0.3)",
                      },
                    },
                  },
                },
              },
            }}
          >
            <MenuItem value="all">All Time</MenuItem>
            <MenuItem value="daily">Last 24 Hours</MenuItem>
            <MenuItem value="weekly">Last 7 Days</MenuItem>
            <MenuItem value="monthly">Last 30 Days</MenuItem>
          </Select>
        </FormControl>
        <Button
          onClick={handleDownloadCSV}
          sx={{
            color: "#f1f5f9",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            borderRadius: "12px",
            px: 1.5,
            py: 0.5,
            fontWeight: 500,
            textTransform: "none",
            fontSize: "0.9rem",
            transition: "all 0.3s ease",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              transform: "translateY(-1px)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            },
            marginRight: "12px",
          }}
          startIcon={<FileDownload />}
        >
          Download CSV
        </Button>
        <Avatar className={styles.agentAvatar}>{agent.avatar}</Avatar>
        <Box>
          <Typography variant="h4" className={styles.agentName}>
            {agent.name}
          </Typography>
          <Typography variant="subtitle1" className={styles.agentInfo}>
            {agent.department} | Status: {agent.status}
          </Typography>
        </Box>
      </Box>

      <Paper className={styles.logPaper} elevation={0}>
        <Typography variant="h5" className={styles.logTitle}>
          Call History (All Time)
        </Typography>
        <List disablePadding className={styles.logList}>
          {callLogs.length === 0 ? (
            <ListItem className={styles.emptyLogItem}>
              <Box className={styles.emptyState}>
                <Phone className={styles.emptyIcon} />
                <Typography className={styles.emptyText}>
                  No calls logged
                </Typography>
              </Box>
            </ListItem>
          ) : (
            callLogs.map((log, index) => (
              <React.Fragment key={log.id || index}>
                <ListItem
                  className={styles.logItem}
                  onClick={() => handleCallClick(log)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      transform: 'translateX(4px)',
                      transition: 'all 0.2s ease'
                    }
                  }}
                >
                  <Box className={styles.logItemContent}>
                    <Box className={styles.logItemHeader}>
                      <Box className={styles.logItemLeft}>
                        <Box className={styles.phoneIconWrapper}>
                          <Phone className={styles.logPhoneIcon} />
                        </Box>
                        <Box>
                          <Typography className={styles.logPrimary}>
                            {log.clientNumber || "N/A"}
                          </Typography>
                          <Typography className={styles.logTime}>
                            {log.time || "N/A"} |{" "}
                            {log.timestamp
                              ? formatTimestamp(log.timestamp)
                              : "N/A"}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {log.callType && (
                          <Chip
                            icon={
                              log.callType === "Manual Lead" ? <PhoneInTalk /> :
                              log.callType === "Inbound Call" ? <PhoneCallback /> :
                              <Assignment />
                            }
                            label={log.callType}
                            size="small"
                            sx={{
                              backgroundColor:
                                log.callType === "Manual Lead" ? 'rgba(147, 51, 234, 0.2)' :
                                log.callType === "Inbound Call" ? 'rgba(16, 185, 129, 0.2)' :
                                'rgba(59, 130, 246, 0.2)',
                              color:
                                log.callType === "Manual Lead" ? '#a855f7' :
                                log.callType === "Inbound Call" ? '#10b981' :
                                '#3b82f6',
                              border: '1px solid',
                              borderColor:
                                log.callType === "Manual Lead" ? 'rgba(147, 51, 234, 0.3)' :
                                log.callType === "Inbound Call" ? 'rgba(16, 185, 129, 0.3)' :
                                'rgba(59, 130, 246, 0.3)',
                              fontWeight: 600,
                            }}
                          />
                        )}
                        <Chip
                          label={
                            log.callConnected ? "Connected" : "Not Connected"
                          }
                          color={log.callConnected ? "success" : "error"}
                          size="small"
                          className={styles.modernStatusChip}
                        />
                      </Box>
                    </Box>

                    <Box className={styles.logDetails}>
                      <Box className={styles.logDetailItem}>
                        <Typography className={styles.logDetailLabel}>
                          Status:
                        </Typography>
                        <Typography className={styles.logDetailValue}>
                          {log.callConnected
                            ? log.callStatus || "N/A"
                            : log.notConnectedReason || "N/A"}
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
                      {log.callConnected && formatDuration(log.duration) && (
                        <Box className={styles.logDetailItem}>
                          <AccessTime className={styles.durationIcon} />
                          <Typography className={styles.logDurationValue}>
                            {formatDuration(log.duration)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </ListItem>
                {index < callLogs.length - 1 && (
                  <Divider className={styles.logDivider} />
                )}
              </React.Fragment>
            ))
          )}
        </List>
      </Paper>

      {/* Call Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1e293b',
            color: '#f1f5f9',
            borderRadius: '16px',
            border: '1px solid rgba(148, 163, 184, 0.2)',
          }
        }}
      >
        <DialogTitle sx={{
          borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#f1f5f9' }}>
            Call Details
          </Typography>
          <Button
            onClick={handleCloseDialog}
            sx={{ minWidth: 'auto', color: '#94a3b8' }}
          >
            <Close />
          </Button>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedCall && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  {selectedCall.callType && (
                    <Chip
                      icon={
                        selectedCall.callType === "Manual Lead" ? <PhoneInTalk /> :
                        selectedCall.callType === "Inbound Call" ? <PhoneCallback /> :
                        <Assignment />
                      }
                      label={selectedCall.callType}
                      sx={{
                        backgroundColor:
                          selectedCall.callType === "Manual Lead" ? 'rgba(147, 51, 234, 0.2)' :
                          selectedCall.callType === "Inbound Call" ? 'rgba(16, 185, 129, 0.2)' :
                          'rgba(59, 130, 246, 0.2)',
                        color:
                          selectedCall.callType === "Manual Lead" ? '#a855f7' :
                          selectedCall.callType === "Inbound Call" ? '#10b981' :
                          '#3b82f6',
                        border: '1px solid',
                        borderColor:
                          selectedCall.callType === "Manual Lead" ? 'rgba(147, 51, 234, 0.3)' :
                          selectedCall.callType === "Inbound Call" ? 'rgba(16, 185, 129, 0.3)' :
                          'rgba(59, 130, 246, 0.3)',
                        fontWeight: 600,
                      }}
                    />
                  )}
                  <Chip
                    label={selectedCall.callConnected ? "Connected" : "Not Connected"}
                    color={selectedCall.callConnected ? "success" : "error"}
                  />
                </Box>
              </Grid>

              {selectedCall.sid && (
                <Grid item xs={12}>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem', mb: 0.5 }}>
                    Call SID (Exotel ID)
                  </Typography>
                  <Typography sx={{
                    color: '#f1f5f9',
                    fontWeight: 500,
                    fontFamily: 'monospace',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    wordBreak: 'break-all'
                  }}>
                    {selectedCall.sid}
                  </Typography>
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem', mb: 0.5 }}>
                  Client Number
                </Typography>
                <Typography sx={{ color: '#f1f5f9', fontWeight: 500 }}>
                  {selectedCall.clientNumber || "N/A"}
                </Typography>
              </Grid>

              {selectedCall.agentName && (
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem', mb: 0.5 }}>
                    Agent Name
                  </Typography>
                  <Typography sx={{ color: '#f1f5f9', fontWeight: 500 }}>
                    {selectedCall.agentName}
                  </Typography>
                </Grid>
              )}

              {selectedCall.callerId && (
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem', mb: 0.5 }}>
                    ExoPhone (Caller ID)
                  </Typography>
                  <Typography sx={{ color: '#f1f5f9', fontWeight: 500 }}>
                    {selectedCall.callerId}
                  </Typography>
                </Grid>
              )}

              {selectedCall.partner && (
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem', mb: 0.5 }}>
                    Partner
                  </Typography>
                  <Typography sx={{ color: '#f1f5f9', fontWeight: 500 }}>
                    {selectedCall.partner}
                  </Typography>
                </Grid>
              )}

              {selectedCall.callCategory && (
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem', mb: 0.5 }}>
                    Call Category
                  </Typography>
                  <Typography sx={{ color: '#f1f5f9', fontWeight: 500 }}>
                    {selectedCall.callCategory || "N/A"}
                  </Typography>
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem', mb: 0.5 }}>
                  Timestamp
                </Typography>
                <Typography sx={{ color: '#f1f5f9', fontWeight: 500 }}>
                  {selectedCall.timestamp ? formatTimestamp(selectedCall.timestamp) : "N/A"}
                </Typography>
              </Grid>

              {selectedCall.startTime && (
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem', mb: 0.5 }}>
                    Start Time
                  </Typography>
                  <Typography sx={{ color: '#f1f5f9', fontWeight: 500 }}>
                    {new Date(selectedCall.startTime).toLocaleString()}
                  </Typography>
                </Grid>
              )}

              {selectedCall.endTime && (
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem', mb: 0.5 }}>
                    End Time
                  </Typography>
                  <Typography sx={{ color: '#f1f5f9', fontWeight: 500 }}>
                    {new Date(selectedCall.endTime).toLocaleString()}
                  </Typography>
                </Grid>
              )}

              <Grid item xs={12}>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem', mb: 0.5 }}>
                  Call Status
                </Typography>
                <Typography sx={{ color: '#f1f5f9', fontWeight: 500 }}>
                  {selectedCall.callConnected
                    ? selectedCall.callStatus || "N/A"
                    : selectedCall.notConnectedReason || "N/A"}
                </Typography>
              </Grid>

              {selectedCall.callConnected && selectedCall.duration && (
                <Grid item xs={12}>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem', mb: 0.5 }}>
                    Call Duration
                  </Typography>
                  <Typography sx={{ color: '#f1f5f9', fontWeight: 500 }}>
                    {formatDuration(selectedCall.duration) || "N/A"}
                  </Typography>
                </Grid>
              )}

              {selectedCall.remarks && (
                <Grid item xs={12}>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem', mb: 0.5 }}>
                    Remarks
                  </Typography>
                  <Typography sx={{
                    color: '#f1f5f9',
                    fontWeight: 400,
                    backgroundColor: 'rgba(15, 23, 42, 0.4)',
                    padding: '12px',
                    borderRadius: '8px',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selectedCall.remarks}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(148, 163, 184, 0.2)', p: 2 }}>
          <Button
            onClick={handleCloseDialog}
            sx={{
              color: '#f1f5f9',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              '&:hover': {
                backgroundColor: 'rgba(59, 130, 246, 0.3)',
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AgentDetails;
