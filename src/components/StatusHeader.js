import React, { useState } from "react";
import {
  Paper,
  Box,
  Chip,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CoffeeIcon from "@mui/icons-material/Coffee";
import LogoutIcon from "@mui/icons-material/Logout";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import TimerIcon from "@mui/icons-material/Timer";
import { AGENT_STATUS } from "../hooks/useAgentStatus";

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

  return (
    <>
      <Paper
        elevation={2}
        sx={{
          p: 1.5,
          mb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
          bgcolor: isOnBreak ? "warning.light" : "background.paper",
        }}
      >
        {/* Status Indicator */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Chip
            label={getStatusLabel()}
            color={getStatusColor()}
            size="medium"
            sx={{ fontWeight: "bold", minWidth: 90 }}
          />

          {/* Working Time */}
          <Tooltip title="Time since login">
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <AccessTimeIcon fontSize="small" color="action" />
              <Typography
                variant="body2"
                fontFamily="monospace"
                fontWeight="medium"
                sx={{ minWidth: 70 }}
              >
                {formatDuration(workingDuration)}
              </Typography>
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
              bgcolor: "warning.dark",
              color: "warning.contrastText",
              px: 2,
              py: 0.5,
              borderRadius: 1,
            }}
          >
            <TimerIcon fontSize="small" />
            <Typography variant="body2" fontWeight="bold" fontFamily="monospace">
              Break ends in: {formatBreakTime(breakTimeRemaining)}
            </Typography>
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {isOnBreak ? (
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<PlayArrowIcon />}
              onClick={onEndBreak}
            >
              End Break
            </Button>
          ) : (
            <Tooltip title={isOnCall ? "Finish your call first to take a break" : ""}>
              <span>
                <Button
                  variant="outlined"
                  color="warning"
                  size="small"
                  startIcon={<CoffeeIcon />}
                  onClick={onStartBreak}
                  disabled={!canTakeBreak}
                >
                  Take Break
                </Button>
              </span>
            </Tooltip>
          )}

          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<LogoutIcon />}
            onClick={handleLogoutClick}
            disabled={isOnBreak}
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
      >
        <DialogTitle id="logout-dialog-title">End Your Day?</DialogTitle>
        <DialogContent>
          <DialogContentText id="logout-dialog-description">
            Are you sure you want to end your work day? You will need to start a new session
            tomorrow.
          </DialogContentText>
          <Box sx={{ mt: 2, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Today's working time:</strong> {formatDuration(workingDuration)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleLogoutConfirm} color="error" variant="contained" autoFocus>
            End Day
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default StatusHeader;
