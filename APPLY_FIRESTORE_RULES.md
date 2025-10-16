# How to Apply Updated Firestore Rules

## Issue Fixed
The updated rules now allow **Team Leaders** to read all agent collections (agent1-agent31) so they can view their team members' data on the TL Dashboard.

## Steps to Apply Rules in Firebase Console

### Step 1: Open Firebase Console
1. Go to https://console.firebase.google.com/
2. Select your project: **agent-status-b9204**

### Step 2: Navigate to Firestore Rules
1. In the left sidebar, click **Firestore Database**
2. Click on the **Rules** tab at the top

### Step 3: Copy the New Rules
Open the file `UPDATED_FIRESTORE_RULES.txt` in this project and copy ALL the contents.

### Step 4: Replace Existing Rules
1. In the Firebase Console Rules editor, **select all existing text** (Ctrl+A)
2. **Delete** the existing rules
3. **Paste** the new rules from `UPDATED_FIRESTORE_RULES.txt`

### Step 5: Publish the Rules
1. Click the **Publish** button at the top right
2. Wait for the confirmation message

### Step 6: Test the TL Dashboard
1. Go back to your app: http://localhost:3000
2. **Logout** if you're already logged in
3. Login as a Team Leader (e.g., priyanka@mswasth.com / tlpriyanka)
4. You should now see your team members without permission errors!

---

## What Changed in the Rules?

### Before (Line 46-48):
```javascript
allow read, write: if request.auth != null &&
                   agentCollection.matches('^agent[0-9]+$') &&
                   request.auth.uid == userId;
```
**Problem:** Only the agent themselves could read their data. Team Leaders couldn't access agent collections.

### After (Line 49-53):
```javascript
allow read: if request.auth != null &&
               agentCollection.matches('^agent[0-9]+$') &&
               (request.auth.uid == userId ||
                exists(/databases/$(database)/documents/mswasth/$(request.auth.uid)) ||
                exists(/databases/$(database)/documents/admin/$(request.auth.uid)));
```
**Solution:** Now allows:
1. ✅ The agent themselves
2. ✅ **Any Team Leader** (exists in mswasth collection)
3. ✅ **Any Manager** (exists in admin collection)

---

## Security Notes

The new rules are still secure:
- ✅ Only authenticated users can access data
- ✅ Agents can only **write** to their own documents
- ✅ Team Leaders can **read** all agents (needed for dashboard) but cannot modify agent data
- ✅ Managers have full read access via the fallback rule (line 78-80)
- ✅ Call logs can be read by TLs/Managers but only written by the agent themselves

---

## If You Get Errors After Publishing

If you still see permission errors:
1. **Hard refresh** your browser (Ctrl+Shift+R or Cmd+Shift+R)
2. **Logout** and login again
3. Check the **browser console** for any new error messages
4. Verify the rules were published correctly in Firebase Console

---

## Quick Test

After applying the rules, test with these credentials:

**Team Leader Login:**
- Email: priyanka@mswasth.com
- Password: tlpriyanka
- Expected Result: Should see 6 team members (Chandan, Ankit, Poonam, Richa Singh, Anamika, Shani Pandey)

**Manager Login:**
- Email: admin@example.com
- Password: adminpass
- Expected Result: Should see all 31 agents

---

**After applying these rules, the TL Dashboard should work without any permission errors!**
