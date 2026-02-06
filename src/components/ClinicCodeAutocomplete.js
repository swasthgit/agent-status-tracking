import React, { useState, useEffect } from "react";
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography,
} from "@mui/material";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * ClinicCodeAutocomplete Component
 *
 * Provides a searchable dropdown for clinic codes with auto-fill functionality
 * When a clinic code is selected, it automatically fills related fields
 *
 * Props:
 * - agentId: The DC agent's user ID (empId)
 * - agentDocId: The DC agent's document ID in offlineVisits collection
 * - assignedClinics: Array of clinic codes assigned to this DC (optional, if provided, used directly)
 * - onClinicSelect: Callback function (clinicData) => void
 * - disabled: Boolean to disable the component
 */
const ClinicCodeAutocomplete = ({
  agentId,
  agentDocId,
  assignedClinics: propAssignedClinics,
  onClinicSelect,
  disabled = false
}) => {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClinic, setSelectedClinic] = useState(null);

  // Fetch clinics assigned to this DC agent
  // Uses the DC's assignedClinics array from their profile, NOT the clinic's assignedDC field
  useEffect(() => {
    const fetchClinics = async () => {
      if (!agentId && !agentDocId && !propAssignedClinics) return;

      try {
        setLoading(true);
        let assignedClinicCodes = propAssignedClinics || [];

        // If assignedClinics not provided as prop, fetch from DC's profile
        if (!propAssignedClinics || propAssignedClinics.length === 0) {
          // Try to get the DC's assignedClinics from their profile
          const offlineVisitsRef = collection(db, "offlineVisits");

          // Try by document ID first, then by empId
          if (agentDocId) {
            const dcDoc = await getDocs(query(offlineVisitsRef, where("__name__", "==", agentDocId)));
            if (!dcDoc.empty) {
              assignedClinicCodes = dcDoc.docs[0].data().assignedClinics || [];
            }
          }

          // If still empty, try by empId
          if (assignedClinicCodes.length === 0 && agentId) {
            const dcQuery = query(offlineVisitsRef, where("empId", "==", agentId));
            const dcSnapshot = await getDocs(dcQuery);
            if (!dcSnapshot.empty) {
              assignedClinicCodes = dcSnapshot.docs[0].data().assignedClinics || [];
            }
          }
        }

        // Handle case where assignedClinics might be a concatenated string (corrupted data)
        if (typeof assignedClinicCodes === "string") {
          assignedClinicCodes = assignedClinicCodes.split(",").map(c => c.trim()).filter(Boolean);
        }

        // Flatten any nested arrays or concatenated items
        const cleanedCodes = [];
        assignedClinicCodes.forEach(code => {
          if (typeof code === "string" && code.includes(",")) {
            cleanedCodes.push(...code.split(",").map(c => c.trim()).filter(Boolean));
          } else if (code) {
            cleanedCodes.push(code);
          }
        });
        assignedClinicCodes = [...new Set(cleanedCodes)]; // Remove duplicates

        if (assignedClinicCodes.length === 0) {
          setClinics([]);
          setLoading(false);
          return;
        }

        // Now fetch clinic details from clinicData collection
        // Firebase 'in' query supports max 30 items, so batch if needed
        const clinicsRef = collection(db, "clinicData");
        const clinicList = [];

        // Batch into chunks of 30 for Firebase 'in' query limit
        const batchSize = 30;
        for (let i = 0; i < assignedClinicCodes.length; i += batchSize) {
          const batch = assignedClinicCodes.slice(i, i + batchSize);
          const q = query(clinicsRef, where("clinicCode", "in", batch));
          const snapshot = await getDocs(q);

          snapshot.docs.forEach(doc => {
            clinicList.push({
              id: doc.id,
              ...doc.data(),
            });
          });
        }

        // Also add clinics that are in assignedClinics but not found in clinicData
        // (in case clinic details haven't been created yet)
        const foundCodes = new Set(clinicList.map(c => c.clinicCode?.toUpperCase()));
        assignedClinicCodes.forEach(code => {
          if (!foundCodes.has(code?.toUpperCase())) {
            clinicList.push({
              id: `temp_${code}`,
              clinicCode: code,
              branchName: code, // Use code as fallback name
              clinicName: code,
              state: "",
              region: "",
              partnerName: "",
              isPlaceholder: true, // Mark as placeholder
            });
          }
        });

        // Sort clinics by clinic code
        clinicList.sort((a, b) => (a.clinicCode || "").localeCompare(b.clinicCode || ""));

        setClinics(clinicList);
      } catch (error) {
        console.error("Error fetching clinics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClinics();
  }, [agentId, agentDocId, propAssignedClinics]);

  // Handle clinic selection
  const handleClinicChange = (event, value) => {
    setSelectedClinic(value);
    if (onClinicSelect) {
      onClinicSelect(value);
    }
  };

  return (
    <Box>
      <Autocomplete
        value={selectedClinic}
        onChange={handleClinicChange}
        options={clinics}
        getOptionLabel={(option) =>
          option ? `${option.clinicCode} - ${option.branchName}` : ""
        }
        loading={loading}
        disabled={disabled || loading}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Clinic Code *"
            placeholder="Search clinic code or branch name..."
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <Box sx={{ width: "100%" }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {option.clinicCode}
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.875rem" }}>
                {option.branchName}, {option.state}
              </Typography>
              <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                {option.partnerName}
              </Typography>
            </Box>
          </Box>
        )}
        noOptionsText={
          loading
            ? "Loading clinics..."
            : clinics.length === 0
            ? "No clinics assigned to you"
            : "No matching clinics found"
        }
        sx={{
          "& .MuiAutocomplete-listbox": {
            maxHeight: "300px",
          },
        }}
      />

      {selectedClinic && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: "#f8fafc",
            borderRadius: 1,
            border: "1px solid #e2e8f0",
          }}
        >
          <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
            Selected Clinic Details:
          </Typography>
          <Box sx={{ mt: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
            <Typography variant="body2">
              <strong>Clinic Code:</strong> {selectedClinic.clinicCode}
            </Typography>
            <Typography variant="body2">
              <strong>Partner:</strong> {selectedClinic.partnerName}
            </Typography>
            <Typography variant="body2">
              <strong>Branch:</strong> {selectedClinic.branchName}
            </Typography>
            <Typography variant="body2">
              <strong>State:</strong> {selectedClinic.state}
            </Typography>
            <Typography variant="body2">
              <strong>Region:</strong> {selectedClinic.region}
            </Typography>
            <Typography variant="body2">
              <strong>Ops Manager:</strong> {selectedClinic.assignedOpsManager}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ClinicCodeAutocomplete;
