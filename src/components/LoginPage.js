import React, { useState } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import styles from "./LoginPage.module.css";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // First check mswasth collection (for TLs and new agents)
      let userDoc = await getDoc(doc(db, "mswasth", user.uid));

      // If not in mswasth, check the email-based collection (for existing managers/agents)
      if (!userDoc.exists()) {
        const collectionName = user.email.split("@")[0]; // e.g., "agent1" or "admin"
        userDoc = await getDoc(doc(db, collectionName, user.uid));
      }

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role;

        if (role === "manager") {
          navigate("/manager-dashboard");
        } else if (role === "agent") {
          navigate("/agent-view");
        } else if (role === "teamlead") {
          navigate("/tl-dashboard");
        } else {
          setError("Invalid user role");
        }
      } else {
        setError("User role not found");
        // console.warn("User document not found for UID:", user.uid);
      }
    } catch (error) {
      setError("Incorrect email or password");
      // console.error("Login error:", error);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (e) => {
    e.preventDefault();
  };

  return (
    <div className={styles.background}>
      <Container
        maxWidth="lg"
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          justifyContent: "center",
          minHeight: "80vh",
          padding: { xs: 1, sm: 2 },
        }}
      >
        <img
          src="/welcome.svg"
          alt="Welcome illustration"
          className={styles.welcomeImage}
        />
        <Paper elevation={4} className={styles.loginPaper}>
          <Typography variant="h5" className={styles.title}>
            Sign In
          </Typography>
          <Box
            component="form"
            onSubmit={handleLogin}
            noValidate
            className={styles.form}
            sx={{ padding: { xs: 1, sm: 2 } }}
          >
            <TextField
              fullWidth
              required
              id="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              variant="outlined"
              className={styles.textField}
              margin="normal"
              autoFocus
            />
            <TextField
              fullWidth
              required
              id="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              variant="outlined"
              className={styles.textField}
              margin="normal"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              className={styles.submitButton}
              sx={{ mt: 2, padding: { xs: "0.5rem", sm: "0.75rem" } }}
            >
              Sign In
            </Button>
            {error && (
              <Typography color="error" className={styles.errorMessage}>
                {error}
              </Typography>
            )}
          </Box>
        </Paper>
      </Container>
    </div>
  );
};

export default LoginPage;
