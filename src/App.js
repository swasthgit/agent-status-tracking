import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";
import { initVersionCheck } from "./utils/versionService";
import { getFullVersionString } from "./config/version";
import UpdateNotification from "./components/UpdateNotification";
import LoginPage from "./components/LoginPage";
import ManagerDashboard from "./components/ManagerDashboard";
import DepartmentManagerDashboard from "./components/DepartmentManagerDashboard";
import HealthManagerDashboard from "./components/HealthManagerDashboard";
import AgentView from "./components/AgentView";
import AgentDetails from "./components/AgentDetails";
import AssignCalls from "./components/AssignCalls";
import TLDashboard from "./components/TLDashboard";
import HealthTLDashboard from "./components/HealthTLDashboard";
import TLView from "./components/TLView";
import OfflineVisitsDashboardNew from "./components/OfflineVisitsDashboardNew";
import OfflineVisitsDashboardMobile from "./components/OfflineVisitsDashboardMobile";
import DCDashboard from "./components/DCDashboard";
import OfflineVisitsManagerDashboardEnhanced from "./components/OfflineVisitsManagerDashboardEnhanced";
import OpsManagerDashboard from "./components/OpsManagerDashboard";
import StateOpsManagerDashboard from "./components/StateOpsManagerDashboard";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import { AppBar, Toolbar, Typography, Button, Container, useMediaQuery, useTheme, Box } from "@mui/material";
import "./App.css";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Version check on app load
  useEffect(() => {
    const canProceed = initVersionCheck();
    if (!canProceed) {
      setIsUpdating(true);
      // The page will refresh automatically
    }
    // Log version for debugging
    console.log(`🚀 App Version: ${getFullVersionString()}`);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("🔍 App.js: Auth state changed - user logged in", user.uid);
        try {
          let userDoc = null;
          let foundCollection = null;

          // First, check the central userCollections mapping (fastest method for new users)
          console.log("🔍 Checking userCollections mapping...");
          const userCollectionDoc = await getDoc(doc(db, "userCollections", user.uid));
          if (userCollectionDoc.exists()) {
            const mappingData = userCollectionDoc.data();
            foundCollection = mappingData.collection;
            console.log("✅ Found in userCollections:", mappingData);

            // Use documentId from mapping if available (for users with empId as doc ID)
            const docId = mappingData.documentId || user.uid;
            userDoc = await getDoc(doc(db, foundCollection, docId));
            console.log("✅ Retrieved user document from", foundCollection, userDoc.exists());
          } else {
            console.log("⚠️ Not found in userCollections, checking fallback collections...");
          }

          // Fallback: Check managers collection (for department managers)
          // Managers can be stored with either UID or empId as document ID, so we query by uid field
          if (!userDoc || !userDoc.exists()) {
            const managersQuery = query(
              collection(db, "managers"),
              where("uid", "==", user.uid)
            );
            const managersSnapshot = await getDocs(managersQuery);

            if (!managersSnapshot.empty) {
              userDoc = managersSnapshot.docs[0];
              foundCollection = "managers";
            }
          }

          // Fallback: Check admin collection (for managers)
          if (!userDoc || !userDoc.exists()) {
            userDoc = await getDoc(doc(db, "admin", user.uid));
            if (userDoc.exists()) {
              foundCollection = "admin";
            }
          }

          // Fallback: Check teamleads collection (for Health and Insurance TLs)
          if (!userDoc || !userDoc.exists()) {
            userDoc = await getDoc(doc(db, "teamleads", user.uid));
            if (userDoc.exists()) {
              foundCollection = "teamleads";
            }
          }

          // Fallback: Check healthAgents collection (for Health agents)
          if (!userDoc || !userDoc.exists()) {
            userDoc = await getDoc(doc(db, "healthAgents", user.uid));
            if (userDoc.exists()) {
              foundCollection = "healthAgents";
            }
          }

          // Fallback: Check insuranceAgents collection (for Insurance agents)
          if (!userDoc || !userDoc.exists()) {
            userDoc = await getDoc(doc(db, "insuranceAgents", user.uid));
            if (userDoc.exists()) {
              foundCollection = "insuranceAgents";
            }
          }

          // Fallback: Check Team Lead collections
          // Insurance TLs use UID as document ID, so lookup directly
          if (!userDoc || !userDoc.exists()) {
            userDoc = await getDoc(doc(db, "insuranceTeamLeads", user.uid));
            if (userDoc.exists()) {
              foundCollection = "insuranceTeamLeads";
            }
          }

          // Health TLs use empId as document ID, so query by uid field
          if (!userDoc || !userDoc.exists()) {
            const healthTLQuery = query(
              collection(db, "healthTeamLeads"),
              where("uid", "==", user.uid)
            );
            const healthTLSnapshot = await getDocs(healthTLQuery);
            if (!healthTLSnapshot.empty) {
              userDoc = healthTLSnapshot.docs[0];
              foundCollection = "healthTeamLeads";
            }
          }

          // Check offlineVisits collection
          if (!userDoc || !userDoc.exists()) {
            userDoc = await getDoc(doc(db, "offlineVisits", user.uid));
            if (userDoc.exists()) {
              foundCollection = "offlineVisits";
            }
          }

          // Check offlineVisitsManagers collection
          if (!userDoc || !userDoc.exists()) {
            userDoc = await getDoc(doc(db, "offlineVisitsManagers", user.uid));
            if (userDoc.exists()) {
              foundCollection = "offlineVisitsManagers";
            }
          }

          // Check opsManagers collection
          if (!userDoc || !userDoc.exists()) {
            console.log("🔍 Checking opsManagers collection...");
            userDoc = await getDoc(doc(db, "opsManagers", user.uid));
            if (userDoc.exists()) {
              foundCollection = "opsManagers";
              console.log("✅ Found in opsManagers collection");
            } else {
              console.log("⚠️ Not found in opsManagers");
            }
          }

          // Fallback: Check agent collections (agent1-agent50) - for legacy agents
          if (!userDoc || !userDoc.exists()) {
            for (let i = 1; i <= 50; i++) {
              const agentCollection = `agent${i}`;
              userDoc = await getDoc(doc(db, agentCollection, user.uid));
              if (userDoc.exists()) {
                foundCollection = agentCollection;
                break;
              }
            }
          }

          // Final fallback: Check email-based collection (for very old legacy users)
          if (!userDoc || !userDoc.exists()) {
            const collectionName = user.email.split("@")[0];
            userDoc = await getDoc(doc(db, collectionName, user.uid));
            if (userDoc.exists()) {
              foundCollection = collectionName;
            }
          }

          if (userDoc && userDoc.exists()) {
            const userData = userDoc.data();
            console.log("✅ App.js: User document found", {
              uid: user.uid,
              email: user.email,
              role: userData.role,
              collection: foundCollection,
              documentId: userDoc.id
            });
            const currentUserData = {
              ...user,
              role: userData.role,
              department: userData.department,
              collection: foundCollection,
              empId: userData.empId,
              name: userData.name
            };
            console.log("✅ Setting currentUser:", currentUserData);
            setCurrentUser(currentUserData);
          } else {
            console.error("❌ App.js: User document not found", {
              uid: user.uid,
              email: user.email,
              checkedCollections: [
                "userCollections", "managers", "admin", "teamleads",
                "healthAgents", "insuranceAgents", "insuranceTeamLeads",
                "healthTeamLeads", "offlineVisits", "offlineVisitsManagers",
                "opsManagers", "agent1-50", "email-based"
              ]
            });
            setCurrentUser(null);
          }
        } catch (error) {
          console.error("Firestore error during auth:", error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
        console.log("No authenticated user");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      console.log("Attempting to log out...");
      await auth.signOut();
      console.log("Logout successful");
      setCurrentUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Check if user is on mobile and viewing offline visits
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;
  const isOfflineVisitsUser = currentUser?.role === "offlineVisits" || currentUser?.role === "Offline Visits";
  const isDCUser = currentUser?.role === "dc_agent" || currentUser?.role === "DC Agent" || currentUser?.role === "male_head_nurse" || currentUser?.role === "Male Head Nurse";
  const shouldHideAppBar = (isOfflineVisitsUser || isDCUser) && isMobile;

  // Show update notification if version update in progress
  if (isUpdating) {
    return <UpdateNotification message="A new version is available. Updating now..." />;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      {/* Hide AppBar for mobile offline visits users - they have their own header */}
      {!shouldHideAppBar && (
        <AppBar
          position="static"
          sx={{
            background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
            backdropFilter: "blur(10px)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
          }}
        >
          <Toolbar sx={{ minHeight: { xs: "56px", sm: "70px" }, px: { xs: 2, sm: 3 } }}>
            <Typography
              variant="h5"
              component="div"
              sx={{
                flexGrow: 1,
                fontWeight: 600,
                background: "linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "0.5px",
                fontSize: { xs: "1rem", sm: "1.5rem" },
              }}
            >
              M-Swasth Portal
            </Typography>
            {currentUser && (
              <Button
                onClick={handleLogout}
                sx={{
                  color: "white",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "12px",
                  px: { xs: 2, sm: 3 },
                  py: { xs: 0.75, sm: 1 },
                  fontWeight: 500,
                  textTransform: "none",
                  fontSize: { xs: "0.8125rem", sm: "0.95rem" },
                  minHeight: { xs: 36, sm: 40 },
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                  },
                }}
              >
                Logout
              </Button>
            )}
          </Toolbar>
        </AppBar>
      )}
      <Box sx={{ mt: shouldHideAppBar ? 0 : 2, px: shouldHideAppBar ? 0 : { xs: 1, sm: 2, md: 3 } }}>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route
            path="/manager-dashboard"
            element={
              currentUser?.role === "manager" ? (
                <ManagerDashboard currentUser={currentUser} />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/department-manager-dashboard"
            element={
              currentUser?.role === "Manager" ? (
                currentUser?.department === "Health" ? (
                  <HealthManagerDashboard currentUser={currentUser} />
                ) : (
                  <DepartmentManagerDashboard />
                )
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/agent-view"
            element={
              (currentUser?.role === "agent" ||
               currentUser?.role === "Health Agent" ||
               currentUser?.role === "Insurance Agent") ? (
                <AgentView
                  currentUser={currentUser}
                  onStatusChange={(agentId, newStatus) => {}}
                />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/agent-details/:collectionName/:agentId"
            element={
              currentUser?.role === "manager" || currentUser?.role === "Manager" ? (
                <AgentDetails />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/assign-calls/:collectionName/:agentId"
            element={
              currentUser?.role === "manager" || currentUser?.role === "Manager" ? (
                <AssignCalls />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          {/* Team Lead Routes */}
          <Route
            path="/tl-dashboard"
            element={
              (currentUser?.role === "teamlead" ||
               currentUser?.role === "teamLead" ||
               currentUser?.role === "Health TL" ||
               currentUser?.role === "Insurance TL") ? (
                currentUser?.department === "Health" ? (
                  <HealthTLDashboard currentUser={currentUser} />
                ) : (
                  <TLDashboard currentUser={currentUser} />
                )
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/tl-view"
            element={
              (currentUser?.role === "teamlead" ||
               currentUser?.role === "teamLead" ||
               currentUser?.role === "Health TL" ||
               currentUser?.role === "Insurance TL") ? (
                <TLView
                  currentUser={currentUser}
                  onStatusChange={(agentId, newStatus) => {}}
                />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/tl/agent-details/:collectionName/:agentId"
            element={
              (currentUser?.role === "teamlead" ||
               currentUser?.role === "Health TL" ||
               currentUser?.role === "Insurance TL") ? (
                <AgentDetails />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          {/* Offline Visits Route - Uses mobile-optimized dashboard on mobile devices */}
          <Route
            path="/offline-visits"
            element={
              (currentUser?.role === "offlineVisits" ||
               currentUser?.role === "Offline Visits") ? (
                isMobile ? (
                  <OfflineVisitsDashboardMobile currentUser={currentUser} />
                ) : (
                  <OfflineVisitsDashboardNew currentUser={currentUser} />
                )
              ) : (
                <Navigate to="/" />
              )
            }
          />
          {/* DC Agent Route */}
          <Route
            path="/dc-dashboard"
            element={
              (currentUser?.role === "dc_agent" ||
               currentUser?.role === "DC Agent" ||
               currentUser?.role === "male_head_nurse" ||
               currentUser?.role === "Male Head Nurse") ? (
                // Check if this DC is also a State Ops Manager
                currentUser?.isStateOpsManager ? (
                  <StateOpsManagerDashboard
                    currentUser={currentUser}
                    onLogout={handleLogout}
                  />
                ) : (
                  <DCDashboard
                    userId={currentUser.uid}
                    userRole={currentUser.role}
                    userData={currentUser}
                  />
                )
              ) : (
                <Navigate to="/" />
              )
            }
          />
          {/* State Ops Manager Route (explicit route) */}
          <Route
            path="/state-ops-manager"
            element={
              currentUser?.isStateOpsManager ? (
                <StateOpsManagerDashboard
                  currentUser={currentUser}
                  onLogout={handleLogout}
                />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          {/* Offline Visits Manager Route */}
          <Route
            path="/offline-visits-manager"
            element={
              (currentUser?.role === "offlineVisitsManager" ||
               currentUser?.role === "Offline Visits Manager") ? (
                <OfflineVisitsManagerDashboardEnhanced currentUser={currentUser} />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          {/* Ops Manager Route */}
          <Route
            path="/ops-manager-dashboard"
            element={
              (currentUser?.role === "opsManager" ||
               currentUser?.role === "Ops Manager") ? (
                <OpsManagerDashboard currentUser={currentUser} />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </Box>
    </div>
  );
}

export default App;