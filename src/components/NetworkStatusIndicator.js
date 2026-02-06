import React, { useState, useEffect } from "react";
import { Box, Typography, Slide, IconButton } from "@mui/material";
import {
  WifiOff,
  Wifi,
  CloudSync,
  Close,
  SignalWifiStatusbar4Bar,
  SignalWifiStatusbarConnectedNoInternet4,
} from "@mui/icons-material";

/**
 * NetworkStatusIndicator - Shows online/offline status and pending sync count
 *
 * Features:
 * - Real-time online/offline detection
 * - Shows pending sync operations count
 * - Auto-hides when online (after brief confirmation)
 * - Persists when offline to keep user informed
 */
const NetworkStatusIndicator = ({ showAlways = false }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);
  const [pendingSyncs, setPendingSyncs] = useState(0);
  const [justCameOnline, setJustCameOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setJustCameOnline(true);
      setShowBanner(true);

      // Hide banner after 3 seconds when back online
      setTimeout(() => {
        setShowBanner(false);
        setJustCameOnline(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
      setJustCameOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check pending syncs periodically
    const checkSyncs = () => {
      try {
        const queue = localStorage.getItem("dc_sync_queue");
        if (queue) {
          const parsed = JSON.parse(queue);
          const pending = parsed.filter(item => item.status === "pending");
          setPendingSyncs(pending.length);
        } else {
          setPendingSyncs(0);
        }
      } catch (e) {
        setPendingSyncs(0);
      }
    };

    checkSyncs();
    const interval = setInterval(checkSyncs, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Always show if offline or has pending syncs
  const shouldShow = showAlways || showBanner || !isOnline || pendingSyncs > 0;

  if (!shouldShow) return null;

  return (
    <Slide direction="down" in={shouldShow} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.5,
          py: 1,
          px: 2,
          background: isOnline
            ? justCameOnline
              ? "linear-gradient(135deg, #10b981, #059669)"
              : "linear-gradient(135deg, #3b82f6, #2563eb)"
            : "linear-gradient(135deg, #ef4444, #dc2626)",
          color: "white",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
        }}
      >
        {isOnline ? (
          justCameOnline ? (
            <>
              <Wifi sx={{ fontSize: 20 }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Back Online! Syncing data...
              </Typography>
            </>
          ) : pendingSyncs > 0 ? (
            <>
              <CloudSync sx={{ fontSize: 20, animation: "spin 2s linear infinite" }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Syncing {pendingSyncs} pending operation{pendingSyncs > 1 ? "s" : ""}...
              </Typography>
            </>
          ) : (
            <>
              <SignalWifiStatusbar4Bar sx={{ fontSize: 20 }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Connected
              </Typography>
            </>
          )
        ) : (
          <>
            <SignalWifiStatusbarConnectedNoInternet4 sx={{ fontSize: 20 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              No Internet Connection - Working Offline
            </Typography>
            {pendingSyncs > 0 && (
              <Typography variant="caption" sx={{ opacity: 0.9, ml: 1 }}>
                ({pendingSyncs} pending sync{pendingSyncs > 1 ? "s" : ""})
              </Typography>
            )}
          </>
        )}

        {isOnline && !justCameOnline && (
          <IconButton
            size="small"
            onClick={() => setShowBanner(false)}
            sx={{ color: "white", ml: 1, p: 0.5 }}
          >
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </Box>
    </Slide>
  );
};

export default NetworkStatusIndicator;
