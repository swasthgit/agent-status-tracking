import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ManualLeads.css";
import ManualCallLogForm from "./ManualCallLogForm";
import { db } from "../firebaseConfig";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import API_BASE_URL from "../config/api";

const ACCOUNT_SID = process.env.REACT_APP_ACCOUNT_SID;

function ManualLeads({ agentId, agentCollection, onStartCall, onEndCall }) {
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

  // Fetch agent name from Firestore
  const fetchAgentName = async () => {
    try {
      const agentDocRef = collection(db, agentCollection);
      const agentSnapshot = await getDocs(agentDocRef);
      const agentDoc = agentSnapshot.docs.find(doc => doc.id === agentId);
      if (agentDoc) {
        const agentData = agentDoc.data();
        setAgentName(agentData.name || "Agent");
      }
    } catch (err) {
      console.error("Error fetching agent name:", err);
    }
  };

  useEffect(() => {
    console.log("agentId:", agentId, "agentCollection:", agentCollection);
    fetchAgentName();
    setLoading(false);
  }, [agentId, agentCollection]);

  useEffect(() => {
    const fetchExotelPhones = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/v1/Accounts/${ACCOUNT_SID}/IncomingPhoneNumbers`
        );

        // Parse XML response
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(response.data, "application/xml");
        const phoneElements = xmlDoc.getElementsByTagName("IncomingPhoneNumber");

        const phones = [];
        for (let i = 0; i < phoneElements.length; i++) {
          const phoneElement = phoneElements[i];
          phones.push({
            phone_number: phoneElement.getElementsByTagName("PhoneNumber")[0]?.textContent,
            friendly_name: phoneElement.getElementsByTagName("FriendlyName")[0]?.textContent,
            sid: phoneElement.getElementsByTagName("Sid")[0]?.textContent,
          });
        }

        setExotelPhones(phones);
      } catch (err) {
        console.error("Error fetching Exotel phones:", err);

        // Try to parse error message from XML response
        let errorMessage = err.message;
        if (err.response && err.response.data) {
          try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(err.response.data, "application/xml");
            const errorMsg = xmlDoc.getElementsByTagName("Message")[0]?.textContent;
            const errorCode = xmlDoc.getElementsByTagName("Code")[0]?.textContent;
            if (errorMsg) {
              errorMessage = `${errorMsg} (Code: ${errorCode})`;
              console.error("Exotel API Error:", errorMessage);
            }
          } catch (parseErr) {
            console.error("Could not parse error XML:", parseErr);
          }
        }

        setError("Error fetching Exotel phones: " + errorMessage);
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
    setManualNumbers((prev) => ({ ...prev, [newId]: "" }));
    setSelectedExotelPhones((prev) => ({ ...prev, [newId]: "" }));
    setNewLeadNumber("");
    setError(null);
  };

  const handleManualNumberChange = (leadId, value) => {
    setManualNumbers((prev) => ({ ...prev, [leadId]: value }));
  };

  const handleExotelPhoneChange = (leadId, value) => {
    setSelectedExotelPhones((prev) => ({ ...prev, [leadId]: value }));
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

    if (!toNumber || !fromNumber || !callerId) {
      setError("Please enter your number and select a Caller ID Exophone.");
      return;
    }
    if (!/^\d{10}$/.test(fromNumber)) {
      setError("Your number must be exactly 10 digits.");
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

      // Store SID and callerId for later use in form submission
      setCurrentCallSid(callSid);
      setCurrentCallerId(callerId);
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
      const callLogsRef = collection(db, agentCollection, agentId, "callLogs");
      await addDoc(callLogsRef, {
        ...logEntry,
        agentId,
        agentName,
        sid: currentCallSid,
        callerId: currentCallerId,
        callType: "Manual Lead",
        timestamp: serverTimestamp(),
        startTime: callStartTime ? callStartTime.toISOString() : null,
        endTime: new Date().toISOString(),
      });
      setShowCallForm(false);
      setCurrentLeadNumber("");
      setCallStartTime(null);
      setCurrentCallSid("");
      setCurrentCallerId("");
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
      <div className="welcome-card">
        <div className="welcome-icon">👤</div>
        <h1 className="welcome-text">Welcome back, {agentName}</h1>
        <p className="welcome-subtext">Ready to make some calls today?</p>
      </div>
      <h2 className="title">Manual Leads</h2>
      <div className="add-lead-form">
        <input
          type="tel"
          pattern="\d{10}"
          maxLength="10"
          placeholder="Enter 10-digit lead number (e.g., 1234567890)"
          value={newLeadNumber}
          onChange={(e) => setNewLeadNumber(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAddLead}
          className="ml-2 p-2 bg-blue-500 text-white rounded-md"
        >
          Add Lead
        </button>
      </div>
      {error && <div className="alert alert-danger mt-3">{error}</div>}
      <div className="call-list">
        {manualLeads.map((item) => (
          <div key={item.id} className="lead-call-card">
            <div className="lead-info">
              <small className="text-gray-500 uppercase text-xs font-medium">
                LEAD TO CALL
              </small>
              <a
                href={`tel:${item.clientNumber}`}
                className="text-blue-600 font-medium text-lg hover:underline"
              >
                {item.clientNumber}
              </a>
            </div>
            <div className="input-box">
              <label
                htmlFor={`yournumber-${item.id}`}
                className="text-sm text-gray-600"
              >
                Your Number (10 digits)
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
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="select-box">
              <label
                htmlFor={`exotelSelect-${item.id}`}
                className="text-sm text-gray-600"
              >
                Caller ID (ExoPhone)
              </label>
              <select
                id={`exotelSelect-${item.id}`}
                value={selectedExotelPhones[item.id] || ""}
                onChange={(e) =>
                  handleExotelPhoneChange(item.id, e.target.value)
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select --</option>
                {exotelPhones.map((phone, index) => (
                  <option key={index} value={phone.phone_number}>
                    {phone.phone_number} ({phone.friendly_name})
                  </option>
                ))}
              </select>
            </div>
            <button
              className="call-btn"
              onClick={() => handleMakeCall(item.id)}
              disabled={!manualNumbers[item.id] || isCallActive}
            >
              📞
            </button>
          </div>
        ))}
      </div>
      {exotelPhones.length === 0 && (
        <p className="mt-3 text-red-500">No Exotel phones available.</p>
      )}
      {manualLeads.length === 0 && (
        <p className="mt-3 text-red-500">No manual leads added yet.</p>
      )}

      {callHistory.length > 0 && (
        <div className="call-history mt-5">
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

      {isCallActive && (
        <div className="end-call-interface">
          <h3>Call in Progress</h3>
          <p>Stay focused and professional</p>
          <button onClick={handleEndCall} className="end-call-btn">
            End Call
          </button>
        </div>
      )}

      {showCallForm && (
        <ManualCallLogForm
          onSubmit={handleFormSubmit}
          initialClientNumber={currentLeadNumber}
        />
      )}
    </div>
  );
}

export default ManualLeads;