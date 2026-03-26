import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Divider,
} from "@mui/material";
import {
  PlayArrow,
  Stop,
  LocationOn,
  Timer,
  TrendingUp,
  AddLocation,
  FlagCircle,
} from "@mui/icons-material";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDocs,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { calculateChainDistance, calculateHaversine } from "../services/googleMapsService";
import { REIMBURSEMENT_CONFIG, calculateReimbursement } from "../config/reimbursementConfig";

/**
 * Enhanced Trip Tracker Component with Stops/Milestones
 * DC agents can mark stops during their journey
 */
function TripTrackerEnhanced({ agentId, agentCollection }) {
  const [activeTrip, setActiveTrip] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [locationError, setLocationError] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [stopDialog, setStopDialog] = useState(false);
  const [stopNotes, setStopNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [addingStop, setAddingStop] = useState(false);

  // Listen to active trip from Firestore
  useEffect(() => {
    if (!agentId || !agentCollection) return;

    const tripsRef = collection(db, agentCollection, agentId, "trips");
    const activeTripsQuery = query(
      tripsRef,
      where("status", "==", "active"),
      orderBy("startTime", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(
      activeTripsQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const tripDoc = snapshot.docs[0];
          setActiveTrip({
            id: tripDoc.id,
            ...tripDoc.data(),
          });
        } else {
          setActiveTrip(null);
          setElapsedTime(0);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to active trips:", error);
        setLocationError("Failed to load trip data. Please refresh the page.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [agentId, agentCollection]);

  // Calculate elapsed time from Firestore timestamp
  useEffect(() => {
    let interval;
    if (activeTrip && activeTrip.startTime) {
      const startTimestamp = activeTrip.startTime.toDate();

      const updateElapsed = () => {
        const now = new Date();
        const elapsed = now - startTimestamp;
        setElapsedTime(elapsed);
      };

      updateElapsed();
      interval = setInterval(updateElapsed, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTrip]);

  // Format elapsed time
  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
  };

  // Get current location with fallback and retry logic
  const getCurrentLocation = (retryCount = 0) => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      // First try: High accuracy with 30s timeout
      const tryHighAccuracy = () => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date().toISOString(),
            });
          },
          (error) => {
            // If high accuracy fails, try low accuracy mode
            if (retryCount === 0) {
              console.log("High accuracy failed, trying low accuracy mode...");
              tryLowAccuracy();
            } else {
              let errorMessage = "Unable to get location";
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  errorMessage = "Location permission denied. Please enable location access in your browser settings.";
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMessage = "Location unavailable. Please ensure GPS is enabled and you have a clear view of the sky.";
                  break;
                case error.TIMEOUT:
                  errorMessage = "Location request timed out. Please try again or move to an area with better GPS signal.";
                  break;
                default:
                  errorMessage = "Unknown location error. Please try again.";
              }
              reject(new Error(errorMessage));
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 30000, // Increased to 30 seconds
            maximumAge: 5000, // Allow cached location up to 5 seconds old
          }
        );
      };

      // Fallback: Low accuracy mode (faster, less precise)
      const tryLowAccuracy = () => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date().toISOString(),
            });
          },
          (error) => {
            let errorMessage = "Unable to get location";
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = "Location permission denied. Please enable location access in your browser settings.";
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = "Location unavailable. Please ensure GPS is enabled.";
                break;
              case error.TIMEOUT:
                errorMessage = "Location request timed out. Please try again.";
                break;
              default:
                errorMessage = "Unknown location error. Please try again.";
            }
            reject(new Error(errorMessage));
          },
          {
            enableHighAccuracy: false, // Use network/WiFi location (faster)
            timeout: 15000, // 15 seconds for low accuracy
            maximumAge: 10000, // Allow cached location up to 10 seconds old
          }
        );
      };

      // Start with high accuracy
      tryHighAccuracy();
    });
  };

  // Start trip
  // Auto-close any orphaned active trips (e.g., agent forgot to end trip yesterday)
  const autoCloseOrphanedTrips = async (currentLocation) => {
    try {
      const tripsRef = collection(db, agentCollection, agentId, "trips");
      const activeTripsQuery = query(tripsRef, where("status", "==", "active"));
      const activeTripsSnap = await getDocs(activeTripsQuery);

      if (activeTripsSnap.empty) return 0;

      let closedCount = 0;
      for (const tripDoc of activeTripsSnap.docs) {
        const tripData = tripDoc.data();
        const startTime = tripData.startTime?.toDate?.() || new Date();
        const endTime = new Date();
        const totalDuration = endTime - startTime;

        // Calculate haversine distance from start to current location
        let totalDistance = 0;
        if (tripData.startLocation?.latitude && currentLocation?.latitude) {
          const locations = [
            tripData.startLocation,
            ...(tripData.stops || []).map((s) => s.location),
            currentLocation,
          ];
          for (let i = 0; i < locations.length - 1; i++) {
            if (locations[i]?.latitude && locations[i + 1]?.latitude) {
              totalDistance += parseFloat(
                calculateDistance(
                  locations[i].latitude,
                  locations[i].longitude,
                  locations[i + 1].latitude,
                  locations[i + 1].longitude
                )
              );
            }
          }
        }

        const tripRef = doc(db, agentCollection, agentId, "trips", tripDoc.id);
        await updateDoc(tripRef, {
          endLocation: currentLocation,
          endTime: serverTimestamp(),
          totalDistance: parseFloat(totalDistance.toFixed(2)),
          totalDuration,
          status: "completed",
          autoEnded: true,
          autoEndReason: "New trip started without ending previous trip",
          updatedAt: serverTimestamp(),
        });
        closedCount++;
      }
      return closedCount;
    } catch (error) {
      console.error("Error auto-closing orphaned trips:", error);
      return 0;
    }
  };

  const handleStartTrip = async () => {
    try {
      setLocationError(null);
      setLoading(true);
      const location = await getCurrentLocation();

      // Auto-close any previous active trips before starting a new one
      const closedCount = await autoCloseOrphanedTrips(location);
      if (closedCount > 0) {
        console.log(`Auto-closed ${closedCount} orphaned active trip(s)`);
      }

      const tripData = {
        agentId,
        startLocation: location,
        startTime: serverTimestamp(),
        status: "active",
        stops: [],
        totalStops: 0,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, agentCollection, agentId, "trips"), tripData);

      alert(
        closedCount > 0
          ? `Previous trip was auto-ended. New trip started! You can now add stops during your journey.`
          : "Trip started! You can now add stops during your journey."
      );
    } catch (error) {
      console.error("Error starting trip:", error);
      setLocationError(error.message);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add stop/milestone during trip
  const handleAddStop = async () => {
    try {
      setLocationError(null);
      setAddingStop(true);
      const stopLocation = await getCurrentLocation();

      // Calculate distance from last location (either start or last stop)
      const lastLocation =
        activeTrip.stops && activeTrip.stops.length > 0
          ? activeTrip.stops[activeTrip.stops.length - 1].location
          : activeTrip.startLocation;

      const distanceFromLast = calculateDistance(
        lastLocation.latitude,
        lastLocation.longitude,
        stopLocation.latitude,
        stopLocation.longitude
      );

      // Calculate time from trip start
      const startTime = activeTrip.startTime.toDate();
      const stopTime = new Date();
      const timeFromStart = stopTime - startTime;

      const stopData = {
        stopNumber: (activeTrip.stops?.length || 0) + 1,
        location: stopLocation,
        time: stopTime.toISOString(), // Use ISO string instead of serverTimestamp
        timeFromStart: timeFromStart,
        distanceFromLast: parseFloat(distanceFromLast),
        notes: stopNotes.trim() || "",
      };

      // Update trip document
      const tripRef = doc(db, agentCollection, agentId, "trips", activeTrip.id);
      await updateDoc(tripRef, {
        stops: arrayUnion(stopData),
        totalStops: (activeTrip.stops?.length || 0) + 1,
        updatedAt: serverTimestamp(),
      });

      setStopDialog(false);
      setStopNotes("");
      alert(`Stop ${stopData.stopNumber} recorded successfully!`);
    } catch (error) {
      console.error("Error adding stop:", error);
      setLocationError(error.message);
      alert("Failed to add stop: " + error.message);
    } finally {
      setAddingStop(false);
    }
  };

  // End trip
  const handleEndTrip = async () => {
    try {
      setLocationError(null);
      setLoading(true);
      const endLocation = await getCurrentLocation();

      // Calculate total Haversine distance (including all stops) - kept for backward compatibility
      let totalDistance = 0;
      const locations = [
        activeTrip.startLocation,
        ...(activeTrip.stops || []).map((s) => s.location),
        endLocation,
      ];

      for (let i = 0; i < locations.length - 1; i++) {
        const dist = parseFloat(
          calculateDistance(
            locations[i].latitude,
            locations[i].longitude,
            locations[i + 1].latitude,
            locations[i + 1].longitude
          )
        );
        totalDistance += dist;
      }

      const startTime = activeTrip.startTime.toDate();
      const endTime = new Date();
      const totalDuration = endTime - startTime;

      // --- ENHANCED: Fetch clinic visits during this trip and calculate road distance ---
      let visitLocations = [];
      let routeResult = null;
      let reimbursementData = null;

      try {
        // Fetch visitLogs that occurred during this trip
        const visitLogsRef = collection(db, agentCollection, agentId, "visitLogs");
        const visitLogsSnap = await getDocs(visitLogsRef);

        // Filter visits that occurred during this trip's time window
        const tripStartMs = startTime.getTime();
        const tripEndMs = endTime.getTime();

        const tripsVisits = visitLogsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((visit) => {
            const visitTime = visit.punchInTime
              ? new Date(visit.punchInTime).getTime()
              : visit.createdAt?.toDate?.()
              ? visit.createdAt.toDate().getTime()
              : 0;
            return visitTime >= tripStartMs && visitTime <= tripEndMs;
          })
          .sort((a, b) => {
            const timeA = new Date(a.punchInTime || 0).getTime();
            const timeB = new Date(b.punchInTime || 0).getTime();
            return timeA - timeB;
          });

        visitLocations = tripsVisits
          .filter((v) => v.punchInLocation?.latitude && v.punchInLocation?.longitude)
          .map((v) => ({
            visitLogId: v.id,
            clinicCode: v.clinicCode || v.partnerName || "Visit",
            punchInLocation: v.punchInLocation,
            punchInTime: v.punchInTime,
          }));

        // Build waypoints chain: Start → Clinic1 → Clinic2 → ... → End
        const waypoints = [
          {
            lat: activeTrip.startLocation.latitude,
            lng: activeTrip.startLocation.longitude,
            label: "Trip Start",
          },
          ...visitLocations.map((v) => ({
            lat: v.punchInLocation.latitude,
            lng: v.punchInLocation.longitude,
            label: v.clinicCode,
          })),
          {
            lat: endLocation.latitude,
            lng: endLocation.longitude,
            label: "Trip End",
          },
        ];

        // Calculate road distance via Google Maps API (chain calculation)
        if (waypoints.length >= 2) {
          routeResult = await calculateChainDistance(waypoints);

          // Calculate reimbursement based on road distance
          const roadDistance = routeResult.allSegmentsSuccess
            ? routeResult.summary.roadTotalKm
            : null;

          reimbursementData = {
            ratePerKm: REIMBURSEMENT_CONFIG.ratePerKm,
            calculatedAmount: roadDistance ? calculateReimbursement(roadDistance) : null,
            calculatedAt: new Date().toISOString(),
            status: "calculated",
          };
        }
      } catch (routeError) {
        console.error("Error calculating road distance (trip will still be saved):", routeError);
      }

      // Save trip with both Haversine and road distance data
      const tripRef = doc(db, agentCollection, agentId, "trips", activeTrip.id);
      const updateData = {
        endLocation,
        endTime: serverTimestamp(),
        totalDistance: parseFloat(totalDistance.toFixed(2)), // Haversine (backward compatible)
        totalDuration: totalDuration,
        status: "completed",
        updatedAt: serverTimestamp(),
      };

      // Add enhanced route data if available
      if (visitLocations.length > 0) {
        updateData.visitLocations = visitLocations;
      }
      if (routeResult) {
        updateData.routeSegments = routeResult.segments;
        updateData.distanceSummary = routeResult.summary;
        updateData.googleMapsStatus = routeResult.allSegmentsSuccess ? "success" : "partial";
      }
      if (reimbursementData) {
        updateData.reimbursement = reimbursementData;
      }

      await updateDoc(tripRef, updateData);

      setActiveTrip(null);
      setElapsedTime(0);
      setConfirmDialog(false);

      // Build completion message
      const roadDistanceKm = routeResult?.allSegmentsSuccess
        ? routeResult.summary.roadTotalKm
        : null;
      const reimbursementAmt = reimbursementData?.calculatedAmount;
      const clinicCount = visitLocations.length;

      let message = `Trip completed!\n\n`;
      message += `Straight-line Distance: ${totalDistance.toFixed(2)} km\n`;
      if (roadDistanceKm !== null) {
        message += `Road Distance: ${roadDistanceKm} km\n`;
        message += `Estimated Reimbursement: ${REIMBURSEMENT_CONFIG.currencySymbol}${reimbursementAmt}\n`;
      }
      message += `Clinics Visited: ${clinicCount}\n`;
      message += `Total Stops: ${activeTrip.stops?.length || 0}\n`;
      message += `Duration: ${formatTime(totalDuration)}`;

      alert(message);
    } catch (error) {
      console.error("Error ending trip:", error);
      setLocationError(error.message);
      alert("Failed to end trip: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !activeTrip) {
    return (
      <Card
        sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        }}
      >
        <CardContent sx={{ textAlign: "center", py: 3 }}>
          <Typography>Loading trip tracker...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Card
        sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          mb: 2,
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 1.5, sm: 2 },
              mb: { xs: 2, sm: 3 },
              flexWrap: "wrap",
            }}
          >
            <TrendingUp sx={{ fontSize: { xs: 28, sm: 32 } }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, fontSize: { xs: "1.1rem", sm: "1.25rem" } }}
              >
                Trip Tracker
              </Typography>
              <Typography
                variant="body2"
                sx={{ opacity: 0.9, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
              >
                Track your journey with stops
              </Typography>
            </Box>
            <Chip
              label={activeTrip ? "Active" : "Inactive"}
              sx={{
                bgcolor: activeTrip ? "#22c55e" : "rgba(255,255,255,0.2)",
                color: "white",
                fontWeight: 600,
                px: { xs: 1.5, sm: 2 },
                fontSize: { xs: "0.75rem", sm: "0.8125rem" },
              }}
            />
          </Box>

          {locationError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {locationError}
            </Alert>
          )}

          {activeTrip && (
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 1.5, sm: 2 },
                  bgcolor: "rgba(255,255,255,0.15)",
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: "12px",
                  mb: { xs: 1.5, sm: 2 },
                }}
              >
                <Timer sx={{ fontSize: { xs: 28, sm: 32 } }} />
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ opacity: 0.9, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                  >
                    Trip Duration
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, fontSize: { xs: "1.75rem", sm: "2.125rem" } }}
                  >
                    {formatTime(elapsedTime)}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 1.5, sm: 2 },
                  bgcolor: "rgba(255,255,255,0.15)",
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: "12px",
                }}
              >
                <FlagCircle sx={{ fontSize: { xs: 28, sm: 32 } }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{ opacity: 0.9, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                  >
                    Stops Recorded
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, fontSize: { xs: "1.75rem", sm: "2.125rem" } }}
                  >
                    {activeTrip.stops?.length || 0}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          <Box sx={{ display: "flex", gap: { xs: 1.5, sm: 2 }, flexWrap: "wrap" }}>
            {!activeTrip ? (
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<PlayArrow />}
                onClick={handleStartTrip}
                disabled={loading}
                sx={{
                  bgcolor: "white",
                  color: "#667eea",
                  fontWeight: 700,
                  py: { xs: 1.25, sm: 1.5 },
                  minHeight: "52px", // Better touch target for mobile
                  fontSize: "16px", // Prevents iOS zoom
                  "&:hover": {
                    bgcolor: "#f8fafc",
                  },
                }}
              >
                {loading ? "STARTING..." : "START TRIP"}
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<AddLocation />}
                  onClick={() => setStopDialog(true)}
                  disabled={loading || addingStop}
                  sx={{
                    bgcolor: "white",
                    color: "#667eea",
                    fontWeight: 700,
                    py: { xs: 1.25, sm: 1.5 },
                    minHeight: "52px", // Better touch target for mobile
                    fontSize: "16px", // Prevents iOS zoom
                    "&:hover": {
                      bgcolor: "#f8fafc",
                    },
                  }}
                >
                  {addingStop ? "ADDING..." : "ADD STOP"}
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<Stop />}
                  onClick={() => setConfirmDialog(true)}
                  disabled={loading}
                  sx={{
                    bgcolor: "#ef4444",
                    color: "white",
                    fontWeight: 700,
                    py: { xs: 1.25, sm: 1.5 },
                    minHeight: "52px", // Better touch target for mobile
                    fontSize: "16px", // Prevents iOS zoom
                    "&:hover": {
                      bgcolor: "#dc2626",
                    },
                  }}
                >
                  {loading ? "ENDING..." : "END TRIP"}
                </Button>
              </>
            )}
          </Box>

          <Typography
            variant="caption"
            sx={{
              display: "block",
              mt: { xs: 1.5, sm: 2 },
              opacity: 0.8,
              textAlign: "center",
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
              px: { xs: 1, sm: 0 },
            }}
          >
            {activeTrip
              ? "Add stops at each location you visit. End trip when done."
              : "Start trip at the beginning of your day."}
          </Typography>
        </CardContent>
      </Card>

      {/* Stops List */}
      {activeTrip && activeTrip.stops && activeTrip.stops.length > 0 && (
        <Card sx={{ borderRadius: "16px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Stops on This Trip
            </Typography>
            <List>
              {activeTrip.stops.map((stop, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      <LocationOn sx={{ color: "#667eea" }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Stop ${stop.stopNumber}`}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            Time: {formatTime(stop.timeFromStart)} from start
                          </Typography>
                          <Typography variant="caption" display="block">
                            Distance: {stop.distanceFromLast} km from last location
                          </Typography>
                          {stop.notes && (
                            <Typography variant="caption" display="block" sx={{ fontStyle: "italic" }}>
                              Notes: {stop.notes}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < activeTrip.stops.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Add Stop Dialog */}
      <Dialog
        open={stopDialog}
        onClose={() => !addingStop && setStopDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add Stop</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Mark this location as a stop in your journey. Your current location and time will be
            recorded.
          </Typography>
          <TextField
            label="Notes (Optional)"
            value={stopNotes}
            onChange={(e) => setStopNotes(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="e.g., Visited ABC Clinic, Met Dr. Smith..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStopDialog(false)} disabled={addingStop}>
            Cancel
          </Button>
          <Button onClick={handleAddStop} variant="contained" disabled={addingStop}>
            {addingStop ? "Adding..." : "Add Stop"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* End Trip Confirmation Dialog */}
      <Dialog open={confirmDialog} onClose={() => !loading && setConfirmDialog(false)}>
        <DialogTitle>End Trip?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to end this trip? Make sure you've added all stops.
          </Typography>
          <Typography sx={{ mt: 2, fontWeight: 600 }}>
            Trip Duration: {formatTime(elapsedTime)}
          </Typography>
          <Typography sx={{ fontWeight: 600 }}>
            Total Stops: {activeTrip?.stops?.length || 0}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleEndTrip} variant="contained" color="error" disabled={loading}>
            {loading ? "Ending..." : "End Trip"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TripTrackerEnhanced;
