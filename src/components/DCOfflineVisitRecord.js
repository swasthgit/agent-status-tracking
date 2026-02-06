import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  LinearProgress,
  Chip,
} from "@mui/material";
import {
  CloudUpload,
  Delete,
  CheckCircle,
  Restore,
  Save,
  CloudOff,
  CloudDone,
  Compress,
  Upload,
} from "@mui/icons-material";
import { collection, addDoc, serverTimestamp, doc, updateDoc, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import PunchInOutNew from "./PunchInOutNew";
import ClinicCodeAutocomplete from "./ClinicCodeAutocomplete";
import ErrorPopup from "./ErrorPopup";
import { uploadImagesWithFallback } from "../utils/imageUploadService";
import {
  saveFormData,
  getSavedFormData,
  clearAllVisitData,
  getLastSavedTime,
  clearPunchData,
  saveSubmittedPunchId,
} from "../utils/visitFormPersistence";

/**
 * DCOfflineVisitRecord Component
 * Simplified visit recording for DC agents
 *
 * Features:
 * - Auto-save form data to localStorage
 * - Recovery of data on page refresh
 * - Optimized image uploads with compression
 * - Progress tracking
 */
const DCOfflineVisitRecord = ({ userId, userRole, userName, userEmpId, assignedClinics }) => {
  // Punch In/Out data
  const [punchData, setPunchData] = useState(null);

  // Selected clinic from autocomplete
  const [selectedClinic, setSelectedClinic] = useState(null);

  // Editable clinic fields
  const [clinicCode, setClinicCode] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [state, setState] = useState("");
  const [region, setRegion] = useState("");
  const [opsManager, setOpsManager] = useState("");
  const [opsManagerContact, setOpsManagerContact] = useState("");

  // Manual entry fields
  const [bmName, setBmName] = useState("");
  const [bmContact, setBmContact] = useState("");
  const [remarks, setRemarks] = useState("");

  // Image uploads
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState({
    progress: 0,
    message: "",
    completed: 0,
    total: 0,
    failed: 0,
    phase: "idle", // idle, compressing, uploading, done
  });

  // Submit progress
  const [submitPhase, setSubmitPhase] = useState("idle"); // idle, uploading, saving, done
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastSaved, setLastSaved] = useState(null);
  const [hasRecoveredData, setHasRecoveredData] = useState(false);
  const [shouldResetPunch, setShouldResetPunch] = useState(false);

  // Error popup state
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupErrorMessage, setPopupErrorMessage] = useState("");

  // Auto-save timer ref
  const autoSaveTimerRef = useRef(null);

  const MAX_IMAGES = 5;
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

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

  // Recovery: Load saved form data on mount
  useEffect(() => {
    if (!userId) return;

    const savedFormData = getSavedFormData(userId);
    if (savedFormData) {
      console.log("📋 Recovering saved form data...");
      setHasRecoveredData(true);

      // Restore form fields
      if (savedFormData.clinicCode) setClinicCode(savedFormData.clinicCode);
      if (savedFormData.partnerName) setPartnerName(savedFormData.partnerName);
      if (savedFormData.branchName) setBranchName(savedFormData.branchName);
      if (savedFormData.state) setState(savedFormData.state);
      if (savedFormData.region) setRegion(savedFormData.region);
      if (savedFormData.opsManager) setOpsManager(savedFormData.opsManager);
      if (savedFormData.opsManagerContact) setOpsManagerContact(savedFormData.opsManagerContact);
      if (savedFormData.bmName) setBmName(savedFormData.bmName);
      if (savedFormData.bmContact) setBmContact(savedFormData.bmContact);
      if (savedFormData.remarks) setRemarks(savedFormData.remarks);
      if (savedFormData.selectedClinic) setSelectedClinic(savedFormData.selectedClinic);

      // Update last saved time
      const lastSavedTime = getLastSavedTime(userId);
      if (lastSavedTime) {
        setLastSaved(new Date(lastSavedTime));
      }
    }
  }, [userId]);

  // Auto-save form data whenever fields change
  const autoSaveFormData = useCallback(() => {
    if (!userId) return;

    // Clear previous timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Debounce save (wait 1 second after last change)
    autoSaveTimerRef.current = setTimeout(() => {
      const formData = {
        clinicCode,
        partnerName,
        branchName,
        state,
        region,
        opsManager,
        opsManagerContact,
        bmName,
        bmContact,
        remarks,
        selectedClinic,
      };

      saveFormData(userId, formData);
      setLastSaved(new Date());
      console.log("💾 Form data auto-saved");
    }, 1000);
  }, [userId, clinicCode, partnerName, branchName, state, region, opsManager, opsManagerContact, bmName, bmContact, remarks, selectedClinic]);

  // Trigger auto-save when form fields change
  useEffect(() => {
    autoSaveFormData();

    // Cleanup timer on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [autoSaveFormData]);

  // Handle clinic selection from autocomplete
  const handleClinicSelect = (clinic) => {
    setSelectedClinic(clinic);
    // Populate editable fields with clinic data
    setClinicCode(clinic.clinicCode || "");
    setPartnerName(clinic.partnerName || "");
    setBranchName(clinic.branchName || "");
    setState(clinic.state || "");
    setRegion(clinic.region || "");
    setOpsManager(clinic.assignedOpsManager || "");
    setOpsManagerContact(clinic.opsManagerContact || "");
    setErrorMessage("");
  };

  // Handle image selection
  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files);
    setErrorMessage("");

    if (images.length + files.length > MAX_IMAGES) {
      showError("Maximum 5 images allowed");
      return;
    }

    const validFiles = [];
    const newPreviews = [];

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        showError("Only image files are allowed");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        showError(`Image ${file.name} exceeds 20MB limit`);
        return;
      }

      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });

    setImages([...images, ...validFiles]);
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  // Remove image
  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  // Upload images to Firebase Storage (optimized with compression & parallel uploads)
  const uploadImages = async () => {
    if (images.length === 0) return [];

    // Check if online before starting upload
    if (!navigator.onLine) {
      throw new Error("No internet connection. Please check your network and try again.");
    }

    setUploadingImages(true);
    setUploadProgress(0);
    setUploadStatus({
      progress: 0,
      message: "Preparing images...",
      completed: 0,
      total: images.length,
      failed: 0,
      phase: "compressing",
    });

    try {
      // Use optimized upload service with compression and parallel uploads
      const imageUrls = await uploadImagesWithFallback(
        images,
        userId,
        "offline_visits_dc",
        (status) => {
          // Handle both old (number) and new (object) progress format
          if (typeof status === "number") {
            setUploadProgress(status);
            setUploadStatus(prev => ({ ...prev, progress: status }));
          } else {
            setUploadProgress(status.progress);
            setUploadStatus(status);
          }
        }
      );

      setUploadStatus(prev => ({
        ...prev,
        phase: "done",
        message: "All images uploaded successfully!",
        completed: imageUrls.length,
      }));

      return imageUrls;
    } catch (error) {
      console.error("Error uploading images:", error);
      setUploadStatus(prev => ({
        ...prev,
        phase: "idle",
        message: error.message,
      }));
      throw error;
    } finally {
      setUploadingImages(false);
      setUploadProgress(0);
    }
  };

  // Validate form
  // Helper function to show error with popup
  const showError = (message) => {
    setErrorMessage(message);
    setPopupErrorMessage(message);
    setShowErrorPopup(true);
    console.error("❌ Validation Error:", message);
  };

  const validateForm = () => {
    if (!punchData || punchData.status !== "completed") {
      showError("Please complete punch in and punch out first");
      return false;
    }

    if (!selectedClinic) {
      showError("Please select a clinic");
      return false;
    }

    if (!bmName.trim()) {
      showError("BM Name is required");
      return false;
    }

    if (!bmContact.trim()) {
      showError("BM Contact Number is required");
      return false;
    }

    const contactRegex = /^[0-9]{10}$/;
    if (!contactRegex.test(bmContact.trim())) {
      showError("BM Contact Number must be 10 digits");
      return false;
    }

    return true;
  };

  // Submit visit
  const handleSubmit = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!validateForm()) return;

    // Check if online
    if (!navigator.onLine) {
      showError("No internet connection. Please check your network and try again.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitPhase("uploading");

      // Upload images
      const imageUrls = await uploadImages();

      setSubmitPhase("saving");

      // Get current date and time for consistency with regular offline visits
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
      const timeStr = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      // Create visit document
      const visitData = {
        // User info
        userId,
        userName,
        userEmpId,
        userRole,
        department: "offline_visits_dc",

        // Clinic info (editable fields)
        clinicCode: clinicCode.trim(),
        partnerName: partnerName.trim(),
        region: region.trim(),
        state: state.trim(),
        branchName: branchName.trim(),
        opsManager: opsManager.trim(),
        opsManagerEmpId: selectedClinic.opsManagerEmpId || "",
        opsManagerContact: opsManagerContact.trim(),

        // Manual entry fields
        bmName: bmName.trim(),
        bmContact: bmContact.trim(),
        remarks: remarks.trim() || "",

        // Punch in/out data
        punchInTime: punchData.punchInTime,
        punchInLocation: punchData.punchInLocation,
        punchOutTime: punchData.punchOutTime,
        punchOutLocation: punchData.punchOutLocation,
        totalDuration: punchData.totalDuration,
        durationFormatted: punchData.durationFormatted,

        // Images
        images: imageUrls,
        imageCount: imageUrls.length,

        // Date and Time (for consistency with regular offline visits)
        date: dateStr,
        time: timeStr,

        // Metadata
        visitType: "dc_clinic_visit",
        status: "completed",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Save to visitLogs subcollection
      await addDoc(
        collection(db, "offlineVisits", userId, "visitLogs"),
        visitData
      );

      setSubmitPhase("done");
      setSuccessMessage("Visit record submitted successfully!");

      // Mark the Firestore punch record as submitted so it won't be recovered
      try {
        // First try to use the punchDocId if available in punchData
        if (punchData.punchDocId) {
          await updateDoc(doc(db, "offlineVisits", userId, "activePunch", punchData.punchDocId), {
            visitSubmitted: true,
            submittedAt: serverTimestamp(),
          });
          saveSubmittedPunchId(userId, punchData.punchDocId);
          console.log("✅ Marked punch as submitted (from punchData):", punchData.punchDocId);
        } else {
          // Fallback: query for recent completed punches
          const punchesRef = collection(db, "offlineVisits", userId, "activePunch");
          const completedQuery = query(
            punchesRef,
            where("status", "==", "completed"),
            orderBy("punchInTime", "desc"),
            limit(5)
          );
          const completedSnapshot = await getDocs(completedQuery);

          // Mark the first unsubmitted punch from today
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          for (const punchDoc of completedSnapshot.docs) {
            const data = punchDoc.data();
            const punchDate = data.punchInTime?.toDate?.() || new Date(data.punchInTime);

            // Only mark today's punches that haven't been submitted yet
            if (punchDate >= today && !data.visitSubmitted) {
              await updateDoc(doc(db, "offlineVisits", userId, "activePunch", punchDoc.id), {
                visitSubmitted: true,
                submittedAt: serverTimestamp(),
              });
              // Also save to localStorage for immediate effect (before Firestore syncs)
              saveSubmittedPunchId(userId, punchDoc.id);
              console.log("✅ Marked punch as submitted (from query):", punchDoc.id);
              break; // Only mark the one we just used
            }
          }
        }
      } catch (markError) {
        console.error("Error marking punch as submitted:", markError);
        // Don't fail the submission for this
      }

      // Clear all saved data from localStorage after successful submission
      clearAllVisitData(userId);
      clearPunchData(userId);

      // Trigger reset on PunchInOutNew component
      setShouldResetPunch(true);

      // Reset form
      setTimeout(() => {
        setPunchData(null);
        setSelectedClinic(null);
        // Reset clinic fields
        setClinicCode("");
        setPartnerName("");
        setBranchName("");
        setState("");
        setRegion("");
        setOpsManager("");
        setOpsManagerContact("");
        // Reset other fields
        setBmName("");
        setBmContact("");
        setRemarks("");
        setImages([]);
        setImagePreviews([]);
        setSuccessMessage("");
        setHasRecoveredData(false);
        setLastSaved(null);
        // Reset the shouldResetPunch after a short delay to allow for new punches
        setShouldResetPunch(false);
      }, 2000);
    } catch (error) {
      console.error("Error submitting visit:", error);
      showError("Failed to submit visit: " + error.message);
    } finally {
      setSubmitting(false);
      setSubmitPhase("idle");
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: "#1e293b" }}>
          Record Clinic Visit
        </Typography>
        {/* Auto-save indicator */}
        {lastSaved && (
          <Chip
            icon={<Save sx={{ fontSize: 16 }} />}
            label={`Saved ${lastSaved.toLocaleTimeString()}`}
            size="small"
            sx={{ bgcolor: "#e8f5e9", color: "#2e7d32" }}
          />
        )}
      </Box>

      {/* Recovery alert */}
      {hasRecoveredData && (
        <Alert
          severity="info"
          icon={<Restore />}
          sx={{ mb: 3 }}
          onClose={() => setHasRecoveredData(false)}
        >
          Your previous form data has been recovered. You can continue where you left off.
        </Alert>
      )}

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage("")}>
          {errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      {/* Network status warning */}
      {!isOnline && (
        <Alert
          severity="warning"
          icon={<CloudOff />}
          sx={{ mb: 3 }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            No Internet Connection
          </Typography>
          <Typography variant="caption">
            You're currently offline. Please connect to the internet to upload images and submit the form.
          </Typography>
        </Alert>
      )}

      {/* Detailed upload/submit progress indicator */}
      {(uploadingImages || submitting) && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            bgcolor: "#f8fafc",
            borderRadius: 2,
            border: "1px solid #e2e8f0",
          }}
        >
          {/* Phase indicator */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {submitPhase === "uploading" || uploadingImages ? (
                <>
                  {uploadStatus.phase === "compressing" ? (
                    <Compress sx={{ color: "#f59e0b", animation: "pulse 1s infinite" }} />
                  ) : (
                    <Upload sx={{ color: "#3b82f6", animation: "pulse 1s infinite" }} />
                  )}
                </>
              ) : submitPhase === "saving" ? (
                <CloudDone sx={{ color: "#10b981", animation: "pulse 1s infinite" }} />
              ) : (
                <CheckCircle sx={{ color: "#10b981" }} />
              )}
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#1e293b" }}>
                {submitPhase === "uploading" || uploadingImages
                  ? uploadStatus.message || "Uploading images..."
                  : submitPhase === "saving"
                  ? "Saving visit record to database..."
                  : submitPhase === "done"
                  ? "Submission complete!"
                  : "Processing..."}
              </Typography>
              {uploadingImages && uploadStatus.total > 0 && (
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  {uploadStatus.completed} of {uploadStatus.total} images
                  {uploadStatus.failed > 0 && ` (${uploadStatus.failed} failed)`}
                </Typography>
              )}
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: "#3b82f6" }}>
              {uploadingImages ? `${uploadProgress}%` : submitPhase === "saving" ? "..." : ""}
            </Typography>
          </Box>

          {/* Progress bar */}
          <LinearProgress
            variant={submitPhase === "saving" ? "indeterminate" : "determinate"}
            value={uploadProgress}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: "#e2e8f0",
              "& .MuiLinearProgress-bar": {
                borderRadius: 4,
                bgcolor: uploadStatus.phase === "compressing" ? "#f59e0b" : "#3b82f6",
              },
            }}
          />

          {/* Step indicators */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <CheckCircle
                sx={{
                  fontSize: 16,
                  color: uploadStatus.phase !== "idle" ? "#10b981" : "#cbd5e1",
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: uploadStatus.phase !== "idle" ? "#10b981" : "#94a3b8",
                  fontWeight: uploadStatus.phase === "compressing" ? 600 : 400,
                }}
              >
                Compress
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <CheckCircle
                sx={{
                  fontSize: 16,
                  color:
                    uploadStatus.phase === "uploading" || uploadStatus.phase === "done" || submitPhase === "saving" || submitPhase === "done"
                      ? "#10b981"
                      : "#cbd5e1",
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color:
                    uploadStatus.phase === "uploading" || uploadStatus.phase === "done"
                      ? "#10b981"
                      : "#94a3b8",
                  fontWeight: uploadStatus.phase === "uploading" ? 600 : 400,
                }}
              >
                Upload
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <CheckCircle
                sx={{
                  fontSize: 16,
                  color: submitPhase === "saving" || submitPhase === "done" ? "#10b981" : "#cbd5e1",
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: submitPhase === "saving" || submitPhase === "done" ? "#10b981" : "#94a3b8",
                  fontWeight: submitPhase === "saving" ? 600 : 400,
                }}
              >
                Save
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <CheckCircle
                sx={{
                  fontSize: 16,
                  color: submitPhase === "done" ? "#10b981" : "#cbd5e1",
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: submitPhase === "done" ? "#10b981" : "#94a3b8",
                  fontWeight: submitPhase === "done" ? 600 : 400,
                }}
              >
                Done
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* Punch In/Out Section */}
      <Box sx={{ mb: 4 }}>
        <PunchInOutNew
          agentId={userId}
          agentCollection="offlineVisits"
          initialPunchData={punchData}
          onPunchData={setPunchData}
          shouldReset={shouldResetPunch}
        />
      </Box>

      {/* Clinic Selection */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, color: "#1e293b", fontWeight: 600 }}>
          Clinic Details
        </Typography>
        <ClinicCodeAutocomplete
          agentId={userEmpId}
          assignedClinics={assignedClinics}
          onClinicSelect={handleClinicSelect}
          disabled={!punchData || punchData.status !== "completed"}
        />
      </Box>

      {/* Editable Clinic Details */}
      {selectedClinic && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, color: "#1e293b", fontWeight: 600 }}>
            Clinic Details (Editable)
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Clinic Code"
                value={clinicCode}
                onChange={(e) => setClinicCode(e.target.value)}
                fullWidth
                helperText="You can edit if incorrect"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Partner Name"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Branch Name"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="OPS Manager"
                value={opsManager}
                onChange={(e) => setOpsManager(e.target.value)}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="OPS Manager Contact"
                value={opsManagerContact}
                onChange={(e) => setOpsManagerContact(e.target.value)}
                fullWidth
                inputMode="tel"
                inputProps={{
                  maxLength: 10,
                  style: { fontSize: '16px' } // Prevents iOS zoom
                }}
              />
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Manual Entry Fields */}
      {selectedClinic && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, color: "#1e293b", fontWeight: 600 }}>
            Visit Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="BM Name *"
                value={bmName}
                onChange={(e) => setBmName(e.target.value)}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="BM Contact Number *"
                value={bmContact}
                onChange={(e) => setBmContact(e.target.value)}
                fullWidth
                required
                inputProps={{
                  maxLength: 10,
                  style: { fontSize: '16px' } // Prevents iOS zoom
                }}
                inputMode="tel"
                helperText="10-digit mobile number"
                sx={{
                  '& .MuiInputBase-input': {
                    minHeight: '44px', // Better touch target
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Remarks (Optional)"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Image Upload */}
      {selectedClinic && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, color: "#1e293b", fontWeight: 600 }}>
            Upload Images (Max {MAX_IMAGES})
          </Typography>

          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUpload />}
            disabled={images.length >= MAX_IMAGES}
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              mb: 2,
              minHeight: "48px", // Better touch target for mobile
              fontSize: "16px", // Prevents iOS zoom
              borderColor: "#667eea",
              color: "#667eea",
              "&:hover": {
                borderColor: "#5a67d8",
                bgcolor: "rgba(102, 126, 234, 0.04)",
              },
            }}
          >
            Choose Images
            <input
              type="file"
              hidden
              multiple
              accept="image/*"
              onChange={handleImageSelect}
            />
          </Button>

          {imagePreviews.length > 0 && (
            <ImageList cols={3} gap={12} sx={{ mt: 2 }}>
              {imagePreviews.map((preview, index) => (
                <ImageListItem key={index} sx={{ borderRadius: 2, overflow: "hidden" }}>
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    loading="lazy"
                    style={{ height: 150, objectFit: "cover" }}
                  />
                  <ImageListItemBar
                    actionIcon={
                      <IconButton
                        onClick={() => removeImage(index)}
                        sx={{ color: "white" }}
                      >
                        <Delete />
                      </IconButton>
                    }
                    sx={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)" }}
                  />
                </ImageListItem>
              ))}
            </ImageList>
          )}
        </Box>
      )}

      {/* Submit Button */}
      {selectedClinic && (
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || uploadingImages || !punchData || punchData.status !== "completed"}
          fullWidth
          sx={{
            bgcolor: "#22c55e",
            py: 1.5,
            minHeight: "52px", // Larger touch target for submit button
            borderRadius: "12px",
            fontSize: "16px", // Prevents iOS zoom
            fontWeight: 600,
            textTransform: "none",
            "&:hover": {
              bgcolor: "#16a34a",
            },
            "&:disabled": {
              bgcolor: "#cbd5e1",
              color: "#64748b",
            },
          }}
        >
          {submitting || uploadingImages ? "Submitting..." : "Submit Visit"}
        </Button>
      )}

      {/* Error Popup - Full screen error display in English and Hindi */}
      <ErrorPopup
        open={showErrorPopup}
        onClose={() => setShowErrorPopup(false)}
        errorMessage={popupErrorMessage}
        errorType="error"
      />
    </Box>
  );
};

export default DCOfflineVisitRecord;
