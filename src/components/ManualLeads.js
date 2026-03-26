import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/animations.css";
import "./ManualLeads.css";
import ManualCallLogForm from "./ManualCallLogForm";
import { db } from "../firebaseConfig";
import { collection, addDoc, serverTimestamp, getDoc, doc, getDocs, query, where } from "firebase/firestore";
import API_BASE_URL from "../config/api";
import { getAgentDefaultPartner } from "../config/agentPartnerMapping";

const ACCOUNT_SID = process.env.REACT_APP_ACCOUNT_SID;

function ManualLeads({ agentId, userId, agentCollection, onStartCall, onEndCall }) {
  // Support both agentId and userId props for backward compatibility
  const actualAgentId = agentId || userId;
  const [exotelPhones, setExotelPhones] = useState([]);
  const [manualLeads, setManualLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedExotelPhones, setSelectedExotelPhones] = useState({});
  const [manualNumbers, setManualNumbers] = useState({});
  const [callHistory, setCallHistory] = useState([]);
  const [newLeadNumber, setNewLeadNumber] = useState("");
  const [isCallActive, setIsCallActive] = useState(false);
  const [showCallForm, setShowCallForm] = useState(false);
  const [currentLeadNumber, setCurrentLeadNumber] = useState("");
  const [callStartTime, setCallStartTime] = useState(null);
  const [agentName, setAgentName] = useState("Agent");
  const [currentCallSid, setCurrentCallSid] = useState("");
  const [currentCallerId, setCurrentCallerId] = useState("");
  const [agentPhoneNumber, setAgentPhoneNumber] = useState("");
  const [agentTypes, setAgentTypes] = useState({});
  const [currentAgentType, setCurrentAgentType] = useState("");
  const [searchTerms, setSearchTerms] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState({});
  const [agentDefaultPartner, setAgentDefaultPartner] = useState("");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const openDropdowns = Object.keys(dropdownOpen).filter(key => dropdownOpen[key]);
      if (openDropdowns.length > 0 && !event.target.closest('.exophone-select-wrapper')) {
        setDropdownOpen({});
      }
    };
    // Use a slight delay to avoid immediate closure
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Fetch agent name and phone number from Firestore
  const fetchAgentData = async () => {
    try {
      console.log(`[ManualLeads] Fetching agent data from collection: ${agentCollection}, ID: ${actualAgentId}`);

      // First try to fetch using actualAgentId (UID) as document ID
      let agentDocRef = doc(db, agentCollection, actualAgentId);
      let agentDoc = await getDoc(agentDocRef);

      console.log(`[ManualLeads] Direct lookup - Document exists: ${agentDoc.exists()}`);
      if (agentDoc.exists()) {
        console.log(`[ManualLeads] Direct lookup - Document data:`, agentDoc.data());
      }

      // If not found OR if healthTeamLeads collection, try querying by uid field
      // (healthTeamLeads uses empId as document ID, not Firebase UID)
      if (agentCollection === "healthTeamLeads" && (!agentDoc.exists() || !agentDoc.data()?.mobile)) {
        console.log(`[ManualLeads] Querying healthTeamLeads by uid field...`);
        const tlQuery = query(
          collection(db, "healthTeamLeads"),
          where("uid", "==", actualAgentId)
        );
        const tlSnapshot = await getDocs(tlQuery);

        console.log(`[ManualLeads] Query returned ${tlSnapshot.size} documents`);

        if (!tlSnapshot.empty) {
          const tlDoc = tlSnapshot.docs[0];
          console.log(`[ManualLeads] Found TL document with empId: ${tlDoc.id}`);
          console.log(`[ManualLeads] TL document data:`, tlDoc.data());
          agentDoc = tlDoc;
        } else {
          console.log(`[ManualLeads] No TL document found with uid: ${actualAgentId}`);
        }
      }

      // Similarly for healthAgents
      if (agentCollection === "healthAgents" && (!agentDoc.exists() || !agentDoc.data()?.mobile)) {
        console.log(`[ManualLeads] Querying healthAgents by uid field...`);
        const agentQuery = query(
          collection(db, "healthAgents"),
          where("uid", "==", actualAgentId)
        );
        const agentSnapshot = await getDocs(agentQuery);

        console.log(`[ManualLeads] Query returned ${agentSnapshot.size} documents`);

        if (!agentSnapshot.empty) {
          const foundDoc = agentSnapshot.docs[0];
          console.log(`[ManualLeads] Found agent document ID: ${foundDoc.id}`);
          console.log(`[ManualLeads] Agent document data:`, foundDoc.data());
          agentDoc = foundDoc;
        }
      }

      if (agentDoc && agentDoc.exists()) {
        const agentData = agentDoc.data();
        console.log(`[ManualLeads] Final Agent Data:`, agentData);
        console.log(`[ManualLeads] Mobile:`, agentData.mobile);
        console.log(`[ManualLeads] PhoneNumber:`, agentData.phoneNumber);
        setAgentName(agentData.name || "Agent");
        setAgentPhoneNumber(agentData.mobile || agentData.phoneNumber || "");
        console.log(`[ManualLeads] Set agentPhoneNumber to:`, agentData.mobile || agentData.phoneNumber || "");

        // Set default partner based on agent mapping
        const defaultPartner = getAgentDefaultPartner(agentData.name, agentData.email);
        if (defaultPartner) {
          console.log(`[ManualLeads] Setting default partner for ${agentData.name}: ${defaultPartner}`);
          setAgentDefaultPartner(defaultPartner);
        }
      } else {
        console.log(`[ManualLeads] No agent document found in ${agentCollection}`);
      }
    } catch (err) {
      console.error("[ManualLeads] Error fetching agent data:", err);
    }
  };

  useEffect(() => {
    fetchAgentData();
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualAgentId, agentCollection]);

  useEffect(() => {
    const fetchExotelPhones = async () => {
      try {
        // Fetch all exophones from Firestore
        const exophonesRef = collection(db, "exophones");
        const exophonesSnap = await getDocs(exophonesRef);

        // Fetch partner linkages
        const linkagesRef = collection(db, "partnerNumbers");
        const linkagesSnap = await getDocs(linkagesRef);

        // Create a map of exophoneId -> partner info
        const linkagesMap = {};
        linkagesSnap.forEach((doc) => {
          const linkData = doc.data();
          linkagesMap[linkData.exophoneId] = {
            partnerName: linkData.partnerName,
            partnerId: linkData.partnerId,
          };
        });

        // Build phone list with partner names
        const phones = [];
        exophonesSnap.forEach((doc) => {
          const phoneData = doc.data();
          const linkage = linkagesMap[doc.id];

          phones.push({
            phone_number: phoneData.formattedNumber || `0${phoneData.number}`,
            friendly_name: linkage ? linkage.partnerName : "Available Number",
            sid: doc.id,
            status: phoneData.status,
            isAssigned: phoneData.status === "assigned",
            partnerName: linkage ? linkage.partnerName : null,
          });
        });

        // Sort: assigned first (alphabetically by partner name), then unassigned
        phones.sort((a, b) => {
          if (a.isAssigned && !b.isAssigned) return -1;
          if (!a.isAssigned && b.isAssigned) return 1;
          if (a.isAssigned && b.isAssigned) {
            return a.partnerName.localeCompare(b.partnerName);
          }
          return 0;
        });

        setExotelPhones(phones);
      } catch (err) {
        console.error("Error fetching Exotel phones:", err);
        setError("Error fetching phone numbers: " + err.message);
      }
    };
    fetchExotelPhones();
  }, []);

  const handleAddLead = () => {
    if (!newLeadNumber.trim()) {
      setError("Please enter a valid 10-digit lead number.");
      return;
    }
    if (!/^\d{10}$/.test(newLeadNumber)) {
      setError("Lead number must be exactly 10 digits.");
      return;
    }
    const newId = Date.now().toString();
    const newLead = { id: newId, clientNumber: newLeadNumber };
    setManualLeads((prev) => [...prev, newLead]);
    // Auto-populate with agent's phone number
    setManualNumbers((prev) => ({ ...prev, [newId]: agentPhoneNumber }));
    setSelectedExotelPhones((prev) => ({ ...prev, [newId]: "" }));
    setAgentTypes((prev) => ({ ...prev, [newId]: "" }));
    setNewLeadNumber("");
    setError(null);
  };

  const handleManualNumberChange = (leadId, value) => {
    setManualNumbers((prev) => ({ ...prev, [leadId]: value }));
  };

  const handleExotelPhoneChange = (leadId, value) => {
    setSelectedExotelPhones((prev) => ({ ...prev, [leadId]: value }));
  };

  const handleAgentTypeChange = (leadId, value) => {
    setAgentTypes((prev) => ({ ...prev, [leadId]: value }));
  };

  const handleMakeCall = async (leadId) => {
    setError(null);
    const item = manualLeads.find((c) => c.id === leadId);
    if (!item) return;

    const toNumber = item.clientNumber;
    const fromNumber = manualNumbers[leadId];
    const callerId =
      selectedExotelPhones[leadId] ||
      (exotelPhones.length > 0 ? exotelPhones[0].phone_number : "");
    const agentType = agentTypes[leadId];

    if (!toNumber || !fromNumber || !callerId) {
      setError("Please enter your number and select a Caller ID Exophone.");
      return;
    }
    if (!/^\d{10}$/.test(fromNumber)) {
      setError("Your number must be exactly 10 digits.");
      return;
    }
    if (!agentType) {
      setError("Please select an Agent Type before making the call.");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/v1/Accounts/${ACCOUNT_SID}/Calls/connect`,
        { From: fromNumber, To: toNumber, CallerId: callerId },
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );
      console.log("Full API response:", response.data);

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(response.data, "application/xml");
      const callSid =
        xmlDoc.getElementsByTagName("Sid")[0]?.textContent || "SID_NOT_FOUND";

      // Store SID, callerId, and agentType for later use in form submission
      setCurrentCallSid(callSid);
      setCurrentCallerId(callerId);
      setCurrentAgentType(agentType);
      setCurrentLeadNumber(toNumber);
      setCallStartTime(new Date());
      if (onStartCall) onStartCall(toNumber);
      setIsCallActive(true);

      // Use the agent name from state
      const newCallRecord = {
        sid: callSid,
        agentName,
        leadToCallNumber: toNumber,
        callerId,
        agentType: agentType,
        timestamp: new Date().toISOString(),
      };
      setCallHistory((prevHistory) => [...prevHistory, newCallRecord]);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(
        `Error initiating call: ${errorMessage}. Status: ${err.response?.status}`
      );
      console.error("Call error:", err.response ? err.response.data : err);
    }
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setShowCallForm(true);
  };

  const handleFormSubmit = async (logEntry) => {
    try {
      const callLogsRef = collection(db, agentCollection, actualAgentId, "callLogs");
      await addDoc(callLogsRef, {
        ...logEntry,
        agentId: actualAgentId,
        agentName,
        sid: currentCallSid,
        callerId: currentCallerId,
        agentType: currentAgentType,
        coordinatorType: logEntry.callType || "Unknown", // Preserve coordinator (Client/Branch Manager/Nurse)
        callType: "Manual Lead",
        timestamp: serverTimestamp(),
        startTime: callStartTime ? callStartTime.toISOString() : null,
        endTime: new Date().toISOString(),
      });
      setShowCallForm(false);

      // Remove the completed lead from the list so the screen resets properly
      setManualLeads((prev) => prev.filter((lead) => lead.clientNumber !== currentLeadNumber));

      // Clean up state for the removed lead
      setCurrentLeadNumber("");
      setCallStartTime(null);
      setCurrentCallSid("");
      setCurrentCallerId("");
      setCurrentAgentType("");
      if (onEndCall) onEndCall(); // Notify AgentView to reset state
    } catch (error) {
      console.error("Error saving call log:", error);
      setError("Failed to save call log.");
    }
  };

  if (loading)
    return (
      <div className="container mt-5">
        <p>Loading...</p>
      </div>
    );
  if (error && manualLeads.length === 0)
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">{error}</div>
      </div>
    );

  return (
    <div className="exo-container">
      {/* ── Phone Number Display Card ────────────────────────────────── */}
      <div className="welcome-card" style={{ marginTop: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <span style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #06B6D4 0%, #6366F1 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1rem",
            flexShrink: 0,
            boxShadow: "0 4px 14px rgba(6,182,212,0.25)"
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </span>
          <h3 style={{
            margin: 0,
            color: "#0F172A",
            fontSize: "1.1rem",
            fontWeight: 700,
            letterSpacing: "-0.02em"
          }}>
            Your Contact Number
          </h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <span style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            letterSpacing: "0.04em",
            color: "#4F46E5",
            backgroundColor: "#EEF2FF",
            padding: "10px 18px",
            borderRadius: "12px",
            border: "1.5px solid rgba(79, 70, 229, 0.15)",
            boxShadow: "0 2px 8px rgba(79, 70, 229, 0.08)"
          }}>
            {agentPhoneNumber || "Not set"}
          </span>
        </div>
        <p style={{
          marginTop: "12px",
          fontSize: "0.8125rem",
          color: "#64748B",
          lineHeight: 1.5,
          marginBottom: 0
        }}>
          This number will be auto-filled when making calls. Contact your Team Leader if you need to change it.
        </p>
      </div>

      {/* ── Section Header ───────────────────────────────────────────── */}
      <div style={{ marginBottom: "20px" }}>
        <h2 className="title">Manual Leads</h2>
        <p style={{ color: "#64748B", fontSize: "0.8125rem", margin: 0, lineHeight: 1.5 }}>
          Add a lead number and make outbound calls directly
        </p>
      </div>

      {/* ── Add Lead Form ────────────────────────────────────────────── */}
      <div className="add-lead-form" style={{ position: "relative" }}>
        {/* Phone icon inside input */}
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{
            position: "absolute",
            left: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#94A3B8",
            pointerEvents: "none",
            display: "flex",
            alignItems: "center"
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </span>
          <input
            type="tel"
            pattern="\d{10}"
            maxLength="10"
            placeholder="Enter 10-digit lead number"
            value={newLeadNumber}
            onChange={(e) => setNewLeadNumber(e.target.value)}
          />
        </div>
        <button onClick={handleAddLead}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Lead
        </button>
      </div>

      {/* ── Error Alert ──────────────────────────────────────────────── */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {/* ── Lead Cards ───────────────────────────────────────────────── */}
      <div className="call-list">
        {manualLeads.map((item, cardIndex) => (
          <div
            key={item.id}
            className={`lead-call-card animate-card-entrance stagger-${Math.min(cardIndex + 1, 12)}`}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 2fr 60px",
              gap: "14px",
              alignItems: "start",
              overflow: "visible"
            }}
          >
            {/* Lead phone number */}
            <div className="lead-info" style={{ gridColumn: "1 / -1" }}>
              <small>LEAD TO CALL</small>
              <a href={`tel:${item.clientNumber}`}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                {item.clientNumber}
              </a>
            </div>

            {/* Your Number input */}
            <div className="input-box">
              <label htmlFor={`yournumber-${item.id}`}>
                Your Number (10 digits)
                {manualNumbers[item.id] === agentPhoneNumber && agentPhoneNumber && (
                  <span className="ml-badge-success" style={{
                    marginLeft: "8px",
                    padding: "2px 8px",
                    fontSize: "0.625rem",
                    borderRadius: "9999px",
                    verticalAlign: "middle"
                  }}>
                    Auto-filled
                  </span>
                )}
              </label>
              <input
                type="tel"
                pattern="\d{10}"
                maxLength="10"
                id={`yournumber-${item.id}`}
                placeholder="e.g., 8700612665"
                value={manualNumbers[item.id] || ""}
                onChange={(e) =>
                  handleManualNumberChange(item.id, e.target.value)
                }
                style={{
                  backgroundColor: manualNumbers[item.id] === agentPhoneNumber && agentPhoneNumber ? "#ECFDF5" : "#FFFFFF",
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  letterSpacing: "0.02em"
                }}
              />
            </div>

            {/* Exophone select */}
            <div className="select-box exophone-select-wrapper" style={{ position: "relative", zIndex: 10 }}>
              <label htmlFor={`exotelSelect-${item.id}`}>
                Caller ID (ExoPhone)
              </label>

              {/* Selected Display Badge */}
              {selectedExotelPhones[item.id] && (
                <div style={{
                  padding: "10px 14px",
                  background: "rgba(79, 70, 229, 0.06)",
                  borderRadius: "10px",
                  marginBottom: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "1.5px solid rgba(79, 70, 229, 0.12)"
                }}>
                  <span style={{
                    fontWeight: 600,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    color: "#4F46E5",
                    fontSize: "0.9rem",
                    letterSpacing: "0.02em",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {selectedExotelPhones[item.id]}
                  </span>
                  <button
                    onClick={() => {
                      handleExotelPhoneChange(item.id, "");
                      setSearchTerms({ ...searchTerms, [item.id]: "" });
                    }}
                    style={{
                      background: "linear-gradient(135deg, #F43F5E 0%, #BE123C 100%)",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "8px",
                      padding: "4px 12px",
                      cursor: "pointer",
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      letterSpacing: "0.02em",
                      transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow: "0 2px 8px rgba(244, 63, 94, 0.2)"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translateY(-1px)";
                      e.target.style.boxShadow = "0 4px 12px rgba(244, 63, 94, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "0 2px 8px rgba(244, 63, 94, 0.2)";
                    }}
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Search Input */}
              <input
                type="text"
                placeholder="Search by partner name or number..."
                value={searchTerms[item.id] || ""}
                onChange={(e) => setSearchTerms({ ...searchTerms, [item.id]: e.target.value })}
                onFocus={() => setDropdownOpen({ ...dropdownOpen, [item.id]: true })}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  paddingLeft: "38px",
                  border: "1.5px solid rgba(79, 70, 229, 0.12)",
                  borderRadius: "12px",
                  background: "#FFFFFF",
                  color: "#0F172A",
                  fontWeight: 500,
                  fontSize: "0.9rem",
                  fontFamily: "'Inter', sans-serif",
                  transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
                  outline: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "14px center"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#4F46E5";
                  e.target.style.boxShadow = "0 0 0 3px rgba(79, 70, 229, 0.12), 0 0 16px rgba(79, 70, 229, 0.08)";
                  setDropdownOpen({ ...dropdownOpen, [item.id]: true });
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(79, 70, 229, 0.12)";
                  e.target.style.boxShadow = "none";
                }}
              />

              {/* Dropdown Panel */}
              {dropdownOpen[item.id] && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: "6px",
                    maxHeight: "320px",
                    overflowY: "auto",
                    background: "rgba(255, 255, 255, 0.98)",
                    border: "1px solid rgba(79, 70, 229, 0.1)",
                    borderRadius: "12px",
                    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06)",
                    zIndex: 9999
                  }}
                >
                  {/* Assigned Numbers Section */}
                  <div style={{
                    padding: "10px 14px",
                    background: "rgba(79, 70, 229, 0.05)",
                    fontWeight: 700,
                    fontSize: "0.6875rem",
                    color: "#4F46E5",
                    borderBottom: "1px solid rgba(79, 70, 229, 0.08)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                    Assigned Partner Numbers
                  </div>
                  {exotelPhones
                    .filter((phone) => phone.isAssigned)
                    .filter((phone) =>
                      phone.phone_number.includes(searchTerms[item.id] || "") ||
                      phone.partnerName.toLowerCase().includes((searchTerms[item.id] || "").toLowerCase())
                    )
                    .map((phone, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          handleExotelPhoneChange(item.id, phone.phone_number);
                          setDropdownOpen({ ...dropdownOpen, [item.id]: false });
                          setSearchTerms({ ...searchTerms, [item.id]: "" });
                        }}
                        style={{
                          padding: "12px 14px",
                          cursor: "pointer",
                          borderBottom: "1px solid rgba(79, 70, 229, 0.04)",
                          backgroundColor: selectedExotelPhones[item.id] === phone.phone_number
                            ? "rgba(79, 70, 229, 0.08)"
                            : "transparent",
                          borderLeft: selectedExotelPhones[item.id] === phone.phone_number
                            ? "3px solid #4F46E5"
                            : "3px solid transparent",
                          transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)"
                        }}
                        onMouseEnter={(e) => {
                          if (selectedExotelPhones[item.id] !== phone.phone_number) {
                            e.currentTarget.style.backgroundColor = "#EEF2FF";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = selectedExotelPhones[item.id] === phone.phone_number
                            ? "rgba(79, 70, 229, 0.08)"
                            : "transparent";
                        }}
                      >
                        <div style={{
                          fontWeight: 700,
                          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                          color: "#4F46E5",
                          fontSize: "0.9rem",
                          letterSpacing: "0.02em"
                        }}>
                          {phone.phone_number}
                        </div>
                        <div style={{
                          fontSize: "0.8rem",
                          color: "#64748B",
                          marginTop: "3px",
                          fontWeight: 500
                        }}>
                          {phone.partnerName}
                        </div>
                      </div>
                    ))}

                  {/* Available Numbers Section */}
                  <div style={{
                    padding: "10px 14px",
                    background: "rgba(16, 185, 129, 0.05)",
                    fontWeight: 700,
                    fontSize: "0.6875rem",
                    color: "#059669",
                    borderBottom: "1px solid rgba(16, 185, 129, 0.08)",
                    marginTop: 0,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    Available Numbers
                  </div>
                  {exotelPhones
                    .filter((phone) => !phone.isAssigned)
                    .filter((phone) => phone.phone_number.includes(searchTerms[item.id] || ""))
                    .map((phone, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          handleExotelPhoneChange(item.id, phone.phone_number);
                          setDropdownOpen({ ...dropdownOpen, [item.id]: false });
                          setSearchTerms({ ...searchTerms, [item.id]: "" });
                        }}
                        style={{
                          padding: "12px 14px",
                          cursor: "pointer",
                          borderBottom: "1px solid rgba(79, 70, 229, 0.04)",
                          backgroundColor: selectedExotelPhones[item.id] === phone.phone_number
                            ? "rgba(79, 70, 229, 0.08)"
                            : "transparent",
                          borderLeft: selectedExotelPhones[item.id] === phone.phone_number
                            ? "3px solid #4F46E5"
                            : "3px solid transparent",
                          transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)"
                        }}
                        onMouseEnter={(e) => {
                          if (selectedExotelPhones[item.id] !== phone.phone_number) {
                            e.currentTarget.style.backgroundColor = "#EEF2FF";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = selectedExotelPhones[item.id] === phone.phone_number
                            ? "rgba(79, 70, 229, 0.08)"
                            : "transparent";
                        }}
                      >
                        <div style={{
                          fontWeight: 700,
                          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                          color: "#4F46E5",
                          fontSize: "0.9rem",
                          letterSpacing: "0.02em"
                        }}>
                          {phone.phone_number}
                        </div>
                      </div>
                    ))}

                  {/* No Results */}
                  {exotelPhones.filter((phone) =>
                    phone.phone_number.includes(searchTerms[item.id] || "") ||
                    (phone.partnerName && phone.partnerName.toLowerCase().includes((searchTerms[item.id] || "").toLowerCase()))
                  ).length === 0 && (
                    <div style={{
                      padding: "24px",
                      textAlign: "center",
                      color: "#94A3B8",
                      fontSize: "0.875rem"
                    }}>
                      No numbers found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Call button */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", paddingTop: "20px" }}>
              <button
                className="call-btn"
                onClick={() => handleMakeCall(item.id)}
                disabled={!manualNumbers[item.id] || isCallActive}
                title="Make call"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </button>
            </div>

            {/* Agent Type — full-width row */}
            <div className="select-box" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor={`agentType-${item.id}`}>
                Agent Type
              </label>
              <select
                id={`agentType-${item.id}`}
                value={agentTypes[item.id] || ""}
                onChange={(e) =>
                  handleAgentTypeChange(item.id, e.target.value)
                }
                style={{
                  fontFamily: "'Inter', sans-serif",
                  cursor: "pointer"
                }}
              >
                <option value="">-- Select Type --</option>
                <option value="Insurance">Insurance</option>
                <option value="Health">Health</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* ── Empty States ─────────────────────────────────────────────── */}
      {exotelPhones.length === 0 && (
        <div className="ml-empty-state" style={{ marginTop: "16px" }}>
          <div className="ml-empty-state-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          </div>
          <p className="ml-empty-state-text">No Exotel phones available.</p>
        </div>
      )}
      {manualLeads.length === 0 && (
        <div className="ml-empty-state" style={{ marginTop: "16px" }}>
          <div className="ml-empty-state-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          </div>
          <p className="ml-empty-state-text">No manual leads added yet. Enter a number above to get started.</p>
        </div>
      )}

      {/* ── Call History ──────────────────────────────────────────────── */}
      {callHistory.length > 0 && (
        <div className="call-history">
          <h3 className="title">Call History</h3>
          <ul>
            {callHistory.map((call, index) => (
              <li key={index}>
                SID: {call.sid}, Agent: {call.agentName}, Lead:{" "}
                {call.leadToCallNumber}, ExoPhone: {call.callerId}, Time:{" "}
                {call.timestamp}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Active Call Banner ────────────────────────────────────────── */}
      {isCallActive && (
        <div className="end-call-interface">
          <h3>Call in Progress</h3>
          <p>Stay focused and professional</p>
          <button onClick={handleEndCall} className="end-call-btn">
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              End Call
            </span>
          </button>
        </div>
      )}

      {/* ── Call Log Form (slide-in) ─────────────────────────────────── */}
      {showCallForm && (
        <div className="call-form-container">
          <ManualCallLogForm
            onSubmit={handleFormSubmit}
            initialClientNumber={currentLeadNumber}
            agentType={currentAgentType}
            defaultPartner={agentDefaultPartner}
          />
        </div>
      )}
    </div>
  );
}

export default ManualLeads;