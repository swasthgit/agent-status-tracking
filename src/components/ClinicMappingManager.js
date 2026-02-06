import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  Tooltip,
  InputAdornment,
  Grid,
  TablePagination,
  Avatar,
  Tabs,
  Tab,
  Divider,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  LinearProgress,
  Paper,
  CircularProgress,
} from "@mui/material";
import {
  Add,
  Edit as EditIcon,
  Delete,
  Search,
  Refresh,
  LocalHospital,
  Upload,
  Download,
  FilterList,
  ExpandMore,
  ExpandLess,
  Warning,
  CheckCircle,
  Cancel,
  Person,
  SupervisorAccount,
  AssignmentInd,
  Sync,
  AddCircle,
  PlayArrow,
  Close,
  CloudUpload,
  Code,
  Business,
  LocationOn,
  History,
} from "@mui/icons-material";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  writeBatch,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { colors, transitions } from "../theme/adminTheme";
import { fadeInDown, fadeInUp } from "../styles/adminStyles";
import { GlassCard, StatCard } from "./admin";
import { keyframes } from "@mui/system";

// Loading animations
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Stats Card Component is now imported from ./admin as StatCard

function ClinicMappingManager() {
  const [activeTab, setActiveTab] = useState(0);
  const [clinics, setClinics] = useState([]);
  const [dcAgents, setDcAgents] = useState([]);
  const [opsManagers, setOpsManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState("all");
  const [filterRegion, setFilterRegion] = useState("all");
  const [filterOpsManager, setFilterOpsManager] = useState("all");
  const [filterAssignedDC, setFilterAssignedDC] = useState("all");
  const [showFilters, setShowFilters] = useState(true);

  // Dialog states
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // CSV Upload states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("idle"); // idle, parsing, validating, uploading, done
  const [duplicates, setDuplicates] = useState([]);
  const [validRecords, setValidRecords] = useState([]);

  // Form states
  const [formData, setFormData] = useState({
    clinicCode: "",
    clinicName: "",
    partnerName: "",
    branch: "",
    state: "",
    region: "",
    opsManager: "",
    opsManagerId: "",
    assignedDC: "",
    assignedDCId: "",
    address: "",
    contactNumber: "",
    status: "active",
  });

  // DC Mapping Sync states
  const [syncStatus, setSyncStatus] = useState("idle"); // idle, parsing, comparing, ready, applying, done
  const [syncProgress, setSyncProgress] = useState(0);
  const [newMappingData, setNewMappingData] = useState([]); // Parsed CSV data
  const [syncAnalysis, setSyncAnalysis] = useState({
    dcsInBoth: [], // DCs in both DB and new mapping
    dcsOnlyInDB: [], // DCs only in DB (will keep unchanged)
    dcsOnlyInMapping: [], // DCs in mapping but not in DB (will flag)
    changes: [], // {dcId, dcName, toAdd: [], toRemove: [], unchanged: []}
    totalClinicsToAdd: 0,
    totalClinicsToRemove: 0,
    totalDCsAffected: 0,
    clinicUpdates: [], // Clinics with details to update/create
    totalClinicsToUpdate: 0,
    newClinicsToCreate: [], // Clinic codes not in DB that need to be created
  });
  const [syncLogs, setSyncLogs] = useState([]); // Audit log of changes

  // Data Cleanup states
  const [cleanupStatus, setCleanupStatus] = useState("idle"); // idle, scanning, ready, fixing
  const [corruptedClinics, setCorruptedClinics] = useState([]); // Clinics with malformed codes
  const [corruptedDCAssignments, setCorruptedDCAssignments] = useState([]); // DCs with concatenated clinic codes
  const [cleanupLogs, setCleanupLogs] = useState([]);

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchClinics(), fetchDCAgents(), fetchOpsManagers()]);
    } catch (error) {
      console.error("Error fetching data:", error);
      setErrorMessage("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchClinics = async () => {
    try {
      const snapshot = await getDocs(collection(db, "clinicData"));
      const clinicList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClinics(clinicList);
      return clinicList;
    } catch (error) {
      console.error("Error fetching clinics:", error);
      throw error;
    }
  };

  const fetchDCAgents = async () => {
    try {
      const snapshot = await getDocs(collection(db, "offlineVisits"));
      const dcList = snapshot.docs.map((doc) => ({
        id: doc.id,
        uid: doc.data().uid || doc.id,
        ...doc.data(),
      }));
      setDcAgents(dcList);
      return dcList;
    } catch (error) {
      console.error("Error fetching DC agents:", error);
      throw error;
    }
  };

  const fetchOpsManagers = async () => {
    try {
      const snapshot = await getDocs(collection(db, "opsManagers"));
      const opsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        uid: doc.data().uid || doc.id,
        ...doc.data(),
      }));
      setOpsManagers(opsList);
      return opsList;
    } catch (error) {
      console.error("Error fetching OPS managers:", error);
      throw error;
    }
  };

  // Get unique values for filters
  const uniqueStates = useMemo(() => {
    const states = [...new Set(clinics.map((c) => c.state).filter(Boolean))];
    return states.sort();
  }, [clinics]);

  const uniqueRegions = useMemo(() => {
    const regions = [...new Set(clinics.map((c) => c.region).filter(Boolean))];
    return regions.sort();
  }, [clinics]);

  // Filter clinics
  const filteredClinics = useMemo(() => {
    let filtered = [...clinics];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (clinic) =>
          clinic.clinicCode?.toLowerCase().includes(query) ||
          clinic.clinicName?.toLowerCase().includes(query) ||
          clinic.partnerName?.toLowerCase().includes(query) ||
          clinic.branch?.toLowerCase().includes(query)
      );
    }

    if (filterState !== "all") {
      filtered = filtered.filter((clinic) => clinic.state === filterState);
    }

    if (filterRegion !== "all") {
      filtered = filtered.filter((clinic) => clinic.region === filterRegion);
    }

    if (filterOpsManager !== "all") {
      filtered = filtered.filter(
        (clinic) => clinic.opsManagerId === filterOpsManager || clinic.opsManager === filterOpsManager
      );
    }

    if (filterAssignedDC !== "all") {
      if (filterAssignedDC === "unassigned") {
        // Find clinics not assigned to any DC
        const allAssignedClinicCodes = new Set();
        dcAgents.forEach((dc) => {
          const assignedClinics = dc.assignedClinics || [];
          assignedClinics.forEach((code) => allAssignedClinicCodes.add(code));
        });
        filtered = filtered.filter((clinic) => {
          const hasDirectAssignment = clinic.assignedDCId || clinic.assignedDC;
          const isInAnyDCArray =
            allAssignedClinicCodes.has(clinic.clinicCode) ||
            allAssignedClinicCodes.has(clinic.id);
          return !hasDirectAssignment && !isInAnyDCArray;
        });
      } else {
        // Filter by specific DC
        const selectedDC = dcAgents.find((d) => d.id === filterAssignedDC);
        const dcAssignedClinics = selectedDC?.assignedClinics || [];
        filtered = filtered.filter((clinic) => {
          // Check if clinic is in DC's assignedClinics array
          const isInDCArray =
            dcAssignedClinics.includes(clinic.clinicCode) ||
            dcAssignedClinics.includes(clinic.id);
          // Or check if clinic has this DC directly assigned
          // assignedDC field stores the DC's name, assignedDCId stores the DC's id
          const hasDirectAssignment =
            clinic.assignedDCId === filterAssignedDC ||
            clinic.assignedDCId === selectedDC?.uid ||
            clinic.assignedDC === selectedDC?.name ||
            clinic.assignedDC === selectedDC?.empId;
          return isInDCArray || hasDirectAssignment;
        });
      }
    }

    return filtered;
  }, [clinics, searchQuery, filterState, filterRegion, filterOpsManager, filterAssignedDC, dcAgents]);

  // Group clinics by DC Agent
  // Uses DC agent's assignedClinics array (clinic codes) as primary source
  const clinicsByDC = useMemo(() => {
    const grouped = {};
    const assignedClinicCodes = new Set(); // Track which clinics are assigned

    // Initialize with all DC agents and populate from their assignedClinics array
    dcAgents.forEach((dc) => {
      const dcAssignedClinics = dc.assignedClinics || [];
      const matchedClinics = [];

      // Find clinics that match the DC's assignedClinics array
      dcAssignedClinics.forEach((clinicCode) => {
        const clinic = clinics.find(
          (c) => c.clinicCode === clinicCode || c.id === clinicCode
        );
        if (clinic) {
          matchedClinics.push(clinic);
          assignedClinicCodes.add(clinic.clinicCode);
          assignedClinicCodes.add(clinic.id);
        }
      });

      // Also check if clinic has assignedDCId/assignedDC pointing to this DC
      clinics.forEach((clinic) => {
        const clinicDcRef = clinic.assignedDCId || clinic.assignedDC;
        if (
          clinicDcRef &&
          (clinicDcRef === dc.id || clinicDcRef === dc.uid || clinicDcRef === dc.empId) &&
          !matchedClinics.find((c) => c.id === clinic.id)
        ) {
          matchedClinics.push(clinic);
          assignedClinicCodes.add(clinic.clinicCode);
          assignedClinicCodes.add(clinic.id);
        }
      });

      grouped[dc.id] = {
        dc,
        clinics: matchedClinics,
      };
    });

    // Add unassigned group - clinics not in any DC's assignedClinics array
    const unassignedClinics = clinics.filter(
      (clinic) =>
        !assignedClinicCodes.has(clinic.clinicCode) &&
        !assignedClinicCodes.has(clinic.id)
    );

    grouped["unassigned"] = {
      dc: { id: "unassigned", name: "Unassigned Clinics" },
      clinics: unassignedClinics,
    };

    return grouped;
  }, [clinics, dcAgents]);

  // Group clinics by OPS Manager
  // Also tracks which DC agents are working under each OPS Manager
  const clinicsByOpsManager = useMemo(() => {
    const grouped = {};

    // Initialize with all OPS managers
    opsManagers.forEach((ops) => {
      grouped[ops.id] = {
        opsManager: ops,
        clinics: [],
        dcAgents: new Set(),
      };
    });

    // Add unassigned group
    grouped["unassigned"] = {
      opsManager: { id: "unassigned", name: "No OPS Manager" },
      clinics: [],
      dcAgents: new Set(),
    };

    // Helper to find which DC agent has this clinic
    const findDCForClinic = (clinic) => {
      // First check if clinic has assignedDCId/assignedDC
      if (clinic.assignedDCId || clinic.assignedDC) {
        const dcRef = clinic.assignedDCId || clinic.assignedDC;
        const dc = dcAgents.find(
          (d) => d.id === dcRef || d.uid === dcRef || d.empId === dcRef
        );
        if (dc) return dc;
      }

      // Then check if any DC has this clinic in their assignedClinics array
      for (const dc of dcAgents) {
        const assignedClinics = dc.assignedClinics || [];
        if (
          assignedClinics.includes(clinic.clinicCode) ||
          assignedClinics.includes(clinic.id)
        ) {
          return dc;
        }
      }
      return null;
    };

    // Group clinics and track unique DCs
    clinics.forEach((clinic) => {
      // Check multiple possible OPS manager fields
      const opsId = clinic.opsManagerId || clinic.assignedOpsManager;
      const opsName = clinic.opsManager;

      // Try to find matching OPS manager by ID or name
      let matchedOpsKey = null;
      if (opsId && grouped[opsId]) {
        matchedOpsKey = opsId;
      } else if (opsName) {
        // Try to match by name
        const opsMatch = opsManagers.find(
          (o) => o.name === opsName || o.empId === opsName
        );
        if (opsMatch && grouped[opsMatch.id]) {
          matchedOpsKey = opsMatch.id;
        }
      }

      if (matchedOpsKey) {
        grouped[matchedOpsKey].clinics.push(clinic);
        const dc = findDCForClinic(clinic);
        if (dc) {
          grouped[matchedOpsKey].dcAgents.add(dc.id);
        }
      } else {
        grouped["unassigned"].clinics.push(clinic);
        const dc = findDCForClinic(clinic);
        if (dc) {
          grouped["unassigned"].dcAgents.add(dc.id);
        }
      }
    });

    // Convert Sets to arrays for rendering
    Object.keys(grouped).forEach((key) => {
      grouped[key].dcAgents = Array.from(grouped[key].dcAgents);
    });

    return grouped;
  }, [clinics, opsManagers, dcAgents]);

  // Stats - uses the clinicsByDC grouping for accurate assigned/unassigned counts
  const stats = useMemo(() => {
    const totalClinics = clinics.length;

    // Count assigned clinics by checking DC agent's assignedClinics arrays
    const allAssignedClinicCodes = new Set();
    dcAgents.forEach((dc) => {
      const assignedClinics = dc.assignedClinics || [];
      assignedClinics.forEach((code) => allAssignedClinicCodes.add(code));
    });

    // Also count clinics with assignedDCId/assignedDC field set
    clinics.forEach((clinic) => {
      if (clinic.assignedDCId || clinic.assignedDC) {
        allAssignedClinicCodes.add(clinic.clinicCode);
        allAssignedClinicCodes.add(clinic.id);
      }
    });

    const assignedCount = clinics.filter(
      (c) => allAssignedClinicCodes.has(c.clinicCode) || allAssignedClinicCodes.has(c.id)
    ).length;

    const unassignedClinics = totalClinics - assignedCount;
    const activeClinics = clinics.filter((c) => c.status === "active" || !c.status).length;

    return {
      total: totalClinics,
      assigned: assignedCount,
      unassigned: unassignedClinics,
      active: activeClinics,
    };
  }, [clinics, dcAgents]);

  // CRUD Operations
  const handleAddClinic = async () => {
    try {
      setErrorMessage("");
      setSuccessMessage("");

      if (!formData.clinicCode || !formData.clinicName) {
        setErrorMessage("Clinic Code and Clinic Name are required");
        return;
      }

      // Check for duplicate clinic code
      const existingClinic = clinics.find(
        (c) => c.clinicCode?.toLowerCase() === formData.clinicCode.toLowerCase()
      );
      if (existingClinic) {
        setErrorMessage(`Clinic with code "${formData.clinicCode}" already exists`);
        return;
      }

      const clinicData = {
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "clinicData"), clinicData);

      setSuccessMessage(`Clinic "${formData.clinicName}" added successfully!`);
      setOpenAddDialog(false);
      resetForm();
      fetchClinics();
    } catch (error) {
      console.error("Error adding clinic:", error);
      setErrorMessage(`Failed to add clinic: ${error.message}`);
    }
  };

  const handleEditClinic = async () => {
    try {
      setErrorMessage("");
      setSuccessMessage("");

      if (!selectedClinic) return;

      const clinicRef = doc(db, "clinicData", selectedClinic.id);
      const updateData = {
        ...formData,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(clinicRef, updateData);

      setSuccessMessage(`Clinic "${formData.clinicName}" updated successfully!`);
      setOpenEditDialog(false);
      setSelectedClinic(null);
      resetForm();
      fetchClinics();
    } catch (error) {
      console.error("Error updating clinic:", error);
      setErrorMessage(`Failed to update clinic: ${error.message}`);
    }
  };

  const handleDeleteClinic = async () => {
    try {
      setErrorMessage("");
      setSuccessMessage("");

      if (!selectedClinic) return;

      await deleteDoc(doc(db, "clinicData", selectedClinic.id));

      setSuccessMessage(`Clinic "${selectedClinic.clinicName}" deleted successfully!`);
      setOpenDeleteDialog(false);
      setSelectedClinic(null);
      fetchClinics();
    } catch (error) {
      console.error("Error deleting clinic:", error);
      setErrorMessage(`Failed to delete clinic: ${error.message}`);
    }
  };

  const handleAssignDC = async () => {
    try {
      setErrorMessage("");
      setSuccessMessage("");

      if (!selectedClinic) return;

      const clinicCode = selectedClinic.clinicCode;

      // Update the clinic document
      const clinicRef = doc(db, "clinicData", selectedClinic.id);
      const updateData = {
        assignedDC: formData.assignedDC,
        assignedDCId: formData.assignedDCId,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(clinicRef, updateData);

      // Remove clinic from ALL DCs that currently have it (not just the previous one)
      // This prevents duplicate assignments
      const batch = writeBatch(db);
      let removedFromCount = 0;

      dcAgents.forEach((dc) => {
        // Skip the new DC we're assigning to
        if (dc.id === formData.assignedDCId) return;

        const assignedClinics = dc.assignedClinics || [];
        if (assignedClinics.includes(clinicCode)) {
          const dcRef = doc(db, "offlineVisits", dc.id);
          batch.update(dcRef, {
            assignedClinics: arrayRemove(clinicCode),
          });
          removedFromCount++;
        }
      });

      // Commit removals if any
      if (removedFromCount > 0) {
        try {
          await batch.commit();
          console.log(`Removed clinic ${clinicCode} from ${removedFromCount} other DC(s)`);
        } catch (err) {
          console.error("Error removing clinic from other DCs:", err);
        }
      }

      // If assigning to a new DC, add clinic to their assignedClinics array
      if (formData.assignedDCId) {
        try {
          const newDCRef = doc(db, "offlineVisits", formData.assignedDCId);
          await updateDoc(newDCRef, {
            assignedClinics: arrayUnion(clinicCode),
          });
        } catch (err) {
          console.error("Error adding clinic to new DC:", err);
        }
      }

      setSuccessMessage(`DC assigned to "${selectedClinic.clinicName}" successfully!`);
      setOpenAssignDialog(false);
      setSelectedClinic(null);
      resetForm();
      fetchAllData(); // Refresh both clinics and DC agents
    } catch (error) {
      console.error("Error assigning DC:", error);
      setErrorMessage(`Failed to assign DC: ${error.message}`);
    }
  };

  // CSV Upload handling
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadStatus("parsing");
    setDuplicates([]);
    setValidRecords([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length < 2) {
          setErrorMessage("CSV file is empty or has no data rows");
          setUploadStatus("idle");
          return;
        }

        // Parse header
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const requiredHeaders = ["cliniccode", "clinicname"];
        const missingHeaders = requiredHeaders.filter(
          (h) => !headers.includes(h) && !headers.includes(h.replace(/\s/g, ""))
        );

        if (missingHeaders.length > 0) {
          setErrorMessage(`Missing required columns: ${missingHeaders.join(", ")}`);
          setUploadStatus("idle");
          return;
        }

        // Parse data rows
        const records = [];
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length !== headers.length) continue;

          const record = {};
          headers.forEach((header, index) => {
            const normalizedHeader = normalizeHeader(header);
            record[normalizedHeader] = values[index]?.trim() || "";
          });

          if (record.clinicCode && record.clinicName) {
            records.push(record);
          }
        }

        setUploadStatus("validating");
        validateRecords(records);
      } catch (error) {
        console.error("Error parsing CSV:", error);
        setErrorMessage("Failed to parse CSV file. Please check the format.");
        setUploadStatus("idle");
      }
    };

    reader.onerror = () => {
      setErrorMessage("Failed to read file");
      setUploadStatus("idle");
    };

    reader.readAsText(file);
  };

  // Parse CSV line handling quoted values
  const parseCSVLine = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  // Normalize header names to match our field names
  const normalizeHeader = (header) => {
    const headerMap = {
      cliniccode: "clinicCode",
      "clinic code": "clinicCode",
      clinicname: "clinicName",
      "clinic name": "clinicName",
      partnername: "partnerName",
      "partner name": "partnerName",
      branch: "branch",
      state: "state",
      region: "region",
      opsmanager: "opsManager",
      "ops manager": "opsManager",
      assigneddc: "assignedDC",
      "assigned dc": "assignedDC",
      address: "address",
      contactnumber: "contactNumber",
      "contact number": "contactNumber",
      status: "status",
    };

    return headerMap[header.toLowerCase()] || header;
  };

  // Validate records for duplicates
  const validateRecords = (records) => {
    const existingCodes = new Set(clinics.map((c) => c.clinicCode?.toLowerCase()));
    const duplicateRecords = [];
    const validRecordsList = [];
    const seenCodes = new Set();

    records.forEach((record) => {
      const code = record.clinicCode?.toLowerCase();

      if (existingCodes.has(code)) {
        duplicateRecords.push({ ...record, reason: "Already exists in database" });
      } else if (seenCodes.has(code)) {
        duplicateRecords.push({ ...record, reason: "Duplicate in CSV file" });
      } else {
        seenCodes.add(code);
        validRecordsList.push(record);
      }
    });

    setDuplicates(duplicateRecords);
    setValidRecords(validRecordsList);
    setUploadStatus("validated");
  };

  // Upload valid records to Firestore
  const handleUploadToFirestore = async () => {
    if (validRecords.length === 0) {
      setErrorMessage("No valid records to upload");
      return;
    }

    setUploadStatus("uploading");
    setUploadProgress(0);

    try {
      const batchSize = 500; // Firestore batch limit
      const batches = [];

      for (let i = 0; i < validRecords.length; i += batchSize) {
        batches.push(validRecords.slice(i, i + batchSize));
      }

      let uploaded = 0;
      for (const batchRecords of batches) {
        const batch = writeBatch(db);

        batchRecords.forEach((record) => {
          const docRef = doc(collection(db, "clinicData"));
          batch.set(docRef, {
            ...record,
            status: record.status || "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        });

        await batch.commit();
        uploaded += batchRecords.length;
        setUploadProgress(Math.round((uploaded / validRecords.length) * 100));
      }

      setSuccessMessage(`Successfully uploaded ${validRecords.length} clinics!`);
      setUploadStatus("done");
      setOpenUploadDialog(false);
      fetchClinics();

      // Reset upload state
      setTimeout(() => {
        setValidRecords([]);
        setDuplicates([]);
        setUploadStatus("idle");
        setUploadProgress(0);
      }, 2000);
    } catch (error) {
      console.error("Error uploading clinics:", error);
      setErrorMessage(`Failed to upload clinics: ${error.message}`);
      setUploadStatus("validated");
    }
  };

  // Download CSV template
  const downloadTemplate = () => {
    const headers = [
      "clinicCode",
      "clinicName",
      "partnerName",
      "branch",
      "state",
      "region",
      "opsManager",
      "assignedDC",
      "address",
      "contactNumber",
      "status",
    ];

    const sampleData = [
      "CLN001",
      "Sample Clinic Name",
      "Partner ABC",
      "Main Branch",
      "Maharashtra",
      "West",
      "John Manager",
      "DC Agent Name",
      "123 Main Street",
      "9876543210",
      "active",
    ];

    const csvContent = [headers.join(","), sampleData.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clinic_upload_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFormData({
      clinicCode: "",
      clinicName: "",
      partnerName: "",
      branch: "",
      state: "",
      region: "",
      opsManager: "",
      opsManagerId: "",
      assignedDC: "",
      assignedDCId: "",
      address: "",
      contactNumber: "",
      status: "active",
    });
  };

  const openEdit = (clinic) => {
    setSelectedClinic(clinic);
    // Find DC assigned to this clinic
    const assignedDC = findDCForClinicLocal(clinic);
    setFormData({
      clinicCode: clinic.clinicCode || "",
      clinicName: clinic.clinicName || "",
      partnerName: clinic.partnerName || "",
      branch: clinic.branch || "",
      state: clinic.state || "",
      region: clinic.region || "",
      opsManager: clinic.opsManager || "",
      opsManagerId: clinic.opsManagerId || "",
      assignedDC: assignedDC?.name || clinic.assignedDC || "",
      assignedDCId: assignedDC?.id || clinic.assignedDCId || "",
      address: clinic.address || "",
      contactNumber: clinic.contactNumber || "",
      status: clinic.status || "active",
    });
    setOpenEditDialog(true);
  };

  // Local helper to find DC for clinic (same logic as findDCForClinic but synchronous)
  const findDCForClinicLocal = (clinic) => {
    // Check if clinic has assignedDCId/assignedDC
    if (clinic.assignedDCId || clinic.assignedDC) {
      const dcRef = clinic.assignedDCId || clinic.assignedDC;
      const dc = dcAgents.find(
        (d) => d.id === dcRef || d.uid === dcRef || d.empId === dcRef
      );
      if (dc) return dc;
    }
    // Check if any DC has this clinic in their assignedClinics array
    for (const dc of dcAgents) {
      const assignedClinics = dc.assignedClinics || [];
      if (
        assignedClinics.includes(clinic.clinicCode) ||
        assignedClinics.includes(clinic.id)
      ) {
        return dc;
      }
    }
    return null;
  };

  const openAssign = (clinic) => {
    setSelectedClinic(clinic);
    const assignedDC = findDCForClinicLocal(clinic);
    setFormData({
      ...formData,
      assignedDC: assignedDC?.name || clinic.assignedDC || "",
      assignedDCId: assignedDC?.id || clinic.assignedDCId || "",
    });
    setOpenAssignDialog(true);
  };

  // ========== DUPLICATE DETECTION FUNCTIONS ==========

  // Find clinics assigned to multiple DCs (data integrity issue)
  const duplicateAssignments = useMemo(() => {
    const clinicToDCs = new Map(); // clinicCode -> [{ dcId, dcName }]

    // Check each DC's assignedClinics array
    dcAgents.forEach((dc) => {
      const assignedClinics = dc.assignedClinics || [];
      assignedClinics.forEach((clinicCode) => {
        if (!clinicToDCs.has(clinicCode)) {
          clinicToDCs.set(clinicCode, []);
        }
        clinicToDCs.get(clinicCode).push({ dcId: dc.id, dcName: dc.name });
      });
    });

    // Filter to only clinics with more than one DC
    const duplicates = [];
    clinicToDCs.forEach((dcs, clinicCode) => {
      if (dcs.length > 1) {
        const clinic = clinics.find((c) => c.clinicCode === clinicCode);
        duplicates.push({
          clinicCode,
          clinicName: clinic?.clinicName || "Unknown",
          assignedDCs: dcs,
        });
      }
    });

    return duplicates;
  }, [clinics, dcAgents]);

  // Fix duplicate assignment - remove clinic from all DCs except the selected one
  const fixDuplicateAssignment = async (clinicCode, keepDCId) => {
    try {
      setErrorMessage("");
      const batch = writeBatch(db);
      let removeCount = 0;

      // Remove clinic from all other DCs
      dcAgents.forEach((dc) => {
        if (dc.id !== keepDCId) {
          const assignedClinics = dc.assignedClinics || [];
          if (assignedClinics.includes(clinicCode)) {
            const dcRef = doc(db, "offlineVisits", dc.id);
            batch.update(dcRef, {
              assignedClinics: arrayRemove(clinicCode),
            });
            removeCount++;
          }
        }
      });

      if (removeCount > 0) {
        await batch.commit();
        setSuccessMessage(`Removed ${clinicCode} from ${removeCount} other DC(s). Now only assigned to selected DC.`);
        fetchAllData(); // Refresh data
      } else {
        setSuccessMessage("No changes needed.");
      }
    } catch (error) {
      console.error("Error fixing duplicate assignment:", error);
      setErrorMessage("Failed to fix duplicate: " + error.message);
    }
  };

  // Fix all duplicate assignments at once
  const fixAllDuplicates = async () => {
    if (duplicateAssignments.length === 0) return;

    try {
      setErrorMessage("");
      setSyncStatus("syncing");
      setSyncProgress(0);

      const batch = writeBatch(db);
      let totalFixes = 0;
      const clinicUpdates = [];

      duplicateAssignments.forEach((dup, index) => {
        // Keep the first DC in the list (or the one that matches clinic's assignedDCId)
        const clinic = clinics.find((c) => c.clinicCode === dup.clinicCode);
        let keepDCId = dup.assignedDCs[0].dcId;

        // If clinic has a direct assignedDCId, prefer that
        if (clinic?.assignedDCId) {
          const matchingDC = dup.assignedDCs.find((d) => d.dcId === clinic.assignedDCId);
          if (matchingDC) {
            keepDCId = matchingDC.dcId;
          }
        }

        // Remove from all other DCs
        dup.assignedDCs.forEach((dcInfo) => {
          if (dcInfo.dcId !== keepDCId) {
            const dcRef = doc(db, "offlineVisits", dcInfo.dcId);
            batch.update(dcRef, {
              assignedClinics: arrayRemove(dup.clinicCode),
            });
            totalFixes++;
          }
        });

        clinicUpdates.push({
          clinicCode: dup.clinicCode,
          keptDC: dup.assignedDCs.find((d) => d.dcId === keepDCId)?.dcName || keepDCId,
          removedFrom: dup.assignedDCs.filter((d) => d.dcId !== keepDCId).map((d) => d.dcName),
        });

        setSyncProgress(Math.round(((index + 1) / duplicateAssignments.length) * 100));
      });

      if (totalFixes > 0) {
        await batch.commit();
        setSuccessMessage(`Fixed ${duplicateAssignments.length} duplicate assignments. Removed ${totalFixes} incorrect DC mappings.`);
        console.log("Duplicate fix details:", clinicUpdates);
        fetchAllData(); // Refresh data
      }

      setSyncStatus("idle");
    } catch (error) {
      console.error("Error fixing all duplicates:", error);
      setErrorMessage("Failed to fix duplicates: " + error.message);
      setSyncStatus("idle");
    }
  };

  // Download duplicate assignments as CSV
  const downloadDuplicatesCSV = () => {
    if (duplicateAssignments.length === 0) return;

    // Create CSV header
    const headers = ["Clinic Code", "Clinic Name", "Assigned DCs (Will Keep)", "Assigned DCs (Will Remove)"];

    // Create CSV rows
    const rows = duplicateAssignments.map((dup) => {
      // Determine which DC would be kept (same logic as fixAllDuplicates)
      const clinic = clinics.find((c) => c.clinicCode === dup.clinicCode);
      let keepDCId = dup.assignedDCs[0]?.dcId;

      // If clinic has a direct assignedDCId, prefer that
      if (clinic?.assignedDCId) {
        const matchingDC = dup.assignedDCs.find((d) => d.dcId === clinic.assignedDCId);
        if (matchingDC) {
          keepDCId = matchingDC.dcId;
        }
      }

      const keptDC = dup.assignedDCs.find((d) => d.dcId === keepDCId)?.dcName || "Unknown";
      const removedDCs = dup.assignedDCs
        .filter((d) => d.dcId !== keepDCId)
        .map((d) => d.dcName)
        .join("; ");

      return [
        dup.clinicCode,
        dup.clinicName,
        keptDC,
        removedDCs,
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${(cell || "").replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `duplicate_clinic_assignments_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSuccessMessage(`Downloaded ${duplicateAssignments.length} duplicate clinic records to CSV`);
  };

  // ========== DC MAPPING SYNC FUNCTIONS ==========

  // Handle sync CSV file upload - Clinic-centric format
  // CSV Format: State, District, Partner Name, Block Name, Clinic Type, DC Name, Ops Name, Ops Contact, DC Employee Id, Final Clinic Code
  const handleSyncFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSyncStatus("parsing");
    setSyncProgress(10);
    setNewMappingData([]);
    setSyncAnalysis({
      dcsInBoth: [],
      dcsOnlyInDB: [],
      dcsOnlyInMapping: [],
      changes: [],
      totalClinicsToAdd: 0,
      totalClinicsToRemove: 0,
      totalDCsAffected: 0,
      clinicUpdates: [],
      totalClinicsToUpdate: 0,
      newClinicsToCreate: [],
    });

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length < 2) {
          setErrorMessage("CSV file is empty or has no data rows");
          setSyncStatus("idle");
          return;
        }

        // Parse header - use parseCSVLine to handle quoted values properly
        const rawHeaders = parseCSVLine(lines[0]);
        // Normalize headers: lowercase, remove special chars
        const headers = rawHeaders.map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));

        console.log("Raw headers:", rawHeaders);
        console.log("Normalized headers:", headers);

        // Find column indices - flexible matching for the specific CSV format
        // Expected: State, District, Partner Name, Block Name, Clinic Type, DC Name, Ops Name, Ops Contact, DC Employee Id, Final Clinic Code
        const findColumn = (keywords) => {
          return headers.findIndex((h) =>
            keywords.some((k) => h.includes(k.toLowerCase().replace(/[^a-z0-9]/g, "")))
          );
        };

        const colIndices = {
          state: findColumn(["state"]),
          district: findColumn(["district"]),
          partnerName: findColumn(["partnername", "partner"]),
          blockName: findColumn(["blockname", "block"]),
          clinicType: findColumn(["clinictype", "inhouseblock"]),
          dcName: findColumn(["dcname"]),
          opsName: findColumn(["opsname"]),
          opsContact: findColumn(["opscontact", "opsnumber"]),
          dcEmpId: findColumn(["dcemployee", "employeeid", "empid"]),
          clinicCode: findColumn(["finalcliniccode", "cliniccode"]),
        };

        console.log("Column indices:", colIndices);

        if (colIndices.clinicCode === -1) {
          setErrorMessage("CSV must have a 'Final Clinic Code' column. Found headers: " + rawHeaders.join(", "));
          setSyncStatus("idle");
          return;
        }

        setSyncProgress(30);

        // Parse data rows - one row per clinic-partner combination
        // Same clinic can appear multiple times with different partners
        // We'll group by clinic code and collect all partners
        const clinicMap = new Map(); // clinicCode -> { details, partners: [] }

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length === 0) continue;

          const clinicCode = colIndices.clinicCode !== -1 ? values[colIndices.clinicCode]?.trim() : "";
          if (!clinicCode) continue;

          const state = colIndices.state !== -1 ? values[colIndices.state]?.trim() || "" : "";
          const district = colIndices.district !== -1 ? values[colIndices.district]?.trim() || "" : "";
          const partnerName = colIndices.partnerName !== -1 ? values[colIndices.partnerName]?.trim() || "" : "";
          const blockName = colIndices.blockName !== -1 ? values[colIndices.blockName]?.trim() || "" : "";
          const clinicType = colIndices.clinicType !== -1 ? values[colIndices.clinicType]?.trim() || "" : "";
          const dcName = colIndices.dcName !== -1 ? values[colIndices.dcName]?.trim() || "" : "";
          const opsName = colIndices.opsName !== -1 ? values[colIndices.opsName]?.trim() || "" : "";
          // Clean ops contact - remove .0 suffix if present (Excel number formatting issue)
          let opsContact = colIndices.opsContact !== -1 ? values[colIndices.opsContact]?.trim() || "" : "";
          if (opsContact.endsWith(".0")) {
            opsContact = opsContact.slice(0, -2);
          }
          const dcEmpId = colIndices.dcEmpId !== -1 ? values[colIndices.dcEmpId]?.trim() || "" : "";

          if (clinicMap.has(clinicCode)) {
            // Add partner to existing clinic (same clinic, different partner)
            const existing = clinicMap.get(clinicCode);
            if (partnerName && !existing.partners.includes(partnerName)) {
              existing.partners.push(partnerName);
            }
          } else {
            // New clinic entry
            clinicMap.set(clinicCode, {
              clinicCode,
              state,
              district,
              partnerName, // Primary partner (first one encountered)
              partners: partnerName ? [partnerName] : [], // All partners for this clinic
              blockName,
              clinicType,
              dcName,
              opsName,
              opsContact,
              dcEmpId,
              originalRow: i + 1,
            });
          }
        }

        // Convert map to array and join partners
        const clinicDataList = Array.from(clinicMap.values()).map((clinic) => ({
          ...clinic,
          // Join all partners with comma for display/storage
          allPartners: clinic.partners.join(", "),
        }));

        if (clinicDataList.length === 0) {
          setErrorMessage("No valid clinic data found in CSV");
          setSyncStatus("idle");
          return;
        }

        console.log(`Parsed ${clinicDataList.length} unique clinics from ${lines.length - 1} rows`);
        setNewMappingData(clinicDataList);
        setSyncProgress(50);
        setSyncStatus("comparing");

        // Compare with existing database
        compareMappings(clinicDataList);
      } catch (error) {
        console.error("Error parsing sync CSV:", error);
        setErrorMessage("Failed to parse CSV file: " + error.message);
        setSyncStatus("idle");
      }
    };

    reader.onerror = () => {
      setErrorMessage("Failed to read file");
      setSyncStatus("idle");
    };

    reader.readAsText(file);
  };

  // Compare new mapping with existing database - Clinic-centric approach
  const compareMappings = (clinicDataList) => {
    try {
      const analysis = {
        dcsInBoth: [],
        dcsOnlyInDB: [],
        dcsOnlyInMapping: [],
        changes: [], // DC assignment changes
        totalClinicsToAdd: 0,
        totalClinicsToRemove: 0,
        totalDCsAffected: 0,
        clinicUpdates: [], // Clinic detail updates
        totalClinicsToUpdate: 0,
        newClinicsToCreate: [], // New clinics to create
      };

      // Create a map of existing clinics by code
      const existingClinicsMap = new Map();
      clinics.forEach((c) => {
        existingClinicsMap.set(c.clinicCode?.toLowerCase().trim(), c);
      });

      // Create a map of DCs by empId for quick lookup
      const dcByEmpId = new Map();
      dcAgents.forEach((dc) => {
        if (dc.empId) dcByEmpId.set(dc.empId.toLowerCase().trim(), dc);
        if (dc.empCode) dcByEmpId.set(dc.empCode.toLowerCase().trim(), dc);
        if (dc.mobile) dcByEmpId.set(dc.mobile.toLowerCase().trim(), dc);
      });

      // Group clinics by DC for assignment tracking
      const clinicsByDCEmpId = new Map(); // dcEmpId -> [clinicDetails]
      const dcNotFoundSet = new Set();

      // Process each clinic from CSV
      clinicDataList.forEach((csvClinic) => {
        const clinicCodeKey = csvClinic.clinicCode.toLowerCase().trim();
        const existingClinic = existingClinicsMap.get(clinicCodeKey);

        // Check if clinic needs update or creation
        const clinicUpdate = {
          clinicCode: csvClinic.clinicCode,
          isNew: !existingClinic,
          existingData: existingClinic || null,
          newData: {
            clinicCode: csvClinic.clinicCode,
            state: csvClinic.state,
            district: csvClinic.district,
            partnerName: csvClinic.partnerName,
            allPartners: csvClinic.allPartners, // All partners combined (from CSV grouping)
            blockName: csvClinic.blockName,
            clinicType: csvClinic.clinicType,
            opsName: csvClinic.opsName,
            opsContact: csvClinic.opsContact,
            dcName: csvClinic.dcName, // DC Name from CSV
          },
          dcEmpId: csvClinic.dcEmpId,
          originalRow: csvClinic.originalRow,
          hasChanges: false,
        };

        // Check if there are actual changes for existing clinic
        if (existingClinic) {
          const fieldsToCheck = ["state", "district", "partnerName", "allPartners", "blockName", "clinicType", "opsName", "opsContact", "dcName"];
          clinicUpdate.changedFields = [];
          fieldsToCheck.forEach((field) => {
            const oldVal = existingClinic[field] || "";
            const newVal = csvClinic[field] || "";
            if (newVal && newVal !== oldVal) {
              clinicUpdate.changedFields.push({
                field,
                oldValue: oldVal,
                newValue: newVal,
              });
              clinicUpdate.hasChanges = true;
            }
          });
        } else {
          clinicUpdate.hasChanges = true; // New clinic always has changes
          analysis.newClinicsToCreate.push(clinicUpdate);
        }

        if (clinicUpdate.hasChanges || !existingClinic) {
          analysis.clinicUpdates.push(clinicUpdate);
          analysis.totalClinicsToUpdate++;
        }

        // Group by DC for assignment
        if (csvClinic.dcEmpId) {
          const dcKey = csvClinic.dcEmpId.toLowerCase().trim();
          if (!clinicsByDCEmpId.has(dcKey)) {
            clinicsByDCEmpId.set(dcKey, []);
          }
          clinicsByDCEmpId.get(dcKey).push(csvClinic);

          // Check if DC exists
          if (!dcByEmpId.has(dcKey)) {
            dcNotFoundSet.add(csvClinic.dcEmpId);
          }
        }
      });

      // Now process DC assignments
      const processedDCs = new Set();

      clinicsByDCEmpId.forEach((clinicList, dcEmpIdKey) => {
        const dc = dcByEmpId.get(dcEmpIdKey);

        if (dc) {
          processedDCs.add(dc.id);
          const currentClinics = new Set(dc.assignedClinics || []);
          const newClinicCodes = clinicList.map((c) => c.clinicCode);

          // ONLY ADD, NEVER REMOVE
          const toAdd = newClinicCodes.filter((c) => !currentClinics.has(c));
          const unchanged = [...currentClinics];
          const finalClinics = [...new Set([...currentClinics, ...newClinicCodes])];

          if (toAdd.length > 0) {
            analysis.changes.push({
              dc,
              dcId: dc.id,
              dcName: dc.name,
              dcEmpId: dc.empId || dc.empCode,
              matchedBy: "empId",
              currentClinics: [...currentClinics],
              newClinics: finalClinics,
              toAdd,
              toAddDetails: clinicList.filter((c) => toAdd.includes(c.clinicCode)), // Include clinic details
              toRemove: [],
              unchanged,
            });
            analysis.totalClinicsToAdd += toAdd.length;
            analysis.totalDCsAffected++;
          }

          analysis.dcsInBoth.push({
            dc,
            matchedKey: dcEmpIdKey,
            matchedBy: "empId",
          });
        }
      });

      // DCs not found in database
      dcNotFoundSet.forEach((dcEmpId) => {
        analysis.dcsOnlyInMapping.push({
          identifier: dcEmpId,
          clinicCodes: clinicsByDCEmpId.get(dcEmpId.toLowerCase().trim())?.map((c) => c.clinicCode) || [],
          originalRow: clinicsByDCEmpId.get(dcEmpId.toLowerCase().trim())?.[0]?.originalRow,
        });
      });

      setSyncAnalysis(analysis);
      setSyncProgress(100);
      setSyncStatus("ready");
    } catch (error) {
      console.error("Error comparing mappings:", error);
      setErrorMessage("Failed to compare mappings: " + error.message);
      setSyncStatus("idle");
    }
  };

  // Apply the sync changes to database
  const applySyncChanges = async () => {
    const hasClinicUpdates = (syncAnalysis.clinicUpdates?.length || 0) > 0;
    const hasDCChanges = (syncAnalysis.changes?.length || 0) > 0;

    if (!hasClinicUpdates && !hasDCChanges) {
      setErrorMessage("No changes to apply");
      return;
    }

    setSyncStatus("applying");
    setSyncProgress(0);

    const logs = [];
    const timestamp = new Date().toISOString();
    let clinicsUpdated = 0;
    let clinicsCreated = 0;
    let dcsUpdated = 0;

    const totalOperations = (syncAnalysis.clinicUpdates?.length || 0) + (syncAnalysis.changes?.length || 0);
    let completedOps = 0;

    try {
      // Step 1: Update/Create clinic documents with details
      for (const clinicUpdate of (syncAnalysis.clinicUpdates || [])) {
        if (clinicUpdate.isNew) {
          // Create new clinic document
          const newClinicData = {
            ...clinicUpdate.newData,
            clinicName: clinicUpdate.newData.clinicCode, // Use code as name if not provided
            status: "active",
            createdAt: timestamp,
            createdBy: "sync_upload",
          };
          await addDoc(collection(db, "clinicData"), newClinicData);
          clinicsCreated++;

          logs.push({
            timestamp,
            type: "clinic_created",
            clinicCode: clinicUpdate.clinicCode,
            details: clinicUpdate.newData,
          });
        } else if (clinicUpdate.hasChanges && clinicUpdate.existingData?.id) {
          // Update existing clinic document
          const clinicRef = doc(db, "clinicData", clinicUpdate.existingData.id);
          const updateFields = {};
          clinicUpdate.changedFields?.forEach((cf) => {
            updateFields[cf.field] = cf.newValue;
          });
          updateFields.lastSyncAt = timestamp;

          await updateDoc(clinicRef, updateFields);
          clinicsUpdated++;

          logs.push({
            timestamp,
            type: "clinic_updated",
            clinicCode: clinicUpdate.clinicCode,
            changedFields: clinicUpdate.changedFields,
          });
        }

        completedOps++;
        setSyncProgress(Math.round((completedOps / totalOperations) * 100));
      }

      // Step 2: Update DC assignments
      for (const change of (syncAnalysis.changes || [])) {
        const dcRef = doc(db, "offlineVisits", change.dcId);

        // Build update object
        const updateData = {
          assignedClinics: change.newClinics || [],
          lastMappingSyncAt: timestamp,
          mappingSyncLog: {
            timestamp,
            previousClinics: change.currentClinics || [],
            newClinics: change.newClinics || [],
            clinicsAdded: change.toAdd || [],
          },
        };

        await updateDoc(dcRef, updateData);
        dcsUpdated++;

        logs.push({
          timestamp,
          type: "dc_assignment",
          dcId: change.dcId,
          dcName: change.dcName,
          dcEmpId: change.dcEmpId,
          clinicsAdded: change.toAdd || [],
          previousCount: change.currentClinics?.length || 0,
          newCount: change.newClinics?.length || 0,
        });

        completedOps++;
        setSyncProgress(Math.round((completedOps / totalOperations) * 100));
      }

      setSyncLogs([...logs, ...syncLogs]);
      setSuccessMessage(
        `Sync complete! Clinics: ${clinicsCreated} created, ${clinicsUpdated} updated. ` +
        `DCs: ${dcsUpdated} updated with ${syncAnalysis.totalClinicsToAdd} new assignments.`
      );
      setSyncStatus("done");

      // Refresh data after 2 seconds
      setTimeout(() => {
        fetchAllData();
      }, 2000);
    } catch (error) {
      console.error("Error applying sync changes:", error);
      setErrorMessage(`Failed to apply changes: ${error.message}. ${completedOps} of ${totalOperations} operations completed before the error.`);
      setSyncStatus("ready");
      setSyncLogs([...logs, ...syncLogs]);
    }
  };

  // Reset sync state
  const resetSyncState = () => {
    setSyncStatus("idle");
    setSyncProgress(0);
    setNewMappingData([]);
    setSyncAnalysis({
      dcsInBoth: [],
      dcsOnlyInDB: [],
      dcsOnlyInMapping: [],
      changes: [],
      totalClinicsToAdd: 0,
      totalClinicsToRemove: 0,
      totalDCsAffected: 0,
      clinicUpdates: [],
      totalClinicsToUpdate: 0,
      newClinicsToCreate: [],
    });
  };

  // ========== DATA CLEANUP UTILITIES ==========

  // Scan for corrupted data
  const scanForCorruptedData = () => {
    setCleanupStatus("scanning");
    setCorruptedClinics([]);
    setCorruptedDCAssignments([]);

    const corrupted = [];
    const dcCorrupted = [];

    // Check clinic documents for malformed clinic codes (containing commas)
    clinics.forEach((clinic) => {
      const code = clinic.clinicCode || "";
      const name = clinic.clinicName || "";

      // Check if clinicCode contains comma (multiple codes concatenated)
      if (code.includes(",")) {
        corrupted.push({
          id: clinic.id,
          type: "concatenated_code",
          clinicCode: code,
          clinicName: name,
          codesInField: code.split(",").map(c => c.trim()).filter(Boolean),
          issue: `Clinic code contains ${code.split(",").length} concatenated codes`,
          rawData: clinic,
        });
      }

      // Check if clinicName contains comma and looks like multiple codes
      if (name.includes(",") && /^[A-Z]+\d+/i.test(name)) {
        const potentialCodes = name.split(",").map(c => c.trim()).filter(Boolean);
        if (potentialCodes.length > 1 && potentialCodes.every(c => /^[A-Z]+\d+$/i.test(c))) {
          corrupted.push({
            id: clinic.id,
            type: "concatenated_name",
            clinicCode: code,
            clinicName: name,
            codesInField: potentialCodes,
            issue: `Clinic name contains ${potentialCodes.length} concatenated codes`,
            rawData: clinic,
          });
        }
      }
    });

    // Check DC assignedClinics for string instead of array, or arrays with concatenated values
    dcAgents.forEach((dc) => {
      const assigned = dc.assignedClinics;

      if (typeof assigned === "string" && assigned.includes(",")) {
        // assignedClinics is a string instead of array
        dcCorrupted.push({
          id: dc.id,
          dcName: dc.name,
          dcEmpId: dc.empId || dc.empCode,
          type: "string_instead_of_array",
          currentValue: assigned,
          codesFound: assigned.split(",").map(c => c.trim()).filter(Boolean),
          issue: "assignedClinics is a comma-separated string instead of array",
        });
      } else if (Array.isArray(assigned)) {
        // Check if any item in the array is a concatenated string
        const badItems = assigned.filter(item => typeof item === "string" && item.includes(","));
        if (badItems.length > 0) {
          dcCorrupted.push({
            id: dc.id,
            dcName: dc.name,
            dcEmpId: dc.empId || dc.empCode,
            type: "concatenated_array_items",
            currentValue: assigned,
            badItems: badItems,
            issue: `${badItems.length} array item(s) contain concatenated codes`,
          });
        }
      }
    });

    setCorruptedClinics(corrupted);
    setCorruptedDCAssignments(dcCorrupted);
    setCleanupStatus("ready");
  };

  // Fix corrupted clinic document by deleting it
  const deleteCorruptedClinic = async (clinicId) => {
    try {
      await deleteDoc(doc(db, "clinicData", clinicId));
      setCorruptedClinics(prev => prev.filter(c => c.id !== clinicId));
      setCleanupLogs(prev => [{
        timestamp: new Date().toISOString(),
        type: "clinic_deleted",
        clinicId,
        message: "Deleted corrupted clinic document",
      }, ...prev]);
      setSuccessMessage("Corrupted clinic document deleted successfully");
      // Refresh data
      fetchAllData();
    } catch (error) {
      console.error("Error deleting corrupted clinic:", error);
      setErrorMessage("Failed to delete clinic: " + error.message);
    }
  };

  // Fix DC assignedClinics - flatten concatenated strings into proper array
  const fixDCAssignedClinics = async (dcId, currentValue) => {
    try {
      let fixedClinics = [];

      if (typeof currentValue === "string") {
        // Convert string to array
        fixedClinics = currentValue.split(",").map(c => c.trim()).filter(Boolean);
      } else if (Array.isArray(currentValue)) {
        // Flatten any concatenated items in the array
        currentValue.forEach(item => {
          if (typeof item === "string" && item.includes(",")) {
            fixedClinics.push(...item.split(",").map(c => c.trim()).filter(Boolean));
          } else if (item) {
            fixedClinics.push(item);
          }
        });
      }

      // Remove duplicates
      fixedClinics = [...new Set(fixedClinics)];

      // Update the DC document
      const dcRef = doc(db, "offlineVisits", dcId);
      await updateDoc(dcRef, {
        assignedClinics: fixedClinics,
        lastCleanupAt: new Date().toISOString(),
        cleanupNote: "Fixed concatenated clinic codes",
      });

      setCorruptedDCAssignments(prev => prev.filter(d => d.id !== dcId));
      setCleanupLogs(prev => [{
        timestamp: new Date().toISOString(),
        type: "dc_fixed",
        dcId,
        previousValue: currentValue,
        newValue: fixedClinics,
        message: `Fixed DC assignedClinics: ${fixedClinics.length} clinics`,
      }, ...prev]);
      setSuccessMessage(`DC assignment fixed! Now has ${fixedClinics.length} properly formatted clinics.`);
      // Refresh data
      fetchAllData();
    } catch (error) {
      console.error("Error fixing DC assigned clinics:", error);
      setErrorMessage("Failed to fix DC: " + error.message);
    }
  };

  // Fix all corrupted DC assignments at once
  const fixAllDCAssignments = async () => {
    if (corruptedDCAssignments.length === 0) return;

    setCleanupStatus("fixing");
    let fixed = 0;
    let failed = 0;

    for (const dc of corruptedDCAssignments) {
      try {
        let fixedClinics = [];

        if (typeof dc.currentValue === "string") {
          fixedClinics = dc.currentValue.split(",").map(c => c.trim()).filter(Boolean);
        } else if (Array.isArray(dc.currentValue)) {
          dc.currentValue.forEach(item => {
            if (typeof item === "string" && item.includes(",")) {
              fixedClinics.push(...item.split(",").map(c => c.trim()).filter(Boolean));
            } else if (item) {
              fixedClinics.push(item);
            }
          });
        }

        fixedClinics = [...new Set(fixedClinics)];

        const dcRef = doc(db, "offlineVisits", dc.id);
        await updateDoc(dcRef, {
          assignedClinics: fixedClinics,
          lastCleanupAt: new Date().toISOString(),
          cleanupNote: "Fixed concatenated clinic codes (bulk)",
        });
        fixed++;
      } catch (error) {
        console.error(`Error fixing DC ${dc.id}:`, error);
        failed++;
      }
    }

    setCleanupLogs(prev => [{
      timestamp: new Date().toISOString(),
      type: "bulk_dc_fix",
      message: `Bulk fix complete: ${fixed} fixed, ${failed} failed`,
    }, ...prev]);

    setSuccessMessage(`Bulk fix complete: ${fixed} DCs fixed${failed > 0 ? `, ${failed} failed` : ""}`);
    setCorruptedDCAssignments([]);
    setCleanupStatus("ready");
    fetchAllData();
  };

  // Delete all corrupted clinic documents at once
  const deleteAllCorruptedClinics = async () => {
    if (corruptedClinics.length === 0) return;

    setCleanupStatus("fixing");
    let deleted = 0;
    let failed = 0;

    for (const clinic of corruptedClinics) {
      try {
        await deleteDoc(doc(db, "clinicData", clinic.id));
        deleted++;
      } catch (error) {
        console.error(`Error deleting clinic ${clinic.id}:`, error);
        failed++;
      }
    }

    setCleanupLogs(prev => [{
      timestamp: new Date().toISOString(),
      type: "bulk_clinic_delete",
      message: `Bulk delete complete: ${deleted} deleted, ${failed} failed`,
    }, ...prev]);

    setSuccessMessage(`Bulk delete complete: ${deleted} clinics deleted${failed > 0 ? `, ${failed} failed` : ""}`);
    setCorruptedClinics([]);
    setCleanupStatus("ready");
    fetchAllData();
  };

  // Download sync template - Clinic-centric format with all details
  const downloadSyncTemplate = () => {
    const headers = [
      "Clinic Code",
      "State",
      "District",
      "Partner Name",
      "Block Name",
      "Clinic Type",
      "Ops Name",
      "Ops Contact",
      "DC EmpId",
    ];

    // Build rows from existing clinics with their assigned DC
    const rows = clinics.map((clinic) => {
      // Find the DC assigned to this clinic
      const assignedDC = findDCForClinicLocal(clinic);
      return [
        clinic.clinicCode || "",
        clinic.state || "",
        clinic.district || "",
        clinic.partnerName || "",
        clinic.blockName || "",
        clinic.clinicType || "",
        clinic.opsName || "",
        clinic.opsContact || "",
        assignedDC?.empId || assignedDC?.empCode || "",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((v) => `"${v}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clinic_mapping_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get DC name by ID (checks id, uid, and empId)
  const getDCName = (dcId) => {
    if (!dcId) return "Unassigned";
    const dc = dcAgents.find(
      (d) => d.id === dcId || d.uid === dcId || d.empId === dcId
    );
    return dc?.name || dcId || "Unassigned";
  };

  // Find DC agent for a clinic (checks both clinic fields and DC's assignedClinics)
  const findDCForClinic = (clinic) => {
    // Check if clinic has assignedDCId/assignedDC
    if (clinic.assignedDCId || clinic.assignedDC) {
      const dcRef = clinic.assignedDCId || clinic.assignedDC;
      const dc = dcAgents.find(
        (d) => d.id === dcRef || d.uid === dcRef || d.empId === dcRef
      );
      if (dc) return dc;
    }

    // Check if any DC has this clinic in their assignedClinics array
    for (const dc of dcAgents) {
      const assignedClinics = dc.assignedClinics || [];
      if (
        assignedClinics.includes(clinic.clinicCode) ||
        assignedClinics.includes(clinic.id)
      ) {
        return dc;
      }
    }
    return null;
  };

  // Get OPS Manager name by ID (checks id, uid, and empId)
  const getOpsManagerName = (opsId) => {
    if (!opsId) return "Not assigned";
    const ops = opsManagers.find(
      (o) => o.id === opsId || o.uid === opsId || o.empId === opsId || o.name === opsId
    );
    return ops?.name || opsId || "Not assigned";
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            border: `3px solid ${colors.border.card}`,
            borderTopColor: colors.accent.primary,
            animation: `${spin} 1s linear infinite`,
          }}
        />
        <Typography
          variant="body1"
          sx={{
            mt: 2,
            color: colors.text.muted,
            animation: `${pulse} 1.5s ease-in-out infinite`,
          }}
        >
          Loading clinic data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          animation: `${fadeInDown} 0.5s ease-out`,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: colors.text.primary,
              letterSpacing: "-0.02em",
            }}
          >
            Clinic Mapping Manager
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text.muted, mt: 0.5 }}>
            Manage clinic data and DC assignments
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchAllData}
            sx={{
              borderRadius: "10px",
              borderColor: colors.border.card,
              color: colors.text.secondary,
              "&:hover": {
                borderColor: colors.accent.primary,
                backgroundColor: `${colors.accent.primary}10`,
              },
            }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<Upload />}
            onClick={() => setOpenUploadDialog(true)}
            sx={{
              borderRadius: "10px",
              borderColor: colors.border.card,
              color: colors.text.secondary,
              "&:hover": {
                borderColor: colors.accent.primary,
                backgroundColor: `${colors.accent.primary}10`,
              },
            }}
          >
            Upload CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              resetForm();
              setOpenAddDialog(true);
            }}
            sx={{
              borderRadius: "10px",
              background: `linear-gradient(135deg, ${colors.accent.primary} 0%, ${colors.accent.secondary} 100%)`,
              boxShadow: `0 4px 20px ${colors.accent.primary}40`,
              textTransform: "none",
              fontWeight: 600,
              "&:hover": {
                background: `linear-gradient(135deg, ${colors.accent.secondary} 0%, ${colors.accent.primary} 100%)`,
                transform: "translateY(-2px)",
              },
              transition: `all ${transitions.base}`,
            }}
          >
            Add Clinic
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {successMessage && (
        <Alert
          severity="success"
          onClose={() => setSuccessMessage("")}
          sx={{
            mb: 2,
            borderRadius: "12px",
            backgroundColor: `${colors.accent.success}15`,
            color: colors.accent.success,
            border: `1px solid ${colors.accent.success}40`,
            "& .MuiAlert-icon": { color: colors.accent.success },
          }}
        >
          {successMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert
          severity="error"
          onClose={() => setErrorMessage("")}
          sx={{
            mb: 2,
            borderRadius: "12px",
            backgroundColor: `${colors.accent.error}15`,
            color: colors.accent.error,
            border: `1px solid ${colors.accent.error}40`,
            "& .MuiAlert-icon": { color: colors.accent.error },
          }}
        >
          {errorMessage}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Total Clinics"
            value={stats.total}
            icon={LocalHospital}
            iconColor={colors.accent.primary}
            accentColor={colors.accent.primary}
            animationDelay={0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Assigned Clinics"
            value={stats.assigned}
            icon={AssignmentInd}
            iconColor={colors.accent.secondary}
            accentColor={colors.accent.secondary}
            animationDelay={100}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Unassigned Clinics"
            value={stats.unassigned}
            icon={Warning}
            iconColor={colors.accent.warning}
            accentColor={colors.accent.warning}
            animationDelay={200}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="DC Agents"
            value={dcAgents.length}
            icon={Person}
            iconColor={colors.accent.cyan}
            accentColor={colors.accent.cyan}
            animationDelay={300}
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{
            "& .MuiTabs-indicator": {
              backgroundColor: colors.accent.primary,
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
            "& .MuiTab-root": {
              color: colors.text.muted,
              textTransform: "none",
              fontWeight: 600,
              minHeight: 48,
              "&.Mui-selected": {
                color: colors.accent.primary,
              },
            },
          }}
        >
          <Tab icon={<LocalHospital />} iconPosition="start" label="All Clinics" />
          <Tab icon={<Person />} iconPosition="start" label="By DC Agent" />
          <Tab icon={<SupervisorAccount />} iconPosition="start" label="By OPS Manager" />
          <Tab icon={<Sync />} iconPosition="start" label="DC Mapping Sync" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <>
          {/* Filters */}
          <Box sx={{ animation: `${fadeInUp} 0.5s ease-out`, mb: 3 }}>
            <GlassCard>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: showFilters ? 2 : 0,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FilterList sx={{ color: colors.text.muted }} />
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: colors.text.primary }}>
                    Filters
                  </Typography>
                  <Chip
                    label={`${filteredClinics.length} results`}
                    size="small"
                    sx={{
                      ml: 1,
                      backgroundColor: `${colors.accent.primary}20`,
                      color: colors.accent.primary,
                      border: `1px solid ${colors.accent.primary}40`,
                    }}
                  />
                </Box>
                <IconButton size="small" onClick={() => setShowFilters(!showFilters)} sx={{ color: colors.text.muted }}>
                  {showFilters ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>

              <Collapse in={showFilters}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search clinics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search sx={{ color: colors.text.muted }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "10px",
                          backgroundColor: colors.background.secondary,
                          "& fieldset": { borderColor: colors.border.card },
                          "&:hover fieldset": { borderColor: colors.accent.primary },
                          "&.Mui-focused fieldset": { borderColor: colors.accent.primary },
                        },
                        "& .MuiInputBase-input": { color: colors.text.primary },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ color: colors.text.muted }}>State</InputLabel>
                      <Select
                        value={filterState}
                        label="State"
                        onChange={(e) => setFilterState(e.target.value)}
                        sx={{
                          borderRadius: "10px",
                          backgroundColor: colors.background.secondary,
                          "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.border.card },
                          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: colors.accent.primary },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: colors.accent.primary },
                          "& .MuiSelect-select": { color: colors.text.primary },
                          "& .MuiSvgIcon-root": { color: colors.text.muted },
                        }}
                      >
                        <MenuItem value="all">All States</MenuItem>
                        {uniqueStates.map((state) => (
                          <MenuItem key={state} value={state}>
                            {state}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ color: colors.text.muted }}>Region</InputLabel>
                      <Select
                        value={filterRegion}
                        label="Region"
                        onChange={(e) => setFilterRegion(e.target.value)}
                        sx={{
                          borderRadius: "10px",
                          backgroundColor: colors.background.secondary,
                          "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.border.card },
                          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: colors.accent.primary },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: colors.accent.primary },
                          "& .MuiSelect-select": { color: colors.text.primary },
                          "& .MuiSvgIcon-root": { color: colors.text.muted },
                        }}
                      >
                        <MenuItem value="all">All Regions</MenuItem>
                        {uniqueRegions.map((region) => (
                          <MenuItem key={region} value={region}>
                            {region}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ color: colors.text.muted }}>Assigned DC</InputLabel>
                      <Select
                        value={filterAssignedDC}
                        label="Assigned DC"
                        onChange={(e) => setFilterAssignedDC(e.target.value)}
                        sx={{
                          borderRadius: "10px",
                          backgroundColor: colors.background.secondary,
                          "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.border.card },
                          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: colors.accent.primary },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: colors.accent.primary },
                          "& .MuiSelect-select": { color: colors.text.primary },
                          "& .MuiSvgIcon-root": { color: colors.text.muted },
                        }}
                      >
                        <MenuItem value="all">All DCs</MenuItem>
                        <MenuItem value="unassigned">Unassigned</MenuItem>
                        {dcAgents.map((dc) => (
                          <MenuItem key={dc.id} value={dc.id}>
                            {dc.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => {
                        setSearchQuery("");
                        setFilterState("all");
                        setFilterRegion("all");
                        setFilterOpsManager("all");
                        setFilterAssignedDC("all");
                      }}
                      sx={{
                        borderRadius: "10px",
                        height: 40,
                        borderColor: colors.border.card,
                        color: colors.text.secondary,
                        "&:hover": {
                          borderColor: colors.accent.primary,
                          backgroundColor: `${colors.accent.primary}10`,
                        },
                      }}
                    >
                      Clear Filters
                    </Button>
                  </Grid>
                </Grid>
              </Collapse>
            </GlassCard>
          </Box>

          {/* Clinics Table */}
          <GlassCard sx={{ overflow: "hidden" }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: colors.background.secondary }}>
                    <TableCell sx={{ fontWeight: "bold", color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>Clinic Info</TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>Partner/Branch</TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>Assigned DC</TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>OPS Manager</TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: "bold", color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredClinics
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((clinic) => (
                      <TableRow
                        key={clinic.id}
                        sx={{
                          "&:hover": { backgroundColor: `${colors.accent.primary}10` },
                          "& td": { borderBottom: `1px solid ${colors.border.card}` },
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Avatar
                              sx={{
                                width: 40,
                                height: 40,
                                mr: 2,
                                bgcolor: `${colors.accent.primary}30`,
                                color: colors.accent.primary,
                                fontWeight: "bold",
                                fontSize: "0.9rem",
                              }}
                            >
                              <LocalHospital />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600} sx={{ color: colors.text.primary }}>
                                {clinic.clinicName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: colors.text.muted }}>
                                {clinic.clinicCode}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: colors.text.primary }}>{clinic.partnerName || "-"}</Typography>
                          <Typography variant="caption" sx={{ color: colors.text.muted }}>
                            {clinic.branch || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: colors.text.primary }}>{clinic.state || "-"}</Typography>
                          <Typography variant="caption" sx={{ color: colors.text.muted }}>
                            {clinic.region || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const assignedDC = findDCForClinic(clinic);
                            return assignedDC ? (
                              <Chip
                                icon={<Person sx={{ color: `${colors.accent.success} !important` }} />}
                                label={assignedDC.name}
                                size="small"
                                sx={{
                                  borderRadius: "8px",
                                  backgroundColor: `${colors.accent.success}20`,
                                  color: colors.accent.success,
                                  border: `1px solid ${colors.accent.success}40`,
                                }}
                              />
                            ) : (
                              <Chip
                                label="Unassigned"
                                size="small"
                                sx={{
                                  borderRadius: "8px",
                                  backgroundColor: `${colors.accent.warning}20`,
                                  color: colors.accent.warning,
                                  border: `1px solid ${colors.accent.warning}40`,
                                }}
                              />
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                            {getOpsManagerName(clinic.opsManagerId || clinic.opsManager)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={
                              clinic.status === "active" || !clinic.status ? (
                                <CheckCircle sx={{ fontSize: 14, color: `${colors.accent.success} !important` }} />
                              ) : (
                                <Cancel sx={{ fontSize: 14, color: `${colors.accent.error} !important` }} />
                              )
                            }
                            label={clinic.status || "active"}
                            size="small"
                            sx={{
                              borderRadius: "8px",
                              backgroundColor: clinic.status === "active" || !clinic.status ? `${colors.accent.success}20` : `${colors.accent.error}20`,
                              color: clinic.status === "active" || !clinic.status ? colors.accent.success : colors.accent.error,
                              border: `1px solid ${clinic.status === "active" || !clinic.status ? colors.accent.success : colors.accent.error}40`,
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                            <Tooltip title="Assign DC">
                              <IconButton
                                size="small"
                                onClick={() => openAssign(clinic)}
                                sx={{ color: colors.accent.primary, "&:hover": { backgroundColor: `${colors.accent.primary}20` } }}
                              >
                                <AssignmentInd fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => openEdit(clinic)}
                                sx={{ color: colors.accent.cyan, "&:hover": { backgroundColor: `${colors.accent.cyan}20` } }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedClinic(clinic);
                                  setOpenDeleteDialog(true);
                                }}
                                sx={{ color: colors.accent.error, "&:hover": { backgroundColor: `${colors.accent.error}20` } }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredClinics.length}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              sx={{
                borderTop: `1px solid ${colors.border.card}`,
                color: colors.text.secondary,
                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { color: colors.text.muted },
                "& .MuiSelect-select": { color: colors.text.primary },
                "& .MuiSvgIcon-root": { color: colors.text.muted },
              }}
            />
          </GlassCard>
        </>
      )}

      {/* By DC Agent Tab */}
      {activeTab === 1 && (
        <Box sx={{ animation: `${fadeInUp} 0.5s ease-out` }}>
          {Object.entries(clinicsByDC).map(([dcId, data], index) => (
            <Accordion
              key={dcId}
              elevation={0}
              sx={{
                backgroundColor: colors.background.card,
                border: `1px solid ${colors.border.card}`,
                borderRadius: "12px !important",
                mb: 2,
                "&:before": { display: "none" },
                "&.Mui-expanded": {
                  margin: "0 0 16px 0",
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore sx={{ color: colors.text.muted }} />}
                sx={{
                  "&.Mui-expanded": { minHeight: 48 },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      mr: 2,
                      bgcolor: dcId === "unassigned" ? `${colors.accent.warning}30` : `${colors.accent.success}30`,
                      color: dcId === "unassigned" ? colors.accent.warning : colors.accent.success,
                    }}
                  >
                    {dcId === "unassigned" ? <Warning /> : <Person />}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: colors.text.primary }}>
                      {data.dc.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.text.muted }}>
                      {data.dc.email || data.dc.mobile || ""}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${data.clinics.length} clinics`}
                    size="small"
                    sx={{
                      mr: 2,
                      backgroundColor: dcId === "unassigned" ? `${colors.accent.warning}20` : `${colors.accent.success}20`,
                      color: dcId === "unassigned" ? colors.accent.warning : colors.accent.success,
                      border: `1px solid ${dcId === "unassigned" ? colors.accent.warning : colors.accent.success}40`,
                    }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ backgroundColor: colors.background.secondary, borderTop: `1px solid ${colors.border.card}` }}>
                {data.clinics.length === 0 ? (
                  <Typography variant="body2" sx={{ py: 2, color: colors.text.muted }}>
                    No clinics assigned to this DC agent.
                  </Typography>
                ) : (
                  <List dense>
                    {data.clinics.map((clinic) => (
                      <ListItem
                        key={clinic.id}
                        sx={{
                          bgcolor: colors.background.card,
                          borderRadius: "10px",
                          mb: 1,
                          border: `1px solid ${colors.border.card}`,
                          "&:hover": { borderColor: colors.accent.primary },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: `${colors.accent.primary}30`, color: colors.accent.primary }}>
                            <LocalHospital />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography sx={{ color: colors.text.primary }}>{clinic.clinicName}</Typography>}
                          secondary={<Typography variant="caption" sx={{ color: colors.text.muted }}>{`${clinic.clinicCode} | ${clinic.state || ""} ${clinic.region || ""}`}</Typography>}
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(clinic)} sx={{ color: colors.accent.cyan }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reassign">
                            <IconButton size="small" onClick={() => openAssign(clinic)} sx={{ color: colors.accent.primary }}>
                              <AssignmentInd fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* By OPS Manager Tab */}
      {activeTab === 2 && (
        <Box sx={{ animation: `${fadeInUp} 0.5s ease-out` }}>
          {Object.entries(clinicsByOpsManager).map(([opsId, data]) => (
            <Accordion
              key={opsId}
              elevation={0}
              sx={{
                backgroundColor: colors.background.card,
                border: `1px solid ${colors.border.card}`,
                borderRadius: "12px !important",
                mb: 2,
                "&:before": { display: "none" },
                "&.Mui-expanded": {
                  margin: "0 0 16px 0",
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore sx={{ color: colors.text.muted }} />}
                sx={{
                  "&.Mui-expanded": { minHeight: 48 },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      mr: 2,
                      bgcolor: opsId === "unassigned" ? `${colors.accent.warning}30` : `${colors.accent.purple}30`,
                      color: opsId === "unassigned" ? colors.accent.warning : colors.accent.purple,
                    }}
                  >
                    {opsId === "unassigned" ? <Warning /> : <SupervisorAccount />}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: colors.text.primary }}>
                      {data.opsManager.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.text.muted }}>
                      {data.dcAgents.length} DC agents | {data.clinics.length} clinics
                    </Typography>
                  </Box>
                  <Chip
                    label={`${data.clinics.length} clinics`}
                    size="small"
                    sx={{
                      mr: 2,
                      backgroundColor: opsId === "unassigned" ? `${colors.accent.warning}20` : `${colors.accent.purple}20`,
                      color: opsId === "unassigned" ? colors.accent.warning : colors.accent.purple,
                      border: `1px solid ${opsId === "unassigned" ? colors.accent.warning : colors.accent.purple}40`,
                    }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ backgroundColor: colors.background.secondary, borderTop: `1px solid ${colors.border.card}` }}>
                {/* Show DC Agents under this OPS Manager */}
                {data.dcAgents.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: colors.text.primary }}>
                      DC Agents:
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {data.dcAgents.map((dcId) => (
                        <Chip
                          key={dcId}
                          icon={<Person sx={{ color: `${colors.accent.secondary} !important` }} />}
                          label={getDCName(dcId)}
                          size="small"
                          sx={{
                            backgroundColor: `${colors.accent.secondary}20`,
                            color: colors.accent.secondary,
                            border: `1px solid ${colors.accent.secondary}40`,
                          }}
                        />
                      ))}
                    </Box>
                    <Divider sx={{ my: 2, borderColor: colors.border.card }} />
                  </Box>
                )}

                {/* Show Clinics */}
                {data.clinics.length === 0 ? (
                  <Typography variant="body2" sx={{ py: 2, color: colors.text.muted }}>
                    No clinics under this OPS Manager.
                  </Typography>
                ) : (
                  <List dense>
                    {data.clinics.map((clinic) => (
                      <ListItem
                        key={clinic.id}
                        sx={{
                          bgcolor: colors.background.card,
                          borderRadius: "10px",
                          mb: 1,
                          border: `1px solid ${colors.border.card}`,
                          "&:hover": { borderColor: colors.accent.primary },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: `${colors.accent.primary}30`, color: colors.accent.primary }}>
                            <LocalHospital />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography sx={{ color: colors.text.primary }}>{clinic.clinicName}</Typography>}
                          secondary={
                            <Typography variant="caption" sx={{ color: colors.text.muted }}>
                              {clinic.clinicCode} | DC: {findDCForClinic(clinic)?.name || "Unassigned"}
                            </Typography>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(clinic)} sx={{ color: colors.accent.cyan }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* DC Mapping Sync Tab */}
      {activeTab === 3 && (
        <Box sx={{ animation: `${fadeInUp} 0.5s ease-out` }}>
          {/* Sync Header */}
          <GlassCard
            accentColor={colors.accent.primary}
            accentPosition="top"
            sx={{ mb: 3 }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  mr: 2,
                  background: `linear-gradient(135deg, ${colors.accent.primary} 0%, ${colors.accent.secondary} 100%)`,
                }}
              >
                <Sync sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold" sx={{ color: colors.text.primary }}>
                  DC Mapping Sync
                </Typography>
                <Typography variant="body2" sx={{ color: colors.text.muted }}>
                  Bulk update DC-Clinic assignments safely with preview and audit log
                </Typography>
              </Box>
            </Box>

            <Alert
              severity="info"
              sx={{
                borderRadius: "12px",
                mb: 2,
                backgroundColor: `${colors.accent.cyan}15`,
                color: colors.accent.cyan,
                border: `1px solid ${colors.accent.cyan}40`,
                "& .MuiAlert-icon": { color: colors.accent.cyan },
              }}
            >
              <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                <strong style={{ color: colors.text.primary }}>CSV Format (one row per clinic):</strong>
                <br />
                Clinic Code | State | District | Partner Name | Block Name | Clinic Type | Ops Name | Ops Contact | DC EmpId
                <br /><br />
                <strong style={{ color: colors.text.primary }}>What happens:</strong>
                <ol style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
                  <li><strong>New clinics</strong> are created in the database with all details</li>
                  <li><strong>Existing clinics</strong> get updated details (State, District, Partner, Block, etc.)</li>
                  <li><strong>DC assignments</strong> are added (existing assignments preserved)</li>
                </ol>
                <strong style={{ color: colors.text.primary }}>Safe Mode:</strong> Only adds - never removes existing clinic assignments.
              </Typography>
            </Alert>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={downloadSyncTemplate}
                sx={{
                  borderRadius: "10px",
                  borderColor: colors.border.card,
                  color: colors.text.secondary,
                  "&:hover": {
                    borderColor: colors.accent.primary,
                    backgroundColor: `${colors.accent.primary}10`,
                  },
                }}
              >
                Export Current Mapping
              </Button>
              {syncStatus === "idle" && (
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<Upload />}
                  sx={{
                    borderRadius: "10px",
                    background: `linear-gradient(135deg, ${colors.accent.primary} 0%, ${colors.accent.secondary} 100%)`,
                    boxShadow: `0 4px 20px ${colors.accent.primary}40`,
                    "&:hover": {
                      background: `linear-gradient(135deg, ${colors.accent.secondary} 0%, ${colors.accent.primary} 100%)`,
                    },
                  }}
                >
                  Upload New Mapping CSV
                  <input
                    type="file"
                    accept=".csv"
                    hidden
                    onChange={handleSyncFileUpload}
                  />
                </Button>
              )}
              {(syncStatus === "ready" || syncStatus === "done") && (
                <Button
                  variant="outlined"
                  onClick={resetSyncState}
                  sx={{
                    borderRadius: "10px",
                    borderColor: colors.border.card,
                    color: colors.text.secondary,
                    "&:hover": {
                      borderColor: colors.accent.primary,
                      backgroundColor: `${colors.accent.primary}10`,
                    },
                  }}
                >
                  Reset / Upload Another
                </Button>
              )}
            </Box>
          </GlassCard>

          {/* Duplicate Assignments Detection Card */}
          <GlassCard
            accentColor={duplicateAssignments.length > 0 ? colors.accent.error : colors.accent.primary}
            accentPosition="left"
            sx={{ mb: 3 }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    mr: 2,
                    bgcolor: duplicateAssignments.length > 0 ? `${colors.accent.error}30` : `${colors.accent.primary}30`,
                    color: duplicateAssignments.length > 0 ? colors.accent.error : colors.accent.primary,
                  }}
                >
                  {duplicateAssignments.length > 0 ? <Warning /> : <CheckCircle />}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: duplicateAssignments.length > 0 ? colors.accent.error : colors.accent.primary }}>
                    Data Integrity Check
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.text.muted }}>
                    {duplicateAssignments.length > 0
                      ? `Found ${duplicateAssignments.length} clinic(s) assigned to multiple DCs`
                      : "No duplicate clinic assignments detected"}
                  </Typography>
                </Box>
              </Box>
              {duplicateAssignments.length > 0 && (
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={downloadDuplicatesCSV}
                    sx={{
                      borderRadius: "10px",
                      borderColor: colors.border.card,
                      color: colors.text.secondary,
                      "&:hover": {
                        borderColor: colors.accent.primary,
                        backgroundColor: `${colors.accent.primary}10`,
                      },
                    }}
                  >
                    Download CSV
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Sync />}
                    onClick={fixAllDuplicates}
                    disabled={syncStatus === "syncing"}
                    sx={{
                      borderRadius: "10px",
                      background: `linear-gradient(135deg, ${colors.accent.error} 0%, ${colors.accent.warning} 100%)`,
                      "&:hover": {
                        background: `linear-gradient(135deg, ${colors.accent.warning} 0%, ${colors.accent.error} 100%)`,
                      },
                    }}
                  >
                    {syncStatus === "syncing" ? "Fixing..." : "Fix All Duplicates"}
                  </Button>
                </Box>
              )}
            </Box>

            {duplicateAssignments.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Alert
                  severity="warning"
                  sx={{
                    mb: 2,
                    borderRadius: "12px",
                    backgroundColor: `${colors.accent.warning}15`,
                    color: colors.accent.warning,
                    border: `1px solid ${colors.accent.warning}40`,
                    "& .MuiAlert-icon": { color: colors.accent.warning },
                  }}
                >
                  <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                    <strong style={{ color: colors.text.primary }}>Issue:</strong> The following clinics appear in multiple DCs' assigned clinics lists.
                    This causes incorrect filtering and data display. Click "Fix All Duplicates" to keep only one DC assignment per clinic.
                  </Typography>
                </Alert>
                <TableContainer sx={{ maxHeight: 300, backgroundColor: colors.background.secondary, borderRadius: "12px" }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: "bold", bgcolor: colors.background.card, color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>Clinic Code</TableCell>
                        <TableCell sx={{ fontWeight: "bold", bgcolor: colors.background.card, color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>Clinic Name</TableCell>
                        <TableCell sx={{ fontWeight: "bold", bgcolor: colors.background.card, color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>Assigned to DCs</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {duplicateAssignments.slice(0, 50).map((dup) => (
                        <TableRow key={dup.clinicCode} sx={{ "&:hover": { backgroundColor: `${colors.accent.primary}10` } }}>
                          <TableCell sx={{ color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>
                            <Typography variant="body2" fontWeight={600}>
                              {dup.clinicCode}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ color: colors.text.secondary, borderBottom: `1px solid ${colors.border.card}` }}>
                            <Typography variant="body2">{dup.clinicName}</Typography>
                          </TableCell>
                          <TableCell sx={{ borderBottom: `1px solid ${colors.border.card}` }}>
                            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                              {dup.assignedDCs.map((dc, idx) => (
                                <Chip
                                  key={dc.dcId}
                                  label={dc.dcName}
                                  size="small"
                                  sx={{
                                    fontSize: "0.7rem",
                                    backgroundColor: idx === 0 ? `${colors.accent.primary}20` : "transparent",
                                    color: idx === 0 ? colors.accent.primary : colors.accent.error,
                                    border: `1px solid ${idx === 0 ? colors.accent.primary : colors.accent.error}40`,
                                  }}
                                />
                              ))}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {duplicateAssignments.length > 50 && (
                  <Typography variant="caption" sx={{ mt: 1, display: "block", color: colors.text.muted }}>
                    Showing first 50 of {duplicateAssignments.length} duplicates
                  </Typography>
                )}
              </Box>
            )}
          </GlassCard>

          {/* Processing Status */}
          {(syncStatus === "parsing" || syncStatus === "comparing") && (
            <GlassCard sx={{ mb: 3, textAlign: "center", py: 2 }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  border: `3px solid ${colors.border.card}`,
                  borderTopColor: colors.accent.primary,
                  animation: `${spin} 1s linear infinite`,
                  mx: "auto",
                  mb: 2,
                }}
              />
              <Typography variant="h6" sx={{ color: colors.text.primary }}>
                {syncStatus === "parsing" ? "Parsing CSV file..." : "Comparing with database..."}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={syncProgress}
                sx={{
                  mt: 2,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.background.secondary,
                  "& .MuiLinearProgress-bar": {
                    background: `linear-gradient(90deg, ${colors.accent.primary} 0%, ${colors.accent.secondary} 100%)`,
                    borderRadius: 4,
                  },
                }}
              />
              <Typography variant="body2" sx={{ mt: 1, color: colors.text.muted }}>
                {syncProgress}% complete
              </Typography>
            </GlassCard>
          )}

          {/* Sync Analysis Results */}
          {syncStatus === "ready" && (
            <>
              {/* Summary Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={2.4}>
                  <StatCard
                    title="New Clinics"
                    value={syncAnalysis.newClinicsToCreate?.length || 0}
                    color={colors.accent.warning}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <StatCard
                    title="Clinics to Update"
                    value={syncAnalysis.totalClinicsToUpdate - (syncAnalysis.newClinicsToCreate?.length || 0)}
                    color={colors.accent.cyan}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <StatCard
                    title="DCs Matched"
                    value={syncAnalysis.dcsInBoth?.length || 0}
                    color={colors.accent.primary}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <StatCard
                    title="DCs With New Clinics"
                    value={syncAnalysis.totalDCsAffected}
                    color={colors.accent.purple}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <StatCard
                    title="DC Assignments to Add"
                    value={syncAnalysis.totalClinicsToAdd}
                    color={colors.accent.secondary}
                    icon={<AddCircle />}
                  />
                </Grid>
              </Grid>

              {/* Clinic Updates Preview */}
              {syncAnalysis.clinicUpdates?.length > 0 && (
                <GlassCard
                  accentColor={colors.accent.cyan}
                  accentPosition="left"
                  sx={{ mb: 3 }}
                >
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: colors.text.primary }}>
                    <LocalHospital sx={{ mr: 1, verticalAlign: "middle", color: colors.accent.cyan }} />
                    Clinic Details to Update ({syncAnalysis.clinicUpdates?.length || 0})
                  </Typography>
                  <Divider sx={{ mb: 2, borderColor: colors.border.card }} />

                    {/* New Clinics */}
                    {syncAnalysis.newClinicsToCreate?.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: colors.accent.warning }}>
                          <AddCircle sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle" }} />
                          New Clinics to Create ({syncAnalysis.newClinicsToCreate?.length || 0})
                        </Typography>
                        <TableContainer sx={{ maxHeight: 200, backgroundColor: colors.background.secondary, borderRadius: "12px" }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: "bold", bgcolor: colors.background.card, color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>Clinic Code</TableCell>
                                <TableCell sx={{ fontWeight: "bold", bgcolor: colors.background.card, color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>State</TableCell>
                                <TableCell sx={{ fontWeight: "bold", bgcolor: colors.background.card, color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>District</TableCell>
                                <TableCell sx={{ fontWeight: "bold", bgcolor: colors.background.card, color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>Partners (All)</TableCell>
                                <TableCell sx={{ fontWeight: "bold", bgcolor: colors.background.card, color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>Block</TableCell>
                                <TableCell sx={{ fontWeight: "bold", bgcolor: colors.background.card, color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>Type</TableCell>
                                <TableCell sx={{ fontWeight: "bold", bgcolor: colors.background.card, color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>Ops Name</TableCell>
                                <TableCell sx={{ fontWeight: "bold", bgcolor: colors.background.card, color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>DC EmpId</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {(syncAnalysis.newClinicsToCreate || []).slice(0, 10).map((clinic) => (
                                <TableRow key={clinic.clinicCode} sx={{ "&:hover": { backgroundColor: `${colors.accent.primary}10` } }}>
                                  <TableCell sx={{ color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}><strong>{clinic.clinicCode}</strong></TableCell>
                                  <TableCell sx={{ color: colors.text.secondary, borderBottom: `1px solid ${colors.border.card}` }}>{clinic.newData.state || "-"}</TableCell>
                                  <TableCell sx={{ color: colors.text.secondary, borderBottom: `1px solid ${colors.border.card}` }}>{clinic.newData.district || "-"}</TableCell>
                                  <TableCell sx={{ color: colors.text.secondary, borderBottom: `1px solid ${colors.border.card}` }}>{clinic.newData.allPartners || clinic.newData.partnerName || "-"}</TableCell>
                                  <TableCell sx={{ color: colors.text.secondary, borderBottom: `1px solid ${colors.border.card}` }}>{clinic.newData.blockName || "-"}</TableCell>
                                  <TableCell sx={{ color: colors.text.secondary, borderBottom: `1px solid ${colors.border.card}` }}>{clinic.newData.clinicType || "-"}</TableCell>
                                  <TableCell sx={{ color: colors.text.secondary, borderBottom: `1px solid ${colors.border.card}` }}>{clinic.newData.opsName || "-"}</TableCell>
                                  <TableCell sx={{ color: colors.text.secondary, borderBottom: `1px solid ${colors.border.card}` }}>{clinic.dcEmpId || "-"}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        {syncAnalysis.newClinicsToCreate?.length > 10 && (
                          <Typography variant="caption" sx={{ color: colors.text.muted }}>
                            ...and {(syncAnalysis.newClinicsToCreate?.length || 0) - 10} more new clinics
                          </Typography>
                        )}
                      </Box>
                    )}

                    {/* Existing Clinics with Updates */}
                    {(syncAnalysis.clinicUpdates || []).filter(c => !c.isNew && c.hasChanges).length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: colors.accent.cyan }}>
                          <EditIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle" }} />
                          Existing Clinics to Update ({(syncAnalysis.clinicUpdates || []).filter(c => !c.isNew && c.hasChanges).length})
                        </Typography>
                        <TableContainer sx={{ maxHeight: 200, backgroundColor: colors.background.secondary, borderRadius: "12px" }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: "bold", bgcolor: colors.background.card, color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>Clinic Code</TableCell>
                                <TableCell sx={{ fontWeight: "bold", bgcolor: colors.background.card, color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>Fields Changed</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {(syncAnalysis.clinicUpdates || []).filter(c => !c.isNew && c.hasChanges).slice(0, 10).map((clinic) => (
                                <TableRow key={clinic.clinicCode} sx={{ "&:hover": { backgroundColor: `${colors.accent.primary}10` } }}>
                                  <TableCell sx={{ color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}><strong>{clinic.clinicCode}</strong></TableCell>
                                  <TableCell sx={{ borderBottom: `1px solid ${colors.border.card}` }}>
                                    {clinic.changedFields?.map((cf, i) => (
                                      <Chip
                                        key={i}
                                        label={`${cf.field}: ${cf.oldValue || '(empty)'} → ${cf.newValue}`}
                                        size="small"
                                        sx={{
                                          mr: 0.5,
                                          mb: 0.5,
                                          fontSize: "0.7rem",
                                          backgroundColor: `${colors.accent.cyan}20`,
                                          color: colors.accent.cyan,
                                          border: `1px solid ${colors.accent.cyan}40`,
                                        }}
                                      />
                                    ))}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        {(syncAnalysis.clinicUpdates || []).filter(c => !c.isNew && c.hasChanges).length > 10 && (
                          <Typography variant="caption" sx={{ color: colors.text.muted }}>
                            ...and {(syncAnalysis.clinicUpdates || []).filter(c => !c.isNew && c.hasChanges).length - 10} more clinics to update
                          </Typography>
                        )}
                      </Box>
                    )}

                    {/* Apply Button for Clinic Updates */}
                    <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                      <Button
                        variant="contained"
                        startIcon={<PlayArrow />}
                        onClick={applySyncChanges}
                        sx={{
                          borderRadius: "10px",
                          background: `linear-gradient(135deg, ${colors.accent.primary} 0%, ${colors.accent.secondary} 100%)`,
                          boxShadow: `0 4px 20px ${colors.accent.primary}40`,
                          "&:hover": {
                            background: `linear-gradient(135deg, ${colors.accent.secondary} 0%, ${colors.accent.primary} 100%)`,
                          },
                        }}
                      >
                        Apply All Changes
                      </Button>
                    </Box>
                </GlassCard>
              )}

              {/* Warnings for DCs not found */}
              {syncAnalysis.dcsOnlyInMapping?.length > 0 && (
                <Alert
                  severity="warning"
                  sx={{
                    mb: 3,
                    borderRadius: "12px",
                    backgroundColor: `${colors.accent.warning}15`,
                    color: colors.accent.warning,
                    border: `1px solid ${colors.accent.warning}40`,
                    "& .MuiAlert-icon": { color: colors.accent.warning },
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ color: colors.text.primary }}>
                    {syncAnalysis.dcsOnlyInMapping?.length || 0} DC(s) in CSV not found in database:
                  </Typography>
                  <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {(syncAnalysis.dcsOnlyInMapping || []).map((item, idx) => (
                      <Chip
                        key={idx}
                        label={`${item.identifier} (row ${item.originalRow})`}
                        size="small"
                        sx={{
                          backgroundColor: `${colors.accent.warning}20`,
                          color: colors.accent.warning,
                          border: `1px solid ${colors.accent.warning}40`,
                        }}
                      />
                    ))}
                  </Box>
                  <Typography variant="caption" sx={{ mt: 1, display: "block", color: colors.text.muted }}>
                    These will be skipped. Make sure DC names/empIds match exactly.
                  </Typography>
                </Alert>
              )}

              {/* DCs not in mapping - will be unchanged */}
              {syncAnalysis.dcsOnlyInDB?.length > 0 && (
                <Accordion
                  elevation={0}
                  sx={{
                    backgroundColor: colors.background.card,
                    border: `1px solid ${colors.border.card}`,
                    borderRadius: "12px !important",
                    mb: 2,
                    "&:before": { display: "none" },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMore sx={{ color: colors.text.muted }} />}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Chip
                        label={syncAnalysis.dcsOnlyInDB?.length || 0}
                        size="small"
                        sx={{ mr: 2, bgcolor: colors.background.secondary, color: colors.text.secondary }}
                      />
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ color: colors.text.primary }}>
                        DCs Not in Mapping (will remain unchanged)
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ backgroundColor: colors.background.secondary, borderTop: `1px solid ${colors.border.card}` }}>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {(syncAnalysis.dcsOnlyInDB || []).map((item) => (
                        <Chip
                          key={item.dc?.id}
                          icon={<Person sx={{ color: `${colors.text.muted} !important` }} />}
                          label={`${item.dc?.name || "Unknown"} (${item.currentClinics?.length || 0} clinics)`}
                          size="small"
                          sx={{
                            backgroundColor: "transparent",
                            color: colors.text.secondary,
                            border: `1px solid ${colors.border.card}`,
                          }}
                        />
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Changes Preview */}
              {syncAnalysis.changes?.length > 0 ? (
                <GlassCard
                  accentColor={colors.accent.purple}
                  accentPosition="left"
                  sx={{ mb: 3 }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: colors.text.primary }}>
                      Changes Preview ({syncAnalysis.changes?.length || 0} DCs)
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<PlayArrow />}
                      onClick={applySyncChanges}
                      sx={{
                        borderRadius: "10px",
                        background: `linear-gradient(135deg, ${colors.accent.primary} 0%, ${colors.accent.secondary} 100%)`,
                        boxShadow: `0 4px 20px ${colors.accent.primary}40`,
                        "&:hover": {
                          background: `linear-gradient(135deg, ${colors.accent.secondary} 0%, ${colors.accent.primary} 100%)`,
                        },
                      }}
                    >
                      Apply All Changes
                    </Button>
                  </Box>

                  <Divider sx={{ mb: 2, borderColor: colors.border.card }} />

                  {(syncAnalysis.changes || []).map((change, idx) => (
                    <Accordion
                      key={change.dcId}
                      elevation={0}
                      sx={{
                        backgroundColor: colors.background.card,
                        border: `1px solid ${colors.border.card}`,
                        borderRadius: "12px !important",
                        mb: 1,
                        "&:before": { display: "none" },
                        "&.Mui-expanded": { margin: "0 0 8px 0" },
                      }}
                    >
                      <AccordionSummary expandIcon={<ExpandMore sx={{ color: colors.text.muted }} />}>
                        <Box sx={{ display: "flex", alignItems: "center", width: "100%", gap: 2 }}>
                          <Avatar sx={{ bgcolor: `${colors.accent.purple}30`, color: colors.accent.purple }}>
                            <Person />
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: colors.text.primary }}>
                              {change.dcName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: colors.text.muted }}>
                              EmpID: <strong style={{ color: colors.text.secondary }}>{change.dcEmpId || "N/A"}</strong> | Matched by: <strong style={{ color: colors.text.secondary }}>{change.matchedBy}</strong> | {change.currentClinics?.length || 0} → {change.newClinics?.length || 0} clinics
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            {change.toAdd?.length > 0 && (
                              <Chip
                                icon={<AddCircle sx={{ fontSize: 16, color: `${colors.accent.primary} !important` }} />}
                                label={`+${change.toAdd?.length || 0}`}
                                size="small"
                                sx={{
                                  backgroundColor: `${colors.accent.primary}20`,
                                  color: colors.accent.primary,
                                  border: `1px solid ${colors.accent.primary}40`,
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ backgroundColor: colors.background.secondary, borderTop: `1px solid ${colors.border.card}` }}>
                        <Grid container spacing={2}>
                          {/* Clinics to Add */}
                          {change.toAdd?.length > 0 && (
                            <Grid item xs={12} md={6}>
                              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: colors.accent.primary }}>
                                <AddCircle sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle" }} />
                                New Clinics to Add ({change.toAdd?.length || 0})
                              </Typography>
                              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                {(change.toAdd || []).map((code) => (
                                  <Chip
                                    key={code}
                                    label={code}
                                    size="small"
                                    sx={{
                                      backgroundColor: `${colors.accent.primary}20`,
                                      color: colors.accent.primary,
                                      border: `1px solid ${colors.accent.primary}40`,
                                    }}
                                  />
                                ))}
                              </Box>
                            </Grid>
                          )}
                          {/* Existing Clinics - Will be preserved */}
                          {change.unchanged?.length > 0 && (
                            <Grid item xs={12} md={6}>
                              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: colors.text.muted }}>
                                <CheckCircle sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle" }} />
                                Existing Clinics (preserved) ({change.unchanged?.length || 0})
                              </Typography>
                              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                {(change.unchanged || []).slice(0, 10).map((code) => (
                                  <Chip
                                    key={code}
                                    label={code}
                                    size="small"
                                    sx={{
                                      backgroundColor: "transparent",
                                      color: colors.text.secondary,
                                      border: `1px solid ${colors.border.card}`,
                                    }}
                                  />
                                ))}
                                {change.unchanged?.length > 10 && (
                                  <Chip
                                    label={`+${(change.unchanged?.length || 0) - 10} more`}
                                    size="small"
                                    sx={{
                                      backgroundColor: "transparent",
                                      color: colors.text.muted,
                                      border: `1px solid ${colors.border.card}`,
                                    }}
                                  />
                                )}
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </GlassCard>
              ) : (syncAnalysis.clinicUpdates?.length || 0) === 0 ? (
                <Alert
                  severity="success"
                  sx={{
                    borderRadius: "12px",
                    backgroundColor: `${colors.accent.primary}15`,
                    color: colors.accent.primary,
                    border: `1px solid ${colors.accent.primary}40`,
                    "& .MuiAlert-icon": { color: colors.accent.primary },
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: colors.text.primary }}>
                    No changes needed!
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                    The uploaded mapping matches the current database. All clinic details and DC assignments are already up to date.
                  </Typography>
                </Alert>
              ) : null}
            </>
          )}

          {/* Applying Changes Progress */}
          {syncStatus === "applying" && (
            <GlassCard sx={{ mb: 3, textAlign: "center", py: 2 }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  border: `3px solid ${colors.border.card}`,
                  borderTopColor: colors.accent.primary,
                  animation: `${spin} 1s linear infinite`,
                  mx: "auto",
                  mb: 2,
                }}
              />
              <Typography variant="h6" sx={{ color: colors.text.primary }}>
                Applying changes to database...
              </Typography>
              <LinearProgress
                variant="determinate"
                value={syncProgress}
                sx={{
                  mt: 2,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.background.secondary,
                  "& .MuiLinearProgress-bar": {
                    background: `linear-gradient(90deg, ${colors.accent.primary} 0%, ${colors.accent.secondary} 100%)`,
                    borderRadius: 4,
                  },
                }}
              />
              <Typography variant="body2" sx={{ mt: 1, color: colors.text.muted }}>
                {syncProgress}% complete - Updating clinic details and DC assignments
              </Typography>
            </GlassCard>
          )}

          {/* Sync Complete */}
          {syncStatus === "done" && (
            <GlassCard
              accentColor={colors.accent.primary}
              accentPosition="top"
              sx={{ mb: 3, textAlign: "center", py: 2 }}
            >
              <CheckCircle sx={{ fontSize: 64, color: colors.accent.primary, mb: 2 }} />
              <Typography variant="h5" fontWeight="bold" sx={{ color: colors.accent.primary }}>
                Sync Complete!
              </Typography>
              <Typography variant="body1" sx={{ mt: 1, color: colors.text.secondary }}>
                <strong style={{ color: colors.text.primary }}>Clinics:</strong> {syncAnalysis.newClinicsToCreate?.length || 0} created, {syncAnalysis.totalClinicsToUpdate - (syncAnalysis.newClinicsToCreate?.length || 0)} updated
                <br />
                <strong style={{ color: colors.text.primary }}>DC Assignments:</strong> {syncAnalysis.totalDCsAffected} DCs updated with {syncAnalysis.totalClinicsToAdd} new assignments
              </Typography>
            </GlassCard>
          )}

          {/* Sync Audit Log - DC Assignments only */}
          {syncLogs?.filter(l => l.type === "dc_assignment")?.length > 0 && (
            <GlassCard>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <History sx={{ mr: 1, color: colors.text.muted }} />
                <Typography variant="h6" fontWeight="bold" sx={{ color: colors.text.primary }}>
                  Sync Audit Log (This Session)
                </Typography>
              </Box>
              <TableContainer sx={{ maxHeight: 300, backgroundColor: colors.background.secondary, borderRadius: "12px" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold", bgcolor: colors.background.card, color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>Time</TableCell>
                      <TableCell sx={{ fontWeight: "bold", bgcolor: colors.background.card, color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>DC Name</TableCell>
                      <TableCell sx={{ fontWeight: "bold", bgcolor: colors.background.card, color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>EmpId</TableCell>
                      <TableCell sx={{ fontWeight: "bold", bgcolor: colors.background.card, color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>Clinics Added</TableCell>
                      <TableCell sx={{ fontWeight: "bold", bgcolor: colors.background.card, color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>New Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(syncLogs || []).filter(l => l.type === "dc_assignment").map((log, idx) => (
                      <TableRow key={idx} sx={{ "&:hover": { backgroundColor: `${colors.accent.primary}10` } }}>
                        <TableCell sx={{ color: colors.text.muted, borderBottom: `1px solid ${colors.border.card}` }}>
                          <Typography variant="caption">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>
                          <Typography variant="body2" fontWeight={500}>
                            {log.dcName}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: colors.text.muted, borderBottom: `1px solid ${colors.border.card}` }}>
                          <Typography variant="caption">
                            {log.dcEmpId || "N/A"}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ borderBottom: `1px solid ${colors.border.card}` }}>
                          <Chip
                            label={`+${log.clinicsAdded?.length || 0}`}
                            size="small"
                            sx={{
                              minWidth: 50,
                              backgroundColor: `${colors.accent.primary}20`,
                              color: colors.accent.primary,
                              border: `1px solid ${colors.accent.primary}40`,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: colors.text.secondary, borderBottom: `1px solid ${colors.border.card}` }}>
                          <Typography variant="body2">
                            {log.newCount || 0} clinics
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </GlassCard>
          )}

          {/* Data Cleanup Section */}
          <Divider sx={{ my: 4, borderColor: colors.border.card }} />
          <GlassCard
            accentColor={colors.accent.warning}
            accentPosition="left"
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Avatar sx={{ bgcolor: `${colors.accent.warning}30`, color: colors.accent.warning, mr: 2 }}>
                <Warning />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ color: colors.accent.warning }}>
                  Data Cleanup Utility
                </Typography>
                <Typography variant="body2" sx={{ color: colors.text.muted }}>
                  Scan and fix corrupted clinic records (concatenated codes, malformed data)
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={cleanupStatus === "scanning" ? <CircularProgress size={16} color="inherit" /> : <Search />}
                onClick={scanForCorruptedData}
                disabled={cleanupStatus === "scanning" || cleanupStatus === "fixing"}
                sx={{
                  borderRadius: "10px",
                  background: `linear-gradient(135deg, ${colors.accent.warning} 0%, ${colors.accent.error} 100%)`,
                  "&:hover": {
                    background: `linear-gradient(135deg, ${colors.accent.error} 0%, ${colors.accent.warning} 100%)`,
                  },
                }}
              >
                {cleanupStatus === "scanning" ? "Scanning..." : "Scan for Issues"}
              </Button>
            </Box>

            {/* Scan Results */}
            {cleanupStatus === "ready" && (
              <>
                {/* Summary */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <StatCard
                      title="Corrupted Clinic Documents"
                      value={corruptedClinics.length}
                      color={corruptedClinics.length > 0 ? colors.accent.error : colors.accent.primary}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StatCard
                      title="DCs with Malformed Assignments"
                      value={corruptedDCAssignments.length}
                      color={corruptedDCAssignments.length > 0 ? colors.accent.error : colors.accent.primary}
                    />
                  </Grid>
                </Grid>

                {/* No Issues Found */}
                {corruptedClinics.length === 0 && corruptedDCAssignments.length === 0 && (
                  <Alert
                    severity="success"
                    sx={{
                      borderRadius: "12px",
                      mb: 2,
                      backgroundColor: `${colors.accent.primary}15`,
                      color: colors.accent.primary,
                      border: `1px solid ${colors.accent.primary}40`,
                      "& .MuiAlert-icon": { color: colors.accent.primary },
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: colors.text.primary }}>
                      No corrupted data found!
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                      All clinic documents and DC assignments are properly formatted.
                    </Typography>
                  </Alert>
                )}

                  {/* Corrupted Clinic Documents */}
                  {corruptedClinics.length > 0 && (
                    <Accordion
                      elevation={0}
                      sx={{
                        backgroundColor: colors.background.card,
                        border: `1px solid ${colors.accent.error}40`,
                        borderRadius: "12px !important",
                        mb: 2,
                        "&:before": { display: "none" },
                      }}
                    >
                      <AccordionSummary expandIcon={<ExpandMore sx={{ color: colors.text.muted }} />}>
                        <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                          <Chip
                            label={corruptedClinics.length}
                            size="small"
                            sx={{
                              mr: 2,
                              backgroundColor: `${colors.accent.error}20`,
                              color: colors.accent.error,
                              border: `1px solid ${colors.accent.error}40`,
                            }}
                          />
                          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: colors.accent.error }}>
                            Corrupted Clinic Documents
                          </Typography>
                          <Box sx={{ flexGrow: 1 }} />
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Delete />}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Delete ALL ${corruptedClinics.length} corrupted clinic documents? This cannot be undone.`)) {
                                deleteAllCorruptedClinics();
                              }
                            }}
                            sx={{
                              mr: 1,
                              borderRadius: "10px",
                              borderColor: colors.accent.error,
                              color: colors.accent.error,
                              "&:hover": {
                                borderColor: colors.accent.error,
                                backgroundColor: `${colors.accent.error}10`,
                              },
                            }}
                          >
                            Delete All
                          </Button>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ backgroundColor: colors.background.secondary, borderTop: `1px solid ${colors.border.card}` }}>
                        <Typography variant="body2" sx={{ mb: 2, color: colors.text.muted }}>
                          These clinic documents have concatenated codes in their clinicCode or clinicName fields.
                          They should be deleted and replaced with properly formatted individual records.
                        </Typography>
                        <TableContainer sx={{ maxHeight: 300, backgroundColor: colors.background.card, borderRadius: "12px" }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: "bold", bgcolor: colors.background.card, color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>Issue Type</TableCell>
                                <TableCell sx={{ fontWeight: "bold", bgcolor: colors.background.card, color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>Clinic Code</TableCell>
                                <TableCell sx={{ fontWeight: "bold", bgcolor: colors.background.card, color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>Codes Found</TableCell>
                                <TableCell sx={{ fontWeight: "bold", bgcolor: colors.background.card, color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>Action</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {corruptedClinics.map((clinic) => (
                                <TableRow key={clinic.id} sx={{ "&:hover": { backgroundColor: `${colors.accent.primary}10` } }}>
                                  <TableCell sx={{ borderBottom: `1px solid ${colors.border.card}` }}>
                                    <Chip
                                      label={clinic.type === "concatenated_code" ? "Code" : "Name"}
                                      size="small"
                                      sx={{
                                        backgroundColor: "transparent",
                                        color: colors.accent.error,
                                        border: `1px solid ${colors.accent.error}40`,
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell sx={{ color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>
                                    <Typography variant="body2" sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {clinic.clinicCode}
                                    </Typography>
                                  </TableCell>
                                  <TableCell sx={{ color: colors.text.secondary, borderBottom: `1px solid ${colors.border.card}` }}>
                                    <Typography variant="body2">
                                      {clinic.codesInField?.length || 0} codes concatenated
                                    </Typography>
                                  </TableCell>
                                  <TableCell sx={{ borderBottom: `1px solid ${colors.border.card}` }}>
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        if (window.confirm("Delete this corrupted clinic document?")) {
                                          deleteCorruptedClinic(clinic.id);
                                        }
                                      }}
                                      sx={{ color: colors.accent.error }}
                                    >
                                      <Delete fontSize="small" />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {/* Corrupted DC Assignments */}
                  {corruptedDCAssignments.length > 0 && (
                    <Accordion
                      elevation={0}
                      sx={{
                        backgroundColor: colors.background.card,
                        border: `1px solid ${colors.accent.warning}40`,
                        borderRadius: "12px !important",
                        mb: 2,
                        "&:before": { display: "none" },
                      }}
                    >
                      <AccordionSummary expandIcon={<ExpandMore sx={{ color: colors.text.muted }} />}>
                        <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                          <Chip
                            label={corruptedDCAssignments.length}
                            size="small"
                            sx={{
                              mr: 2,
                              backgroundColor: `${colors.accent.warning}20`,
                              color: colors.accent.warning,
                              border: `1px solid ${colors.accent.warning}40`,
                            }}
                          />
                          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: colors.accent.warning }}>
                            DCs with Malformed Assignments
                          </Typography>
                          <Box sx={{ flexGrow: 1 }} />
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<CheckCircle />}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Fix ALL ${corruptedDCAssignments.length} DC assignments? This will properly format their clinic arrays.`)) {
                                fixAllDCAssignments();
                              }
                            }}
                            sx={{
                              mr: 1,
                              borderRadius: "10px",
                              background: `linear-gradient(135deg, ${colors.accent.primary} 0%, ${colors.accent.secondary} 100%)`,
                              "&:hover": {
                                background: `linear-gradient(135deg, ${colors.accent.secondary} 0%, ${colors.accent.primary} 100%)`,
                              },
                            }}
                          >
                            Fix All
                          </Button>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ backgroundColor: colors.background.secondary, borderTop: `1px solid ${colors.border.card}` }}>
                        <Typography variant="body2" sx={{ mb: 2, color: colors.text.muted }}>
                          These DC agents have assignedClinics stored as concatenated strings or arrays with concatenated items.
                          Fixing will split them into proper array format.
                        </Typography>
                        <TableContainer sx={{ maxHeight: 300, backgroundColor: colors.background.card, borderRadius: "12px" }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: "bold", bgcolor: colors.background.card, color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>DC Name</TableCell>
                                <TableCell sx={{ fontWeight: "bold", bgcolor: colors.background.card, color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>EmpId</TableCell>
                                <TableCell sx={{ fontWeight: "bold", bgcolor: colors.background.card, color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>Issue</TableCell>
                                <TableCell sx={{ fontWeight: "bold", bgcolor: colors.background.card, color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>Clinics Found</TableCell>
                                <TableCell sx={{ fontWeight: "bold", bgcolor: colors.background.card, color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>Action</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {corruptedDCAssignments.map((dc) => (
                                <TableRow key={dc.id} sx={{ "&:hover": { backgroundColor: `${colors.accent.primary}10` } }}>
                                  <TableCell sx={{ color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>
                                    <Typography variant="body2" fontWeight={500}>
                                      {dc.dcName}
                                    </Typography>
                                  </TableCell>
                                  <TableCell sx={{ color: colors.text.muted, borderBottom: `1px solid ${colors.border.card}` }}>
                                    <Typography variant="caption">
                                      {dc.dcEmpId || "N/A"}
                                    </Typography>
                                  </TableCell>
                                  <TableCell sx={{ borderBottom: `1px solid ${colors.border.card}` }}>
                                    <Chip
                                      label={dc.type === "string_instead_of_array" ? "String" : "Bad Items"}
                                      size="small"
                                      sx={{
                                        backgroundColor: "transparent",
                                        color: colors.accent.warning,
                                        border: `1px solid ${colors.accent.warning}40`,
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell sx={{ color: colors.text.secondary, borderBottom: `1px solid ${colors.border.card}` }}>
                                    <Typography variant="body2">
                                      {dc.codesFound?.length || dc.badItems?.length || 0} codes
                                    </Typography>
                                  </TableCell>
                                  <TableCell sx={{ borderBottom: `1px solid ${colors.border.card}` }}>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      startIcon={<CheckCircle />}
                                      onClick={() => fixDCAssignedClinics(dc.id, dc.currentValue)}
                                      sx={{
                                        borderRadius: "10px",
                                        borderColor: colors.accent.primary,
                                        color: colors.accent.primary,
                                        "&:hover": {
                                          borderColor: colors.accent.primary,
                                          backgroundColor: `${colors.accent.primary}10`,
                                        },
                                      }}
                                    >
                                      Fix
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {/* Cleanup Log */}
                  {cleanupLogs.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: colors.text.primary }}>
                        Cleanup Log
                      </Typography>
                      <Box sx={{ maxHeight: 150, overflow: "auto", bgcolor: colors.background.secondary, p: 1.5, borderRadius: "10px", border: `1px solid ${colors.border.card}` }}>
                        {cleanupLogs.map((log, idx) => (
                          <Typography key={idx} variant="caption" sx={{ display: "block", fontFamily: "monospace", color: colors.text.muted }}>
                            [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  )}
                </>
              )}

              {/* Fixing Progress */}
              {cleanupStatus === "fixing" && (
                <Box sx={{ textAlign: "center", py: 3 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      border: `3px solid ${colors.border.card}`,
                      borderTopColor: colors.accent.primary,
                      animation: `${spin} 1s linear infinite`,
                      mx: "auto",
                      mb: 2,
                    }}
                  />
                  <Typography variant="body1" sx={{ color: colors.text.primary }}>Applying fixes...</Typography>
                </Box>
              )}
          </GlassCard>
        </Box>
      )}

      {/* Add/Edit Clinic Dialog */}
      <Dialog
        open={openAddDialog || openEditDialog}
        onClose={() => {
          setOpenAddDialog(false);
          setOpenEditDialog(false);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            backgroundColor: colors.background.card,
            backgroundImage: "none",
            border: `1px solid ${colors.border.card}`,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, borderBottom: `1px solid ${colors.border.card}` }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {openAddDialog ? <Add sx={{ mr: 1, color: colors.accent.primary }} /> : <EditIcon sx={{ mr: 1, color: colors.accent.primary }} />}
            <Typography variant="h6" fontWeight="bold" sx={{ color: colors.text.primary }}>
              {openAddDialog ? "Add New Clinic" : "Edit Clinic"}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Clinic Code"
                value={formData.clinicCode}
                onChange={(e) => setFormData({ ...formData, clinicCode: e.target.value })}
                required
                disabled={openEditDialog}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Code sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Clinic Name"
                value={formData.clinicName}
                onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocalHospital sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Partner Name"
                value={formData.partnerName}
                onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Business sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Branch"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Region"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>OPS Manager</InputLabel>
                <Select
                  value={formData.opsManagerId || ""}
                  label="OPS Manager"
                  onChange={(e) => {
                    const ops = opsManagers.find((o) => o.id === e.target.value);
                    setFormData({
                      ...formData,
                      opsManagerId: e.target.value,
                      opsManager: ops?.name || "",
                    });
                  }}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {opsManagers.map((ops) => (
                    <MenuItem key={ops.id} value={ops.id}>
                      {ops.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Assigned DC</InputLabel>
                <Select
                  value={formData.assignedDCId || ""}
                  label="Assigned DC"
                  onChange={(e) => {
                    const dc = dcAgents.find((d) => d.id === e.target.value);
                    setFormData({
                      ...formData,
                      assignedDCId: e.target.value,
                      assignedDC: dc?.name || "",
                    });
                  }}
                >
                  <MenuItem value="">
                    <em>Unassigned</em>
                  </MenuItem>
                  {dcAgents.map((dc) => (
                    <MenuItem key={dc.id} value={dc.id}>
                      {dc.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Number"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="active">
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <CheckCircle sx={{ color: "success.main", mr: 1, fontSize: 18 }} />
                      Active
                    </Box>
                  </MenuItem>
                  <MenuItem value="inactive">
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Cancel sx={{ color: "error.main", mr: 1, fontSize: 18 }} />
                      Inactive
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1, borderTop: `1px solid ${colors.border.card}` }}>
          <Button
            onClick={() => {
              setOpenAddDialog(false);
              setOpenEditDialog(false);
            }}
            sx={{
              borderRadius: "10px",
              color: colors.text.secondary,
              "&:hover": {
                backgroundColor: `${colors.accent.primary}10`,
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={openAddDialog ? handleAddClinic : handleEditClinic}
            disabled={!formData.clinicCode || !formData.clinicName}
            sx={{
              borderRadius: "10px",
              background: `linear-gradient(135deg, ${colors.accent.primary} 0%, ${colors.accent.secondary} 100%)`,
              boxShadow: `0 4px 20px ${colors.accent.primary}40`,
              "&:hover": {
                background: `linear-gradient(135deg, ${colors.accent.secondary} 0%, ${colors.accent.primary} 100%)`,
              },
            }}
          >
            {openAddDialog ? "Add Clinic" : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign DC Dialog */}
      <Dialog
        open={openAssignDialog}
        onClose={() => setOpenAssignDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            backgroundColor: colors.background.card,
            backgroundImage: "none",
            border: `1px solid ${colors.border.card}`,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, borderBottom: `1px solid ${colors.border.card}` }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <AssignmentInd sx={{ mr: 1, color: colors.accent.primary }} />
            <Typography variant="h6" fontWeight="bold" sx={{ color: colors.text.primary }}>
              Assign DC Agent
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2, color: colors.text.muted }}>
              Assigning DC to: <strong style={{ color: colors.text.primary }}>{selectedClinic?.clinicName}</strong>
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Select DC Agent</InputLabel>
              <Select
                value={formData.assignedDCId || ""}
                label="Select DC Agent"
                onChange={(e) => {
                  const dc = dcAgents.find((d) => d.id === e.target.value);
                  setFormData({
                    ...formData,
                    assignedDCId: e.target.value,
                    assignedDC: dc?.name || "",
                  });
                }}
              >
                <MenuItem value="">
                  <em>Unassign</em>
                </MenuItem>
                {dcAgents.map((dc) => (
                  <MenuItem key={dc.id} value={dc.id}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          mr: 1,
                          fontSize: "0.7rem",
                          bgcolor: "success.light",
                          color: "success.main",
                        }}
                      >
                        {dc.name?.charAt(0)}
                      </Avatar>
                      {dc.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1, borderTop: `1px solid ${colors.border.card}` }}>
          <Button
            onClick={() => setOpenAssignDialog(false)}
            sx={{
              borderRadius: "10px",
              color: colors.text.secondary,
              "&:hover": {
                backgroundColor: `${colors.accent.primary}10`,
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAssignDC}
            sx={{
              borderRadius: "10px",
              background: `linear-gradient(135deg, ${colors.accent.primary} 0%, ${colors.accent.secondary} 100%)`,
              boxShadow: `0 4px 20px ${colors.accent.primary}40`,
              "&:hover": {
                background: `linear-gradient(135deg, ${colors.accent.secondary} 0%, ${colors.accent.primary} 100%)`,
              },
            }}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: "16px",
            backgroundColor: colors.background.card,
            backgroundImage: "none",
            border: `1px solid ${colors.border.card}`,
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: `1px solid ${colors.border.card}` }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Warning sx={{ mr: 1, color: colors.accent.error }} />
            <Typography variant="h6" fontWeight="bold" sx={{ color: colors.text.primary }}>
              Confirm Delete
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2, mt: 2, color: colors.text.secondary }}>
            Are you sure you want to delete the clinic:
          </Typography>
          <Box
            sx={{
              bgcolor: colors.background.secondary,
              p: 2,
              borderRadius: "12px",
              border: `1px solid ${colors.border.card}`,
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: colors.text.primary }}>
              {selectedClinic?.clinicName}
            </Typography>
            <Typography variant="body2" sx={{ color: colors.text.muted }}>
              Code: {selectedClinic?.clinicCode}
            </Typography>
          </Box>
          <Alert
            severity="warning"
            sx={{
              mt: 2,
              borderRadius: "12px",
              backgroundColor: `${colors.accent.warning}15`,
              color: colors.accent.warning,
              border: `1px solid ${colors.accent.warning}40`,
              "& .MuiAlert-icon": { color: colors.accent.warning },
            }}
          >
            <Typography variant="body2" sx={{ color: colors.text.secondary }}>This action cannot be undone.</Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1, borderTop: `1px solid ${colors.border.card}` }}>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            sx={{
              borderRadius: "10px",
              color: colors.text.secondary,
              "&:hover": {
                backgroundColor: `${colors.accent.primary}10`,
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDeleteClinic}
            sx={{
              borderRadius: "10px",
              background: `linear-gradient(135deg, ${colors.accent.error} 0%, ${colors.accent.warning} 100%)`,
              "&:hover": {
                background: `linear-gradient(135deg, ${colors.accent.warning} 0%, ${colors.accent.error} 100%)`,
              },
            }}
          >
            Delete Clinic
          </Button>
        </DialogActions>
      </Dialog>

      {/* CSV Upload Dialog */}
      <Dialog
        open={openUploadDialog}
        onClose={() => {
          if (uploadStatus !== "uploading") {
            setOpenUploadDialog(false);
            setValidRecords([]);
            setDuplicates([]);
            setUploadStatus("idle");
          }
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            backgroundColor: colors.background.card,
            backgroundImage: "none",
            border: `1px solid ${colors.border.card}`,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, borderBottom: `1px solid ${colors.border.card}` }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <CloudUpload sx={{ mr: 1, color: colors.accent.primary }} />
              <Typography variant="h6" fontWeight="bold" sx={{ color: colors.text.primary }}>
                Upload Clinics from CSV
              </Typography>
            </Box>
            <IconButton
              onClick={() => {
                if (uploadStatus !== "uploading") {
                  setOpenUploadDialog(false);
                }
              }}
              disabled={uploadStatus === "uploading"}
              sx={{ color: colors.text.muted }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Instructions */}
            <Alert
              severity="info"
              sx={{
                mb: 3,
                borderRadius: "12px",
                backgroundColor: `${colors.accent.cyan}15`,
                color: colors.accent.cyan,
                border: `1px solid ${colors.accent.cyan}40`,
                "& .MuiAlert-icon": { color: colors.accent.cyan },
              }}
            >
              <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                Upload a CSV file with clinic data. Required columns: <strong style={{ color: colors.text.primary }}>clinicCode</strong>, <strong style={{ color: colors.text.primary }}>clinicName</strong>.
                Optional columns: partnerName, branch, state, region, opsManager, assignedDC, address, contactNumber, status.
              </Typography>
            </Alert>

            {/* Download Template Button */}
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={downloadTemplate}
              sx={{
                mb: 3,
                borderRadius: "10px",
                borderColor: colors.border.card,
                color: colors.text.secondary,
                "&:hover": {
                  borderColor: colors.accent.primary,
                  backgroundColor: `${colors.accent.primary}10`,
                },
              }}
            >
              Download CSV Template
            </Button>

            {/* File Upload */}
            {uploadStatus === "idle" && (
              <Box
                sx={{
                  border: `2px dashed ${colors.accent.primary}60`,
                  borderRadius: "16px",
                  p: 4,
                  textAlign: "center",
                  bgcolor: `${colors.accent.primary}10`,
                  cursor: "pointer",
                  transition: transitions.base,
                  "&:hover": {
                    bgcolor: `${colors.accent.primary}20`,
                    borderColor: colors.accent.primary,
                  },
                }}
                component="label"
              >
                <input
                  type="file"
                  accept=".csv"
                  hidden
                  onChange={handleFileUpload}
                />
                <CloudUpload sx={{ fontSize: 48, color: colors.accent.primary, mb: 2 }} />
                <Typography variant="h6" sx={{ color: colors.accent.primary }}>
                  Click to upload or drag and drop
                </Typography>
                <Typography variant="body2" sx={{ color: colors.text.muted }}>
                  CSV files only
                </Typography>
              </Box>
            )}

            {/* Processing Status */}
            {uploadStatus === "parsing" && (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: `3px solid ${colors.border.card}`,
                    borderTopColor: colors.accent.primary,
                    animation: `${spin} 1s linear infinite`,
                    mx: "auto",
                    mb: 2,
                  }}
                />
                <Typography variant="body1" sx={{ mt: 2, color: colors.text.primary }}>
                  Parsing CSV file...
                </Typography>
              </Box>
            )}

            {uploadStatus === "validating" && (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: `3px solid ${colors.border.card}`,
                    borderTopColor: colors.accent.primary,
                    animation: `${spin} 1s linear infinite`,
                    mx: "auto",
                    mb: 2,
                  }}
                />
                <Typography variant="body1" sx={{ mt: 2, color: colors.text.primary }}>
                  Validating records...
                </Typography>
              </Box>
            )}

            {/* Validation Results */}
            {uploadStatus === "validated" && (
              <Box>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <StatCard
                      title="Valid records ready to upload"
                      value={validRecords.length}
                      color={colors.accent.primary}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <StatCard
                      title="Duplicates (will be skipped)"
                      value={duplicates.length}
                      color={duplicates.length > 0 ? colors.accent.warning : colors.text.muted}
                    />
                  </Grid>
                </Grid>

                {/* Show duplicates if any */}
                {duplicates.length > 0 && (
                  <Accordion
                    elevation={0}
                    sx={{
                      mb: 2,
                      backgroundColor: colors.background.secondary,
                      border: `1px solid ${colors.border.card}`,
                      borderRadius: "12px !important",
                      "&:before": { display: "none" },
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMore sx={{ color: colors.text.muted }} />}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ color: colors.accent.warning }}>
                        View Duplicates ({duplicates.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ backgroundColor: colors.background.card, borderTop: `1px solid ${colors.border.card}` }}>
                      <TableContainer sx={{ maxHeight: 200, backgroundColor: colors.background.card, borderRadius: "12px" }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>Clinic Code</TableCell>
                              <TableCell sx={{ color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>Clinic Name</TableCell>
                              <TableCell sx={{ color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>Reason</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {duplicates.map((dup, index) => (
                              <TableRow key={index} sx={{ "&:hover": { backgroundColor: `${colors.accent.primary}10` } }}>
                                <TableCell sx={{ color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>{dup.clinicCode}</TableCell>
                                <TableCell sx={{ color: colors.text.secondary, borderBottom: `1px solid ${colors.border.card}` }}>{dup.clinicName}</TableCell>
                                <TableCell sx={{ borderBottom: `1px solid ${colors.border.card}` }}>
                                  <Chip
                                    label={dup.reason}
                                    size="small"
                                    sx={{
                                      backgroundColor: `${colors.accent.warning}20`,
                                      color: colors.accent.warning,
                                      border: `1px solid ${colors.accent.warning}40`,
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Preview valid records */}
                {validRecords.length > 0 && (
                  <Accordion
                    elevation={0}
                    sx={{
                      backgroundColor: colors.background.secondary,
                      border: `1px solid ${colors.border.card}`,
                      borderRadius: "12px !important",
                      "&:before": { display: "none" },
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMore sx={{ color: colors.text.muted }} />}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ color: colors.accent.primary }}>
                        Preview Valid Records ({validRecords.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ backgroundColor: colors.background.card, borderTop: `1px solid ${colors.border.card}` }}>
                      <TableContainer sx={{ maxHeight: 300, backgroundColor: colors.background.card, borderRadius: "12px" }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ color: colors.text.primary, fontWeight: "bold", borderBottom: `1px solid ${colors.border.card}` }}>Clinic Code</TableCell>
                              <TableCell sx={{ color: colors.text.primary, fontWeight: "bold", borderBottom: `1px solid ${colors.border.card}` }}>Clinic Name</TableCell>
                              <TableCell sx={{ color: colors.text.primary, fontWeight: "bold", borderBottom: `1px solid ${colors.border.card}` }}>Partner</TableCell>
                              <TableCell sx={{ color: colors.text.primary, fontWeight: "bold", borderBottom: `1px solid ${colors.border.card}` }}>State</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {validRecords.slice(0, 50).map((record, index) => (
                              <TableRow key={index} sx={{ "&:hover": { backgroundColor: `${colors.accent.primary}10` } }}>
                                <TableCell sx={{ color: colors.text.primary, borderBottom: `1px solid ${colors.border.card}` }}>{record.clinicCode}</TableCell>
                                <TableCell sx={{ color: colors.text.secondary, borderBottom: `1px solid ${colors.border.card}` }}>{record.clinicName}</TableCell>
                                <TableCell sx={{ color: colors.text.secondary, borderBottom: `1px solid ${colors.border.card}` }}>{record.partnerName || "-"}</TableCell>
                                <TableCell sx={{ color: colors.text.secondary, borderBottom: `1px solid ${colors.border.card}` }}>{record.state || "-"}</TableCell>
                              </TableRow>
                            ))}
                            {validRecords.length > 50 && (
                              <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ color: colors.text.muted, borderBottom: `1px solid ${colors.border.card}` }}>
                                  <Typography variant="caption">
                                    ...and {validRecords.length - 50} more records
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                )}
              </Box>
            )}

            {/* Uploading Progress */}
            {uploadStatus === "uploading" && (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body1" sx={{ mb: 2, color: colors.text.primary }}>
                  Uploading {validRecords.length} clinics to database...
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    mb: 2,
                    backgroundColor: colors.background.secondary,
                    "& .MuiLinearProgress-bar": {
                      background: `linear-gradient(90deg, ${colors.accent.primary} 0%, ${colors.accent.secondary} 100%)`,
                      borderRadius: 5,
                    },
                  }}
                />
                <Typography variant="h4" fontWeight="bold" sx={{ color: colors.accent.primary }}>
                  {uploadProgress}%
                </Typography>
              </Box>
            )}

            {/* Done */}
            {uploadStatus === "done" && (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <CheckCircle sx={{ fontSize: 64, color: colors.accent.primary, mb: 2 }} />
                <Typography variant="h5" fontWeight="bold" sx={{ color: colors.accent.primary }}>
                  Upload Complete!
                </Typography>
                <Typography variant="body1" sx={{ color: colors.text.secondary }}>
                  Successfully uploaded {validRecords.length} clinics.
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1, borderTop: `1px solid ${colors.border.card}` }}>
          {uploadStatus === "idle" && (
            <Button
              onClick={() => setOpenUploadDialog(false)}
              sx={{
                borderRadius: "10px",
                color: colors.text.secondary,
                "&:hover": {
                  backgroundColor: `${colors.accent.primary}10`,
                },
              }}
            >
              Cancel
            </Button>
          )}
          {uploadStatus === "validated" && (
            <>
              <Button
                onClick={() => {
                  setValidRecords([]);
                  setDuplicates([]);
                  setUploadStatus("idle");
                }}
                sx={{
                  borderRadius: "10px",
                  color: colors.text.secondary,
                  "&:hover": {
                    backgroundColor: `${colors.accent.primary}10`,
                  },
                }}
              >
                Upload Different File
              </Button>
              <Button
                variant="contained"
                onClick={handleUploadToFirestore}
                disabled={validRecords.length === 0}
                sx={{
                  borderRadius: "10px",
                  background: `linear-gradient(135deg, ${colors.accent.primary} 0%, ${colors.accent.secondary} 100%)`,
                  boxShadow: `0 4px 20px ${colors.accent.primary}40`,
                  "&:hover": {
                    background: `linear-gradient(135deg, ${colors.accent.secondary} 0%, ${colors.accent.primary} 100%)`,
                  },
                }}
              >
                Upload {validRecords.length} Clinics
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ClinicMappingManager;
