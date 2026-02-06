import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Typography,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import {
  FiberManualRecord,
  Timer,
  LocationOn,
  CheckCircle,
  Refresh,
  CloudDone,
  CloudOff,
} from "@mui/icons-material";

// Storage key for punch data persistence
const PUNCH_STORAGE_KEY = "dc_active_punch_data";

/**
 * Punch In/Out Component with Offline Support
 *
 * Features:
 * - localStorage persistence (survives page refresh)
 * - Retry logic for location fetch
 * - Visual progress feedback
 * - Offline-first design
 */
function PunchInOut({ onPunchData, visitLocation, userId }) {
  const [punchedIn, setPunchedIn] = useState(false);
  const [punchInData, setPunchInData] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Restore punch state from localStorage on mount
  useEffect(() => {
    const savedPunch = localStorage.getItem(PUNCH_STORAGE_KEY);
    if (savedPunch) {
      try {
        const parsed = JSON.parse(savedPunch);
        // Check if punch is from today
        const punchDate = new Date(parsed.punchInTime).toDateString();
        const today = new Date().toDateString();

        if (punchDate === today && parsed.status === "active") {
          setPunchedIn(true);
          setPunchInData(parsed);
          setStartTime(new Date(parsed.punchInTime).getTime());
          console.log("✅ Restored punch state from localStorage");
        } else {
          // Clear old punch data
          localStorage.removeItem(PUNCH_STORAGE_KEY);
        }
      } catch (e) {
        console.error("Error parsing saved punch data:", e);
        localStorage.removeItem(PUNCH_STORAGE_KEY);
      }
    }
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Timer effect
  useEffect(() => {
    let interval;
    if (punchedIn && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [punchedIn, startTime]);

  // Format elapsed time
  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Get current location with retry logic
  const getCurrentLocation = useCallback((attempt = 1, maxAttempts = 3) => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }

      setLoadingMessage(`Getting location (Attempt ${attempt}/${maxAttempts})...`);
      setRetryCount(attempt);

      const onSuccess = (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
        });
      };

      const onError = async (error) => {
        console.warn(`Location attempt ${attempt} failed:`, error.message);

        if (attempt < maxAttempts) {
          // Wait before retry
          setLoadingMessage(`Retrying in 2 seconds...`);
          await new Promise((r) => setTimeout(r, 2000));

          try {
            const result = await getCurrentLocation(attempt + 1, maxAttempts);
            resolve(result);
          } catch (e) {
            reject(e);
          }
        } else {
          let errorMessage = "Unable to get your location after multiple attempts";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied. Please enable location access in your browser settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable. Please ensure GPS is enabled and try again.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out after multiple attempts. Please check your internet connection and GPS signal.";
              break;
            default:
              errorMessage = `Location error: ${error.message}. Please try again.`;
          }
          reject(new Error(errorMessage));
        }
      };

      // Try high accuracy first, then fall back to low accuracy
      const tryLocation = (highAccuracy) => {
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          (error) => {
            if (highAccuracy && error.code === error.TIMEOUT) {
              // Try low accuracy on timeout
              setLoadingMessage(`Trying faster location method...`);
              tryLocation(false);
            } else {
              onError(error);
            }
          },
          {
            enableHighAccuracy: highAccuracy,
            timeout: highAccuracy ? 20000 : 15000,
            maximumAge: 10000,
          }
        );
      };

      tryLocation(true);
    });
  }, []);

  // Save punch data to localStorage
  const savePunchToStorage = (data) => {
    try {
      localStorage.setItem(PUNCH_STORAGE_KEY, JSON.stringify(data));
      console.log("✅ Punch data saved to localStorage");
    } catch (e) {
      console.error("Error saving punch data:", e);
    }
  };

  // Clear punch data from localStorage
  const clearPunchFromStorage = () => {
    try {
      localStorage.removeItem(PUNCH_STORAGE_KEY);
      console.log("✅ Punch data cleared from localStorage");
    } catch (e) {
      console.error("Error clearing punch data:", e);
    }
  };

  // Punch In
  const handlePunchIn = async () => {
    try {
      setIsLoading(true);
      setLocationError(null);
      setLoadingMessage("Getting your location...");

      const location = await getCurrentLocation();

      const punchData = {
        punchInLocation: location,
        punchInTime: new Date().toISOString(),
        status: "active",
        userId: userId,
      };

      // Save to localStorage first (offline-first)
      savePunchToStorage(punchData);

      setPunchInData(punchData);
      setStartTime(Date.now());
      setPunchedIn(true);
      setElapsedTime(0);

      alert(
        `✅ Punch In Successful!\n\n` +
        `📍 Location captured:\n` +
        `Lat: ${location.latitude.toFixed(6)}\n` +
        `Lng: ${location.longitude.toFixed(6)}\n` +
        `Accuracy: ±${location.accuracy.toFixed(0)}m\n\n` +
        `⏱️ Timer started. You can now proceed with your visit.\n\n` +
        `💾 Your punch is saved locally and will sync automatically.`
      );
    } catch (error) {
      console.error("Error during punch in:", error);
      setLocationError(error.message);
      alert(`❌ Punch In Failed\n\n${error.message}\n\nPlease try again.`);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
      setRetryCount(0);
    }
  };

  // Punch Out
  const handlePunchOut = async () => {
    try {
      setIsLoading(true);
      setLocationError(null);
      setLoadingMessage("Getting your location...");

      const location = await getCurrentLocation();

      const totalDuration = Date.now() - startTime;

      const completePunchData = {
        ...punchInData,
        punchOutLocation: location,
        punchOutTime: new Date().toISOString(),
        totalDuration: totalDuration,
        durationFormatted: formatTime(totalDuration),
        status: "completed",
      };

      // Clear from localStorage
      clearPunchFromStorage();

      // Send punch data back to parent component
      onPunchData(completePunchData);

      setPunchedIn(false);
      setPunchInData(null);
      setStartTime(null);
      setElapsedTime(0);
      setConfirmDialog(false);

      alert(
        `✅ Punch Out Successful!\n\n` +
        `⏱️ Total visit duration: ${formatTime(totalDuration)}\n\n` +
        `📍 Exit location captured:\n` +
        `Lat: ${location.latitude.toFixed(6)}\n` +
        `Lng: ${location.longitude.toFixed(6)}\n\n` +
        `You can now fill and submit your offline visit record.`
      );
    } catch (error) {
      console.error("Error during punch out:", error);
      setLocationError(error.message);
      setConfirmDialog(false);
      alert(`❌ Punch Out Failed\n\n${error.message}\n\nPlease try again.`);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
      setRetryCount(0);
    }
  };

  // Manual retry for location
  const handleRetryLocation = async () => {
    setLocationError(null);
    if (punchedIn) {
      handlePunchOut();
    } else {
      handlePunchIn();
    }
  };

  return (
    <Box
      sx={{
        p: 3,
        background: punchedIn
          ? "linear-gradient(135deg, #22c55e, #16a34a)"
          : "linear-gradient(135deg, #3b82f6, #2563eb)",
        borderRadius: "16px",
        color: "white",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <FiberManualRecord sx={{ fontSize: 32 }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Location Punch System
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {punchedIn ? "You are currently punched in" : "Punch in when you arrive at the location"}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {isOnline ? (
            <Chip
              icon={<CloudDone sx={{ color: "white !important" }} />}
              label="Online"
              size="small"
              sx={{
                bgcolor: "rgba(255,255,255,0.25)",
                color: "white",
                fontWeight: 600,
              }}
            />
          ) : (
            <Chip
              icon={<CloudOff sx={{ color: "white !important" }} />}
              label="Offline"
              size="small"
              sx={{
                bgcolor: "rgba(255,255,255,0.25)",
                color: "white",
                fontWeight: 600,
              }}
            />
          )}
          <Chip
            label={punchedIn ? "Active" : "Inactive"}
            icon={punchedIn ? <CheckCircle /> : <FiberManualRecord />}
            sx={{
              bgcolor: "rgba(255,255,255,0.25)",
              color: "white",
              fontWeight: 600,
            }}
          />
        </Box>
      </Box>

      {/* Loading State */}
      {isLoading && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            bgcolor: "rgba(255,255,255,0.2)",
            borderRadius: "12px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
            <CircularProgress size={24} sx={{ color: "white" }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {loadingMessage}
            </Typography>
          </Box>
          {retryCount > 1 && (
            <LinearProgress
              variant="determinate"
              value={(retryCount / 3) * 100}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: "rgba(255,255,255,0.3)",
                "& .MuiLinearProgress-bar": {
                  bgcolor: "white",
                },
              }}
            />
          )}
        </Box>
      )}

      {/* Error State */}
      {locationError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<Refresh />}
              onClick={handleRetryLocation}
            >
              Retry
            </Button>
          }
        >
          {locationError}
        </Alert>
      )}

      {/* Punched In State */}
      {punchedIn && (
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              bgcolor: "rgba(255,255,255,0.2)",
              p: 2,
              borderRadius: "12px",
              mb: 2,
            }}
          >
            <Timer sx={{ fontSize: 28 }} />
            <Box>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Visit Duration
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {formatTime(elapsedTime)}
              </Typography>
            </Box>
          </Box>

          {punchInData && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                bgcolor: "rgba(255,255,255,0.2)",
                p: 2,
                borderRadius: "12px",
              }}
            >
              <LocationOn sx={{ fontSize: 28 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Punch In Location
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: "monospace" }}>
                  {punchInData.punchInLocation.latitude.toFixed(6)}, {punchInData.punchInLocation.longitude.toFixed(6)}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Accuracy: ±{punchInData.punchInLocation.accuracy.toFixed(0)}m
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: "flex", gap: 2 }}>
        {!punchedIn ? (
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={isLoading ? <CircularProgress size={20} sx={{ color: "#3b82f6" }} /> : <FiberManualRecord />}
            onClick={handlePunchIn}
            disabled={isLoading}
            sx={{
              bgcolor: "white",
              color: "#3b82f6",
              fontWeight: 700,
              py: 1.5,
              fontSize: "1rem",
              "&:hover": {
                bgcolor: "#f8fafc",
              },
              "&:disabled": {
                bgcolor: "rgba(255,255,255,0.5)",
                color: "#3b82f6",
              },
            }}
          >
            {isLoading ? "GETTING LOCATION..." : "PUNCH IN"}
          </Button>
        ) : (
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={<CheckCircle />}
            onClick={() => setConfirmDialog(true)}
            disabled={isLoading}
            sx={{
              bgcolor: "white",
              color: "#22c55e",
              fontWeight: 700,
              py: 1.5,
              fontSize: "1rem",
              "&:hover": {
                bgcolor: "#f8fafc",
              },
            }}
          >
            PUNCH OUT
          </Button>
        )}
      </Box>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mt: 2, bgcolor: "rgba(255,255,255,0.2)", color: "white" }}>
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          ⚠️ MANDATORY: You must punch in when arriving at the visit location and punch out before leaving.
          {!isOnline && " Your data is saved offline and will sync when you're back online."}
        </Typography>
      </Alert>

      {/* Saved Data Indicator */}
      {punchedIn && (
        <Box
          sx={{
            mt: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            opacity: 0.8,
          }}
        >
          <CloudDone sx={{ fontSize: 16 }} />
          <Typography variant="caption">
            Punch data saved locally - safe even if you close this page
          </Typography>
        </Box>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onClose={() => !isLoading && setConfirmDialog(false)}>
        <DialogTitle>Punch Out?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to punch out? Make sure you have completed your visit.
          </Typography>
          <Typography sx={{ mt: 2, fontWeight: 600 }}>
            Visit Duration: {formatTime(elapsedTime)}
          </Typography>
          {isLoading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                {loadingMessage}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handlePunchOut}
            variant="contained"
            color="success"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={16} /> : null}
          >
            {isLoading ? "Processing..." : "Punch Out"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PunchInOut;
