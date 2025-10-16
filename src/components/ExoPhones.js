import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  collection,
  query,
  getDocs,
  addDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import API_BASE_URL from "../config/api";
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

    if (!toNumber || !fromNumber || !callerId) {
      setError("Settings not configured. Please add your number and ExoPhone.");
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

  const handleExotelPhoneChange = (value) => {
    setSelectedExotelPhoneInput(value);
  };

  if (loading)
    return (
      <div className="container mt-5">
        <p>Loading assigned calls...</p>
      </div>
    );
  if (error && assignedCalls.length === 0)
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
      <h2 className="title">Assigned Calls for {agentCollection}</h2>
      <div className="global-settings">
        <div className="input-box">
          <label htmlFor="global-yournumber" className="text-sm text-gray-600">
            Your Number
          </label>
          <input
            type="number"
            id="global-yournumber"
            placeholder="e.g., 8700612665"
            value={manualNumberInput}
            onChange={(e) => handleManualNumberChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="select-box">
          <label
            htmlFor="global-exotelSelect"
            className="text-sm text-gray-600"
          >
            Caller ID (ExoPhone)
          </label>
          <select
            id="global-exotelSelect"
            value={selectedExotelPhoneInput}
            onChange={(e) => handleExotelPhoneChange(e.target.value)}
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
          onClick={handleAddSettings}
          className="ml-2 p-2 bg-blue-500 text-white rounded-md"
          disabled={!manualNumberInput || !selectedExotelPhoneInput}
        >
          Add
        </button>
      </div>
      {error && <div className="alert alert-danger mt-3">{error}</div>}
      <div className="call-list">
        {assignedCalls.map((item) => (
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
            <div className="call-settings">
              <p>
                Your Number: {globalManualNumber || "Not set"} | ExoPhone:{" "}
                {globalSelectedExotelPhone || "Not set"}
              </p>
            </div>
            <button
              className="call-btn"
              onClick={() => handleMakeCall(item.id)}
              disabled={!globalManualNumber || !globalSelectedExotelPhone}
            >
              📞
            </button>
          </div>
        ))}
      </div>
      {exotelPhones.length === 0 && (
        <p className="mt-3 text-red-500">No Exotel phones available.</p>
      )}
      {assignedCalls.length === 0 && (
        <p className="mt-3 text-red-500">No assigned calls found.</p>
      )}

      {callHistory.length > 0 && (
        <div className="call-history mt-5">
          <h3 className="title">Call History</h3>
          <ul>
            {callHistory.map((call, index) => (
              <li key={index}>
                SID: {call.sid}, Agent: {call.agent}, Lead: {call.lead},
                ExoPhone: {call.exophone}, Time: {call.time}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ExoPhones;