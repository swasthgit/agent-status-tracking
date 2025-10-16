import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";
import LoginPage from "./components/LoginPage";
import ManagerDashboard from "./components/ManagerDashboard";
import AgentView from "./components/AgentView";
import AgentDetails from "./components/AgentDetails";
import AssignCalls from "./components/AssignCalls";
import UploadPartners from "./components/UploadPartners";
import TLDashboard from "./components/TLDashboard";
import TLView from "./components/TLView";
import { AppBar, Toolbar, Typography, Button, Container } from "@mui/material";
import "./App.css";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // First check mswasth collection (for TLs and new agents)
          let userDoc = await getDoc(doc(db, "mswasth", user.uid));

          // If not in mswasth, check the email-based collection (for existing managers/agents)
          if (!userDoc.exists()) {
            const collectionName = user.email.split("@")[0];
            userDoc = await getDoc(doc(db, collectionName, user.uid));
          }

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUser({ ...user, role: userData.role });
            console.log("Authenticated User:", {
              ...user,
              role: userData.role,
            });
          } else {
            console.warn("User document not found for UID:", user.uid);
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <AppBar
        position="static"
        sx={{
          background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
        }}
      >
        <Toolbar sx={{ minHeight: "70px !important", px: 3 }}>
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
            }}
          >
            Agent Status and Call Logger
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
                px: 3,
                py: 1,
                fontWeight: 500,
                textTransform: "none",
                fontSize: "0.95rem",
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
      <Container sx={{ mt: 2 }}>
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
            path="/agent-view"
            element={
              currentUser?.role === "agent" ? (
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
              currentUser?.role === "manager" ? (
                <AgentDetails />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/assign-calls/:collectionName/:agentId"
            element={
              currentUser?.role === "manager" ? (
                <AssignCalls />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/upload-partners"
            element={
              currentUser?.role === "manager" ? (
                <UploadPartners />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          {/* Team Lead Routes */}
          <Route
            path="/tl-dashboard"
            element={
              currentUser?.role === "teamlead" ? (
                <TLDashboard currentUser={currentUser} />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/tl-view"
            element={
              currentUser?.role === "teamlead" ? (
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
              currentUser?.role === "teamlead" ? (
                <AgentDetails />
              ) : (
                <Navigate to="/" />
              )
            }
          />
        </Routes>
      </Container>
    </div>
  );
}

export default App;