# Quick Start Guide - What to Do Next

## Step 1: Run SQL Updates
Open your Oracle SQL client and run:
```bash
@backend/COMPLETE_TABLE_FIXES.sql
```

This will:
- Add NAME, EMAIL, PHONE columns to MEDICAL_TECHNICIAN table
- Add check constraint for experience years >= 0
- Add unique constraint for hospital branches
- Show verification queries

## Step 2: Test the Application

### Start Backend:
```bash
cd backend
npm start
```

### Start Frontend:
```bash
cd frontend
npm run dev
```

## Step 3: Test Features

### Medical Technician:
1. Go to Admin Dashboard → Medical Technician → Add
2. Try adding with negative experience years → Should show error
3. Add with valid data (experience >= 0) → Should succeed
4. View list → Should show Name, Email, Phone columns
5. Click Edit button → Form should populate
6. Click Delete button → Should show confirmation and delete

### Departments:
1. Go to Admin Dashboard → Departments → View
2. Click Delete button on any department → Should work

### All Other Modules:
1. Test Edit and Delete buttons on:
   - Hospital Branches
   - Branch Contacts
   - Beds
   - Medicines
   - Lab Tests

## What Was Fixed:

✅ Experience years must be >= 0 (validated on frontend and backend)
✅ Medical technician table shows Name, Email, Phone
✅ Delete works for departments
✅ Edit and Delete buttons added to all tables
✅ All backend controllers have proper validation

## If You See Errors:

### "Column already exists"
- Safe to ignore - means you already added the columns

### "Constraint already exists"
- Safe to ignore - means constraint is already there

### "Please login again"
- Clear browser localStorage and login again
- Or visit: http://localhost:5173/clear

### "Failed to delete"
- Check if there are foreign key constraints
- Some records can't be deleted if they're referenced by other tables
