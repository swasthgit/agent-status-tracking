# How to Upload Partners to Firestore

## Method: Using the Web Interface (Recommended)

I've created a special page in your application that will upload all 23 partners to Firestore.

### Steps:

1. **Start the application** (if not already running):
   ```bash
   npm start
   ```

2. **Login as Manager**:
   - Go to `http://localhost:3000`
   - Login with your manager credentials (admin@example.com)

3. **Navigate to the Upload Partners page**:
   - Manually go to: `http://localhost:3000/upload-partners`
   - Or you can add a button/link in the Manager Dashboard to navigate there

4. **Click "Start Upload"**:
   - The page will upload all 23 partners one by one
   - You'll see a progress bar and real-time results
   - Each partner will show ✅ when successfully uploaded

5. **Verify**:
   - The page will show total partners in database after upload
   - You can check Firestore console to see the new `partners` collection

### What Gets Uploaded:

Each partner document will have:
- `name`: Partner organization name (e.g., "PBGB", "Navchetna South", etc.)
- `createdAt`: Timestamp when created
- `active`: true (for future filtering if needed)

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

### After Upload:

- The Partner dropdown will automatically work in:
  - Manual Leads form
  - Inbound Calls form
- Partners will be displayed alphabetically in the dropdown
- The data will be included in CSV exports

### Troubleshooting:

- **Permission Error**: Make sure you're logged in as a manager
- **Already Uploaded**: If partners are already in the database, this will create duplicates. You may want to delete the collection first if re-uploading
- **Network Error**: Check your internet connection and Firebase project status

---

## Files Created:

1. **src/components/UploadPartners.js** - The upload page component
2. **upload-partners.js** - Node.js script (not used due to permissions, but kept for reference)

## Next Steps:

After uploading, test the Partner dropdown in:
1. Manual Leads → Enter client number → Fill form → Check Partner dropdown
2. Inbound Calls → Enter client number → Fill form → Check Partner dropdown
3. Manager Dashboard → Download CSV → Verify Partner column is included
