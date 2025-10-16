import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Paper,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
} from "@mui/material";
import {
  Person,
  Circle,
  TrendingUp,
  AccessTime,
  Business,
  Logout as LogoutIcon,
  FileDownload,
  PersonAdd,
} from "@mui/icons-material";
import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  getDoc,
  doc,
  Timestamp,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import styles from "./ManagerDashboard.module.css";
import { useNavigate } from "react-router-dom";

function ManagerDashboard({ currentUser }) {
  const [agents, setAgents] = useState([]);
  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [csvFilter, setCsvFilter] = useState("all");
  const [openAddUserDialog, setOpenAddUserDialog] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
    id: "",
    mobile: "",
    role: "agent",
    designation: "RE",
  });
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  // Current time as a Firestore Timestamp for ongoing calls (09:59 PM IST, October 08, 2025)
  const currentTime = Timestamp.fromDate(new Date("2025-10-08T21:59:00+05:30"));

  useEffect(() => {
    let mounted = true;
    if (!currentUser || !currentUser.uid) {
      if (mounted) setLoading(false);
      return;
    }

    // Verify manager role
    const fetchManagerRole = async () => {
      try {
        const userDoc = await getDoc(doc(db, "admin", currentUser.uid));
        if (userDoc.exists() && userDoc.data().role === "manager") {
          const agentCollections = [];
          for (let i = 1; i <= 31; i++) {
            agentCollections.push(`agent${i}`);
          }

          const allUnsubscribes = [];

          // Also listen to mswasth collection for TL call logs
          const mswasthRef = collection(db, "mswasth");
          const tlUnsubscribe = onSnapshot(
            mswasthRef,
            (snapshot) => {
              if (!mounted) return;
              snapshot.docs.forEach((tlDoc) => {
                const tlData = tlDoc.data();
                const tlId = tlDoc.id;

                // Only process Team Leaders
                if (tlData.role === "teamlead") {
                  const tlCallLogsRef = collection(db, "mswasth", tlId, "callLogs");
                  const tlLogsUnsubscribe = onSnapshot(
                    tlCallLogsRef,
                    (logsSnapshot) => {
                      if (!mounted) return;
                      const logs = logsSnapshot.docs.map((log) => {
                        const data = log.data();
                        let startTime = null;
                        let endTime = null;
                        if (data.startTime instanceof Timestamp) {
                          startTime = data.startTime.toDate();
                        } else if (typeof data.startTime === "string") {
                          startTime = new Date(data.startTime);
                          if (isNaN(startTime)) startTime = null;
                        }
                        if (data.endTime instanceof Timestamp) {
                          endTime = data.endTime.toDate();
                        } else if (typeof data.endTime === "string") {
                          endTime = new Date(data.endTime);
                          if (isNaN(endTime)) endTime = null;
                        }
                        return {
                          id: log.id,
                          ...data,
                          timestamp: data.timestamp
                            ? data.timestamp instanceof Timestamp
                              ? data.timestamp.toDate()
                              : new Date(data.timestamp)
                            : null,
                          startTime,
                          endTime,
                          agentId: tlId,
                          collectionName: "mswasth",
                        };
                      });
                      logs.sort((a, b) => (b.startTime || 0) - (a.startTime || 0));
                      const totalCalls = logs.length;
                      const connectedCalls = logs.filter((log) => log.callConnected).length;
                      const disconnectedCalls = totalCalls - connectedCalls;
                      const performance =
                        totalCalls > 0 ? Math.round((connectedCalls / totalCalls) * 100) : 0;

                      if (mounted) {
                        setAgents((prevAgents) => {
                          const existingTLIndex = prevAgents.findIndex(
                            (a) => a.id === tlId && a.collection === "mswasth"
                          );
                          if (existingTLIndex > -1) {
                            const updatedAgents = [...prevAgents];
                            updatedAgents[existingTLIndex] = {
                              id: tlId,
                              collection: "mswasth",
                              name: tlData.name || "Unknown TL",
                              status: tlData.status || "Idle",
                              avatar: tlData.avatar || tlData.name?.charAt(0)?.toUpperCase() || "TL",
                              department: "Team Lead",
                              performance,
                              totalCalls,
                              connectedCalls,
                              disconnectedCalls,
                            };
                            return updatedAgents;
                          } else {
                            return [
                              ...prevAgents,
                              {
                                id: tlId,
                                collection: "mswasth",
                                name: tlData.name || "Unknown TL",
                                status: tlData.status || "Idle",
                                avatar: tlData.avatar || tlData.name?.charAt(0)?.toUpperCase() || "TL",
                                department: "Team Lead",
                                performance,
                                totalCalls,
                                connectedCalls,
                                disconnectedCalls,
                              },
                            ];
                          }
                        });

                        setCallLogs((prevLogs) => [
                          ...prevLogs.filter(
                            (log) => log.agentId !== tlId || log.collectionName !== "mswasth"
                          ),
                          ...logs,
                        ]);
                      }
                    },
                    (error) => {
                      console.error(`Error fetching TL call logs for ${tlId}:`, error);
                    }
                  );
                  allUnsubscribes.push(tlLogsUnsubscribe);
                }
              });
            },
            (error) => {
              console.error("Error fetching TL data:", error);
            }
          );
          allUnsubscribes.push(tlUnsubscribe);

          agentCollections.forEach((collectionName) => {
            const agentsRef = collection(db, collectionName);
            const unsubscribe = onSnapshot(
              agentsRef,
              (snapshot) => {
                if (!mounted) return;
                const agentDocs = snapshot.docs.map((agentDoc) => {
                  const agentData = agentDoc.data();
                  const agentId = agentDoc.id;
                  const callLogsRef = collection(
                    db,
                    collectionName,
                    agentId,
                    "callLogs"
                  );
                  const logsUnsubscribe = onSnapshot(
                    callLogsRef,
                    (logsSnapshot) => {
                      if (!mounted) return;
                      const logs = logsSnapshot.docs.map((log) => {
                        const data = log.data();
                        let startTime = null;
                        let endTime = null;
                        if (data.startTime instanceof Timestamp) {
                          startTime = data.startTime.toDate();
                        } else if (typeof data.startTime === "string") {
                          startTime = new Date(data.startTime);
                          if (isNaN(startTime)) {
                            console.warn(
                              `Invalid startTime string for ${collectionName}/${agentId}/${log.id}:`,
                              data.startTime
                            );
                            startTime = null;
                          }
                        } else {
                          console.warn(
                            `Unexpected startTime type for ${collectionName}/${agentId}/${log.id}:`,
                            typeof data.startTime
                          );
                        }
                        if (data.endTime instanceof Timestamp) {
                          endTime = data.endTime.toDate();
                        } else if (typeof data.endTime === "string") {
                          endTime = new Date(data.endTime);
                          if (isNaN(endTime)) {
                            console.warn(
                              `Invalid endTime string for ${collectionName}/${agentId}/${log.id}:`,
                              data.endTime
                            );
                            endTime = null;
                          }
                        } else {
                          console.warn(
                            `Unexpected endTime type for ${collectionName}/${agentId}/${log.id}:`,
                            typeof data.endTime
                          );
                        }
                        return {
                          id: log.id,
                          ...data,
                          timestamp: data.timestamp
                            ? data.timestamp instanceof Timestamp
                              ? data.timestamp.toDate()
                              : new Date(data.timestamp)
                            : null,
                          startTime,
                          endTime,
                          agentId,
                          collectionName,
                        };
                      });
                      logs.sort(
                        (a, b) => (b.startTime || 0) - (a.startTime || 0)
                      );
                      const totalCalls = logs.length;
                      const connectedCalls = logs.filter(
                        (log) => log.callConnected
                      ).length;
                      const disconnectedCalls = totalCalls - connectedCalls;
                      const performance =
                        totalCalls > 0
                          ? Math.round((connectedCalls / totalCalls) * 100)
                          : 0;

                      if (mounted) {
                        setAgents((prevAgents) => {
                          const existingAgentIndex = prevAgents.findIndex(
                            (a) =>
                              a.id === agentId &&
                              a.collection === collectionName
                          );
                          if (existingAgentIndex > -1) {
                            const updatedAgents = [...prevAgents];
                            updatedAgents[existingAgentIndex] = {
                              id: agentId,
                              collection: collectionName,
                              name: agentData.name || "Unknown Agent",
                              status: agentData.status || "Idle",
                              avatar:
                                agentData.avatar ||
                                agentId.slice(0, 2).toUpperCase(),
                              department: agentData.department || "Unknown",
                              performance,
                              totalCalls,
                              connectedCalls,
                              disconnectedCalls,
                            };
                            return updatedAgents;
                          } else {
                            return [
                              ...prevAgents,
                              {
                                id: agentId,
                                collection: collectionName,
                                name: agentData.name || "Unknown Agent",
                                status: agentData.status || "Idle",
                                avatar:
                                  agentData.avatar ||
                                  agentId.slice(0, 2).toUpperCase(),
                                department: agentData.department || "Unknown",
                                performance,
                                totalCalls,
                                connectedCalls,
                                disconnectedCalls,
                              },
                            ];
                          }
                        });

                        setCallLogs((prevLogs) => [
                          ...prevLogs.filter(
                            (log) =>
                              log.agentId !== agentId ||
                              log.collectionName !== collectionName
                          ),
                          ...logs,
                        ]);
                      }
                    },
                    (error) => {
                      console.error(
                        `Error fetching call logs for ${collectionName}/${agentId}:`,
                        error
                      );
                    }
                  );
                  allUnsubscribes.push(logsUnsubscribe);
                  return {
                    id: agentDoc.id,
                    collection: collectionName,
                    name: agentData.name || "Unknown Agent",
                    status: agentData.status || "Idle",
                    avatar:
                      agentData.avatar || agentId.slice(0, 2).toUpperCase(),
                    department: agentData.department || "Unknown",
                  };
                });

                if (mounted) {
                  setAgents((prevAgents) => [
                    ...prevAgents.filter(
                      (a) => !agentCollections.includes(a.collection)
                    ),
                    ...agentDocs,
                  ]);
                  setLoading(false);
                }
              },
              (error) => {
                console.error(
                  `Error fetching agents for ${collectionName}:`,
                  error
                );
                if (mounted) setLoading(false);
              }
            );

            allUnsubscribes.push(unsubscribe);
          });

          return () => allUnsubscribes.forEach((unsub) => unsub());
        } else {
          if (mounted) {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error in fetchManagerRole:", error);
        if (mounted) setLoading(false);
      }
    };

    fetchManagerRole();

    return () => {
      mounted = false;
    };
  }, [currentUser]);

  const formatDuration = (duration) => {
    if (
      !duration ||
      typeof duration !== "object" ||
      (!duration.hours && !duration.minutes && !duration.seconds)
    )
      return "N/A";
    return `${duration.hours || 0}h ${duration.minutes || 0}m ${
      duration.seconds || 0
    }s`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp || isNaN(timestamp)) return "N/A";
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

  const calculateActualTime = (startTime, endTime) => {
    if (!startTime || isNaN(startTime)) return "N/A";
    const end = endTime || currentTime.toDate();
    const diffMs = end - startTime;
    if (diffMs < 0) return "N/A"; // Invalid case
    const diffSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = diffSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
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
      "Actual Time",
    ];

    const rows = filteredLogs.map((log) => {
      const agent = agents.find(
        (a) => a.id === log.agentId && a.collection === log.collectionName
      );
      return [
        log.agentId || "N/A",
        agent ? agent.name || "Unknown Agent" : "N/A",
        agent ? agent.department || "Unknown" : "N/A",
        agent ? agent.status || "Idle" : "N/A",
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
        formatDuration(log.duration),
        calculateActualTime(log.startTime, log.endTime),
      ];
    });

    // Add a fallback row for each agent with no call logs
    if (rows.length === 0) {
      agents.forEach((agent) => {
        rows.push([
          agent.id || "N/A",
          agent.name || "N/A",
          agent.department || "N/A",
          agent.status || "N/A",
          "N/A",
          "N/A",
          "N/A",
          "N/A",
          "N/A",
          "N/A",
          "N/A",
          "N/A",
          "N/A",
          "N/A",
          "N/A",
          "N/A",
        ]);
      });
    }

    // Convert to CSV string
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map(
            (field) => `"${String(field).replace(/"/g, '""')}"` // Escape quotes
          )
          .join(",")
      ),
    ].join("\n");

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "manager_dashboard_all_agents.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box className={styles.container}>
        <Typography variant="h5">Loading agent data...</Typography>
      </Box>
    );
  }

  if (!agents || agents.length === 0) {
    return (
      <Box className={styles.container}>
        <Typography variant="h5" color="error">
          No agent data available
        </Typography>
      </Box>
    );
  }

  const getStatusChip = (status) => {
    const statusConfig = {
      Busy: {
        color: "info",
        icon: <Circle sx={{ fontSize: 12, color: "inherit" }} />,
        label: "On Call",
        className: styles.statusAvailable,
      },
      Idle: {
        color: "success",
        icon: <Circle sx={{ fontSize: 12, color: "inherit" }} />,
        label: "Available",
        className: styles.statusAvailable,
      },
      "On Call": {
        color: "info",
        icon: <Circle sx={{ fontSize: 12, color: "inherit" }} />,
        label: "On Call",
        className: styles.statusAvailable,
      },
      Break: {
        color: "warning",
        icon: <AccessTime sx={{ fontSize: 12, color: "inherit" }} />,
        label: "On Break",
        className: styles.statusBreak,
      },
      Logout: {
        color: "default",
        icon: <LogoutIcon sx={{ fontSize: 12, color: "inherit" }} />,
        label: "Logged Out",
        className: styles.statusChip,
      },
    };

    const config = statusConfig[status] || {
      color: "default",
      icon: <Circle sx={{ fontSize: 12, color: "inherit" }} />,
      label: status,
      className: styles.statusChip,
    };

    return (
      <Chip
        icon={config.icon}
        label={config.label}
        size="small"
        className={`${styles.statusChip} ${config.className}`}
        sx={{
          "& .MuiChip-icon": {
            marginLeft: "8px",
            marginRight: "-4px",
          },
        }}
      />
    );
  };

  const getDepartmentIcon = (department) => {
    const icons = {
      Sales: <TrendingUp sx={{ fontSize: 16 }} />,
      Support: <Person sx={{ fontSize: 16 }} />,
      Marketing: <Business sx={{ fontSize: 16 }} />,
      Technical: <Business sx={{ fontSize: 16 }} />,
    };
    return icons[department] || <Business sx={{ fontSize: 16 }} />;
  };

  const handleCardClick = (agentId, collectionName) => {
    navigate(`/agent-details/${collectionName}/${agentId}`);
  };

  const handleCreateUser = async () => {
    // Validate inputs
    if (!newUserData.name || !newUserData.email || !newUserData.password || !newUserData.id || !newUserData.mobile) {
      alert("Please fill in all required fields");
      return;
    }

    setCreating(true);

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUserData.email,
        newUserData.password
      );
      const user = userCredential.user;

      // Create user document in mswasth collection
      const userDocData = {
        name: newUserData.name,
        email: newUserData.email,
        id: newUserData.id,
        mobile: newUserData.mobile,
        role: newUserData.role,
        designation: newUserData.designation,
        status: "Logout",
        department: newUserData.role === "agent" ? "Sales" : "Management",
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
      };

      // If creating a TL, add teamMembers array
      if (newUserData.role === "teamlead") {
        userDocData.teamMembers = [];
      }

      await setDoc(doc(db, "mswasth", user.uid), userDocData);

      alert(`${newUserData.role === "agent" ? "Agent" : "Team Lead"} created successfully!`);

      // Reset form and close dialog
      setNewUserData({
        name: "",
        email: "",
        password: "",
        id: "",
        mobile: "",
        role: "agent",
        designation: "RE",
      });
      setOpenAddUserDialog(false);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error.code === "auth/email-already-in-use") {
        alert("This email is already in use. Please use a different email.");
      } else if (error.code === "auth/weak-password") {
        alert("Password should be at least 6 characters.");
      } else {
        alert("Error creating user: " + error.message);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Box
      className={styles.container}
      sx={{
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
        minHeight: "100vh",
        position: "relative",
        zIndex: 1,
      }}
    >
      <Paper elevation={0} className={styles.header}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              className={styles.headerTitle}
            >
              Manager Dashboard
            </Typography>
            <Typography variant="subtitle1" className={styles.headerSubtitle}>
              Monitor your team's real-time status and performance
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <FormControl
              size="small"
              sx={{
                minWidth: 120,
                "& .MuiOutlinedInput-root": {
                  color: "#f1f5f9",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  "& fieldset": {
                    borderColor: "rgba(241, 245, 249, 0.2)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(241, 245, 249, 0.4)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#22c55e",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(241, 245, 249, 0.7)",
                  "&.Mui-focused": {
                    color: "#22c55e",
                  },
                },
              }}
            >
              <InputLabel id="csv-filter-label">CSV Filter</InputLabel>
              <Select
                labelId="csv-filter-label"
                value={csvFilter}
                onChange={(e) => setCsvFilter(e.target.value)}
                label="CSV Filter"
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: "#1e293b",
                      color: "#f1f5f9",
                      "& .MuiMenuItem-root": {
                        "&:hover": {
                          backgroundColor: "rgba(34, 197, 94, 0.1)",
                        },
                        "&.Mui-selected": {
                          backgroundColor: "rgba(34, 197, 94, 0.2)",
                          "&:hover": {
                            backgroundColor: "rgba(34, 197, 94, 0.3)",
                          },
                        },
                      },
                    },
                  },
                }}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="daily">Daily (24h)</MenuItem>
                <MenuItem value="weekly">Weekly (7d)</MenuItem>
                <MenuItem value="monthly">Monthly (30d)</MenuItem>
              </Select>
            </FormControl>
            <Button
              onClick={handleDownloadCSV}
              sx={{
                color: "#f1f5f9",
                background: "linear-gradient(135deg, #22c55e, #4ade80)",
                borderRadius: "12px",
                px: 2,
                py: 1,
                fontWeight: 500,
                textTransform: "none",
                fontSize: "0.9rem",
                transition: "all 0.3s ease",
                "&:hover": {
                  background: "linear-gradient(135deg, #16a34a, #22c55e)",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(34, 197, 94, 0.4)",
                },
              }}
              startIcon={<FileDownload />}
              className={styles.downloadCsvButton}
              aria-label="Download all agents data as CSV"
            >
              Download CSV
            </Button>
            <Button
              onClick={() => setOpenAddUserDialog(true)}
              sx={{
                color: "#f1f5f9",
                background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
                borderRadius: "12px",
                px: 2,
                py: 1,
                fontWeight: 500,
                textTransform: "none",
                fontSize: "0.9rem",
                transition: "all 0.3s ease",
                "&:hover": {
                  background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)",
                },
              }}
              startIcon={<PersonAdd />}
              aria-label="Add new agent or team lead"
            >
              Add New User
            </Button>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={2} className={styles.statsContainer}>
        <Grid item xs={6} sm={3}>
          <Paper
            elevation={0}
            className={`${styles.statCard} ${styles.statAvailable}`}
          >
            <Typography variant="h6" className={styles.statNumber}>
              {agents.filter((a) => a.status === "Idle").length}
            </Typography>
            <Typography variant="caption" className={styles.statLabel}>
              Available
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper
            elevation={0}
            className={`${styles.statCard} ${styles.statAvailable}`}
          >
            <Typography variant="h6" className={styles.statNumber}>
              {
                agents.filter(
                  (a) => a.status === "Busy" || a.status === "On Call"
                ).length
              }
            </Typography>
            <Typography variant="caption" className={styles.statLabel}>
              On Call
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper
            elevation={0}
            className={`${styles.statCard} ${styles.statBreak}`}
          >
            <Typography variant="h6" className={styles.statNumber}>
              {agents.filter((a) => a.status === "Break").length}
            </Typography>
            <Typography variant="caption" className={styles.statLabel}>
              On Break
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper
            elevation={0}
            className={`${styles.statCard} ${styles.statTotal}`}
          >
            <Typography variant="h6" className={styles.statNumber}>
              {agents.filter((a) => a.status === "Logout").length}
            </Typography>
            <Typography variant="caption" className={styles.statLabel}>
              Logged Out
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper
            elevation={0}
            className={`${styles.statCard} ${styles.statTotal}`}
          >
            <Typography variant="h6" className={styles.statNumber}>
              {agents.length}
            </Typography>
            <Typography variant="caption" className={styles.statLabel}>
              Total Agents
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <div className={styles.agentsContainer}>
        <Typography variant="h5" className={styles.sectionTitle}>
          Team Members
        </Typography>
        <div className={styles.agentsGrid}>
          {agents.map((agent) => (
            <Card
              key={`${agent.collection}-${agent.id}`}
              elevation={0}
              className={styles.agentCard}
              onClick={() => handleCardClick(agent.id, agent.collection)}
              style={{ cursor: "pointer" }}
            >
              <CardContent sx={{ padding: 3 }}>
                <div className={styles.agentHeader}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div className={styles.agentAvatar}>{agent.avatar}</div>
                    <div className={styles.agentInfo}>
                      <h3>{agent.name}</h3>
                      <p>
                        <span className={styles.departmentIcon}>
                          {getDepartmentIcon(agent.department)}
                        </span>
                        {agent.department}
                      </p>
                    </div>
                  </div>
                  {getStatusChip(agent.status)}
                </div>

                <div className={styles.performanceSection}>
                  <div className={styles.statusBox}>
                    <p className={styles.performanceLabel}>Performance</p>
                    <p className={styles.performanceText}>
                      {agent.performance}%
                    </p>
                  </div>
                  <div className={styles.performanceBar}>
                    <div
                      className={styles.performanceFill}
                      style={{
                        width: `${agent.performance}%`,
                        backgroundColor: "#4caf50",
                        height: "8px",
                        borderRadius: "4px",
                        transition: "width 0.3s ease-in-out",
                      }}
                    />
                  </div>
                  <div className={styles.callStats}>
                    <Typography variant="caption" className={styles.callLabel}>
                      Total Calls: {agent.totalCalls}
                    </Typography>
                    <Typography variant="caption" className={styles.callLabel}>
                      Connected: {agent.connectedCalls}
                    </Typography>
                    <Typography variant="caption" className={styles.callLabel}>
                      Disconnected: {agent.disconnectedCalls}
                    </Typography>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Add New User Dialog */}
      <Dialog
        open={openAddUserDialog}
        onClose={() => !creating && setOpenAddUserDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "#1e293b",
            color: "#f1f5f9",
            borderRadius: "16px",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontSize: "1.5rem",
            fontWeight: 600,
            borderBottom: "1px solid rgba(241, 245, 249, 0.1)",
          }}
        >
          Add New User
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              label="Full Name"
              value={newUserData.name}
              onChange={(e) =>
                setNewUserData({ ...newUserData, name: e.target.value })
              }
              fullWidth
              required
              disabled={creating}
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "#f1f5f9",
                  "& fieldset": {
                    borderColor: "rgba(241, 245, 249, 0.2)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(241, 245, 249, 0.4)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#3b82f6",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(241, 245, 249, 0.7)",
                  "&.Mui-focused": {
                    color: "#3b82f6",
                  },
                },
              }}
            />
            <TextField
              label="Email"
              type="email"
              value={newUserData.email}
              onChange={(e) =>
                setNewUserData({ ...newUserData, email: e.target.value })
              }
              fullWidth
              required
              disabled={creating}
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "#f1f5f9",
                  "& fieldset": {
                    borderColor: "rgba(241, 245, 249, 0.2)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(241, 245, 249, 0.4)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#3b82f6",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(241, 245, 249, 0.7)",
                  "&.Mui-focused": {
                    color: "#3b82f6",
                  },
                },
              }}
            />
            <TextField
              label="Password"
              type="password"
              value={newUserData.password}
              onChange={(e) =>
                setNewUserData({ ...newUserData, password: e.target.value })
              }
              fullWidth
              required
              disabled={creating}
              helperText="Minimum 6 characters"
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "#f1f5f9",
                  "& fieldset": {
                    borderColor: "rgba(241, 245, 249, 0.2)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(241, 245, 249, 0.4)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#3b82f6",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(241, 245, 249, 0.7)",
                  "&.Mui-focused": {
                    color: "#3b82f6",
                  },
                },
                "& .MuiFormHelperText-root": {
                  color: "rgba(241, 245, 249, 0.5)",
                },
              }}
            />
            <TextField
              label="User ID (e.g., MS01234)"
              value={newUserData.id}
              onChange={(e) =>
                setNewUserData({ ...newUserData, id: e.target.value })
              }
              fullWidth
              required
              disabled={creating}
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "#f1f5f9",
                  "& fieldset": {
                    borderColor: "rgba(241, 245, 249, 0.2)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(241, 245, 249, 0.4)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#3b82f6",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(241, 245, 249, 0.7)",
                  "&.Mui-focused": {
                    color: "#3b82f6",
                  },
                },
              }}
            />
            <TextField
              label="Mobile Number"
              value={newUserData.mobile}
              onChange={(e) =>
                setNewUserData({ ...newUserData, mobile: e.target.value })
              }
              fullWidth
              required
              disabled={creating}
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "#f1f5f9",
                  "& fieldset": {
                    borderColor: "rgba(241, 245, 249, 0.2)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(241, 245, 249, 0.4)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#3b82f6",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(241, 245, 249, 0.7)",
                  "&.Mui-focused": {
                    color: "#3b82f6",
                  },
                },
              }}
            />
            <TextField
              label="Designation"
              value={newUserData.designation}
              onChange={(e) =>
                setNewUserData({ ...newUserData, designation: e.target.value })
              }
              fullWidth
              disabled={creating}
              placeholder="e.g., RE, SE, TL"
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "#f1f5f9",
                  "& fieldset": {
                    borderColor: "rgba(241, 245, 249, 0.2)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(241, 245, 249, 0.4)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#3b82f6",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(241, 245, 249, 0.7)",
                  "&.Mui-focused": {
                    color: "#3b82f6",
                  },
                },
              }}
            />
            <FormControl component="fieldset" disabled={creating}>
              <FormLabel
                component="legend"
                sx={{
                  color: "rgba(241, 245, 249, 0.7)",
                  "&.Mui-focused": {
                    color: "#3b82f6",
                  },
                }}
              >
                Role
              </FormLabel>
              <RadioGroup
                value={newUserData.role}
                onChange={(e) =>
                  setNewUserData({ ...newUserData, role: e.target.value })
                }
                row
              >
                <FormControlLabel
                  value="agent"
                  control={
                    <Radio
                      sx={{
                        color: "rgba(241, 245, 249, 0.5)",
                        "&.Mui-checked": {
                          color: "#3b82f6",
                        },
                      }}
                    />
                  }
                  label="Agent"
                  sx={{ color: "#f1f5f9" }}
                />
                <FormControlLabel
                  value="teamlead"
                  control={
                    <Radio
                      sx={{
                        color: "rgba(241, 245, 249, 0.5)",
                        "&.Mui-checked": {
                          color: "#3b82f6",
                        },
                      }}
                    />
                  }
                  label="Team Lead"
                  sx={{ color: "#f1f5f9" }}
                />
              </RadioGroup>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            borderTop: "1px solid rgba(241, 245, 249, 0.1)",
            px: 3,
            py: 2,
          }}
        >
          <Button
            onClick={() => setOpenAddUserDialog(false)}
            disabled={creating}
            sx={{
              color: "#f1f5f9",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "rgba(241, 245, 249, 0.1)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateUser}
            disabled={creating}
            sx={{
              color: "#f1f5f9",
              background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
              borderRadius: "8px",
              px: 3,
              textTransform: "none",
              "&:hover": {
                background: "linear-gradient(135deg, #2563eb, #3b82f6)",
              },
              "&:disabled": {
                background: "rgba(59, 130, 246, 0.3)",
                color: "rgba(241, 245, 249, 0.5)",
              },
            }}
          >
            {creating ? "Creating..." : "Create User"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ManagerDashboard;