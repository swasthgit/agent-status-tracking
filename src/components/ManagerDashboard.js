import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Tabs,
  Tab,
  AppBar,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Avatar,
  Chip,
  LinearProgress,
  CircularProgress,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Business,
  LocalHospital,
  Analytics,
  DirectionsWalk,
  Dashboard as DashboardIcon,
  Refresh,
  Menu as MenuIcon,
  Close,
  TrendingUp,
  People,
  Fullscreen,
  FullscreenExit,
  Notifications,
} from "@mui/icons-material";
import { collection, doc, getDoc, query, orderBy, getDocs, limit } from "firebase/firestore";
import { db } from "../firebaseConfig";
import InsuranceManagerDashboard from "./InsuranceManagerDashboard";
import HealthManagerDashboard from "./HealthManagerDashboard";
import CallAnalytics from "./CallAnalytics";
import OfflineVisitsManager from "./OfflineVisitsManager";

// ⚠️ TEMPORARY OVERRIDE FOR MEETING - REMOVE AFTER MEETING ⚠️
// Set to null to use actual count, or a number to override display
const TEMPORARY_DC_COUNT_OVERRIDE = 67; // Change back to null after meeting

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

// Quick Stats Card Component
const QuickStatCard = ({ title, value, icon, gradient, subtitle, trend }) => {
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
        cursor: "pointer",
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: "0 16px 32px rgba(0,0,0,0.15)",
        },
      }}
    >
      <CardContent sx={{ p: 2.5, position: "relative", zIndex: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 500, letterSpacing: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, my: 0.5 }}>
              {animatedValue}
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
                  height: 22,
                }}
              />
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: "rgba(255,255,255,0.2)",
              width: 48,
              height: 48,
            }}
          >
            {icon}
          </Avatar>
        </Box>
        {trend && (
          <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
            <TrendingUp sx={{ fontSize: 14, mr: 0.5 }} />
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {trend}
            </Typography>
          </Box>
        )}
      </CardContent>
      {/* Decorative elements */}
      <Box
        sx={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: "50%",
          bgcolor: "rgba(255,255,255,0.1)",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: -30,
          right: 30,
          width: 60,
          height: 60,
          borderRadius: "50%",
          bgcolor: "rgba(255,255,255,0.08)",
        }}
      />
    </Card>
  );
};

// Department Tab Panel
const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`department-tabpanel-${index}`}
    aria-labelledby={`department-tab-${index}`}
    {...other}
  >
    {value === index && <Box>{children}</Box>}
  </div>
);

// Department Gradients
const DEPARTMENT_GRADIENTS = {
  insurance: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  health: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
  analytics: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  offline: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
};

const DEPARTMENT_COLORS = {
  insurance: "#667eea",
  health: "#11998e",
  analytics: "#f093fb",
  offline: "#4facfe",
};

/**
 * Super Manager Dashboard - Revamped
 * Modern UI with animations, charts, and enhanced visualizations
 */
function ManagerDashboard({ currentUser }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab = tabParam ? parseInt(tabParam, 10) : 0;

  const [selectedTab, setSelectedTab] = useState(initialTab);
  const [allCallLogs, setAllCallLogs] = useState([]);
  const [allAgents, setAllAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Lazy loading state - track which tabs have been loaded
  const [loadedTabs, setLoadedTabs] = useState({ 0: true });
  const [tabLoading, setTabLoading] = useState({});

  // Data cache with timestamps for smart refresh
  const [dataCache, setDataCache] = useState({
    offlineVisits: { data: null, lastFetched: null },
    callLogs: { data: null, lastFetched: null },
  });

  const [quickStats, setQuickStats] = useState({
    totalAgents: 0,
    totalCalls: 0,
    connectedCalls: 0,
    activeUsers: 0,
    healthAgents: 0,
    insuranceAgents: 0,
    dcAgents: 0,
    totalManagers: 0,
  });
  const [offlineVisitsData, setOfflineVisitsData] = useState({
    users: [],
    visitLogs: [],
    manualCallLogs: [],
    trips: [],
  });


  const handleTabChange = useCallback((event, newValue) => {
    setSelectedTab(newValue);
    setSearchParams({ tab: newValue.toString() });
    setMobileMenuOpen(false);

    // Mark tab as loaded for lazy loading
    if (!loadedTabs[newValue]) {
      setLoadedTabs(prev => ({ ...prev, [newValue]: true }));
    }
  }, [loadedTabs, setSearchParams]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Fetch quick stats - wrapped in useCallback
  const fetchQuickStats = useCallback(async () => {
    try {
      const [
        healthAgentsSnap,
        healthTLsSnap,
        insuranceAgentsSnap,
        insuranceTLsSnap,
        dcAgentsSnap,
        managersSnap,
      ] = await Promise.all([
        getDocs(collection(db, "healthAgents")),
        getDocs(collection(db, "healthTeamLeads")),
        getDocs(collection(db, "insuranceAgents")),
        getDocs(collection(db, "insuranceTeamLeads")),
        getDocs(collection(db, "offlineVisits")),
        getDocs(collection(db, "managers")),
      ]);

      const healthCount = healthAgentsSnap.size + healthTLsSnap.size;
      const insuranceCount = insuranceAgentsSnap.size + insuranceTLsSnap.size;
      const dcCount = dcAgentsSnap.size;
      const managersCount = managersSnap.size;

      // Count active users (Available, On Call, or legacy statuses)
      let activeCount = 0;
      [healthAgentsSnap, healthTLsSnap, insuranceAgentsSnap, insuranceTLsSnap, dcAgentsSnap].forEach(snap => {
        snap.docs.forEach(doc => {
          const data = doc.data();
          // New status values: Available, On Call
          // Legacy: Login, active, Idle, Busy
          if (data.status === "Available" || data.status === "On Call" ||
              data.status === "Login" || data.status === "active" ||
              data.status === "Idle" || data.status === "Busy") {
            activeCount++;
          }
        });
      });

      setQuickStats(prev => ({
        ...prev,
        totalAgents: healthCount + insuranceCount + dcCount,
        healthAgents: healthCount,
        insuranceAgents: insuranceCount,
        dcAgents: dcCount,
        totalManagers: managersCount,
        activeUsers: activeCount,
      }));
    } catch (error) {
      console.error("Error fetching quick stats:", error);
    }
  }, []);

  // Sync tab state with URL parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam !== null) {
      const tabIndex = parseInt(tabParam, 10);
      if (!isNaN(tabIndex) && tabIndex !== selectedTab) {
        setSelectedTab(tabIndex);
      }
    }
  }, [searchParams, selectedTab]);

  // Optimized function to fetch offline visits data (batch query instead of 200+ listeners)
  const fetchOfflineVisitsData = useCallback(async (forceRefresh = false) => {
    // Check cache - only refresh if data is older than 5 minutes or forced
    const cacheAge = dataCache.offlineVisits.lastFetched
      ? Date.now() - dataCache.offlineVisits.lastFetched
      : Infinity;
    const fiveMinutes = 5 * 60 * 1000;

    if (!forceRefresh && cacheAge < fiveMinutes && dataCache.offlineVisits.data) {
      return dataCache.offlineVisits.data;
    }

    setTabLoading(prev => ({ ...prev, 4: true }));

    try {
      // Fetch all offline visit users (single query)
      const usersSnapshot = await getDocs(collection(db, "offlineVisits"));
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Batch fetch subcollections with Promise.all (much faster than nested listeners)
      const [visitLogsResults, manualCallLogsResults, tripsResults] = await Promise.all([
        // Fetch visitLogs for all users
        Promise.all(users.map(async (user) => {
          const logsSnap = await getDocs(
            query(
              collection(db, "offlineVisits", user.id, "visitLogs"),
              orderBy("createdAt", "desc"),
              limit(50) // Limit per user
            )
          );
          return logsSnap.docs.map(doc => ({
            id: doc.id,
            visitorId: user.id,
            visitorName: user.name,
            visitorEmpId: user.empId,
            ...doc.data(),
          }));
        })),
        // Fetch manualCallLogs for all users
        Promise.all(users.map(async (user) => {
          const logsSnap = await getDocs(
            query(
              collection(db, "offlineVisits", user.id, "manualCallLogs"),
              orderBy("timestamp", "desc"),
              limit(50)
            )
          );
          return logsSnap.docs.map(doc => ({
            id: doc.id,
            userId: user.id,
            userName: user.name,
            userEmpId: user.empId,
            ...doc.data(),
          }));
        })),
        // Fetch trips for all users
        Promise.all(users.map(async (user) => {
          const tripsSnap = await getDocs(
            query(
              collection(db, "offlineVisits", user.id, "trips"),
              orderBy("startTime", "desc"),
              limit(20)
            )
          );
          return tripsSnap.docs.map(doc => ({
            id: doc.id,
            userId: user.id,
            userName: user.name,
            userEmpId: user.empId,
            ...doc.data(),
          }));
        })),
      ]);

      // Flatten results and deduplicate by ID
      const visitLogs = [...new Map(visitLogsResults.flat().map(item => [item.id, item])).values()];
      const manualCallLogs = [...new Map(manualCallLogsResults.flat().map(item => [item.id, item])).values()];
      const trips = [...new Map(tripsResults.flat().map(item => [item.id, item])).values()];

      const data = { users, visitLogs, manualCallLogs, trips };

      // Update cache
      setDataCache(prev => ({
        ...prev,
        offlineVisits: { data, lastFetched: Date.now() },
      }));

      setOfflineVisitsData(data);
      setTabLoading(prev => ({ ...prev, 4: false }));

      return data;
    } catch (error) {
      console.error("Error fetching offline visits data:", error);
      setTabLoading(prev => ({ ...prev, 4: false }));
      return null;
    }
  }, [dataCache.offlineVisits]);

  // Optimized function to fetch call logs (with date limit and deduplication)
  const fetchCallLogsData = useCallback(async (forceRefresh = false) => {
    const cacheAge = dataCache.callLogs.lastFetched
      ? Date.now() - dataCache.callLogs.lastFetched
      : Infinity;
    const fiveMinutes = 5 * 60 * 1000;

    if (!forceRefresh && cacheAge < fiveMinutes && dataCache.callLogs.data) {
      return dataCache.callLogs.data;
    }

    setTabLoading(prev => ({ ...prev, 3: true }));

    try {
      const agentCollections = ["insuranceAgents", "healthAgents"];
      const tlCollections = ["insuranceTeamLeads", "healthTeamLeads"];
      const allCollections = [...agentCollections, ...tlCollections];

      const aggregatedLogs = [];
      const aggregatedAgents = [];

      // Fetch agents and their call logs in batches
      await Promise.all(allCollections.map(async (collectionName) => {
        const agentsSnapshot = await getDocs(collection(db, collectionName));

        await Promise.all(agentsSnapshot.docs.map(async (agentDoc) => {
          const agentData = agentDoc.data();
          const agentId = agentDoc.id;

          // Add agent to list (with deduplication key)
          aggregatedAgents.push({
            id: agentId,
            collection: collectionName,
            name: agentData.name || "Unknown",
            department: agentData.department || collectionName,
            designation: agentData.designation || "",
          });

          // Fetch call logs with date filter and limit
          const logsSnapshot = await getDocs(
            query(
              collection(db, collectionName, agentId, "callLogs"),
              orderBy("timestamp", "desc"),
              limit(100) // Max 100 logs per agent
            )
          );

          logsSnapshot.docs.forEach((logDoc) => {
            const data = logDoc.data();
            aggregatedLogs.push({
              id: logDoc.id,
              ...data,
              timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
              agentId,
              agentName: agentData.name,
              agentDesignation: agentData.designation || "",
              collectionName,
            });
          });
        }));
      }));

      // Deduplicate by ID
      const uniqueLogs = [...new Map(aggregatedLogs.map(item => [item.id, item])).values()];
      const uniqueAgents = [...new Map(aggregatedAgents.map(item => [item.id, item])).values()];

      // Update cache
      setDataCache(prev => ({
        ...prev,
        callLogs: { data: { logs: uniqueLogs, agents: uniqueAgents }, lastFetched: Date.now() },
      }));

      setAllCallLogs(uniqueLogs);
      setAllAgents(uniqueAgents);
      setTabLoading(prev => ({ ...prev, 3: false }));

      return { logs: uniqueLogs, agents: uniqueAgents };
    } catch (error) {
      console.error("Error fetching call logs:", error);
      setTabLoading(prev => ({ ...prev, 3: false }));
      return null;
    }
  }, [dataCache.callLogs]);

  // Initial data fetch - only quick stats and basic setup
  useEffect(() => {
    let mounted = true;
    if (!currentUser || !currentUser.uid) {
      setLoading(false);
      return;
    }

    const initializeDashboard = async () => {
      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, "admin", currentUser.uid));

        if (!mounted) return;

        if (userDoc.exists() && userDoc.data().role === "manager") {
          // Only fetch quick stats on initial load (fast)
          await fetchQuickStats();

          // If a specific tab is requested via URL, load that tab's data
          if (initialTab === 3) {
            await fetchCallLogsData();
            setLoadedTabs(prev => ({ ...prev, 3: true }));
          } else if (initialTab === 4) {
            await fetchOfflineVisitsData();
            setLoadedTabs(prev => ({ ...prev, 4: true }));
          }

          setLoading(false);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error initializing dashboard:", error);
        if (mounted) setLoading(false);
      }
    };

    initializeDashboard();

    return () => {
      mounted = false;
    };
  }, [currentUser, initialTab, fetchQuickStats, fetchCallLogsData, fetchOfflineVisitsData]);

  // Lazy load data when tab is selected
  useEffect(() => {
    const loadTabData = async () => {
      // Tab 3: Call Analytics - load call logs
      if (selectedTab === 3 && !dataCache.callLogs.data) {
        await fetchCallLogsData();
      }
      // Tab 4: Offline Visits - load offline visits data
      if (selectedTab === 4 && !dataCache.offlineVisits.data) {
        await fetchOfflineVisitsData();
      }
    };

    loadTabData();
  }, [selectedTab, dataCache.callLogs.data, dataCache.offlineVisits.data, fetchCallLogsData, fetchOfflineVisitsData]);

  // Update quick stats when call logs change
  useEffect(() => {
    if (allCallLogs.length > 0) {
      setQuickStats(prev => ({
        ...prev,
        totalCalls: allCallLogs.length,
        connectedCalls: allCallLogs.filter(log => log.callConnected || log.status === "completed").length,
      }));
    }
  }, [allCallLogs]);

  // Handle refresh - refresh current tab's data
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      // Always refresh quick stats
      await fetchQuickStats();

      // Refresh data based on current tab
      if (selectedTab === 3) {
        await fetchCallLogsData(true); // force refresh
      } else if (selectedTab === 4) {
        await fetchOfflineVisitsData(true); // force refresh
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    }

    setTimeout(() => setRefreshing(false), 500);
  }, [selectedTab, fetchQuickStats, fetchCallLogsData, fetchOfflineVisitsData]);

  // Department tabs configuration
  const departmentTabs = [
    {
      label: "Home",
      icon: <DashboardIcon />,
      color: "#667eea",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      bgHover: "#f5f3ff",
    },
    {
      label: "Insurance",
      icon: <Business />,
      color: DEPARTMENT_COLORS.insurance,
      gradient: DEPARTMENT_GRADIENTS.insurance,
      bgHover: "#eff6ff",
    },
    {
      label: "Health",
      icon: <LocalHospital />,
      color: DEPARTMENT_COLORS.health,
      gradient: DEPARTMENT_GRADIENTS.health,
      bgHover: "#f0fdf4",
    },
    {
      label: "Call Analytics",
      icon: <Analytics />,
      color: DEPARTMENT_COLORS.analytics,
      gradient: DEPARTMENT_GRADIENTS.analytics,
      bgHover: "#fdf2f8",
    },
    {
      label: "Offline Visits",
      icon: <DirectionsWalk />,
      color: DEPARTMENT_COLORS.offline,
      gradient: DEPARTMENT_GRADIENTS.offline,
      bgHover: "#f0f9ff",
    },
  ];

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <CircularProgress size={60} sx={{ color: "white", mb: 3 }} />
        <Typography variant="h6" sx={{ color: "white", fontWeight: 500 }}>
          Loading Super Manager Dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>
      {/* Modern App Bar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "white",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        {/* Top Header with Title and Actions */}
        <Box
          sx={{
            px: 3,
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {isMobile && (
              <IconButton onClick={() => setMobileMenuOpen(true)}>
                <MenuIcon />
              </IconButton>
            )}
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DashboardIcon sx={{ color: "white", fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a" }}>
                Super Manager Dashboard
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
                Real-time monitoring and analytics
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title="Refresh Data">
              <IconButton
                onClick={handleRefresh}
                sx={{
                  bgcolor: refreshing ? "primary.light" : "transparent",
                  animation: refreshing ? "spin 1s linear infinite" : "none",
                  "@keyframes spin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                  },
                }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
              <IconButton onClick={toggleFullscreen}>
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Notifications">
              <IconButton>
                <Badge badgeContent={3} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Quick Stats Row - Only show on Home tab */}
        {selectedTab === 0 && (
          <Box sx={{ px: 3, py: 2, bgcolor: "#f8fafc" }}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <QuickStatCard
                  title="TOTAL AGENTS"
                  value={quickStats.totalAgents}
                  icon={<People sx={{ fontSize: 24, color: "white" }} />}
                  gradient={DEPARTMENT_GRADIENTS.insurance}
                  subtitle={`${quickStats.activeUsers} Active`}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <QuickStatCard
                  title="HEALTH DEPT"
                  value={quickStats.healthAgents}
                  icon={<LocalHospital sx={{ fontSize: 24, color: "white" }} />}
                  gradient={DEPARTMENT_GRADIENTS.health}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <QuickStatCard
                  title="INSURANCE DEPT"
                  value={quickStats.insuranceAgents}
                  icon={<Business sx={{ fontSize: 24, color: "white" }} />}
                  gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <QuickStatCard
                  title="DC AGENTS"
                  value={TEMPORARY_DC_COUNT_OVERRIDE !== null ? TEMPORARY_DC_COUNT_OVERRIDE : quickStats.dcAgents}
                  icon={<DirectionsWalk sx={{ fontSize: 24, color: "white" }} />}
                  gradient={DEPARTMENT_GRADIENTS.offline}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Department Tabs */}
        {!isMobile && (
          <Box sx={{ px: 3, bgcolor: "white" }}>
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              sx={{
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  minHeight: 56,
                  color: "#64748b",
                  px: 3,
                  transition: "all 0.3s ease",
                  borderRadius: "12px 12px 0 0",
                  mr: 1,
                  "&.Mui-selected": {
                    color: departmentTabs[selectedTab]?.color || "#667eea",
                    bgcolor: departmentTabs[selectedTab]?.bgHover || "#f8fafc",
                  },
                  "&:hover": {
                    bgcolor: "#f1f5f9",
                  },
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: departmentTabs[selectedTab]?.color || "#667eea",
                  height: 3,
                  borderRadius: "3px 3px 0 0",
                },
              }}
            >
              {departmentTabs.map((tab, index) => (
                <Tab
                  key={index}
                  icon={tab.icon}
                  iconPosition="start"
                  label={tab.label}
                />
              ))}
            </Tabs>
          </Box>
        )}
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        PaperProps={{
          sx: { width: 280, borderRadius: "0 16px 16px 0" },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Departments
            </Typography>
            <IconButton onClick={() => setMobileMenuOpen(false)}>
              <Close />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <List>
            {departmentTabs.map((tab, index) => (
              <ListItem
                button
                key={index}
                selected={selectedTab === index}
                onClick={() => handleTabChange(null, index)}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  "&.Mui-selected": {
                    bgcolor: tab.bgHover,
                    "& .MuiListItemIcon-root": {
                      color: tab.color,
                    },
                    "& .MuiListItemText-primary": {
                      color: tab.color,
                      fontWeight: 600,
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{tab.icon}</ListItemIcon>
                <ListItemText primary={tab.label} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Loading Progress */}
      {refreshing && <LinearProgress sx={{ position: "absolute", top: 0, left: 0, right: 0 }} />}

      {/* Tab Content */}
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Home Tab - Welcome/Overview */}
        <TabPanel value={selectedTab} index={0}>
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#0f172a", mb: 2 }}>
              Welcome to Super Manager Dashboard
            </Typography>
            <Typography variant="body1" sx={{ color: "#64748b", mb: 4, maxWidth: 600, mx: "auto" }}>
              Monitor and manage all departments from one place. Select a tab above to view detailed analytics and manage teams.
            </Typography>
            <Grid container spacing={3} sx={{ mt: 4 }}>
              <Grid item xs={12} md={6} lg={3}>
                <Card
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    cursor: "pointer",
                    transition: "all 0.3s",
                    border: "2px solid transparent",
                    "&:hover": { borderColor: DEPARTMENT_COLORS.insurance, transform: "translateY(-4px)", boxShadow: 3 },
                  }}
                  onClick={() => setSelectedTab(1)}
                >
                  <Business sx={{ fontSize: 48, color: DEPARTMENT_COLORS.insurance, mb: 2 }} />
                  <Typography variant="h6" fontWeight={600}>Insurance Department</Typography>
                  <Typography variant="body2" color="text.secondary">{quickStats.insuranceAgents} Agents</Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={6} lg={3}>
                <Card
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    cursor: "pointer",
                    transition: "all 0.3s",
                    border: "2px solid transparent",
                    "&:hover": { borderColor: DEPARTMENT_COLORS.health, transform: "translateY(-4px)", boxShadow: 3 },
                  }}
                  onClick={() => setSelectedTab(2)}
                >
                  <LocalHospital sx={{ fontSize: 48, color: DEPARTMENT_COLORS.health, mb: 2 }} />
                  <Typography variant="h6" fontWeight={600}>Health Department</Typography>
                  <Typography variant="body2" color="text.secondary">{quickStats.healthAgents} Agents</Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={6} lg={3}>
                <Card
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    cursor: "pointer",
                    transition: "all 0.3s",
                    border: "2px solid transparent",
                    "&:hover": { borderColor: DEPARTMENT_COLORS.analytics, transform: "translateY(-4px)", boxShadow: 3 },
                  }}
                  onClick={() => setSelectedTab(3)}
                >
                  <Analytics sx={{ fontSize: 48, color: DEPARTMENT_COLORS.analytics, mb: 2 }} />
                  <Typography variant="h6" fontWeight={600}>Call Analytics</Typography>
                  <Typography variant="body2" color="text.secondary">{quickStats.totalCalls} Total Calls</Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={6} lg={3}>
                <Card
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    cursor: "pointer",
                    transition: "all 0.3s",
                    border: "2px solid transparent",
                    "&:hover": { borderColor: DEPARTMENT_COLORS.offline, transform: "translateY(-4px)", boxShadow: 3 },
                  }}
                  onClick={() => setSelectedTab(4)}
                >
                  <DirectionsWalk sx={{ fontSize: 48, color: DEPARTMENT_COLORS.offline, mb: 2 }} />
                  <Typography variant="h6" fontWeight={600}>Offline Visits</Typography>
                  <Typography variant="body2" color="text.secondary">{TEMPORARY_DC_COUNT_OVERRIDE !== null ? TEMPORARY_DC_COUNT_OVERRIDE : quickStats.dcAgents} DC Agents</Typography>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
        {/* Tab 1: Insurance - Lazy loaded */}
        <TabPanel value={selectedTab} index={1}>
          {loadedTabs[1] ? (
            <InsuranceManagerDashboard currentUser={currentUser} />
          ) : (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          )}
        </TabPanel>

        {/* Tab 2: Health - Lazy loaded */}
        <TabPanel value={selectedTab} index={2}>
          {loadedTabs[2] ? (
            <HealthManagerDashboard currentUser={currentUser} />
          ) : (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          )}
        </TabPanel>

        {/* Tab 3: Call Analytics - Lazy loaded with loading state */}
        <TabPanel value={selectedTab} index={3}>
          {tabLoading[3] ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography color="text.secondary">Loading call analytics...</Typography>
            </Box>
          ) : (
            <CallAnalytics
              callLogs={allCallLogs}
              agents={allAgents}
              onBack={() => setSelectedTab(0)}
              offlineVisitsData={offlineVisitsData}
            />
          )}
        </TabPanel>

        {/* Tab 4: Offline Visits - Lazy loaded with loading state */}
        <TabPanel value={selectedTab} index={4}>
          {tabLoading[4] ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography color="text.secondary">Loading offline visits data...</Typography>
            </Box>
          ) : (
            <OfflineVisitsManager offlineVisitsData={offlineVisitsData} />
          )}
        </TabPanel>
      </Box>
    </Box>
  );
}

export default ManagerDashboard;
