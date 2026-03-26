import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  IconButton,
  Tooltip,
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
  LocalHospital,
  Dashboard as DashboardIcon,
  Refresh,
  Menu as MenuIcon,
  Close,
  TrendingUp,
  TrendingDown,
  Fullscreen,
  FullscreenExit,
  Notifications,
  ChevronLeft,
  ChevronRight,
  ArrowForward,
  Bolt,
  FiberManualRecord,
  Shield,
  Phone,
  Route,
  Groups,
  LightMode,
  DarkMode,
} from "@mui/icons-material";
import { ManagerThemeProvider, useThemeMode } from "../context/ThemeContext";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { collection, doc, getDoc, query, orderBy, getDocs, limit } from "firebase/firestore";
import { db } from "../firebaseConfig";
import InsuranceManagerDashboard from "./InsuranceManagerDashboard";
import HealthManagerDashboard from "./HealthManagerDashboard";
import CallAnalytics from "./CallAnalytics";
import OfflineVisitsManager from "./OfflineVisitsManager";
import styles from "./ManagerDashboard.module.css";

// ============================================================
// CONFIGURATION
// ============================================================

const TEMPORARY_DC_COUNT_OVERRIDE = 67;
const SIDEBAR_W = 260;
const SIDEBAR_W_COLLAPSED = 72;
const FF = "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";

// DEPT uses accent colors that stay the same in both dark/light modes
const DEPT = {
  home: { color: "#818cf8", accent: "#6366f1", gradient: "linear-gradient(135deg, #6366f1, #4f46e5)", label: "Overview", Icon: DashboardIcon },
  insurance: { color: "#a78bfa", accent: "#8b5cf6", gradient: "linear-gradient(135deg, #a78bfa, #7c3aed)", label: "Insurance", Icon: Shield },
  health: { color: "#34d399", accent: "#10b981", gradient: "linear-gradient(135deg, #34d399, #059669)", label: "Health", Icon: LocalHospital },
  analytics: { color: "#fbbf24", accent: "#f59e0b", gradient: "linear-gradient(135deg, #fbbf24, #d97706)", label: "Analytics", Icon: Phone },
  offline: { color: "#22d3ee", accent: "#06b6d4", gradient: "linear-gradient(135deg, #22d3ee, #0891b2)", label: "DC Visits", Icon: Route },
};
const DEPT_KEYS = ["home", "insurance", "health", "analytics", "offline"];

// ============================================================
// HOOKS
// ============================================================

const useAnimatedCounter = (end, duration = 1500) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (end === 0) { setCount(0); return; }
    const t0 = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - t0) / duration, 1);
      setCount(Math.floor(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [end, duration]);
  return count;
};

// ============================================================
// GLASS CARD WRAPPER
// ============================================================

const Glass = ({ children, sx, className, onClick, ...rest }) => {
  const { colors: C } = useThemeMode();
  return (
    <Box
      onClick={onClick}
      className={className}
      sx={{
        background: C.bgCard || C.glassBg,
        border: `1px solid ${C.glassBorder}`,
        borderRadius: "16px",
        boxShadow: C.shadowCard,
        transition: 'transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease',
        "&:hover": onClick ? { background: C.bgCardHover, borderColor: C.borderHover, transform: "translateY(-2px)" } : {},
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Box>
  );
};

// ============================================================
// ANIMATED METRIC
// ============================================================

const Metric = ({ label, value, suffix = "", color, icon, trend, animClass }) => {
  const { colors: C } = useThemeMode();
  const v = useAnimatedCounter(value);
  return (
    <Glass className={animClass} sx={{ p: "20px 22px", cursor: "default", position: "relative", overflow: "hidden" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <Box sx={{ width: 32, height: 32, borderRadius: "8px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {React.cloneElement(icon, { sx: { fontSize: 17, color } })}
        </Box>
        <Typography sx={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: FF }}>
          {label}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
        <Typography sx={{ fontSize: 30, fontWeight: 800, color: C.text, fontFamily: FF, lineHeight: 1, letterSpacing: "-0.03em" }}>
          {v}{suffix}
        </Typography>
        {trend && (
          <Chip
            icon={trend > 0 ? <TrendingUp sx={{ fontSize: 13 }} /> : <TrendingDown sx={{ fontSize: 13 }} />}
            label={`${Math.abs(trend)}%`}
            size="small"
            sx={{
              height: 22, fontSize: 11, fontWeight: 700, fontFamily: FF,
              bgcolor: trend > 0 ? "rgba(52,211,153,0.12)" : "rgba(251,113,133,0.12)",
              color: trend > 0 ? C.emerald : C.rose,
              "& .MuiChip-icon": { color: "inherit", ml: "4px" },
            }}
          />
        )}
      </Box>
      {/* Glow decoration */}
      <Box sx={{ position: "absolute", top: -30, right: -30, width: 80, height: 80, borderRadius: "50%", background: `${color}08`, pointerEvents: "none" }} />
    </Glass>
  );
};

// ============================================================
// RING GAUGE (RADIAL PROGRESS)
// ============================================================

const RingGauge = ({ value, max, color, label, size = 100 }) => {
  const { colors: C } = useThemeMode();
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const animPct = useAnimatedCounter(pct);
  const data = [{ value: pct, fill: color }];

  return (
    <Box sx={{ textAlign: "center" }}>
      <Box sx={{ width: size, height: size, mx: "auto", position: "relative" }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="72%" outerRadius="100%"
            startAngle={90} endAngle={-270}
            data={data}
            barSize={8}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              background={{ fill: C.white08 }}
              isAnimationActive={false}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography sx={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: FF }}>{animPct}%</Typography>
        </Box>
      </Box>
      <Typography sx={{ fontSize: 11, fontWeight: 600, color: C.textSec, mt: 1, fontFamily: FF }}>{label}</Typography>
    </Box>
  );
};

// ============================================================
// CUSTOM CHART TOOLTIP
// ============================================================

const ChartTip = ({ active, payload, label }) => {
  const { colors: C } = useThemeMode();
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{
      p: 1.5,
      bgcolor: C.chartTooltipBg,
      border: `1px solid ${C.chartTooltipBorder}`,
      borderRadius: '8px',
      boxShadow: C.shadowCard,
      color: C.chartTooltipText,
      fontFamily: FF,
    }}>
      {label && <Typography sx={{ fontSize: 11, color: C.textMuted, mb: 0.5 }}>{label}</Typography>}
      {payload.map((p, i) => (
        <Typography key={i} sx={{ fontSize: 12, fontWeight: 700, color: p.color || C.text }}>
          {p.name}: {p.value}
        </Typography>
      ))}
    </Box>
  );
};

// ============================================================
// SIDEBAR
// ============================================================

const Sidebar = ({ tab, onTab, collapsed, onToggle, stats }) => {
  const { colors: C } = useThemeMode();
  const items = DEPT_KEYS.map((key, i) => ({
    ...DEPT[key],
    index: i,
    badge: i === 1 ? stats.insuranceAgents : i === 2 ? stats.healthAgents : i === 4 ? (TEMPORARY_DC_COUNT_OVERRIDE ?? stats.dcAgents) : null,
  }));

  return (
    <Box
      sx={{
        position: "fixed", left: 0, top: 0, height: "100vh",
        width: collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W,
        background: C.bgSidebar,
        borderRight: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column",
        transition: "width 0.3s cubic-bezier(.4,0,.2,1)",
        zIndex: 1200, overflow: "hidden",
      }}
    >
      {/* Brand */}
      <Box sx={{ height: 68, display: "flex", alignItems: "center", px: "18px", gap: 1.5, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <Box sx={{ width: 36, height: 36, minWidth: 36, borderRadius: "10px", background: DEPT.home.gradient, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(99,102,241,0.35)" }}>
          <Bolt sx={{ fontSize: 20, color: "white" }} />
        </Box>
        {!collapsed && (
          <Typography sx={{ fontSize: 17, fontWeight: 800, color: C.text, fontFamily: FF, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
            M-Swasth
          </Typography>
        )}
      </Box>

      {/* Nav */}
      <Box sx={{ flex: 1, py: 1.5, overflowY: "auto", overflowX: "hidden", "&::-webkit-scrollbar": { width: 0 } }}>
        {items.map((item) => {
          const active = tab === item.index;
          return (
            <Tooltip key={item.index} title={collapsed ? item.label : ""} placement="right" arrow>
              <Box
                onClick={() => onTab(null, item.index)}
                sx={{
                  display: "flex", alignItems: "center", gap: 1.5,
                  py: "10px", px: collapsed ? "18px" : "18px",
                  mx: "8px", my: "2px", borderRadius: "10px",
                  cursor: "pointer",
                  color: active ? "white" : C.textSec,
                  bgcolor: active ? `${item.accent}18` : "transparent",
                  borderLeft: active ? `3px solid ${item.color}` : "3px solid transparent",
                  transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease',
                  "&:hover": { bgcolor: active ? `${item.accent}18` : C.white04, color: active ? "white" : C.text },
                }}
              >
                <item.Icon sx={{ fontSize: 19, flexShrink: 0 }} />
                {!collapsed && (
                  <>
                    <Typography sx={{ fontSize: 13, fontWeight: active ? 700 : 500, fontFamily: FF, whiteSpace: "nowrap", flex: 1 }}>
                      {item.label}
                    </Typography>
                    {item.badge != null && (
                      <Box sx={{ minWidth: 22, height: 20, borderRadius: "6px", bgcolor: `${item.color}20`, color: item.color, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", px: 0.5, fontFamily: FF }}>
                        {item.badge}
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      {/* Collapse */}
      <Box sx={{ p: 1.5, borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        <Box
          onClick={onToggle}
          sx={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 1,
            py: 1, borderRadius: "10px", cursor: "pointer", color: C.textMuted,
            bgcolor: C.white04, border: `1px solid ${C.border}`,
            transition: 'background-color 0.2s ease, color 0.2s ease', "&:hover": { color: C.textSec, bgcolor: C.white08 },
          }}
        >
          {collapsed ? <ChevronRight sx={{ fontSize: 17 }} /> : <><ChevronLeft sx={{ fontSize: 17 }} /><Typography sx={{ fontSize: 11, fontWeight: 500, fontFamily: FF }}>Collapse</Typography></>}
        </Box>
      </Box>
    </Box>
  );
};

// ============================================================
// HEADER
// ============================================================

const Header = ({ title, sub, onRefresh, refreshing, fullscreen, onFullscreen, mobile, onMenu }) => {
  const { colors: C, mode, toggleMode } = useThemeMode();
  return (
    <Box sx={{
      height: 64, bgcolor: C.bg, borderBottom: `1px solid ${C.border}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      px: { xs: 2, md: 3 }, position: "sticky", top: 0, zIndex: 1100, flexShrink: 0,
    }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        {mobile && <IconButton onClick={onMenu} size="small" sx={{ color: C.textSec }}><MenuIcon /></IconButton>}
        <Box>
          <Typography sx={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: FF, lineHeight: 1.2, letterSpacing: "-0.02em" }}>{title}</Typography>
          <Typography sx={{ fontSize: 12, color: C.textMuted, fontFamily: FF }}>{sub}</Typography>
        </Box>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Tooltip title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}>
          <IconButton size="small" onClick={toggleMode} sx={{ color: C.textSec, "&:hover": { bgcolor: C.white08 } }}>
            {mode === "dark" ? <LightMode sx={{ fontSize: 19 }} /> : <DarkMode sx={{ fontSize: 19 }} />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Refresh">
          <IconButton size="small" onClick={onRefresh} sx={{ color: C.textSec, "&:hover": { bgcolor: C.white08 } }}>
            <Refresh sx={{ fontSize: 19, animation: refreshing ? "spin 1s linear infinite" : "none", "@keyframes spin": { "100%": { transform: "rotate(360deg)" } } }} />
          </IconButton>
        </Tooltip>
        {!mobile && (
          <Tooltip title={fullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            <IconButton size="small" onClick={onFullscreen} sx={{ color: C.textSec, "&:hover": { bgcolor: C.white08 } }}>
              {fullscreen ? <FullscreenExit sx={{ fontSize: 19 }} /> : <Fullscreen sx={{ fontSize: 19 }} />}
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Notifications">
          <IconButton size="small" sx={{ color: C.textSec, "&:hover": { bgcolor: C.white08 } }}>
            <Badge badgeContent={3} color="error" sx={{ "& .MuiBadge-badge": { fontSize: 9, height: 15, minWidth: 15, bgcolor: C.roseDark } }}>
              <Notifications sx={{ fontSize: 19 }} />
            </Badge>
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

// ============================================================
// TAB PANEL
// ============================================================

const TabPanel = ({ children, value, index }) => (
  value === index ? <Box className={styles.tabContent}>{children}</Box> : null
);

// ============================================================
// OVERVIEW TAB - THE HEART OF THE DASHBOARD
// ============================================================

const OverviewTab = ({ stats, onNav }) => {
  const { colors: C } = useThemeMode();
  const dc = TEMPORARY_DC_COUNT_OVERRIDE ?? stats.dcAgents;
  const total = stats.totalAgents;
  const healthPct = total > 0 ? Math.round((stats.healthAgents / total) * 100) : 0;
  const insPct = total > 0 ? Math.round((stats.insuranceAgents / total) * 100) : 0;
  const dcPct = total > 0 ? Math.round((dc / total) * 100) : 0;

  // Simulated hourly activity data
  const hourlyData = useMemo(() => {
    const hours = [];
    for (let i = 0; i < 12; i++) {
      const t = 8 + i;
      const wave = Math.sin((Math.PI * i) / 11);
      hours.push({
        time: `${t > 12 ? t - 12 : t}${t >= 12 ? "pm" : "am"}`,
        Health: Math.round(stats.healthAgents * (0.15 + 0.85 * wave)),
        Insurance: Math.round(stats.insuranceAgents * (0.2 + 0.8 * Math.sin((Math.PI * (i + 1)) / 12))),
        DC: Math.round(dc * (0.1 + 0.9 * Math.sin((Math.PI * (i + 2)) / 13))),
      });
    }
    return hours;
  }, [stats.healthAgents, stats.insuranceAgents, dc]);

  // Donut data
  const donutData = useMemo(() => [
    { name: "Health", value: stats.healthAgents, color: C.emerald },
    { name: "Insurance", value: stats.insuranceAgents, color: C.purple },
    { name: "DC Agents", value: dc, color: C.cyan },
  ], [stats.healthAgents, stats.insuranceAgents, dc]);

  // Department bar data
  const barData = useMemo(() => [
    { name: "Health", agents: stats.healthAgents, fill: C.emeraldDark },
    { name: "Insurance", agents: stats.insuranceAgents, fill: "#8b5cf6" },
    { name: "DC Field", agents: dc, fill: C.cyanDark },
    { name: "Managers", agents: stats.totalManagers, fill: C.amberDark },
  ], [stats.healthAgents, stats.insuranceAgents, dc, stats.totalManagers]);

  const deptCards = [
    { key: "insurance", tab: 1, count: stats.insuranceAgents, label: "Insurance", sub: "Agent performance & calls" },
    { key: "health", tab: 2, count: stats.healthAgents, label: "Health", sub: "Team monitoring & reviews" },
    { key: "analytics", tab: 3, count: stats.totalCalls || 0, label: "Call Analytics", sub: "Call data & insights" },
    { key: "offline", tab: 4, count: dc, label: "DC & Visits", sub: "Field activity tracking" },
  ];

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      {/* ──── HERO METRICS ──── */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(5, 1fr)" }, gap: 2, mb: 3 }}>
        <Metric label="Total Workforce" value={total} color={C.indigo} icon={<Groups />} animClass={styles.animateIn} />
        <Metric label="Active Now" value={stats.activeUsers} color={C.emerald} icon={<FiberManualRecord />} trend={12} animClass={styles.animateIn1} />
        <Metric label="Health Dept" value={stats.healthAgents} color={C.emeraldDark} icon={<LocalHospital />} animClass={styles.animateIn2} />
        <Metric label="Insurance Dept" value={stats.insuranceAgents} color="#8b5cf6" icon={<Shield />} animClass={styles.animateIn3} />
        <Metric label="DC Agents" value={dc} color={C.cyanDark} icon={<Route />} animClass={styles.animateIn4} />
      </Box>

      {/* ──── ANALYTICS ROW 1: Donut + Activity Area ──── */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1.6fr" }, gap: 2.5, mb: 3 }}>
        {/* Donut */}
        <Glass className={styles.animateIn2} sx={{ p: 3 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: C.text, mb: 0.5, fontFamily: FF }}>Department Split</Typography>
          <Typography sx={{ fontSize: 12, color: C.textMuted, mb: 2, fontFamily: FF }}>Workforce composition</Typography>

          <Box sx={{ height: 220, position: "relative" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius="60%" outerRadius={88} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {donutData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <RechartsTooltip content={<ChartTip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <Typography sx={{ fontSize: 26, fontWeight: 800, color: C.text, fontFamily: FF, lineHeight: 1 }}>{total}</Typography>
              <Typography sx={{ fontSize: 11, color: C.textMuted, fontFamily: FF }}>Total</Typography>
            </Box>
          </Box>

          {/* Legend */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2, mt: 1 }}>
            {donutData.map((d) => (
              <Box key={d.name} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: "3px", bgcolor: d.color, flexShrink: 0 }} />
                <Typography sx={{ fontSize: 12, color: C.textSec, fontFamily: FF, flex: 1 }}>{d.name}</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: FF }}>{d.value}</Typography>
                <Typography sx={{ fontSize: 11, color: C.textMuted, fontFamily: FF, minWidth: 30, textAlign: "right" }}>
                  {total > 0 ? Math.round((d.value / total) * 100) : 0}%
                </Typography>
              </Box>
            ))}
          </Box>
        </Glass>

        {/* Activity Area Chart */}
        <Glass className={styles.animateIn3} sx={{ p: 3 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: C.text, mb: 0.5, fontFamily: FF }}>Activity Pulse</Typography>
          <Typography sx={{ fontSize: 12, color: C.textMuted, mb: 2, fontFamily: FF }}>Estimated agent activity throughout the day</Typography>

          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gHealth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.emerald} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.emerald} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gInsurance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.purple} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.purple} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gDC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.cyan} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.cyan} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.chartGrid || C.white04} vertical={false} />
                <XAxis dataKey="time" tick={{ fill: C.chartTick || C.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.chartTick || C.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="Health" stroke={C.emerald} fill="url(#gHealth)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="Insurance" stroke={C.purple} fill="url(#gInsurance)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="DC" stroke={C.cyan} fill="url(#gDC)" strokeWidth={2} dot={false} />
                <Legend
                  wrapperStyle={{ paddingTop: 12 }}
                  formatter={(val) => <span style={{ color: C.textSec, fontSize: 12, fontFamily: FF }}>{val}</span>}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Glass>
      </Box>

      {/* ──── ANALYTICS ROW 2: Gauges + Bar Chart ──── */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1.6fr" }, gap: 2.5, mb: 3 }}>
        {/* Ring Gauges */}
        <Glass className={styles.animateIn3} sx={{ p: 3 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: C.text, mb: 0.5, fontFamily: FF }}>Performance Rings</Typography>
          <Typography sx={{ fontSize: 12, color: C.textMuted, mb: 3, fontFamily: FF }}>Key operational rates</Typography>

          <Box sx={{ display: "flex", justifyContent: "space-around", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <RingGauge value={stats.activeUsers} max={total} color={C.emerald} label="Active Rate" size={110} />
            <RingGauge value={stats.healthAgents} max={total} color={C.emeraldDark} label="Health Load" size={110} />
            <RingGauge value={stats.insuranceAgents} max={total} color="#8b5cf6" label="Insurance Load" size={110} />
          </Box>

          {/* Summary stats below rings */}
          <Box sx={{ display: "flex", justifyContent: "space-around", mt: 3, pt: 2, borderTop: `1px solid ${C.border}` }}>
            {[
              { label: "Active", value: stats.activeUsers, color: C.emerald },
              { label: "Total", value: total, color: C.indigo },
              { label: "Mgrs", value: stats.totalManagers, color: C.amber },
            ].map((s) => (
              <Box key={s.label} sx={{ textAlign: "center" }}>
                <Typography sx={{ fontSize: 20, fontWeight: 800, color: s.color, fontFamily: FF }}>{s.value}</Typography>
                <Typography sx={{ fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: FF }}>{s.label}</Typography>
              </Box>
            ))}
          </Box>
        </Glass>

        {/* Horizontal Bar Chart */}
        <Glass className={styles.animateIn4} sx={{ p: 3 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: C.text, mb: 0.5, fontFamily: FF }}>Workforce Breakdown</Typography>
          <Typography sx={{ fontSize: 12, color: C.textMuted, mb: 2, fontFamily: FF }}>Agent count by department</Typography>

          <Box sx={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.chartGrid || C.white04} vertical={false} />
                <XAxis type="number" tick={{ fill: C.chartTick || C.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: C.chartTick || C.textSec, fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} width={75} />
                <RechartsTooltip content={<ChartTip />} />
                <Bar dataKey="agents" radius={[0, 6, 6, 0]} barSize={22}>
                  {barData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>

          {/* Total bar at bottom */}
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${C.border}` }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography sx={{ fontSize: 12, color: C.textSec, fontFamily: FF }}>Total workforce capacity</Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: FF }}>{total}</Typography>
            </Box>
            <Box sx={{ height: 6, borderRadius: 3, bgcolor: C.white08, overflow: "hidden", display: "flex" }}>
              <Box sx={{ width: `${healthPct}%`, bgcolor: C.emeraldDark, transition: "width 1s ease" }} />
              <Box sx={{ width: `${insPct}%`, bgcolor: "#8b5cf6", transition: "width 1s ease" }} />
              <Box sx={{ width: `${dcPct}%`, bgcolor: C.cyanDark, transition: "width 1s ease" }} />
            </Box>
          </Box>
        </Glass>
      </Box>

      {/* ──── DEPARTMENT NAVIGATION ──── */}
      <Typography className={styles.animateIn4} sx={{ fontSize: 15, fontWeight: 700, color: C.text, mb: 2, fontFamily: FF, display: "flex", alignItems: "center", gap: 1.5, "&::before": { content: '""', width: 3, height: 16, borderRadius: 2, bgcolor: C.indigoVivid, display: "block" } }}>
        Departments
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 2 }} className={styles.animateIn5}>
        {deptCards.map((d) => {
          const cfg = DEPT[d.key];
          return (
            <Glass
              key={d.key}
              onClick={() => onNav(null, d.tab)}
              sx={{
                p: "22px", cursor: "pointer",
                borderLeft: `3px solid ${cfg.color}`,
                "&:hover": { background: `${cfg.accent}08`, borderColor: cfg.color, transform: "translateY(-2px)" },
                "&:hover .deptArrow": { opacity: 1, transform: "translateX(0)" },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: "12px", background: `${cfg.accent}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <cfg.Icon sx={{ fontSize: 22, color: cfg.color }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: FF }}>{d.label}</Typography>
                  <Typography sx={{ fontSize: 11, color: C.textMuted, fontFamily: FF }}>{d.sub}</Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography sx={{ fontSize: 20, fontWeight: 800, color: cfg.color, fontFamily: FF, lineHeight: 1 }}>{d.count}</Typography>
                </Box>
                <ArrowForward className="deptArrow" sx={{ fontSize: 16, color: cfg.color, opacity: 0, transform: "translateX(-4px)", transition: "opacity 0.3s ease, transform 0.3s ease" }} />
              </Box>
            </Glass>
          );
        })}
      </Box>
    </Box>
  );
};

// ============================================================
// MAIN DASHBOARD COMPONENT
// ============================================================

function ManagerDashboardContent({ currentUser }) {
  const { colors: C, mode } = useThemeMode();
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState({ 0: true });
  const [tabLoading, setTabLoading] = useState({});
  const [dataCache, setDataCache] = useState({ offlineVisits: { data: null, lastFetched: null }, callLogs: { data: null, lastFetched: null } });

  const [quickStats, setQuickStats] = useState({
    totalAgents: 0, totalCalls: 0, connectedCalls: 0, activeUsers: 0,
    healthAgents: 0, insuranceAgents: 0, dcAgents: 0, totalManagers: 0,
  });
  const [offlineVisitsData, setOfflineVisitsData] = useState({ users: [], visitLogs: [], manualCallLogs: [], trips: [] });

  const titles = useMemo(() => [
    { t: "Command Center", s: "Real-time monitoring & analytics" },
    { t: "Insurance Department", s: "Agent performance & call metrics" },
    { t: "Health Department", s: "Team monitoring & reviews" },
    { t: "Call Analytics", s: "Comprehensive call data & insights" },
    { t: "DC & Offline Visits", s: "Field agent activity & visit tracking" },
  ], []);

  // ── Handlers ──

  const handleTabChange = useCallback((_, v) => {
    setSelectedTab(v);
    setSearchParams({ tab: v.toString() });
    setMobileMenuOpen(false);
    if (!loadedTabs[v]) setLoadedTabs((p) => ({ ...p, [v]: true }));
  }, [loadedTabs, setSearchParams]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); setIsFullscreen(true); }
    else { document.exitFullscreen(); setIsFullscreen(false); }
  }, []);

  // ── Data Fetching ──

  const fetchQuickStats = useCallback(async () => {
    try {
      const [hA, hT, iA, iT, dcA, mgr] = await Promise.all([
        getDocs(collection(db, "healthAgents")),
        getDocs(collection(db, "healthTeamLeads")),
        getDocs(collection(db, "insuranceAgents")),
        getDocs(collection(db, "insuranceTeamLeads")),
        getDocs(collection(db, "offlineVisits")),
        getDocs(collection(db, "managers")),
      ]);
      const hCnt = hA.size + hT.size, iCnt = iA.size + iT.size, dCnt = dcA.size, mCnt = mgr.size;
      let active = 0;
      [hA, hT, iA, iT, dcA].forEach((s) => s.docs.forEach((d) => {
        const st = d.data().status;
        if (["Available", "On Call", "Login", "active", "Idle", "Busy"].includes(st)) active++;
      }));
      setQuickStats((p) => ({ ...p, totalAgents: hCnt + iCnt + dCnt, healthAgents: hCnt, insuranceAgents: iCnt, dcAgents: dCnt, totalManagers: mCnt, activeUsers: active }));
    } catch (e) { console.error("Error fetching quick stats:", e); }
  }, []);

  const fetchOfflineVisitsData = useCallback(async (force = false) => {
    const age = dataCache.offlineVisits.lastFetched ? Date.now() - dataCache.offlineVisits.lastFetched : Infinity;
    if (!force && age < 300000 && dataCache.offlineVisits.data) return dataCache.offlineVisits.data;
    setTabLoading((p) => ({ ...p, 4: true }));
    try {
      const snap = await getDocs(collection(db, "offlineVisits"));
      const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const [vR, mR, tR] = await Promise.all([
        Promise.all(users.map(async (u) => { const s = await getDocs(query(collection(db, "offlineVisits", u.id, "visitLogs"), orderBy("createdAt", "desc"), limit(50))); return s.docs.map((d) => ({ id: d.id, visitorId: u.id, visitorName: u.name, visitorEmpId: u.empId, ...d.data() })); })),
        Promise.all(users.map(async (u) => { const s = await getDocs(query(collection(db, "offlineVisits", u.id, "manualCallLogs"), orderBy("timestamp", "desc"), limit(50))); return s.docs.map((d) => ({ id: d.id, userId: u.id, userName: u.name, userEmpId: u.empId, ...d.data() })); })),
        Promise.all(users.map(async (u) => { const s = await getDocs(query(collection(db, "offlineVisits", u.id, "trips"), orderBy("startTime", "desc"), limit(20))); return s.docs.map((d) => ({ id: d.id, userId: u.id, userName: u.name, userEmpId: u.empId, ...d.data() })); })),
      ]);
      const data = {
        users,
        visitLogs: [...new Map(vR.flat().map((i) => [i.id, i])).values()],
        manualCallLogs: [...new Map(mR.flat().map((i) => [i.id, i])).values()],
        trips: [...new Map(tR.flat().map((i) => [i.id, i])).values()],
      };
      setDataCache((p) => ({ ...p, offlineVisits: { data, lastFetched: Date.now() } }));
      setOfflineVisitsData(data);
      setTabLoading((p) => ({ ...p, 4: false }));
      return data;
    } catch (e) { console.error(e); setTabLoading((p) => ({ ...p, 4: false })); return null; }
  }, [dataCache.offlineVisits]);

  const fetchCallLogsData = useCallback(async (force = false) => {
    const age = dataCache.callLogs.lastFetched ? Date.now() - dataCache.callLogs.lastFetched : Infinity;
    if (!force && age < 300000 && dataCache.callLogs.data) return dataCache.callLogs.data;
    setTabLoading((p) => ({ ...p, 3: true }));
    try {
      const cols = ["insuranceAgents", "healthAgents", "insuranceTeamLeads", "healthTeamLeads"];
      const logs = [], agents = [];
      await Promise.all(cols.map(async (cn) => {
        const aSnap = await getDocs(collection(db, cn));
        await Promise.all(aSnap.docs.map(async (ad) => {
          const aData = ad.data(), aId = ad.id;
          agents.push({ id: aId, collection: cn, name: aData.name || "Unknown", department: aData.department || cn, designation: aData.designation || "" });
          const lSnap = await getDocs(query(collection(db, cn, aId, "callLogs"), orderBy("timestamp", "desc"), limit(100)));
          lSnap.docs.forEach((ld) => { const d = ld.data(); logs.push({ id: ld.id, ...d, timestamp: d.timestamp?.toDate?.() || new Date(d.timestamp), agentId: aId, agentName: aData.name, agentDesignation: aData.designation || "", collectionName: cn }); });
        }));
      }));
      const uLogs = [...new Map(logs.map((i) => [i.id, i])).values()];
      const uAgents = [...new Map(agents.map((i) => [i.id, i])).values()];
      setDataCache((p) => ({ ...p, callLogs: { data: { logs: uLogs, agents: uAgents }, lastFetched: Date.now() } }));
      setAllCallLogs(uLogs); setAllAgents(uAgents);
      setTabLoading((p) => ({ ...p, 3: false }));
      return { logs: uLogs, agents: uAgents };
    } catch (e) { console.error(e); setTabLoading((p) => ({ ...p, 3: false })); return null; }
  }, [dataCache.callLogs]);

  // ── Effects ──

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t !== null) { const i = parseInt(t, 10); if (!isNaN(i) && i !== selectedTab) setSelectedTab(i); }
  }, [searchParams, selectedTab]);

  useEffect(() => {
    let m = true;
    if (!currentUser?.uid) { setLoading(false); return; }
    (async () => {
      try {
        setLoading(true);
        const ud = await getDoc(doc(db, "admin", currentUser.uid));
        if (!m) return;
        if (ud.exists() && ud.data().role === "manager") {
          await fetchQuickStats();
          if (initialTab === 3) { await fetchCallLogsData(); setLoadedTabs((p) => ({ ...p, 3: true })); }
          else if (initialTab === 4) { await fetchOfflineVisitsData(); setLoadedTabs((p) => ({ ...p, 4: true })); }
          setLoading(false);
        } else setLoading(false);
      } catch (e) { console.error(e); if (m) setLoading(false); }
    })();
    return () => { m = false; };
  }, [currentUser, initialTab, fetchQuickStats, fetchCallLogsData, fetchOfflineVisitsData]);

  useEffect(() => {
    if (selectedTab === 3 && !dataCache.callLogs.data) fetchCallLogsData();
    if (selectedTab === 4 && !dataCache.offlineVisits.data) fetchOfflineVisitsData();
  }, [selectedTab, dataCache.callLogs.data, dataCache.offlineVisits.data, fetchCallLogsData, fetchOfflineVisitsData]);

  useEffect(() => {
    if (allCallLogs.length > 0) setQuickStats((p) => ({ ...p, totalCalls: allCallLogs.length, connectedCalls: allCallLogs.filter((l) => l.callConnected || l.status === "completed").length }));
  }, [allCallLogs]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await fetchQuickStats(); if (selectedTab === 3) await fetchCallLogsData(true); else if (selectedTab === 4) await fetchOfflineVisitsData(true); } catch (e) { console.error(e); }
    setTimeout(() => setRefreshing(false), 500);
  }, [selectedTab, fetchQuickStats, fetchCallLogsData, fetchOfflineVisitsData]);

  // ── Render ──

  if (loading) {
    return (
      <Box sx={{
        minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: `radial-gradient(ellipse at 30% 20%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(6,182,212,0.1) 0%, transparent 50%), ${C.bg}`,
      }}>
        <Box className={styles.pulse} sx={{ width: 72, height: 72, borderRadius: 3, bgcolor: C.bgElevated || C.white08, display: "flex", alignItems: "center", justifyContent: "center", mb: 3, border: `1px solid ${C.border}` }}>
          <Bolt sx={{ color: C.indigo, fontSize: 36 }} />
        </Box>
        <Typography sx={{ color: C.text, fontWeight: 800, fontSize: 20, mb: 0.5, fontFamily: FF }}>Super Manager Dashboard</Typography>
        <Typography sx={{ color: C.textMuted, mb: 4, fontSize: 13, fontFamily: FF }}>Initializing command center...</Typography>
        <Box sx={{ width: 180, height: 3, borderRadius: 2, bgcolor: C.white08, overflow: "hidden" }}>
          <Box className={styles.shimmer} sx={{ width: "35%", height: "100%", borderRadius: 2, bgcolor: C.indigo }} />
        </Box>
      </Box>
    );
  }

  const hdr = titles[selectedTab] || titles[0];

  return (
    <Box data-theme={mode} sx={{
      display: "flex", minHeight: "100vh", fontFamily: FF,
      background: C.isDark
        ? `radial-gradient(ellipse at 20% 10%, rgba(99,102,241,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 90%, rgba(6,182,212,0.04) 0%, transparent 50%), ${C.bg}`
        : C.bg,
      transition: "background 0.3s ease",
    }}>
      {/* Sidebar */}
      {!isMobile && <Sidebar tab={selectedTab} onTab={handleTabChange} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((p) => !p)} stats={quickStats} />}

      {/* Main */}
      <Box sx={{ flexGrow: 1, ml: isMobile ? 0 : `${sidebarCollapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W}px`, transition: "margin-left 0.3s cubic-bezier(.4,0,.2,1)", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Header title={hdr.t} sub={hdr.s} onRefresh={handleRefresh} refreshing={refreshing} fullscreen={isFullscreen} onFullscreen={toggleFullscreen} mobile={isMobile} onMenu={() => setMobileMenuOpen(true)} />
        {refreshing && <LinearProgress sx={{ height: 2, bgcolor: "transparent", "& .MuiLinearProgress-bar": { bgcolor: C.indigoVivid } }} />}

        {/* Mobile tabs */}
        {isMobile && (
          <Box sx={{ bgcolor: C.bg, borderBottom: `1px solid ${C.border}` }}>
            <Tabs value={selectedTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" sx={{
              minHeight: 44,
              "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: 12, minHeight: 44, color: C.textMuted, fontFamily: FF, "&.Mui-selected": { color: DEPT[DEPT_KEYS[selectedTab]]?.color || C.indigo } },
              "& .MuiTabs-indicator": { bgcolor: DEPT[DEPT_KEYS[selectedTab]]?.color || C.indigo, height: 2 },
            }}>
              {DEPT_KEYS.map((k) => { const d = DEPT[k]; return <Tab key={k} icon={<d.Icon sx={{ fontSize: 16 }} />} iconPosition="start" label={d.label} />; })}
            </Tabs>
          </Box>
        )}

        {/* Content */}
        <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, overflowY: "auto" }}>
          <TabPanel value={selectedTab} index={0}><OverviewTab stats={quickStats} onNav={handleTabChange} /></TabPanel>
          <TabPanel value={selectedTab} index={1}>{loadedTabs[1] ? <InsuranceManagerDashboard currentUser={currentUser} /> : <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress sx={{ color: C.purple }} /></Box>}</TabPanel>
          <TabPanel value={selectedTab} index={2}>{loadedTabs[2] ? <HealthManagerDashboard currentUser={currentUser} /> : <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress sx={{ color: C.emerald }} /></Box>}</TabPanel>
          <TabPanel value={selectedTab} index={3}>{tabLoading[3] ? <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8 }}><CircularProgress sx={{ mb: 2, color: C.amber }} /><Typography sx={{ color: C.textSec }}>Loading call analytics...</Typography></Box> : <CallAnalytics callLogs={allCallLogs} agents={allAgents} onBack={() => setSelectedTab(0)} offlineVisitsData={offlineVisitsData} />}</TabPanel>
          <TabPanel value={selectedTab} index={4}>{tabLoading[4] ? <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8 }}><CircularProgress sx={{ mb: 2, color: C.cyan }} /><Typography sx={{ color: C.textSec }}>Loading offline visits data...</Typography></Box> : <OfflineVisitsManager offlineVisitsData={offlineVisitsData} />}</TabPanel>
        </Box>
      </Box>

      {/* Mobile Drawer */}
      <Drawer anchor="left" open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} PaperProps={{ sx: { width: 280, borderRadius: "0 16px 16px 0", bgcolor: C.bgSidebar, border: "none" } }}>
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ width: 34, height: 34, borderRadius: 2, background: DEPT.home.gradient, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bolt sx={{ color: "white", fontSize: 18 }} />
              </Box>
              <Typography sx={{ color: C.text, fontWeight: 800, fontSize: 16, fontFamily: FF }}>M-Swasth</Typography>
            </Box>
            <IconButton onClick={() => setMobileMenuOpen(false)} sx={{ color: C.textMuted }}><Close /></IconButton>
          </Box>
          <Divider sx={{ borderColor: C.border, mb: 2 }} />
          <List>
            {DEPT_KEYS.map((k, i) => {
              const d = DEPT[k]; const on = selectedTab === i;
              return (
                <ListItem key={k} onClick={() => handleTabChange(null, i)} sx={{ borderRadius: 2, mb: 0.5, cursor: "pointer", bgcolor: on ? `${d.accent}18` : "transparent", "&:hover": { bgcolor: on ? `${d.accent}18` : C.white04 } }}>
                  <ListItemIcon sx={{ minWidth: 36, color: on ? "white" : C.textSec }}><d.Icon sx={{ fontSize: 19 }} /></ListItemIcon>
                  <ListItemText primary={d.label} primaryTypographyProps={{ sx: { color: on ? "white" : C.textSec, fontWeight: on ? 700 : 400, fontSize: 13, fontFamily: FF } }} />
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
}

function ManagerDashboard({ currentUser }) {
  return (
    <ManagerThemeProvider>
      <ManagerDashboardContent currentUser={currentUser} />
    </ManagerThemeProvider>
  );
}

export default ManagerDashboard;
