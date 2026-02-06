import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TouchAppIcon from "@mui/icons-material/TouchApp";

/**
 * InactivityWarningModal - Warning shown before auto-logout
 *
 * This modal appears 2 minutes before the agent will be automatically
 * logged out due to inactivity. Shows a countdown timer and allows
 * the agent to confirm they're still active.
 *
 * Props:
 * - open: boolean - Whether the modal is visible
 * - onDismiss: () => void - Callback when user confirms they're active
 * - onTimeout: () => void - Callback when countdown reaches zero
 * - warningDuration: number - Seconds until timeout (default 120 = 2 mins)
 */
const InactivityWarningModal = ({ open, onDismiss, onTimeout, warningDuration = 120 }) => {
  const [secondsRemaining, setSecondsRemaining] = useState(warningDuration);

  // Reset timer when modal opens
  useEffect(() => {
    if (open) {
      setSecondsRemaining(warningDuration);
    }
  }, [open, warningDuration]);

  // Countdown timer
  useEffect(() => {
    if (!open) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open]);

  // Handle timeout
  const handleTimeout = useCallback(() => {
    onTimeout();
  }, [onTimeout]);

  // Trigger timeout when countdown reaches zero
  useEffect(() => {
    if (open && secondsRemaining === 0) {
      handleTimeout();
    }
  }, [open, secondsRemaining, handleTimeout]);

  // Format seconds to MM:SS
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Calculate progress percentage (starts at 100, goes to 0)
  const progressPercent = (secondsRemaining / warningDuration) * 100;

  // Get color based on time remaining
  const getColor = () => {
    if (secondsRemaining > 60) return "warning";
    if (secondsRemaining > 30) return "warning";
    return "error";
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
          overflow: "hidden",
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.7)",
          },
        },
      }}
    >
      {/* Progress bar at top */}
      <LinearProgress
        variant="determinate"
        value={progressPercent}
        color={getColor()}
        sx={{ height: 6 }}
      />

      <DialogTitle sx={{ textAlign: "center", pt: 3, pb: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <WarningAmberIcon
            sx={{
              fontSize: 64,
              color: secondsRemaining <= 30 ? "error.main" : "warning.main",
              animation: secondsRemaining <= 30 ? "pulse 1s infinite" : "none",
              "@keyframes pulse": {
                "0%": { opacity: 1 },
                "50%": { opacity: 0.5 },
                "100%": { opacity: 1 },
              },
            }}
          />
        </Box>
        <Typography variant="h5" component="div" fontWeight="bold">
          Are You Still There?
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ textAlign: "center" }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Due to inactivity, you will be automatically logged out in:
        </Typography>

        {/* Countdown Display */}
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: secondsRemaining <= 30 ? "error.light" : "warning.light",
            color: secondsRemaining <= 30 ? "error.contrastText" : "warning.contrastText",
            px: 4,
            py: 2,
            borderRadius: 2,
            mb: 3,
          }}
        >
          <Typography
            variant="h2"
            fontFamily="monospace"
            fontWeight="bold"
            sx={{
              letterSpacing: 2,
            }}
          >
            {formatTime(secondsRemaining)}
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Click the button below to stay logged in and continue working.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
        <Button
          variant="contained"
          color="success"
          size="large"
          onClick={onDismiss}
          startIcon={<TouchAppIcon />}
          sx={{
            px: 6,
            py: 1.5,
            fontSize: "1.1rem",
            fontWeight: "bold",
            borderRadius: 2,
          }}
        >
          I'm Still Here
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InactivityWarningModal;
