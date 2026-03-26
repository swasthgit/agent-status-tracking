/**
 * Application Version Configuration
 *
 * UPDATE THIS FILE EVERY TIME YOU DEPLOY A NEW VERSION!
 *
 * The system compares the stored version in localStorage with this version.
 * If they differ, a hard refresh is triggered to load the new version.
 *
 * Version Format: MAJOR.MINOR.PATCH
 * - MAJOR: Breaking changes or major features
 * - MINOR: New features, improvements
 * - PATCH: Bug fixes, small changes
 *
 * Also update the BUILD_DATE to track when the deployment was made.
 */

export const APP_VERSION = "1.0.0";
export const BUILD_DATE = "2026-03-25";
export const BUILD_NUMBER = 26;

// Version history for reference (optional - helps track changes)
export const VERSION_HISTORY = [
  {
    version: "1.0.0",
    date: "2026-01-07",
    changes: [
      "Initial version tracking system implemented",
      "Auto-refresh on version mismatch",
      "State Ops Manager dashboard added",
      "Male Head Nurse role created",
      "BM Review tab added to Health TL and Agent dashboards",
    ],
  },
];

// Storage key for version
export const VERSION_STORAGE_KEY = "mswasth_app_version";
export const LAST_CHECK_KEY = "mswasth_last_version_check";

/**
 * Get the full version string for display
 */
export const getFullVersionString = () => {
  return `v${APP_VERSION} (Build ${BUILD_NUMBER})`;
};

/**
 * Get version info object
 */
export const getVersionInfo = () => {
  return {
    version: APP_VERSION,
    buildDate: BUILD_DATE,
    buildNumber: BUILD_NUMBER,
    fullString: getFullVersionString(),
  };
};
