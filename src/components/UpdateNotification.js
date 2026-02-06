/**
 * Update Notification Component
 *
 * Shows a full-screen overlay when a new version is being loaded.
 * This provides visual feedback to users during the auto-update process.
 */

import React from "react";
import { Box, Typography, CircularProgress, LinearProgress } from "@mui/material";
import { SystemUpdate, Refresh } from "@mui/icons-material";

const UpdateNotification = ({ message = "Updating to latest version..." }) => {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: "rgba(0, 0, 0, 0.9)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        color: "white",
      }}
    >
      {/* Animated Icon */}
      <Box
        sx={{
          position: "relative",
          mb: 4,
        }}
      >
        <SystemUpdate
          sx={{
            fontSize: 80,
            color: "#4CAF50",
            animation: "pulse 1.5s ease-in-out infinite",
            "@keyframes pulse": {
              "0%": { transform: "scale(1)", opacity: 1 },
              "50%": { transform: "scale(1.1)", opacity: 0.8 },
              "100%": { transform: "scale(1)", opacity: 1 },
            },
          }}
        />
        <Refresh
          sx={{
            position: "absolute",
            top: -10,
            right: -10,
            fontSize: 30,
            color: "#2196F3",
            animation: "spin 1s linear infinite",
            "@keyframes spin": {
              "0%": { transform: "rotate(0deg)" },
              "100%": { transform: "rotate(360deg)" },
            },
          }}
        />
      </Box>

      {/* Main Text */}
      <Typography
        variant="h4"
        fontWeight={700}
        sx={{ mb: 2, textAlign: "center" }}
      >
        New Update Available!
      </Typography>

      {/* Message */}
      <Typography
        variant="body1"
        sx={{ mb: 4, textAlign: "center", opacity: 0.8, maxWidth: 400 }}
      >
        {message}
      </Typography>

      {/* Progress Indicator */}
      <Box sx={{ width: 300, mb: 3 }}>
        <LinearProgress
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: "rgba(255,255,255,0.2)",
            "& .MuiLinearProgress-bar": {
              borderRadius: 4,
              background: "linear-gradient(90deg, #4CAF50, #2196F3)",
            },
          }}
        />
      </Box>

      {/* Sub Text */}
      <Typography
        variant="body2"
        sx={{ opacity: 0.6, textAlign: "center" }}
      >
        Please wait while we load the latest features and fixes...
      </Typography>

      {/* Loading Spinner */}
      <CircularProgress
        size={24}
        sx={{
          mt: 3,
          color: "rgba(255,255,255,0.5)",
        }}
      />
    </Box>
  );
};

export default UpdateNotification;
