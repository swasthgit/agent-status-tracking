/**
 * Feature Flags Configuration
 *
 * Use these flags to enable/disable new features and A/B test
 * Set to true to enable snapshot-based components
 * Set to false to use original components
 */

export const FEATURE_FLAGS = {
  // Snapshot-based architecture (battery/data optimization)
  USE_SNAPSHOT_TRIP_TRACKER: true,  // Use TripTrackerSnapshot instead of TripTrackerEnhanced
  USE_SNAPSHOT_PUNCH: true,          // Use PunchInOutSnapshot instead of PunchInOut

  // Debugging
  ENABLE_SYNC_LOGS: true,            // Show sync operation logs in console
  ENABLE_PERFORMANCE_LOGS: false,    // Show performance metrics
};

/**
 * Check if a feature is enabled
 */
export const isFeatureEnabled = (featureName) => {
  return FEATURE_FLAGS[featureName] === true;
};

/**
 * Get all enabled features
 */
export const getEnabledFeatures = () => {
  return Object.keys(FEATURE_FLAGS).filter(key => FEATURE_FLAGS[key] === true);
};

/**
 * Performance monitoring helper
 */
export const logPerformance = (label, callback) => {
  if (!FEATURE_FLAGS.ENABLE_PERFORMANCE_LOGS) {
    return callback();
  }

  const start = performance.now();
  const result = callback();
  const end = performance.now();

  console.log(`⚡ ${label}: ${(end - start).toFixed(2)}ms`);
  return result;
};
