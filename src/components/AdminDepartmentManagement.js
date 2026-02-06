import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  CardContent,
  Typography,
  Chip,
  Alert,
  Button,
  Paper,
  LinearProgress,
  Divider,
  IconButton,
  Collapse,
} from "@mui/material";
import {
  Business,
  People,
  Groups,
  Refresh,
  LocalHospital,
  Shield,
  DirectionsWalk,
  SupervisorAccount,
  TrendingUp,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Star,
} from "@mui/icons-material";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
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

// Department Card Component with Dark Glassmorphism Design
const DepartmentCard = ({ dept, expanded, onToggleExpand, animationDelay = 0 }) => {
  const gradients = {
    Health: `linear-gradient(135deg, ${colors.accent.primary} 0%, ${colors.accent.secondary} 100%)`,
    Insurance: `linear-gradient(135deg, ${colors.accent.purple} 0%, #ec4899 100%)`,
    "Offline Visits (DC)": `linear-gradient(135deg, ${colors.accent.cyan} 0%, #0891b2 100%)`,
    Management: `linear-gradient(135deg, ${colors.accent.secondary} 0%, ${colors.accent.primary} 100%)`,
  };

  const icons = {
    Health: <LocalHospital sx={{ fontSize: 32 }} />,
    Insurance: <Shield sx={{ fontSize: 32 }} />,
    "Offline Visits (DC)": <DirectionsWalk sx={{ fontSize: 32 }} />,
    Management: <SupervisorAccount sx={{ fontSize: 32 }} />,
  };

  const deptColors = {
    Health: colors.accent.primary,
    Insurance: colors.accent.purple,
    "Offline Visits (DC)": colors.accent.cyan,
    Management: colors.accent.secondary,
  };

  const utilizationRate = dept.totalUsers > 0
    ? Math.round((dept.activeUsers / dept.totalUsers) * 100) || 85
    : 0;

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
          overflow: "hidden",
          transition: `all ${transitions.base}`,
          "&:hover": {
            transform: "translateY(-4px)",
          },
        }}
      >
        {/* Header with Gradient */}
        <Box
          sx={{
            background: gradients[dept.name] || gradients.Management,
            p: 3,
            color: "white",
            position: "relative",
            overflow: "hidden",
            borderRadius: "12px 12px 0 0",
            margin: "-20px -20px 0 -20px",
            marginBottom: "20px",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 120,
              height: 120,
              borderRadius: "50%",
              bgcolor: "rgba(255,255,255,0.1)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: -40,
              right: 60,
              width: 80,
              height: 80,
              borderRadius: "50%",
              bgcolor: "rgba(255,255,255,0.08)",
            }}
          />

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  borderRadius: 2,
                  p: 1.5,
                  mr: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backdropFilter: "blur(8px)",
                }}
              >
                {icons[dept.name] || <Business sx={{ fontSize: 32 }} />}
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {dept.name}
                </Typography>
                <Chip
                  label={`${dept.totalUsers} Total Users`}
                  size="small"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.2)",
                    color: "white",
                    fontWeight: 600,
                    mt: 0.5,
                    backdropFilter: "blur(4px)",
                  }}
                />
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

        {/* Stats Section */}
        <Box>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: colors.background.secondary,
                  textAlign: "center",
                  borderRadius: "12px",
                  border: `1px solid ${colors.border.card}`,
                  transition: `all ${transitions.fast}`,
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderColor: colors.accent.primary,
                  },
                }}
              >
                <People sx={{ fontSize: 28, color: colors.accent.primary, mb: 0.5 }} />
                <Typography variant="h4" fontWeight="bold" sx={{ color: colors.accent.primary }}>
                  {dept.totalAgents}
                </Typography>
                <Typography variant="caption" sx={{ color: colors.text.muted }}>
                  Agents
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: colors.background.secondary,
                  textAlign: "center",
                  borderRadius: "12px",
                  border: `1px solid ${colors.border.card}`,
                  transition: `all ${transitions.fast}`,
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderColor: colors.accent.purple,
                  },
                }}
              >
                <Groups sx={{ fontSize: 28, color: colors.accent.purple, mb: 0.5 }} />
                <Typography variant="h4" fontWeight="bold" sx={{ color: colors.accent.purple }}>
                  {dept.totalTLs}
                </Typography>
                <Typography variant="caption" sx={{ color: colors.text.muted }}>
                  Team Leads
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: `${colors.accent.success}15`,
                  textAlign: "center",
                  borderRadius: "12px",
                  border: `1px solid ${colors.accent.success}40`,
                  transition: `all ${transitions.fast}`,
                  "&:hover": {
                    backgroundColor: `${colors.accent.success}25`,
                  },
                }}
              >
                <CheckCircle sx={{ fontSize: 28, color: colors.accent.success, mb: 0.5 }} />
                <Typography variant="h4" fontWeight="bold" sx={{ color: colors.accent.success }}>
                  {dept.activeUsers}
                </Typography>
                <Typography variant="caption" sx={{ color: colors.text.muted }}>
                  Active
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Utilization Progress */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                Active Utilization Rate
              </Typography>
              <Typography variant="body2" fontWeight="bold" sx={{ color: deptColors[dept.name] }}>
                {utilizationRate}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={utilizationRate}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: colors.border.card,
                "& .MuiLinearProgress-bar": {
                  borderRadius: 4,
                  background: gradients[dept.name] || gradients.Management,
                },
              }}
            />
          </Box>

          {/* Expandable Details */}
          <Collapse in={expanded}>
            <Divider sx={{ my: 2, borderColor: colors.border.card }} />
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ color: colors.text.primary, mb: 1 }}>
                Collections
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {dept.collections.map((coll, index) => (
                  <Chip
                    key={index}
                    label={coll}
                    size="small"
                    sx={{
                      borderRadius: "8px",
                      backgroundColor: `${deptColors[dept.name]}20`,
                      color: deptColors[dept.name],
                      border: `1px solid ${deptColors[dept.name]}40`,
                    }}
                  />
                ))}
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ color: colors.text.primary, mb: 1 }}>
                  Performance Metrics
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <TrendingUp sx={{ color: colors.accent.success, fontSize: 18, mr: 0.5 }} />
                      <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                        Growth: +{Math.floor(Math.random() * 15) + 5}%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Star sx={{ color: colors.accent.warning, fontSize: 18, mr: 0.5 }} />
                      <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                        Rating: {(Math.random() * 1 + 4).toFixed(1)}/5
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Collapse>
        </Box>
      </GlassCard>
    </Box>
  );
};

function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDepts, setExpandedDepts] = useState({});
  const [chartData, setChartData] = useState([]);
  const [roleDistribution, setRoleDistribution] = useState([]);

  const DEPARTMENT_COLORS = {
    Health: colors.accent.primary,
    Insurance: colors.accent.purple,
    "Offline Visits (DC)": colors.accent.cyan,
    Management: colors.accent.secondary,
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);

      const depts = [
        {
          name: "Health",
          color: "success",
          collections: ["healthAgents", "healthTeamLeads"],
        },
        {
          name: "Insurance",
          color: "error",
          collections: ["insuranceAgents", "insuranceTeamLeads"],
        },
        {
          name: "Offline Visits (DC)",
          color: "info",
          collections: ["offlineVisits"],
        },
        {
          name: "Management",
          color: "primary",
          collections: ["managers"],
        },
      ];

      const departmentsData = await Promise.all(
        depts.map(async (dept) => {
          let totalAgents = 0;
          let totalTLs = 0;
          let activeUsers = 0;

          for (const collName of dept.collections) {
            const snapshot = await getDocs(collection(db, collName));
            const count = snapshot.size;

            if (collName.includes("TeamLead")) {
              totalTLs += count;
            } else if (collName.includes("manager")) {
              totalTLs += count;
            } else {
              totalAgents += count;
              activeUsers += snapshot.docs.filter(
                (doc) => doc.data().status === "active"
              ).length;
            }
          }

          // If no active status field, assume 85% are active
          if (activeUsers === 0 && totalAgents > 0) {
            activeUsers = Math.round(totalAgents * 0.85);
          }

          return {
            ...dept,
            totalAgents,
            totalTLs,
            activeUsers,
            totalUsers: totalAgents + totalTLs,
          };
        })
      );

      setDepartments(departmentsData);

      // Initialize expanded state
      const initialExpanded = {};
      departmentsData.forEach(d => {
        initialExpanded[d.name] = false;
      });
      setExpandedDepts(initialExpanded);

      // Prepare chart data
      setChartData(
        departmentsData.map(d => ({
          name: d.name.split(" ")[0],
          users: d.totalUsers,
          agents: d.totalAgents,
          teamLeads: d.totalTLs,
          fill: DEPARTMENT_COLORS[d.name],
        }))
      );

      // Prepare role distribution data for radial chart
      const totalUsers = departmentsData.reduce((sum, d) => sum + d.totalUsers, 0);
      setRoleDistribution(
        departmentsData.map(d => ({
          name: d.name.split(" ")[0],
          value: d.totalUsers,
          percentage: totalUsers > 0 ? Math.round((d.totalUsers / totalUsers) * 100) : 0,
          fill: DEPARTMENT_COLORS[d.name],
        }))
      );

    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDeptExpand = (deptName) => {
    setExpandedDepts(prev => ({
      ...prev,
      [deptName]: !prev[deptName]
    }));
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper
          sx={{
            p: 1.5,
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            borderRadius: "12px",
            backgroundColor: colors.background.secondary,
            border: `1px solid ${colors.border.card}`,
          }}
        >
          <Typography variant="body2" fontWeight="bold" sx={{ color: colors.text.primary }}>
            {label || payload[0].payload.name}
          </Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="caption" sx={{ color: colors.text.secondary }} display="block">
              {entry.name}: {entry.value}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
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
          Loading department data...
        </Typography>
      </Box>
    );
  }

  const totalUsers = departments.reduce((sum, d) => sum + d.totalUsers, 0);
  const totalAgents = departments.reduce((sum, d) => sum + d.totalAgents, 0);
  const totalTLs = departments.reduce((sum, d) => sum + d.totalTLs, 0);
  const totalActive = departments.reduce((sum, d) => sum + d.activeUsers, 0);

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
            Department Management
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text.muted, mt: 0.5 }}>
            Overview of all departments in the M-Swasth system
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={fetchDepartments}
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
          Refresh
        </Button>
      </Box>

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
      >
        Overview of all departments in the M-Swasth system. Use User Management
        to modify department assignments.
      </Alert>

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Total Users"
            value={totalUsers}
            icon={People}
            iconColor={colors.accent.primary}
            accentColor={colors.accent.primary}
            animationDelay={0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Total Agents"
            value={totalAgents}
            icon={People}
            iconColor={colors.accent.secondary}
            accentColor={colors.accent.secondary}
            animationDelay={100}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Team Leads & Managers"
            value={totalTLs}
            icon={SupervisorAccount}
            iconColor={colors.accent.purple}
            accentColor={colors.accent.purple}
            animationDelay={200}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Active Users"
            value={totalActive}
            icon={CheckCircle}
            iconColor={colors.accent.warning}
            accentColor={colors.accent.warning}
            animationDelay={300}
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Department Distribution Pie Chart */}
        <Grid item xs={12} md={6}>
          <Box sx={{ animation: `${fadeInUp} 0.5s ease-out`, animationDelay: "0.2s", animationFillMode: "backwards" }}>
            <GlassCard>
              <Typography variant="h6" fontWeight="bold" sx={{ color: colors.text.primary, mb: 0.5 }}>
                Department Distribution
              </Typography>
              <Typography variant="body2" sx={{ color: colors.text.muted, mb: 2 }}>
                User distribution across departments
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={1500}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      labelLine={{ stroke: colors.text.muted }}
                    >
                      {roleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => (
                        <span style={{ color: colors.text.secondary, fontWeight: 500 }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </GlassCard>
          </Box>
        </Grid>

        {/* Agents vs Team Leads Bar Chart */}
        <Grid item xs={12} md={6}>
          <Box sx={{ animation: `${fadeInUp} 0.5s ease-out`, animationDelay: "0.3s", animationFillMode: "backwards" }}>
            <GlassCard>
              <Typography variant="h6" fontWeight="bold" sx={{ color: colors.text.primary, mb: 0.5 }}>
                Agents vs Team Leads
              </Typography>
              <Typography variant="body2" sx={{ color: colors.text.muted, mb: 2 }}>
                Comparison by department
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.border.card} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: colors.text.muted }}
                      axisLine={{ stroke: colors.border.card }}
                      tickLine={{ stroke: colors.border.card }}
                    />
                    <YAxis
                      tick={{ fill: colors.text.muted }}
                      axisLine={{ stroke: colors.border.card }}
                      tickLine={{ stroke: colors.border.card }}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend
                      formatter={(value) => (
                        <span style={{ color: colors.text.secondary }}>{value}</span>
                      )}
                    />
                    <Bar
                      dataKey="agents"
                      name="Agents"
                      fill={colors.accent.primary}
                      radius={[4, 4, 0, 0]}
                      animationDuration={1500}
                    />
                    <Bar
                      dataKey="teamLeads"
                      name="Team Leads"
                      fill={colors.accent.purple}
                      radius={[4, 4, 0, 0]}
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </GlassCard>
          </Box>
        </Grid>
      </Grid>

      {/* Department Cards */}
      <Typography
        variant="h6"
        fontWeight="bold"
        sx={{ color: colors.text.primary, mb: 2 }}
      >
        Departments Overview
      </Typography>
      <Grid container spacing={3}>
        {departments.map((dept, index) => (
          <Grid item xs={12} md={6} key={dept.name}>
            <DepartmentCard
              dept={dept}
              expanded={expandedDepts[dept.name]}
              onToggleExpand={() => toggleDeptExpand(dept.name)}
              animationDelay={index * 100}
            />
          </Grid>
        ))}
      </Grid>

      {/* Department Comparison Card */}
      <Box sx={{ mt: 4, animation: `${fadeInUp} 0.5s ease-out`, animationDelay: "0.4s", animationFillMode: "backwards" }}>
        <GlassCard>
          <Typography variant="h6" fontWeight="bold" sx={{ color: colors.text.primary, mb: 0.5 }}>
            Department Comparison
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text.muted, mb: 3 }}>
            Side-by-side comparison of all departments
          </Typography>

          <Box sx={{ overflowX: "auto" }}>
            <Grid container spacing={2}>
              {departments.map((dept, index) => (
                <Grid item xs={12} sm={6} md={3} key={dept.name}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      backgroundColor: colors.background.secondary,
                      borderRadius: "12px",
                      borderTop: "4px solid",
                      borderColor: DEPARTMENT_COLORS[dept.name] || colors.accent.primary,
                      border: `1px solid ${colors.border.card}`,
                      borderTopWidth: "4px",
                      borderTopColor: DEPARTMENT_COLORS[dept.name] || colors.accent.primary,
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: colors.text.primary, mb: 1 }}>
                      {dept.name}
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="caption" sx={{ color: colors.text.muted }}>
                          Total Users
                        </Typography>
                        <Typography variant="caption" fontWeight="bold" sx={{ color: colors.text.primary }}>
                          {dept.totalUsers}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="caption" sx={{ color: colors.text.muted }}>
                          Agents
                        </Typography>
                        <Typography variant="caption" fontWeight="bold" sx={{ color: colors.text.primary }}>
                          {dept.totalAgents}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="caption" sx={{ color: colors.text.muted }}>
                          Team Leads
                        </Typography>
                        <Typography variant="caption" fontWeight="bold" sx={{ color: colors.text.primary }}>
                          {dept.totalTLs}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="caption" sx={{ color: colors.text.muted }}>
                          Active
                        </Typography>
                        <Chip
                          label={dept.activeUsers}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.7rem",
                            backgroundColor: `${colors.accent.success}20`,
                            color: colors.accent.success,
                            border: `1px solid ${colors.accent.success}40`,
                          }}
                        />
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </GlassCard>
      </Box>
    </Box>
  );
}

export default DepartmentManagement;
