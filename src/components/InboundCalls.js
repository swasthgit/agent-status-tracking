import React, { useState } from "react";
import "./InboundCalls.css";
import "../styles/animations.css";
import InboundCallLogForm from "./InboundCallLogForm";
import { db } from "../firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAgentDefaultPartner } from "../config/agentPartnerMapping";
import PhoneCallbackRoundedIcon from "@mui/icons-material/PhoneCallbackRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

function InboundCalls({ agentId, agentCollection, agentName, agentEmail }) {
  // Get agent's default partner based on mapping
  const defaultPartner = getAgentDefaultPartner(agentName, agentEmail);
  const [showCallForm, setShowCallForm] = useState(false);
  const [callStartTime, setCallStartTime] = useState(null);
  const [currentClientNumber, setCurrentClientNumber] = useState("");
  const [error, setError] = useState(null);
  const [agentType, setAgentType] = useState("");

  const handleStartLogging = () => {
    if (!currentClientNumber.trim()) {
      setError("Please enter the client number who called you.");
      return;
    }
    if (!/^\d{10}$/.test(currentClientNumber)) {
      setError("Client number must be exactly 10 digits.");
      return;
    }

    if (!agentType) {
      setError("Please select Agent Type before starting.");
      return;
    }

    setCallStartTime(new Date());
    setShowCallForm(true);
    setError(null);
  };

  const handleFormSubmit = async (logEntry) => {
    try {
      // Save to callLogs subcollection (same as other call types)
      const callLogsRef = collection(db, agentCollection, agentId, "callLogs");
      await addDoc(callLogsRef, {
        ...logEntry,
        agentId,
        agentName: agentName || "Agent",
        agentType: agentType,
        coordinatorType: logEntry.callType || "Unknown", // Preserve coordinator (Client/Branch Manager/Nurse)
        callType: "Inbound",
        callDirection: "Inbound",
        timestamp: serverTimestamp(),
        startTime: callStartTime ? callStartTime.toISOString() : null,
        endTime: new Date().toISOString(),
      });

      setShowCallForm(false);
      setCurrentClientNumber("");
      setCallStartTime(null);
      setAgentType("");
      setError(null);

      alert("✅ Inbound call log saved successfully!");
    } catch (error) {
      console.error("Error saving inbound call log:", error);

      // Show detailed error message
      let errorMessage = "Failed to save inbound call log. ";
      if (error.code === "permission-denied") {
        errorMessage += "Permission denied. Please make sure Firestore security rules are applied.";
      } else {
        errorMessage += error.message || "Unknown error occurred.";
      }

      setError(errorMessage);
      alert("❌ " + errorMessage);
    }
  };

  const handleCancel = () => {
    setShowCallForm(false);
    setCurrentClientNumber("");
    setCallStartTime(null);
    setError(null);
  };

  const isPhoneValid = /^\d{10}$/.test(currentClientNumber);
  const hasPhoneContent = currentClientNumber.length > 0;

  return (
    <div className="inbound-page">
      {!showCallForm ? (
        <div className="inbound-card">
          {/* Header */}
          <div className="inbound-header">
            <div className="inbound-header-icon">
              <PhoneCallbackRoundedIcon />
            </div>
            <h2 className="inbound-title">Inbound Call Logging</h2>
            <p className="inbound-subtitle">
              Log incoming calls from clients directly to your system
            </p>
          </div>

          {/* Form Fields */}
          <div className="inbound-form-fields">
            {/* Phone Number Input */}
            <div className="inbound-field-group stagger-1">
              <label className="inbound-field-label">Client Number</label>
              <div className="inbound-phone-input-wrapper">
                <span className="inbound-phone-icon">
                  <PhoneRoundedIcon fontSize="small" />
                </span>
                <input
                  type="tel"
                  pattern="\d{10}"
                  maxLength="10"
                  className={`inbound-phone-input${isPhoneValid ? " valid" : ""}${error && !isPhoneValid && hasPhoneContent ? " has-error" : ""}`}
                  placeholder="Enter client's 10-digit number"
                  value={currentClientNumber}
                  onChange={(e) => setCurrentClientNumber(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>

            {/* Agent Type Selector */}
            <div className="inbound-field-group stagger-2">
              <label className="inbound-field-label" htmlFor="agentType">
                Agent Type *
              </label>
              <select
                id="agentType"
                className="inbound-select"
                value={agentType}
                onChange={(e) => setAgentType(e.target.value)}
              >
                <option value="">-- Select Type --</option>
                <option value="Insurance">Insurance</option>
                <option value="Health">Health</option>
              </select>
            </div>

            {/* Start Logging Button */}
            <button
              className="inbound-btn-primary stagger-3"
              onClick={handleStartLogging}
            >
              <PlayArrowRoundedIcon fontSize="small" />
              Start Logging
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="inbound-error-banner">
              <div className="inbound-error-icon">
                <ErrorOutlineRoundedIcon style={{ fontSize: 14 }} />
              </div>
              <span className="inbound-error-text">{error}</span>
            </div>
          )}

          {/* Help / Instructions Card */}
          <div className="inbound-help-card">
            <h3 className="inbound-help-title">
              <InfoOutlinedIcon style={{ fontSize: 18 }} />
              How to use this section
            </h3>
            <ol className="inbound-help-list">
              <li>Enter the 10-digit number of the client who called you</li>
              <li>Click "Start Logging" to open the call log form</li>
              <li>Fill in all the call details (status, category, remarks, etc.)</li>
              <li>Click "Save Call Log" to record the inbound call</li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="inbound-form-view">
          {/* Active Logging Banner */}
          <div className="inbound-active-banner">
            <div className="inbound-active-banner-info">
              <h3 className="inbound-active-banner-title">
                <span className="inbound-live-dot" />
                Logging Inbound Call
              </h3>
              <p className="inbound-active-banner-detail">
                Client Number: <strong>{currentClientNumber}</strong>
              </p>
            </div>
            <button
              className="inbound-btn-cancel"
              onClick={handleCancel}
            >
              <CloseRoundedIcon style={{ fontSize: 16 }} />
              Cancel
            </button>
          </div>

          <InboundCallLogForm
            onSubmit={handleFormSubmit}
            initialClientNumber={currentClientNumber}
            defaultPartner={defaultPartner}
          />
        </div>
      )}
    </div>
  );
}

export default InboundCalls;
