# Testing Guide - Admin Dashboard Changes

## Servers Running ✅

- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:5173

## How to See the Changes

### Step 1: Login as Admin

1. Open your browser and go to: **http://localhost:5173/login**

2. Login with an admin account:
   - If you don't have an admin account, create one at: **http://localhost:5173/signup**
   - Make sure to select "ADMIN" as the role

3. After login, navigate to: **http://localhost:5173/admin/dashboard**

### Step 2: Explore the New Admin Dashboard

You should now see:

#### Left Sidebar (Main Navigation)
- 📞 Branch Contacts
- 🏢 Hospital Branches
- 👨‍🔬 Medical Technician
- 🛏️ Beds
- 🔬 Lab Tests
- 👨‍⚕️ Doctors
- 💊 Medicines
- 📅 Appointments
- 🏥 Departments

#### How It Works:
1. **Click any module** in the left sidebar (e.g., "Departments")
2. A **second sidebar appears** with:
   - 👁️ View
   - ➕ Add

3. **Click "View"** to see all records
4. **Click "Add"** to add new records
   - When in Add mode, you'll see "Cancel" and "Save" buttons

### Step 3: Test Backend APIs (Optional)

If you want to test the backend directly:

#### 1. Login to get JWT token:
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-admin@email.com","pass":"YourPassword123"}'
```

This will return a token like:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...}
}
```

#### 2. Test Department API:
```bash
curl -X GET http://localhost:3000/api/admin/departments \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 3. Test Analytics (Complex Query):
```bash
curl -X GET http://localhost:3000/api/admin/analytics/department-statistics \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## What's New?

### Frontend Changes:
✅ Two-level sidebar navigation
✅ Clean, professional design
✅ View/Add modes for each module
✅ Cancel and Save buttons in Add mode

### Backend Changes:
✅ JWT authentication on all requests
✅ New controllers for:
  - Branch Contacts
  - Hospital Branches
  - Medical Technicians
  - Departments
  - Analytics (5 complex queries)

✅ Transaction control (COMMIT/ROLLBACK) on all DML operations
✅ Database features (triggers, functions, procedures)

## Troubleshooting

### If you see "Access denied" errors:
- Make sure you're logged in as an ADMIN user
- Check that the JWT token is being sent in the Authorization header

### If the sidebar doesn't appear:
- Clear your browser cache
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### If backend APIs fail:
- Check that backend server is running on port 3000
- Verify database connection in backend/.env file

## Next Steps

To fully integrate the backend with frontend:

1. Update Login page to store JWT token in localStorage
2. Add Authorization header to all API calls in frontend/src/services/api.js
3. Create forms for each module (Branch Contacts, Hospital Branches, etc.)
4. Add data tables to display records in View mode
5. Create analytics dashboard pages for complex queries

## Database Features to Test

Run these in your Oracle SQL client:

```sql
-- Test function: Get doctor appointment count
SELECT fn_get_doctor_appointment_count(1) FROM DUAL;

-- Test function: Calculate bed occupancy
SELECT fn_calculate_bed_occupancy(1) FROM DUAL;

-- Test procedure: Book appointment
DECLARE
  v_appointment_id NUMBER;
BEGIN
  sp_book_appointment(1, 1, SYSDATE, 1, 'consultation', v_appointment_id);
  DBMS_OUTPUT.PUT_LINE('Appointment ID: ' || v_appointment_id);
END;
/
```

## Files to Review

- **Frontend**: `frontend/src/pages/AdminDashboard.jsx`
- **Styles**: `frontend/src/styles/AdminDashboard.css`
- **Backend Routes**: `backend/routes/adminRoutes.js`
- **Controllers**: `backend/controllers/` (new files)
- **Database Features**: `backend/database_features.sql`
- **Documentation**: `backend/BACKEND_IMPLEMENTATION_GUIDE.md`
