import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  Timestamp,
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
  TextField,
  InputAdornment,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  LinearProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Divider,
  Badge,
  Menu,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  Person,
  Circle,
  Phone,
  Search as SearchIcon,
  Group,
  TrendingUp,
  FileDownload,
  FilterList,
  Refresh,
  BarChart as BarChartIcon,
  ShowChart,
  LocalHospital,
  CheckCircle,
  Cancel,
  AccessTime,
  ArrowUpward,
  ArrowDownward,
  Visibility,
  GridView,
  ViewList,
  PhoneCallback,
  PhoneForwarded,
  Timeline,
  Assessment,
  ZoomOutMap,
  MoreVert,
  TableChart,
  Download,
  LocalPharmacy,
  SupportAgent,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { useThemeMode } from "../context/ThemeContext";

// Animated Counter Hook
const useAnimatedCounter = (end, duration = 1500) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);

  useEffect(() => {
    if (end === 0) {
      setCount(0);
      return;
    }

    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(startValue + (end - startValue) * easeOut);

      setCount(currentValue);

      if (progress < 1) {
        countRef.current = requestAnimationFrame(animate);
      }
    };

    countRef.current = requestAnimationFrame(animate);

    return () => {
      if (countRef.current) {
        cancelAnimationFrame(countRef.current);
      }
    };
  }, [end, duration]);

  return count;
};

// Animated Stat Card — Premium redesign with icon pill + sparkline
const AnimatedStatCard = ({ title, value, icon, gradient, subtitle, trend, trendValue, onClick, isActive, colors }) => {
  const animatedValue = useAnimatedCounter(value);
  const c = colors || {};

  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        bgcolor: c.bgCard || '#fff',
        border: `1px solid ${isActive ? (c.primary || '#D97706') : (c.border || '#e2e8f0')}`,
        borderRadius: '12px',
        height: "100%",
        transition: 'transform 150ms ease, border-color 150ms ease',
        cursor: onClick ? "pointer" : "default",
        "&:hover": {
          borderColor: c.borderHover || '#F59E0B',
        },
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        {/* Top: Title + Icon */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 500, color: c.textMuted || '#94A3B8' }}>
            {title}
          </Typography>
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: c.primarySoft || '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {React.cloneElement(icon, { sx: { fontSize: 20, color: c.primary || '#D97706' } })}
          </Box>
        </Box>
        {/* Bottom: Number + Trend/Sparkline */}
        <Typography sx={{ fontSize: 28, fontWeight: 700, color: c.text || '#0F172A', lineHeight: 1, letterSpacing: '-0.02em' }}>
          {animatedValue}
        </Typography>
        {(trend || subtitle) && (
          <Box sx={{ display: "flex", alignItems: "center", mt: 1, gap: 0.5 }}>
            {trend && (
              <>
                {trend === "up" ? (
                  <ArrowUpward sx={{ fontSize: 14, color: '#10B981' }} />
                ) : (
                  <ArrowDownward sx={{ fontSize: 14, color: '#F43F5E' }} />
                )}
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: trend === "up" ? '#10B981' : '#F43F5E' }}>
                  {trendValue}
                </Typography>
              </>
            )}
            {!trend && subtitle && (
              <Typography sx={{ fontSize: 12, fontWeight: 500, color: c.textSec || '#64748B' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        )}
        {/* Mini sparkline */}
        <Box sx={{ width: '100%', height: 24, mt: 1.5 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={SPARKLINE_DATA}>
              <Line type="monotone" dataKey="v" stroke={c.primaryLight || "#F59E0B"} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

// Agent Card Component
const AgentCard = ({ agent, onDownload, onClick, colors, statusConfig }) => {
  const successRate = agent.totalCalls > 0
    ? Math.round((agent.connectedCalls / agent.totalCalls) * 100)
    : 0;

  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        bgcolor: colors.bgPaper,
        cursor: "pointer",
        transition: 'border-color 150ms ease',
        "&:hover": {
          borderColor: colors.borderHover || '#F59E0B',
        },
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: colors.primary || '#D97706',
              fontSize: "0.95rem",
              fontWeight: 600,
            }}
          >
            {agent.avatar}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: colors.text, lineHeight: 1.3 }} noWrap>
              {agent.name}
            </Typography>
            <Typography sx={{ fontSize: 12, color: colors.textMuted }}>
              {agent.empId}
            </Typography>
          </Box>
          <Chip
            label={statusConfig.label}
            size="small"
            sx={{
              height: 22,
              bgcolor: statusConfig.bgColor,
              color: statusConfig.color,
              fontWeight: 600,
              fontSize: "0.7rem",
            }}
          />
        </Box>

        {/* Stats Row */}
        <Box sx={{ display: "flex", gap: 2, pt: 2, borderTop: `1px solid ${colors.border}` }}>
          <Box sx={{ flex: 1, textAlign: "center" }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: colors.text }}>
              {agent.totalCalls || 0}
            </Typography>
            <Typography sx={{ fontSize: 11, color: colors.textMuted }}>Calls</Typography>
          </Box>
          <Box sx={{ flex: 1, textAlign: "center" }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#10B981' }}>
              {agent.connectedCalls || 0}
            </Typography>
            <Typography sx={{ fontSize: 11, color: colors.textMuted }}>Connected</Typography>
          </Box>
          <Box sx={{ flex: 1, textAlign: "center" }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: colors.primary || '#D97706' }}>
              {successRate}%
            </Typography>
            <Typography sx={{ fontSize: 11, color: colors.textMuted }}>Rate</Typography>
          </Box>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mt: 1.5 }}>
          <LinearProgress
            variant="determinate"
            value={successRate}
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: colors.border,
              "& .MuiLinearProgress-bar": {
                borderRadius: 2,
                bgcolor: colors.primary || '#D97706',
              },
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

// Warm amber/green chart palette
const CHART_COLORS = ['#D97706', '#059669', '#EA580C', '#0891B2', '#7C3AED'];

// Sparkline data for stat cards
const SPARKLINE_DATA = [{v:30},{v:45},{v:35},{v:50},{v:42},{v:55},{v:48}];

// Helper function to check if agent is active/online
const isAgentActive = (status) => {
  return status === "Available" || status === "On Call" ||
         status === "Login" || status === "Idle" || status === "Busy";
};

// Helper function to get status display config
const getStatusConfig = (status) => {
  const configs = {
    "Available": { label: "Available", color: "#22c55e", bgColor: "#dcfce7" },
    "On Call": { label: "On Call", color: "#f59e0b", bgColor: "#fef3c7" },
    "Unavailable": { label: "Offline", color: "#64748b", bgColor: "#f1f5f9" },
    // Legacy status backwards compatibility
    "Login": { label: "Available", color: "#22c55e", bgColor: "#dcfce7" },
    "Logout": { label: "Offline", color: "#64748b", bgColor: "#f1f5f9" },
    "Logged Out": { label: "Offline", color: "#64748b", bgColor: "#f1f5f9" },
    "Idle": { label: "Available", color: "#22c55e", bgColor: "#dcfce7" },
    "Busy": { label: "On Call", color: "#f59e0b", bgColor: "#fef3c7" },
  };
  return configs[status] || configs["Unavailable"];
};

// Export to CSV helper
const exportToCSV = (data, filename, columns) => {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }
  const header = columns.join(",");
  const rows = data.map((row) => {
    return columns
      .map((col) => {
        const value = row[col] !== undefined ? row[col] : "";
        return typeof value === "string" && (value.includes(",") || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      })
      .join(",");
  });
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Custom Tooltip for Charts
const CustomChartTooltip = ({ active, payload, label, colors }) => {
  if (active && payload && payload.length) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          bgcolor: colors ? colors.chartTooltipBg : "rgba(255, 255, 255, 0.98)",
          border: `1px solid ${colors ? colors.chartTooltipBorder : 'rgba(217,119,6,0.08)'}`,
          borderRadius: '8px',
          boxShadow: colors ? colors.shadowCard : '0 4px 12px rgba(0,0,0,0.08)',
          color: colors ? colors.chartTooltipText : undefined,
        }}
      >
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: colors ? colors.chartTooltipText : undefined }}>
          {label}
        </Typography>
        {payload.map((entry, index) => (
          <Typography key={index} variant="body2" sx={{ color: entry.color, fontWeight: 500 }}>
            {entry.name}: {entry.value}
          </Typography>
        ))}
      </Paper>
    );
  }
  return null;
};

// Chart Card Component
const ChartCard = ({ title, children, chartData, columns, chartElement, height = 300, colors }) => {
  const [expandedOpen, setExpandedOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${colors ? colors.border : "divider"}`,
        borderRadius: '12px',
        bgcolor: colors ? colors.bgPaper : undefined,
        position: "relative",
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: colors?.text || "#0F172A" }}>
            {title}
          </Typography>
          <IconButton
            size="small"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ color: colors?.textMuted || "#94A3B8", p: 0.5 }}
          >
            <MoreVert sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Chart Content */}
        <Box sx={{ height }}>{children}</Box>
      </CardContent>

      {/* Options Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { bgcolor: colors?.dialogBg, color: colors?.text, border: `1px solid ${colors?.border || '#e2e8f0'}`, borderRadius: '8px' } }}
      >
        <MenuItem onClick={() => { setExpandedOpen(true); setAnchorEl(null); }} sx={{ fontSize: 13 }}>
          <ZoomOutMap sx={{ mr: 1, fontSize: 18, color: colors?.textSec || "#64748B" }} />
          Expand
        </MenuItem>
        <MenuItem onClick={() => { setTableOpen(true); setAnchorEl(null); }} sx={{ fontSize: 13 }}>
          <TableChart sx={{ mr: 1, fontSize: 18, color: colors?.textSec || "#64748B" }} />
          Table View
        </MenuItem>
        <MenuItem onClick={() => { exportToCSV(chartData, title.replace(/\s+/g, "_"), columns); setAnchorEl(null); }} sx={{ fontSize: 13 }}>
          <Download sx={{ mr: 1, fontSize: 18, color: colors?.textSec || "#64748B" }} />
          Export CSV
        </MenuItem>
      </Menu>

      {/* Expanded View Dialog */}
      <Dialog
        open={expandedOpen}
        onClose={() => setExpandedOpen(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "12px",
            maxHeight: "90vh",
            bgcolor: colors ? colors.dialogBg : undefined,
            border: `1px solid ${colors?.dialogBorder || '#e2e8f0'}`,
            color: colors ? colors.text : undefined,
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: `1px solid ${colors?.border || '#e2e8f0'}`, py: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight={600} color={colors?.text}>
              {title}
            </Typography>
            <IconButton size="small" onClick={() => setExpandedOpen(false)} sx={{ color: colors?.textMuted }}>
              <Cancel sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ width: "100%", height: 550, pt: 2 }}>{chartElement}</Box>
        </DialogContent>
      </Dialog>

      {/* Table View Dialog */}
      <Dialog
        open={tableOpen}
        onClose={() => setTableOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "12px",
            bgcolor: colors ? colors.dialogBg : undefined,
            border: `1px solid ${colors?.dialogBorder || '#e2e8f0'}`,
            color: colors ? colors.text : undefined,
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: `1px solid ${colors?.border || '#e2e8f0'}`, py: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: colors?.text }}>
              {title} - Data Table
            </Typography>
            <Button
              startIcon={<Download sx={{ fontSize: 16 }} />}
              onClick={() => exportToCSV(chartData, title.replace(/\s+/g, "_"), columns)}
              size="small"
              sx={{
                color: colors?.primary || "#D97706",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.8rem",
                borderRadius: "8px",
                "&:hover": { bgcolor: colors?.primarySoft || 'rgba(217,119,6,0.08)' },
              }}
            >
              Export
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: colors?.dialogBg }}>
          <TableContainer sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: colors ? colors.bgTableHeader : undefined }}>
                  {columns.map((col) => (
                    <TableCell key={col} sx={{ fontWeight: 600, textTransform: "capitalize", color: colors?.textSec || "#64748B", fontSize: 12, borderBottomColor: colors?.border }}>
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {chartData.map((row, idx) => (
                  <TableRow key={idx} hover sx={{ "&:hover": { bgcolor: colors ? colors.bgCardHover : undefined } }}>
                    {columns.map((col) => (
                      <TableCell key={col} sx={{ color: colors ? colors.text : undefined, borderBottomColor: colors?.border }}>{row[col]}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: colors?.dialogBg }}>
          <Button
            onClick={() => setTableOpen(false)}
            size="small"
            sx={{
              color: colors?.textSec || "#64748B",
              textTransform: "none",
              borderRadius: "8px",
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

/**
 * Health Manager Dashboard - Revamped
 * Modern UI with animations, charts, and enhanced visualizations
 */
// Helper function to check if agent is PE (Pharmacist Executive)
const isPEAgent = (designation) => {
  if (!designation) return false;
  const d = designation.toLowerCase();
  return d === 'pe' || d === 'pharmacist executive';
};

// Helper function to check if agent is RE (Relationship Executive)
const isREAgent = (designation) => {
  if (!designation) return false;
  const d = designation.toLowerCase();
  return d === 're' || d === 'relationship executive';
};

function HealthManagerDashboard({ currentUser }) {
  const { colors } = useThemeMode();

  // Theme-aware status config
  const getThemedStatusConfig = useCallback((status) => {
    const configs = {
      "Available": { label: "Available", color: colors.statusAvailable.color, bgColor: colors.statusAvailable.bg },
      "On Call": { label: "On Call", color: colors.statusOnCallHealth.color, bgColor: colors.statusOnCallHealth.bg },
      "Unavailable": { label: "Offline", color: colors.statusOffline.color, bgColor: colors.statusOffline.bg },
      "Login": { label: "Available", color: colors.statusAvailable.color, bgColor: colors.statusAvailable.bg },
      "Logout": { label: "Offline", color: colors.statusOffline.color, bgColor: colors.statusOffline.bg },
      "Logged Out": { label: "Offline", color: colors.statusOffline.color, bgColor: colors.statusOffline.bg },
      "Idle": { label: "Available", color: colors.statusAvailable.color, bgColor: colors.statusAvailable.bg },
      "Busy": { label: "On Call", color: colors.statusOnCallHealth.color, bgColor: colors.statusOnCallHealth.bg },
    };
    return configs[status] || configs["Unavailable"];
  }, [colors]);

  const [healthAgents, setHealthAgents] = useState([]);
  const [healthTLs, setHealthTLs] = useState([]);
  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState("grid");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [agentTypeFilter, setAgentTypeFilter] = useState("all"); // "all", "pe", "re"
  const [scorecardFilter, setScorecardFilter] = useState(null); // "totalAgents", "online", "totalCalls", "successRate"
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    callType: "all",
    escalation: "all",
    callConnected: "all",
    agentType: "all",
  });
  const navigate = useNavigate();

  // Optimized data fetching - batch queries instead of nested listeners
  const fetchHealthData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch Health TLs (single query)
      const healthTLsSnap = await getDocs(collection(db, "healthTeamLeads"));
      const tls = healthTLsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setHealthTLs(tls);

      // Fetch Health Agents (single query)
      const healthAgentsSnap = await getDocs(collection(db, "healthAgents"));
      const agentsData = healthAgentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Batch fetch call logs for all agents with Promise.all
      const agentsWithLogs = await Promise.all(
        agentsData.map(async (agentData) => {
          const agentId = agentData.id;

          // Fetch call logs with limit (max 100 per agent)
          const logsSnap = await getDocs(
            query(
              collection(db, "healthAgents", agentId, "callLogs"),
              orderBy("timestamp", "desc"),
              limit(100)
            )
          );

          const logs = logsSnap.docs.map((log) => {
            const data = log.data();
            return {
              id: log.id,
              ...data,
              timestamp: data.timestamp instanceof Timestamp
                ? data.timestamp.toDate()
                : data.timestamp
                ? new Date(data.timestamp)
                : null,
              startTime: data.startTime instanceof Timestamp
                ? data.startTime.toDate()
                : data.startTime
                ? new Date(data.startTime)
                : null,
              endTime: data.endTime instanceof Timestamp
                ? data.endTime.toDate()
                : data.endTime
                ? new Date(data.endTime)
                : null,
              agentId,
              agentName: agentData.name,
              agentEmpId: agentData.empId || "",
              agentDesignation: agentData.designation || "",
              collectionName: "healthAgents",
            };
          });

          const totalCalls = logs.length;
          const connectedCalls = logs.filter((log) => log.callConnected === true).length;

          return {
            uid: agentId,
            collection: "healthAgents",
            name: agentData.name || "Unknown Agent",
            email: agentData.email || "",
            empId: agentData.empId || "",
            mobile: agentData.mobile || agentData.phoneNumber || "",
            status: agentData.status || "Logout",
            department: "Health",
            designation: agentData.designation || "",
            teamLeadId: agentData.teamLeadId || "",
            avatar: agentData.name?.charAt(0) || "H",
            totalCalls,
            connectedCalls,
            callLogs: logs,
          };
        })
      );

      // Sort agents by name
      agentsWithLogs.sort((a, b) => a.name.localeCompare(b.name));
      setHealthAgents(agentsWithLogs);

      // Aggregate all call logs (deduplicated)
      const allLogs = agentsWithLogs.flatMap(agent => agent.callLogs);
      setCallLogs(allLogs);

      setLoading(false);
    } catch (error) {
      console.error("Error in fetchHealthData:", error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    fetchHealthData();
  }, [currentUser, fetchHealthData]);

  // Filter agents by designation type first - memoized
  const agentsByType = useMemo(() => {
    return healthAgents.filter((agent) => {
      if (agentTypeFilter === "all") return true;
      if (agentTypeFilter === "pe") return isPEAgent(agent.designation);
      if (agentTypeFilter === "re") return isREAgent(agent.designation);
      return true;
    });
  }, [healthAgents, agentTypeFilter]);

  // Filter agents by search query and scorecard filter - memoized
  const filteredAgents = useMemo(() => {
    let filtered = agentsByType;

    // Apply scorecard filter first
    if (scorecardFilter) {
      switch (scorecardFilter) {
        case "online":
          // Show only online/active agents
          filtered = filtered.filter(agent => isAgentActive(agent.status));
          break;
        case "totalCalls":
          // Show agents with at least 1 call
          filtered = filtered.filter(agent => (agent.totalCalls || 0) > 0);
          break;
        case "successRate":
          // Show agents with calls, will sort by success rate
          filtered = filtered.filter(agent => (agent.totalCalls || 0) > 0);
          break;
        // "totalAgents" shows all agents (no additional filter)
        default:
          break;
      }
    }

    const query = searchQuery.toLowerCase();
    return filtered.filter((agent) => {
      const basicMatch =
        agent.name?.toLowerCase().includes(query) ||
        agent.email?.toLowerCase().includes(query) ||
        agent.empId?.toLowerCase().includes(query) ||
        agent.mobile?.includes(query);

      const callLogMatch = agent.callLogs?.some(log =>
        log.sid?.toLowerCase().includes(query) ||
        log.callId?.toLowerCase().includes(query) ||
        log.clientNumber?.includes(query)
      );

      return basicMatch || callLogMatch;
    }).sort((a, b) => {
      if (scorecardFilter === "successRate") {
        // Sort by success rate (highest first)
        const aRate = a.totalCalls > 0 ? (a.connectedCalls / a.totalCalls) : 0;
        const bRate = b.totalCalls > 0 ? (b.connectedCalls / b.totalCalls) : 0;
        return bRate - aRate;
      }
      // Default: sort by total calls (most calls first)
      const aCallCount = a.totalCalls || 0;
      const bCallCount = b.totalCalls || 0;
      return bCallCount - aCallCount;
    });
  }, [agentsByType, searchQuery, scorecardFilter]);

  // Filter call logs by agent type - memoized
  const filteredCallLogs = useMemo(() => {
    return callLogs.filter((log) => {
      if (agentTypeFilter === "all") return true;
      if (agentTypeFilter === "pe") return isPEAgent(log.agentDesignation);
      if (agentTypeFilter === "re") return isREAgent(log.agentDesignation);
      return true;
    });
  }, [callLogs, agentTypeFilter]);

  // Calculate stats based on filtered agents - memoized
  const stats = useMemo(() => {
    const totalHealthAgents = agentsByType.length;
    const onlineHealthAgents = agentsByType.filter((a) => isAgentActive(a.status)).length;
    const totalCallsAllAgents = agentsByType.reduce((sum, agent) => sum + (agent.totalCalls || 0), 0);
    const totalConnectedCalls = agentsByType.reduce((sum, agent) => sum + (agent.connectedCalls || 0), 0);
    const overallSuccessRate = totalCallsAllAgents > 0
      ? Math.round((totalConnectedCalls / totalCallsAllAgents) * 100)
      : 0;
    return { totalHealthAgents, onlineHealthAgents, totalCallsAllAgents, totalConnectedCalls, overallSuccessRate };
  }, [agentsByType]);

  const { totalHealthAgents, onlineHealthAgents, totalCallsAllAgents, totalConnectedCalls, overallSuccessRate } = stats;

  // Count agents by designation for display - memoized
  const { peAgentCount, reAgentCount } = useMemo(() => ({
    peAgentCount: healthAgents.filter(a => isPEAgent(a.designation)).length,
    reAgentCount: healthAgents.filter(a => isREAgent(a.designation)).length,
  }), [healthAgents]);

  // Analytics Data - uses filtered data based on agent type - memoized
  const analyticsData = useMemo(() => ({
    callsByDate: (() => {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      return last7Days.map(date => {
        const logsOnDate = filteredCallLogs.filter(log => {
          if (!log.timestamp) return false;
          const logDate = new Date(log.timestamp).toISOString().split('T')[0];
          return logDate === date;
        });

        return {
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          total: logsOnDate.length,
          connected: logsOnDate.filter(l => l.callConnected).length,
          notConnected: logsOnDate.filter(l => !l.callConnected).length,
        };
      });
    })(),

    callStatus: [
      { name: 'Connected', value: totalConnectedCalls, color: '#22c55e' },
      { name: 'Not Connected', value: totalCallsAllAgents - totalConnectedCalls, color: '#ef4444' },
    ],

    callsByType: (() => {
      const types = {};
      filteredCallLogs.forEach(log => {
        const type = log.callType || 'Unknown';
        types[type] = (types[type] || 0) + 1;
      });
      return Object.entries(types).map(([name, value]) => ({ name, value }));
    })(),

    topAgents: agentsByType
      .map(agent => ({
        name: agent.name?.split(' ')[0] || 'Unknown',
        fullName: agent.name,
        designation: agent.designation || '',
        totalCalls: agent.totalCalls || 0,
        connectedCalls: agent.connectedCalls || 0,
        successRate: agent.totalCalls > 0
          ? Math.round((agent.connectedCalls / agent.totalCalls) * 100)
          : 0,
      }))
      .sort((a, b) => b.totalCalls - a.totalCalls)
      .slice(0, 5),

    hourlyDistribution: (() => {
      const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i.toString().padStart(2, "0")}:00`, calls: 0, connected: 0 }));
      filteredCallLogs.forEach(log => {
        if (log.timestamp) {
          const hour = new Date(log.timestamp).getHours();
          hours[hour].calls++;
          if (log.callConnected) hours[hour].connected++;
        }
      });
      return hours;
    })(),

    // Connection Rate Trend
    connectionRateTrend: (() => {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      return last7Days.map(date => {
        const logsOnDate = filteredCallLogs.filter(log => {
          if (!log.timestamp) return false;
          const logDate = new Date(log.timestamp).toISOString().split('T')[0];
          return logDate === date;
        });

        const total = logsOnDate.length;
        const connected = logsOnDate.filter(l => l.callConnected).length;
        const rate = total > 0 ? Math.round((connected / total) * 100) : 0;

        return {
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          rate,
          total,
        };
      });
    })(),

    // Duration Distribution
    durationDistribution: (() => {
      const ranges = [
        { name: "< 1 min", min: 0, max: 60, count: 0 },
        { name: "1-3 min", min: 60, max: 180, count: 0 },
        { name: "3-5 min", min: 180, max: 300, count: 0 },
        { name: "5-10 min", min: 300, max: 600, count: 0 },
        { name: "> 10 min", min: 600, max: Infinity, count: 0 },
      ];

      filteredCallLogs.forEach(log => {
        if (log.callConnected && log.startTime && log.endTime) {
          const start = log.startTime instanceof Date ? log.startTime : new Date(log.startTime);
          const end = log.endTime instanceof Date ? log.endTime : new Date(log.endTime);
          const durationSeconds = (end - start) / 1000;

          for (const range of ranges) {
            if (durationSeconds >= range.min && durationSeconds < range.max) {
              range.count++;
              break;
            }
          }
        }
      });

      const colors = ["#D97706", "#059669", "#EA580C", "#0891B2", "#7C3AED"];
      return ranges.map((range, index) => ({
        name: range.name,
        value: range.count,
        color: colors[index],
      })).filter(item => item.value > 0);
    })(),

    // Day of Week Analysis
    dayOfWeekData: (() => {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayMap = new Map();

      days.forEach((day, index) => {
        dayMap.set(index, { day, calls: 0, connected: 0 });
      });

      filteredCallLogs.forEach(log => {
        if (log.timestamp) {
          const date = new Date(log.timestamp);
          const dayIndex = date.getDay();
          const data = dayMap.get(dayIndex);
          data.calls++;
          if (log.callConnected) data.connected++;
        }
      });

      return Array.from(dayMap.values());
    })(),

    // Weekly Comparison
    weeklyComparison: (() => {
      const weekMap = new Map();

      filteredCallLogs.forEach(log => {
        if (!log.timestamp) return;

        const date = new Date(log.timestamp);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });

        if (!weekMap.has(weekKey)) {
          weekMap.set(weekKey, {
            week: weekKey,
            totalCalls: 0,
            connected: 0,
          });
        }

        const weekData = weekMap.get(weekKey);
        weekData.totalCalls++;
        if (log.callConnected) weekData.connected++;
      });

      return Array.from(weekMap.values())
        .map(week => ({
          ...week,
          rate: week.totalCalls > 0 ? Math.round((week.connected / week.totalCalls) * 100) : 0,
        }))
        .sort((a, b) => new Date(a.week) - new Date(b.week));
    })(),
  }), [filteredCallLogs, agentsByType, totalConnectedCalls, totalCallsAllAgents]);

  // Format helpers
  const formatTimestamp = (timestamp) => {
    if (!timestamp || isNaN(timestamp)) return "N/A";
    return timestamp.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: true,
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateActualDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return "N/A";
    const start = startTime instanceof Date ? startTime : new Date(startTime);
    const end = endTime instanceof Date ? endTime : new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "N/A";
    const durationMs = end - start;
    if (durationMs < 0) return "N/A";
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const formatDuration = (duration) => {
    if (!duration || typeof duration !== "object") return "N/A";
    return `${duration.hours || 0}h ${duration.minutes || 0}m ${duration.seconds || 0}s`;
  };

  // Apply filters to call logs
  const applyFilters = (logs) => {
    return logs.filter((log) => {
      if (filters.dateFrom) {
        const logDate = log.timestamp ? new Date(log.timestamp) : null;
        const fromDate = new Date(filters.dateFrom);
        if (!logDate || logDate < fromDate) return false;
      }
      if (filters.dateTo) {
        const logDate = log.timestamp ? new Date(log.timestamp) : null;
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (!logDate || logDate > toDate) return false;
      }
      if (filters.callType !== "all" && log.callType !== filters.callType) return false;
      if (filters.escalation !== "all") {
        const isEscalated = log.escalation === "Yes" || log.escalation === true;
        if (filters.escalation === "yes" && !isEscalated) return false;
        if (filters.escalation === "no" && isEscalated) return false;
      }
      if (filters.callConnected !== "all") {
        if (filters.callConnected === "connected" && !log.callConnected) return false;
        if (filters.callConnected === "not_connected" && log.callConnected) return false;
      }
      return true;
    });
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      callType: "all",
      escalation: "all",
      callConnected: "all",
      agentType: "all",
    });
    setAgentTypeFilter("all");
  };

  // Refresh data
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Agent Name", "MSID", "Designation", "SID", "Call ID", "Client Number", "Call Type",
      "Agent Type", "Escalation", "Call Category", "Partner", "Timestamp",
      "Manual Duration", "Actual Duration", "Connected", "Status", "Reason", "Remarks",
    ];

    const filteredLogs = applyFilters(filteredCallLogs);
    const rows = filteredLogs.map((log) => [
      log.agentName || "N/A",
      log.agentEmpId || "N/A",
      log.agentDesignation || "N/A",
      log.sid || "N/A",
      log.callId || log.id || "N/A",
      log.clientNumber || "N/A",
      log.callType || "N/A",
      log.agentType || "N/A",
      log.escalation || "N/A",
      log.callCategory || "N/A",
      log.partner || log.partnerName || "N/A",
      log.timestamp ? formatTimestamp(log.timestamp) : "N/A",
      formatDuration(log.duration),
      log.callConnected ? calculateActualDuration(log.startTime, log.endTime) : "N/A",
      log.callConnected ? "Yes" : "No",
      log.callConnected ? log.callStatus || "N/A" : "N/A",
      log.callConnected ? "N/A" : log.notConnectedReason || "N/A",
      log.remarks || "N/A",
    ]);

    if (rows.length === 0) {
      agentsByType.forEach((agent) => {
        rows.push([agent.name || "N/A", agent.empId || "N/A", agent.designation || "N/A", ...Array(15).fill("N/A")]);
      });
    }

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `health_team_calls_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Download individual agent CSV
  const handleDownloadAgentCSV = (event, agent) => {
    event.stopPropagation();

    const headers = [
      "Agent Name", "MSID", "SID", "Call ID", "Client Number", "Call Type",
      "Agent Type", "Escalation", "Partner", "Timestamp", "Duration", "Connected", "Remarks",
    ];

    // Apply date filters to agent logs
    let agentLogs = agent.callLogs || [];
    if (filters.dateFrom || filters.dateTo) {
      agentLogs = agentLogs.filter((log) => {
        const logDate = log.timestamp ? new Date(log.timestamp) : null;
        if (!logDate) return false;
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (logDate < fromDate) return false;
        }
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (logDate > toDate) return false;
        }
        return true;
      });
    }

    const rows = agentLogs.map((log) => [
      agent.name || "N/A",
      agent.empId || "N/A",
      log.sid || "N/A",
      log.callId || log.id || "N/A",
      log.clientNumber || "N/A",
      log.callType || "N/A",
      log.agentType || "N/A",
      log.escalation ? "Yes" : "No",
      log.partner || "N/A",
      formatTimestamp(log.timestamp),
      log.callConnected ? calculateActualDuration(log.startTime, log.endTime) : "N/A",
      log.callConnected ? "Yes" : "No",
      log.remarks || "N/A",
    ]);

    if (rows.length === 0) {
      rows.push([agent.name || "N/A", agent.empId || "N/A", ...Array(11).fill("N/A")]);
    }

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${agent.name.replace(/\s+/g, "_")}_calls_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          bgcolor: colors.bg,
        }}
      >
        <CircularProgress size={60} sx={{ color: colors.primary || '#D97706', mb: 2 }} />
        <Typography variant="body1" sx={{ color: colors.textSec }}>
          Loading Health Department data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: colors.bg, color: colors.text, minHeight: "100vh" }}>
      {/* Loading Progress */}
      {refreshing && <LinearProgress sx={{ position: "absolute", top: 0, left: 0, right: 0 }} />}

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: colors.text, lineHeight: 1.3 }}>
              Health Department
            </Typography>
            <Typography variant="body2" sx={{ color: colors.textSec, mt: 0.5 }}>
              {totalHealthAgents} agents &middot; {onlineHealthAgents} online &middot; View and manage your team's performance
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <IconButton
              size="small"
              onClick={handleRefresh}
              sx={{
                color: colors.textSec,
                animation: refreshing ? "spin 1s linear infinite" : "none",
                "@keyframes spin": {
                  "0%": { transform: "rotate(0deg)" },
                  "100%": { transform: "rotate(360deg)" },
                },
              }}
            >
              <Refresh sx={{ fontSize: 20 }} />
            </IconButton>
            <Button
              size="small"
              variant="outlined"
              startIcon={<FilterList sx={{ fontSize: 18 }} />}
              onClick={() => setFilterDialogOpen(true)}
              sx={{
                borderRadius: "8px",
                borderColor: colors.border,
                color: colors.textSec,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.8rem",
                px: 2,
                "&:hover": {
                  borderColor: colors.primary || '#D97706',
                  bgcolor: colors.primarySoft || 'rgba(217,119,6,0.08)',
                },
              }}
            >
              Filters
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<FileDownload sx={{ fontSize: 18 }} />}
              onClick={handleExportCSV}
              sx={{
                borderRadius: "8px",
                borderColor: colors.primary || '#D97706',
                color: colors.primary || '#D97706',
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.8rem",
                px: 2,
                "&:hover": {
                  bgcolor: colors.primarySoft || 'rgba(217,119,6,0.08)',
                  borderColor: colors.primaryDark || '#B45309',
                },
              }}
            >
              Export CSV
            </Button>
          </Box>
        </Box>

        {/* Agent Type Filter - Clean pill buttons */}
        <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          {[
            { value: "all", label: `All (${healthAgents.length})`, icon: <Group sx={{ fontSize: 16 }} /> },
            { value: "pe", label: `PE - Pharmacist (${peAgentCount})`, icon: <LocalPharmacy sx={{ fontSize: 16 }} /> },
            { value: "re", label: `RE - Relationship (${reAgentCount})`, icon: <SupportAgent sx={{ fontSize: 16 }} /> },
          ].map((item) => (
            <Chip
              key={item.value}
              icon={item.icon}
              label={item.label}
              size="small"
              onClick={() => { setAgentTypeFilter(item.value); setPage(0); }}
              sx={{
                fontWeight: 600,
                fontSize: "0.78rem",
                borderRadius: "8px",
                height: 32,
                border: `1px solid ${agentTypeFilter === item.value ? (colors.primary || '#D97706') : colors.border}`,
                bgcolor: agentTypeFilter === item.value ? (colors.primarySoft || '#FFFBEB') : 'transparent',
                color: agentTypeFilter === item.value ? (colors.primary || '#D97706') : colors.textSec,
                "& .MuiChip-icon": {
                  color: agentTypeFilter === item.value ? (colors.primary || '#D97706') : colors.textMuted,
                },
                "&:hover": {
                  bgcolor: colors.primarySoft || 'rgba(217,119,6,0.08)',
                  borderColor: colors.primary || '#D97706',
                },
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Active Filter Indicator */}
      {scorecardFilter && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            bgcolor: colors.isDark ? "rgba(99,102,241,0.12)" : "#e0e7ff",
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: "#4338ca" }}>
            Filtering by: {scorecardFilter === "totalAgents" ? "All Agents" :
                         scorecardFilter === "online" ? "Online Agents" :
                         scorecardFilter === "totalCalls" ? "Agents with Calls" :
                         scorecardFilter === "successRate" ? "Success Rate (High to Low)" : scorecardFilter}
          </Typography>
          <Button
            size="small"
            onClick={() => setScorecardFilter(null)}
            sx={{ color: "#4338ca", fontWeight: 600 }}
          >
            Clear Filter
          </Button>
        </Paper>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedStatCard
            title="Total Agents"
            value={totalHealthAgents}
            icon={<Group sx={{ fontSize: 28 }} />}
            colors={colors}
            subtitle={`${healthTLs.length} TLs`}
            onClick={() => {
              setScorecardFilter(scorecardFilter === "totalAgents" ? null : "totalAgents");
              setActiveTab(0);
            }}
            isActive={scorecardFilter === "totalAgents"}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedStatCard
            title="Online Now"
            value={onlineHealthAgents}
            icon={<Circle sx={{ fontSize: 28 }} />}
            colors={colors}
            trend="up"
            trendValue={`${Math.round((onlineHealthAgents / totalHealthAgents) * 100) || 0}% Active`}
            onClick={() => {
              setScorecardFilter(scorecardFilter === "online" ? null : "online");
              setActiveTab(0);
            }}
            isActive={scorecardFilter === "online"}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedStatCard
            title="Total Calls"
            value={totalCallsAllAgents}
            icon={<Phone sx={{ fontSize: 28 }} />}
            colors={colors}
            subtitle={`${totalConnectedCalls} Connected`}
            onClick={() => {
              setScorecardFilter(scorecardFilter === "totalCalls" ? null : "totalCalls");
              setActiveTab(0);
            }}
            isActive={scorecardFilter === "totalCalls"}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedStatCard
            title="Success Rate"
            value={overallSuccessRate}
            icon={<TrendingUp sx={{ fontSize: 28 }} />}
            colors={colors}
            subtitle={`${overallSuccessRate}% Conversion`}
            onClick={() => {
              setScorecardFilter(scorecardFilter === "successRate" ? null : "successRate");
              setActiveTab(0);
            }}
            isActive={scorecardFilter === "successRate"}
          />
        </Grid>
      </Grid>

      {/* Tabs for different views */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{
            borderBottom: 1,
            borderColor: colors.border,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.95rem",
              color: colors.textSec,
              "&.Mui-selected": {
                color: colors.primary || '#D97706',
              },
            },
            "& .MuiTabs-indicator": {
              backgroundColor: colors.primary || '#D97706',
            },
          }}
        >
          <Tab icon={<Group />} iconPosition="start" label="Agents" />
          <Tab icon={<Assessment />} iconPosition="start" label="Analytics" />
          <Tab icon={<Timeline />} iconPosition="start" label="Call Logs" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Box>
          {/* Search and View Toggle */}
          <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
            <TextField
              placeholder="Search by name, phone, SID, Call ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                flexGrow: 1,
                minWidth: 300,
                "& .MuiOutlinedInput-root": {
                  color: colors.text,
                  "& fieldset": { borderColor: colors.border },
                  "&:hover fieldset": { borderColor: colors.primary || '#D97706' },
                },
                "& .MuiInputBase-input::placeholder": { color: colors.textMuted, opacity: 1 },
              }}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: colors.textMuted }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 },
              }}
            />
            <Box sx={{ display: "flex", bgcolor: colors.bgCardHover, borderRadius: 2, p: 0.5 }}>
              <IconButton
                onClick={() => setViewMode("grid")}
                sx={{
                  bgcolor: viewMode === "grid" ? colors.bgPaper : "transparent",
                  boxShadow: viewMode === "grid" ? 1 : 0,
                  borderRadius: 1.5,
                  color: colors.text,
                }}
              >
                <GridView />
              </IconButton>
              <IconButton
                onClick={() => setViewMode("list")}
                sx={{
                  bgcolor: viewMode === "list" ? colors.bgPaper : "transparent",
                  boxShadow: viewMode === "list" ? 1 : 0,
                  borderRadius: 1.5,
                  color: colors.text,
                }}
              >
                <ViewList />
              </IconButton>
            </Box>
          </Box>

          {/* Agents Grid */}
          {viewMode === "grid" ? (
            <Grid container spacing={3}>
              {filteredAgents.map((agent) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={agent.uid}>
                  <AgentCard
                    agent={agent}
                    onDownload={handleDownloadAgentCSV}
                    onClick={() => navigate(`/agent-details/healthAgents/${agent.uid}`)}
                    colors={colors}
                    statusConfig={getThemedStatusConfig(agent.status)}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '12px', border: `1px solid ${colors.border}`, bgcolor: colors.bgPaper }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: colors.bgTableHeader }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: 12, color: colors.textSec, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottomColor: colors.border }}>Agent</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 12, color: colors.textSec, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottomColor: colors.border }}>Designation</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 12, color: colors.textSec, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottomColor: colors.border }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 12, color: colors.textSec, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottomColor: colors.border }} align="center">Total Calls</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 12, color: colors.textSec, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottomColor: colors.border }} align="center">Connected</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 12, color: colors.textSec, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottomColor: colors.border }} align="center">Success Rate</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 12, color: colors.textSec, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottomColor: colors.border }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAgents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((agent) => (
                    <TableRow
                      key={agent.uid}
                      hover
                      sx={{ cursor: "pointer", "&:hover": { bgcolor: colors.bgCardHover } }}
                      onClick={() => navigate(`/agent-details/healthAgents/${agent.uid}`)}
                    >
                      <TableCell sx={{ color: colors.text }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar sx={{ bgcolor: "#D97706" }}>{agent.avatar}</Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600} sx={{ color: colors.text }}>{agent.name}</Typography>
                            <Typography variant="caption" sx={{ color: colors.textSec }}>{agent.empId}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={agent.designation || "N/A"}
                          size="small"
                          sx={{
                            bgcolor: isPEAgent(agent.designation) ? colors.statusBreak.bg : isREAgent(agent.designation) ? colors.statusOnCall.bg : colors.statusOffline.bg,
                            color: isPEAgent(agent.designation) ? colors.statusBreak.color : isREAgent(agent.designation) ? colors.statusOnCall.color : colors.statusOffline.color,
                            fontWeight: 500,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getThemedStatusConfig(agent.status).label}
                          size="small"
                          sx={{
                            bgcolor: getThemedStatusConfig(agent.status).bgColor,
                            color: getThemedStatusConfig(agent.status).color,
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={600} sx={{ color: colors.text }}>{agent.totalCalls || 0}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={600} color="success.main">{agent.connectedCalls || 0}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${agent.totalCalls > 0 ? Math.round((agent.connectedCalls / agent.totalCalls) * 100) : 0}%`}
                          size="small"
                          sx={{ bgcolor: colors.isDark ? "rgba(59,130,246,0.08)" : "#eff6ff", color: "#3b82f6" }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Download Report">
                          <IconButton
                            size="small"
                            onClick={(e) => handleDownloadAgentCSV(e, agent)}
                            sx={{ color: colors.textSec }}
                          >
                            <FileDownload fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Details">
                          <IconButton size="small" sx={{ color: colors.textSec }}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredAgents.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                sx={{
                  color: colors.text,
                  borderTop: `1px solid ${colors.border}`,
                  ".MuiTablePagination-selectLabel": { color: colors.textSec },
                  ".MuiTablePagination-displayedRows": { color: colors.textSec },
                  ".MuiTablePagination-selectIcon": { color: colors.textMuted },
                  ".MuiTablePagination-select": { color: colors.text },
                  ".MuiIconButton-root": { color: colors.textSec },
                }}
              />
            </TableContainer>
          )}

          {filteredAgents.length === 0 && (
            <Paper sx={{ p: 6, textAlign: "center", borderRadius: 3, bgcolor: colors.bgPaper, border: `1px solid ${colors.border}` }}>
              <Group sx={{ fontSize: 64, color: colors.textMuted, mb: 2 }} />
              <Typography variant="h6" sx={{ color: colors.textSec }}>
                No health agents found
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          {/* Row 1: Calls Trend (Full Width) */}
          <Grid item xs={12}>
            <ChartCard
              colors={colors}
              title="Calls Trend (Last 7 Days)"
              chartData={analyticsData.callsByDate}
              columns={["date", "total", "connected", "notConnected"]}
              height={300}
              chartElement={
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.callsByDate}>
                    <defs>
                      <linearGradient id="colorConnectedHealth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={"#059669"} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={"#059669"} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorNotConnectedHealth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={"#A5B4FC"} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={"#A5B4FC"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: colors.chartTick }} />
                    <YAxis tick={{ fontSize: 12, fill: colors.chartTick }} />
                    <RechartsTooltip content={<CustomChartTooltip colors={colors} />} />
                    <Legend formatter={(value) => <span style={{ color: colors.chartLegend }}>{value}</span>} />
                    <Area type="monotone" dataKey="connected" stroke={"#059669"} fillOpacity={1} fill="url(#colorConnectedHealth)" name="Connected" strokeWidth={2} />
                    <Area type="monotone" dataKey="notConnected" stroke={"#A5B4FC"} fillOpacity={1} fill="url(#colorNotConnectedHealth)" name="Not Connected" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              }
            >
              {analyticsData.callsByDate.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.callsByDate}>
                    <defs>
                      <linearGradient id="colorConnectedHealthSmall" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={"#059669"} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={"#059669"} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorNotConnectedHealthSmall" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={"#A5B4FC"} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={"#A5B4FC"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: colors.chartTick }} />
                    <YAxis tick={{ fontSize: 11, fill: colors.chartTick }} />
                    <RechartsTooltip content={<CustomChartTooltip colors={colors} />} />
                    <Legend formatter={(value) => <span style={{ color: colors.chartLegend }}>{value}</span>} />
                    <Area type="monotone" dataKey="connected" stroke={"#059669"} fillOpacity={1} fill="url(#colorConnectedHealthSmall)" name="Connected" strokeWidth={2} />
                    <Area type="monotone" dataKey="notConnected" stroke={"#A5B4FC"} fillOpacity={1} fill="url(#colorNotConnectedHealthSmall)" name="Not Connected" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                  <Typography sx={{ color: colors.textSec }}>No data available</Typography>
                </Box>
              )}
            </ChartCard>
          </Grid>

          {/* Row 2: Call Status & Top Performers */}
          <Grid item xs={12} md={6}>
            <ChartCard
              colors={colors}
              title="Call Status Distribution"
              chartData={analyticsData.callStatus}
              columns={["name", "value"]}
              height={300}
              chartElement={
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analyticsData.callStatus} cx="50%" cy="50%" innerRadius={100} outerRadius={160} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}>
                      {analyticsData.callStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomChartTooltip colors={colors} />} />
                    <Legend formatter={(value) => <span style={{ color: colors.chartLegend }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              }
            >
              {analyticsData.callStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analyticsData.callStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                      {analyticsData.callStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomChartTooltip colors={colors} />} />
                    <Legend formatter={(value) => <span style={{ color: colors.chartLegend }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                  <Typography sx={{ color: colors.textSec }}>No data available</Typography>
                </Box>
              )}
            </ChartCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <ChartCard
              colors={colors}
              title="Top 5 Performers"
              chartData={analyticsData.topAgents}
              columns={["name", "totalCalls", "connectedCalls"]}
              height={300}
              chartElement={
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.topAgents} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: colors.chartTick }} />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fill: colors.chartTick }} />
                    <RechartsTooltip content={<CustomChartTooltip colors={colors} />} />
                    <Legend formatter={(value) => <span style={{ color: colors.chartLegend }}>{value}</span>} />
                    <Bar dataKey="connectedCalls" fill={"#059669"} name="Connected" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="totalCalls" fill={"#D97706"} name="Total Calls" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              }
            >
              {analyticsData.topAgents.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.topAgents} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: colors.chartTick }} />
                    <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 10, fill: colors.chartTick }} />
                    <RechartsTooltip content={<CustomChartTooltip colors={colors} />} />
                    <Legend wrapperStyle={{ fontSize: 10 }} formatter={(value) => <span style={{ color: colors.chartLegend }}>{value}</span>} />
                    <Bar dataKey="connectedCalls" fill={"#059669"} name="Connected" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="totalCalls" fill={"#D97706"} name="Total" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                  <Typography sx={{ color: colors.textSec }}>No data available</Typography>
                </Box>
              )}
            </ChartCard>
          </Grid>

          {/* Row 3: Calls by Type & Connection Rate */}
          <Grid item xs={12} md={6}>
            <ChartCard
              colors={colors}
              title="Calls by Type"
              chartData={analyticsData.callsByType}
              columns={["name", "value"]}
              height={300}
              chartElement={
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.callsByType}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: colors.chartTick }} />
                    <YAxis tick={{ fontSize: 11, fill: colors.chartTick }} />
                    <RechartsTooltip content={<CustomChartTooltip colors={colors} />} />
                    <Bar dataKey="value" fill={"#D97706"} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              }
            >
              {analyticsData.callsByType.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.callsByType}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: colors.chartTick }} angle={-15} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 10, fill: colors.chartTick }} />
                    <RechartsTooltip content={<CustomChartTooltip colors={colors} />} />
                    <Bar dataKey="value" fill={"#D97706"} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                  <Typography sx={{ color: colors.textSec }}>No data available</Typography>
                </Box>
              )}
            </ChartCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <ChartCard
              colors={colors}
              title="Connection Rate Trend"
              chartData={analyticsData.connectionRateTrend}
              columns={["date", "rate", "total"]}
              height={300}
              chartElement={
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.connectionRateTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: colors.chartTick }} />
                    <YAxis tick={{ fontSize: 11, fill: colors.chartTick }} domain={[0, 100]} />
                    <RechartsTooltip content={<CustomChartTooltip colors={colors} />} />
                    <Legend formatter={(value) => <span style={{ color: colors.chartLegend }}>{value}</span>} />
                    <Line type="monotone" dataKey="rate" stroke={"#F59E0B"} name="Rate %" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              }
            >
              {analyticsData.connectionRateTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.connectionRateTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: colors.chartTick }} />
                    <YAxis tick={{ fontSize: 10, fill: colors.chartTick }} domain={[0, 100]} />
                    <RechartsTooltip content={<CustomChartTooltip colors={colors} />} />
                    <Line type="monotone" dataKey="rate" stroke={"#F59E0B"} name="Rate %" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                  <Typography sx={{ color: colors.textSec }}>No data available</Typography>
                </Box>
              )}
            </ChartCard>
          </Grid>

          {/* Row 4: Duration Distribution & Day of Week */}
          <Grid item xs={12} md={6}>
            <ChartCard
              colors={colors}
              title="Call Duration Distribution"
              chartData={analyticsData.durationDistribution}
              columns={["name", "value"]}
              height={300}
              chartElement={
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analyticsData.durationDistribution} cx="50%" cy="50%" innerRadius={80} outerRadius={140} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}>
                      {analyticsData.durationDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomChartTooltip colors={colors} />} />
                    <Legend formatter={(value) => <span style={{ color: colors.chartLegend }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              }
            >
              {analyticsData.durationDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analyticsData.durationDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" label={({ name }) => name} labelLine={false}>
                      {analyticsData.durationDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomChartTooltip colors={colors} />} />
                    <Legend wrapperStyle={{ fontSize: 10 }} formatter={(value) => <span style={{ color: colors.chartLegend }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                  <Typography sx={{ color: colors.textSec }}>No data available</Typography>
                </Box>
              )}
            </ChartCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <ChartCard
              colors={colors}
              title="Calls by Day of Week"
              chartData={analyticsData.dayOfWeekData}
              columns={["day", "calls", "connected"]}
              height={300}
              chartElement={
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.dayOfWeekData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: colors.chartTick }} />
                    <YAxis tick={{ fontSize: 12, fill: colors.chartTick }} />
                    <RechartsTooltip content={<CustomChartTooltip colors={colors} />} />
                    <Legend formatter={(value) => <span style={{ color: colors.chartLegend }}>{value}</span>} />
                    <Bar dataKey="calls" fill={"#D97706"} name="Total Calls" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="connected" fill={"#059669"} name="Connected" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              }
            >
              {analyticsData.dayOfWeekData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.dayOfWeekData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: colors.chartTick }} />
                    <YAxis tick={{ fontSize: 10, fill: colors.chartTick }} />
                    <RechartsTooltip content={<CustomChartTooltip colors={colors} />} />
                    <Legend wrapperStyle={{ fontSize: 10 }} formatter={(value) => <span style={{ color: colors.chartLegend }}>{value}</span>} />
                    <Bar dataKey="calls" fill={"#D97706"} name="Total" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="connected" fill={"#059669"} name="Connected" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                  <Typography sx={{ color: colors.textSec }}>No data available</Typography>
                </Box>
              )}
            </ChartCard>
          </Grid>

          {/* Row 5: Hourly Distribution */}
          <Grid item xs={12} md={6}>
            <ChartCard
              colors={colors}
              title="Hourly Call Distribution"
              chartData={analyticsData.hourlyDistribution}
              columns={["hour", "calls", "connected"]}
              height={300}
              chartElement={
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.hourlyDistribution}>
                    <defs>
                      <linearGradient id="colorHourlyHealthExpand" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={"#EA580C"} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={"#EA580C"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: colors.chartTick }} interval={2} />
                    <YAxis tick={{ fontSize: 10, fill: colors.chartTick }} />
                    <RechartsTooltip content={<CustomChartTooltip colors={colors} />} />
                    <Area type="monotone" dataKey="calls" stroke={"#EA580C"} fill="url(#colorHourlyHealthExpand)" name="Calls" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              }
            >
              {analyticsData.hourlyDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.hourlyDistribution}>
                    <defs>
                      <linearGradient id="colorHourlyHealthSmall" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={"#EA580C"} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={"#EA580C"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                    <XAxis dataKey="hour" tick={{ fontSize: 9, fill: colors.chartTick }} interval={3} />
                    <YAxis tick={{ fontSize: 9, fill: colors.chartTick }} />
                    <RechartsTooltip content={<CustomChartTooltip colors={colors} />} />
                    <Area type="monotone" dataKey="calls" stroke={"#EA580C"} fill="url(#colorHourlyHealthSmall)" name="Calls" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                  <Typography sx={{ color: colors.textSec }}>No data available</Typography>
                </Box>
              )}
            </ChartCard>
          </Grid>

          {/* Row 4: Weekly Comparison */}
          <Grid item xs={12} md={6}>
            <ChartCard
              colors={colors}
              title="Weekly Performance Comparison"
              chartData={analyticsData.weeklyComparison}
              columns={["week", "totalCalls", "connected", "rate"]}
              height={300}
              chartElement={
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.weeklyComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                    <XAxis dataKey="week" tick={{ fontSize: 12, fill: colors.chartTick }} />
                    <YAxis tick={{ fontSize: 12, fill: colors.chartTick }} />
                    <RechartsTooltip content={<CustomChartTooltip colors={colors} />} />
                    <Legend formatter={(value) => <span style={{ color: colors.chartLegend }}>{value}</span>} />
                    <Bar dataKey="totalCalls" fill={"#D97706"} name="Total Calls" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="connected" fill={"#059669"} name="Connected" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              }
            >
              {analyticsData.weeklyComparison.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.weeklyComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: colors.chartTick }} />
                    <YAxis tick={{ fontSize: 10, fill: colors.chartTick }} />
                    <RechartsTooltip content={<CustomChartTooltip colors={colors} />} />
                    <Legend wrapperStyle={{ fontSize: 10 }} formatter={(value) => <span style={{ color: colors.chartLegend }}>{value}</span>} />
                    <Bar dataKey="totalCalls" fill={"#D97706"} name="Total" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="connected" fill={"#059669"} name="Connected" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                  <Typography sx={{ color: colors.textSec }}>No data available</Typography>
                </Box>
              )}
            </ChartCard>
          </Grid>

          {/* Agent Performance Summary Card */}
          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${colors.border}`,
                bgcolor: colors.bgPaper,
                borderRadius: '12px',
                height: "100%",
              }}
            >
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: colors.text, mb: 2 }}>
                  Top Performers Summary
                </Typography>
                {analyticsData.topAgents.length > 0 ? (
                  <Box>
                    {analyticsData.topAgents.map((agent, index) => (
                      <Box
                        key={agent.name}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          mb: 1,
                          p: 1.5,
                          borderRadius: "8px",
                          bgcolor: index === 0 ? (colors.primarySoft || '#FFFBEB') : 'transparent',
                          borderBottom: index < analyticsData.topAgents.length - 1 && index !== 0 ? `1px solid ${colors.border}` : 'none',
                        }}
                      >
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.textMuted, width: 20, textAlign: 'center' }}>
                          {index + 1}
                        </Typography>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: colors.primary || '#D97706', fontSize: "0.8rem", fontWeight: 600 }}>
                          {(agent.fullName || agent.name)?.charAt(0) || "A"}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
                            {agent.fullName || agent.name}
                          </Typography>
                          <Typography sx={{ fontSize: 11, color: colors.textMuted }}>
                            {agent.totalCalls} calls &middot; {agent.connectedCalls} connected
                          </Typography>
                        </Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.primary || '#D97706' }}>
                          {agent.successRate}%
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ textAlign: "center", py: 8 }}>
                    <Typography sx={{ color: colors.textSec }}>No data available</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '12px', border: `1px solid ${colors.border}`, bgcolor: colors.bgPaper }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: colors.bgTableHeader }}>
                <TableCell sx={{ fontWeight: 600, fontSize: 12, color: colors.textSec, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottomColor: colors.border }}>Agent</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12, color: colors.textSec, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottomColor: colors.border }}>Designation</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12, color: colors.textSec, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottomColor: colors.border }}>Client Number</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12, color: colors.textSec, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottomColor: colors.border }}>Call Type</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12, color: colors.textSec, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottomColor: colors.border }}>Timestamp</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12, color: colors.textSec, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottomColor: colors.border }} align="center">Duration</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12, color: colors.textSec, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottomColor: colors.border }} align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applyFilters(filteredCallLogs).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((log) => (
                <TableRow key={log.id} hover sx={{ "&:hover": { bgcolor: colors.bgCardHover } }}>
                  <TableCell sx={{ color: colors.text }}>
                    <Typography variant="body2" fontWeight={500} sx={{ color: colors.text }}>{log.agentName}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.agentDesignation || "N/A"}
                      size="small"
                      sx={{
                        bgcolor: isPEAgent(log.agentDesignation) ? colors.statusBreak.bg : isREAgent(log.agentDesignation) ? colors.statusOnCall.bg : colors.statusOffline.bg,
                        color: isPEAgent(log.agentDesignation) ? colors.statusBreak.color : isREAgent(log.agentDesignation) ? colors.statusOnCall.color : colors.statusOffline.color,
                        fontWeight: 500,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: colors.text }}>
                    <Typography variant="body2" sx={{ color: colors.text }}>{log.clientNumber || "N/A"}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={log.callType || "N/A"} size="small" sx={{ bgcolor: colors.isDark ? "rgba(59,130,246,0.08)" : "#eff6ff", color: "#3b82f6" }} />
                  </TableCell>
                  <TableCell sx={{ color: colors.text }}>
                    <Typography variant="body2" sx={{ color: colors.text }}>{formatTimestamp(log.timestamp)}</Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ color: colors.text }}>
                    <Typography variant="body2" sx={{ color: colors.text }}>
                      {log.callConnected ? calculateActualDuration(log.startTime, log.endTime) : "-"}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={log.callConnected ? <CheckCircle sx={{ fontSize: 16 }} /> : <Cancel sx={{ fontSize: 16 }} />}
                      label={log.callConnected ? "Connected" : "Not Connected"}
                      size="small"
                      sx={{
                        bgcolor: log.callConnected ? colors.statusAvailable.bg : colors.statusError.bg,
                        color: log.callConnected ? colors.statusAvailable.color : colors.statusError.color,
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={applyFilters(filteredCallLogs).length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            sx={{
              color: colors.text,
              borderTop: `1px solid ${colors.border}`,
              ".MuiTablePagination-selectLabel": { color: colors.textSec },
              ".MuiTablePagination-displayedRows": { color: colors.textSec },
              ".MuiTablePagination-selectIcon": { color: colors.textMuted },
              ".MuiTablePagination-select": { color: colors.text },
              ".MuiIconButton-root": { color: colors.textSec },
            }}
          />
        </TableContainer>
      )}

      {/* Filter Dialog */}
      <Dialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            bgcolor: colors.dialogBg,
            color: colors.text,
            border: `1px solid ${colors.dialogBorder}`,
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: `1px solid ${colors.border}`, py: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FilterList sx={{ color: colors.textSec, fontSize: 20 }} />
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: colors.text }}>Filter Options</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date From"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date To"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Call Type</InputLabel>
                <Select
                  value={filters.callType}
                  label="Call Type"
                  onChange={(e) => setFilters({ ...filters, callType: e.target.value })}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="Client">Client</MenuItem>
                  <MenuItem value="Branch Manager">Branch Manager</MenuItem>
                  <MenuItem value="Nurse">Nurse</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Call Status</InputLabel>
                <Select
                  value={filters.callConnected}
                  label="Call Status"
                  onChange={(e) => setFilters({ ...filters, callConnected: e.target.value })}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="connected">Connected</MenuItem>
                  <MenuItem value="not_connected">Not Connected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Escalation</InputLabel>
                <Select
                  value={filters.escalation}
                  label="Escalation"
                  onChange={(e) => setFilters({ ...filters, escalation: e.target.value })}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, borderTop: `1px solid ${colors.border}` }}>
          <Button size="small" onClick={handleResetFilters} sx={{ color: colors.textSec, textTransform: "none" }}>
            Reset
          </Button>
          <Button size="small" onClick={() => setFilterDialogOpen(false)} sx={{ color: colors.textSec, textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            size="small"
            onClick={() => {
              setFilterDialogOpen(false);
              handleExportCSV();
            }}
            variant="outlined"
            sx={{
              borderColor: colors.primary || '#D97706',
              color: colors.primary || '#D97706',
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "8px",
              "&:hover": { bgcolor: colors.primarySoft || 'rgba(217,119,6,0.08)' },
            }}
            startIcon={<FileDownload sx={{ fontSize: 16 }} />}
          >
            Export Filtered
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default HealthManagerDashboard;
