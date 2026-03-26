import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Select,
  FormControl,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  Phone,
  PlayArrow,
  Search,
  FilterList,
  AccessTime,
} from "@mui/icons-material";
import { THEME, SHADOWS, TYPOGRAPHY, RADIUS, SPACING, GRADIENTS, GLASS, ANIMATIONS, STATUS_COLORS } from "../theme/theme";
import "../styles/animations.css";

const CallHistory = ({ callLogs, agentName }) => {
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState("24h");
  const [loadingRecordings, setLoadingRecordings] = useState({});

  // Filter logs based on time period and search term
  useEffect(() => {
    let filtered = [...callLogs];

    // Apply time filter
    const now = new Date();
    let cutoffTime;

    switch (timeFilter) {
      case "24h":
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "week":
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffTime = new Date(0); // Show all
    }

    filtered = filtered.filter((log) => {
      if (!log.timestamp) return false;
      const logTime = log.timestamp.toDate();
      return logTime >= cutoffTime;
    });

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          (log.clientNumber && log.clientNumber.includes(search)) ||
          (log.sid && log.sid.toLowerCase().includes(search)) ||
          (log.agentName && log.agentName.toLowerCase().includes(search)) ||
          (log.callerId && log.callerId.includes(search)) ||
          (log.partnerName && log.partnerName.toLowerCase().includes(search)) ||
          (log.remarks && log.remarks.toLowerCase().includes(search))
      );
    }

    // Sort by timestamp (latest first)
    filtered.sort((a, b) => {
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      return b.timestamp.toDate() - a.timestamp.toDate();
    });

    setFilteredLogs(filtered);
  }, [callLogs, timeFilter, searchTerm]);

  const formatDuration = (duration) => {
    if (
      !duration ||
      typeof duration !== "object" ||
      (!duration.hours && !duration.minutes && !duration.seconds)
    )
      return null;
    return `${duration.hours || 0}h ${duration.minutes || 0}m ${
      duration.seconds || 0
    }s`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours < 1) {
      return `${minutes} min${minutes !== 1 ? "s" : ""} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleString();
    }
  };

  const fetchRecording = async (sid) => {
    if (!sid) {
      alert("No call SID available for this call");
      return;
    }

    setLoadingRecordings((prev) => ({ ...prev, [sid]: true }));

    try {
      const ACCOUNT_SID = process.env.REACT_APP_ACCOUNT_SID;

      // Construct the direct Exotel call details URL
      // Format: https://my.exotel.com/{AccountSid}/calls/{CallSid}
      const recordingUrl = `https://my.exotel.com/${ACCOUNT_SID}/calls/${sid}`;

      // Open in new tab - user will need to log into Exotel if not already logged in
      window.open(recordingUrl, "_blank");

      alert("Recording page opened in new tab. You may need to log into your Exotel account to access it.");
    } catch (error) {
      console.error("Error opening recording:", error);
      alert("Failed to open recording. Please try again or contact support.");
    } finally {
      setLoadingRecordings((prev) => ({ ...prev, [sid]: false }));
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        p: SPACING[5],
        minHeight: "400px",
        position: "relative",
        backgroundImage: GRADIENTS.meshLight,
        borderRadius: RADIUS.xl,
      }}
    >
      {/* ── Search & Filter Bar ─────────────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          gap: SPACING[3],
          mb: SPACING[6],
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Premium Search Input */}
        <TextField
          placeholder="Search by number, name, SID, partner..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <Search
                sx={{
                  mr: 1.5,
                  color: THEME.primary,
                  fontSize: "1.25rem",
                }}
              />
            ),
          }}
          size="small"
          sx={{
            flexGrow: 1,
            minWidth: "250px",
            "& .MuiOutlinedInput-root": {
              fontFamily: TYPOGRAPHY.fontFamily,
              fontSize: TYPOGRAPHY.size.base,
              background: "#FFFFFF",
              borderRadius: RADIUS.lg,
              transition: ANIMATIONS.transition.border,
              "& fieldset": {
                borderColor: THEME.borderLight,
                transition: ANIMATIONS.transition.border,
              },
              "&:hover fieldset": {
                borderColor: THEME.borderHover,
              },
              "&.Mui-focused fieldset": {
                borderColor: THEME.primary,
                borderWidth: "2px",
                boxShadow: `0 0 0 3px ${THEME.primary}20`,
              },
            },
            "& .MuiOutlinedInput-input": {
              "&::placeholder": {
                color: THEME.textMuted,
                opacity: 1,
              },
            },
          }}
        />

        {/* Time Period Filter */}
        <FormControl
          size="small"
          sx={{
            minWidth: 170,
            "& .MuiOutlinedInput-root": {
              fontFamily: TYPOGRAPHY.fontFamily,
              fontSize: TYPOGRAPHY.size.base,
              background: "#FFFFFF",
              borderRadius: RADIUS.lg,
              transition: ANIMATIONS.transition.border,
              "& fieldset": {
                borderColor: THEME.borderLight,
                transition: ANIMATIONS.transition.border,
              },
              "&:hover fieldset": {
                borderColor: THEME.borderHover,
              },
              "&.Mui-focused fieldset": {
                borderColor: THEME.primary,
                borderWidth: "2px",
              },
            },
            "& .MuiInputLabel-root": {
              fontFamily: TYPOGRAPHY.fontFamily,
              fontSize: TYPOGRAPHY.size.sm,
              "&.Mui-focused": {
                color: THEME.primary,
              },
            },
          }}
        >
          <Select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            displayEmpty
            startAdornment={
              <FilterList
                sx={{
                  mr: 1,
                  color: THEME.primary,
                  fontSize: "1.15rem",
                }}
              />
            }
            MenuProps={{
              PaperProps: {
                sx: {
                  borderRadius: RADIUS.lg,
                  boxShadow: SHADOWS.lg,
                  border: `1px solid ${THEME.borderLight}`,
                  mt: 1,
                  "& .MuiMenuItem-root": {
                    fontFamily: TYPOGRAPHY.fontFamily,
                    fontSize: TYPOGRAPHY.size.base,
                    borderRadius: RADIUS.md,
                    mx: 0.5,
                    my: 0.25,
                    transition: ANIMATIONS.transition.fast,
                    "&:hover": {
                      background: `${THEME.primary}10`,
                    },
                    "&.Mui-selected": {
                      background: `${THEME.primary}15`,
                      color: THEME.primary,
                      fontWeight: TYPOGRAPHY.weight.semibold,
                      "&:hover": {
                        background: `${THEME.primary}20`,
                      },
                    },
                  },
                },
              },
            }}
          >
            <MenuItem value="24h">Last 24 Hours</MenuItem>
            <MenuItem value="week">Last Week</MenuItem>
            <MenuItem value="month">Last Month</MenuItem>
            <MenuItem value="all">All Time</MenuItem>
          </Select>
        </FormControl>

        {/* Call Count Badge */}
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: SPACING[1.5],
            background: GRADIENTS.primary,
            color: THEME.textOnPrimary,
            borderRadius: RADIUS.full,
            px: SPACING[4],
            py: SPACING[1.5],
            boxShadow: `${SHADOWS.primary}, 0 0 16px ${THEME.primary}18`,
            fontFamily: TYPOGRAPHY.fontFamily,
            fontSize: TYPOGRAPHY.size.sm,
            fontWeight: TYPOGRAPHY.weight.semibold,
            letterSpacing: TYPOGRAPHY.tracking.wide,
            whiteSpace: "nowrap",
            lineHeight: 1,
          }}
        >
          <span style={{ fontWeight: TYPOGRAPHY.weight.bold, fontSize: TYPOGRAPHY.size.base }}>
            {filteredLogs.length}
          </span>
          call{filteredLogs.length !== 1 ? "s" : ""} found
        </Box>
      </Box>

      {/* ── Call History Cards ───────────────────────────────────── */}
      {filteredLogs.length === 0 ? (
        /* Empty State */
        <Box
          className="animate-card-entrance"
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: SPACING[16],
            px: SPACING[6],
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              width: 88,
              height: 88,
              borderRadius: RADIUS["2xl"],
              background: `${THEME.primary}10`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: SPACING[5],
              animation: "float 3s ease-in-out infinite",
            }}
          >
            <Phone
              sx={{
                fontSize: 44,
                color: THEME.primary,
              }}
            />
          </Box>
          <Typography
            sx={{
              ...TYPOGRAPHY.h4,
              color: THEME.textPrimary,
              fontFamily: TYPOGRAPHY.fontFamily,
              mb: SPACING[2],
            }}
          >
            No calls found
          </Typography>
          <Typography
            sx={{
              ...TYPOGRAPHY.body2,
              color: THEME.textMuted,
              fontFamily: TYPOGRAPHY.fontFamily,
              maxWidth: 320,
            }}
          >
            {searchTerm
              ? "Try adjusting your search or filter"
              : "Start making calls to see them here"}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: SPACING[4] }}>
          {filteredLogs.map((log, index) => (
            <Box
              key={log.id || index}
              className={`animate-card-entrance${index < 12 ? ` stagger-${index + 1}` : ""}`}
              sx={{
                position: "relative",
                background: "rgba(255, 255, 255, 0.92)",
                borderRadius: RADIUS.xl,
                boxShadow: SHADOWS.card,
                border: `1px solid ${THEME.borderLight}`,
                overflow: "hidden",
                transition: "transform 250ms cubic-bezier(0.4,0,0.2,1), box-shadow 250ms cubic-bezier(0.4,0,0.2,1), border-color 250ms ease",
                cursor: "default",
                willChange: "transform",
                "&:hover": {
                  transform: ANIMATIONS.hover.lift,
                  boxShadow: SHADOWS.cardHover,
                  borderColor: THEME.palette.indigo200,
                },
                /* Gradient left accent bar */
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: "4px",
                  background: GRADIENTS.primary,
                  borderRadius: `${RADIUS.xl} 0 0 ${RADIUS.xl}`,
                },
              }}
            >
              {/* Card inner padding (offset for left accent) */}
              <Box sx={{ pl: SPACING[5], pr: SPACING[5], py: SPACING[4] }}>
                {/* ── Card Header ─────────────────────────────── */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: SPACING[3],
                    flexWrap: "wrap",
                    gap: SPACING[2],
                  }}
                >
                  {/* Phone number + icon + timestamp */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: SPACING[3] }}>
                    {/* Indigo gradient phone icon circle */}
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: RADIUS.lg,
                        background: GRADIENTS.primary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: SHADOWS.primary,
                        flexShrink: 0,
                      }}
                    >
                      <Phone sx={{ color: THEME.textOnPrimary, fontSize: "1.25rem" }} />
                    </Box>
                    <Box>
                      <Typography
                        sx={{
                          fontFamily: TYPOGRAPHY.fontFamilyMono,
                          fontSize: TYPOGRAPHY.size.lg,
                          fontWeight: TYPOGRAPHY.weight.bold,
                          letterSpacing: TYPOGRAPHY.tracking.tight,
                          color: THEME.textPrimary,
                          lineHeight: TYPOGRAPHY.leading.tight,
                        }}
                      >
                        {log.clientNumber}
                      </Typography>
                      <Typography
                        sx={{
                          ...TYPOGRAPHY.caption,
                          color: THEME.textMuted,
                          fontFamily: TYPOGRAPHY.fontFamily,
                          mt: "2px",
                        }}
                      >
                        {formatTimestamp(log.timestamp)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Recording button + connection badge */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: SPACING[2] }}>
                    {/* Recording Button */}
                    {log.sid && (
                      <IconButton
                        size="small"
                        onClick={() => fetchRecording(log.sid)}
                        disabled={loadingRecordings[log.sid]}
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: RADIUS.lg,
                          background: GRADIENTS.primary,
                          color: THEME.textOnPrimary,
                          boxShadow: SHADOWS.primary,
                          transition: ANIMATIONS.transition.all,
                          "&:hover": {
                            background: GRADIENTS.primary,
                            boxShadow: SHADOWS.primaryLg,
                            transform: "scale(1.08)",
                          },
                          "&:disabled": {
                            background: THEME.palette.slate200,
                            boxShadow: "none",
                            color: THEME.textMuted,
                          },
                        }}
                      >
                        {loadingRecordings[log.sid] ? (
                          <CircularProgress
                            size={18}
                            sx={{ color: THEME.textOnPrimary }}
                          />
                        ) : (
                          <PlayArrow sx={{ fontSize: "1.15rem" }} />
                        )}
                      </IconButton>
                    )}

                    {/* Connection Status Badge */}
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: SPACING[1],
                        px: SPACING[3],
                        py: SPACING[1],
                        borderRadius: RADIUS.full,
                        background: log.callConnected
                          ? GRADIENTS.success
                          : GRADIENTS.error,
                        color: THEME.textOnPrimary,
                        fontFamily: TYPOGRAPHY.fontFamily,
                        fontSize: TYPOGRAPHY.size.xs,
                        fontWeight: TYPOGRAPHY.weight.semibold,
                        letterSpacing: TYPOGRAPHY.tracking.wide,
                        lineHeight: 1,
                        boxShadow: log.callConnected
                          ? SHADOWS.success
                          : SHADOWS.error,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {/* Tiny status dot */}
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: RADIUS.full,
                          backgroundColor: "rgba(255,255,255,0.8)",
                          flexShrink: 0,
                        }}
                      />
                      {log.callConnected ? "Connected" : "Not Connected"}
                    </Box>
                  </Box>
                </Box>

                {/* ── Details Grid ────────────────────────────── */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: SPACING[4],
                    mt: SPACING[3],
                    p: SPACING[4],
                    background: "rgba(79,70,229,0.02)",
                    borderRadius: RADIUS.lg,
                    border: `1px solid ${THEME.borderLight}`,
                  }}
                >
                  {log.callType && (
                    <Box>
                      <Typography
                        sx={{
                          ...TYPOGRAPHY.overline,
                          color: THEME.textMuted,
                          fontFamily: TYPOGRAPHY.fontFamily,
                          mb: SPACING[0.5],
                        }}
                      >
                        Call Type
                      </Typography>
                      <Typography
                        sx={{
                          ...TYPOGRAPHY.body2,
                          fontWeight: TYPOGRAPHY.weight.semibold,
                          color: THEME.textPrimary,
                          fontFamily: TYPOGRAPHY.fontFamily,
                        }}
                      >
                        {log.callType}
                      </Typography>
                    </Box>
                  )}

                  {log.callerId && (
                    <Box>
                      <Typography
                        sx={{
                          ...TYPOGRAPHY.overline,
                          color: THEME.textMuted,
                          fontFamily: TYPOGRAPHY.fontFamily,
                          mb: SPACING[0.5],
                        }}
                      >
                        Caller ID
                      </Typography>
                      <Typography
                        sx={{
                          ...TYPOGRAPHY.body2,
                          fontWeight: TYPOGRAPHY.weight.semibold,
                          color: THEME.textPrimary,
                          fontFamily: TYPOGRAPHY.fontFamilyMono,
                        }}
                      >
                        {log.callerId}
                      </Typography>
                    </Box>
                  )}

                  {log.agentType && (
                    <Box>
                      <Typography
                        sx={{
                          ...TYPOGRAPHY.overline,
                          color: THEME.textMuted,
                          fontFamily: TYPOGRAPHY.fontFamily,
                          mb: SPACING[0.5],
                        }}
                      >
                        Agent Type
                      </Typography>
                      <Typography
                        sx={{
                          ...TYPOGRAPHY.body2,
                          fontWeight: TYPOGRAPHY.weight.semibold,
                          color: THEME.textPrimary,
                          fontFamily: TYPOGRAPHY.fontFamily,
                        }}
                      >
                        {log.agentType}
                      </Typography>
                    </Box>
                  )}

                  <Box>
                    <Typography
                      sx={{
                        ...TYPOGRAPHY.overline,
                        color: THEME.textMuted,
                        fontFamily: TYPOGRAPHY.fontFamily,
                        mb: SPACING[0.5],
                      }}
                    >
                      Status
                    </Typography>
                    <Typography
                      sx={{
                        ...TYPOGRAPHY.body2,
                        fontWeight: TYPOGRAPHY.weight.semibold,
                        color: THEME.textPrimary,
                        fontFamily: TYPOGRAPHY.fontFamily,
                      }}
                    >
                      {log.callConnected
                        ? log.callStatus
                        : log.notConnectedReason}
                    </Typography>
                  </Box>

                  {log.callConnected && formatDuration(log.duration) && (
                    <Box>
                      <Typography
                        sx={{
                          ...TYPOGRAPHY.overline,
                          color: THEME.textMuted,
                          fontFamily: TYPOGRAPHY.fontFamily,
                          mb: SPACING[0.5],
                        }}
                      >
                        Duration
                      </Typography>
                      <Typography
                        sx={{
                          ...TYPOGRAPHY.body2,
                          fontWeight: TYPOGRAPHY.weight.semibold,
                          color: THEME.textPrimary,
                          fontFamily: TYPOGRAPHY.fontFamilyMono,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <AccessTime
                          sx={{
                            fontSize: 14,
                            mr: 0.5,
                            color: THEME.primary,
                          }}
                        />
                        {formatDuration(log.duration)}
                      </Typography>
                    </Box>
                  )}

                  {log.sid && (
                    <Box>
                      <Typography
                        sx={{
                          ...TYPOGRAPHY.overline,
                          color: THEME.textMuted,
                          fontFamily: TYPOGRAPHY.fontFamily,
                          mb: SPACING[0.5],
                        }}
                      >
                        Call SID
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: TYPOGRAPHY.fontFamilyMono,
                          fontSize: TYPOGRAPHY.size.xs,
                          fontWeight: TYPOGRAPHY.weight.medium,
                          color: THEME.textSecondary,
                          wordBreak: "break-all",
                          lineHeight: TYPOGRAPHY.leading.normal,
                        }}
                      >
                        {log.sid}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* ── Remarks Section (card-within-card) ──────── */}
                {log.remarks && (
                  <Box
                    sx={{
                      mt: SPACING[3],
                      p: SPACING[4],
                      pl: SPACING[5],
                      background: `${THEME.palette.violet50}60`,
                      borderRadius: RADIUS.lg,
                      borderLeft: `3px solid ${THEME.palette.violet400}`,
                      position: "relative",
                    }}
                  >
                    <Typography
                      sx={{
                        ...TYPOGRAPHY.overline,
                        color: THEME.palette.violet600,
                        fontFamily: TYPOGRAPHY.fontFamily,
                        mb: SPACING[1],
                      }}
                    >
                      Remarks
                    </Typography>
                    <Typography
                      sx={{
                        ...TYPOGRAPHY.body2,
                        color: THEME.textPrimary,
                        fontFamily: TYPOGRAPHY.fontFamily,
                        fontStyle: "italic",
                        lineHeight: TYPOGRAPHY.leading.relaxed,
                      }}
                    >
                      {log.remarks}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default CallHistory;
