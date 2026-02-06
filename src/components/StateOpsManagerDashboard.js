import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Tabs,
  Tab,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import {
  Group,
  DirectionsWalk,
  Person,
  Search as SearchIcon,
  FileDownload,
  Refresh,
  CheckCircle,
  LocationOn,
  Phone,
  Email,
  Badge as BadgeIcon,
} from "@mui/icons-material";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";

// Import DC Dashboard components for regular DC work
import DCDashboard from "./DCDashboard";

const StateOpsManagerDashboard = ({ currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [headNurses, setHeadNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch head nurses managed by this state ops manager
  useEffect(() => {
    if (!currentUser?.uid) return;

    setLoading(true);

    const headNursesQuery = query(
      collection(db, "offlineVisits"),
      where("role", "==", "male_head_nurse"),
      where("reportsTo", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      headNursesQuery,
      (snapshot) => {
        const nursesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setHeadNurses(nursesData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching head nurses:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Filter head nurses based on search
  const filteredHeadNurses = headNurses.filter((nurse) => {
    const query = searchQuery.toLowerCase();
    return (
      nurse.name?.toLowerCase().includes(query) ||
      nurse.empId?.toLowerCase().includes(query) ||
      nurse.email?.toLowerCase().includes(query) ||
      nurse.mobile?.includes(query)
    );
  });

  // Stats for head nurses
  const stats = {
    totalHeadNurses: headNurses.length,
    activeNurses: headNurses.filter((n) => n.status === "active").length,
    totalClinics: headNurses.reduce((sum, n) => sum + (n.totalClinics || 0), 0),
  };

  // Export head nurses data to CSV
  const exportToCSV = () => {
    const headers = [
      "Employee ID",
      "Name",
      "Email",
      "Mobile",
      "Status",
      "Assigned Clinics",
      "Total Clinics",
    ];

    const rows = filteredHeadNurses.map((nurse) => [
      nurse.empId || "",
      nurse.name || "",
      nurse.email || "",
      nurse.mobile || nurse.contactNumber || "",
      nurse.status || "active",
      (nurse.assignedClinics || []).join("; "),
      nurse.totalClinics || 0,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `head_nurses_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fa" }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          p: 3,
          borderRadius: 0,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              State Ops Manager Dashboard
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
              Welcome, {currentUser?.name} ({currentUser?.empId})
            </Typography>
            <Chip
              label="State Ops Manager + DC Agent"
              sx={{
                mt: 2,
                bgcolor: "rgba(255,255,255,0.2)",
                color: "white",
                fontWeight: 600,
              }}
            />
          </Box>
          <Button
            variant="contained"
            onClick={onLogout}
            sx={{
              bgcolor: "rgba(255,255,255,0.2)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
            }}
          >
            Logout
          </Button>
        </Box>
      </Paper>

      {/* Main Tabs */}
      <Paper elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            "& .MuiTab-root": {
              fontWeight: 600,
              textTransform: "none",
              fontSize: "16px",
            },
          }}
        >
          <Tab icon={<DirectionsWalk />} iconPosition="start" label="My DC Work" />
          <Tab icon={<Group />} iconPosition="start" label={`Head Nurses (${stats.totalHeadNurses})`} />
        </Tabs>
      </Paper>

      <Box sx={{ p: 3 }}>
        {/* Tab 0: Regular DC Dashboard */}
        {activeTab === 0 && (
          <DCDashboard currentUser={currentUser} onLogout={onLogout} />
        )}

        {/* Tab 1: Head Nurses Management */}
        {activeTab === 1 && (
          <>
            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Total Head Nurses
                        </Typography>
                        <Typography variant="h3" fontWeight={700}>
                          {stats.totalHeadNurses}
                        </Typography>
                      </Box>
                      <Group sx={{ fontSize: 48, opacity: 0.3 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                    color: "white",
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Active Nurses
                        </Typography>
                        <Typography variant="h3" fontWeight={700}>
                          {stats.activeNurses}
                        </Typography>
                      </Box>
                      <CheckCircle sx={{ fontSize: 48, opacity: 0.3 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                    color: "white",
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Total Clinics
                        </Typography>
                        <Typography variant="h3" fontWeight={700}>
                          {stats.totalClinics}
                        </Typography>
                      </Box>
                      <LocationOn sx={{ fontSize: 48, opacity: 0.3 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Search and Actions */}
            <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <TextField
                  placeholder="Search head nurses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="small"
                  sx={{ flexGrow: 1, minWidth: 250 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  variant="outlined"
                  startIcon={<FileDownload />}
                  onClick={exportToCSV}
                  disabled={filteredHeadNurses.length === 0}
                >
                  Export CSV
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => window.location.reload()}
                >
                  Refresh
                </Button>
              </Box>
            </Paper>

            {/* Head Nurses Table */}
            <Paper elevation={0} sx={{ borderRadius: 2, overflow: "hidden" }}>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : filteredHeadNurses.length === 0 ? (
                <Box sx={{ textAlign: "center", p: 4 }}>
                  <Typography variant="h6" color="text.secondary">
                    {searchQuery ? "No head nurses found matching your search" : "No head nurses assigned yet"}
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: "#f5f7fa" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Nurse</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Assigned Clinics</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredHeadNurses.map((nurse) => (
                        <TableRow key={nurse.id} hover>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                              <Avatar sx={{ bgcolor: "#667eea" }}>
                                <Person />
                              </Avatar>
                              <Box>
                                <Typography variant="body1" fontWeight={600}>
                                  {nurse.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {nurse.empId}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Email sx={{ fontSize: 16, color: "text.secondary" }} />
                                <Typography variant="body2">{nurse.email}</Typography>
                              </Box>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Phone sx={{ fontSize: 16, color: "text.secondary" }} />
                                <Typography variant="body2">
                                  {nurse.mobile || nurse.contactNumber || "N/A"}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={nurse.status || "active"}
                              color={nurse.status === "active" ? "success" : "default"}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {nurse.totalClinics || 0} clinics
                            </Typography>
                            {nurse.assignedClinics && nurse.assignedClinics.length > 0 && (
                              <Typography variant="caption" color="text.secondary">
                                {nurse.assignedClinics.slice(0, 3).join(", ")}
                                {nurse.assignedClinics.length > 3 && ` +${nurse.assignedClinics.length - 3} more`}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button size="small" variant="outlined">
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </>
        )}
      </Box>
    </Box>
  );
};

export default StateOpsManagerDashboard;
