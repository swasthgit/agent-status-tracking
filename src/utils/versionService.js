/**
 * Version Update Service
 *
 * Handles automatic version checking and hard refresh when new version is deployed.
 * This ensures all users are always on the latest version without manual intervention.
 */

import {
  APP_VERSION,
  BUILD_NUMBER,
  VERSION_STORAGE_KEY,
  LAST_CHECK_KEY,
} from "../config/version";

/**
 * Check if the current version matches the stored version
 * @returns {boolean} true if versions match, false if update needed
 */
export const checkVersion = () => {
  try {
    const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);
    const currentVersionKey = `${APP_VERSION}-${BUILD_NUMBER}`;

    console.log(`🔍 Version Check: Stored=${storedVersion}, Current=${currentVersionKey}`);

    if (!storedVersion) {
      // First time user, store current version
      console.log("📝 First time user, storing current version");
      localStorage.setItem(VERSION_STORAGE_KEY, currentVersionKey);
      localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
      return true;
    }

    if (storedVersion !== currentVersionKey) {
      console.log("🆕 New version detected! Update required.");
      return false; // Version mismatch - update needed
    }

    // Update last check time
    localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
    return true; // Versions match
  } catch (error) {
    console.error("Error checking version:", error);
    return true; // On error, don't force refresh
  }
};

/**
 * Perform a hard refresh to load the new version
 * Clears cache and reloads the page
 */
export const performHardRefresh = () => {
  try {
    console.log("🔄 Performing hard refresh for new version...");

    // Update stored version BEFORE refresh to prevent infinite loop
    const currentVersionKey = `${APP_VERSION}-${BUILD_NUMBER}`;
    localStorage.setItem(VERSION_STORAGE_KEY, currentVersionKey);
    localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());

    // Clear service worker cache if available
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
      });
    }

    // Clear caches if available
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }

    // Force reload from server (bypass cache)
    // Using location.reload(true) for hard refresh
    // Adding timestamp to force cache bypass
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("_v", currentVersionKey);
    currentUrl.searchParams.set("_t", Date.now().toString());

    // Small delay to ensure storage is updated
    setTimeout(() => {
      window.location.href = currentUrl.toString();
    }, 100);

  } catch (error) {
    console.error("Error performing hard refresh:", error);
    // Fallback to simple reload
    window.location.reload(true);
  }
};

/**
 * Initialize version checking on app load
 * Call this in your main App component
 * @returns {boolean} true if app can proceed, false if refresh is happening
 */
export const initVersionCheck = () => {
  const versionsMatch = checkVersion();

  if (!versionsMatch) {
    // Show brief message before refresh
    console.log("🚀 New version available! Updating...");
    performHardRefresh();
    return false; // Refresh in progress
  }

  return true; // App can proceed normally
};

/**
 * Get stored version info
 */
export const getStoredVersionInfo = () => {
  return {
    storedVersion: localStorage.getItem(VERSION_STORAGE_KEY),
    lastCheck: localStorage.getItem(LAST_CHECK_KEY),
    currentVersion: `${APP_VERSION}-${BUILD_NUMBER}`,
  };
};

/**
 * Force update to latest version (manual trigger)
 */
export const forceUpdate = () => {
  // Clear stored version to force update check
  localStorage.removeItem(VERSION_STORAGE_KEY);
  performHardRefresh();
};

/**
 * Clear all version data (for debugging)
 */
export const clearVersionData = () => {
  localStorage.removeItem(VERSION_STORAGE_KEY);
  localStorage.removeItem(LAST_CHECK_KEY);
  console.log("✅ Version data cleared");
};

export default {
  checkVersion,
  performHardRefresh,
  initVersionCheck,
  getStoredVersionInfo,
  forceUpdate,
  clearVersionData,
};
