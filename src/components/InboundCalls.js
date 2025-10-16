import React, { useState } from "react";
import "./ManualLeads.css"; // Reuse same styling
import InboundCallLogForm from "./InboundCallLogForm";
import { db } from "../firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

function InboundCalls({ agentId, agentCollection, agentName }) {
  const [showCallForm, setShowCallForm] = useState(false);
  const [callStartTime, setCallStartTime] = useState(null);
  const [currentClientNumber, setCurrentClientNumber] = useState("");
  const [error, setError] = useState(null);

  const handleStartLogging = () => {
    if (!currentClientNumber.trim()) {
      setError("Please enter the client number who called you.");
      return;
    }
    if (!/^\d{10}$/.test(currentClientNumber)) {
      setError("Client number must be exactly 10 digits.");
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
        callType: "Inbound",
        callDirection: "Inbound",
        timestamp: serverTimestamp(),
        startTime: callStartTime ? callStartTime.toISOString() : null,
        endTime: new Date().toISOString(),
      });

      setShowCallForm(false);
      setCurrentClientNumber("");
      setCallStartTime(null);
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

  return (
    <div className="exo-container">
      <div className="welcome-card">
        <div className="welcome-icon">📞</div>
        <h1 className="welcome-text">Log Inbound Calls</h1>
        <p className="welcome-subtext">
          Record details of calls received from clients
        </p>
      </div>

      {!showCallForm ? (
        <div className="manual-leads-section">
          <h2 className="title">Inbound Call Logging</h2>
          <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
            When a client calls you directly on your number, use this section to log the call details.
          </p>

          <div className="add-lead-form">
            <input
              type="tel"
              pattern="\d{10}"
              maxLength="10"
              placeholder="Enter client's 10-digit number"
              value={currentClientNumber}
              onChange={(e) => setCurrentClientNumber(e.target.value.replace(/\D/g, ''))}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                color: '#f1f5f9',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
            <button
              onClick={handleStartLogging}
              className="ml-2 p-2 rounded-md"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
              }}
            >
              Start Logging
            </button>
          </div>

          {error && (
            <div className="alert alert-danger mt-3" style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              padding: '12px',
              borderRadius: '8px',
              marginTop: '16px'
            }}>
              {error}
            </div>
          )}

          <div style={{
            marginTop: '32px',
            padding: '20px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '12px'
          }}>
            <h3 style={{ color: '#3b82f6', marginBottom: '12px', fontSize: '18px', fontWeight: 600 }}>
              ℹ️ How to use this section:
            </h3>
            <ol style={{ color: '#94a3b8', paddingLeft: '20px', lineHeight: '1.8' }}>
              <li>Enter the 10-digit number of the client who called you</li>
              <li>Click "Start Logging" to open the call log form</li>
              <li>Fill in all the call details (status, category, remarks, etc.)</li>
              <li>Click "Save Call Log" to record the inbound call</li>
            </ol>
          </div>
        </div>
      ) : (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <div>
              <h3 style={{ color: '#3b82f6', marginBottom: '4px' }}>
                Logging Inbound Call
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                Client Number: <strong style={{ color: '#f1f5f9' }}>{currentClientNumber}</strong>
              </p>
            </div>
            <button
              onClick={handleCancel}
              style={{
                padding: '8px 16px',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                color: '#fca5a5',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Cancel
            </button>
          </div>

          <InboundCallLogForm
            onSubmit={handleFormSubmit}
            initialClientNumber={currentClientNumber}
          />
        </div>
      )}
    </div>
  );
}

export default InboundCalls;
