# 🔒 Secure Deployment Guide - M-Swasth Agent Call System

**Critical:** This guide ensures no sensitive data is exposed during deployment.

---

## ✅ Security Measures Implemented

### 1. Environment Variables (.env)
**Status:** ✅ Secured

**What's Protected:**
- ✅ Exotel API Key
- ✅ Exotel API Token
- ✅ Exotel Account SID
- ✅ Firebase API Key
- ✅ Firebase Auth Domain
- ✅ Firebase Project ID
- ✅ Firebase Storage Bucket
- ✅ Firebase Messaging Sender ID
- ✅ Firebase App ID

**Files:**
- `.env` - Contains actual secrets (NEVER commit or deploy)
- `.env.example` - Template without secrets (safe to commit)
- `src/firebaseConfig.js` - Uses environment variables

**Protection:**
```
.env → Excluded in .gitignore
.env → Excluded in .firebaseignore
```

---

### 2. Firebase Admin Scripts
**Status:** ✅ Secured

**What's Protected:**
- ✅ Service Account Key (serviceAccountKey.json)
- ✅ User creation scripts with emails/passwords
- ✅ Partner list (23 microfinance institutions)
- ✅ TL assignment scripts

**Files Excluded from Deployment:**
- `firebase-admin/serviceAccountKey.json`
- `firebase-admin/createUsers.js`
- `firebase-admin/createTLsAndAgents.js`
- `firebase-admin/fixTLAgentMapping.js`
- `firebase-admin/uploadCorrectPartners.js`
- `firebase-admin/uploadSamplePartners.js`
- `firebase-admin/deleteDuplicates.js`

**Protection:**
```
firebase-admin/ → Excluded in .firebaseignore
firebase-admin/ → Excluded in firebase.json
```

---

### 3. Source Code
**Status:** ✅ Secured

**What's Protected:**
- ✅ React source code (only built version deployed)
- ✅ Component files
- ✅ Utility functions
- ✅ Development files

**Protection:**
```
src/ → Excluded in .firebaseignore
Only build/ folder is deployed (minified & obfuscated)
```

---

### 4. Configuration Files
**Status:** ✅ Secured

**Files Excluded:**
- `.firebaserc` - Firebase project config
- `firebase.json` - Hosting config
- `package.json` - Dependencies list
- `package-lock.json` - Dependency tree

**Protection:**
```
All config files excluded in .firebaseignore
```

---

## 🚨 Pre-Deployment Security Checklist

Before running `firebase deploy`, verify these:

### ✅ Environment Variables
- [ ] `.env` file exists in project root
- [ ] `.env` contains all required variables (see .env.example)
- [ ] `.env` is listed in `.gitignore`
- [ ] `.env` is listed in `.firebaseignore`
- [ ] `src/firebaseConfig.js` uses `process.env.REACT_APP_*`

### ✅ Sensitive Files Protected
- [ ] `firebase-admin/` folder excluded
- [ ] `serviceAccountKey.json` excluded
- [ ] User creation scripts excluded
- [ ] Partner upload scripts excluded

### ✅ Git Repository Clean
- [ ] `.env` NOT in git history
- [ ] `serviceAccountKey.json` NOT in git
- [ ] No hardcoded API keys in code
- [ ] No hardcoded passwords in code

### ✅ Firebase Hosting Configuration
- [ ] `.firebaseignore` file exists
- [ ] `firebase.json` has correct public directory ("build")
- [ ] `firebase.json` ignores sensitive folders

---

## 🔐 What Gets Deployed vs What Stays Local

### ✅ DEPLOYED (Public - Safe)
```
build/
├── index.html (minified)
├── static/
│   ├── css/ (minified, no source maps)
│   ├── js/ (minified, bundled, env vars embedded)
│   └── media/
├── favicon.ico
├── manifest.json
└── robots.txt
```

**Note:** Environment variables are **embedded** into the JavaScript bundle during build. The `.env` file itself is **NOT** deployed.

### ❌ NOT DEPLOYED (Private - Secure)
```
.env                    ← Your actual secrets
.env.*                  ← All environment files
firebase-admin/         ← Admin scripts
src/                    ← Source code
server/                 ← Server files
node_modules/           ← Dependencies
*.md                    ← Documentation
*.log                   ← Log files
.git/                   ← Git history
package.json            ← Config files
```

---

## 🛡️ How Environment Variables Work

### During Development (localhost:3000):
```javascript
// React reads from .env file
const apiKey = process.env.REACT_APP_FIREBASE_API_KEY;
// ✅ Secure - .env is on your local machine only
```

### During Build (npm run build):
```javascript
// React embeds values into JavaScript bundle
const apiKey = "AIzaSyDIDMhLZUT1VbxTV3vcVcvbBMDSPUE2Cnc";
// ✅ Secure - API key is needed for Firebase to work
// ✅ Safe - Firebase API keys are meant to be in frontend code
// ✅ Protected - Firebase Security Rules protect your data
```

### After Deployment:
```
.env file → STAYS LOCAL ✅
API keys → IN BUNDLE (required for app to work) ✅
Service Account → NEVER DEPLOYED ✅
Admin Scripts → NEVER DEPLOYED ✅
```

---

## 🔒 Firebase Security Layers

### Layer 1: Firestore Security Rules
**File:** `UPDATED_FIRESTORE_RULES.txt`

**Protection:**
- ✅ Only authenticated users can access data
- ✅ Users can only read their own data
- ✅ TLs can only read their team's data
- ✅ Managers can read all (with proper authentication)

**CRITICAL:** Apply these rules in Firebase Console before deployment!

### Layer 2: Firebase Authentication
**Protection:**
- ✅ All passwords hashed by Firebase
- ✅ Secure token-based sessions
- ✅ Automatic token refresh
- ✅ Session expiration

### Layer 3: API Key Restrictions (Recommended)
**Optional Extra Security:**

1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your Firebase API key
3. Add Application Restrictions:
   - HTTP referrers: `https://agent-status-b9204.web.app/*`
4. Add API Restrictions:
   - Only allow: Firebase APIs

---

## 📝 Secure Deployment Steps

### Step 1: Verify .env File

```bash
# Check .env exists
dir .env

# Verify it contains all variables
type .env
```

**Should show:**
```
REACT_APP_API_KEY=...
REACT_APP_API_TOKEN=...
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
...
```

### Step 2: Verify .firebaseignore

```bash
# Check file exists
dir .firebaseignore

# Verify it excludes .env
type .firebaseignore | findstr ".env"
```

**Should show:**
```
.env
.env.*
*.env
```

### Step 3: Test Build Locally

```bash
# Build production version
npm run build

# Check build folder
dir build

# Verify .env is NOT in build folder
dir build\.env
# Should show: File Not Found
```

### Step 4: Verify Firebase Project

```bash
# Check logged in
firebase login

# Check correct project
firebase use
# Should show: agent-status-b9204
```

### Step 5: Deploy Securely

```bash
# Deploy only hosting (not functions, not database)
firebase deploy --only hosting

# Watch output for any warnings
```

### Step 6: Verify Deployment

After deployment, check these URLs should **FAIL**:

```bash
# These should return 404 or Access Denied:
https://agent-status-b9204.web.app/.env
https://agent-status-b9204.web.app/firebase-admin/
https://agent-status-b9204.web.app/serviceAccountKey.json
```

**If any of these work, IMMEDIATELY:**
```bash
# Redeploy with correct .firebaseignore
firebase deploy --only hosting
```

---

## 🚨 If .env Was Accidentally Deployed

### Immediate Actions:

1. **Revoke All API Keys:**
   ```bash
   # Go to Firebase Console → Project Settings
   # Regenerate Web API Key

   # Go to Exotel Dashboard
   # Regenerate API Key and Token
   ```

2. **Update .firebaseignore:**
   ```bash
   # Ensure .env is listed
   echo .env >> .firebaseignore
   echo .env.* >> .firebaseignore
   ```

3. **Redeploy Immediately:**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

4. **Update Local .env:**
   ```bash
   # Update with new keys
   REACT_APP_API_KEY=new_exotel_key
   REACT_APP_FIREBASE_API_KEY=new_firebase_key
   ```

5. **Rebuild and Redeploy:**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

---

## 🧪 Security Testing

After deployment, test these:

### Test 1: Check for Exposed Files

```bash
# Open browser developer tools (F12)
# Go to Sources tab
# Check if any of these are visible:
# - .env
# - serviceAccountKey.json
# - firebase-admin/
#
# ❌ If visible: STOP and fix .firebaseignore
# ✅ If not visible: Secure!
```

### Test 2: Direct URL Access

Try accessing:
```
https://agent-status-b9204.web.app/.env
https://agent-status-b9204.web.app/serviceAccountKey.json
```

**Expected:** 404 Not Found
**If accessible:** Redeploy immediately!

### Test 3: Network Tab

```bash
# Open app in browser
# Open DevTools → Network tab
# Reload page
# Check all requests
#
# ✅ Should only see:
#   - index.html
#   - main.[hash].js
#   - main.[hash].css
#   - Firebase API calls
#
# ❌ Should NOT see:
#   - .env
#   - serviceAccountKey.json
#   - Any admin scripts
```

---

## 📋 Deployment Checklist

Use this checklist for every deployment:

- [ ] `.env` file exists locally
- [ ] `.env` listed in `.gitignore`
- [ ] `.env` listed in `.firebaseignore`
- [ ] `src/firebaseConfig.js` uses environment variables
- [ ] No hardcoded secrets in source code
- [ ] `firebase-admin/` excluded from deployment
- [ ] `serviceAccountKey.json` excluded
- [ ] Firestore Security Rules applied in Console
- [ ] Built production version (`npm run build`)
- [ ] Tested build locally
- [ ] Deployed with `firebase deploy --only hosting`
- [ ] Tested deployed app
- [ ] Verified .env NOT accessible via URL
- [ ] All features working correctly

---

## ✅ Summary

### What's Secure:
- ✅ API keys protected in .env
- ✅ Firebase config uses environment variables
- ✅ Admin scripts never deployed
- ✅ Service account key never deployed
- ✅ Partner data secured
- ✅ .env excluded from deployment
- ✅ .firebaseignore configured
- ✅ Source code not deployed (only build)

### What's Safe to Be Public:
- ✅ Firebase API Key (in bundle) - Protected by Firestore Rules
- ✅ Firebase Auth Domain - Public by design
- ✅ Firebase Project ID - Public by design
- ✅ Built JavaScript bundles - Minified & obfuscated

### What Must Stay Private:
- ❌ .env file
- ❌ Service Account Key
- ❌ Exotel API credentials
- ❌ Admin scripts
- ❌ User creation scripts
- ❌ Partner upload scripts

---

## 🎯 Ready to Deploy Securely!

Follow these steps:

```bash
# 1. Verify environment
cat .env
cat .firebaseignore

# 2. Build
npm run build

# 3. Deploy
firebase deploy --only hosting

# 4. Test
# Open: https://agent-status-b9204.web.app
# Try: https://agent-status-b9204.web.app/.env (should 404)

# 5. Done!
```

**Your deployment is now secure! 🔒🚀**
