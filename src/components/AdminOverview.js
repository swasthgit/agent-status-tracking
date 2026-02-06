import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Button,
  IconButton,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  People,
  Groups,
  Business,
  PersonAdd,
  TrendingUp,
  Refresh,
  AccessTime,
  CheckCircle,
  Speed,
  Storage,
  CloudDone,
  LocalHospital,
  Shield,
  DirectionsWalk,
  SupervisorAccount,
  ExitToApp,
  Warning,
} from "@mui/icons-material";
import { collection, getDocs } from "firebase/firestore";
import { db, functions } from "../firebaseConfig";
import { httpsCallable } from "firebase/functions";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { colors, transitions } from "../theme/adminTheme";
import { GlassCard, StatCard } from "./admin";
import { fadeInUp, fadeInDown, pulse } from "../styles/adminStyles";
import { keyframes } from "@mui/system";

// Spin animation for refresh button
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// System Health Card Component
const SystemHealthCard = ({ status, uptime, lastSync }) => {
  const isHealthy = status === "healthy";

  const healthItems = [
    { label: "Firebase Connection", status: "Active", icon: CheckCircle, color: colors.accent.success },
    { label: "Database Status", status: "Online", icon: Storage, color: colors.accent.secondary },
    { label: "Cloud Functions", status: "Running", icon: CloudDone, color: colors.accent.primary },
  ];

  return (
    <GlassCard hoverable={false} sx={{ height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "10px",
            backgroundColor: isHealthy ? colors.accent.primaryLight : colors.accent.warningLight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mr: 2,
          }}
        >
          <Speed sx={{ fontSize: 22, color: isHealthy ? colors.accent.primary : colors.accent.warning }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, color: colors.text.primary }}>
          System Health
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        {healthItems.map((item, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              alignItems: "center",
              py: 1.5,
              borderBottom: index < healthItems.length - 1 ? `1px solid ${colors.border.subtle}` : "none",
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: item.color,
                boxShadow: `0 0 8px ${item.color}`,
                animation: `${pulse} 2s ease-in-out infinite`,
                mr: 2,
              }}
            />
            <Typography variant="body2" sx={{ color: colors.text.secondary, flex: 1 }}>
              {item.label}
            </Typography>
            <Chip
              label={item.status}
              size="small"
              sx={{
                backgroundColor: `${item.color}20`,
                color: item.color,
                fontWeight: 600,
                fontSize: "0.7rem",
                height: 24,
              }}
            />
          </Box>
        ))}
      </Box>

      <Box>
        <Typography variant="caption" sx={{ color: colors.text.muted, display: "block", mb: 1 }}>
          System Uptime
        </Typography>
        <LinearProgress
          variant="determinate"
          value={uptime}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: "rgba(255,255,255,0.1)",
            "& .MuiLinearProgress-bar": {
              borderRadius: 3,
              background: `linear-gradient(90deg, ${colors.accent.primary} 0%, ${colors.accent.secondary} 100%)`,
            },
          }}
        />
        <Typography variant="caption" sx={{ color: colors.text.muted, mt: 1, display: "block" }}>
          {uptime}% - Last sync: {lastSync}
        </Typography>
      </Box>
    </GlassCard>
  );
};

// Quick Actions Card Component
const QuickActionsCard = ({ onRefresh, onAddUser, onManageTeams, onViewReports, onForceLogout, forceLogoutLoading }) => {
  const actions = [
    { label: "Add New User", icon: PersonAdd, color: colors.accent.primary, onClick: onAddUser },
    { label: "View Reports", icon: TrendingUp, color: colors.accent.secondary, onClick: onViewReports },
    { label: "Manage Teams", icon: Groups, color: colors.accent.purple, onClick: onManageTeams },
    { label: "Force Logout", icon: ExitToApp, color: colors.accent.error, onClick: onForceLogout, loading: forceLogoutLoading },
  ];

  return (
    <GlassCard hoverable={false} sx={{ height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: colors.text.primary }}>
          Quick Actions
        </Typography>
        <Tooltip title="Refresh Data">
          <IconButton
            size="small"
            onClick={onRefresh}
            sx={{
              color: colors.text.muted,
              "&:hover": { color: colors.accent.primary, backgroundColor: colors.accent.primaryLight },
            }}
          >
            <Refresh fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={2}>
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Grid item xs={6} key={index}>
              <Button
                fullWidth
                variant="outlined"
                onClick={action.onClick}
                disabled={action.loading}
                sx={{
                  py: 2,
                  borderRadius: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  borderColor: colors.border.card,
                  backgroundColor: "rgba(255,255,255,0.02)",
                  transition: `all ${transitions.fast}`,
                  "&:hover": {
                    borderColor: action.color,
                    backgroundColor: `${action.color}15`,
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <Box sx={{ color: action.color }}>
                  {action.loading ? <CircularProgress size={24} color="inherit" /> : <Icon />}
                </Box>
                <Typography
                  variant="caption"
                  sx={{ color: colors.text.secondary, fontWeight: 500, fontSize: "0.7rem" }}
                >
                  {action.loading ? "Processing..." : action.label}
                </Typography>
              </Button>
            </Grid>
          );
        })}
      </Grid>
    </GlassCard>
  );
};

// Recent Activity Card Component
const RecentActivityCard = ({ activities, onRefresh, loading }) => (
  <GlassCard hoverable={false} sx={{ height: "100%" }}>
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: colors.text.primary }}>
        Recent Activity
      </Typography>
      <Tooltip title="Refresh Activities">
        <IconButton
          size="small"
          onClick={onRefresh}
          disabled={loading}
          sx={{
            color: colors.text.muted,
            "&:hover": { color: colors.accent.primary },
          }}
        >
          <Refresh
            fontSize="small"
            sx={{ animation: loading ? `${spin} 1s linear infinite` : "none" }}
          />
        </IconButton>
      </Tooltip>
    </Box>

    {loading ? (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={30} sx={{ color: colors.accent.primary }} />
      </Box>
    ) : activities.length === 0 ? (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body2" sx={{ color: colors.text.muted }}>
          No recent activity found
        </Typography>
      </Box>
    ) : (
      <List sx={{ p: 0, maxHeight: 280, overflow: "auto" }}>
        {activities.map((activity, index) => (
          <ListItem
            key={index}
            sx={{
              px: 0,
              py: 1.5,
              borderBottom: index < activities.length - 1 ? `1px solid ${colors.border.subtle}` : "none",
            }}
          >
            <ListItemAvatar>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: `${activity.iconColor}20`,
                  color: activity.iconColor,
                }}
              >
                {activity.icon}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography variant="body2" sx={{ fontWeight: 500, color: colors.text.primary, fontSize: "0.8rem" }}>
                  {activity.title}
                </Typography>
              }
              secondary={
                <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                  <AccessTime sx={{ fontSize: 12, mr: 0.5, color: colors.text.muted }} />
                  <Typography variant="caption" sx={{ color: colors.text.muted }}>
                    {activity.time}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    )}
  </GlassCard>
);

// Custom Tooltip for Charts
const CustomChartTooltip = ({ active, payload, totalUsers }) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          background: colors.background.secondary,
          backdropFilter: "blur(10px)",
          border: `1px solid ${colors.border.card}`,
          borderRadius: "8px",
          p: 1.5,
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600, color: colors.text.primary }}>
          {payload[0].name}
        </Typography>
        <Typography variant="body2" sx={{ color: colors.text.secondary }}>
          {payload[0].value} users ({((payload[0].value / totalUsers) * 100).toFixed(1)}%)
        </Typography>
      </Box>
    );
  }
  return null;
};

function AdminOverview({ onAddUser, onManageTeams, onViewReports, onDepartmentSettings }) {
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [stats, setStats] = useState({
    totalHealthAgents: 0,
    totalHealthTLs: 0,
    totalOfflineVisits: 0,
    totalInsuranceAgents: 0,
    totalInsuranceTLs: 0,
    totalManagers: 0,
    activeUsers: 0,
    totalUsers: 0,
  });
  const [departmentData, setDepartmentData] = useState([]);
  const [roleData, setRoleData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  // Force logout states
  const [forceLogoutDialogOpen, setForceLogoutDialogOpen] = useState(false);
  const [forceLogoutLoading, setForceLogoutLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Chart colors matching our theme
  const DEPARTMENT_COLORS = {
    Health: colors.accent.secondary,
    Insurance: colors.accent.purple,
    "Offline Visits": colors.accent.cyan,
    Management: colors.accent.primary,
  };

  useEffect(() => {
    fetchStatistics();
    fetchRecentActivities();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);

      const healthAgentsSnap = await getDocs(collection(db, "healthAgents"));
      const healthAgentsCount = healthAgentsSnap.size;
      const activeHealthAgents = healthAgentsSnap.docs.filter(
        (doc) => doc.data().status === "active"
      ).length;

      const healthTLsSnap = await getDocs(collection(db, "healthTeamLeads"));
      const healthTLsCount = healthTLsSnap.size;

      const offlineVisitsSnap = await getDocs(collection(db, "offlineVisits"));
      const offlineVisitsCount = offlineVisitsSnap.size;

      const insuranceAgentsSnap = await getDocs(collection(db, "insuranceAgents"));
      const insuranceAgentsCount = insuranceAgentsSnap.size;

      const insuranceTLsSnap = await getDocs(collection(db, "insuranceTeamLeads"));
      const insuranceTLsCount = insuranceTLsSnap.size;

      const managersSnap = await getDocs(collection(db, "managers"));
      const managersCount = managersSnap.size;

      const totalUsers =
        healthAgentsCount +
        healthTLsCount +
        offlineVisitsCount +
        insuranceAgentsCount +
        insuranceTLsCount +
        managersCount;

      setStats({
        totalHealthAgents: healthAgentsCount,
        totalHealthTLs: healthTLsCount,
        totalOfflineVisits: offlineVisitsCount,
        totalInsuranceAgents: insuranceAgentsCount,
        totalInsuranceTLs: insuranceTLsCount,
        totalManagers: managersCount,
        activeUsers: activeHealthAgents,
        totalUsers,
      });

      setDepartmentData([
        { name: "Health", value: healthAgentsCount + healthTLsCount, color: DEPARTMENT_COLORS.Health },
        { name: "Insurance", value: insuranceAgentsCount + insuranceTLsCount, color: DEPARTMENT_COLORS.Insurance },
        { name: "Offline Visits", value: offlineVisitsCount, color: DEPARTMENT_COLORS["Offline Visits"] },
        { name: "Management", value: managersCount, color: DEPARTMENT_COLORS.Management },
      ]);

      setRoleData([
        { name: "Health Agents", count: healthAgentsCount, fill: colors.accent.secondary },
        { name: "Health TLs", count: healthTLsCount, fill: `${colors.accent.secondary}99` },
        { name: "Insurance Agents", count: insuranceAgentsCount, fill: colors.accent.purple },
        { name: "Insurance TLs", count: insuranceTLsCount, fill: `${colors.accent.purple}99` },
        { name: "DC Agents", count: offlineVisitsCount, fill: colors.accent.cyan },
        { name: "Managers", count: managersCount, fill: colors.accent.primary },
      ]);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return "Unknown time";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const fetchRecentActivities = async () => {
    try {
      setActivitiesLoading(true);
      const activities = [];

      const collections = [
        { name: "healthAgents", label: "Health Agent", icon: <LocalHospital fontSize="small" />, iconColor: colors.accent.secondary },
        { name: "healthTeamLeads", label: "Health TL", icon: <SupervisorAccount fontSize="small" />, iconColor: colors.accent.secondary },
        { name: "insuranceAgents", label: "Insurance Agent", icon: <Shield fontSize="small" />, iconColor: colors.accent.purple },
        { name: "insuranceTeamLeads", label: "Insurance TL", icon: <SupervisorAccount fontSize="small" />, iconColor: colors.accent.purple },
        { name: "offlineVisits", label: "DC Agent", icon: <DirectionsWalk fontSize="small" />, iconColor: colors.accent.cyan },
        { name: "managers", label: "Manager", icon: <Business fontSize="small" />, iconColor: colors.accent.primary },
      ];

      for (const coll of collections) {
        const snapshot = await getDocs(collection(db, coll.name));
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.createdAt) {
            activities.push({
              title: `New ${coll.label}: ${data.name || "Unknown"}`,
              time: formatRelativeTime(data.createdAt),
              timestamp: new Date(data.createdAt).getTime(),
              icon: coll.icon,
              iconColor: coll.iconColor,
            });
          }
          if (data.updatedAt && data.updatedAt !== data.createdAt) {
            activities.push({
              title: `${coll.label} updated: ${data.name || "Unknown"}`,
              time: formatRelativeTime(data.updatedAt),
              timestamp: new Date(data.updatedAt).getTime(),
              icon: <People fontSize="small" />,
              iconColor: colors.accent.primary,
            });
          }
        });
      }

      activities.sort((a, b) => b.timestamp - a.timestamp);
      setRecentActivities(activities.slice(0, 10));
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      setRecentActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const handleForceLogoutClick = () => setForceLogoutDialogOpen(true);

  const handleForceLogoutConfirm = async () => {
    setForceLogoutDialogOpen(false);
    setForceLogoutLoading(true);

    try {
      const manualAutoLogout = httpsCallable(functions, "manualAutoLogout");
      const result = await manualAutoLogout();

      setSnackbar({
        open: true,
        message: result.data.message || `Successfully logged out ${result.data.agentsLoggedOut} agents`,
        severity: "success",
      });

      fetchStatistics();
    } catch (error) {
      console.error("Error triggering force logout:", error);
      let errorMessage = "Failed to trigger force logout. Please try again.";
      if (error.code === "functions/not-found") {
        errorMessage = "Function not deployed. Please deploy Cloud Functions first.";
      } else if (error.code === "functions/permission-denied") {
        errorMessage = "Permission denied. Only admins can trigger force logout.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      setSnackbar({ open: true, message: errorMessage, severity: "error" });
    } finally {
      setForceLogoutLoading(false);
    }
  };

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
            width: 50,
            height: 50,
            borderRadius: "50%",
            border: `3px solid ${colors.border.card}`,
            borderTopColor: colors.accent.primary,
            animation: `${spin} 1s linear infinite`,
          }}
        />
        <Typography variant="body2" sx={{ mt: 2, color: colors.text.muted }}>
          Loading dashboard data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Box
        sx={{
          mb: 4,
          animation: `${fadeInDown} 400ms ease`,
          animationFillMode: "both",
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: colors.text.primary,
            letterSpacing: "-0.02em",
            mb: 1,
          }}
        >
          System Overview
        </Typography>
        <Typography variant="body2" sx={{ color: colors.text.muted }}>
          Real-time statistics and insights for M-Swasth system
        </Typography>
      </Box>

      {/* Main Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Total Users"
            value={stats.totalUsers}
            icon={People}
            iconColor={colors.accent.primary}
            accentColor={colors.accent.primary}
            trend="up"
            trendValue="+12% this month"
            animationDelay={0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Health Department"
            value={stats.totalHealthAgents + stats.totalHealthTLs}
            icon={LocalHospital}
            iconColor={colors.accent.secondary}
            accentColor={colors.accent.secondary}
            animationDelay={50}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Insurance Department"
            value={stats.totalInsuranceAgents + stats.totalInsuranceTLs}
            icon={Shield}
            iconColor={colors.accent.purple}
            accentColor={colors.accent.purple}
            animationDelay={100}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="DC Agents"
            value={stats.totalOfflineVisits}
            icon={DirectionsWalk}
            iconColor={colors.accent.cyan}
            accentColor={colors.accent.cyan}
            animationDelay={150}
          />
        </Grid>
      </Grid>

      {/* Secondary Stats Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            label="Health Team Leads"
            value={stats.totalHealthTLs}
            icon={SupervisorAccount}
            iconColor={colors.accent.secondary}
            animationDelay={200}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            label="Insurance Team Leads"
            value={stats.totalInsuranceTLs}
            icon={SupervisorAccount}
            iconColor={colors.accent.purple}
            animationDelay={250}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            label="Managers"
            value={stats.totalManagers}
            icon={Business}
            iconColor={colors.accent.primary}
            animationDelay={300}
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <GlassCard hoverable={false} animationDelay={350}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: colors.text.primary, mb: 0.5 }}>
              Department Distribution
            </Typography>
            <Typography variant="body2" sx={{ color: colors.text.muted, mb: 3 }}>
              User distribution across departments
            </Typography>
            <Box sx={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1500}
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomChartTooltip totalUsers={stats.totalUsers} />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span style={{ color: colors.text.secondary, fontSize: "0.8rem" }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </GlassCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <GlassCard hoverable={false} animationDelay={400}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: colors.text.primary, mb: 0.5 }}>
              Role Distribution
            </Typography>
            <Typography variant="body2" sx={{ color: colors.text.muted, mb: 3 }}>
              User count by role type
            </Typography>
            <Box sx={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border.subtle} horizontal={true} vertical={false} />
                  <XAxis type="number" tick={{ fill: colors.text.muted, fontSize: 12 }} axisLine={{ stroke: colors.border.subtle }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={95}
                    tick={{ fill: colors.text.secondary, fontSize: 11 }}
                    axisLine={{ stroke: colors.border.subtle }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: colors.background.secondary,
                      border: `1px solid ${colors.border.card}`,
                      borderRadius: 8,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                    }}
                    labelStyle={{ color: colors.text.primary }}
                    itemStyle={{ color: colors.text.secondary }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} animationBegin={0} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </GlassCard>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <SystemHealthCard status="healthy" uptime={99.9} lastSync="Just now" />
        </Grid>
        <Grid item xs={12} md={4}>
          <QuickActionsCard
            onRefresh={fetchStatistics}
            onAddUser={onAddUser}
            onManageTeams={onManageTeams}
            onViewReports={onViewReports}
            onForceLogout={handleForceLogoutClick}
            forceLogoutLoading={forceLogoutLoading}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <RecentActivityCard
            activities={recentActivities}
            onRefresh={fetchRecentActivities}
            loading={activitiesLoading}
          />
        </Grid>
      </Grid>

      {/* Force Logout Dialog */}
      <Dialog
        open={forceLogoutDialogOpen}
        onClose={() => setForceLogoutDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: colors.background.secondary,
            backgroundImage: "none",
          },
        }}
      >
        <DialogTitle sx={{ color: colors.accent.error, display: "flex", alignItems: "center", gap: 1 }}>
          <Warning />
          Force Logout All Agents
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: colors.text.secondary }}>
            This action will immediately log out all Health and Insurance agents who are currently showing as
            <strong style={{ color: colors.text.primary }}> Available</strong>,{" "}
            <strong style={{ color: colors.text.primary }}>On Call</strong>,{" "}
            <strong style={{ color: colors.text.primary }}>Login</strong>, or{" "}
            <strong style={{ color: colors.text.primary }}>Break</strong>.
            <br /><br />
            <strong style={{ color: colors.text.primary }}>Note:</strong> DC Agents (Offline Visits) will NOT be affected.
            <br /><br />
            Are you sure you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border.subtle}` }}>
          <Button
            onClick={() => setForceLogoutDialogOpen(false)}
            sx={{ color: colors.text.secondary }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleForceLogoutConfirm}
            variant="contained"
            color="error"
            startIcon={<ExitToApp />}
          >
            Force Logout All
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            backgroundColor: snackbar.severity === "success" ? colors.accent.primaryLight : colors.accent.errorLight,
            color: snackbar.severity === "success" ? colors.accent.primary : colors.accent.error,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default AdminOverview;
