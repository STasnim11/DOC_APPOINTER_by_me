# 📍 Function 2: Patient Total Expenses - All Code Locations

## ✅ Status: CREATED

---

## 1️⃣ SQL FUNCTION (Database)
**Status**: ✅ Created in database

```sql
CREATE OR REPLACE FUNCTION fn_get_patient_total_expenses(
  p_patient_id IN NUMBER
) RETURN NUMBER
IS
  v_total_expenses NUMBER := 0;
BEGIN
  SELECT NVL(SUM(b.TOTAL_AMOUNT), 0)
  INTO v_total_expenses
  FROM BILLS b
  INNER JOIN DOCTORS_APPOINTMENTS da ON b.APPOINTMENT_ID = da.ID
  WHERE da.PATIENT_ID = p_patient_id;
  
  RETURN v_total_expenses;
END;
/
```

---

## 2️⃣ BACKEND CONTROLLER
**File**: `backend/controllers/databaseFeaturesController.js`
**Lines**: 52-68

This function calls the SQL function and returns the result as JSON.

---

## 3️⃣ BACKEND ROUTE
**File**: `backend/routes/adminRoutes.js`
**Line**: 56

```javascript
router.get('/db-features/patient/:patientId/expenses', databaseFeaturesController.getPatientTotalExpenses);
```

**Full URL**: `http://localhost:3000/api/admin/db-features/patient/8/expenses`

---

## 4️⃣ USED IN ANALYTICS
**File**: `backend/controllers/databaseFeaturesController.js`
**Function**: `getDatabaseFeaturesStats` (lines 180-240)

This function is called when loading the Admin Analytics page. It gets all patients with their total expenses.

---

## 5️⃣ FRONTEND DISPLAY
**File**: `frontend/src/pages/AdminDashboard.jsx`
**Section**: Analytics module (lines ~940-970)

Shows table: "💰 Top Patients by Total Expenses"

---

## 🎯 How to See It Working

1. **Login as Admin**
2. **Click "📊 Analytics & Reports"** in sidebar
3. **Scroll to bottom** - see "💰 Top Patients by Total Expenses" table
4. **Table shows**: Patient ID, Patient Name, Total Expenses

---

## 📊 Test Query

```sql
-- See all patients with expenses
SELECT 
  p.ID,
  u.NAME,
  fn_get_patient_total_expenses(p.ID) as TOTAL_EXPENSES
FROM PATIENT p
INNER JOIN USERS u ON p.USER_ID = u.ID
WHERE fn_get_patient_total_expenses(p.ID) > 0
ORDER BY TOTAL_EXPENSES DESC;
```

---

## ✅ Summary

**Function 1**: `fn_get_doctor_appointment_count` ✅
- Shows in: Doctor Dashboard (purple badge)
- File: `frontend/src/pages/DoctorDashboard.jsx`

**Function 2**: `fn_get_patient_total_expenses` ✅
- Shows in: Admin Analytics page
- File: `frontend/src/pages/AdminDashboard.jsx`

**Function 3**: `fn_calculate_bed_occupancy` ⏳
- Not created yet
- Will show in: Admin Analytics page (ward occupancy table)
