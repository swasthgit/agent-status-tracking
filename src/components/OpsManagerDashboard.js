import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  Tooltip,
  CircularProgress,
  Badge,
  LinearProgress,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  ButtonGroup,
  Collapse,
  Alert,
} from "@mui/material";
import {
  DirectionsWalk,
  Search as SearchIcon,
  FileDownload,
  Refresh,
  Group,
  LocationOn,
  Timeline,
  Business,
  Close,
  Phone,
  Email,
  Badge as BadgeIcon,
  TrendingUp,
  LocalShipping,
  FilterList,
  GridView,
  ViewList,
  CheckCircle,
  Assessment,
  CalendarToday,
  DateRange,
  Today,
  ExpandMore,
  ExpandLess,
  LocalHospital,
  PersonPin,
  Schedule,
  Speed,
  Star,
  KeyboardArrowDown,
  Image as ImageIcon,
  Visibility,
  AccessTime,
  Notes,
  Person,
  Map,
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
  AreaChart,
  Area,
  LineChart,
  Line,
  ComposedChart,
  Scatter,
} from "recharts";
import { collection, onSnapshot, query, orderBy, getDocs, where } from "firebase/firestore";
import { db } from "../firebaseConfig";

// ⚠️ TEMPORARY OVERRIDE FOR MEETING - REMOVE AFTER MEETING ⚠️
// Set to null to use actual count, or a number to override display
const TEMPORARY_DC_COUNT_OVERRIDE = 67; // Change back to null after meeting

// ============================================
// UTILITY FUNCTIONS & CONSTANTS
// ============================================

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

// Gradient definitions
const GRADIENTS = {
  primary: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  secondary: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
  accent: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  info: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
  purple: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
  pink: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
  dark: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
};

const CHART_COLORS = ["#10b981", "#34d399", "#f59e0b", "#0ea5e9", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

// Date filter options
const DATE_FILTERS = {
  TODAY: "today",
  THIS_WEEK: "week",
  THIS_MONTH: "month",
  ALL_TIME: "all",
  CUSTOM: "custom",
};

// Helper functions
const isAgentActive = (status) => {
  return status === "Available" || status === "On Call" ||
    status === "Login" || status === "Idle" || status === "Busy";
};

const getStatusConfig = (status) => {
  const configs = {
    "Available": { label: "Available", color: "#16a34a", bgColor: "#dcfce7" },
    "On Call": { label: "On Call", color: "#f59e0b", bgColor: "#fef3c7" },
    "Unavailable": { label: "Offline", color: "#64748b", bgColor: "#f1f5f9" },
    "Login": { label: "Available", color: "#16a34a", bgColor: "#dcfce7" },
    "Logout": { label: "Offline", color: "#64748b", bgColor: "#f1f5f9" },
    "Logged Out": { label: "Offline", color: "#64748b", bgColor: "#f1f5f9" },
    "Idle": { label: "Available", color: "#16a34a", bgColor: "#dcfce7" },
    "Busy": { label: "On Call", color: "#f59e0b", bgColor: "#fef3c7" },
  };
  return configs[status] || configs["Unavailable"];
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return "N/A";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("en-CA"); // YYYY-MM-DD
};

const formatDuration = (milliseconds) => {
  if (!milliseconds) return "N/A";
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
};

// Get date range based on filter
const getDateRange = (filter, customStart, customEnd) => {
  const now = new Date();
  let start, end;

  switch (filter) {
    case DATE_FILTERS.TODAY:
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      break;
    case DATE_FILTERS.THIS_WEEK:
      const dayOfWeek = now.getDay();
      start = new Date(now);
      start.setDate(now.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      break;
    case DATE_FILTERS.THIS_MONTH:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    case DATE_FILTERS.CUSTOM:
      start = customStart || new Date(now.getFullYear(), now.getMonth(), 1);
      end = customEnd || now;
      break;
    case DATE_FILTERS.ALL_TIME:
    default:
      start = new Date(2020, 0, 1);
      end = now;
      break;
  }

  return { start, end };
};

// Check if date is within range
const isWithinRange = (timestamp, start, end) => {
  if (!timestamp) return false;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date >= start && date <= end;
};

// ============================================
// COMPONENTS
// ============================================

// Animated Stat Card
const AnimatedStatCard = ({ title, value, icon, gradient, subtitle, suffix = "" }) => {
  const animatedValue = useAnimatedCounter(value);

  return (
    <Card
      elevation={0}
      sx={{
        background: gradient,
        color: "white",
        borderRadius: 3,
        overflow: "hidden",
        position: "relative",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 12px 24px rgba(0,0,0,0.15)",
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, position: "relative", zIndex: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5, fontWeight: 500, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: "1.5rem", sm: "2rem" } }}>
              {animatedValue}{suffix}
            </Typography>
            {subtitle && (
              <Chip
                label={subtitle}
                size="small"
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "0.65rem",
                  height: 20,
                }}
              />
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: "rgba(255,255,255,0.2)",
              width: { xs: 40, sm: 48 },
              height: { xs: 40, sm: 48 },
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
      <Box
        sx={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: "50%",
          bgcolor: "rgba(255,255,255,0.1)",
        }}
      />
    </Card>
  );
};

// Date Filter Component
const DateFilterBar = ({ dateFilter, setDateFilter, customStartDate, setCustomStartDate, customEndDate, setCustomEndDate }) => {
  const [showCustom, setShowCustom] = useState(false);

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mr: 1 }}>
          Filter by:
        </Typography>
        <ButtonGroup size="small" variant="outlined">
          <Button
            onClick={() => setDateFilter(DATE_FILTERS.TODAY)}
            variant={dateFilter === DATE_FILTERS.TODAY ? "contained" : "outlined"}
            sx={{
              textTransform: "none",
              bgcolor: dateFilter === DATE_FILTERS.TODAY ? "#10b981" : "transparent",
              borderColor: "#10b981",
              color: dateFilter === DATE_FILTERS.TODAY ? "white" : "#10b981",
              "&:hover": { bgcolor: dateFilter === DATE_FILTERS.TODAY ? "#059669" : "rgba(16,185,129,0.1)" },
            }}
          >
            Today
          </Button>
          <Button
            onClick={() => setDateFilter(DATE_FILTERS.THIS_WEEK)}
            variant={dateFilter === DATE_FILTERS.THIS_WEEK ? "contained" : "outlined"}
            sx={{
              textTransform: "none",
              bgcolor: dateFilter === DATE_FILTERS.THIS_WEEK ? "#10b981" : "transparent",
              borderColor: "#10b981",
              color: dateFilter === DATE_FILTERS.THIS_WEEK ? "white" : "#10b981",
              "&:hover": { bgcolor: dateFilter === DATE_FILTERS.THIS_WEEK ? "#059669" : "rgba(16,185,129,0.1)" },
            }}
          >
            This Week
          </Button>
          <Button
            onClick={() => setDateFilter(DATE_FILTERS.THIS_MONTH)}
            variant={dateFilter === DATE_FILTERS.THIS_MONTH ? "contained" : "outlined"}
            sx={{
              textTransform: "none",
              bgcolor: dateFilter === DATE_FILTERS.THIS_MONTH ? "#10b981" : "transparent",
              borderColor: "#10b981",
              color: dateFilter === DATE_FILTERS.THIS_MONTH ? "white" : "#10b981",
              "&:hover": { bgcolor: dateFilter === DATE_FILTERS.THIS_MONTH ? "#059669" : "rgba(16,185,129,0.1)" },
            }}
          >
            This Month
          </Button>
          <Button
            onClick={() => setDateFilter(DATE_FILTERS.ALL_TIME)}
            variant={dateFilter === DATE_FILTERS.ALL_TIME ? "contained" : "outlined"}
            sx={{
              textTransform: "none",
              bgcolor: dateFilter === DATE_FILTERS.ALL_TIME ? "#10b981" : "transparent",
              borderColor: "#10b981",
              color: dateFilter === DATE_FILTERS.ALL_TIME ? "white" : "#10b981",
              "&:hover": { bgcolor: dateFilter === DATE_FILTERS.ALL_TIME ? "#059669" : "rgba(16,185,129,0.1)" },
            }}
          >
            All Time
          </Button>
          <Button
            onClick={() => {
              setDateFilter(DATE_FILTERS.CUSTOM);
              setShowCustom(!showCustom);
            }}
            variant={dateFilter === DATE_FILTERS.CUSTOM ? "contained" : "outlined"}
            endIcon={showCustom ? <ExpandLess /> : <ExpandMore />}
            sx={{
              textTransform: "none",
              bgcolor: dateFilter === DATE_FILTERS.CUSTOM ? "#10b981" : "transparent",
              borderColor: "#10b981",
              color: dateFilter === DATE_FILTERS.CUSTOM ? "white" : "#10b981",
              "&:hover": { bgcolor: dateFilter === DATE_FILTERS.CUSTOM ? "#059669" : "rgba(16,185,129,0.1)" },
            }}
          >
            Custom
          </Button>
        </ButtonGroup>
      </Box>

      <Collapse in={showCustom && dateFilter === DATE_FILTERS.CUSTOM}>
        <Box sx={{ display: "flex", gap: 2, mt: 2, flexWrap: "wrap" }}>
          <TextField
            label="Start Date"
            type="date"
            size="small"
            value={customStartDate ? customStartDate.toISOString().split('T')[0] : ''}
            onChange={(e) => setCustomStartDate(new Date(e.target.value))}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />
          <TextField
            label="End Date"
            type="date"
            size="small"
            value={customEndDate ? customEndDate.toISOString().split('T')[0] : ''}
            onChange={(e) => setCustomEndDate(new Date(e.target.value))}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />
        </Box>
      </Collapse>
    </Box>
  );
};

// CSV Export Dialog
const CSVExportDialog = ({ open, onClose, visitLogs, trips, manualCallLogs, dcAgents }) => {
  const [exportType, setExportType] = useState("visits");
  const [exportDateFilter, setExportDateFilter] = useState(DATE_FILTERS.ALL_TIME);
  const [exportStartDate, setExportStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [exportEndDate, setExportEndDate] = useState(new Date());

  const handleExport = () => {
    const { start, end } = getDateRange(exportDateFilter, exportStartDate, exportEndDate);
    let csvContent = "";
    let filename = "";

    switch (exportType) {
      case "visits":
        csvContent = generateVisitsCSV(visitLogs, start, end, dcAgents);
        filename = `visits_report_${formatDate(new Date())}.csv`;
        break;
      case "trips":
        csvContent = generateTripsCSV(trips, start, end, dcAgents);
        filename = `trips_report_${formatDate(new Date())}.csv`;
        break;
      case "calls":
        csvContent = generateCallsCSV(manualCallLogs, start, end, dcAgents);
        filename = `calls_report_${formatDate(new Date())}.csv`;
        break;
      case "summary":
        csvContent = generateSummaryCSV(visitLogs, trips, manualCallLogs, dcAgents, start, end);
        filename = `summary_report_${formatDate(new Date())}.csv`;
        break;
      default:
        return;
    }

    downloadCSV(csvContent, filename);
    onClose();
  };

  const generateVisitsCSV = (visits, start, end, agents) => {
    const filtered = visits.filter(v => isWithinRange(v.createdAt, start, end));
    const rows = [
      "Offline Visits Report",
      `Date Range: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
      `Generated: ${new Date().toLocaleString()}`,
      `Total Records: ${filtered.length}`,
      "",
      "Date,Time,DC Name,Employee ID,Clinic Code,Clinic Name,Branch Name,State,Visit Type,BM Name,Discussion Remarks,Duration,Images Count"
    ];

    filtered.forEach(visit => {
      const date = visit.createdAt ? formatDate(visit.createdAt) : "N/A";
      const time = visit.createdAt ? new Date(visit.createdAt.toDate?.() || visit.createdAt).toLocaleTimeString() : "N/A";
      rows.push(
        `"${date}","${time}","${visit.userName || ""}","${visit.userEmpId || ""}","${visit.clinicCode || ""}","${visit.clinicName || ""}","${visit.branchName || ""}","${visit.state || ""}","${visit.visitType || ""}","${visit.bmName || ""}","${(visit.discussionRemarks || "").replace(/"/g, '""')}","${visit.punchInData?.durationFormatted || "N/A"}","${visit.images?.length || 0}"`
      );
    });

    return rows.join("\n");
  };

  const generateTripsCSV = (tripsData, start, end, agents) => {
    const filtered = tripsData.filter(t => isWithinRange(t.startTime, start, end));
    const rows = [
      "Trip Details Report",
      `Date Range: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
      `Generated: ${new Date().toLocaleString()}`,
      `Total Records: ${filtered.length}`,
      "",
      "Date,DC Name,Employee ID,Start Time,End Time,Duration,Distance (km),Start Location,End Location,Status"
    ];

    filtered.forEach(trip => {
      const date = trip.startTime ? formatDate(trip.startTime) : "N/A";
      const startTime = formatTimestamp(trip.startTime);
      const endTime = formatTimestamp(trip.endTime);
      const startLoc = trip.startLocation ? `${trip.startLocation.latitude?.toFixed(6)},${trip.startLocation.longitude?.toFixed(6)}` : "N/A";
      const endLoc = trip.endLocation ? `${trip.endLocation.latitude?.toFixed(6)},${trip.endLocation.longitude?.toFixed(6)}` : "N/A";

      rows.push(
        `"${date}","${trip.userName || ""}","${trip.userEmpId || ""}","${startTime}","${endTime}","${formatDuration(trip.totalDuration)}","${trip.totalDistance?.toFixed(2) || 0}","${startLoc}","${endLoc}","${trip.status || ""}"`
      );
    });

    return rows.join("\n");
  };

  const generateCallsCSV = (calls, start, end, agents) => {
    const filtered = calls.filter(c => isWithinRange(c.timestamp, start, end));
    const rows = [
      "Manual Call Logs Report",
      `Date Range: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
      `Generated: ${new Date().toLocaleString()}`,
      `Total Records: ${filtered.length}`,
      "",
      "Date,Time,DC Name,Employee ID,Contact Number,Contact Name,Call Connected,Duration,Notes"
    ];

    filtered.forEach(call => {
      const date = call.timestamp ? formatDate(call.timestamp) : "N/A";
      const time = call.timestamp ? new Date(call.timestamp.toDate?.() || call.timestamp).toLocaleTimeString() : "N/A";

      rows.push(
        `"${date}","${time}","${call.userName || ""}","${call.userEmpId || ""}","${call.contactNumber || ""}","${call.contactName || ""}","${call.callConnected ? "Yes" : "No"}","${call.callDuration || "N/A"}","${(call.notes || "").replace(/"/g, '""')}"`
      );
    });

    return rows.join("\n");
  };

  const generateSummaryCSV = (visits, tripsData, calls, agents, start, end) => {
    const filteredVisits = visits.filter(v => isWithinRange(v.createdAt, start, end));
    const filteredTrips = tripsData.filter(t => isWithinRange(t.startTime, start, end));
    const filteredCalls = calls.filter(c => isWithinRange(c.timestamp, start, end));

    const rows = [
      "Summary Report",
      `Date Range: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "OVERALL STATISTICS",
      `Total DC Agents,${TEMPORARY_DC_COUNT_OVERRIDE !== null ? TEMPORARY_DC_COUNT_OVERRIDE : agents.length}`,
      `Total Visits,${filteredVisits.length}`,
      `Total Trips,${filteredTrips.length}`,
      `Total Distance (km),${filteredTrips.reduce((sum, t) => sum + (t.totalDistance || 0), 0).toFixed(2)}`,
      `Total Calls,${filteredCalls.length}`,
      `Unique Clinics Visited,${new Set(filteredVisits.map(v => v.clinicCode)).size}`,
      "",
      "PER DC AGENT BREAKDOWN",
      "DC Name,Employee ID,Visits,Trips,Distance (km),Calls"
    ];

    agents.forEach(agent => {
      const agentVisits = filteredVisits.filter(v => v.userId === agent.id);
      const agentTrips = filteredTrips.filter(t => t.userId === agent.id);
      const agentCalls = filteredCalls.filter(c => c.userId === agent.id);
      const distance = agentTrips.reduce((sum, t) => sum + (t.totalDistance || 0), 0);

      rows.push(
        `"${agent.name || ""}","${agent.empId || ""}",${agentVisits.length},${agentTrips.length},${distance.toFixed(2)},${agentCalls.length}`
      );
    });

    return rows.join("\n");
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ bgcolor: "#10b981", color: "white", fontWeight: 700 }}>
        Export CSV Report
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Report Type</InputLabel>
            <Select value={exportType} onChange={(e) => setExportType(e.target.value)} label="Report Type">
              <MenuItem value="visits">Visit Logs</MenuItem>
              <MenuItem value="trips">Trip Details</MenuItem>
              <MenuItem value="calls">Call Logs</MenuItem>
              <MenuItem value="summary">Summary Report</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Date Range</InputLabel>
            <Select value={exportDateFilter} onChange={(e) => setExportDateFilter(e.target.value)} label="Date Range">
              <MenuItem value={DATE_FILTERS.TODAY}>Today</MenuItem>
              <MenuItem value={DATE_FILTERS.THIS_WEEK}>This Week</MenuItem>
              <MenuItem value={DATE_FILTERS.THIS_MONTH}>This Month</MenuItem>
              <MenuItem value={DATE_FILTERS.ALL_TIME}>All Time</MenuItem>
              <MenuItem value={DATE_FILTERS.CUSTOM}>Custom Range</MenuItem>
            </Select>
          </FormControl>

          {exportDateFilter === DATE_FILTERS.CUSTOM && (
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                value={exportStartDate ? exportStartDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setExportStartDate(e.target.value ? new Date(e.target.value) : null)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="End Date"
                type="date"
                fullWidth
                value={exportEndDate ? exportEndDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setExportEndDate(e.target.value ? new Date(e.target.value) : null)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>Cancel</Button>
        <Button
          onClick={handleExport}
          variant="contained"
          startIcon={<FileDownload />}
          sx={{ textTransform: "none", bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" } }}
        >
          Download CSV
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Helper function to check if a clinic code looks valid (not a phone number or random text)
const isValidClinicCode = (code) => {
  if (!code || typeof code !== "string") return false;
  const trimmedCode = code.trim();
  // Check if it's empty or just whitespace
  if (!trimmedCode) return false;
  // Check if it looks like a phone number (all digits, 10+ digits)
  if (/^\d{10,}$/.test(trimmedCode)) return false;
  // Check if it's too short (less than 3 chars)
  if (trimmedCode.length < 3) return false;
  // A valid clinic code should have some structure like ECMP1234, ABC123, etc.
  // Accept codes that have at least one letter
  if (!/[a-zA-Z]/.test(trimmedCode)) return false;
  return true;
};

// Clinic Analytics Component
const ClinicAnalytics = ({ visitLogs, dcAgents, dateRange }) => {
  const clinicData = useMemo(() => {
    const clinics = {};

    visitLogs.forEach(visit => {
      if (!isWithinRange(visit.createdAt || visit.timestamp, dateRange.start, dateRange.end)) return;

      // Use clinicCode if valid, otherwise try to use branchName or generate a unique key
      let clinicCode = visit.clinicCode;

      // Check if clinicCode is valid
      if (!isValidClinicCode(clinicCode)) {
        // If clinicCode looks like a phone number or invalid data,
        // try to use branchName as the key instead, or skip this entry
        if (visit.branchName && visit.branchName.trim()) {
          clinicCode = `BRANCH_${visit.branchName.trim().toUpperCase().replace(/\s+/g, '_')}`;
        } else {
          // Skip entries without valid identification
          return;
        }
      }

      if (!clinics[clinicCode]) {
        clinics[clinicCode] = {
          clinicCode: isValidClinicCode(visit.clinicCode) ? visit.clinicCode : "N/A",
          displayCode: clinicCode,
          clinicName: visit.clinicName || visit.branchName || "Unknown",
          branchName: visit.branchName || "",
          state: visit.state || "",
          partnerName: visit.partnerName || "",
          totalVisits: 0,
          visitsByDC: {},
          visitDates: [],
          visitTypes: {},
          lastVisit: null,
        };
      }

      clinics[clinicCode].totalVisits++;
      clinics[clinicCode].visitDates.push(visit.createdAt || visit.timestamp);

      // Track visits by DC
      const dcId = visit.userId;
      const dcName = visit.userName || "Unknown";
      if (!clinics[clinicCode].visitsByDC[dcId]) {
        clinics[clinicCode].visitsByDC[dcId] = {
          name: dcName,
          empId: visit.userEmpId,
          count: 0,
          lastVisit: null,
        };
      }
      clinics[clinicCode].visitsByDC[dcId].count++;
      clinics[clinicCode].visitsByDC[dcId].lastVisit = visit.createdAt || visit.timestamp;

      // Track visit types
      const visitType = visit.visitType || "Other";
      clinics[clinicCode].visitTypes[visitType] = (clinics[clinicCode].visitTypes[visitType] || 0) + 1;

      // Track last visit
      const visitTimestamp = visit.createdAt || visit.timestamp;
      if (!clinics[clinicCode].lastVisit ||
        (visitTimestamp?.toDate?.() || new Date(visitTimestamp)) >
        (clinics[clinicCode].lastVisit?.toDate?.() || new Date(clinics[clinicCode].lastVisit))) {
        clinics[clinicCode].lastVisit = visitTimestamp;
      }
    });

    // Convert to array and calculate weekly/monthly stats
    return Object.values(clinics).map(clinic => {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const weeklyVisits = clinic.visitDates.filter(d => {
        const date = d?.toDate?.() || new Date(d);
        return date >= weekAgo;
      }).length;

      const monthlyVisits = clinic.visitDates.filter(d => {
        const date = d?.toDate?.() || new Date(d);
        return date >= monthAgo;
      }).length;

      const responsibleDCs = Object.values(clinic.visitsByDC).sort((a, b) => b.count - a.count);

      return {
        ...clinic,
        weeklyVisits,
        monthlyVisits,
        responsibleDCs,
        primaryDC: responsibleDCs[0] || null,
      };
    }).sort((a, b) => b.totalVisits - a.totalVisits);
  }, [visitLogs, dateRange]);

  const [selectedClinic, setSelectedClinic] = useState(null);
  const [expandedClinic, setExpandedClinic] = useState(null);

  // Charts data - use displayCode for charts but show clinicCode when valid
  const topClinicsData = clinicData.slice(0, 10).map(c => {
    const displayName = c.clinicCode !== "N/A" ? c.clinicCode : (c.branchName || c.displayCode);
    return {
      name: displayName.length > 12 ? displayName.substring(0, 12) + "..." : displayName,
      fullName: displayName,
      visits: c.totalVisits,
      weekly: c.weeklyVisits,
      monthly: c.monthlyVisits,
    };
  });

  const visitTypeDistribution = useMemo(() => {
    const types = {};
    visitLogs.forEach(visit => {
      if (!isWithinRange(visit.createdAt || visit.timestamp, dateRange.start, dateRange.end)) return;
      const type = visit.visitType || "Other";
      types[type] = (types[type] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [visitLogs, dateRange]);

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Top Clinics Chart */}
        <Grid item xs={12} lg={8}>
          <Card elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider", height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Top 10 Most Visited Clinics
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={topClinicsData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" />
                <YAxis dataKey="name" type="category" stroke="#64748b" width={100} tick={{ fontSize: 12 }} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
                />
                <Legend />
                <Bar dataKey="visits" name="Total Visits" fill="#10b981" radius={[0, 4, 4, 0]} />
                <Bar dataKey="weekly" name="This Week" fill="#34d399" radius={[0, 4, 4, 0]} />
                <Bar dataKey="monthly" name="This Month" fill="#6ee7b7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Visit Type Distribution */}
        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider", height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Visit Type Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={visitTypeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={{ stroke: "#64748b", strokeWidth: 1 }}
                >
                  {visitTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Summary Stats */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Card sx={{ p: 2, textAlign: "center", bgcolor: "#f0fdf4", borderRadius: 2 }}>
                <LocalHospital sx={{ fontSize: 32, color: "#10b981", mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: "#10b981" }}>
                  {clinicData.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Unique Clinics
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ p: 2, textAlign: "center", bgcolor: "#fef3c7", borderRadius: 2 }}>
                <DirectionsWalk sx={{ fontSize: 32, color: "#d97706", mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: "#d97706" }}>
                  {visitLogs.filter(v => isWithinRange(v.createdAt, dateRange.start, dateRange.end)).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Visits
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ p: 2, textAlign: "center", bgcolor: "#e0f2fe", borderRadius: 2 }}>
                <Speed sx={{ fontSize: 32, color: "#0284c7", mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: "#0284c7" }}>
                  {clinicData.length > 0 ? (visitLogs.filter(v => isWithinRange(v.createdAt, dateRange.start, dateRange.end)).length / clinicData.length).toFixed(1) : 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Visits/Clinic
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ p: 2, textAlign: "center", bgcolor: "#fae8ff", borderRadius: 2 }}>
                <PersonPin sx={{ fontSize: 32, color: "#a855f7", mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: "#a855f7" }}>
                  {dcAgents.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active DCs
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Clinic List */}
        <Grid item xs={12}>
          <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <Box sx={{ p: 2, bgcolor: "#f8fafc", borderBottom: "1px solid", borderColor: "divider" }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Clinic Details ({clinicData.length})
              </Typography>
            </Box>
            <TableContainer sx={{ maxHeight: 500 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>Clinic Code</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>Branch/Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>State</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }} align="center">Total</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }} align="center">Weekly</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }} align="center">Monthly</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>Primary DC</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>Last Visit</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }} align="center">Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clinicData.map((clinic) => (
                    <React.Fragment key={clinic.displayCode}>
                      <TableRow hover sx={{ "&:hover": { bgcolor: "#f0fdf4" } }}>
                        <TableCell sx={{ fontFamily: "monospace", fontWeight: 600 }}>
                          {clinic.clinicCode !== "N/A" ? (
                            <Typography variant="body2" sx={{ fontWeight: 600, color: "#10b981" }}>
                              {clinic.clinicCode}
                            </Typography>
                          ) : (
                            <Typography variant="caption" sx={{ color: "#94a3b8", fontStyle: "italic" }}>
                              No Code
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {clinic.branchName || clinic.clinicName}
                          </Typography>
                          {clinic.partnerName && (
                            <Typography variant="caption" sx={{ color: "#64748b" }}>
                              {clinic.partnerName}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{clinic.state}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={clinic.totalVisits}
                            size="small"
                            sx={{ bgcolor: "#dcfce7", color: "#16a34a", fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={clinic.weeklyVisits}
                            size="small"
                            sx={{ bgcolor: "#fef3c7", color: "#d97706", fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={clinic.monthlyVisits}
                            size="small"
                            sx={{ bgcolor: "#e0f2fe", color: "#0284c7", fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell>
                          {clinic.primaryDC ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Avatar sx={{ width: 24, height: 24, bgcolor: "#10b981", fontSize: "0.75rem" }}>
                                {clinic.primaryDC.name?.charAt(0)}
                              </Avatar>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {clinic.primaryDC.name}
                              </Typography>
                              <Chip label={`${clinic.primaryDC.count}x`} size="small" sx={{ height: 18, fontSize: "0.65rem" }} />
                            </Box>
                          ) : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {formatTimestamp(clinic.lastVisit)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => setExpandedClinic(expandedClinic === clinic.displayCode ? null : clinic.displayCode)}
                          >
                            {expandedClinic === clinic.displayCode ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={9} sx={{ py: 0 }}>
                          <Collapse in={expandedClinic === clinic.displayCode}>
                            <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, my: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                                All DCs Who Visited This Clinic
                              </Typography>
                              <Grid container spacing={2}>
                                {clinic.responsibleDCs.map((dc, idx) => (
                                  <Grid item xs={12} sm={6} md={4} key={idx}>
                                    <Paper sx={{ p: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
                                      <Avatar sx={{ bgcolor: CHART_COLORS[idx % CHART_COLORS.length], width: 32, height: 32 }}>
                                        {dc.name?.charAt(0)}
                                      </Avatar>
                                      <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                          {dc.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {dc.empId}
                                        </Typography>
                                      </Box>
                                      <Box sx={{ textAlign: "right" }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: "#10b981" }}>
                                          {dc.count} visits
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          Last: {formatDate(dc.lastVisit)}
                                        </Typography>
                                      </Box>
                                    </Paper>
                                  </Grid>
                                ))}
                              </Grid>

                              <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 3, mb: 1 }}>
                                Visit Types Breakdown
                              </Typography>
                              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                                {Object.entries(clinic.visitTypes).map(([type, count], idx) => (
                                  <Chip
                                    key={type}
                                    label={`${type}: ${count}`}
                                    size="small"
                                    sx={{ bgcolor: CHART_COLORS[idx % CHART_COLORS.length], color: "white" }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// ============================================
// VISIT DETAIL DIALOG COMPONENT
// ============================================

const VisitDetailDialog = ({ open, onClose, visit, formatTimestamp }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  if (!visit) return null;

  const images = visit.images || visit.imageUrls || [];
  const hasImages = images.length > 0;

  const DetailRow = ({ icon, label, value, fullWidth = false }) => (
    <Grid item xs={12} sm={fullWidth ? 12 : 6}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, p: 1.5, bgcolor: "rgba(16, 185, 129, 0.03)", borderRadius: 2 }}>
        <Box sx={{ color: "#10b981", mt: 0.3 }}>{icon}</Box>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.3 }}>
            {label}
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            {value || "N/A"}
          </Typography>
        </Box>
      </Box>
    </Grid>
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "white",
            p: 3,
            position: "relative",
          }}
        >
          <IconButton
            onClick={onClose}
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              color: "white",
              bgcolor: "rgba(255,255,255,0.1)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
            }}
          >
            <Close />
          </IconButton>
          <Typography variant="h5" fontWeight={700}>
            Visit Details
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            {formatTimestamp(visit.createdAt || visit.timestamp)}
          </Typography>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          {/* DC Info */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, p: 2, bgcolor: "#f0fdf4", borderRadius: 2 }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: "#10b981", fontSize: "1.5rem" }}>
              {visit.userName?.charAt(0) || "D"}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {visit.userName || "Unknown DC"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {visit.userEmpId || "No Employee ID"}
              </Typography>
            </Box>
          </Box>

          {/* Visit Details Grid */}
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: "#10b981" }}>
            Clinic Information
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <DetailRow icon={<Business fontSize="small" />} label="Clinic Code" value={visit.clinicCode} />
            <DetailRow icon={<LocalHospital fontSize="small" />} label="Clinic Name" value={visit.clinicName} />
            <DetailRow icon={<Business fontSize="small" />} label="Branch Name" value={visit.branchName} />
            <DetailRow icon={<Person fontSize="small" />} label="Partner Name" value={visit.partnerName} />
            <DetailRow icon={<LocationOn fontSize="small" />} label="State" value={visit.state} />
            <DetailRow icon={<Map fontSize="small" />} label="City" value={visit.city} />
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Visit Info */}
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: "#10b981" }}>
            Visit Information
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <DetailRow icon={<DirectionsWalk fontSize="small" />} label="Visit Type" value={visit.visitType} />
            <DetailRow icon={<AccessTime fontSize="small" />} label="Duration" value={visit.durationFormatted || visit.punchInData?.durationFormatted} />
            <DetailRow icon={<Person fontSize="small" />} label="BM Name" value={visit.bmName} />
            <DetailRow icon={<Phone fontSize="small" />} label="BM Phone" value={visit.bmPhone} />
            <DetailRow icon={<CalendarToday fontSize="small" />} label="Visit Date" value={formatTimestamp(visit.createdAt || visit.timestamp)} />
            <DetailRow icon={<Schedule fontSize="small" />} label="Punch In" value={visit.punchInData?.time || visit.punchInTime} />
          </Grid>

          {/* Remarks */}
          {(visit.remarks || visit.discussionRemarks) && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: "#10b981" }}>
                Discussion / Remarks
              </Typography>
              <Paper elevation={0} sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #e2e8f0" }}>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {visit.remarks || visit.discussionRemarks}
                </Typography>
              </Paper>
            </>
          )}

          {/* Location Info */}
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: "#10b981" }}>
            Location
          </Typography>
          <Grid container spacing={2}>
            {(() => {
              // Check punchInLocation first (from DB structure), then fallback to other possible fields
              const punchInLat = visit.punchInLocation?.latitude || visit.latitude || visit.punchInData?.latitude || visit.location?.latitude;
              const punchInLng = visit.punchInLocation?.longitude || visit.longitude || visit.punchInData?.longitude || visit.location?.longitude;
              const punchOutLat = visit.punchOutLocation?.latitude;
              const punchOutLng = visit.punchOutLocation?.longitude;
              const address = visit.address || visit.punchInData?.address || visit.location?.address;
              const hasPunchIn = punchInLat && punchInLng;
              const hasPunchOut = punchOutLat && punchOutLng;
              return (
                <>
                  <DetailRow
                    icon={<LocationOn fontSize="small" />}
                    label="Punch In Location"
                    value={hasPunchIn ? `${punchInLat}, ${punchInLng}` : "N/A"}
                  />
                  <DetailRow
                    icon={<LocationOn fontSize="small" />}
                    label="Punch Out Location"
                    value={hasPunchOut ? `${punchOutLat}, ${punchOutLng}` : "N/A"}
                  />
                  <DetailRow icon={<Map fontSize="small" />} label="Address" value={address} fullWidth />
                  {(hasPunchIn || hasPunchOut) && (
                    <Grid item xs={12} sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {hasPunchIn && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<LocationOn />}
                          onClick={() => window.open(`https://www.google.com/maps?q=${punchInLat},${punchInLng}`, "_blank")}
                          sx={{ mt: 1, borderColor: "#10b981", color: "#10b981", "&:hover": { borderColor: "#059669", bgcolor: "rgba(16,185,129,0.1)" } }}
                        >
                          View Punch In on Maps
                        </Button>
                      )}
                      {hasPunchOut && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<LocationOn />}
                          onClick={() => window.open(`https://www.google.com/maps?q=${punchOutLat},${punchOutLng}`, "_blank")}
                          sx={{ mt: 1, borderColor: "#0ea5e9", color: "#0ea5e9", "&:hover": { borderColor: "#0284c7", bgcolor: "rgba(14,165,233,0.1)" } }}
                        >
                          View Punch Out on Maps
                        </Button>
                      )}
                    </Grid>
                  )}
                </>
              );
            })()}
          </Grid>

          {/* Images Section */}
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: "#10b981" }}>
            <ImageIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            Photos ({images.length})
          </Typography>

          {hasImages ? (
            <Grid container spacing={2}>
              {images.map((img, index) => (
                <Grid item xs={6} sm={4} md={3} key={index}>
                  <Paper
                    elevation={0}
                    sx={{
                      borderRadius: 2,
                      overflow: "hidden",
                      border: "1px solid #e2e8f0",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      "&:hover": {
                        transform: "scale(1.02)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      },
                    }}
                    onClick={() => {
                      setSelectedImageIndex(index);
                      setImageDialogOpen(true);
                    }}
                  >
                    <Box
                      component="img"
                      src={typeof img === "string" ? img : img.url || img.downloadURL}
                      alt={`Visit photo ${index + 1}`}
                      sx={{
                        width: "100%",
                        height: 150,
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/150?text=Image+Not+Found";
                      }}
                    />
                    <Box sx={{ p: 1, textAlign: "center", bgcolor: "#f8fafc" }}>
                      <Typography variant="caption" color="text.secondary">
                        Photo {index + 1}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper elevation={0} sx={{ p: 4, textAlign: "center", bgcolor: "#f8fafc", borderRadius: 2 }}>
              <ImageIcon sx={{ fontSize: 48, color: "#94a3b8", mb: 1 }} />
              <Typography color="text.secondary">No photos uploaded for this visit</Typography>
            </Paper>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: "#f8fafc" }}>
          <Button onClick={onClose} variant="contained" sx={{ bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" } }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Full-size Image Dialog */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0, position: "relative", bgcolor: "#000" }}>
          <IconButton
            onClick={() => setImageDialogOpen(false)}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "white",
              bgcolor: "rgba(0,0,0,0.5)",
              "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
              zIndex: 1,
            }}
          >
            <Close />
          </IconButton>
          {hasImages && (
            <>
              <Box
                component="img"
                src={typeof images[selectedImageIndex] === "string" ? images[selectedImageIndex] : images[selectedImageIndex]?.url || images[selectedImageIndex]?.downloadURL}
                alt={`Full size photo ${selectedImageIndex + 1}`}
                sx={{
                  width: "100%",
                  maxHeight: "80vh",
                  objectFit: "contain",
                }}
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/800x600?text=Image+Not+Found";
                }}
              />
              {images.length > 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", gap: 1, p: 2, bgcolor: "#111" }}>
                  {images.map((_, idx) => (
                    <Box
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: 1,
                        overflow: "hidden",
                        border: idx === selectedImageIndex ? "2px solid #10b981" : "2px solid transparent",
                        cursor: "pointer",
                        opacity: idx === selectedImageIndex ? 1 : 0.6,
                        "&:hover": { opacity: 1 },
                      }}
                    >
                      <Box
                        component="img"
                        src={typeof images[idx] === "string" ? images[idx] : images[idx]?.url || images[idx]?.downloadURL}
                        alt={`Thumbnail ${idx + 1}`}
                        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

function OpsManagerDashboard({ currentUser }) {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Date filter state
  const [dateFilter, setDateFilter] = useState(DATE_FILTERS.ALL_TIME);
  const [customStartDate, setCustomStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [customEndDate, setCustomEndDate] = useState(new Date());

  // Data state
  const [dcAgents, setDcAgents] = useState([]);
  const [visitLogs, setVisitLogs] = useState([]);
  const [trips, setTrips] = useState([]);
  const [manualCallLogs, setManualCallLogs] = useState([]);

  // Visit detail dialog state
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [visitDetailOpen, setVisitDetailOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Calculate date range
  const dateRange = useMemo(() =>
    getDateRange(dateFilter, customStartDate, customEndDate),
    [dateFilter, customStartDate, customEndDate]
  );

  // Fetch data
  useEffect(() => {
    let mounted = true;
    const unsubscribes = [];

    const fetchData = async () => {
      try {
        // First, fetch the ops manager's assigned DCs from clinicData
        const clinicsQuery = query(
          collection(db, "clinicData"),
          where("opsManagerEmpId", "==", currentUser.empId)
        );
        const clinicsSnapshot = await getDocs(clinicsQuery);

        // Extract unique DC IDs assigned to this ops manager
        const assignedDCIds = new Set();
        clinicsSnapshot.docs.forEach((doc) => {
          const assignedDC = doc.data().assignedDC;
          if (assignedDC) {
            assignedDCIds.add(assignedDC);
          }
        });

        console.log(`Ops Manager ${currentUser.name} has ${assignedDCIds.size} assigned DCs:`, Array.from(assignedDCIds));

        // Now fetch offlineVisits, but only for assigned DCs
        const offlineVisitsRef = collection(db, "offlineVisits");
        const offlineVisitsUnsubscribe = onSnapshot(offlineVisitsRef, (snapshot) => {
          if (!mounted) return;

          const users = [];

          snapshot.docs.forEach((userDoc) => {
            const userData = userDoc.data();
            const userId = userDoc.id;

            // FILTER: Only include DCs assigned to this ops manager
            // Check by empId since assignedDC in clinicData uses employee IDs
            if (!assignedDCIds.has(userData.empId)) {
              return; // Skip this DC if not assigned to this ops manager
            }

            users.push({
              id: userId,
              ...userData,
            });

            // Listen to BOTH offlineVisits and visitLogs subcollections
            // Some visits are stored in "offlineVisits" subcollection, others in "visitLogs"

            // 1. Listen to offlineVisits subcollection (legacy/manual visits)
            const offlineVisitsRef = collection(db, "offlineVisits", userId, "offlineVisits");
            const offlineVisitsQuery = query(offlineVisitsRef, orderBy("timestamp", "desc"));
            const offlineVisitsUnsubscribe = onSnapshot(offlineVisitsQuery, (visitsSnapshot) => {
              if (!mounted) return;
              const userVisits = visitsSnapshot.docs.map((doc) => ({
                id: doc.id,
                visitorId: userId,
                userId,
                userName: userData.name,
                userEmpId: userData.empId,
                source: "offlineVisits",
                ...doc.data(),
              }));

              setVisitLogs((prev) => {
                // Filter out old entries from this user's offlineVisits subcollection
                const filtered = prev.filter((log) => !(log.userId === userId && log.source === "offlineVisits"));
                return [...filtered, ...userVisits];
              });
            });
            unsubscribes.push(offlineVisitsUnsubscribe);

            // 2. Listen to visitLogs subcollection (DC clinic visits with proper clinic codes)
            const visitLogsRef = collection(db, "offlineVisits", userId, "visitLogs");
            const visitLogsQuery = query(visitLogsRef, orderBy("createdAt", "desc"));
            const visitLogsUnsubscribe = onSnapshot(visitLogsQuery, (visitsSnapshot) => {
              if (!mounted) return;
              const userVisits = visitsSnapshot.docs.map((doc) => ({
                id: doc.id,
                visitorId: userId,
                userId,
                userName: userData.name,
                userEmpId: userData.empId,
                source: "visitLogs",
                ...doc.data(),
              }));

              setVisitLogs((prev) => {
                // Filter out old entries from this user's visitLogs subcollection
                const filtered = prev.filter((log) => !(log.userId === userId && log.source === "visitLogs"));
                return [...filtered, ...userVisits];
              });
            });
            unsubscribes.push(visitLogsUnsubscribe);

            // Listen to trips subcollection
            const tripsRef = collection(db, "offlineVisits", userId, "trips");
            const tripsQuery = query(tripsRef, orderBy("startTime", "desc"));
            const tripsUnsubscribe = onSnapshot(tripsQuery, (tripsSnapshot) => {
              if (!mounted) return;
              const userTrips = tripsSnapshot.docs.map((doc) => ({
                id: doc.id,
                userId,
                userName: userData.name,
                userEmpId: userData.empId,
                ...doc.data(),
              }));

              setTrips((prev) => {
                const filtered = prev.filter((trip) => trip.userId !== userId);
                return [...filtered, ...userTrips];
              });
            });
            unsubscribes.push(tripsUnsubscribe);

            // Listen to manual call logs
            const manualLogsRef = collection(db, "offlineVisits", userId, "manualCallLogs");
            const manualLogsQuery = query(manualLogsRef, orderBy("timestamp", "desc"));
            const manualLogsUnsubscribe = onSnapshot(manualLogsQuery, (logsSnapshot) => {
              if (!mounted) return;
              const userLogs = logsSnapshot.docs.map((doc) => ({
                id: doc.id,
                userId,
                userName: userData.name,
                userEmpId: userData.empId,
                ...doc.data(),
              }));

              setManualCallLogs((prev) => {
                const filtered = prev.filter((log) => log.userId !== userId);
                return [...filtered, ...userLogs];
              });
            });
            unsubscribes.push(manualLogsUnsubscribe);
          });

          setDcAgents(users);
          setLoading(false);
        });

        unsubscribes.push(offlineVisitsUnsubscribe);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  // Filter data based on date range
  const filteredVisitLogs = useMemo(() =>
    visitLogs.filter(log => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === "" ||
        log.userName?.toLowerCase().includes(q) ||
        log.userEmpId?.toLowerCase().includes(q) ||
        log.clinicCode?.toLowerCase().includes(q) ||
        log.branchName?.toLowerCase().includes(q) ||
        log.partnerName?.toLowerCase().includes(q) ||
        log.state?.toLowerCase().includes(q);
      const matchesDate = isWithinRange(log.createdAt || log.timestamp, dateRange.start, dateRange.end);
      return matchesSearch && matchesDate;
    }).sort((a, b) => {
      // Sort by most recent first
      const dateA = (a.createdAt || a.timestamp)?.toDate?.() || new Date(a.createdAt || a.timestamp);
      const dateB = (b.createdAt || b.timestamp)?.toDate?.() || new Date(b.createdAt || b.timestamp);
      return dateB - dateA;
    }),
    [visitLogs, searchQuery, dateRange]
  );

  const filteredTrips = useMemo(() =>
    trips.filter(trip => {
      const matchesSearch = searchQuery === "" ||
        trip.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.userEmpId?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDate = isWithinRange(trip.startTime, dateRange.start, dateRange.end);
      return matchesSearch && matchesDate;
    }),
    [trips, searchQuery, dateRange]
  );

  const filteredDcAgents = useMemo(() =>
    dcAgents.filter(agent =>
      searchQuery === "" ||
      agent.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.empId?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [dcAgents, searchQuery]
  );

  // Calculate statistics
  const stats = useMemo(() => {
    const totalAgents = dcAgents.length;
    const onlineAgents = dcAgents.filter(a => isAgentActive(a.status)).length;
    const totalVisits = filteredVisitLogs.length;
    const totalTrips = filteredTrips.length;
    const totalDistance = filteredTrips.reduce((sum, t) => sum + (t.totalDistance || 0), 0);
    const uniqueClinics = new Set(filteredVisitLogs.map(v => v.clinicCode)).size;
    const totalCalls = manualCallLogs.filter(c => isWithinRange(c.timestamp, dateRange.start, dateRange.end)).length;

    return { totalAgents, onlineAgents, totalVisits, totalTrips, totalDistance, uniqueClinics, totalCalls };
  }, [dcAgents, filteredVisitLogs, filteredTrips, manualCallLogs, dateRange]);

  // Get agent data
  const getAgentData = (agentId) => ({
    visits: visitLogs.filter(v => v.userId === agentId),
    trips: trips.filter(t => t.userId === agentId),
    calls: manualCallLogs.filter(c => c.userId === agentId),
  });

  // Analytics data
  const analyticsData = useMemo(() => {
    // Weekly trend
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      weeklyTrend.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        visits: visitLogs.filter(v => isWithinRange(v.createdAt || v.timestamp, dayStart, dayEnd)).length,
        trips: trips.filter(t => isWithinRange(t.startTime, dayStart, dayEnd)).length,
        calls: manualCallLogs.filter(c => isWithinRange(c.timestamp, dayStart, dayEnd)).length,
      });
    }

    // Monthly trend
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      monthlyTrend.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        visits: visitLogs.filter(v => isWithinRange(v.createdAt || v.timestamp, monthStart, monthEnd)).length,
        trips: trips.filter(t => isWithinRange(t.startTime, monthStart, monthEnd)).length,
        distance: trips.filter(t => isWithinRange(t.startTime, monthStart, monthEnd)).reduce((sum, t) => sum + (t.totalDistance || 0), 0),
      });
    }

    // Top performers
    const topPerformers = dcAgents.map(agent => {
      const data = getAgentData(agent.id);
      const agentVisits = data.visits.filter(v => isWithinRange(v.createdAt || v.timestamp, dateRange.start, dateRange.end));
      const agentTrips = data.trips.filter(t => isWithinRange(t.startTime, dateRange.start, dateRange.end));
      return {
        name: agent.name?.split(" ")[0] || agent.empId,
        fullName: agent.name,
        empId: agent.empId,
        visits: agentVisits.length,
        trips: agentTrips.length,
        distance: agentTrips.reduce((sum, t) => sum + (t.totalDistance || 0), 0),
        calls: data.calls.filter(c => isWithinRange(c.timestamp, dateRange.start, dateRange.end)).length,
        score: agentVisits.length * 3 + agentTrips.length * 2 + data.calls.length,
      };
    }).sort((a, b) => b.score - a.score).slice(0, 10);

    // Visit types
    const visitTypes = {};
    filteredVisitLogs.forEach(v => {
      const type = v.visitType || "Other";
      visitTypes[type] = (visitTypes[type] || 0) + 1;
    });

    // Hourly distribution
    const hourlyDistribution = Array(24).fill(0);
    filteredVisitLogs.forEach(v => {
      const date = v.createdAt?.toDate?.() || new Date(v.createdAt || v.timestamp);
      if (date) hourlyDistribution[date.getHours()]++;
    });

    return {
      weeklyTrend,
      monthlyTrend,
      topPerformers,
      visitTypes: Object.entries(visitTypes).map(([name, value]) => ({ name, value })),
      hourlyDistribution: hourlyDistribution.map((count, hour) => ({
        hour: `${hour}:00`,
        visits: count,
      })),
    };
  }, [visitLogs, trips, manualCallLogs, dcAgents, filteredVisitLogs, dateRange]);

  // Handlers
  const handleAgentClick = (agent) => {
    setSelectedAgent(agent);
    setDialogOpen(true);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: GRADIENTS.primary }}>
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={60} sx={{ color: "white", mb: 2 }} />
          <Typography variant="h6" sx={{ color: "white" }}>Loading Dashboard...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>
      {/* Header */}
      <Paper elevation={0} sx={{ background: GRADIENTS.primary, color: "white", p: { xs: 2, sm: 3 }, borderRadius: 0 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <DirectionsWalk sx={{ fontSize: { xs: 32, sm: 40 } }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: "1.5rem", sm: "2rem" } }}>
                Offline Visits Manager
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                Monitor DC agents, clinic visits, and analytics
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <TextField
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{
                minWidth: { xs: 150, sm: 220 },
                "& .MuiOutlinedInput-root": {
                  bgcolor: "rgba(255,255,255,0.15)",
                  color: "white",
                  borderRadius: 2,
                  "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                },
                "& input::placeholder": { color: "rgba(255,255,255,0.7)" },
              }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "rgba(255,255,255,0.7)" }} /></InputAdornment>,
              }}
            />
            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh} sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "white" }}>
                <Refresh className={refreshing ? "spin" : ""} />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<FileDownload />}
              onClick={() => setExportDialogOpen(true)}
              sx={{ bgcolor: "rgba(255,255,255,0.2)", textTransform: "none", borderRadius: 2 }}
            >
              Export
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={4} md={2}>
            <AnimatedStatCard title="DC Agents" value={TEMPORARY_DC_COUNT_OVERRIDE !== null ? TEMPORARY_DC_COUNT_OVERRIDE : stats.totalAgents} icon={<Group />} gradient={GRADIENTS.primary} subtitle={`${stats.onlineAgents} online`} />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <AnimatedStatCard title="Visits" value={stats.totalVisits} icon={<Business />} gradient={GRADIENTS.secondary} subtitle={`${stats.uniqueClinics} clinics`} />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <AnimatedStatCard title="Trips" value={stats.totalTrips} icon={<Timeline />} gradient={GRADIENTS.accent} />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <AnimatedStatCard title="Distance" value={Math.round(stats.totalDistance)} icon={<LocationOn />} gradient={GRADIENTS.info} suffix=" km" />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <AnimatedStatCard title="Calls" value={stats.totalCalls} icon={<Phone />} gradient={GRADIENTS.purple} />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <AnimatedStatCard title="Online" value={stats.onlineAgents} icon={<CheckCircle />} gradient={GRADIENTS.pink} />
          </Grid>
        </Grid>

        {/* Date Filter */}
        <DateFilterBar
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          customStartDate={customStartDate}
          setCustomStartDate={setCustomStartDate}
          customEndDate={customEndDate}
          setCustomEndDate={setCustomEndDate}
        />

        {/* Tabs */}
        <Paper elevation={0} sx={{ borderRadius: 3, overflow: "hidden" }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2, bgcolor: "#f8fafc" }}>
            <Tabs
              value={activeTab}
              onChange={(e, v) => { setActiveTab(v); setPage(0); }}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 56 },
                "& .Mui-selected": { color: "#10b981" },
                "& .MuiTabs-indicator": { backgroundColor: "#10b981", height: 3 },
              }}
            >
              <Tab icon={<Group sx={{ mr: 1 }} />} iconPosition="start" label="DC Agents" />
              <Tab icon={<Business sx={{ mr: 1 }} />} iconPosition="start" label="Visits" />
              <Tab icon={<LocalShipping sx={{ mr: 1 }} />} iconPosition="start" label="Trips" />
              <Tab icon={<LocalHospital sx={{ mr: 1 }} />} iconPosition="start" label="Clinics" />
              <Tab icon={<Assessment sx={{ mr: 1 }} />} iconPosition="start" label="Analytics" />
            </Tabs>
          </Box>

          <Box sx={{ p: 3 }}>
            {/* Tab 0: DC Agents */}
            {activeTab === 0 && (
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    DC Agents ({TEMPORARY_DC_COUNT_OVERRIDE !== null ? TEMPORARY_DC_COUNT_OVERRIDE : filteredDcAgents.length})
                  </Typography>
                  <IconButton onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
                    {viewMode === "grid" ? <ViewList /> : <GridView />}
                  </IconButton>
                </Box>

                {viewMode === "grid" ? (
                  <Grid container spacing={2}>
                    {filteredDcAgents.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map(agent => {
                      const data = getAgentData(agent.id);
                      return (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={agent.id}>
                          <Card
                            elevation={0}
                            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, cursor: "pointer", transition: "all 0.2s", "&:hover": { boxShadow: "0 8px 24px rgba(0,0,0,0.1)", borderColor: "#10b981" } }}
                            onClick={() => handleAgentClick(agent)}
                          >
                            <CardContent sx={{ p: 2 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                                <Badge
                                  overlap="circular"
                                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                  badgeContent={<Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: isAgentActive(agent.status) ? "#22c55e" : "#94a3b8", border: "2px solid white" }} />}
                                >
                                  <Avatar sx={{ width: 48, height: 48, background: GRADIENTS.primary }}>
                                    {agent.name?.charAt(0) || "?"}
                                  </Avatar>
                                </Badge>
                                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>{agent.name || "No Name"}</Typography>
                                  <Typography variant="caption" color="text.secondary">{agent.empId}</Typography>
                                </Box>
                              </Box>
                              <Divider sx={{ my: 1.5 }} />
                              <Box sx={{ display: "flex", gap: 1 }}>
                                <Box sx={{ flex: 1, textAlign: "center", p: 1, bgcolor: "#f0fdf4", borderRadius: 1 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#10b981" }}>{data.visits.length}</Typography>
                                  <Typography variant="caption" color="text.secondary">Visits</Typography>
                                </Box>
                                <Box sx={{ flex: 1, textAlign: "center", p: 1, bgcolor: "#fef3c7", borderRadius: 1 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#d97706" }}>{data.trips.length}</Typography>
                                  <Typography variant="caption" color="text.secondary">Trips</Typography>
                                </Box>
                                <Box sx={{ flex: 1, textAlign: "center", p: 1, bgcolor: "#e0f2fe", borderRadius: 1 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0284c7" }}>{data.calls.length}</Typography>
                                  <Typography variant="caption" color="text.secondary">Calls</Typography>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: "#f8fafc" }}>
                          <TableCell sx={{ fontWeight: 600 }}>Agent</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="center">Visits</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="center">Trips</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="center">Calls</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredDcAgents.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map(agent => {
                          const data = getAgentData(agent.id);
                          return (
                            <TableRow key={agent.id} hover sx={{ cursor: "pointer" }} onClick={() => handleAgentClick(agent)}>
                              <TableCell>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                  <Avatar sx={{ background: GRADIENTS.primary }}>{agent.name?.charAt(0)}</Avatar>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{agent.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{agent.empId}</Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip label={getStatusConfig(agent.status).label} size="small" sx={{ bgcolor: getStatusConfig(agent.status).bgColor, color: getStatusConfig(agent.status).color, fontWeight: 600 }} />
                              </TableCell>
                              <TableCell align="center">{data.visits.length}</TableCell>
                              <TableCell align="center">{data.trips.length}</TableCell>
                              <TableCell align="center">{data.calls.length}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                <TablePagination
                  component="div"
                  count={filteredDcAgents.length}
                  page={page}
                  onPageChange={(e, p) => setPage(p)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
                  rowsPerPageOptions={[8, 16, 24]}
                />
              </Box>
            )}

            {/* Tab 1: Visits */}
            {activeTab === 1 && (
              <Box>
                {filteredVisitLogs.length === 0 ? (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    No visits found for the selected date range. Try changing the date filter or check if DCs have recorded any visits.
                  </Alert>
                ) : null}
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#10b981" }}>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>Date</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>DC Name</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>Clinic Code</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>Branch</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>Partner</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>State</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>Type</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>Location</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>Duration</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }} align="center">Photos</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>Remarks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredVisitLogs.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map(log => (
                        <TableRow
                          key={`${log.id}-${log.source || 'default'}`}
                          hover
                          sx={{ cursor: "pointer", "&:hover": { bgcolor: "#f0fdf4" } }}
                          onClick={() => {
                            setSelectedVisit(log);
                            setVisitDetailOpen(true);
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2">{formatTimestamp(log.createdAt || log.timestamp)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{log.userName}</Typography>
                            <Typography variant="caption" color="text.secondary">{log.userEmpId}</Typography>
                          </TableCell>
                          <TableCell>
                            {isValidClinicCode(log.clinicCode) ? (
                              <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 600, color: "#10b981" }}>
                                {log.clinicCode}
                              </Typography>
                            ) : (
                              <Typography variant="caption" sx={{ color: "#94a3b8", fontStyle: "italic" }}>
                                {log.clinicCode || "N/A"}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{log.branchName || "N/A"}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{log.partnerName || "N/A"}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{log.state || "N/A"}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={log.visitType || "N/A"}
                              size="small"
                              sx={{ bgcolor: "#dcfce7", color: "#16a34a", fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell>
                            {(() => {
                              // Use punchInLocation from DB structure
                              const lat = log.punchInLocation?.latitude || log.latitude || log.punchInData?.latitude || log.location?.latitude;
                              const lng = log.punchInLocation?.longitude || log.longitude || log.punchInData?.longitude || log.location?.longitude;
                              if (lat && lng) {
                                return (
                                  <Tooltip title={`Punch In: ${lat.toFixed(6)}, ${lng.toFixed(6)}`}>
                                    <Box
                                      sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer" }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
                                      }}
                                    >
                                      <LocationOn sx={{ fontSize: 16, color: "#10b981" }} />
                                      <Typography variant="body2" sx={{ color: "#10b981", fontWeight: 500 }}>
                                        {lat.toFixed(4)}, {lng.toFixed(4)}
                                      </Typography>
                                    </Box>
                                  </Tooltip>
                                );
                              }
                              return <Typography variant="body2" color="text.secondary">-</Typography>;
                            })()}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {log.durationFormatted || log.punchInData?.durationFormatted || "N/A"}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {(() => {
                              const images = log.images || log.imageUrls || [];
                              return images.length > 0 ? (
                                <Chip
                                  icon={<ImageIcon sx={{ fontSize: 16 }} />}
                                  label={images.length}
                                  size="small"
                                  sx={{ bgcolor: "#e0f2fe", color: "#0284c7", fontWeight: 600 }}
                                />
                              ) : (
                                <Typography variant="body2" color="text.secondary">-</Typography>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {log.remarks || log.discussionRemarks || "N/A"}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredVisitLogs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                            <Typography color="text.secondary">No visits recorded yet</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={filteredVisitLogs.length}
                  page={page}
                  onPageChange={(e, p) => setPage(p)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
                  rowsPerPageOptions={[10, 25, 50, 100]}
                />
              </Box>
            )}

            {/* Tab 2: Trips */}
            {activeTab === 2 && (
              <Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#10b981" }}>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>Date</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>DC Name</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>Start Time</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>End Time</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>Distance</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>Duration</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredTrips.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map(trip => (
                        <TableRow key={trip.id} hover>
                          <TableCell>{formatDate(trip.startTime)}</TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>{trip.userName}</TableCell>
                          <TableCell>{formatTimestamp(trip.startTime)}</TableCell>
                          <TableCell>{formatTimestamp(trip.endTime)}</TableCell>
                          <TableCell>
                            <Typography sx={{ fontWeight: 600, color: "#10b981" }}>
                              {trip.totalDistance?.toFixed(2) || 0} km
                            </Typography>
                          </TableCell>
                          <TableCell>{formatDuration(trip.totalDuration)}</TableCell>
                          <TableCell>
                            <Chip
                              label={trip.status || "N/A"}
                              size="small"
                              sx={{ bgcolor: trip.status === "completed" ? "#dcfce7" : "#fef3c7", color: trip.status === "completed" ? "#16a34a" : "#d97706" }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={filteredTrips.length}
                  page={page}
                  onPageChange={(e, p) => setPage(p)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
                  rowsPerPageOptions={[10, 25, 50]}
                />
              </Box>
            )}

            {/* Tab 3: Clinics */}
            {activeTab === 3 && (
              <ClinicAnalytics
                visitLogs={visitLogs}
                dcAgents={dcAgents}
                dateRange={dateRange}
              />
            )}

            {/* Tab 4: Analytics */}
            {activeTab === 4 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {/* Row 1: Weekly Activity Trend + Visit Types */}
                <Box sx={{ display: "flex", gap: 2.5, flexDirection: { xs: "column", md: "row" } }}>
                  <Card
                    elevation={0}
                    sx={{
                      flex: 1,
                      bgcolor: "#0f172a",
                      borderRadius: 2,
                      height: 420,
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#e2e8f0" }}>
                        Weekly Activity Trend
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, px: 1, pb: 1.5 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={analyticsData.weeklyTrend} margin={{ top: 20, right: 30, left: 20, bottom: 45 }}>
                          <defs>
                            <linearGradient id="visitsGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} dy={10} />
                          <YAxis stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} dx={-10} />
                          <RechartsTooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: 8 }} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                          <Area type="monotone" dataKey="visits" name="Visits" fill="url(#visitsGradient)" stroke="#10b981" strokeWidth={2} />
                          <Bar dataKey="trips" name="Trips" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                          <Line type="monotone" dataKey="calls" name="Calls" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6", r: 4 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </Box>
                  </Card>

                  <Card
                    elevation={0}
                    sx={{
                      flex: 1,
                      bgcolor: "#0f172a",
                      borderRadius: 2,
                      height: 420,
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#e2e8f0" }}>
                        Visit Types
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, px: 1, pb: 1.5 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.visitTypes}
                            cx="50%"
                            cy="45%"
                            innerRadius={70}
                            outerRadius={120}
                            paddingAngle={4}
                            dataKey="value"
                            cornerRadius={4}
                          >
                            {analyticsData.visitTypes.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: 8 }} />
                          <Legend
                            verticalAlign="bottom"
                            height={50}
                            iconType="circle"
                            iconSize={10}
                            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                            formatter={(value) => <span style={{ color: "#e2e8f0", marginLeft: 6 }}>{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Card>
                </Box>

                {/* Row 2: Monthly Trend + Top Performers */}
                <Box sx={{ display: "flex", gap: 2.5, flexDirection: { xs: "column", md: "row" } }}>
                  <Card
                    elevation={0}
                    sx={{
                      flex: 1,
                      bgcolor: "#0f172a",
                      borderRadius: 2,
                      height: 420,
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#e2e8f0" }}>
                        Monthly Trend (6 Months)
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, px: 1, pb: 1.5 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.monthlyTrend} margin={{ top: 20, right: 30, left: 20, bottom: 45 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} dy={10} />
                          <YAxis stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} dx={-10} />
                          <RechartsTooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: 8 }} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                          <Bar dataKey="visits" name="Visits" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="trips" name="Trips" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Card>

                  <Card
                    elevation={0}
                    sx={{
                      flex: 1,
                      bgcolor: "#0f172a",
                      borderRadius: 2,
                      height: 420,
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#e2e8f0" }}>
                        Top Performers
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, px: 1, pb: 1.5 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.topPerformers.slice(0, 5)} layout="vertical" margin={{ top: 20, right: 30, left: 10, bottom: 45 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                          <XAxis type="number" stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} />
                          <YAxis dataKey="name" type="category" stroke="#94a3b8" width={80} fontSize={12} axisLine={false} tickLine={false} />
                          <RechartsTooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: 8 }} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                          <Bar dataKey="visits" name="Visits" fill="#10b981" radius={[0, 4, 4, 0]} barSize={18} />
                          <Bar dataKey="trips" name="Trips" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={18} />
                          <Bar dataKey="calls" name="Calls" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={18} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Card>
                </Box>

                {/* Row 3: Hourly Distribution + Summary Cards */}
                <Box sx={{ display: "flex", gap: 2.5, flexDirection: { xs: "column", md: "row" } }}>
                  <Card
                    elevation={0}
                    sx={{
                      flex: 1,
                      bgcolor: "#0f172a",
                      borderRadius: 2,
                      height: 420,
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#e2e8f0" }}>
                        Visits by Hour of Day
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, px: 1, pb: 1.5 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analyticsData.hourlyDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 45 }}>
                          <defs>
                            <linearGradient id="hourlyGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} dy={10} />
                          <YAxis stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} dx={-10} />
                          <RechartsTooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: 8 }} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                          <Area type="monotone" dataKey="visits" name="Visits" stroke="#0ea5e9" fill="url(#hourlyGradient)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </Card>

                  <Card
                    elevation={0}
                    sx={{
                      flex: 1,
                      bgcolor: "#0f172a",
                      borderRadius: 2,
                      height: 420,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      p: 3,
                      gap: 2.5
                    }}
                  >
                    {/* Summary Card 1 */}
                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", p: 3, bgcolor: "#1e293b", borderRadius: 2 }}>
                      <Typography variant="overline" sx={{ color: "#64748b", fontWeight: 600, letterSpacing: 1.5, fontSize: 11 }}>
                        AVG VISITS/AGENT
                      </Typography>
                      <Typography variant="h2" sx={{ fontWeight: 700, color: "#f1f5f9", my: 1.5 }}>
                        {stats.totalAgents > 0 ? (stats.totalVisits / stats.totalAgents).toFixed(1) : 0}
                      </Typography>
                      <Divider sx={{ borderColor: "#475569", my: 1.5 }} />
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2" sx={{ color: "#94a3b8" }}>Avg Distance/Trip</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: "#10b981" }}>
                          {stats.totalTrips > 0 ? (stats.totalDistance / stats.totalTrips).toFixed(2) : 0} km
                        </Typography>
                      </Box>
                    </Box>

                    {/* Summary Card 2 */}
                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", p: 3, bgcolor: "#1e293b", borderRadius: 2 }}>
                      <Typography variant="overline" sx={{ color: "#64748b", fontWeight: 600, letterSpacing: 1.5, fontSize: 11 }}>
                        TOTAL DISTANCE
                      </Typography>
                      <Typography variant="h2" sx={{ fontWeight: 700, color: "#f1f5f9", my: 1.5 }}>
                        {stats.totalDistance.toFixed(0)} <Typography component="span" variant="h5" sx={{ color: "#64748b", fontWeight: 400 }}>km</Typography>
                      </Typography>
                      <Divider sx={{ borderColor: "#475569", my: 1.5 }} />
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2" sx={{ color: "#94a3b8" }}>Unique Clinics</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: "#f59e0b" }}>{stats.uniqueClinics}</Typography>
                      </Box>
                    </Box>
                  </Card>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Agent Detail Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        {selectedAgent && (
          <>
            <DialogTitle sx={{ background: GRADIENTS.primary, color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "white", color: "#10b981", width: 48, height: 48 }}>{selectedAgent.name?.charAt(0)}</Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{selectedAgent.name}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>{selectedAgent.empId}</Typography>
                </Box>
              </Box>
              <IconButton onClick={() => setDialogOpen(false)} sx={{ color: "white" }}><Close /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Email sx={{ color: "#64748b" }} />
                    <Typography variant="body2">{selectedAgent.email || "N/A"}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Phone sx={{ color: "#64748b" }} />
                    <Typography variant="body2">{selectedAgent.mobile || "N/A"}</Typography>
                  </Box>
                </Grid>
              </Grid>
              <Divider />
              <Box sx={{ my: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#10b981", mb: 2 }}>Activity Summary</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#f0fdf4", borderRadius: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: "#10b981" }}>{getAgentData(selectedAgent.id).visits.length}</Typography>
                      <Typography variant="body2" color="text.secondary">Visits</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#fef3c7", borderRadius: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: "#d97706" }}>{getAgentData(selectedAgent.id).trips.length}</Typography>
                      <Typography variant="body2" color="text.secondary">Trips</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#e0f2fe", borderRadius: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: "#0284c7" }}>{getAgentData(selectedAgent.id).calls.length}</Typography>
                      <Typography variant="body2" color="text.secondary">Calls</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setDialogOpen(false)} variant="contained" sx={{ bgcolor: "#10b981", textTransform: "none" }}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* CSV Export Dialog */}
      <CSVExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        visitLogs={visitLogs}
        trips={trips}
        manualCallLogs={manualCallLogs}
        dcAgents={dcAgents}
      />

      {/* Visit Detail Dialog */}
      <VisitDetailDialog
        open={visitDetailOpen}
        onClose={() => {
          setVisitDetailOpen(false);
          setSelectedVisit(null);
        }}
        visit={selectedVisit}
        formatTimestamp={formatTimestamp}
      />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </Box>
  );
}

export default OpsManagerDashboard;
