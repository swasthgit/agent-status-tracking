# Team Lead (TL) and Partners Setup Guide

## Overview

This document explains how to set up Team Leads, their agents, and upload partner organizations to your M-Swasth application.

---

## 📋 Table of Contents

1. [Upload Partners](#1-upload-partners)
2. [Create Team Leads and Agents](#2-create-team-leads-and-agents)
3. [TL Features](#3-tl-features)
4. [Architecture Changes](#4-architecture-changes)
5. [Testing](#5-testing)

---

## 1. Upload Partners

### What are Partners?
Partners are the organizations (like PBGB, Navchetna South, TATA North, etc.) that agents/TLs select when logging calls.

### How to Upload

**Step 1:** Login as Manager
- Go to `http://localhost:3000`
- Login with manager credentials (e.g., admin@example.com)

**Step 2:** Navigate to Upload Partners Page
- Go to: `http://localhost:3000/upload-partners`
- Or add a navigation button in your Manager Dashboard

**Step 3:** Click "Start Upload"
- The page will upload all 23 partners automatically
- You'll see real-time progress with ✅ for each successful upload
- Total count will be displayed after completion

### Partners List (23 total):
1. PBGB
2. Navchetna South
3. PAFT South
4. Sugamya South
5. Swarnodhayam South
6. Satya North
7. Satya South
8. Seba
9. Namra
10. Muthoot South
11. Muthoot North
12. Pahal North
13. Pahal South
14. TATA North
15. TATA South
16. Humana
17. Uttrayan
18. Bangia
19. ESAF South
20. ESAF North
21. UKBGB
22. UBGB
23. Cashpor

### Verification
After upload, partners will automatically appear in:
- ✅ Manual Leads form (Partner dropdown)
- ✅ Inbound Calls form (Partner dropdown)
- ✅ CSV exports (Partner column)

---

## 2. Create Team Leads and Agents

### Prerequisites
You need the **Firebase Admin SDK** service account key file.

**If you don't have it:**
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save it as `serviceAccountKey.json` in the `firebase-admin` folder

### User Creation Script

**File**: `firebase-admin/createTLsAndAgents.js`

### Step-by-Step Instructions

**Step 1:** Make sure you have the service account key
```bash
# The file should be at:
# firebase-admin/serviceAccountKey.json
```

**Step 2:** Review the user data in `createTLsAndAgents.js`
- Currently configured with 1 TL (Priyanka Mishra) and 6 agents
- Based on your CSV file structure

**Step 3:** Run the creation script
```bash
cd firebase-admin
node createTLsAndAgents.js
```

**Step 4:** Verify
The script will:
- Create Firebase Auth users for TL and agents
- Create Firestore documents in `mswasth` collection
- Link agents to their TL
- Display success messages for each user

### Default Credentials Created

**Team Lead:**
- Email: priyanka.mishra@mswasth.com
- Password: TL@01610
- Role: teamlead
- ID: MS01610

**Agents:**
1. richa.singh@mswasth.com / RE@00489
2. poonam@mswasth.com / RE@00694
3. shani.pandey@mswasth.com / RE@00520
4. anamika@mswasth.com / RE@00574
5. chandan.singh@mswasth.com / RE@00209
6. ankit@mswasth.com / RE@00164

### Adding More Teams

To add more teams, edit `firebase-admin/createTLsAndAgents.js`:

```javascript
const teams = [
  {
    tl: {
      name: "TL Name",
      email: "tl.name@mswasth.com",
      password: "TL@ID",
      id: "MSXXXXX",
      mobile: "1234567890",
      role: "teamlead",
      designation: "TL"
    },
    agents: [
      {
        name: "Agent Name",
        email: "agent.name@mswasth.com",
        password: "RE@ID",
        id: "MSXXXXX",
        mobile: "1234567890",
        role: "agent",
        designation: "RE"
      },
      // Add more agents...
    ]
  },
  // Add more teams...
];
```

---

## 3. TL Features

### TL Dashboard (`/tl-dashboard`)

**What TLs Can See:**
- Total team members count
- Active team members (currently online)
- Team members on call
- List of all team members with their status
- Click on any team member to view their call details

**Statistics Cards:**
- Total Team Members
- Active Now (Idle/On Call/Busy status)
- On Call (currently making calls)

### TL View (`/tl-view`)

Team Leads can also log calls like agents:
- Access all call logging features
- Manual Leads
- ExoPhones (Assigned Calls)
- Inbound Calls
- Same interface as agents

### TL Agent Details (`/tl/agent-details/:collectionName/:agentId`)

TLs can view details of their team members:
- Same view as Manager Dashboard agent details
- But only for agents in their team
- Download CSV for specific agent
- View call history
- Apply filters (Daily, Weekly, Monthly, All)

---

## 4. Architecture Changes

### New Collections

**`mswasth` Collection:**
- Stores TL and new agent data
- Structure:
  ```
  mswasth/
    {uid}/
      name: string
      email: string
      id: string (MS ID)
      mobile: string
      role: "teamlead" | "agent"
      designation: "TL" | "RE"
      status: string
      teamLeadId: string (for agents)
      teamLeadName: string (for agents)
      teamMembers: array (for TLs)
      teamSize: number (for TLs)
      createdAt: timestamp
  ```

**`partners` Collection:**
- Stores partner organizations
- Structure:
  ```
  partners/
    {auto-id}/
      name: string
      createdAt: timestamp
      active: boolean
  ```

### Auth Flow Updates

**Dual Collection Check:**
1. First checks `mswasth` collection (for TLs and new agents)
2. Falls back to email-based collections (for existing managers/agents)
3. Supports backward compatibility

### New Routes

**Team Lead Routes:**
- `/tl-dashboard` - TL Dashboard
- `/tl-view` - TL's own call logging view
- `/tl/agent-details/:collectionName/:agentId` - View team member details

**Partner Route:**
- `/upload-partners` - Upload partner organizations

### Role-Based Access Control

- **Managers**: Can access all existing features
- **Team Leads**: Can only see their own team members
- **Agents**: Standard agent features
- All routes are protected and role-validated

---

## 5. Testing

### Test Checklist

**Partners Upload:**
- [ ] Login as manager
- [ ] Navigate to `/upload-partners`
- [ ] Click "Start Upload"
- [ ] Verify all 23 partners uploaded successfully
- [ ] Check Partner dropdown in Manual Leads form
- [ ] Check Partner dropdown in Inbound Calls form
- [ ] Download CSV and verify Partner column

**TL Creation:**
- [ ] Run `createTLsAndAgents.js` script
- [ ] Verify no errors in console
- [ ] Check Firebase Console → Authentication (6 agents + 1 TL created)
- [ ] Check Firebase Console → Firestore → `mswasth` collection

**TL Login:**
- [ ] Logout if logged in
- [ ] Login with TL credentials (priyanka.mishra@mswasth.com / TL@01610)
- [ ] Should redirect to `/tl-dashboard`
- [ ] Verify dashboard shows 6 team members
- [ ] Click on a team member → should show their details

**TL Call Logging:**
- [ ] Navigate to `/tl-view` (or add navigation)
- [ ] Try logging a Manual Lead
- [ ] Try logging an Inbound Call
- [ ] Verify Partner dropdown works
- [ ] Verify calls are saved properly

**Agent Login (New Agents):**
- [ ] Login with agent credentials (e.g., richa.singh@mswasth.com / RE@00489)
- [ ] Should redirect to `/agent-view`
- [ ] Verify all agent features work
- [ ] Check Partner dropdown in forms

---

## 6. Important Notes

### Security
- Keep `serviceAccountKey.json` secure
- Add it to `.gitignore`
- Never commit it to version control
- The file is for server-side use only

### Data Structure
- TLs and agents are in `mswasth` collection
- Each agent has `teamLeadId` linking to their TL
- Each TL has `teamMembers` array with agent UIDs
- Backward compatible with existing agent/manager collections

### CSV File
Your CSV file shows the same TL repeated 4 times with the same team members but different phone numbers. This appears to be test data. The script currently creates 1 team. If you have multiple different TLs, please provide the correct data, and I can update the script.

### Email Domains
All new users are created with `@mswasth.com` domain. If you want a different domain, update the email addresses in `createTLsAndAgents.js`.

---

## 7. Troubleshooting

### Partners Not Showing in Dropdown
**Solution**: Navigate to `/upload-partners` and click "Start Upload"

### Service Account Key Error
**Solution**: Download the key from Firebase Console and place it in `firebase-admin/serviceAccountKey.json`

### TL Can't Login
**Solution**:
1. Verify the user was created (check Firebase Console → Authentication)
2. Check the user document exists in `mswasth` collection
3. Verify the role is set to "teamlead"

### Permission Errors
**Solution**: Make sure you're logged in with appropriate credentials before accessing protected routes

---

## 8. Next Steps

1. **Upload Partners**: Login as manager and go to `/upload-partners`
2. **Create Users**: Place service account key and run `node createTLsAndAgents.js`
3. **Test TL Features**: Login with TL credentials and explore the dashboard
4. **Add Navigation**: Add buttons/links to navigate between TL Dashboard and TL View
5. **Customize**: Update the team structure in `createTLsAndAgents.js` based on your actual team data

---

## Need Help?

If you encounter issues:
1. Check browser console for errors
2. Check Firebase Console for auth and Firestore data
3. Verify all files compiled without errors
4. Review the architecture changes section

---

**Created**: 2025-10-15
**Version**: 1.0
