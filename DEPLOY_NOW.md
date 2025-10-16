# 🚀 Quick Deploy - M-Swasth Agent Call System

**Ready to deploy? Follow these steps in order.**

---

## ⚠️ CRITICAL: Before You Start

### 1. Apply Firestore Rules (MUST DO FIRST!)

**Without this, your deployed app won't work!**

1. Go to: https://console.firebase.google.com/
2. Select: **agent-status-b9204**
3. Click: **Firestore Database** → **Rules** tab
4. Copy contents from: `UPDATED_FIRESTORE_RULES.txt`
5. Paste into Firebase Console (replace all)
6. Click: **"Publish"** button
7. ✅ Done!

---

## 📋 Deployment Commands (Copy & Paste)

Open a **NEW** terminal (don't use the one running npm start) and run these commands one by one:

### Step 1: Build Production Version

```bash
npm run build
```

**Wait for:** "Compiled successfully!" message
**Time:** 2-5 minutes
**Creates:** `build/` folder with optimized files

---

### Step 2: Check Firebase Login

```bash
firebase login
```

**If already logged in:** Skip to Step 3
**If not logged in:** Browser will open, login with Google account

---

### Step 3: Verify Project

```bash
firebase use
```

**Should show:** `agent-status-b9204`
**If wrong project:**
```bash
firebase use agent-status-b9204
```

---

### Step 4: Deploy to Firebase

```bash
firebase deploy --only hosting
```

**Wait for:** "Deploy complete!" message
**Time:** 1-2 minutes
**Result:** Live URL will be shown

---

## ✅ Expected Output

After `firebase deploy --only hosting`, you should see:

```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/agent-status-b9204/overview
Hosting URL: https://agent-status-b9204.web.app
```

**Your app is now live at:** https://agent-status-b9204.web.app

---

## 🧪 Test Your Deployment

Open https://agent-status-b9204.web.app and test:

### Test 1: Manager Login
- Email: `admin@example.com`
- Password: `adminpass`
- Should see: All 31 agents + 4 TLs
- Download CSV to verify

### Test 2: TL Login
- Email: `priyanka@mswasth.com`
- Password: `tlpriyanka`
- Should see: Two tabs (My Team + Log Calls)
- Check partner dropdown has 23 partners

### Test 3: Agent Login
- Email: `agent1@chandan.com`
- Password: `agent1pass`
- Should see: Agent view with all tabs
- Try logging an inbound call

---

## 🐛 Common Issues

### Issue: "Permission denied" errors
**Solution:** Go back and apply Firestore rules (see top of this file)

### Issue: Build fails
**Solution:**
```bash
# Increase memory
set NODE_OPTIONS=--max_old_space_size=4096
npm run build
```

### Issue: Old version showing
**Solution:** Hard refresh browser with Ctrl+Shift+F5

### Issue: Firebase not installed
**Solution:**
```bash
npm install -g firebase-tools
firebase login
```

---

## 🎯 After Deployment

1. **Share the URL** with your team:
   - Production URL: https://agent-status-b9204.web.app

2. **Provide credentials** securely:
   - Manager: admin@example.com
   - TL credentials (4 TLs)
   - Agent credentials (31 agents)

3. **Monitor usage:**
   - Check Firebase Console → Hosting → Usage
   - Check for any errors in console

---

## 🔄 Future Updates

When you make code changes and want to deploy again:

```bash
# 1. Build
npm run build

# 2. Deploy
firebase deploy --only hosting

# Done!
```

**That's it!** Just 2 commands.

---

## 📞 Need Help?

If deployment fails:
1. Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed troubleshooting
2. Run with debug: `firebase deploy --only hosting --debug`
3. Check Firebase Console for errors

---

## ✅ Deployment Checklist

- [ ] Firestore rules published in Firebase Console
- [ ] Build completed successfully (`npm run build`)
- [ ] Logged into Firebase CLI (`firebase login`)
- [ ] Correct project selected (`firebase use`)
- [ ] Deployment completed (`firebase deploy --only hosting`)
- [ ] Tested at https://agent-status-b9204.web.app
- [ ] Manager login works
- [ ] TL login works
- [ ] Agent login works
- [ ] Partner dropdown populated
- [ ] CSV download works

---

**Ready? Let's deploy! 🚀**

Start with Step 1: `npm run build`
