import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Paper,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Person,
  Circle,
  TrendingUp,
  AccessTime,
  Business,
  Logout as LogoutIcon,
  Group,
  Phone,
} from "@mui/icons-material";
import styles from "./ManagerDashboard.module.css";
import AgentView from "./AgentView";

function TLDashboard({ currentUser }) {
  const [teamAgents, setTeamAgents] = useState([]);
  const [tlData, setTlData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || !currentUser.uid) return;

    let mounted = true;

    const fetchTLDataAndTeam = async () => {
      try {
        // Fetch TL's own data from mswasth collection
        const tlDocRef = doc(db, "mswasth", currentUser.uid);
        const tlDoc = await getDoc(tlDocRef);

        if (tlDoc.exists() && mounted) {
          const tlInfo = tlDoc.data();
          setTlData({ id: currentUser.uid, ...tlInfo });

          // Get team member UIDs from TL document
          const teamMemberUIDs = tlInfo.teamMembers || [];

          // Fetch all agent collections (agent1-agent31)
          const agentCollections = [];
          for (let i = 1; i <= 31; i++) {
            agentCollections.push(`agent${i}`);
          }

          const allUnsubscribes = [];
          const agents = [];

          // Listen to each agent collection
          agentCollections.forEach((collectionName) => {
            const agentsRef = collection(db, collectionName);
            const unsubscribe = onSnapshot(
              agentsRef,
              (snapshot) => {
                if (!mounted) return;

                snapshot.docs.forEach((agentDoc) => {
                  const agentData = agentDoc.data();
                  const agentId = agentDoc.id;

                  // Check if this agent belongs to this TL
                  if (
                    agentData.teamLeadId === currentUser.uid ||
                    teamMemberUIDs.includes(agentId)
                  ) {
                    // Remove old entry for this agent if exists
                    const existingIndex = agents.findIndex(
                      (a) => a.uid === agentId
                    );
                    if (existingIndex > -1) {
                      agents.splice(existingIndex, 1);
                    }

                    // Add updated agent data
                    agents.push({
                      uid: agentId,
                      collection: collectionName,
                      name: agentData.name || "Unknown Agent",
                      email: agentData.email || "",
                      status: agentData.status || "Logout",
                      department: agentData.department || "",
                      avatar: agentData.avatar || agentData.name?.charAt(0) || "A",
                    });
                  }
                });

                if (mounted) {
                  setTeamAgents([...agents]);
                  setLoading(false);
                }
              },
              (error) => {
                console.error(`Error fetching ${collectionName}:`, error);
              }
            );

            allUnsubscribes.push(unsubscribe);
          });

          return () => {
            mounted = false;
            allUnsubscribes.forEach((unsub) => unsub());
          };
        }
      } catch (error) {
        console.error("Error fetching TL data:", error);
        if (mounted) setLoading(false);
      }
    };

    fetchTLDataAndTeam();

    return () => {
      mounted = false;
    };
  }, [currentUser]);

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

  const handleCardClick = (agent) => {
    navigate(`/tl/agent-details/${agent.collection}/${agent.uid}`);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box className={styles.container}>
        <Typography variant="h5">Loading team data...</Typography>
      </Box>
    );
  }

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
        <Box>
          <Typography
            variant="h4"
            component="h1"
            className={styles.headerTitle}
          >
            Team Leader Dashboard
          </Typography>
          <Typography variant="subtitle1" className={styles.headerSubtitle}>
            {tlData?.name} - Managing {teamAgents.length} team member
            {teamAgents.length !== 1 ? "s" : ""}
          </Typography>
        </Box>
      </Paper>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            "& .MuiTab-root": {
              color: "#94a3b8",
              fontWeight: 500,
              textTransform: "none",
              fontSize: "1rem",
              minHeight: "60px",
              "&.Mui-selected": {
                color: "#60a5fa",
              },
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#60a5fa",
              height: "3px",
            },
          }}
        >
          <Tab icon={<Group />} iconPosition="start" label="My Team" />
          <Tab icon={<Phone />} iconPosition="start" label="Log Calls" />
        </Tabs>
      </Box>

      {/* Tab 0: Team View */}
      {activeTab === 0 && (
        <>
          <Grid container spacing={2} className={styles.statsContainer}>
            <Grid item xs={6} sm={3}>
              <Paper
                elevation={0}
                className={`${styles.statCard} ${styles.statAvailable}`}
              >
                <Typography variant="h6" className={styles.statNumber}>
                  {teamAgents.filter((a) => a.status === "Idle").length}
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
                    teamAgents.filter(
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
                  {teamAgents.filter((a) => a.status === "Break").length}
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
                  {teamAgents.length}
                </Typography>
                <Typography variant="caption" className={styles.statLabel}>
                  Total Team
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <div className={styles.agentsContainer}>
            <Typography variant="h5" className={styles.sectionTitle}>
              Team Members
            </Typography>
            <div className={styles.agentsGrid}>
              {teamAgents.length === 0 ? (
                <Typography variant="body1" sx={{ color: "#94a3b8", mt: 4 }}>
                  No team members assigned yet
                </Typography>
              ) : (
                teamAgents.map((agent) => (
                  <Card
                    key={`${agent.collection}-${agent.uid}`}
                    elevation={0}
                    className={styles.agentCard}
                    onClick={() => handleCardClick(agent)}
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
                          <div className={styles.agentAvatar}>
                            {agent.avatar}
                          </div>
                          <div className={styles.agentInfo}>
                            <h3>{agent.name}</h3>
                            {agent.department && (
                              <p>
                                <span className={styles.departmentIcon}>
                                  {getDepartmentIcon(agent.department)}
                                </span>
                                {agent.department}
                              </p>
                            )}
                          </div>
                        </div>
                        {getStatusChip(agent.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Tab 1: Log Calls (Agent View) */}
      {activeTab === 1 && (
        <Box sx={{ mt: 2 }}>
          <AgentView
            currentUser={currentUser}
            onStatusChange={(agentId, newStatus) => {}}
          />
        </Box>
      )}
    </Box>
  );
}

export default TLDashboard;
