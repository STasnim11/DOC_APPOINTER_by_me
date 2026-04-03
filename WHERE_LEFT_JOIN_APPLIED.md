# Where LEFT JOIN Was Applied

## I changed 3 backend files:

---

## 1. `backend/controllers/doctorAppointments.js`

**Line 36-50** (approximately)

### BEFORE (WRONG):
```javascript
const appointmentsResult = await connection.execute(
  `SELECT
      da.ID as APPOINTMENT_ID,
      da.APPOINTMENT_DATE,
      da.STATUS,
      da.TYPE,
      ts.START_TIME,
      ts.END_TIME,
      pu.NAME as PATIENT_NAME,
      pu.EMAIL as PATIENT_EMAIL,
      pu.PHONE as PATIENT_PHONE,
      p.ID as PRESCRIPTION_ID
   FROM DOCTORS_APPOINTMENTS da
   JOIN TIME_SLOTS ts ON da.TIME_SLOT_ID = ts.ID  ❌ INNER JOIN
   JOIN PATIENT pat ON da.PATIENT_ID = pat.ID
   JOIN USERS pu ON pat.USER_ID = pu.ID
   LEFT JOIN PRESCRIPTION p ON da.ID = p.APPOINTMENT_ID
   WHERE da.DOCTOR_ID = :doctorId
   ORDER BY da.APPOINTMENT_DATE DESC, ts.START_TIME DESC`,
  { doctorId }
);
```

### AFTER (CORRECT):
```javascript
const appointmentsResult = await connection.execute(
  `SELECT
      da.ID as APPOINTMENT_ID,
      da.APPOINTMENT_DATE,
      da.STATUS,
      da.TYPE,
      ts.START_TIME,
      ts.END_TIME,
      pu.NAME as PATIENT_NAME,
      pu.EMAIL as PATIENT_EMAIL,
      pu.PHONE as PATIENT_PHONE,
      p.ID as PRESCRIPTION_ID
   FROM DOCTORS_APPOINTMENTS da
   LEFT JOIN TIME_SLOTS ts ON da.TIME_SLOT_ID = ts.ID  ✅ LEFT JOIN
   JOIN PATIENT pat ON da.PATIENT_ID = pat.ID
   JOIN USERS pu ON pat.USER_ID = pu.ID
   LEFT JOIN PRESCRIPTION p ON da.ID = p.APPOINTMENT_ID
   WHERE da.DOCTOR_ID = :doctorId
   ORDER BY da.APPOINTMENT_DATE DESC, ts.START_TIME DESC`,
  { doctorId }
);
```

**This is used by:** Doctor Dashboard - Appointments tab

---

## 2. `backend/controllers/doctorProfileUpdate.js`

**Line 95-105** (approximately)

### BEFORE (WRONG):
```javascript
const appointmentsResult = await connection.execute(
  `SELECT da.ID, da.APPOINTMENT_DATE, da.STATUS, da.TYPE,
          ts.START_TIME, ts.END_TIME, pu.NAME as PATIENT_NAME, pu.PHONE as PATIENT_PHONE, pu.EMAIL as PATIENT_EMAIL
   FROM DOCTORS_APPOINTMENTS da
   JOIN TIME_SLOTS ts ON da.TIME_SLOT_ID = ts.ID  ❌ INNER JOIN
   JOIN PATIENT p ON da.PATIENT_ID = p.ID
   JOIN USERS pu ON p.USER_ID = pu.ID
   WHERE da.DOCTOR_ID = :doctorId
   ORDER BY da.APPOINTMENT_DATE DESC`,
  { doctorId }
);
```

### AFTER (CORRECT):
```javascript
const appointmentsResult = await connection.execute(
  `SELECT da.ID, da.APPOINTMENT_DATE, da.STATUS, da.TYPE,
          ts.START_TIME, ts.END_TIME, pu.NAME as PATIENT_NAME, pu.PHONE as PATIENT_PHONE, pu.EMAIL as PATIENT_EMAIL
   FROM DOCTORS_APPOINTMENTS da
   LEFT JOIN TIME_SLOTS ts ON da.TIME_SLOT_ID = ts.ID  ✅ LEFT JOIN
   JOIN PATIENT p ON da.PATIENT_ID = p.ID
   JOIN USERS pu ON p.USER_ID = pu.ID
   WHERE da.DOCTOR_ID = :doctorId
   ORDER BY da.APPOINTMENT_DATE DESC`,
  { doctorId }
);
```

**This is used by:** Doctor Profile page - GET /api/doctor/profile/:email

---

## 3. `backend/controllers/patientAppointments.js`

**Line 55-70** (approximately)

### BEFORE (WRONG):
```javascript
const appointmentResult = await connection.execute(
  `SELECT
      da.ID,
      da.APPOINTMENT_DATE,
      da.STATUS,
      da.TYPE,
      ts.START_TIME,
      ts.END_TIME,
      du.NAME,
      du.EMAIL
   FROM DOCTORS_APPOINTMENTS da
   JOIN TIME_SLOTS ts  ❌ INNER JOIN
     ON da.TIME_SLOT_ID = ts.ID
   JOIN DOCTOR d
     ON da.DOCTOR_ID = d.ID
   JOIN USERS du
     ON d.USER_ID = du.ID
   WHERE da.PATIENT_ID = :patientId
   ORDER BY da.APPOINTMENT_DATE DESC, ts.START_TIME ASC`,
  { patientId }
);
```

### AFTER (CORRECT):
```javascript
const appointmentResult = await connection.execute(
  `SELECT
      da.ID,
      da.APPOINTMENT_DATE,
      da.STATUS,
      da.TYPE,
      ts.START_TIME,
      ts.END_TIME,
      du.NAME,
      du.EMAIL
   FROM DOCTORS_APPOINTMENTS da
   LEFT JOIN TIME_SLOTS ts  ✅ LEFT JOIN
     ON da.TIME_SLOT_ID = ts.ID
   JOIN DOCTOR d
     ON da.DOCTOR_ID = d.ID
   JOIN USERS du
     ON d.USER_ID = du.ID
   WHERE da.PATIENT_ID = :patientId
   ORDER BY da.APPOINTMENT_DATE DESC, ts.START_TIME ASC`,
  { patientId }
);
```

**This is used by:** Patient Dashboard - GET /api/patient/:email/appointments

---

## HOW TO VERIFY THE FIX

### Step 1: Check the files
Open these 3 files and search for "LEFT JOIN TIME_SLOTS":
- `backend/controllers/doctorAppointments.js`
- `backend/controllers/doctorProfileUpdate.js`
- `backend/controllers/patientAppointments.js`

You should find "LEFT JOIN TIME_SLOTS" in each file.

### Step 2: Restart backend server
```bash
cd backend
# Stop server (Ctrl+C)
node server.js
```

### Step 3: Test with SQL
Run the queries in `SIMPLE_CHECK_DOE.sql` to see:
1. Doctor ID for doe@gmail.com
2. Time slots for that doctor
3. Appointments with LEFT JOIN (should show all)

### Step 4: Test the actual issue
1. Log in as doe@gmail.com (doctor)
2. Go to Availability tab
3. Set schedule (e.g., Monday-Friday)
4. Save
5. Book an appointment (as a patient)
6. Log back in as doctor
7. Change schedule (e.g., remove Friday)
8. Save
9. Check Appointments tab - appointment should still show!

---

## SQL QUERY TO TEST DIRECTLY

Replace `3` with your actual DOCTOR_ID:

```sql
-- This is what the backend now runs:
SELECT
    da.ID as APPOINTMENT_ID,
    da.APPOINTMENT_DATE,
    da.STATUS,
    da.TYPE,
    ts.START_TIME,
    ts.END_TIME,
    pu.NAME as PATIENT_NAME,
    pu.EMAIL as PATIENT_EMAIL,
    pu.PHONE as PATIENT_PHONE
FROM DOCTORS_APPOINTMENTS da
LEFT JOIN TIME_SLOTS ts ON da.TIME_SLOT_ID = ts.ID
JOIN PATIENT pat ON da.PATIENT_ID = pat.ID
JOIN USERS pu ON pat.USER_ID = pu.ID
WHERE da.DOCTOR_ID = 3
ORDER BY da.APPOINTMENT_DATE DESC;
```

**Expected result:**
- Shows ALL appointments
- If TIME_SLOT_ID is NULL or references deleted slot, START_TIME and END_TIME will be NULL
- But appointment row still appears!

---

## IF IT STILL DOESN'T WORK

Check these:

1. **Did you restart backend server?**
   - Changes only apply after restart

2. **Is foreign key constraint fixed?**
   ```sql
   SELECT constraint_name, delete_rule, status
   FROM user_constraints
   WHERE constraint_name = 'FK_DOCTOR_APPOINTMENT_TIMESLOT';
   ```
   Should show: `DELETE_RULE = 'SET NULL'`

3. **Are there actually appointments?**
   ```sql
   SELECT COUNT(*) FROM DOCTORS_APPOINTMENTS 
   WHERE DOCTOR_ID = 3;
   ```

4. **Check backend logs**
   - When you load appointments, backend should log the query
   - Look for "LEFT JOIN TIME_SLOTS" in the logs

---

## SUMMARY

✅ Changed `JOIN TIME_SLOTS` to `LEFT JOIN TIME_SLOTS` in 3 files
✅ This allows appointments to show even if their time slot is deleted
✅ Works with foreign key constraint `ON DELETE SET NULL`
✅ Restart backend server to apply changes
✅ Use SQL queries in `SIMPLE_CHECK_DOE.sql` to verify
