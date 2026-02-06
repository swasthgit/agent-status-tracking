import React from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Divider,
} from "@mui/material";
import { Error as ErrorIcon, Warning } from "@mui/icons-material";

/**
 * Error Popup Component
 * Displays errors in both English and Hindi for DC agents
 * Full-screen modal to ensure errors are not missed
 */

// Error translations - English to Hindi mapping
const errorTranslations = {
  // BM Contact errors
  "BM Contact Number must be 10 digits": {
    en: "BM Contact Number must be 10 digits",
    hi: "BM संपर्क नंबर 10 अंकों का होना चाहिए",
  },
  "BM Contact Number is required": {
    en: "BM Contact Number is required",
    hi: "BM संपर्क नंबर आवश्यक है",
  },
  "Invalid BM Contact Number": {
    en: "Invalid BM Contact Number",
    hi: "अमान्य BM संपर्क नंबर",
  },

  // BM Name errors
  "BM Name is required": {
    en: "BM Name is required",
    hi: "BM का नाम आवश्यक है",
  },

  // Clinic errors
  "Please select a clinic": {
    en: "Please select a clinic",
    hi: "कृपया एक क्लिनिक चुनें",
  },
  "Clinic Code is required": {
    en: "Clinic Code is required",
    hi: "क्लिनिक कोड आवश्यक है",
  },

  // Punch errors
  "Please complete punch in and punch out first": {
    en: "Please complete punch in and punch out first",
    hi: "कृपया पहले पंच इन और पंच आउट पूरा करें",
  },
  "Punch data is missing": {
    en: "Punch data is missing",
    hi: "पंच डेटा गायब है",
  },

  // Image errors
  "Please upload at least one image": {
    en: "Please upload at least one image",
    hi: "कृपया कम से कम एक फोटो अपलोड करें",
  },
  "Maximum 5 images allowed": {
    en: "Maximum 5 images allowed",
    hi: "अधिकतम 5 फोटो की अनुमति है",
  },
  "Image upload failed": {
    en: "Image upload failed. Please try again.",
    hi: "फोटो अपलोड विफल। कृपया पुनः प्रयास करें।",
  },
  "All image uploads failed": {
    en: "All image uploads failed. Please check your internet connection.",
    hi: "सभी फोटो अपलोड विफल। कृपया अपना इंटरनेट कनेक्शन जांचें।",
  },

  // Network errors
  "Network error": {
    en: "Network error. Please check your internet connection.",
    hi: "नेटवर्क त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें।",
  },
  "Failed to submit visit": {
    en: "Failed to submit visit. Please try again.",
    hi: "विज़िट सबमिट करने में विफल। कृपया पुनः प्रयास करें।",
  },

  // Field validation errors
  "Partner Name is required": {
    en: "Partner Name is required",
    hi: "पार्टनर का नाम आवश्यक है",
  },
  "Branch Name is required": {
    en: "Branch Name is required",
    hi: "ब्रांच का नाम आवश्यक है",
  },
  "State is required": {
    en: "State is required",
    hi: "राज्य आवश्यक है",
  },
  "Region is required": {
    en: "Region is required",
    hi: "क्षेत्र आवश्यक है",
  },

  // Generic errors
  "Something went wrong": {
    en: "Something went wrong. Please try again.",
    hi: "कुछ गलत हो गया। कृपया पुनः प्रयास करें।",
  },
  "Please fill all required fields": {
    en: "Please fill all required fields",
    hi: "कृपया सभी आवश्यक फ़ील्ड भरें",
  },
};

/**
 * Get translation for an error message
 * @param {string} errorMessage - The error message to translate
 * @returns {object} Object with en and hi translations
 */
const getTranslation = (errorMessage) => {
  // Check for exact match
  if (errorTranslations[errorMessage]) {
    return errorTranslations[errorMessage];
  }

  // Check for partial matches
  for (const key of Object.keys(errorTranslations)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return errorTranslations[key];
    }
  }

  // Check for specific patterns
  if (errorMessage.includes("10 digit") || errorMessage.includes("10 अंक")) {
    return errorTranslations["BM Contact Number must be 10 digits"];
  }

  if (errorMessage.toLowerCase().includes("network") || errorMessage.toLowerCase().includes("internet")) {
    return errorTranslations["Network error"];
  }

  if (errorMessage.toLowerCase().includes("image") || errorMessage.toLowerCase().includes("photo")) {
    return errorTranslations["Image upload failed"];
  }

  if (errorMessage.toLowerCase().includes("punch")) {
    return errorTranslations["Please complete punch in and punch out first"];
  }

  // Default fallback
  return {
    en: errorMessage,
    hi: "कृपया त्रुटि की जांच करें और पुनः प्रयास करें।", // "Please check the error and try again"
  };
};

const ErrorPopup = ({ open, onClose, errorMessage, errorType = "error" }) => {
  if (!errorMessage) return null;

  const translation = getTranslation(errorMessage);
  const isWarning = errorType === "warning";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          overflow: "hidden",
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Header */}
        <Box
          sx={{
            background: isWarning
              ? "linear-gradient(135deg, #f59e0b, #d97706)"
              : "linear-gradient(135deg, #ef4444, #dc2626)",
            p: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          {isWarning ? (
            <Warning sx={{ fontSize: 64, color: "white", mb: 1 }} />
          ) : (
            <ErrorIcon sx={{ fontSize: 64, color: "white", mb: 1 }} />
          )}
          <Typography
            variant="h5"
            sx={{ color: "white", fontWeight: 700, textAlign: "center" }}
          >
            {isWarning ? "⚠️ Warning / चेतावनी" : "❌ Error / त्रुटि"}
          </Typography>
        </Box>

        {/* Error Message - English */}
        <Box sx={{ p: 3, bgcolor: "#fef2f2" }}>
          <Typography
            variant="subtitle2"
            sx={{ color: "#991b1b", fontWeight: 600, mb: 1 }}
          >
            🇬🇧 English:
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "#dc2626",
              fontWeight: 600,
              lineHeight: 1.4,
            }}
          >
            {translation.en}
          </Typography>
        </Box>

        <Divider />

        {/* Error Message - Hindi */}
        <Box sx={{ p: 3, bgcolor: "#fff7ed" }}>
          <Typography
            variant="subtitle2"
            sx={{ color: "#9a3412", fontWeight: 600, mb: 1 }}
          >
            🇮🇳 हिंदी:
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "#ea580c",
              fontWeight: 600,
              lineHeight: 1.4,
            }}
          >
            {translation.hi}
          </Typography>
        </Box>

        <Divider />

        {/* Action Tips */}
        <Box sx={{ p: 3, bgcolor: "#f0fdf4" }}>
          <Typography
            variant="subtitle2"
            sx={{ color: "#166534", fontWeight: 600, mb: 1 }}
          >
            💡 What to do / क्या करें:
          </Typography>
          <Typography variant="body2" sx={{ color: "#15803d", mb: 0.5 }}>
            • Check all fields are filled correctly / सभी फ़ील्ड सही भरे हैं जांचें
          </Typography>
          <Typography variant="body2" sx={{ color: "#15803d", mb: 0.5 }}>
            • Make sure BM number is 10 digits / BM नंबर 10 अंकों का होना चाहिए
          </Typography>
          <Typography variant="body2" sx={{ color: "#15803d" }}>
            • Try again after fixing the issue / समस्या ठीक करने के बाद पुनः प्रयास करें
          </Typography>
        </Box>

        {/* Close Button */}
        <Box sx={{ p: 2, bgcolor: "#f8fafc" }}>
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={onClose}
            sx={{
              bgcolor: "#3b82f6",
              py: 1.5,
              fontSize: "1.1rem",
              fontWeight: 600,
              borderRadius: "12px",
              "&:hover": {
                bgcolor: "#2563eb",
              },
            }}
          >
            OK, I Understand / ठीक है, समझ गया
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ErrorPopup;
