/**
 * Agent-Partner Mapping Configuration
 *
 * This maps agent names/emails to their default preferred partner.
 * The partner will be pre-filled in call log forms but remains editable.
 *
 * Format:
 * - Key: Agent name (case-insensitive match) or email
 * - Value: Partner name (must match exactly with partner names in Firestore)
 */

export const AGENT_PARTNER_MAPPING = {
  // Agent Name -> Default Partner (case-insensitive matching)

  // Namra partners
  "Ankit kumar": "Namra",
  "Anamika": "Namra",
  "Richa singh": "Namra",

  // Muthoot North partners
  "chandan kumar singh": "Muthoot North",
  "Shani Pandey": "Muthoot North",
  "Shashwat Upadhyay": "Muthoot North",
  "BISWA RANJAN SAHOO": "Muthoot North",
  "Rajkumar Yadav": "Muthoot North",

  // Muthoot South partners
  "Suchitra": "Muthoot South",
  "HariHaran": "Muthoot South",
  "Hariharan": "Muthoot South", // Alternative spelling
  "Deepika": "Muthoot South",
  "Ashwini": "Muthoot South",
  "Deepthi": "Muthoot South",

  // Pahal North partners
  "poonam pandey": "Pahal North",

  // Pahal South partners
  "Kargil": "Pahal South",

  // Uttrayan partners
  "Arpana Chatterjee": "Uttrayan",
};

/**
 * Get the default partner for an agent
 * @param {string} agentName - The agent's name
 * @param {string} agentEmail - The agent's email (fallback lookup)
 * @returns {string} The default partner name or empty string if not mapped
 */
export const getAgentDefaultPartner = (agentName, agentEmail = "") => {
  if (!agentName && !agentEmail) return "";

  // First try exact name match (case-insensitive)
  const nameLower = (agentName || "").toLowerCase().trim();
  const emailLower = (agentEmail || "").toLowerCase().trim();

  for (const [key, value] of Object.entries(AGENT_PARTNER_MAPPING)) {
    const keyLower = key.toLowerCase().trim();

    // Match by name
    if (nameLower && (keyLower === nameLower || nameLower.includes(keyLower) || keyLower.includes(nameLower))) {
      return value;
    }

    // Match by email
    if (emailLower && keyLower === emailLower) {
      return value;
    }
  }

  return "";
};

export default AGENT_PARTNER_MAPPING;
