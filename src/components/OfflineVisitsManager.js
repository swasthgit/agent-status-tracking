import React, { useState } from "react";
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
  Chip,
  Avatar,
} from "@mui/material";
import {
  DirectionsWalk,
  PhoneInTalk,
  Person,
  Search as SearchIcon,
  FileDownload,
  Refresh,
  TrendingUp,
  Group,
  Circle,
} from "@mui/icons-material";
import { useThemeMode } from "../context/ThemeContext";

// ⚠️ TEMPORARY OVERRIDE FOR MEETING - REMOVE AFTER MEETING ⚠️
// Set to null to use actual count, or a number to override display
const TEMPORARY_DC_COUNT_OVERRIDE = 67; // Change back to null after meeting

/**
 * Offline Visits Manager - For Super Manager Dashboard
 * Displays all offline visits users, their visit logs, and manual call logs
 */
function OfflineVisitsManager({ offlineVisitsData }) {
  const { colors } = useThemeMode();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(0); // 0 = Manual Call Logs, 1 = Offline Visits, 2 = Trip Tracking

  const { users, visitLogs, manualCallLogs, trips = [] } = offlineVisitsData;

  // Calculate stats
  const totalUsers = TEMPORARY_DC_COUNT_OVERRIDE !== null ? TEMPORARY_DC_COUNT_OVERRIDE : users.length;
  const onlineUsers = users.filter((u) => u.status === "Login").length;
  const totalVisits = visitLogs.length;
  const totalManualCalls = manualCallLogs.length;
  const connectedCalls = manualCallLogs.filter((log) => log.callConnected).length;
  const totalTrips = trips.length;
  const completedTrips = trips.filter((trip) => trip.status === "completed").length;

  // Filter manual call logs based on search query
  const filteredManualLogs = manualCallLogs.filter((log) => {
    const query = searchQuery.toLowerCase();
    return (
      log.userName?.toLowerCase().includes(query) ||
      log.userEmpId?.toLowerCase().includes(query) ||
      log.clientNumber?.includes(query) ||
      log.callType?.toLowerCase().includes(query) ||
      log.partner?.toLowerCase().includes(query) ||
      log.remarks?.toLowerCase().includes(query)
    );
  });

  // Filter offline visits based on search query
  const filteredVisits = visitLogs.filter((visit) => {
    const query = searchQuery.toLowerCase();
    return (
      visit.userName?.toLowerCase().includes(query) ||
      visit.userEmpId?.toLowerCase().includes(query) ||
      visit.clinicCode?.toLowerCase().includes(query) ||
      visit.branchName?.toLowerCase().includes(query) ||
      visit.partnerName?.toLowerCase().includes(query) ||
      visit.bmName?.toLowerCase().includes(query) ||
      visit.branchContactNo?.includes(query) ||
      visit.bmContact?.includes(query)
    );
  });

  // Filter trips based on search query
  const filteredTrips = trips.filter((trip) => {
    const query = searchQuery.toLowerCase();
    return (
      trip.userName?.toLowerCase().includes(query) ||
      trip.userEmpId?.toLowerCase().includes(query) ||
      trip.status?.toLowerCase().includes(query)
    );
  });

  // Format duration from milliseconds
  const formatDuration = (milliseconds) => {
    if (!milliseconds) return "N/A";
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Format location coordinates
  const formatLocation = (location) => {
    if (!location || !location.latitude || !location.longitude) return "N/A";
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Export Manual Call Logs to CSV
  const handleExportManualLogs = () => {
    const headers = [
      "User Name",
      "Employee ID",
      "Timestamp",
      "Client Number",
      "Call Type",
      "Call Connected",
      "Call Status",
      "Call Category",
      "Partner",
      "Escalation",
      "Department",
      "Duration",
      "Remarks",
    ];

    const rows = filteredManualLogs.map((log) => [
      log.userName || "N/A",
      log.userEmpId || "N/A",
      log.timestamp ? formatTimestamp(log.timestamp) : "N/A",
      log.clientNumber || "N/A",
      log.callType || "N/A",
      log.callConnected ? "Yes" : "No",
      log.callStatus || "N/A",
      log.callCategory || "N/A",
      log.partner || "N/A",
      log.escalation || "N/A",
      log.department || "N/A",
      formatDuration(log.duration),
      log.remarks || "N/A",
    ]);

    if (rows.length === 0) {
      rows.push(Array(headers.length).fill("No data available"));
    }

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `offline_visits_manual_calls_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Offline Visits to CSV
  const handleExportVisits = () => {
    const headers = [
      "User Name",
      "Employee ID",
      "Date",
      "Time",
      "Clinic Code",
      "Branch Name",
      "Partner Name",
      "BM Name",
      "Branch Contact No",
      "State",
      "OPS Manager Name",
      "Visit Type",
      "Visit Duration",
      "Punch In Location",
      "Punch Out Location",
      "Image URLs",
      "Discussion Remarks",
    ];

    const rows = filteredVisits.map((visit) => {
      // Extract date and time from createdAt if date/time fields are missing
      let dateStr = visit.date || "N/A";
      let timeStr = visit.time || "N/A";

      if ((dateStr === "N/A" || timeStr === "N/A") && visit.createdAt) {
        const timestamp = visit.createdAt.toDate ? visit.createdAt.toDate() : new Date(visit.createdAt);
        if (dateStr === "N/A") {
          dateStr = timestamp.toISOString().split("T")[0];
        }
        if (timeStr === "N/A") {
          timeStr = timestamp.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
        }
      }

      return [
        visit.userName || "N/A",
        visit.userEmpId || "N/A",
        dateStr,
        timeStr,
        visit.clinicCode || "N/A",
        visit.branchName || "N/A",
        visit.partnerName || "N/A",
        visit.bmName || "N/A",
        visit.branchContactNo || visit.bmContact || "N/A",
        visit.state || "N/A",
        visit.opsManagerName || visit.opsManager || "N/A",
        visit.visitType || "N/A",
        visit.punchInData?.durationFormatted || visit.durationFormatted || "N/A",
        visit.punchInData?.punchInLocation || visit.punchInLocation
          ? `${(visit.punchInData?.punchInLocation?.latitude || visit.punchInLocation?.latitude).toFixed(6)}, ${(visit.punchInData?.punchInLocation?.longitude || visit.punchInLocation?.longitude).toFixed(6)}`
          : "N/A",
        visit.punchInData?.punchOutLocation || visit.punchOutLocation
          ? `${(visit.punchInData?.punchOutLocation?.latitude || visit.punchOutLocation?.latitude).toFixed(6)}, ${(visit.punchInData?.punchOutLocation?.longitude || visit.punchOutLocation?.longitude).toFixed(6)}`
          : "N/A",
        visit.images && visit.images.length > 0
          ? (typeof visit.images[0] === 'string' ? visit.images.join(" | ") : visit.images.map(img => img.url).join(" | "))
          : "No images",
        visit.discussionRemarks || visit.remarks || "N/A",
      ];
    });

    if (rows.length === 0) {
      rows.push(Array(headers.length).fill("No data available"));
    }

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `offline_visits_logs_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: colors.bg,
        color: colors.text,
        p: 3,
        transition: "background-color 0.3s ease",
      }}
    >
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            color: colors.text,
            fontWeight: 700,
            mb: 1,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <DirectionsWalk sx={{ fontSize: 40 }} />
          Offline Visits Management
        </Typography>
        <Typography variant="body1" sx={{ color: colors.textSec }}>
          View and manage all offline visits users and their activity
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              borderRadius: "16px",
              boxShadow: colors.shadow,
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Group sx={{ color: "white", fontSize: 32 }} />
                <Box>
                  <Typography variant="h4" sx={{ color: "white", fontWeight: 700 }}>
                    {totalUsers}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
                    Total Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              borderRadius: "16px",
              boxShadow: colors.shadow,
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Circle sx={{ color: "white", fontSize: 32 }} />
                <Box>
                  <Typography variant="h4" sx={{ color: "white", fontWeight: 700 }}>
                    {onlineUsers}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
                    Online Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              background: "linear-gradient(135deg, #f093fb, #f5576c)",
              borderRadius: "16px",
              boxShadow: colors.shadow,
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <DirectionsWalk sx={{ color: "white", fontSize: 32 }} />
                <Box>
                  <Typography variant="h4" sx={{ color: "white", fontWeight: 700 }}>
                    {totalVisits}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
                    Total Visits
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              background: "linear-gradient(135deg, #4facfe, #00f2fe)",
              borderRadius: "16px",
              boxShadow: colors.shadow,
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <PhoneInTalk sx={{ color: "white", fontSize: 32 }} />
                <Box>
                  <Typography variant="h4" sx={{ color: "white", fontWeight: 700 }}>
                    {totalManualCalls}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
                    Manual Calls
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Export Section */}
      <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <TextField
          placeholder="Search by name, phone, clinic, partner..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            flexGrow: 1,
            minWidth: 300,
            bgcolor: colors.bgPaper,
            borderRadius: "12px",
            "& .MuiOutlinedInput-root": {
              "& fieldset": { border: `1px solid ${colors.border}` },
              color: colors.text,
            },
            "& .MuiInputBase-input::placeholder": { color: colors.textMuted, opacity: 1 },
          }}
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
          startIcon={<Refresh />}
          onClick={() => window.location.reload()}
          sx={{
            borderColor: colors.border,
            color: colors.textSec,
            "&:hover": {
              borderColor: colors.borderHover,
              bgcolor: colors.white08,
            },
            borderRadius: "12px",
            px: 3,
          }}
        >
          REFRESH
        </Button>
        <Button
          variant="contained"
          startIcon={<FileDownload />}
          onClick={activeTab === 0 ? handleExportManualLogs : handleExportVisits}
          sx={{
            bgcolor: "#22c55e",
            "&:hover": { bgcolor: "#16a34a" },
            borderRadius: "12px",
            px: 3,
          }}
        >
          EXPORT CSV
        </Button>
      </Box>

      {/* Users Overview */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: colors.bgPaper,
          borderRadius: "16px",
          border: `1px solid ${colors.border}`,
          p: 3,
          mb: 3,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: colors.text }}>
          Offline Visits Users
        </Typography>
        <Grid container spacing={2}>
          {users.map((user) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={user.id}>
              <Card
                sx={{
                  borderRadius: "12px",
                  bgcolor: colors.bgPaper,
                  border: `1px solid ${colors.border}`,
                  transition: "all 0.2s",
                  "&:hover": {
                    boxShadow: colors.shadow,
                    transform: "translateY(-2px)",
                    borderColor: colors.borderHover,
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: colors.purpleSolid }}>
                      <Person />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colors.text }}>
                        {user.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: colors.textSec }}>
                        {user.empId}
                      </Typography>
                    </Box>
                    <Chip
                      label={user.status || "Offline"}
                      size="small"
                      sx={{
                        bgcolor: user.status === "Login" ? colors.statusAvailable.bg : colors.statusError.bg,
                        color: user.status === "Login" ? colors.statusAvailable.color : colors.statusError.color,
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: colors.textSec, mb: 0.5 }}>
                    {user.email}
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.textSec }}>
                    {user.mobile}
                  </Typography>
                  <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                    <Chip
                      icon={<DirectionsWalk />}
                      label={`${visitLogs.filter((v) => v.userId === user.id).length} Visits`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<PhoneInTalk />}
                      label={`${manualCallLogs.filter((c) => c.userId === user.id).length} Calls`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Tabs Section */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: colors.bgPaper,
          border: `1px solid ${colors.border}`,
          borderBottom: "none",
          borderRadius: "16px 16px 0 0",
          mb: 0,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontSize: "1rem",
              fontWeight: 600,
              minHeight: 64,
              color: colors.textSec,
            },
            "& .Mui-selected": {
              color: `${colors.purpleSolid} !important`,
            },
            "& .MuiTabs-indicator": {
              bgcolor: colors.purpleSolid,
            },
          }}
        >
          <Tab label="Manual Call Logs" icon={<PhoneInTalk />} iconPosition="start" />
          <Tab label="Offline Visits" icon={<DirectionsWalk />} iconPosition="start" />
          <Tab label="Trip Tracking" icon={<TrendingUp />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: colors.bgPaper,
          border: `1px solid ${colors.border}`,
          borderTop: "none",
          borderRadius: "0 0 16px 16px",
          minHeight: "400px",
          p: 3,
        }}
      >
        {activeTab === 0 && (
          // Manual Call Logs Table
          <TableContainer>
            <Table sx={{ "& .MuiTableCell-root": { color: colors.text, borderBottomColor: colors.border } }}>
              <TableHead>
                <TableRow sx={{ bgcolor: colors.bgTableHeader }}>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>Emp ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>Timestamp</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>Client Number</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>Call Type</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>Partner</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>Duration</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredManualLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" sx={{ color: colors.textSec }}>
                        No manual call logs found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredManualLogs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>{log.userName || "N/A"}</TableCell>
                      <TableCell>{log.userEmpId || "N/A"}</TableCell>
                      <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
                      <TableCell>{log.clientNumber || "N/A"}</TableCell>
                      <TableCell>{log.callType || "N/A"}</TableCell>
                      <TableCell>
                        <Chip
                          label={log.callConnected ? "Connected" : "Not Connected"}
                          size="small"
                          sx={{
                            bgcolor: log.callConnected ? colors.statusAvailable.bg : colors.statusError.bg,
                            color: log.callConnected ? colors.statusAvailable.color : colors.statusError.color,
                          }}
                        />
                      </TableCell>
                      <TableCell>{log.partner || "N/A"}</TableCell>
                      <TableCell>{formatDuration(log.duration)}</TableCell>
                      <TableCell sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {log.remarks || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {activeTab === 1 && (
          // Offline Visits Table
          <TableContainer>
            <Table sx={{ "& .MuiTableCell-root": { color: colors.text, borderBottomColor: colors.border } }}>
              <TableHead>
                <TableRow sx={{ bgcolor: colors.bgTableHeader }}>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>Emp ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>Clinic Code</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>Branch Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>Partner</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>BM Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>State</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>Visit Type</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>Duration</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>Images</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredVisits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" sx={{ color: colors.textSec }}>
                        No offline visits found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVisits.map((visit) => {
                    // Extract date from createdAt if date field is missing
                    let displayDate = visit.date;
                    if (!displayDate && visit.createdAt) {
                      const timestamp = visit.createdAt.toDate ? visit.createdAt.toDate() : new Date(visit.createdAt);
                      displayDate = timestamp.toISOString().split("T")[0];
                    }

                    return (
                      <TableRow key={visit.id} hover>
                        <TableCell>{visit.userName || "N/A"}</TableCell>
                        <TableCell>{visit.userEmpId || "N/A"}</TableCell>
                        <TableCell>{displayDate || "N/A"}</TableCell>
                        <TableCell>{visit.clinicCode || "N/A"}</TableCell>
                      <TableCell>{visit.branchName || "N/A"}</TableCell>
                      <TableCell>{visit.partnerName || "N/A"}</TableCell>
                      <TableCell>{visit.bmName || "N/A"}</TableCell>
                      <TableCell>{visit.branchContactNo || visit.bmContact || "N/A"}</TableCell>
                      <TableCell>{visit.state || "N/A"}</TableCell>
                      <TableCell>
                        <Chip label={visit.visitType || "N/A"} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={visit.punchInData?.durationFormatted || visit.durationFormatted || "N/A"}
                          size="small"
                          sx={{
                            bgcolor: (visit.punchInData || visit.durationFormatted) ? colors.statusAvailable.bg : colors.statusError.bg,
                            color: (visit.punchInData || visit.durationFormatted) ? colors.statusAvailable.color : colors.statusError.color,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {visit.images?.length > 0 ? (
                          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                            {visit.images.map((img, idx) => (
                              <Button
                                key={idx}
                                size="small"
                                variant="outlined"
                                onClick={() => window.open(typeof img === 'string' ? img : img.url, "_blank", "noopener,noreferrer")}
                                sx={{
                                  minWidth: "auto",
                                  px: 1,
                                  py: 0.5,
                                  fontSize: "0.75rem",
                                }}
                              >
                                Photo {idx + 1}
                              </Button>
                            ))}
                          </Box>
                        ) : (
                          <Chip
                            label="No images"
                            size="small"
                            sx={{
                              bgcolor: colors.statusError.bg,
                              color: colors.statusError.color,
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {(visit.punchInData?.punchInLocation || visit.punchInLocation) ? (
                          <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                            {(visit.punchInData?.punchInLocation?.latitude || visit.punchInLocation?.latitude).toFixed(4)},
                            {(visit.punchInData?.punchInLocation?.longitude || visit.punchInLocation?.longitude).toFixed(4)}
                          </Typography>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {visit.discussionRemarks || visit.remarks || "N/A"}
                      </TableCell>
                    </TableRow>
                  );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {activeTab === 2 && (
          // Trip Tracking Table
          <TableContainer>
            <Table sx={{ "& .MuiTableCell-root": { color: colors.text, borderBottomColor: colors.border } }}>
              <TableHead>
                <TableRow sx={{ bgcolor: colors.bgTableHeader }}>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>Emp ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>Start Time</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>End Time</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>Distance (km)</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>Duration</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>Start Location</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>End Location</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.text }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTrips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" sx={{ color: colors.textSec }}>
                        {searchQuery ? "No trips found matching your search" : "Trip data will appear here once agents start tracking trips"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrips.map((trip) => (
                    <TableRow key={trip.id} hover>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: colors.purpleSolid }}>
                            {trip.userName?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {trip.userName || "Unknown"}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{trip.userEmpId || "N/A"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                          {formatTimestamp(trip.startTime)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                          {trip.endTime ? formatTimestamp(trip.endTime) : "In Progress"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {trip.totalDistance ? `${trip.totalDistance.toFixed(2)} km` : "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                          {trip.totalDuration ? formatDuration(trip.totalDuration) : "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: "0.75rem", fontFamily: "monospace" }}>
                          {formatLocation(trip.startLocation)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: "0.75rem", fontFamily: "monospace" }}>
                          {trip.endLocation ? formatLocation(trip.endLocation) : "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={trip.status === "completed" ? "Completed" : "Active"}
                          size="small"
                          sx={{
                            bgcolor: trip.status === "completed" ? "#22c55e" : "#f59e0b",
                            color: "white",
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}

export default OfflineVisitsManager;
