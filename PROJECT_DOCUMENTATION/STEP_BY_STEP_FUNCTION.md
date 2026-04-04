# 🎯 Step-by-Step: Create Your First SQL Function

## Step 1: Open SQL*Plus

```bash
sqlplus APP/your_password@localhost:1521/XE
```

## Step 2: Run the Function Creation Script

```sql
@sql/CREATE_FUNCTION_APPOINTMENT_COUNT.sql
```

## Step 3: Expected Output

You should see:
```
PL/SQL procedure successfully completed.

Function created.

STATUS
------------------------------------------
Checking if function was created...

OBJECT_NAME                    OBJECT_TYPE         STATUS
------------------------------ ------------------- -------
FN_GET_DOCTOR_APPOINTMENT_COUNT FUNCTION           VALID

TEST
------------------------------------------
Testing function with doctor ID 1...

APPOINTMENT_COUNT
-----------------
              5

RESULT
------------------------------------------
✅ Function created and tested successfully!
```

## Step 4: Restart Backend Server

```bash
cd backend
npm start
```

## Step 5: Test in Application

1. Login as a doctor
2. Go to Doctor Dashboard
3. Look at the top right - you should see TWO badges:
   - 📊 Today's Patients: X
   - 📈 Total Appointments: Y  ← This uses the function!

## 🔍 How to Verify It's Working

### Check Backend Console
When the Doctor Dashboard loads, you should see in backend console:
```
Fetching appointment count for doctor ID: 2
```

### Check Database
```sql
-- See the function
SELECT object_name, status 
FROM user_objects 
WHERE object_name = 'FN_GET_DOCTOR_APPOINTMENT_COUNT';

-- Test it manually
SELECT fn_get_doctor_appointment_count(1) FROM DUAL;
SELECT fn_get_doctor_appointment_count(2) FROM DUAL;
```

### Check Frontend
Open browser console (F12) and look for:
```
Fetching total appointments for doctor: 2
```

## 📁 Files Involved

### SQL File
- `sql/CREATE_FUNCTION_APPOINTMENT_COUNT.sql` - Creates the function

### Backend
- `backend/controllers/databaseFeaturesController.js` - Line 4-24
  - Function: `getDoctorAppointmentCount()`
  - Executes: `SELECT fn_get_doctor_appointment_count(:doctorId) FROM DUAL`

### Frontend
- `frontend/src/pages/DoctorDashboard.jsx` - Line 210
  - Function: `fetchTotalAppointments()`
  - API Call: `/api/admin/db-features/doctor/:doctorId/appointments`

## ❌ If You Get Errors

### Error: "insufficient privileges"
```sql
-- Connect as SYSDBA
sqlplus sys/your_password@localhost:1521/XE as sysdba

-- Grant permission
GRANT CREATE PROCEDURE TO APP;

-- Reconnect as APP and try again
```

### Error: "function already exists"
The script handles this automatically with DROP FUNCTION at the start.

### Error: "table or view does not exist"
Check table name:
```sql
SELECT table_name FROM user_tables WHERE table_name LIKE '%APPOINTMENT%';
```

## ✅ Success Indicators

1. SQL*Plus shows "Function created." with no errors
2. Backend starts without errors
3. Doctor Dashboard shows purple badge with total appointments
4. Number in badge matches actual appointment count in database

## 🎉 What This Proves

You're using a SQL function in your project! This function:
- Lives in the database (not in application code)
- Can be called from any SQL query
- Returns the total appointment count for any doctor
- Is displayed in the Doctor Dashboard UI

This satisfies the requirement to use SQL functions in your project.
