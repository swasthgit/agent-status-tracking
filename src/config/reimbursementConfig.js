// DC Agent Reimbursement Configuration
export const REIMBURSEMENT_CONFIG = {
  ratePerKm: 5.0, // ₹5 per kilometer
  currency: "INR",
  currencySymbol: "₹",
};

/**
 * Calculate reimbursement amount based on distance
 * @param {number} distanceKm - Distance in kilometers
 * @returns {number} Reimbursement amount in ₹
 */
export const calculateReimbursement = (distanceKm) => {
  if (!distanceKm || distanceKm <= 0) return 0;
  return parseFloat((distanceKm * REIMBURSEMENT_CONFIG.ratePerKm).toFixed(2));
};
