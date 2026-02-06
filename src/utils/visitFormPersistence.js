/**
 * Visit Form Persistence Service
 *
 * Provides localStorage-based persistence for visit form data to prevent data loss
 * on page refresh or network issues. This is critical for field workers who may
 * have intermittent connectivity.
 *
 * Features:
 * - Auto-save form data to localStorage
 * - Recover form data on page load
 * - Clear data after successful submission
 * - Per-user data isolation
 */

const STORAGE_PREFIX = "mswasth_visit_form_";
const PUNCH_DATA_KEY = "punch_data";
const FORM_DATA_KEY = "form_data";
const IMAGES_KEY = "images_metadata";
const LAST_SAVED_KEY = "last_saved";
const SUBMITTED_PUNCH_KEY = "submitted_punch_id";

/**
 * Get storage key for a specific user
 */
const getStorageKey = (userId, dataType) => {
  return `${STORAGE_PREFIX}${userId}_${dataType}`;
};

/**
 * Save punch data to localStorage
 * @param {string} userId - User ID
 * @param {object} punchData - Punch in/out data including locations
 */
export const savePunchData = (userId, punchData) => {
  try {
    if (!userId || !punchData) return false;

    const key = getStorageKey(userId, PUNCH_DATA_KEY);
    const dataToSave = {
      ...punchData,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(key, JSON.stringify(dataToSave));
    console.log("📍 Punch data saved to localStorage");
    return true;
  } catch (error) {
    console.error("Error saving punch data:", error);
    return false;
  }
};

/**
 * Get saved punch data from localStorage
 * @param {string} userId - User ID
 * @returns {object|null} Saved punch data or null
 */
export const getSavedPunchData = (userId) => {
  try {
    if (!userId) return null;

    const key = getStorageKey(userId, PUNCH_DATA_KEY);
    const saved = localStorage.getItem(key);

    if (!saved) return null;

    const punchData = JSON.parse(saved);

    // Check if data is from today (don't restore old data)
    const savedDate = new Date(punchData.savedAt).toDateString();
    const today = new Date().toDateString();

    if (savedDate !== today) {
      console.log("🗑️ Clearing old punch data from different day");
      clearPunchData(userId);
      return null;
    }

    console.log("✅ Restored punch data from localStorage");
    return punchData;
  } catch (error) {
    console.error("Error getting saved punch data:", error);
    return null;
  }
};

/**
 * Clear punch data from localStorage
 * @param {string} userId - User ID
 */
export const clearPunchData = (userId) => {
  try {
    if (!userId) return;
    const key = getStorageKey(userId, PUNCH_DATA_KEY);
    localStorage.removeItem(key);
    console.log("🗑️ Punch data cleared from localStorage");
  } catch (error) {
    console.error("Error clearing punch data:", error);
  }
};

/**
 * Save form data to localStorage
 * @param {string} userId - User ID
 * @param {object} formData - Form field values
 */
export const saveFormData = (userId, formData) => {
  try {
    if (!userId) return false;

    const key = getStorageKey(userId, FORM_DATA_KEY);
    const dataToSave = {
      ...formData,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(key, JSON.stringify(dataToSave));

    // Also update last saved timestamp
    localStorage.setItem(
      getStorageKey(userId, LAST_SAVED_KEY),
      new Date().toISOString()
    );

    return true;
  } catch (error) {
    console.error("Error saving form data:", error);
    return false;
  }
};

/**
 * Get saved form data from localStorage
 * @param {string} userId - User ID
 * @returns {object|null} Saved form data or null
 */
export const getSavedFormData = (userId) => {
  try {
    if (!userId) return null;

    const key = getStorageKey(userId, FORM_DATA_KEY);
    const saved = localStorage.getItem(key);

    if (!saved) return null;

    const formData = JSON.parse(saved);

    // Check if data is from today
    const savedDate = new Date(formData.savedAt).toDateString();
    const today = new Date().toDateString();

    if (savedDate !== today) {
      console.log("🗑️ Clearing old form data from different day");
      clearFormData(userId);
      return null;
    }

    console.log("✅ Restored form data from localStorage");
    return formData;
  } catch (error) {
    console.error("Error getting saved form data:", error);
    return null;
  }
};

/**
 * Clear form data from localStorage
 * @param {string} userId - User ID
 */
export const clearFormData = (userId) => {
  try {
    if (!userId) return;
    const key = getStorageKey(userId, FORM_DATA_KEY);
    localStorage.removeItem(key);
    console.log("🗑️ Form data cleared from localStorage");
  } catch (error) {
    console.error("Error clearing form data:", error);
  }
};

/**
 * Save image metadata to localStorage (not the actual images, just metadata)
 * @param {string} userId - User ID
 * @param {Array} imagesMetadata - Array of image metadata (name, size, type)
 */
export const saveImagesMetadata = (userId, imagesMetadata) => {
  try {
    if (!userId) return false;

    const key = getStorageKey(userId, IMAGES_KEY);
    localStorage.setItem(key, JSON.stringify({
      images: imagesMetadata,
      savedAt: new Date().toISOString(),
    }));

    return true;
  } catch (error) {
    console.error("Error saving images metadata:", error);
    return false;
  }
};

/**
 * Get saved images metadata from localStorage
 * @param {string} userId - User ID
 * @returns {Array|null} Saved images metadata or null
 */
export const getSavedImagesMetadata = (userId) => {
  try {
    if (!userId) return null;

    const key = getStorageKey(userId, IMAGES_KEY);
    const saved = localStorage.getItem(key);

    if (!saved) return null;

    const data = JSON.parse(saved);
    return data.images || null;
  } catch (error) {
    console.error("Error getting saved images metadata:", error);
    return null;
  }
};

/**
 * Clear images metadata from localStorage
 * @param {string} userId - User ID
 */
export const clearImagesMetadata = (userId) => {
  try {
    if (!userId) return;
    const key = getStorageKey(userId, IMAGES_KEY);
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error clearing images metadata:", error);
  }
};

/**
 * Clear all visit form data for a user
 * @param {string} userId - User ID
 */
export const clearAllVisitData = (userId) => {
  try {
    if (!userId) return;

    clearPunchData(userId);
    clearFormData(userId);
    clearImagesMetadata(userId);

    const lastSavedKey = getStorageKey(userId, LAST_SAVED_KEY);
    localStorage.removeItem(lastSavedKey);

    console.log("🗑️ All visit data cleared from localStorage");
  } catch (error) {
    console.error("Error clearing all visit data:", error);
  }
};

/**
 * Get last saved timestamp
 * @param {string} userId - User ID
 * @returns {string|null} ISO timestamp or null
 */
export const getLastSavedTime = (userId) => {
  try {
    if (!userId) return null;
    const key = getStorageKey(userId, LAST_SAVED_KEY);
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
};

/**
 * Check if there's any saved data for the user
 * @param {string} userId - User ID
 * @returns {boolean} True if saved data exists
 */
export const hasSavedData = (userId) => {
  try {
    if (!userId) return false;

    const punchData = getSavedPunchData(userId);
    const formData = getSavedFormData(userId);

    return !!(punchData || formData);
  } catch (error) {
    return false;
  }
};

/**
 * Debounced auto-save function
 * Returns a function that will save after a delay, resetting the timer on each call
 */
export const createAutoSaver = (userId, saveDelay = 1000) => {
  let timeoutId = null;

  return (formData) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      saveFormData(userId, formData);
    }, saveDelay);
  };
};

/**
 * Save submitted punch ID to prevent re-recovery
 * @param {string} userId - User ID
 * @param {string} punchId - The Firestore punch document ID that was submitted
 */
export const saveSubmittedPunchId = (userId, punchId) => {
  try {
    if (!userId || !punchId) return false;
    const key = getStorageKey(userId, SUBMITTED_PUNCH_KEY);
    const today = new Date().toDateString();
    const data = {
      punchId,
      date: today,
    };
    localStorage.setItem(key, JSON.stringify(data));
    console.log("📝 Saved submitted punch ID:", punchId);
    return true;
  } catch (error) {
    console.error("Error saving submitted punch ID:", error);
    return false;
  }
};

/**
 * Check if a punch ID was already submitted today
 * @param {string} userId - User ID
 * @param {string} punchId - The punch ID to check
 * @returns {boolean} True if this punch was already submitted today
 */
export const isPunchSubmitted = (userId, punchId) => {
  try {
    if (!userId || !punchId) return false;
    const key = getStorageKey(userId, SUBMITTED_PUNCH_KEY);
    const saved = localStorage.getItem(key);
    if (!saved) return false;

    const data = JSON.parse(saved);
    const today = new Date().toDateString();

    // Check if it's from today and matches the punch ID
    if (data.date === today && data.punchId === punchId) {
      return true;
    }

    // Clear old data
    if (data.date !== today) {
      localStorage.removeItem(key);
    }

    return false;
  } catch (error) {
    console.error("Error checking submitted punch:", error);
    return false;
  }
};

/**
 * Clear submitted punch ID
 * @param {string} userId - User ID
 */
export const clearSubmittedPunchId = (userId) => {
  try {
    if (!userId) return;
    const key = getStorageKey(userId, SUBMITTED_PUNCH_KEY);
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error clearing submitted punch ID:", error);
  }
};

export default {
  savePunchData,
  getSavedPunchData,
  clearPunchData,
  saveFormData,
  getSavedFormData,
  clearFormData,
  saveImagesMetadata,
  getSavedImagesMetadata,
  clearImagesMetadata,
  clearAllVisitData,
  getLastSavedTime,
  hasSavedData,
  createAutoSaver,
  saveSubmittedPunchId,
  isPunchSubmitted,
  clearSubmittedPunchId,
};
