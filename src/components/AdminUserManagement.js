import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  Tooltip,
  InputAdornment,
  Grid,
  CircularProgress,
  TablePagination,
  Avatar,
  Tabs,
  Tab,
  Collapse,
} from "@mui/material";
import {
  Edit,
  Delete,
  Visibility,
  Search,
  Refresh,
  People,
  PersonAdd,
  LocalHospital,
  Shield,
  DirectionsWalk,
  SupervisorAccount,
  CheckCircle,
  Cancel,
  Email,
  Phone,
  Lock,
  Badge as BadgeIcon,
  Business,
  FilterList,
  ExpandMore,
  ExpandLess,
  Warning,
} from "@mui/icons-material";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, functions, auth } from "../firebaseConfig";
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
import { fadeInDown } from "../styles/adminStyles";
import { keyframes } from "@mui/system";

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// User Card Component for Grid View
const UserCard = ({ user, onView, onEdit, onDelete }) => {
  const getDeptColor = (dept) => {
    switch (dept) {
      case "Health": return colors.accent.secondary;
      case "Insurance": return colors.accent.purple;
      case "Offline Visits": return colors.accent.cyan;
      default: return colors.accent.primary;
    }
  };

  const deptColor = getDeptColor(user.department);

  return (
    <GlassCard sx={{ height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Avatar
          sx={{
            width: 48,
            height: 48,
            mr: 2,
            bgcolor: `${deptColor}20`,
            color: deptColor,
            fontWeight: 600,
          }}
        >
          {user.name?.charAt(0) || "U"}
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colors.text.primary }} noWrap>
            {user.name}
          </Typography>
          <Typography variant="caption" sx={{ color: colors.text.muted }} noWrap>
            {user.empId || user.id}
          </Typography>
        </Box>
        <Chip
          label={user.status === "active" ? "Active" : "Inactive"}
          size="small"
          sx={{
            backgroundColor: user.status === "active" ? colors.accent.primaryLight : colors.accent.errorLight,
            color: user.status === "active" ? colors.accent.primary : colors.accent.error,
            fontWeight: 600,
            fontSize: "0.65rem",
            height: 22,
          }}
        />
      </Box>

      <Box sx={{ borderTop: `1px solid ${colors.border.subtle}`, pt: 2, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Email sx={{ fontSize: 14, color: colors.text.muted, mr: 1 }} />
          <Typography variant="caption" sx={{ color: colors.text.secondary }} noWrap>
            {user.email}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Phone sx={{ fontSize: 14, color: colors.text.muted, mr: 1 }} />
          <Typography variant="caption" sx={{ color: colors.text.secondary }}>
            {user.mobile || "N/A"}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
        <Chip
          label={user.role}
          size="small"
          sx={{
            backgroundColor: "rgba(255,255,255,0.1)",
            color: colors.text.secondary,
            fontSize: "0.7rem",
          }}
        />
        <Chip
          label={user.department}
          size="small"
          sx={{
            backgroundColor: `${deptColor}20`,
            color: deptColor,
            fontSize: "0.7rem",
          }}
        />
      </Box>

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5, borderTop: `1px solid ${colors.border.subtle}`, pt: 2 }}>
        <Tooltip title="View Details">
          <IconButton size="small" onClick={() => onView(user)} sx={{ color: colors.text.muted, "&:hover": { color: colors.text.primary } }}>
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit User">
          <IconButton size="small" onClick={() => onEdit(user)} sx={{ color: colors.accent.primary, "&:hover": { backgroundColor: colors.accent.primaryLight } }}>
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete User">
          <IconButton size="small" onClick={() => onDelete(user)} sx={{ color: colors.accent.error, "&:hover": { backgroundColor: colors.accent.errorLight } }}>
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </GlassCard>
  );
};

// Custom Tooltip for Charts
const CustomChartTooltip = ({ active, payload }) => {
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
          {payload[0].name || payload[0].payload.name}
        </Typography>
        <Typography variant="caption" sx={{ color: colors.text.secondary }}>
          {payload[0].value || payload[0].payload.count} users
        </Typography>
      </Box>
    );
  }
  return null;
};

function UserManagement({ triggerAddUser, onAddUserTriggered }) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState("table");
  const [showFilters, setShowFilters] = useState(true);
  const [teamLeadsList, setTeamLeadsList] = useState([]);
  const [managersList, setManagersList] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, health: 0, insurance: 0, dc: 0, managers: 0 });
  const [departmentChartData, setDepartmentChartData] = useState([]);
  const [roleChartData, setRoleChartData] = useState([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    name: "", email: "", mobile: "", empId: "", role: "", department: "", designation: "", status: "active", teamLead: "", teamLeadId: "", manager: "", managerId: "",
  });

  useEffect(() => { fetchAllUsers(); }, []);
  useEffect(() => { applyFilters(); }, [users, searchQuery, filterDepartment, filterRole, filterStatus]);
  useEffect(() => {
    if (triggerAddUser) {
      setOpenAddDialog(true);
      if (onAddUserTriggered) onAddUserTriggered();
    }
  }, [triggerAddUser, onAddUserTriggered]);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const allUsers = [];
      const teamLeads = [];
      const managers = [];

      const collections = [
        { name: "healthAgents", role: "Health Agent", department: "Health" },
        { name: "healthTeamLeads", role: "Health TL", department: "Health" },
        { name: "insuranceAgents", role: "Insurance Agent", department: "Insurance" },
        { name: "insuranceTeamLeads", role: "Insurance TL", department: "Insurance" },
        { name: "offlineVisits", role: "DC Agent", department: "Offline Visits" },
        { name: "managers", role: "Manager", department: "Management" },
      ];

      for (const coll of collections) {
        const snapshot = await getDocs(collection(db, coll.name));
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          let normalizedDepartment = data.department || coll.department;
          if (normalizedDepartment === "offline_visits_dc" || normalizedDepartment === "offline_visits") {
            normalizedDepartment = "Offline Visits";
          }
          const userData = { id: doc.id, ...data, role: data.role || coll.role, department: normalizedDepartment, collectionName: coll.name };
          allUsers.push(userData);
          if (coll.name === "healthTeamLeads" || coll.name === "insuranceTeamLeads") {
            teamLeads.push({ id: doc.id, uid: data.uid || doc.id, name: data.name, department: data.department || coll.department, collectionName: coll.name });
          }
          if (coll.name === "managers") {
            managers.push({ id: doc.id, uid: data.uid || doc.id, name: data.name, department: data.department || "Management", collectionName: coll.name });
          }
        });
      }

      setUsers(allUsers);
      setFilteredUsers(allUsers);
      setTeamLeadsList(teamLeads);
      setManagersList(managers);

      const activeCount = allUsers.filter((u) => u.status === "active" || !u.status).length;
      const healthCount = allUsers.filter((u) => u.department === "Health").length;
      const insuranceCount = allUsers.filter((u) => u.department === "Insurance").length;
      const dcCount = allUsers.filter((u) => u.department === "Offline Visits").length;
      const managersCount = allUsers.filter((u) => u.department === "Management").length;

      setStats({ total: allUsers.length, active: activeCount, inactive: allUsers.length - activeCount, health: healthCount, insurance: insuranceCount, dc: dcCount, managers: managersCount });
      setDepartmentChartData([
        { name: "Health", value: healthCount, fill: colors.accent.secondary },
        { name: "Insurance", value: insuranceCount, fill: colors.accent.purple },
        { name: "DC", value: dcCount, fill: colors.accent.cyan },
        { name: "Management", value: managersCount, fill: colors.accent.primary },
      ]);

      const roleCounts = {};
      allUsers.forEach((u) => { roleCounts[u.role] = (roleCounts[u.role] || 0) + 1; });
      setRoleChartData(Object.entries(roleCounts).map(([role, count]) => ({ name: role.replace(" Agent", "").replace(" TL", " Lead"), count })));
    } catch (error) {
      console.error("Error fetching users:", error);
      setErrorMessage("Failed to fetch users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];
    if (searchQuery) {
      filtered = filtered.filter((user) =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.empId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.mobile?.includes(searchQuery)
      );
    }
    if (filterDepartment !== "all") filtered = filtered.filter((user) => user.department === filterDepartment);
    if (filterRole !== "all") filtered = filtered.filter((user) => user.role === filterRole);
    if (filterStatus !== "all") filtered = filtered.filter((user) => (user.status || "active") === filterStatus);
    setFilteredUsers(filtered);
    setPage(0);
  };

  const handleAddUser = async () => {
    try {
      setErrorMessage("");
      setSuccessMessage("");
      if (!formData.name || !formData.email || !formData.password || !formData.role) {
        setErrorMessage("Please fill in all required fields (name, email, password, role)");
        return;
      }
      const roleToCollectionMap = {
        "Health Agent": "healthAgents", "Insurance Agent": "insuranceAgents", "Health TL": "healthTeamLeads",
        "Insurance TL": "insuranceTeamLeads", "Health Manager": "healthManagers", "Insurance Manager": "insuranceManagers",
        "Department Manager": "managers", "DC Agent": "offlineVisits", "Offline Visits": "offlineVisits",
        "Offline Visits Manager": "offlineVisitsManagers", "Ops Manager": "opsManagers",
      };
      const collectionName = roleToCollectionMap[formData.role];
      if (!collectionName) { setErrorMessage("Invalid role selected"); return; }

      const currentUser = auth.currentUser;
      if (!currentUser) { setErrorMessage("You must be logged in to perform this action"); return; }
      await currentUser.getIdToken(true);

      let teamAgents = [];
      if ((formData.role === "Health TL" || formData.role === "Insurance TL") && formData.teamLeadId) {
        try {
          const sourceTLCollection = formData.role === "Health TL" ? "healthTeamLeads" : "insuranceTeamLeads";
          const sourceTLDoc = await getDoc(doc(db, sourceTLCollection, formData.teamLeadId));
          if (sourceTLDoc.exists()) teamAgents = sourceTLDoc.data().agents || [];
        } catch (err) { console.error("Error fetching source TL agents:", err); }
      }

      const createUserFunction = httpsCallable(functions, 'createUser');
      const result = await createUserFunction({
        name: formData.name, email: formData.email, password: formData.password, mobile: formData.mobile,
        empId: formData.empId, role: formData.role, department: formData.department, status: formData.status || "Available",
        collection: collectionName, teamLead: formData.teamLeadId || "", manager: formData.managerId || "", teamMembers: teamAgents,
      });

      if (teamAgents.length > 0 && result.data && result.data.uid) {
        try {
          await updateDoc(doc(db, collectionName, result.data.uid), { agents: teamAgents, teamLeadId: formData.teamLeadId, teamLeadName: formData.teamLead });
        } catch (err) { console.error("Error updating new TL with agents:", err); }
      }

      setSuccessMessage(`User ${formData.name} created successfully!`);
      setOpenAddDialog(false);
      resetForm();
      fetchAllUsers();
    } catch (error) {
      console.error("Error adding user:", error);
      setErrorMessage(`Failed to add user: ${error.message || error.code}`);
    }
  };

  const handleEditUser = async () => {
    try {
      setErrorMessage("");
      setSuccessMessage("");
      if (!selectedUser) return;

      const userRef = doc(db, selectedUser.collectionName, selectedUser.id);
      const updateData = {
        name: formData.name, email: formData.email, mobile: formData.mobile, department: formData.department,
        designation: formData.designation, status: formData.status, teamLead: formData.teamLead || "",
        teamLeadId: formData.teamLeadId || "", teamLeadName: formData.teamLead || "", manager: formData.manager || "",
        managerId: formData.managerId || "", managerName: formData.manager || "", updatedAt: new Date().toISOString(), updatedBy: "admin",
      };

      const isTL = selectedUser.collectionName === "healthTeamLeads" || selectedUser.collectionName === "insuranceTeamLeads";
      if (isTL && formData.teamLeadId && formData.teamLeadId !== selectedUser.teamLeadId) {
        try {
          const sourceTLDoc = await getDoc(doc(db, selectedUser.collectionName, formData.teamLeadId));
          if (sourceTLDoc.exists()) {
            const teamAgents = sourceTLDoc.data().agents || [];
            if (teamAgents.length > 0) updateData.agents = teamAgents;
          }
        } catch (err) { console.error("Error fetching source TL agents:", err); }
      }

      await updateDoc(userRef, updateData);
      setSuccessMessage(`User ${formData.name} updated successfully!`);
      setOpenEditDialog(false);
      setSelectedUser(null);
      resetForm();
      fetchAllUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      setErrorMessage(`Failed to update user: ${error.message}`);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setErrorMessage("");
      setSuccessMessage("");
      if (!selectedUser) return;
      await deleteDoc(doc(db, selectedUser.collectionName, selectedUser.id));
      setSuccessMessage(`User ${selectedUser.name} deleted successfully!`);
      setOpenDeleteDialog(false);
      setSelectedUser(null);
      fetchAllUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      setErrorMessage(`Failed to delete user: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", password: "", mobile: "", empId: "", role: "", department: "", designation: "", status: "active", teamLead: "", teamLeadId: "", manager: "", managerId: "" });
  };

  const getTeamLeadName = (user) => {
    if (user.teamLeadName) return user.teamLeadName;
    if (user.teamLead && typeof user.teamLead === "string" && user.teamLead.length > 5 && !user.teamLead.includes("@") && !/^[a-zA-Z0-9]{20,}$/.test(user.teamLead)) return user.teamLead;
    const tlId = user.teamLeadId || user.teamLead;
    if (tlId) { const tl = teamLeadsList.find(t => t.id === tlId || t.uid === tlId); if (tl) return tl.name; }
    return "";
  };

  const getManagerName = (user) => {
    if (user.managerName) return user.managerName;
    if (user.manager && typeof user.manager === "string" && user.manager.length > 5 && !user.manager.includes("@") && !/^[a-zA-Z0-9]{20,}$/.test(user.manager)) return user.manager;
    const managerId = user.managerId || user.manager;
    if (managerId) { const mgr = managersList.find(m => m.id === managerId || m.uid === managerId); if (mgr) return mgr.name; }
    return "";
  };

  const openEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || "", email: user.email || "", mobile: user.mobile || "", empId: user.empId || "",
      role: user.role || "", department: user.department || "", designation: user.designation || "", status: user.status || "active",
      teamLead: getTeamLeadName(user), teamLeadId: user.teamLeadId || user.teamLead || "",
      manager: getManagerName(user), managerId: user.managerId || user.manager || "",
    });
    setOpenEditDialog(true);
  };

  const openDelete = (user) => { setSelectedUser(user); setOpenDeleteDialog(true); };
  const openView = (user) => { setSelectedUser(user); setOpenViewDialog(true); };

  const getDeptColor = (dept) => {
    switch (dept) {
      case "Health": return colors.accent.secondary;
      case "Insurance": return colors.accent.purple;
      case "Offline Visits": return colors.accent.cyan;
      default: return colors.accent.primary;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <Box sx={{ width: 50, height: 50, borderRadius: "50%", border: `3px solid ${colors.border.card}`, borderTopColor: colors.accent.primary, animation: `${spin} 1s linear infinite` }} />
        <Typography variant="body2" sx={{ mt: 2, color: colors.text.muted }}>Loading user data...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, animation: `${fadeInDown} 400ms ease`, animationFillMode: "both" }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.text.primary, letterSpacing: "-0.02em" }}>User Management</Typography>
          <Typography variant="body2" sx={{ color: colors.text.muted }}>Manage all users across departments</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchAllUsers}
            sx={{ borderRadius: "10px", borderColor: colors.border.card, color: colors.text.secondary, "&:hover": { borderColor: colors.accent.primary, backgroundColor: colors.accent.primaryLight } }}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<PersonAdd />} onClick={() => { resetForm(); setOpenAddDialog(true); }}
            sx={{ borderRadius: "10px", backgroundColor: colors.accent.primary, "&:hover": { backgroundColor: colors.accent.primaryHover } }}>
            Add User
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {successMessage && <Alert severity="success" onClose={() => setSuccessMessage("")} sx={{ mb: 2, borderRadius: "12px", backgroundColor: colors.accent.primaryLight, color: colors.accent.primary }}>{successMessage}</Alert>}
      {errorMessage && <Alert severity="error" onClose={() => setErrorMessage("")} sx={{ mb: 2, borderRadius: "12px", backgroundColor: colors.accent.errorLight, color: colors.accent.error }}>{errorMessage}</Alert>}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}><StatCard label="Total Users" value={stats.total} icon={People} iconColor={colors.accent.primary} accentColor={colors.accent.primary} animationDelay={0} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard label="Health Department" value={stats.health} icon={LocalHospital} iconColor={colors.accent.secondary} accentColor={colors.accent.secondary} animationDelay={50} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard label="Insurance Department" value={stats.insurance} icon={Shield} iconColor={colors.accent.purple} accentColor={colors.accent.purple} animationDelay={100} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard label="DC Agents" value={stats.dc} icon={DirectionsWalk} iconColor={colors.accent.cyan} accentColor={colors.accent.cyan} animationDelay={150} /></Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <GlassCard hoverable={false} animationDelay={200}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: colors.text.primary, mb: 2 }}>Department Distribution</Typography>
            <Box sx={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={departmentChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" animationDuration={1500}>
                    {departmentChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />))}
                  </Pie>
                  <RechartsTooltip content={<CustomChartTooltip />} />
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => <span style={{ color: colors.text.secondary, fontSize: "0.8rem" }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </GlassCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <GlassCard hoverable={false} animationDelay={250}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: colors.text.primary, mb: 2 }}>Role Distribution</Typography>
            <Box sx={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border.subtle} />
                  <XAxis dataKey="name" tick={{ fill: colors.text.muted, fontSize: 10 }} axisLine={{ stroke: colors.border.subtle }} />
                  <YAxis tick={{ fill: colors.text.muted, fontSize: 10 }} axisLine={{ stroke: colors.border.subtle }} />
                  <RechartsTooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="count" fill={colors.accent.primary} radius={[4, 4, 0, 0]} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </GlassCard>
        </Grid>
      </Grid>

      {/* Filters Section */}
      <GlassCard hoverable={false} sx={{ mb: 3, p: 2 }} animationDelay={300}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: showFilters ? 2 : 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FilterList sx={{ color: colors.text.muted }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colors.text.primary }}>Filters</Typography>
            <Chip label={`${filteredUsers.length} results`} size="small" sx={{ ml: 1, backgroundColor: colors.accent.primaryLight, color: colors.accent.primary, fontWeight: 600 }} />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Tabs value={viewMode} onChange={(e, v) => setViewMode(v)} sx={{ minHeight: 36, "& .MuiTab-root": { minHeight: 36, color: colors.text.muted, "&.Mui-selected": { color: colors.accent.primary } }, "& .MuiTabs-indicator": { backgroundColor: colors.accent.primary } }}>
              <Tab value="table" label="Table" sx={{ textTransform: "none" }} />
              <Tab value="grid" label="Grid" sx={{ textTransform: "none" }} />
            </Tabs>
            <IconButton size="small" onClick={() => setShowFilters(!showFilters)} sx={{ color: colors.text.muted }}>
              {showFilters ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>
        <Collapse in={showFilters}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField fullWidth size="small" placeholder="Search by name, email, ID, mobile..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: colors.text.muted }} /></InputAdornment> }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", backgroundColor: "rgba(255,255,255,0.03)", "& fieldset": { borderColor: colors.border.card }, "&:hover fieldset": { borderColor: colors.border.cardHover }, "&.Mui-focused fieldset": { borderColor: colors.accent.primary } }, "& .MuiInputBase-input": { color: colors.text.primary }, "& .MuiInputBase-input::placeholder": { color: colors.text.muted } }} />
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: colors.text.muted }}>Department</InputLabel>
                <Select value={filterDepartment} label="Department" onChange={(e) => setFilterDepartment(e.target.value)} sx={{ borderRadius: "10px", "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.border.card }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: colors.border.cardHover }, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: colors.accent.primary }, "& .MuiSelect-select": { color: colors.text.primary } }}>
                  <MenuItem value="all">All Departments</MenuItem>
                  <MenuItem value="Health">Health</MenuItem>
                  <MenuItem value="Insurance">Insurance</MenuItem>
                  <MenuItem value="Offline Visits">Offline Visits</MenuItem>
                  <MenuItem value="Management">Management</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: colors.text.muted }}>Role</InputLabel>
                <Select value={filterRole} label="Role" onChange={(e) => setFilterRole(e.target.value)} sx={{ borderRadius: "10px", "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.border.card }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: colors.border.cardHover }, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: colors.accent.primary }, "& .MuiSelect-select": { color: colors.text.primary } }}>
                  <MenuItem value="all">All Roles</MenuItem>
                  <MenuItem value="Health Agent">Health Agent</MenuItem>
                  <MenuItem value="Health TL">Health TL</MenuItem>
                  <MenuItem value="Insurance Agent">Insurance Agent</MenuItem>
                  <MenuItem value="Insurance TL">Insurance TL</MenuItem>
                  <MenuItem value="DC Agent">DC Agent</MenuItem>
                  <MenuItem value="Manager">Manager</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: colors.text.muted }}>Status</InputLabel>
                <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)} sx={{ borderRadius: "10px", "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.border.card }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: colors.border.cardHover }, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: colors.accent.primary }, "& .MuiSelect-select": { color: colors.text.primary } }}>
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button fullWidth variant="outlined" onClick={() => { setSearchQuery(""); setFilterDepartment("all"); setFilterRole("all"); setFilterStatus("all"); }}
                sx={{ borderRadius: "10px", height: 40, borderColor: colors.border.card, color: colors.text.secondary, "&:hover": { borderColor: colors.accent.primary, backgroundColor: colors.accent.primaryLight } }}>
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Collapse>
      </GlassCard>

      {/* Table View */}
      {viewMode === "table" && (
        <GlassCard hoverable={false} sx={{ p: 0, overflow: "hidden" }} animationDelay={350}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                  <TableCell sx={{ fontWeight: 600, color: colors.text.muted, borderBottom: `1px solid ${colors.border.subtle}`, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.05em" }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text.muted, borderBottom: `1px solid ${colors.border.subtle}`, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.05em" }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text.muted, borderBottom: `1px solid ${colors.border.subtle}`, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.05em" }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text.muted, borderBottom: `1px solid ${colors.border.subtle}`, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.05em" }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text.muted, borderBottom: `1px solid ${colors.border.subtle}`, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.05em" }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: colors.text.muted, borderBottom: `1px solid ${colors.border.subtle}`, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.05em" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((user) => {
                  const deptColor = getDeptColor(user.department);
                  return (
                    <TableRow key={user.id} sx={{ "&:hover": { backgroundColor: "rgba(34,197,94,0.05)" }, transition: `background-color ${transitions.fast}` }}>
                      <TableCell sx={{ borderBottom: `1px solid ${colors.border.subtle}` }}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Avatar sx={{ width: 40, height: 40, mr: 2, bgcolor: `${deptColor}20`, color: deptColor, fontWeight: 600, fontSize: "0.9rem" }}>{user.name?.charAt(0) || "U"}</Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: colors.text.primary }}>{user.name}</Typography>
                            <Typography variant="caption" sx={{ color: colors.text.muted }}>{user.empId || user.id}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${colors.border.subtle}` }}>
                        <Typography variant="body2" sx={{ display: "flex", alignItems: "center", color: colors.text.secondary }}><Email sx={{ fontSize: 14, mr: 0.5, color: colors.text.muted }} />{user.email}</Typography>
                        <Typography variant="caption" sx={{ display: "flex", alignItems: "center", mt: 0.5, color: colors.text.muted }}><Phone sx={{ fontSize: 12, mr: 0.5 }} />{user.mobile || "N/A"}</Typography>
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${colors.border.subtle}` }}>
                        <Chip label={user.role} size="small" sx={{ backgroundColor: "rgba(255,255,255,0.1)", color: colors.text.secondary, fontSize: "0.7rem" }} />
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${colors.border.subtle}` }}>
                        <Chip label={user.department} size="small" sx={{ backgroundColor: `${deptColor}20`, color: deptColor, fontSize: "0.7rem" }} />
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${colors.border.subtle}` }}>
                        <Chip icon={user.status === "active" || !user.status ? <CheckCircle sx={{ fontSize: 14 }} /> : <Cancel sx={{ fontSize: 14 }} />}
                          label={user.status || "active"} size="small"
                          sx={{ backgroundColor: (user.status === "active" || !user.status) ? colors.accent.primaryLight : colors.accent.errorLight, color: (user.status === "active" || !user.status) ? colors.accent.primary : colors.accent.error, fontSize: "0.7rem", "& .MuiChip-icon": { color: "inherit" } }} />
                      </TableCell>
                      <TableCell align="center" sx={{ borderBottom: `1px solid ${colors.border.subtle}` }}>
                        <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                          <Tooltip title="View Details"><IconButton size="small" onClick={() => openView(user)} sx={{ color: colors.text.muted, "&:hover": { color: colors.text.primary } }}><Visibility fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Edit User"><IconButton size="small" onClick={() => openEdit(user)} sx={{ color: colors.accent.primary, "&:hover": { backgroundColor: colors.accent.primaryLight } }}><Edit fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Delete User"><IconButton size="small" onClick={() => openDelete(user)} sx={{ color: colors.accent.error, "&:hover": { backgroundColor: colors.accent.errorLight } }}><Delete fontSize="small" /></IconButton></Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={filteredUsers.length} page={page} onPageChange={(e, newPage) => setPage(newPage)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            sx={{ borderTop: `1px solid ${colors.border.subtle}`, color: colors.text.secondary, "& .MuiTablePagination-select": { color: colors.text.primary }, "& .MuiTablePagination-selectIcon": { color: colors.text.muted } }} />
        </GlassCard>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <>
          <Grid container spacing={2}>
            {filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((user, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={user.id}>
                <UserCard user={user} onView={openView} onEdit={openEdit} onDelete={openDelete} />
              </Grid>
            ))}
          </Grid>
          <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
            <TablePagination component="div" count={filteredUsers.length} page={page} onPageChange={(e, newPage) => setPage(newPage)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              sx={{ color: colors.text.secondary, "& .MuiTablePagination-select": { color: colors.text.primary }, "& .MuiTablePagination-selectIcon": { color: colors.text.muted } }} />
          </Box>
        </>
      )}

      {/* Add User Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "16px", backgroundColor: colors.background.secondary, backgroundImage: "none" } }}>
        <DialogTitle sx={{ pb: 1, borderBottom: `1px solid ${colors.border.subtle}` }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <PersonAdd sx={{ mr: 1, color: colors.accent.primary }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: colors.text.primary }}>Add New User</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required
                InputProps={{ startAdornment: <InputAdornment position="start"><People sx={{ color: colors.text.muted }} /></InputAdornment> }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" }, "& .MuiInputLabel-root": { color: colors.text.muted }, "& .MuiInputBase-input": { color: colors.text.primary } }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email (Login ID)" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required
                InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: colors.text.muted }} /></InputAdornment> }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" }, "& .MuiInputLabel-root": { color: colors.text.muted }, "& .MuiInputBase-input": { color: colors.text.primary } }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required helperText="Minimum 6 characters"
                InputProps={{ startAdornment: <InputAdornment position="start"><Lock sx={{ color: colors.text.muted }} /></InputAdornment> }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" }, "& .MuiInputLabel-root": { color: colors.text.muted }, "& .MuiInputBase-input": { color: colors.text.primary }, "& .MuiFormHelperText-root": { color: colors.text.muted } }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Mobile Number" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} required
                InputProps={{ startAdornment: <InputAdornment position="start"><Phone sx={{ color: colors.text.muted }} /></InputAdornment> }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" }, "& .MuiInputLabel-root": { color: colors.text.muted }, "& .MuiInputBase-input": { color: colors.text.primary } }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Employee ID" value={formData.empId} onChange={(e) => setFormData({ ...formData, empId: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start"><BadgeIcon sx={{ color: colors.text.muted }} /></InputAdornment> }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" }, "& .MuiInputLabel-root": { color: colors.text.muted }, "& .MuiInputBase-input": { color: colors.text.primary } }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel sx={{ color: colors.text.muted }}>Role</InputLabel>
                <Select value={formData.role} label="Role" onChange={(e) => {
                  const role = e.target.value;
                  let dept = "";
                  if (role.includes("Health")) dept = "Health";
                  else if (role.includes("Insurance")) dept = "Insurance";
                  else if (role === "DC Agent" || role === "Offline Visits Manager" || role === "Ops Manager") dept = "Offline Visits";
                  else if (role === "Manager") dept = "Management";
                  setFormData({ ...formData, role, department: dept });
                }} sx={{ borderRadius: "10px", "& .MuiSelect-select": { color: colors.text.primary } }}>
                  <MenuItem value="Health Agent">Health Agent</MenuItem>
                  <MenuItem value="Health TL">Health Team Lead</MenuItem>
                  <MenuItem value="Insurance Agent">Insurance Agent</MenuItem>
                  <MenuItem value="Insurance TL">Insurance Team Lead</MenuItem>
                  <MenuItem value="DC Agent">DC Agent</MenuItem>
                  <MenuItem value="Offline Visits Manager">Offline Visits Manager</MenuItem>
                  <MenuItem value="Ops Manager">Ops Manager</MenuItem>
                  <MenuItem value="Manager">Manager</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel sx={{ color: colors.text.muted }}>Department</InputLabel>
                <Select value={formData.department} label="Department" onChange={(e) => setFormData({ ...formData, department: e.target.value })} sx={{ borderRadius: "10px", "& .MuiSelect-select": { color: colors.text.primary } }}>
                  <MenuItem value="Health">Health</MenuItem>
                  <MenuItem value="Insurance">Insurance</MenuItem>
                  <MenuItem value="Offline Visits">Offline Visits</MenuItem>
                  <MenuItem value="Management">Management</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.text.muted }}>Status</InputLabel>
                <Select value={formData.status} label="Status" onChange={(e) => setFormData({ ...formData, status: e.target.value })} sx={{ borderRadius: "10px", "& .MuiSelect-select": { color: colors.text.primary } }}>
                  <MenuItem value="active"><Box sx={{ display: "flex", alignItems: "center" }}><CheckCircle sx={{ color: colors.accent.primary, mr: 1, fontSize: 18 }} />Active</Box></MenuItem>
                  <MenuItem value="inactive"><Box sx={{ display: "flex", alignItems: "center" }}><Cancel sx={{ color: colors.accent.error, mr: 1, fontSize: 18 }} />Inactive</Box></MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.text.muted }}>Team Lead (Optional)</InputLabel>
                <Select value={formData.teamLeadId || ""} label="Team Lead (Optional)" onChange={(e) => {
                  const selectedTL = teamLeadsList.find(t => t.id === e.target.value || t.uid === e.target.value);
                  setFormData({ ...formData, teamLeadId: e.target.value, teamLead: selectedTL?.name || "" });
                }} sx={{ borderRadius: "10px", "& .MuiSelect-select": { color: colors.text.primary } }}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  {teamLeadsList.filter(tl => !formData.department || tl.department === formData.department || formData.department === "Offline Visits" || formData.department === "Management").map((tl) => (
                    <MenuItem key={tl.id} value={tl.uid || tl.id}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: "0.7rem", bgcolor: `${getDeptColor(tl.department)}20`, color: getDeptColor(tl.department) }}>{tl.name?.charAt(0)}</Avatar>
                        {tl.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.text.muted }}>Manager (Optional)</InputLabel>
                <Select value={formData.managerId || ""} label="Manager (Optional)" onChange={(e) => {
                  const selectedMgr = managersList.find(m => m.id === e.target.value || m.uid === e.target.value);
                  setFormData({ ...formData, managerId: e.target.value, manager: selectedMgr?.name || "" });
                }} sx={{ borderRadius: "10px", "& .MuiSelect-select": { color: colors.text.primary } }}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  {managersList.map((mgr) => (
                    <MenuItem key={mgr.id} value={mgr.uid || mgr.id}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: "0.7rem", bgcolor: colors.accent.primaryLight, color: colors.accent.primary }}>{mgr.name?.charAt(0)}</Avatar>
                        {mgr.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${colors.border.subtle}` }}>
          <Button onClick={() => setOpenAddDialog(false)} sx={{ borderRadius: "10px", color: colors.text.secondary }}>Cancel</Button>
          <Button variant="contained" onClick={handleAddUser} disabled={!formData.name || !formData.email || !formData.role}
            sx={{ borderRadius: "10px", backgroundColor: colors.accent.primary, "&:hover": { backgroundColor: colors.accent.primaryHover } }}>Add User</Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "16px", backgroundColor: colors.background.secondary, backgroundImage: "none" } }}>
        <DialogTitle sx={{ pb: 1, borderBottom: `1px solid ${colors.border.subtle}` }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Edit sx={{ mr: 1, color: colors.accent.primary }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: colors.text.primary }}>Edit User</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: "12px", backgroundColor: colors.accent.warningLight, color: colors.accent.warning }}>
            Note: Changing email here only updates the display. To change login credentials, update in Firebase Auth Console.
          </Alert>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" }, "& .MuiInputLabel-root": { color: colors.text.muted }, "& .MuiInputBase-input": { color: colors.text.primary } }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: colors.text.muted }} /></InputAdornment> }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" }, "& .MuiInputLabel-root": { color: colors.text.muted }, "& .MuiInputBase-input": { color: colors.text.primary } }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Mobile Number" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" }, "& .MuiInputLabel-root": { color: colors.text.muted }, "& .MuiInputBase-input": { color: colors.text.primary } }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.text.muted }}>Department</InputLabel>
                <Select value={formData.department} label="Department" onChange={(e) => setFormData({ ...formData, department: e.target.value })} sx={{ borderRadius: "10px", "& .MuiSelect-select": { color: colors.text.primary } }}>
                  <MenuItem value="Health">Health</MenuItem>
                  <MenuItem value="Insurance">Insurance</MenuItem>
                  <MenuItem value="Offline Visits">Offline Visits</MenuItem>
                  <MenuItem value="Management">Management</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Designation" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" }, "& .MuiInputLabel-root": { color: colors.text.muted }, "& .MuiInputBase-input": { color: colors.text.primary } }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.text.muted }}>Status</InputLabel>
                <Select value={formData.status} label="Status" onChange={(e) => setFormData({ ...formData, status: e.target.value })} sx={{ borderRadius: "10px", "& .MuiSelect-select": { color: colors.text.primary } }}>
                  <MenuItem value="active"><Box sx={{ display: "flex", alignItems: "center" }}><CheckCircle sx={{ color: colors.accent.primary, mr: 1, fontSize: 18 }} />Active</Box></MenuItem>
                  <MenuItem value="inactive"><Box sx={{ display: "flex", alignItems: "center" }}><Cancel sx={{ color: colors.accent.error, mr: 1, fontSize: 18 }} />Inactive</Box></MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.text.muted }}>Team Lead</InputLabel>
                <Select value={formData.teamLeadId || ""} label="Team Lead" onChange={(e) => {
                  const selectedTL = teamLeadsList.find(t => t.id === e.target.value || t.uid === e.target.value);
                  setFormData({ ...formData, teamLeadId: e.target.value, teamLead: selectedTL?.name || "" });
                }} sx={{ borderRadius: "10px", "& .MuiSelect-select": { color: colors.text.primary } }}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  {teamLeadsList.filter(tl => !formData.department || tl.department === formData.department || formData.department === "Offline Visits" || formData.department === "Management").map((tl) => (
                    <MenuItem key={tl.id} value={tl.uid || tl.id}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: "0.7rem", bgcolor: `${getDeptColor(tl.department)}20`, color: getDeptColor(tl.department) }}>{tl.name?.charAt(0)}</Avatar>
                        {tl.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.text.muted }}>Manager</InputLabel>
                <Select value={formData.managerId || ""} label="Manager" onChange={(e) => {
                  const selectedMgr = managersList.find(m => m.id === e.target.value || m.uid === e.target.value);
                  setFormData({ ...formData, managerId: e.target.value, manager: selectedMgr?.name || "" });
                }} sx={{ borderRadius: "10px", "& .MuiSelect-select": { color: colors.text.primary } }}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  {managersList.map((mgr) => (
                    <MenuItem key={mgr.id} value={mgr.uid || mgr.id}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: "0.7rem", bgcolor: colors.accent.primaryLight, color: colors.accent.primary }}>{mgr.name?.charAt(0)}</Avatar>
                        {mgr.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${colors.border.subtle}` }}>
          <Button onClick={() => setOpenEditDialog(false)} sx={{ borderRadius: "10px", color: colors.text.secondary }}>Cancel</Button>
          <Button variant="contained" onClick={handleEditUser} sx={{ borderRadius: "10px", backgroundColor: colors.accent.primary, "&:hover": { backgroundColor: colors.accent.primaryHover } }}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} PaperProps={{ sx: { borderRadius: "16px", backgroundColor: colors.background.secondary, backgroundImage: "none" } }}>
        <DialogTitle sx={{ borderBottom: `1px solid ${colors.border.subtle}` }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Warning sx={{ mr: 1, color: colors.accent.error }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: colors.text.primary }}>Confirm Delete</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Avatar sx={{ width: 48, height: 48, mr: 2, bgcolor: colors.accent.errorLight, color: colors.accent.error }}>{selectedUser?.name?.charAt(0)}</Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colors.text.primary }}>{selectedUser?.name}</Typography>
              <Typography variant="caption" sx={{ color: colors.text.muted }}>{selectedUser?.email}</Typography>
            </Box>
          </Box>
          <Alert severity="warning" sx={{ borderRadius: "12px", backgroundColor: colors.accent.warningLight, color: colors.accent.warning }}>
            This action cannot be undone. The user will be permanently removed from the system.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${colors.border.subtle}` }}>
          <Button onClick={() => setOpenDeleteDialog(false)} sx={{ borderRadius: "10px", color: colors.text.secondary }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteUser} sx={{ borderRadius: "10px" }}>Delete User</Button>
        </DialogActions>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px", backgroundColor: colors.background.secondary, backgroundImage: "none" } }}>
        <DialogTitle sx={{ pb: 1, borderBottom: `1px solid ${colors.border.subtle}` }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Visibility sx={{ mr: 1, color: colors.accent.primary }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: colors.text.primary }}>User Details</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedUser && (
            <Box>
              <Box sx={{ p: 3, mb: 3, bgcolor: "rgba(255,255,255,0.03)", borderRadius: "12px", display: "flex", alignItems: "center", border: `1px solid ${colors.border.subtle}` }}>
                <Avatar sx={{ width: 64, height: 64, mr: 2, bgcolor: `${getDeptColor(selectedUser.department)}20`, color: getDeptColor(selectedUser.department), fontSize: "1.5rem", fontWeight: 600 }}>{selectedUser.name?.charAt(0)}</Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: colors.text.primary }}>{selectedUser.name}</Typography>
                  <Typography variant="body2" sx={{ color: colors.text.muted }}>{selectedUser.empId || selectedUser.id}</Typography>
                  <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                    <Chip label={selectedUser.role} size="small" sx={{ backgroundColor: "rgba(255,255,255,0.1)", color: colors.text.secondary }} />
                    <Chip label={selectedUser.status || "active"} size="small" sx={{ backgroundColor: (selectedUser.status === "active" || !selectedUser.status) ? colors.accent.primaryLight : colors.accent.errorLight, color: (selectedUser.status === "active" || !selectedUser.status) ? colors.accent.primary : colors.accent.error }} />
                  </Box>
                </Box>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}><Email sx={{ fontSize: 18, color: colors.text.muted, mr: 1 }} /><Typography variant="caption" sx={{ color: colors.text.muted }}>Email (Login ID)</Typography></Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: colors.text.primary }}>{selectedUser.email}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}><Phone sx={{ fontSize: 18, color: colors.text.muted, mr: 1 }} /><Typography variant="caption" sx={{ color: colors.text.muted }}>Mobile</Typography></Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: colors.text.primary }}>{selectedUser.mobile || "N/A"}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}><Business sx={{ fontSize: 18, color: colors.text.muted, mr: 1 }} /><Typography variant="caption" sx={{ color: colors.text.muted }}>Department</Typography></Box>
                  <Chip label={selectedUser.department} size="small" sx={{ backgroundColor: `${getDeptColor(selectedUser.department)}20`, color: getDeptColor(selectedUser.department) }} />
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}><BadgeIcon sx={{ fontSize: 18, color: colors.text.muted, mr: 1 }} /><Typography variant="caption" sx={{ color: colors.text.muted }}>Designation</Typography></Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: colors.text.primary }}>{selectedUser.designation || selectedUser.role}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}><SupervisorAccount sx={{ fontSize: 18, color: colors.text.muted, mr: 1 }} /><Typography variant="caption" sx={{ color: colors.text.muted }}>Team Lead</Typography></Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: colors.text.primary }}>{getTeamLeadName(selectedUser) || "N/A"}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}><SupervisorAccount sx={{ fontSize: 18, color: colors.text.muted, mr: 1 }} /><Typography variant="caption" sx={{ color: colors.text.muted }}>Manager</Typography></Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: colors.text.primary }}>{getManagerName(selectedUser) || "N/A"}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${colors.border.subtle}` }}>
          <Button variant="outlined" startIcon={<Edit />} onClick={() => { setOpenViewDialog(false); openEdit(selectedUser); }}
            sx={{ borderRadius: "10px", borderColor: colors.accent.primary, color: colors.accent.primary, "&:hover": { borderColor: colors.accent.primary, backgroundColor: colors.accent.primaryLight } }}>Edit User</Button>
          <Button onClick={() => setOpenViewDialog(false)} sx={{ borderRadius: "10px", color: colors.text.secondary }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UserManagement;
