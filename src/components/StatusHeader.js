import React, { useState } from "react";
import {
  Paper,
  Box,
  Typography,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  Tooltip,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CoffeeIcon from "@mui/icons-material/Coffee";
import LogoutIcon from "@mui/icons-material/Logout";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import TimerIcon from "@mui/icons-material/Timer";
import { AGENT_STATUS } from "../hooks/useAgentStatus";
import { THEME, SHADOWS, TYPOGRAPHY, RADIUS, GRADIENTS, GLASS, ANIMATIONS, STATUS_COLORS } from "../theme/theme";
import "../styles/animations.css";

/**
 * StatusHeader - Displays agent's current status with controls
 *
 * Shows:
 * - Current status indicator (Login/Break/On Call)
 * - Working time counter (time since login)
 * - Break button (with remaining time when on break)
 * - Logout button with confirmation
 *
 * Props:
 * - status: string - Current agent status
 * - workingDuration: number - Seconds worked since login
 * - breakTimeRemaining: number - Seconds remaining in break (0 if not on break)
 * - onStartBreak: () => void - Callback to start break
 * - onEndBreak: () => void - Callback to end break
 * - onLogout: () => void - Callback to logout
 */
const StatusHeader = ({
  status,
  workingDuration,
  breakTimeRemaining,
  onStartBreak,
  onEndBreak,
  onLogout,
}) => {
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // Format seconds to HH:MM:SS
  const formatDuration = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Format break time remaining (MM:SS)
  const formatBreakTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Get status chip color
  const getStatusColor = () => {
    switch (status) {
      case AGENT_STATUS.LOGIN:
      case "Idle": // Legacy status - treat as active
      case "Available": // Legacy status
        return "success";
      case AGENT_STATUS.ON_CALL:
        return "primary";
      case AGENT_STATUS.BREAK:
        return "warning";
      case AGENT_STATUS.LOGOUT:
        return "error";
      default:
        return "default";
    }
  };

  // Get status label
  const getStatusLabel = () => {
    switch (status) {
      case AGENT_STATUS.LOGIN:
      case "Idle": // Legacy status - show as Active
      case "Available": // Legacy status
        return "Active";
      case AGENT_STATUS.ON_CALL:
        return "On Call";
      case AGENT_STATUS.BREAK:
        return "On Break";
      case AGENT_STATUS.LOGOUT:
        return "Logged Out";
      default:
        return status || "Unknown";
    }
  };

  // Get status theme tokens for the current status
  const getStatusTheme = () => {
    switch (status) {
      case AGENT_STATUS.LOGIN:
      case "Idle":
      case "Available":
        return STATUS_COLORS.available;
      case AGENT_STATUS.ON_CALL:
        return STATUS_COLORS.onCall;
      case AGENT_STATUS.BREAK:
        return STATUS_COLORS.break;
      default:
        return STATUS_COLORS.offline;
    }
  };

  const isOnBreak = status === AGENT_STATUS.BREAK;
  const isLoggedOut = status === AGENT_STATUS.LOGOUT;
  const isOnCall = status === AGENT_STATUS.ON_CALL;
  // Break can only be taken when in Login/Idle/Available status
  const canTakeBreak = status === AGENT_STATUS.LOGIN || status === "Idle" || status === "Available";

  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
  };

  const handleLogoutConfirm = () => {
    setLogoutDialogOpen(false);
    onLogout();
  };

  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
  };

  if (isLoggedOut) {
    return null; // Don't show header if logged out
  }

  const statusTheme = getStatusTheme();

  // Split formatted duration into individual digits for styled rendering
  const durationStr = formatDuration(workingDuration);

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2 },
          mb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
          // Glassmorphism background
          bgcolor: isOnBreak
            ? "rgba(245, 158, 11, 0.08)"
            : "rgba(255, 255, 255, 0.95)",
          borderRadius: RADIUS.xl,
          border: `1px solid ${isOnBreak ? "rgba(245, 158, 11, 0.2)" : "rgba(255, 255, 255, 0.5)"}`,
          boxShadow: SHADOWS.lg,
          position: "relative",
          overflow: "hidden",
          animation: "fadeInDown 400ms cubic-bezier(0, 0, 0.2, 1) both",
          transition: "background-color 250ms ease, border-color 250ms ease, box-shadow 250ms ease",
          // Gradient bottom border
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: isOnBreak
              ? GRADIENTS.warning
              : GRADIENTS.headerBar,
            opacity: 0.8,
          },
        }}
      >
        {/* Status Indicator + Working Time */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
          {/* Custom Status Badge */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1.8,
              py: 0.7,
              borderRadius: RADIUS.full,
              background: statusTheme.bg,
              border: `1px solid ${statusTheme.color}25`,
              transition: ANIMATIONS.transition.all,
            }}
          >
            {/* Glowing pulsing dot */}
            <Box
              sx={{
                position: "relative",
                width: 10,
                height: 10,
                flexShrink: 0,
              }}
            >
              {/* Ping ring */}
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  bgcolor: statusTheme.color,
                  animation: "statusPing 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
                }}
              />
              {/* Solid dot */}
              <Box
                sx={{
                  position: "relative",
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: statusTheme.color,
                  boxShadow: statusTheme.glow,
                }}
              />
            </Box>
            <Typography
              sx={{
                fontFamily: TYPOGRAPHY.fontFamily,
                fontWeight: TYPOGRAPHY.weight.semibold,
                fontSize: TYPOGRAPHY.size.sm,
                letterSpacing: TYPOGRAPHY.tracking.wide,
                color: statusTheme.color,
                lineHeight: 1,
                userSelect: "none",
              }}
            >
              {getStatusLabel()}
            </Typography>
          </Box>

          {/* Working Time Display */}
          <Tooltip title="Time since login">
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <AccessTimeIcon
                sx={{
                  fontSize: 18,
                  color: THEME.textSecondary,
                  animation: "spin 8s linear infinite",
                  opacity: 0.7,
                }}
              />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "2px",
                }}
              >
                {durationStr.split("").map((char, idx) => (
                  <Typography
                    key={idx}
                    component="span"
                    sx={{
                      fontFamily: TYPOGRAPHY.fontFamilyMono,
                      fontWeight: TYPOGRAPHY.weight.bold,
                      fontSize: { xs: TYPOGRAPHY.size.md, sm: TYPOGRAPHY.size.lg },
                      letterSpacing: TYPOGRAPHY.tracking.tight,
                      color: THEME.textPrimary,
                      lineHeight: 1,
                      ...(char !== ":" ? {
                        bgcolor: THEME.palette.indigo50,
                        borderRadius: RADIUS.sm,
                        px: 0.6,
                        py: 0.3,
                        minWidth: "1.4em",
                        textAlign: "center",
                        display: "inline-block",
                        border: `1px solid ${THEME.palette.indigo100}60`,
                      } : {
                        color: THEME.textMuted,
                        px: 0.15,
                        fontWeight: TYPOGRAPHY.weight.bold,
                      }),
                    }}
                  >
                    {char}
                  </Typography>
                ))}
              </Box>
            </Box>
          </Tooltip>
        </Box>

        {/* Break Info (when on break) */}
        {isOnBreak && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              background: GRADIENTS.warning,
              color: "#FFFFFF",
              px: 2,
              py: 0.8,
              borderRadius: RADIUS.full,
              boxShadow: SHADOWS.warning,
              animation: "pulseGlowWarning 2s ease-in-out infinite",
              transition: ANIMATIONS.transition.all,
            }}
          >
            <TimerIcon
              sx={{
                fontSize: 18,
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
            <Typography
              sx={{
                fontFamily: TYPOGRAPHY.fontFamilyMono,
                fontWeight: TYPOGRAPHY.weight.bold,
                fontSize: TYPOGRAPHY.size.sm,
                letterSpacing: TYPOGRAPHY.tracking.wide,
                lineHeight: 1,
              }}
            >
              Break ends in: {formatBreakTime(breakTimeRemaining)}
            </Typography>
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {isOnBreak ? (
            /* End Break Button - emerald gradient with glow */
            <Button
              variant="contained"
              size="small"
              startIcon={
                <PlayArrowIcon
                  sx={{
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
              }
              onClick={onEndBreak}
              sx={{
                borderRadius: RADIUS.lg,
                textTransform: "none",
                fontWeight: TYPOGRAPHY.weight.semibold,
                fontSize: TYPOGRAPHY.size.sm,
                fontFamily: TYPOGRAPHY.fontFamily,
                letterSpacing: TYPOGRAPHY.tracking.tight,
                background: GRADIENTS.success,
                color: "#FFFFFF",
                border: "none",
                boxShadow: SHADOWS.success,
                px: 2.5,
                py: 0.8,
                transition: ANIMATIONS.transition.all,
                "&:hover": {
                  background: GRADIENTS.success,
                  boxShadow: SHADOWS.glowSuccess,
                  transform: ANIMATIONS.hover.liftSm,
                },
                "&:active": {
                  transform: "translateY(0) scale(0.98)",
                },
              }}
            >
              End Break
            </Button>
          ) : (
            <Tooltip title={isOnCall ? "Finish your call first to take a break" : ""}>
              <span>
                {/* Take Break Button - outlined with amber gradient border */}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={
                    <CoffeeIcon
                      sx={{
                        transition: ANIMATIONS.transition.all,
                      }}
                    />
                  }
                  onClick={onStartBreak}
                  disabled={!canTakeBreak}
                  sx={{
                    borderRadius: RADIUS.lg,
                    textTransform: "none",
                    fontWeight: TYPOGRAPHY.weight.semibold,
                    fontSize: TYPOGRAPHY.size.sm,
                    fontFamily: TYPOGRAPHY.fontFamily,
                    letterSpacing: TYPOGRAPHY.tracking.tight,
                    color: THEME.palette.amber600,
                    borderColor: THEME.palette.amber400,
                    borderWidth: "1.5px",
                    px: 2.5,
                    py: 0.8,
                    transition: ANIMATIONS.transition.all,
                    "&:hover": {
                      background: GRADIENTS.warning,
                      color: "#FFFFFF",
                      borderColor: "transparent",
                      boxShadow: SHADOWS.warning,
                      transform: ANIMATIONS.hover.liftSm,
                      "& .MuiButton-startIcon .MuiSvgIcon-root": {
                        animation: "float 2s ease-in-out infinite",
                      },
                    },
                    "&:active": {
                      transform: "translateY(0) scale(0.98)",
                    },
                    "&.Mui-disabled": {
                      opacity: 0.45,
                      borderColor: THEME.palette.slate300,
                      color: THEME.palette.slate400,
                    },
                  }}
                >
                  Take Break
                </Button>
              </span>
            </Tooltip>
          )}

          {/* End Day Button - outlined with rose border */}
          <Button
            variant="outlined"
            size="small"
            startIcon={<LogoutIcon />}
            onClick={handleLogoutClick}
            disabled={isOnBreak}
            sx={{
              borderRadius: RADIUS.lg,
              textTransform: "none",
              fontWeight: TYPOGRAPHY.weight.semibold,
              fontSize: TYPOGRAPHY.size.sm,
              fontFamily: TYPOGRAPHY.fontFamily,
              letterSpacing: TYPOGRAPHY.tracking.tight,
              color: THEME.palette.rose500,
              borderColor: THEME.palette.rose300,
              borderWidth: "1.5px",
              px: 2.5,
              py: 0.8,
              transition: ANIMATIONS.transition.all,
              "&:hover": {
                background: GRADIENTS.error,
                color: "#FFFFFF",
                borderColor: "transparent",
                boxShadow: SHADOWS.error,
                transform: ANIMATIONS.hover.liftSm,
              },
              "&:active": {
                transform: "translateY(0) scale(0.98)",
              },
              "&.Mui-disabled": {
                opacity: 0.45,
                borderColor: THEME.palette.slate300,
                color: THEME.palette.slate400,
              },
            }}
          >
            End Day
          </Button>
        </Box>
      </Paper>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={handleLogoutCancel}
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: RADIUS["2xl"],
            boxShadow: SHADOWS["2xl"],
            border: `1px solid ${THEME.palette.indigo100}30`,
            bgcolor: "rgba(255, 255, 255, 0.98)",
            overflow: "hidden",
            minWidth: { xs: 280, sm: 400 },
          },
        }}
        slotProps={{
          backdrop: {
            sx: {
              bgcolor: "rgba(15, 23, 42, 0.3)",
            },
          },
        }}
      >
        {/* Gradient Header Bar */}
        <Box
          sx={{
            background: GRADIENTS.primary,
            px: 3,
            py: 2,
          }}
        >
          <Typography
            id="logout-dialog-title"
            sx={{
              fontFamily: TYPOGRAPHY.fontFamily,
              fontWeight: TYPOGRAPHY.weight.bold,
              fontSize: TYPOGRAPHY.size.lg,
              letterSpacing: TYPOGRAPHY.tracking.tight,
              color: "#FFFFFF",
              lineHeight: TYPOGRAPHY.leading.tight,
            }}
          >
            End Your Day?
          </Typography>
        </Box>

        <DialogContent sx={{ px: 3, pt: 2.5, pb: 1 }}>
          <Typography
            id="logout-dialog-description"
            sx={{
              fontFamily: TYPOGRAPHY.fontFamily,
              fontSize: TYPOGRAPHY.size.base,
              color: THEME.textSecondary,
              lineHeight: TYPOGRAPHY.leading.relaxed,
            }}
          >
            Are you sure you want to end your work day? You will need to start a new session
            tomorrow.
          </Typography>
          {/* Working Time Display Card */}
          <Box
            sx={{
              mt: 2.5,
              p: 2,
              bgcolor: THEME.palette.indigo50,
              borderRadius: RADIUS.lg,
              border: `1px solid ${THEME.palette.indigo100}`,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <AccessTimeIcon
              sx={{
                fontSize: 20,
                color: THEME.primary,
                opacity: 0.8,
              }}
            />
            <Box>
              <Typography
                sx={{
                  fontFamily: TYPOGRAPHY.fontFamily,
                  fontSize: TYPOGRAPHY.size.xs,
                  fontWeight: TYPOGRAPHY.weight.semibold,
                  letterSpacing: TYPOGRAPHY.tracking.wider,
                  color: THEME.palette.indigo400,
                  textTransform: "uppercase",
                  lineHeight: 1,
                  mb: 0.5,
                }}
              >
                Today's Working Time
              </Typography>
              <Typography
                sx={{
                  fontFamily: TYPOGRAPHY.fontFamilyMono,
                  fontSize: TYPOGRAPHY.size.xl,
                  fontWeight: TYPOGRAPHY.weight.bold,
                  color: THEME.primary,
                  letterSpacing: TYPOGRAPHY.tracking.tight,
                  lineHeight: 1,
                }}
              >
                {formatDuration(workingDuration)}
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, gap: 1 }}>
          <Button
            onClick={handleLogoutCancel}
            sx={{
              borderRadius: RADIUS.lg,
              textTransform: "none",
              fontWeight: TYPOGRAPHY.weight.semibold,
              fontSize: TYPOGRAPHY.size.base,
              fontFamily: TYPOGRAPHY.fontFamily,
              letterSpacing: TYPOGRAPHY.tracking.tight,
              color: THEME.palette.slate600,
              px: 2.5,
              transition: ANIMATIONS.transition.all,
              "&:hover": {
                bgcolor: THEME.palette.slate100,
                color: THEME.primary,
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleLogoutConfirm}
            variant="contained"
            autoFocus
            sx={{
              borderRadius: RADIUS.lg,
              textTransform: "none",
              fontWeight: TYPOGRAPHY.weight.semibold,
              fontSize: TYPOGRAPHY.size.base,
              fontFamily: TYPOGRAPHY.fontFamily,
              letterSpacing: TYPOGRAPHY.tracking.tight,
              background: GRADIENTS.error,
              color: "#FFFFFF",
              border: "none",
              boxShadow: SHADOWS.error,
              px: 3,
              transition: ANIMATIONS.transition.all,
              "&:hover": {
                background: GRADIENTS.error,
                boxShadow: SHADOWS.glowError,
                transform: ANIMATIONS.hover.liftSm,
              },
              "&:active": {
                transform: "translateY(0) scale(0.98)",
              },
            }}
          >
            End Day
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default StatusHeader;
