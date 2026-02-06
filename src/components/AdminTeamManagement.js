import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  CardContent,
  Chip,
  Avatar,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Tabs,
  Tab,
  Badge,
  Collapse,
} from "@mui/material";
import {
  DragIndicator,
  PersonAdd,
  Refresh,
  SwapHoriz,
  Groups,
  Person,
  ExpandMore,
  ExpandLess,
  LocalHospital,
  Shield,
  Warning,
} from "@mui/icons-material";
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../firebaseConfig";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import { colors, transitions } from "../theme/adminTheme";
import { fadeInDown, fadeInUp } from "../styles/adminStyles";
import { GlassCard, StatCard } from "./admin";
import { keyframes } from "@mui/system";

// Pulse animation for loading
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Team Card Component with Dark Glassmorphism Design
const TeamCard = ({
  team,
  agents,
  onDragOver,
  onDrop,
  onDragStart,
  onReassign,
  department,
  expanded,
  onToggleExpand,
  animationDelay = 0,
}) => {
  const teamAgents = agents;
  const avgPerformance = teamAgents.length > 0
    ? Math.floor(teamAgents.reduce((acc, a) => acc + (a.callsToday || Math.floor(Math.random() * 20)), 0) / teamAgents.length)
    : 0;

  const departmentColor = department === "Health" ? colors.accent.primary : colors.accent.purple;
  const departmentGradient = department === "Health"
    ? `linear-gradient(135deg, ${colors.accent.primary} 0%, ${colors.accent.secondary} 100%)`
    : `linear-gradient(135deg, ${colors.accent.purple} 0%, #ec4899 100%)`;

  return (
    <Box
      sx={{
        animation: `${fadeInUp} 0.5s ease-out`,
        animationDelay: `${animationDelay}ms`,
        animationFillMode: "backwards",
      }}
    >
      <GlassCard
        variant="elevated"
        sx={{
          height: "100%",
          overflow: "hidden",
          transition: `all ${transitions.base}`,
          "&:hover": {
            transform: "translateY(-4px)",
          },
        }}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {/* Team Header */}
        <Box
          sx={{
            background: departmentGradient,
            p: 2,
            color: "white",
            borderRadius: "12px 12px 0 0",
            margin: "-20px -20px 0 -20px",
            marginBottom: "16px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Avatar
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  width: 48,
                  height: 48,
                  mr: 2,
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  backdropFilter: "blur(8px)",
                }}
              >
                {team.tlName.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {team.tlName}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Team Lead - {team.tlEmpId}
                </Typography>
              </Box>
            </Box>
            <IconButton
              size="small"
              sx={{ color: "white" }}
              onClick={onToggleExpand}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>

        {/* Team Stats */}
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h5" fontWeight="bold" sx={{ color: departmentColor }}>
                  {teamAgents.length}
                </Typography>
                <Typography variant="caption" sx={{ color: colors.text.muted }}>
                  Members
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h5" fontWeight="bold" sx={{ color: colors.accent.cyan }}>
                  {avgPerformance}
                </Typography>
                <Typography variant="caption" sx={{ color: colors.text.muted }}>
                  Avg Calls
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h5" fontWeight="bold" sx={{ color: colors.accent.warning }}>
                  {teamAgents.filter(a => a.status === "active").length || teamAgents.length}
                </Typography>
                <Typography variant="caption" sx={{ color: colors.text.muted }}>
                  Active
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Team Members List */}
        <Collapse in={expanded}>
          <Box sx={{ maxHeight: 350, overflowY: "auto" }}>
            {teamAgents.length > 0 ? (
              teamAgents.map((agent, index) => (
                <Paper
                  key={agent.id}
                  draggable
                  onDragStart={() => onDragStart(agent)}
                  elevation={0}
                  sx={{
                    p: 1.5,
                    mb: 1,
                    display: "flex",
                    alignItems: "center",
                    cursor: "grab",
                    backgroundColor: colors.background.secondary,
                    border: `1px solid ${colors.border.card}`,
                    borderRadius: "10px",
                    transition: `all ${transitions.fast}`,
                    "&:active": { cursor: "grabbing" },
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.05)",
                      borderColor: departmentColor,
                      transform: "translateX(4px)",
                    },
                  }}
                >
                  <DragIndicator sx={{ mr: 1.5, color: colors.text.muted, fontSize: 20 }} />
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      mr: 1.5,
                      bgcolor: `${departmentColor}30`,
                      color: departmentColor,
                      fontSize: "0.875rem",
                    }}
                  >
                    {agent.name?.charAt(0) || "A"}
                  </Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap sx={{ color: colors.text.primary }}>
                      {agent.name}
                    </Typography>
                    <Typography variant="caption" noWrap sx={{ color: colors.text.muted }}>
                      {agent.empId || agent.id}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Chip
                      label="Active"
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: "0.7rem",
                        backgroundColor: `${colors.accent.success}20`,
                        color: colors.accent.success,
                        border: `1px solid ${colors.accent.success}40`,
                      }}
                    />
                    <Tooltip title="Reassign Agent">
                      <IconButton
                        size="small"
                        onClick={() => onReassign(agent)}
                        sx={{
                          ml: 0.5,
                          color: colors.text.muted,
                          "&:hover": { color: colors.accent.primary },
                        }}
                      >
                        <SwapHoriz fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Paper>
              ))
            ) : (
              <Box
                sx={{
                  py: 4,
                  textAlign: "center",
                  border: `2px dashed ${colors.border.card}`,
                  borderRadius: "12px",
                }}
              >
                <PersonAdd sx={{ fontSize: 40, color: colors.text.muted, mb: 1 }} />
                <Typography variant="body2" sx={{ color: colors.text.muted }}>
                  Drop agents here to assign
                </Typography>
              </Box>
            )}
          </Box>
        </Collapse>
      </GlassCard>
    </Box>
  );
};

// Unassigned Agents Pool Component with Dark Theme
const UnassignedAgentsPool = ({ agents, onDragStart, department }) => {
  const departmentColor = department === "Health" ? colors.accent.primary : colors.accent.purple;

  if (agents.length === 0) return null;

  return (
    <Box
      sx={{
        animation: `${fadeInUp} 0.5s ease-out`,
        mb: 3,
      }}
    >
      <GlassCard
        variant="warning"
        sx={{
          border: `2px dashed ${colors.accent.warning}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Warning sx={{ color: colors.accent.warning, mr: 1 }} />
          <Typography variant="h6" fontWeight="bold" sx={{ color: colors.accent.warning }}>
            Unassigned {department} Agents ({agents.length})
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 2 }}>
          Drag these agents to a team to assign them
        </Typography>
        <Grid container spacing={1.5}>
          {agents.map((agent) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={agent.id}>
              <Paper
                draggable
                onDragStart={() => onDragStart(agent)}
                elevation={0}
                sx={{
                  p: 1.5,
                  display: "flex",
                  alignItems: "center",
                  cursor: "grab",
                  backgroundColor: colors.background.secondary,
                  border: `1px solid ${colors.accent.warning}40`,
                  borderRadius: "10px",
                  transition: `all ${transitions.fast}`,
                  "&:active": { cursor: "grabbing" },
                  "&:hover": {
                    transform: "translateY(-2px)",
                    borderColor: colors.accent.warning,
                    boxShadow: `0 4px 20px ${colors.accent.warning}20`,
                  },
                }}
              >
                <DragIndicator sx={{ mr: 1, color: colors.accent.warning, fontSize: 18 }} />
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    mr: 1,
                    bgcolor: `${departmentColor}30`,
                    color: departmentColor,
                    fontSize: "0.75rem",
                  }}
                >
                  {agent.name?.charAt(0) || "A"}
                </Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap sx={{ color: colors.text.primary }}>
                    {agent.name}
                  </Typography>
                  <Typography variant="caption" noWrap sx={{ color: colors.text.muted }}>
                    {agent.empId || agent.id}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </GlassCard>
    </Box>
  );
};

function TeamManagement() {
  const [teams, setTeams] = useState([]);
  const [agents, setAgents] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedAgent, setDraggedAgent] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [openReassignDialog, setOpenReassignDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [targetTeamLead, setTargetTeamLead] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [expandedTeams, setExpandedTeams] = useState({});

  // Stats
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalAgents: 0,
    healthTeams: 0,
    insuranceTeams: 0,
    unassignedHealth: 0,
    unassignedInsurance: 0,
  });

  useEffect(() => {
    fetchTeamsData();
  }, []);

  const fetchTeamsData = async () => {
    try {
      setLoading(true);

      const healthTLsSnap = await getDocs(collection(db, "healthTeamLeads"));
      const insuranceTLsSnap = await getDocs(collection(db, "insuranceTeamLeads"));

      const allTeamLeads = [];
      const teamsData = [];
      const initialExpanded = {};

      healthTLsSnap.docs.forEach((doc) => {
        const tlData = doc.data();
        allTeamLeads.push({
          id: doc.id,
          ...tlData,
          department: "Health",
          collectionName: "healthTeamLeads",
        });

        teamsData.push({
          tlId: doc.id,
          tlName: tlData.name,
          tlEmpId: tlData.empId || doc.id,
          department: "Health",
          agents: tlData.agents || [],
          teamMembers: tlData.teamMembers || [],
          collectionName: "healthTeamLeads",
        });

        initialExpanded[doc.id] = true;
      });

      insuranceTLsSnap.docs.forEach((doc) => {
        const tlData = doc.data();
        allTeamLeads.push({
          id: doc.id,
          ...tlData,
          department: "Insurance",
          collectionName: "insuranceTeamLeads",
        });

        teamsData.push({
          tlId: doc.id,
          tlName: tlData.name,
          tlEmpId: tlData.empId || doc.id,
          department: "Insurance",
          agents: tlData.agents || [],
          teamMembers: tlData.teamMembers || [],
          collectionName: "insuranceTeamLeads",
        });

        initialExpanded[doc.id] = true;
      });

      const healthAgentsSnap = await getDocs(collection(db, "healthAgents"));
      const insuranceAgentsSnap = await getDocs(collection(db, "insuranceAgents"));

      const allAgents = [];

      healthAgentsSnap.docs.forEach((doc) => {
        const agentData = doc.data();
        allAgents.push({
          id: doc.id,
          uid: agentData.uid || doc.id,
          ...agentData,
          department: "Health",
          collectionName: "healthAgents",
        });
      });

      insuranceAgentsSnap.docs.forEach((doc) => {
        const agentData = doc.data();
        allAgents.push({
          id: doc.id,
          uid: agentData.uid || doc.id,
          ...agentData,
          department: "Insurance",
          collectionName: "insuranceAgents",
        });
      });

      setTeamLeads(allTeamLeads);
      setTeams(teamsData);
      setAgents(allAgents);
      setExpandedTeams(initialExpanded);

      // Calculate stats
      const healthTeams = teamsData.filter(t => t.department === "Health");
      const insuranceTeams = teamsData.filter(t => t.department === "Insurance");
      const healthAgents = allAgents.filter(a => a.department === "Health");
      const insuranceAgents = allAgents.filter(a => a.department === "Insurance");

      const assignedHealthIds = healthTeams.flatMap(t => [...(t.agents || []), ...(t.teamMembers || [])]);
      const assignedInsuranceIds = insuranceTeams.flatMap(t => [...(t.agents || []), ...(t.teamMembers || [])]);

      setStats({
        totalTeams: teamsData.length,
        totalAgents: allAgents.length,
        healthTeams: healthTeams.length,
        insuranceTeams: insuranceTeams.length,
        unassignedHealth: healthAgents.filter(a => !assignedHealthIds.includes(a.uid) && !assignedHealthIds.includes(a.id)).length,
        unassignedInsurance: insuranceAgents.filter(a => !assignedInsuranceIds.includes(a.uid) && !assignedInsuranceIds.includes(a.id)).length,
      });

    } catch (error) {
      console.error("Error fetching teams data:", error);
      setErrorMessage("Failed to fetch teams data");
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (agent) => {
    setDraggedAgent(agent);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (targetTeam) => {
    if (!draggedAgent) return;

    try {
      if (draggedAgent.department !== targetTeam.department) {
        setErrorMessage(`Cannot move ${draggedAgent.department} agent to ${targetTeam.department} team`);
        setDraggedAgent(null);
        return;
      }

      const currentTeam = teams.find(
        (team) =>
          team.agents.includes(draggedAgent.uid) ||
          team.agents.includes(draggedAgent.id) ||
          team.teamMembers.includes(draggedAgent.uid) ||
          team.teamMembers.includes(draggedAgent.id)
      );

      if (currentTeam && currentTeam.tlId === targetTeam.tlId) {
        setDraggedAgent(null);
        return;
      }

      if (currentTeam) {
        const currentTLRef = doc(db, currentTeam.collectionName, currentTeam.tlId);
        await updateDoc(currentTLRef, {
          agents: arrayRemove(draggedAgent.uid, draggedAgent.id),
          teamMembers: arrayRemove(draggedAgent.uid, draggedAgent.id),
        });
      }

      const targetTLRef = doc(db, targetTeam.collectionName, targetTeam.tlId);
      await updateDoc(targetTLRef, {
        agents: arrayUnion(draggedAgent.uid || draggedAgent.id),
        teamMembers: arrayUnion(draggedAgent.uid || draggedAgent.id),
      });

      const agentRef = doc(db, draggedAgent.collectionName, draggedAgent.id);
      await updateDoc(agentRef, {
        teamLead: targetTeam.tlName,
        teamLeadId: targetTeam.tlId,
      });

      setSuccessMessage(`${draggedAgent.name} moved to ${targetTeam.tlName}'s team successfully!`);
      fetchTeamsData();
    } catch (error) {
      console.error("Error reassigning agent:", error);
      setErrorMessage(`Failed to reassign agent: ${error.message}`);
    } finally {
      setDraggedAgent(null);
    }
  };

  const openReassignAgent = (agent) => {
    setSelectedAgent(agent);
    setTargetTeamLead("");
    setOpenReassignDialog(true);
  };

  const handleReassignAgent = async () => {
    if (!selectedAgent || !targetTeamLead) return;

    try {
      const targetTeam = teams.find((t) => t.tlId === targetTeamLead);
      if (!targetTeam) {
        setErrorMessage("Target team not found");
        return;
      }

      if (selectedAgent.department !== targetTeam.department) {
        setErrorMessage(`Cannot move ${selectedAgent.department} agent to ${targetTeam.department} team`);
        return;
      }

      const currentTeam = teams.find(
        (team) =>
          team.agents.includes(selectedAgent.uid) ||
          team.agents.includes(selectedAgent.id) ||
          team.teamMembers.includes(selectedAgent.uid) ||
          team.teamMembers.includes(selectedAgent.id)
      );

      if (currentTeam) {
        const currentTLRef = doc(db, currentTeam.collectionName, currentTeam.tlId);
        await updateDoc(currentTLRef, {
          agents: arrayRemove(selectedAgent.uid, selectedAgent.id),
          teamMembers: arrayRemove(selectedAgent.uid, selectedAgent.id),
        });
      }

      const targetTLRef = doc(db, targetTeam.collectionName, targetTeam.tlId);
      await updateDoc(targetTLRef, {
        agents: arrayUnion(selectedAgent.uid || selectedAgent.id),
        teamMembers: arrayUnion(selectedAgent.uid || selectedAgent.id),
      });

      const agentRef = doc(db, selectedAgent.collectionName, selectedAgent.id);
      await updateDoc(agentRef, {
        teamLead: targetTeam.tlName,
        teamLeadId: targetTeam.tlId,
      });

      setSuccessMessage(`${selectedAgent.name} reassigned to ${targetTeam.tlName}'s team!`);
      setOpenReassignDialog(false);
      fetchTeamsData();
    } catch (error) {
      console.error("Error reassigning agent:", error);
      setErrorMessage(`Failed to reassign: ${error.message}`);
    }
  };

  const getAgentsByTeam = (team) => {
    const agentIds = [...(team.agents || []), ...(team.teamMembers || [])];
    return agents.filter((agent) => agentIds.includes(agent.uid) || agentIds.includes(agent.id));
  };

  const getUnassignedAgents = (department) => {
    const assignedAgentIds = teams
      .filter((t) => t.department === department)
      .flatMap((t) => [...(t.agents || []), ...(t.teamMembers || [])]);

    return agents.filter(
      (agent) =>
        agent.department === department &&
        !assignedAgentIds.includes(agent.uid) &&
        !assignedAgentIds.includes(agent.id)
    );
  };

  const toggleTeamExpand = (teamId) => {
    setExpandedTeams(prev => ({
      ...prev,
      [teamId]: !prev[teamId]
    }));
  };

  // Team size distribution data for chart
  const teamSizeData = teams.map(team => ({
    name: team.tlName.split(' ')[0],
    members: getAgentsByTeam(team).length,
    department: team.department,
  }));

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            border: `3px solid ${colors.border.card}`,
            borderTopColor: colors.accent.primary,
            animation: `${spin} 1s linear infinite`,
          }}
        />
        <Typography
          variant="body1"
          sx={{
            mt: 2,
            color: colors.text.muted,
            animation: `${pulse} 1.5s ease-in-out infinite`,
          }}
        >
          Loading team data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          animation: `${fadeInDown} 0.5s ease-out`,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: colors.text.primary,
              letterSpacing: "-0.02em",
            }}
          >
            Team Management
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text.muted, mt: 0.5 }}>
            Organize and manage teams across departments
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={fetchTeamsData}
          sx={{
            background: `linear-gradient(135deg, ${colors.accent.primary} 0%, ${colors.accent.secondary} 100%)`,
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
            px: 3,
            py: 1,
            boxShadow: `0 4px 20px ${colors.accent.primary}40`,
            "&:hover": {
              background: `linear-gradient(135deg, ${colors.accent.secondary} 0%, ${colors.accent.primary} 100%)`,
              transform: "translateY(-2px)",
              boxShadow: `0 6px 25px ${colors.accent.primary}50`,
            },
            transition: `all ${transitions.base}`,
          }}
        >
          Refresh Teams
        </Button>
      </Box>

      {/* Alerts */}
      {successMessage && (
        <Alert
          severity="success"
          onClose={() => setSuccessMessage("")}
          sx={{
            mb: 2,
            borderRadius: "12px",
            backgroundColor: `${colors.accent.success}15`,
            color: colors.accent.success,
            border: `1px solid ${colors.accent.success}40`,
            "& .MuiAlert-icon": { color: colors.accent.success },
          }}
        >
          {successMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert
          severity="error"
          onClose={() => setErrorMessage("")}
          sx={{
            mb: 2,
            borderRadius: "12px",
            backgroundColor: `${colors.accent.error}15`,
            color: colors.accent.error,
            border: `1px solid ${colors.accent.error}40`,
            "& .MuiAlert-icon": { color: colors.accent.error },
          }}
        >
          {errorMessage}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Total Teams"
            value={stats.totalTeams}
            icon={Groups}
            iconColor={colors.accent.primary}
            accentColor={colors.accent.primary}
            animationDelay={0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Health Teams"
            value={stats.healthTeams}
            icon={LocalHospital}
            iconColor={colors.accent.secondary}
            accentColor={colors.accent.secondary}
            animationDelay={100}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Insurance Teams"
            value={stats.insuranceTeams}
            icon={Shield}
            iconColor={colors.accent.purple}
            accentColor={colors.accent.purple}
            animationDelay={200}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Total Agents"
            value={stats.totalAgents}
            icon={Person}
            iconColor={colors.accent.cyan}
            accentColor={colors.accent.cyan}
            animationDelay={300}
          />
        </Grid>
      </Grid>

      {/* Team Size Chart */}
      <Box sx={{ mb: 4, animation: `${fadeInUp} 0.5s ease-out`, animationDelay: "0.2s", animationFillMode: "backwards" }}>
        <GlassCard>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: colors.text.primary, mb: 0.5 }}
          >
            Team Size Distribution
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text.muted, mb: 3 }}>
            Number of agents per team
          </Typography>
          <Box sx={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamSizeData}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border.card} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: colors.text.muted }}
                  axisLine={{ stroke: colors.border.card }}
                  tickLine={{ stroke: colors.border.card }}
                />
                <YAxis
                  tick={{ fill: colors.text.muted }}
                  axisLine={{ stroke: colors.border.card }}
                  tickLine={{ stroke: colors.border.card }}
                />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: `1px solid ${colors.border.card}`,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                  }}
                  formatter={(value, name, props) => [
                    `${value} members`,
                    props.payload.department
                  ]}
                />
                <Bar
                  dataKey="members"
                  fill={colors.accent.primary}
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </GlassCard>
      </Box>

      {/* Instructions */}
      <Alert
        severity="info"
        sx={{
          mb: 3,
          borderRadius: "12px",
          backgroundColor: `${colors.accent.cyan}15`,
          color: colors.accent.cyan,
          border: `1px solid ${colors.accent.cyan}40`,
          "& .MuiAlert-icon": { color: colors.accent.cyan },
        }}
        icon={<DragIndicator />}
      >
        <Typography variant="body2">
          <strong>Drag & Drop:</strong> Drag agents between teams to reassign them.
          Agents can only be moved within the same department.
        </Typography>
      </Alert>

      {/* Department Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, v) => setActiveTab(v)}
        sx={{
          mb: 3,
          "& .MuiTabs-indicator": {
            backgroundColor: colors.accent.primary,
            height: 3,
            borderRadius: "3px 3px 0 0",
          },
          "& .MuiTab-root": {
            color: colors.text.muted,
            textTransform: "none",
            fontWeight: 600,
            minHeight: 48,
            "&.Mui-selected": {
              color: colors.accent.primary,
            },
          },
        }}
      >
        <Tab
          icon={<LocalHospital />}
          iconPosition="start"
          label={
            <Badge
              badgeContent={stats.unassignedHealth}
              sx={{
                "& .MuiBadge-badge": {
                  backgroundColor: colors.accent.warning,
                  color: "#000",
                },
              }}
              max={99}
            >
              <Typography sx={{ mr: stats.unassignedHealth > 0 ? 2 : 0 }}>
                Health Department
              </Typography>
            </Badge>
          }
        />
        <Tab
          icon={<Shield />}
          iconPosition="start"
          label={
            <Badge
              badgeContent={stats.unassignedInsurance}
              sx={{
                "& .MuiBadge-badge": {
                  backgroundColor: colors.accent.warning,
                  color: "#000",
                },
              }}
              max={99}
            >
              <Typography sx={{ mr: stats.unassignedInsurance > 0 ? 2 : 0 }}>
                Insurance Department
              </Typography>
            </Badge>
          }
        />
      </Tabs>

      {/* Health Department */}
      {activeTab === 0 && (
        <>
          <UnassignedAgentsPool
            agents={getUnassignedAgents("Health")}
            onDragStart={handleDragStart}
            department="Health"
          />
          <Grid container spacing={3}>
            {teams
              .filter((team) => team.department === "Health")
              .map((team, index) => (
                <Grid item xs={12} md={6} lg={4} key={team.tlId}>
                  <TeamCard
                    team={team}
                    agents={getAgentsByTeam(team)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(team)}
                    onDragStart={handleDragStart}
                    onReassign={openReassignAgent}
                    department="Health"
                    expanded={expandedTeams[team.tlId]}
                    onToggleExpand={() => toggleTeamExpand(team.tlId)}
                    animationDelay={index * 100}
                  />
                </Grid>
              ))}
          </Grid>
        </>
      )}

      {/* Insurance Department */}
      {activeTab === 1 && (
        <>
          <UnassignedAgentsPool
            agents={getUnassignedAgents("Insurance")}
            onDragStart={handleDragStart}
            department="Insurance"
          />
          <Grid container spacing={3}>
            {teams
              .filter((team) => team.department === "Insurance")
              .map((team, index) => (
                <Grid item xs={12} md={6} lg={4} key={team.tlId}>
                  <TeamCard
                    team={team}
                    agents={getAgentsByTeam(team)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(team)}
                    onDragStart={handleDragStart}
                    onReassign={openReassignAgent}
                    department="Insurance"
                    expanded={expandedTeams[team.tlId]}
                    onToggleExpand={() => toggleTeamExpand(team.tlId)}
                    animationDelay={index * 100}
                  />
                </Grid>
              ))}
          </Grid>
        </>
      )}

      {/* Reassign Dialog */}
      <Dialog
        open={openReassignDialog}
        onClose={() => setOpenReassignDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            backgroundColor: colors.background.secondary,
            backgroundImage: "none",
            border: `1px solid ${colors.border.card}`,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <SwapHoriz sx={{ mr: 1, color: colors.accent.primary }} />
            <Typography variant="h6" fontWeight="bold" sx={{ color: colors.text.primary }}>
              Reassign Agent
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedAgent && (
            <Box sx={{ mt: 2 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 3,
                  backgroundColor: colors.background.card,
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  border: `1px solid ${colors.border.card}`,
                }}
              >
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    mr: 2,
                    bgcolor: selectedAgent.department === "Health"
                      ? `${colors.accent.primary}30`
                      : `${colors.accent.purple}30`,
                    color: selectedAgent.department === "Health"
                      ? colors.accent.primary
                      : colors.accent.purple,
                  }}
                >
                  {selectedAgent.name?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: colors.text.primary }}>
                    {selectedAgent.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.text.muted }}>
                    {selectedAgent.empId || selectedAgent.id} - {selectedAgent.department} Department
                  </Typography>
                </Box>
              </Paper>

              <FormControl fullWidth>
                <InputLabel
                  sx={{
                    color: colors.text.muted,
                    "&.Mui-focused": { color: colors.accent.primary },
                  }}
                >
                  Select Target Team Lead
                </InputLabel>
                <Select
                  value={targetTeamLead}
                  label="Select Target Team Lead"
                  onChange={(e) => setTargetTeamLead(e.target.value)}
                  sx={{
                    borderRadius: "10px",
                    backgroundColor: colors.background.card,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: colors.border.card,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: colors.accent.primary,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: colors.accent.primary,
                    },
                    "& .MuiSelect-select": {
                      color: colors.text.primary,
                    },
                    "& .MuiSvgIcon-root": {
                      color: colors.text.muted,
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        backgroundColor: colors.background.secondary,
                        border: `1px solid ${colors.border.card}`,
                        borderRadius: "10px",
                      },
                    },
                  }}
                >
                  {teamLeads
                    .filter((tl) => tl.department === selectedAgent.department)
                    .map((tl) => (
                      <MenuItem
                        key={tl.id}
                        value={tl.id}
                        sx={{
                          color: colors.text.primary,
                          "&:hover": {
                            backgroundColor: `${colors.accent.primary}20`,
                          },
                          "&.Mui-selected": {
                            backgroundColor: `${colors.accent.primary}30`,
                            "&:hover": {
                              backgroundColor: `${colors.accent.primary}40`,
                            },
                          },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Avatar
                            sx={{
                              width: 28,
                              height: 28,
                              mr: 1.5,
                              fontSize: "0.75rem",
                              bgcolor: `${colors.accent.primary}30`,
                              color: colors.accent.primary,
                            }}
                          >
                            {tl.name?.charAt(0)}
                          </Avatar>
                          {tl.name} ({tl.empId || tl.id})
                        </Box>
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button
            onClick={() => setOpenReassignDialog(false)}
            sx={{
              borderRadius: "10px",
              color: colors.text.secondary,
              "&:hover": {
                backgroundColor: `${colors.text.muted}20`,
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleReassignAgent}
            disabled={!targetTeamLead}
            sx={{
              borderRadius: "10px",
              background: `linear-gradient(135deg, ${colors.accent.primary} 0%, ${colors.accent.secondary} 100%)`,
              boxShadow: `0 4px 15px ${colors.accent.primary}40`,
              "&:hover": {
                background: `linear-gradient(135deg, ${colors.accent.secondary} 0%, ${colors.accent.primary} 100%)`,
              },
              "&.Mui-disabled": {
                backgroundColor: colors.border.card,
                color: colors.text.muted,
              },
            }}
          >
            Reassign Agent
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TeamManagement;
