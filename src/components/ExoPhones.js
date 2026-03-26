import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  collection,
  query,
  getDocs,
  addDoc,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import API_BASE_URL from "../config/api";
import "../styles/animations.css";
import "./ExoPhones.css";

const ACCOUNT_SID = process.env.REACT_APP_ACCOUNT_SID;

function ExoPhones({ agentId, agentCollection }) {
  const [exotelPhones, setExotelPhones] = useState([]);
  const [assignedCalls, setAssignedCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [manualNumberInput, setManualNumberInput] = useState("");
  const [selectedExotelPhoneInput, setSelectedExotelPhoneInput] = useState("");
  const [globalManualNumber, setGlobalManualNumber] = useState("");
  const [globalSelectedExotelPhone, setGlobalSelectedExotelPhone] =
    useState("");
  const [callHistory, setCallHistory] = useState([]);
  const [agentName, setAgentName] = useState("Agent");
  const [agentTypes, setAgentTypes] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("assigned");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.exo-select-group')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  useEffect(() => {
    console.log("agentId:", agentId, "agentCollection:", agentCollection);
    if (!agentId || !agentCollection) {
      setError("Agent ID or collection not provided.");
      setLoading(false);
      return;
    }

    // Fetch agent name
    const fetchAgentName = async () => {
      try {
        const agentDocRef = doc(db, agentCollection, agentId);
        const agentDoc = await getDoc(agentDocRef);
        if (agentDoc.exists()) {
          const agentData = agentDoc.data();
          setAgentName(agentData.name || "Agent");
        }
      } catch (err) {
        console.error("Error fetching agent name:", err);
      }
    };

    const fetchAssignedCalls = async () => {
      try {
        setLoading(true);
        const assignedCallsRef = collection(
          db,
          agentCollection,
          agentId,
          "assignedCalls"
        );
        const q = query(assignedCallsRef);
        const querySnapshot = await getDocs(q);
        const calls = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("Fetched assigned calls:", calls);
        setAssignedCalls(calls);
      } catch (err) {
        setError("Error fetching assigned calls: " + err.message);
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchCallHistory = () => {
      const exoCallDetailsRef = collection(
        db,
        agentCollection,
        agentId,
        "exoCallDetails"
      );
      const q = query(exoCallDetailsRef);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const history = snapshot.docs.map((doc) => ({
            id: doc.id,
            sid: doc.data().sid,
            agent: doc.data().agent,
            lead: doc.data().lead,
            exophone: doc.data().exophone,
            time: doc.data().time,
          }));
          setCallHistory(history);
        },
        (err) => {
          setError("Error fetching call history: " + err.message);
          console.error("Fetch history error:", err);
        }
      );

      return () => unsubscribe();
    };

    fetchAgentName();
    fetchAssignedCalls();
    fetchCallHistory();
  }, [agentId, agentCollection]);

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

  const handleAddSettings = () => {
    if (!manualNumberInput || !selectedExotelPhoneInput) {
      setError("Please enter your number and select a Caller ID Exophone.");
      return;
    }
    setGlobalManualNumber(manualNumberInput);
    setGlobalSelectedExotelPhone(selectedExotelPhoneInput);
    setError(null);
  };

  const handleMakeCall = async (callId) => {
    setError(null);
    const item = assignedCalls.find((c) => c.id === callId);
    if (!item) return;

    const toNumber = item.clientNumber;
    const fromNumber = globalManualNumber;
    const callerId = globalSelectedExotelPhone;
    const agentType = agentTypes[callId];

    if (!toNumber || !fromNumber || !callerId) {
      setError("Settings not configured. Please add your number and ExoPhone.");
      return;
    }
    if (!agentType) {
      setError("Please select an Agent Type before making the call.");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/v1/Accounts/${ACCOUNT_SID}/Calls/connect`,
        {
          From: fromNumber,
          To: toNumber,
          CallerId: callerId,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      console.log("Full API response:", response.data);

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(response.data, "application/xml");
      const callSid =
        xmlDoc.getElementsByTagName("Sid")[0]?.textContent || "SID_NOT_FOUND";

      // Use the agent name from state
      const newCallRecord = {
        sid: callSid,
        agentName,
        leadToCallNumber: toNumber,
        callerId,
        agentType,
        timestamp: new Date().toISOString(),
      };
      setCallHistory((prevHistory) => [...prevHistory, newCallRecord]);

      const exoCallDetailsRef = collection(
        db,
        agentCollection,
        agentId,
        "exoCallDetails"
      );
      await addDoc(exoCallDetailsRef, {
        sid: callSid,
        agentId: agentId,
        agent: agentName,
        lead: toNumber,
        exophone: callerId,
        agentType,
        callType: "Assigned Call",
        time: new Date().toISOString(),
        assignedCallId: callId,
        createdAt: new Date().toISOString(),
      });

      alert("Call initiated successfully!");
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(
        `Error initiating call: ${errorMessage}. Status: ${err.response?.status}`
      );
      console.error("Call error:", err.response ? err.response.data : err);
    }
  };

  const handleManualNumberChange = (value) => {
    setManualNumberInput(value);
  };

  const handleAgentTypeChange = (callId, value) => {
    setAgentTypes((prev) => ({ ...prev, [callId]: value }));
  };

  const handleExotelPhoneChange = (value) => {
    setSelectedExotelPhoneInput(value);
  };

  const formatTimestamp = (timeStr) => {
    if (!timeStr) return "—";
    try {
      const date = new Date(timeStr);
      return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return timeStr;
    }
  };

  if (loading)
    return (
      <div className="exo-container">
        <div className="exo-loading-container">
          <div className="exo-loading-spinner" />
          <span className="exo-loading-text">Loading assigned calls...</span>
        </div>
      </div>
    );
  if (error && assignedCalls.length === 0)
    return (
      <div className="exo-container" style={{ padding: "32px 24px" }}>
        <div className="exo-error-alert">
          <span className="exo-error-icon">!</span>
          {error}
        </div>
      </div>
    );

  return (
    <div className="exo-container">
      {/* ── Welcome card ────────────────────────────────────────────────────── */}
      <div className="exo-welcome-card">
        <div className="exo-welcome-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </div>
        <div className="exo-welcome-text">Welcome, {agentName}</div>
        <div className="exo-welcome-subtext">
          Exotel Phone Integration — {agentCollection}
        </div>
      </div>

      {/* ── Tab navigation ──────────────────────────────────────────────────── */}
      <div className="exo-tabs">
        <button
          className={`exo-tab ${activeTab === "assigned" ? "active" : ""}`}
          onClick={() => setActiveTab("assigned")}
        >
          <span className="exo-tab-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </span>
          Assigned Calls
          {assignedCalls.length > 0 && (
            <span className="exo-history-count" style={{ marginLeft: 6, fontSize: "0.6875rem", minWidth: 20, height: 20 }}>
              {assignedCalls.length}
            </span>
          )}
        </button>
        <button
          className={`exo-tab ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          <span className="exo-tab-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </span>
          Call History
          {callHistory.length > 0 && (
            <span className="exo-history-count" style={{ marginLeft: 6, fontSize: "0.6875rem", minWidth: 20, height: 20 }}>
              {callHistory.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Assigned Calls tab content ──────────────────────────────────────── */}
      {activeTab === "assigned" && (
        <div className="page-enter">
          {/* Settings card */}
          <div className="exo-settings-card">
            <div className="exo-input-group">
              <label htmlFor="global-yournumber" className="exo-input-label">
                Your Number
              </label>
              <input
                type="number"
                id="global-yournumber"
                placeholder="e.g., 8700612665"
                value={manualNumberInput}
                onChange={(e) => handleManualNumberChange(e.target.value)}
                className={`exo-input exo-input-phone${manualNumberInput.length >= 10 ? " is-valid" : ""}`}
              />
            </div>
            <div className="exo-select-group" style={{ position: "relative" }}>
              <label
                htmlFor="global-exotelSelect"
                className="exo-input-label"
              >
                Caller ID (ExoPhone)
              </label>
              <input
                type="text"
                placeholder="Search by partner name or number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsDropdownOpen(true)}
                className="exo-input"
              />
              {selectedExotelPhoneInput && (
                <div className="exo-selected-chip">
                  <span className="exo-selected-chip-text">
                    Selected: {selectedExotelPhoneInput}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedExotelPhoneInput("");
                      setSearchTerm("");
                    }}
                    className="exo-selected-chip-clear"
                  >
                    Clear
                  </button>
                </div>
              )}
              {isDropdownOpen && (
                <div className="exo-dropdown-panel">
                  {/* Assigned Numbers */}
                  <div className="exo-dropdown-group-header">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                    </svg>
                    Assigned Partner Numbers
                  </div>
                  {exotelPhones
                    .filter((phone) => phone.isAssigned)
                    .filter((phone) =>
                      phone.phone_number.includes(searchTerm) ||
                      phone.partnerName.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((phone, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          handleExotelPhoneChange(phone.phone_number);
                          setIsDropdownOpen(false);
                          setSearchTerm("");
                        }}
                        className={`exo-dropdown-option${selectedExotelPhoneInput === phone.phone_number ? " selected" : ""}`}
                      >
                        <div>
                          <div className="exo-dropdown-option-number">{phone.phone_number}</div>
                          <div className="exo-dropdown-option-partner">{phone.partnerName}</div>
                        </div>
                        {selectedExotelPhoneInput === phone.phone_number && (
                          <span className="exo-dropdown-checkmark">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                        )}
                      </div>
                    ))}

                  {/* Available Numbers */}
                  <div className="exo-dropdown-group-header">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    Available Numbers
                  </div>
                  {exotelPhones
                    .filter((phone) => !phone.isAssigned)
                    .filter((phone) => phone.phone_number.includes(searchTerm))
                    .map((phone, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          handleExotelPhoneChange(phone.phone_number);
                          setIsDropdownOpen(false);
                          setSearchTerm("");
                        }}
                        className={`exo-dropdown-option${selectedExotelPhoneInput === phone.phone_number ? " selected" : ""}`}
                      >
                        <div>
                          <div className="exo-dropdown-option-number">{phone.phone_number}</div>
                        </div>
                        {selectedExotelPhoneInput === phone.phone_number && (
                          <span className="exo-dropdown-checkmark">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                        )}
                      </div>
                    ))}

                  {/* No results */}
                  {exotelPhones.filter((phone) =>
                    phone.phone_number.includes(searchTerm) ||
                    (phone.partnerName && phone.partnerName.toLowerCase().includes(searchTerm.toLowerCase()))
                  ).length === 0 && (
                    <div className="exo-dropdown-empty">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8, display: "block", margin: "0 auto 8px" }}>
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      No numbers found
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={handleAddSettings}
              className="exo-add-btn"
              disabled={!manualNumberInput || !selectedExotelPhoneInput}
            >
              Save Settings
            </button>
          </div>

          {/* Error alert */}
          {error && (
            <div className="exo-error-alert">
              <span className="exo-error-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </span>
              {error}
            </div>
          )}

          {/* Call list */}
          <div className="exo-call-list">
            {assignedCalls.map((item, index) => (
              <div
                key={item.id}
                className="exo-call-card"
                style={{ "--stagger": index + 1 }}
              >
                <div className="exo-lead-info">
                  <span className="exo-lead-label">Lead to Call</span>
                  <a
                    href={`tel:${item.clientNumber}`}
                    className="exo-lead-number"
                  >
                    {item.clientNumber}
                  </a>
                </div>
                <div className="exo-agent-type-group">
                  <label
                    htmlFor={`agentType-${item.id}`}
                    className="exo-input-label"
                  >
                    Agent Type
                  </label>
                  <select
                    id={`agentType-${item.id}`}
                    value={agentTypes[item.id] || ""}
                    onChange={(e) =>
                      handleAgentTypeChange(item.id, e.target.value)
                    }
                    className="exo-agent-type-select"
                  >
                    <option value="">-- Select Type --</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Health">Health</option>
                  </select>
                </div>
                <div className="exo-call-settings-strip">
                  <span>Your Number:</span>
                  <span className="exo-settings-value">
                    {globalManualNumber || "Not set"}
                  </span>
                  <span className="exo-settings-separator">|</span>
                  <span>ExoPhone:</span>
                  <span className="exo-settings-value">
                    {globalSelectedExotelPhone || "Not set"}
                  </span>
                </div>
                <button
                  className="exo-call-btn"
                  onClick={() => handleMakeCall(item.id)}
                  disabled={!globalManualNumber || !globalSelectedExotelPhone}
                  title="Make Call"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "relative", zIndex: 1 }}>
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Empty states */}
          {exotelPhones.length === 0 && (
            <div className="exo-empty-state">
              <span className="exo-empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </span>
              <div className="exo-empty-title">No Exotel phones available</div>
              <div className="exo-empty-subtitle">
                Phone numbers will appear here once configured
              </div>
            </div>
          )}
          {assignedCalls.length === 0 && (
            <div className="exo-empty-state">
              <span className="exo-empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </span>
              <div className="exo-empty-title">No assigned calls found</div>
              <div className="exo-empty-subtitle">
                Assigned calls will show up here when available
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Call History tab content ─────────────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="page-enter">
          {callHistory.length > 0 ? (
            <div className="exo-history-section">
              <div className="exo-history-header">
                <span className="exo-history-header-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
                <span className="exo-history-header-text">Call History</span>
                <span className="exo-history-count">{callHistory.length}</span>
              </div>
              <ul className="exo-history-list">
                {callHistory.map((call, index) => (
                  <li
                    key={index}
                    className="exo-history-item animate-card-entrance-fast"
                    style={{ "--stagger": index + 1 }}
                  >
                    <div className="exo-history-field">
                      <span className="exo-history-field-label">SID</span>
                      <span className="exo-history-field-value mono">
                        {call.sid ? (call.sid.length > 16 ? call.sid.slice(0, 16) + "..." : call.sid) : "—"}
                      </span>
                    </div>
                    <div className="exo-history-field">
                      <span className="exo-history-field-label">Agent</span>
                      <span className="exo-history-field-value">
                        {call.agent || "—"}
                      </span>
                    </div>
                    <div className="exo-history-field">
                      <span className="exo-history-field-label">Lead</span>
                      <span className="exo-history-field-value mono">
                        {call.lead || "—"}
                      </span>
                    </div>
                    <div className="exo-history-field">
                      <span className="exo-history-field-label">ExoPhone</span>
                      <span className="exo-history-field-value mono">
                        {call.exophone || "—"}
                      </span>
                    </div>
                    <div className="exo-history-field">
                      <span className="exo-history-field-label">Time</span>
                      <span className="exo-history-time">
                        {formatTimestamp(call.time)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="exo-empty-state">
              <span className="exo-empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </span>
              <div className="exo-empty-title">No call history yet</div>
              <div className="exo-empty-subtitle">
                Your call records will appear here after making calls
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ExoPhones;
