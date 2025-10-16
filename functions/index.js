const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });
require("dotenv").config();

admin.initializeApp();

/**
 * 🔐 Role-based Access Helper
 * Checks if the authenticated user has the required role.
 *
 * @param {functions.https.CallableContext} context
 *   The function context (Firebase callable context).
 * @param {Array<string>} allowedRoles
 *   List of roles allowed to perform this action.
 * @return {string} The role of the user if authorized.
 */
function checkRole(context, allowedRoles) {
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in",
    );
  }

  const role = context.auth.token.role;

  if (!allowedRoles.includes(role)) {
    throw new functions.https.HttpsError(
        "permission-denied",
        "You do not have permission to perform this action",
    );
  }

  return role;
}


/**
 * 👤 Create a new user
 * - Managers & Admins only
 */
exports.createUser = functions.https.onCall(async (data, context) => {
  checkRole(context, ["admin", "manager"]);

  try {
    const userRecord = await admin.auth().createUser({
      email: data.email,
      password: data.password,
      displayName: data.name,
    });

    await admin.firestore().collection("users").doc(userRecord.uid).set({
      email: data.email,
      name: data.name,
      role: data.role || "agent",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {uid: userRecord.uid, message: "User created successfully"};
  } catch (error) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * 🗑 Delete a user
 * - Admin only
 */
exports.deleteUser = functions.https.onCall(async (data, context) => {
  checkRole(context, ["admin"]);

  try {
    await admin.auth().deleteUser(data.uid);
    await admin.firestore().collection("users").doc(data.uid).delete();

    return {message: "User deleted successfully"};
  } catch (error) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * 🎭 Assign role to a user (agent, manager, admin)
 * - Admin only
 */
exports.assignRole = functions.https.onCall(async (data, context) => {
  checkRole(context, ["admin"]);

  try {
    // Update Firestore
    await admin.firestore().collection("users").doc(data.uid).update({
      role: data.role,
    });

    // Also set custom claims in Firebase Auth
    await admin.auth().setCustomUserClaims(data.uid, {role: data.role});

    return {message: `Role updated to ${data.role}`};
  } catch (error) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * 📞 Log a call
 * - Agents & Admins
 */
exports.logCall = functions.https.onCall(async (data, context) => {
  checkRole(context, ["agent", "admin"]);

  try {
    const logRef = await admin.firestore().collection("callLogs").add({
      userId: context.auth.uid,
      details: data.details,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {logId: logRef.id, message: "Call logged successfully"};
  } catch (error) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * 📊 Fetch reports
 * - Admin only
 */
exports.fetchReports = functions.https.onCall(async (data, context) => {
  checkRole(context, ["admin"]);

  try {
    const snapshot = await admin.firestore().collection("callLogs").get();
    const reports = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));

    return {reports};
  } catch (error) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * 📞 Exotel API Proxy
 * Proxies requests to Exotel API to avoid CORS issues
 */
exports.exotelProxy = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      // Get Exotel credentials from environment variables
      const API_KEY = process.env.EXOTEL_API_KEY;
      const API_TOKEN = process.env.EXOTEL_API_TOKEN;

      if (!API_KEY || !API_TOKEN) {
        return res.status(500).json({
          error: "Exotel credentials not configured",
        });
      }

      // Extract the path after /exotelProxy/
      const exotelPath = req.path.substring(1);
      const url = `https://api.exotel.com/${exotelPath}`;

      console.log("Exotel API Request:", {
        method: req.method,
        url: url,
        body: req.body,
      });

      // Prepare request config
      const config = {
        method: req.method,
        url: url,
        auth: {
          username: API_KEY,
          password: API_TOKEN,
        },
        headers: {
          "Accept": "application/xml, application/json, */*",
        },
      };

      // For POST requests, send as form-urlencoded
      if (req.method === "POST" && req.body) {
        const params = new URLSearchParams();
        Object.keys(req.body).forEach((key) => {
          params.append(key, req.body[key]);
        });
        config.data = params.toString();
        config.headers["Content-Type"] = "application/x-www-form-urlencoded";
      }

      const response = await axios(config);

      console.log("Exotel API Response:", {
        status: response.status,
      });

      return res.status(response.status).send(response.data);
    } catch (error) {
      console.error("Exotel API Error:", error.message);
      if (error.response) {
        console.error("Error details:", {
          status: error.response.status,
          data: error.response.data,
        });
        return res.status(error.response.status).send(error.response.data);
      } else {
        return res.status(500).json({error: error.message});
      }
    }
  });
});
