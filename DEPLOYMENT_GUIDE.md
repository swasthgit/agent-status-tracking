# M-Swasth Agent Call System - Deployment Guide

**Project:** Agent Status and Call Logger
**Firebase Project:** agent-status-b9204
**Deployment Date:** October 16, 2025

---

## 🚨 CRITICAL: Pre-Deployment Checklist

Before deploying, you **MUST** complete these steps:

### ✅ 1. Apply Firestore Security Rules (REQUIRED!)

**Why:** Without this, the deployed app won't work - users will get permission errors.

**Steps:**
1. Open https://console.firebase.google.com/
2. Select project: **agent-status-b9204**
3. Go to **Firestore Database** → **Rules** tab
4. Open file: `UPDATED_FIRESTORE_RULES.txt` in this project
5. Copy ALL contents (Ctrl+A, Ctrl+C)
6. Paste into Firebase Console (replace all existing rules)
7. Click **"Publish"** button
8. Wait for "Rules deployed successfully" message

**Status:** ⬜ Not Done | ✅ Completed

---

### ✅ 2. Verify Firebase Configuration

**Check these files exist:**
- ✅ `firebase.json` - Firebase hosting configuration
- ✅ `.firebaserc` - Project ID (agent-status-b9204)
- ✅ `src/firebaseConfig.js` - Firebase SDK configuration

**Status:** ✅ All files present

---

### ✅ 3. Verify Data is Populated

**Check in Firebase Console:**
- ✅ 31 Agents created (agent1-agent31 collections)
- ✅ 4 Team Leaders created (in mswasth collection)
- ✅ 1 Admin created (in admin collection)
- ✅ 23 Partners uploaded (in partners collection)

**Status:** ⬜ Verify in Firebase Console

---

## 📦 Deployment Steps

### Step 1: Stop Development Server

If you have the development server running, stop it first:

```bash
# Press Ctrl+C in the terminal running npm start
```

**Why:** Free up system resources for the build process.

---

### Step 2: Install Firebase CLI (If Not Already Installed)

Check if Firebase CLI is installed:

```bash
firebase --version
```

**If not installed, install it:**

```bash
npm install -g firebase-tools
```

**Verify installation:**

```bash
firebase --version
```

Should show version 13.x or higher.

---

### Step 3: Login to Firebase

```bash
firebase login
```

- Browser will open
- Login with your Google account that has access to agent-status-b9204 project
- Authorize Firebase CLI

**Check logged in user:**

```bash
firebase projects:list
```

Should show **agent-status-b9204** in the list.

---

### Step 4: Build Production Version

Create optimized production build:

```bash
npm run build
```

**This will:**
- Create optimized React bundles
- Minify JavaScript and CSS
- Generate static files in `build/` folder
- Take 2-5 minutes to complete

**Expected output:**
```
Creating an optimized production build...
Compiled successfully!

File sizes after gzip:

  XX KB  build/static/js/main.xxxxxxxx.js
  XX KB  build/static/css/main.xxxxxxxx.css

The build folder is ready to be deployed.
```

**Check build folder exists:**

```bash
dir build
```

Should see index.html, static folder, etc.

---

### Step 5: Deploy to Firebase Hosting

Deploy the build folder to Firebase:

```bash
firebase deploy --only hosting
```

**This will:**
- Upload all files from `build/` folder
- Deploy to Firebase Hosting
- Generate live URL
- Take 1-2 minutes

**Expected output:**
```
=== Deploying to 'agent-status-b9204'...

i  deploying hosting
i  hosting[agent-status-b9204]: beginning deploy...
i  hosting[agent-status-b9204]: found XX files in build
✔  hosting[agent-status-b9204]: file upload complete
i  hosting[agent-status-b9204]: finalizing version...
✔  hosting[agent-status-b9204]: version finalized
i  hosting[agent-status-b9204]: releasing new version...
✔  hosting[agent-status-b9204]: release complete

✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/agent-status-b9204/overview
Hosting URL: https://agent-status-b9204.web.app
```

**Save the Hosting URL!** This is your live application URL.

---

### Step 6: Verify Deployment

Open the Hosting URL in browser:

```
https://agent-status-b9204.web.app
```

**Test these features:**

#### ✅ Login Tests
- [ ] Login as Manager: admin@example.com / adminpass
- [ ] Login as TL: priyanka@mswasth.com / tlpriyanka
- [ ] Login as Agent: agent1@chandan.com / agent1pass

#### ✅ Manager Dashboard
- [ ] All 31 agents display
- [ ] All 4 TLs display with "Team Lead" department
- [ ] Click on agent card → view call logs
- [ ] Download CSV with filters (Daily, Weekly, Monthly, All)
- [ ] CSV includes: Call Type, Call Category, Partner columns
- [ ] "Add New User" button works

#### ✅ TL Dashboard
- [ ] Login as TL
- [ ] "My Team" tab shows assigned agents
- [ ] "Log Calls" tab shows full agent interface
- [ ] Can log calls via Exophone, Manual Lead, Inbound
- [ ] Partner dropdown shows 23 partners
- [ ] Status updates work
- [ ] Call logs save successfully

#### ✅ Agent View
- [ ] Login as agent
- [ ] Status dropdown works (Idle, Busy, Break, Logout)
- [ ] Can log calls in all tabs
- [ ] Partner dropdown populated
- [ ] Call history shows past calls

---

## 🔄 Future Deployments (Quick Reference)

For subsequent deployments after making changes:

```bash
# 1. Build
npm run build

# 2. Deploy
firebase deploy --only hosting

# 3. Done!
# URL: https://agent-status-b9204.web.app
```

**That's it!** Just 2 commands for future updates.

---

## 🐛 Troubleshooting

### Issue 1: "Permission Denied" Errors After Deployment

**Symptom:** App loads but shows permission errors in console

**Solution:**
1. Go to Firebase Console → Firestore Database → Rules
2. Verify rules from `UPDATED_FIRESTORE_RULES.txt` are published
3. Check timestamp shows recent date
4. If old rules, re-publish correct rules

---

### Issue 2: Build Fails with Memory Error

**Symptom:**
```
FATAL ERROR: Reached heap limit Allocation failed
```

**Solution:**
```bash
# Increase Node memory limit
set NODE_OPTIONS=--max_old_space_size=4096
npm run build
```

---

### Issue 3: Firebase Login Fails

**Symptom:** `firebase login` doesn't open browser

**Solution:**
```bash
# Use this alternative command
firebase login --no-localhost
```

Then follow the URL shown in terminal.

---

### Issue 4: Wrong Firebase Project

**Symptom:** Deploying to wrong project

**Solution:**
```bash
# Check current project
firebase use

# Should show: agent-status-b9204

# If wrong, switch to correct project
firebase use agent-status-b9204
```

---

### Issue 5: Deployment Hangs

**Symptom:** `firebase deploy` stuck at "uploading files"

**Solution:**
```bash
# Cancel with Ctrl+C, then retry
firebase deploy --only hosting --debug
```

The `--debug` flag shows more details.

---

### Issue 6: Old Version Still Showing

**Symptom:** Deployed but changes not visible

**Solution:**
1. Hard refresh browser: **Ctrl+Shift+F5**
2. Clear browser cache
3. Try incognito/private window
4. Check Firebase Console → Hosting → Dashboard shows recent deployment

---

## 📊 Deployment Verification Checklist

After deployment, verify:

### Database (Firebase Console)
- [ ] Firestore has all collections
- [ ] Security rules published (check timestamp)
- [ ] 36 total users in Authentication

### Hosting (Firebase Console)
- [ ] Recent deployment shows in Hosting dashboard
- [ ] Deployment time matches current time
- [ ] Domain shows: agent-status-b9204.web.app

### Application (Browser)
- [ ] App loads at hosting URL
- [ ] No console errors
- [ ] All logins work
- [ ] Partner dropdown populated
- [ ] All features functional

---

## 🔒 Security Notes

### Firestore Rules
- ✅ Only authenticated users can access
- ✅ Agents can only read/write their own data
- ✅ TLs can read all agent data (for dashboard)
- ✅ Managers can read all data
- ✅ Partners collection readable by all authenticated users

### Authentication
- All user passwords are hashed by Firebase Auth
- No passwords stored in Firestore
- Session tokens managed by Firebase SDK

---

## 📝 Deployment Log Template

Keep a log of deployments:

```
Date: October 16, 2025
Version: 1.0.0
Deployed By: [Your Name]
Features Added:
  - TL Dashboard with two tabs
  - Inbound call logging
  - 23 microfinance partners
  - Manager can see TL call logs
  - CSV export includes all call types
Changes:
  - Fixed TL call logging
  - Updated partner list
  - Improved error messages
Issues Found: None
Deployment URL: https://agent-status-b9204.web.app
Status: ✅ Successful
```

---

## 🎯 Post-Deployment Tasks

After successful deployment:

1. **Share URL with Team:**
   - Manager: https://agent-status-b9204.web.app
   - Share login credentials securely
   - Provide user guide if needed

2. **Monitor for Issues:**
   - Check Firebase Console → Hosting → Usage
   - Check Firestore usage
   - Monitor for errors in next 24 hours

3. **User Training:**
   - Show managers how to download CSV
   - Show TLs the two-tab interface
   - Show agents how to log inbound calls
   - Demonstrate partner dropdown

4. **Backup Current State:**
   - Export Firestore data (optional)
   - Keep copy of current rules
   - Document any custom configurations

---

## 📞 Support

If deployment fails or issues occur:

1. Check Firebase Console for errors
2. Review browser console for JavaScript errors
3. Verify all pre-deployment steps completed
4. Try deployment in debug mode: `firebase deploy --only hosting --debug`

---

## ✅ Deployment Complete!

Once deployed successfully, your app will be live at:

**🌐 https://agent-status-b9204.web.app**

All features are production-ready:
- ✅ 31 Agents
- ✅ 4 Team Leaders
- ✅ 1 Manager
- ✅ 23 Partners
- ✅ Full call logging system
- ✅ CSV exports
- ✅ Real-time updates

**Good luck with your deployment! 🚀**
