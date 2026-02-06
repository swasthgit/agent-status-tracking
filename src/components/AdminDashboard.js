import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  CircularProgress,
  CssBaseline,
  ThemeProvider,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import adminTheme, { colors, transitions, sidebarStyles } from "../theme/adminTheme";
import { Sidebar } from "./admin";
import UserManagement from "./AdminUserManagement";
import TeamManagement from "./AdminTeamManagement";
import DepartmentManagement from "./AdminDepartmentManagement";
import AdminOverview from "./AdminOverview";
import ClinicMappingManager from "./ClinicMappingManager";
import { keyframes } from "@mui/system";

// Loading spinner animation
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggerAddUser, setTriggerAddUser] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check session storage first
    const isAuthenticated = sessionStorage.getItem("adminAuthenticated");
    const loginId = sessionStorage.getItem("adminLoginId");

    if (!isAuthenticated || isAuthenticated !== "true") {
      navigate("/admin/login");
      return;
    }

    // Listen for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Verify user is still an admin
          const adminDoc = await getDoc(doc(db, "admin", user.uid));
          if (adminDoc.exists()) {
            setAdminData({
              loginId: loginId || user.email,
              role: "admin",
              uid: user.uid
            });
          } else {
            // User is not an admin anymore
            console.warn("User is not an admin");
            handleLogout();
          }
        } catch (error) {
          console.error("Error verifying admin status:", error);
          // Still set admin data from session if Firestore check fails
          setAdminData({ loginId: loginId || user.email, role: "admin", uid: user.uid });
        }
      } else {
        // No user signed in, redirect to login
        console.warn("No Firebase user signed in");
        handleLogout();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = () => {
    auth.signOut();
    sessionStorage.removeItem("adminAuthenticated");
    sessionStorage.removeItem("adminLoginId");
    sessionStorage.removeItem("adminUid");
    sessionStorage.removeItem("adminEmail");
    navigate("/admin/login");
  };

  const handleTabChange = (newValue) => {
    setActiveTab(newValue);
  };

  // Quick Action handlers from Overview
  const handleAddUserFromOverview = () => {
    setTriggerAddUser(true);
    setActiveTab(1); // Switch to User Management tab
  };

  const handleManageTeams = () => {
    setActiveTab(2); // Switch to Team Management tab
  };

  const handleViewReports = () => {
    // For now, go to User Management with a view of all users
    // In the future, this could be a dedicated reports/analytics page
    setActiveTab(1);
  };

  const handleDepartmentSettings = () => {
    setActiveTab(4); // Switch to Department Management tab
  };

  const handleClinicMapping = () => {
    setActiveTab(3); // Switch to Clinic Mapping tab
  };

  // Reset trigger after it's consumed
  const handleAddUserTriggered = () => {
    setTriggerAddUser(false);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Loading state with new dark theme
  if (loading || !adminData) {
    return (
      <ThemeProvider theme={adminTheme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.background.primary,
            flexDirection: "column",
            gap: 3,
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
            variant="body2"
            sx={{
              color: colors.text.muted,
              animation: `${pulse} 1.5s ease-in-out infinite`,
            }}
          >
            Loading Admin Portal...
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  const sidebarWidth = sidebarCollapsed
    ? sidebarStyles.width.collapsed
    : sidebarStyles.width.expanded;

  return (
    <ThemeProvider theme={adminTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: colors.background.primary,
          display: "flex",
        }}
      >
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          adminEmail={adminData.loginId}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            marginLeft: `${sidebarWidth}px`,
            padding: "24px",
            minHeight: "100vh",
            transition: `margin-left ${transitions.base}`,
            backgroundColor: colors.background.primary,
          }}
        >
          {/* Page Content */}
          {activeTab === 0 && (
            <AdminOverview
              onAddUser={handleAddUserFromOverview}
              onManageTeams={handleManageTeams}
              onViewReports={handleViewReports}
              onDepartmentSettings={handleDepartmentSettings}
            />
          )}
          {activeTab === 1 && (
            <UserManagement
              adminData={adminData}
              triggerAddUser={triggerAddUser}
              onAddUserTriggered={handleAddUserTriggered}
            />
          )}
          {activeTab === 2 && <TeamManagement adminData={adminData} />}
          {activeTab === 3 && <ClinicMappingManager />}
          {activeTab === 4 && <DepartmentManagement adminData={adminData} />}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default AdminDashboard;
