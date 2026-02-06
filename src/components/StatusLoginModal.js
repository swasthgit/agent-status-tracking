import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

/**
 * StatusLoginModal - Blocking modal for agent daily login
 *
 * This modal is displayed when an agent opens their dashboard and hasn't
 * logged in for the day. They must click "Start Your Day" to proceed.
 *
 * Props:
 * - open: boolean - Whether the modal is visible
 * - agentName: string - Name of the agent for personalized greeting
 * - onStartDay: () => Promise<void> - Callback when agent starts their day
 */
const StatusLoginModal = ({ open, agentName, onStartDay }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // Update time every second
  useEffect(() => {
    if (!open) return;

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [open]);

  const handleStartDay = async () => {
    setLoading(true);
    try {
      await onStartDay();
    } catch (error) {
      console.error("Error starting day:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 2,
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
          },
        },
      }}
    >
      <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
        <Typography variant="h4" component="div" fontWeight="bold" color="primary">
          Welcome Back!
        </Typography>
        {agentName && (
          <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
            {agentName}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        {/* Date and Time Display */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 4,
            my: 3,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CalendarTodayIcon color="action" />
            <Typography variant="body1" color="text.secondary">
              {formatDate(currentTime)}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AccessTimeIcon color="action" />
            <Typography variant="body1" color="text.secondary" fontFamily="monospace">
              {formatTime(currentTime)}
            </Typography>
          </Box>
        </Box>

        {/* Information Box */}
        <Box
          sx={{
            bgcolor: "info.light",
            color: "info.contrastText",
            p: 2,
            borderRadius: 2,
            mb: 3,
          }}
        >
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Before you begin:</strong>
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2, m: 0 }}>
            <li>Your login time will be recorded for attendance tracking</li>
            <li>You will be automatically logged out at 6:00 PM</li>
            <li>10 minutes of inactivity will result in automatic logout</li>
            <li>Break time is limited to 30 minutes</li>
          </Typography>
        </Box>

        {/* Disclaimer */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", textAlign: "center" }}
        >
          By clicking "Start Your Day", you confirm your attendance and agree to status tracking
          during your work session.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleStartDay}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
          sx={{
            px: 6,
            py: 1.5,
            fontSize: "1.1rem",
            fontWeight: "bold",
            borderRadius: 2,
          }}
        >
          {loading ? "Starting..." : "Start Your Day"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StatusLoginModal;
