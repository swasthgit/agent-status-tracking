const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

/**
 * Calculate road distance between two points using Google Routes API
 * Uses Essentials tier (TRAFFIC_UNAWARE) to stay within free tier
 */
export const calculateRoadDistance = async (origin, destination) => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error("Google Maps API key not configured");
    return { distanceKm: null, durationMinutes: null, success: false, error: "API key not configured" };
  }

  try {
    const response = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
          "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
        },
        body: JSON.stringify({
          origin: {
            location: {
              latLng: { latitude: origin.lat, longitude: origin.lng },
            },
          },
          destination: {
            location: {
              latLng: { latitude: destination.lat, longitude: destination.lng },
            },
          },
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_UNAWARE",
          computeAlternativeRoutes: false,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error("No route found between the given locations");
    }

    const route = data.routes[0];
    const durationSeconds = parseInt(route.duration.replace("s", ""), 10);

    return {
      distanceKm: parseFloat((route.distanceMeters / 1000).toFixed(2)),
      durationMinutes: parseFloat((durationSeconds / 60).toFixed(1)),
      polyline: route.polyline?.encodedPolyline || null,
      success: true,
    };
  } catch (error) {
    console.error("Google Maps route calculation error:", error);
    return {
      distanceKm: null,
      durationMinutes: null,
      polyline: null,
      success: false,
      error: error.message,
    };
  }
};

/**
 * Calculate chain distance for multiple waypoints (A → B → C → D)
 * Each segment is calculated independently via Google Maps
 *
 * @param {Array} points - Array of {lat, lng, label} objects
 * @returns {Object} - segments array, summary, and status
 */
export const calculateChainDistance = async (points) => {
  if (!points || points.length < 2) {
    return {
      segments: [],
      summary: { haversineTotalKm: 0, roadTotalKm: 0 },
      allSegmentsSuccess: true,
    };
  }

  const segments = [];
  let totalRoadDistance = 0;
  let totalHaversineDistance = 0;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i];
    const to = points[i + 1];

    // Haversine for comparison
    const haversine = calculateHaversine(from.lat, from.lng, to.lat, to.lng);

    // Google Maps road distance
    const roadResult = await calculateRoadDistance(
      { lat: from.lat, lng: from.lng },
      { lat: to.lat, lng: to.lng }
    );

    const segment = {
      segmentIndex: i + 1,
      from: { lat: from.lat, lng: from.lng, label: from.label || `Point ${i + 1}` },
      to: { lat: to.lat, lng: to.lng, label: to.label || `Point ${i + 2}` },
      haversineDistanceKm: haversine,
      roadDistanceKm: roadResult.success ? roadResult.distanceKm : null,
      roadDurationMinutes: roadResult.success ? roadResult.durationMinutes : null,
      calculatedAt: new Date().toISOString(),
      success: roadResult.success,
      error: roadResult.error || null,
    };

    segments.push(segment);
    totalHaversineDistance += haversine;

    if (roadResult.success) {
      totalRoadDistance += roadResult.distanceKm;
      successCount++;
    } else {
      failCount++;
    }
  }

  const allSuccess = failCount === 0;

  return {
    segments,
    summary: {
      haversineTotalKm: parseFloat(totalHaversineDistance.toFixed(2)),
      roadTotalKm: allSuccess ? parseFloat(totalRoadDistance.toFixed(2)) : null,
      segmentsCalculated: successCount,
      segmentsFailed: failCount,
      differenceKm:
        allSuccess
          ? parseFloat((totalRoadDistance - totalHaversineDistance).toFixed(2))
          : null,
      differencePercent:
        allSuccess && totalHaversineDistance > 0
          ? parseFloat(
              (((totalRoadDistance - totalHaversineDistance) / totalHaversineDistance) * 100).toFixed(1)
            )
          : null,
    },
    allSegmentsSuccess: allSuccess,
  };
};

/**
 * Haversine formula - straight line distance (kept for comparison)
 */
export const calculateHaversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
};
