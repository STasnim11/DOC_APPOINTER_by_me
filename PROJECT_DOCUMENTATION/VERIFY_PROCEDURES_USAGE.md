# How to Verify Stored Procedures Are Being Used

## Method 1: Check Backend Console Logs (Easiest)

### Step 1: Add console logs to see procedure calls

Add this to `backend/controllers/appointmentController.js` (line ~108):

```javascript
const patientId = patientResult.rows[0][0];

// ✅ USE STORED PROCEDURE: sp_book_appointment
console.log('🔧 CALLING STORED PROCEDURE: sp_book_appointment');
console.log('📝 Parameters:', { patientId, doctorId, appointmentDate, timeSlotId, type });

const result = await connection.execute(
  `BEGIN
     sp_book_appointment(
       :patientId, 
       :doctorId, 
       TO_DATE(:appointmentDate, 'YYYY-MM-DD'),
       :timeSlotId, 
       :appointmentType, 
       :appointmentId
     );
   END;`,
  // ... rest of code
);

console.log('✅ PROCEDURE RETURNED APPOINTMENT ID:', result.outBinds.appointmentId);
```

### Step 2: Book an appointment

Watch your backend terminal. You should see:
```
🔧 CALLING STORED PROCEDURE: sp_book_appointment
📝 Parameters: { patientId: 5, doctorId: 2, appointmentDate: '2024-01-15', timeSlotId: 10, type: 'General' }
✅ PROCEDURE RETURNED APPOINTMENT ID: 123
```

---

## Method 2: Check Database Logs (Oracle)

### In SQL*Plus or SQL Developer, run:

```sql
-- Enable auditing for procedure calls
AUDIT EXECUTE ON sp_book_appointment BY ACCESS;

-- After booking an appointment, check audit trail
SELECT username, timestamp, obj_name, action_name
FROM dba_audit_trail
WHERE obj_name = 'SP_BOOK_APPOINTMENT'
ORDER BY timestamp DESC;
```

---

## Method 3: Add Logging Inside the Procedure

### Modify the procedure to log its execution:

```sql
CREATE OR REPLACE PROCEDURE sp_book_appointment(
  p_patient_id IN NUMBER,
  p_doctor_id IN NUMBER,
  p_appointment_date IN DATE,
  p_time_slot_id IN NUMBER,
  p_appointment_type IN VARCHAR2,
  p_appointment_id OUT NUMBER
)
IS
  v_slot_status VARCHAR2(50);
  v_slot_doctor_id NUMBER;
  v_existing_count NUMBER;
  v_start_time VARCHAR2(10);
  v_end_time VARCHAR2(10);
BEGIN
  -- ✅ ADD THIS: Log procedure execution
  DBMS_OUTPUT.PUT_LINE('🔧 sp_book_appointment CALLED');
  DBMS_OUTPUT.PUT_LINE('Patient ID: ' || p_patient_id);
  DBMS_OUTPUT.PUT_LINE('Doctor ID: ' || p_doctor_id);
  
  -- ... rest of procedure code ...
  
  -- ✅ ADD THIS: Log success
  DBMS_OUTPUT.PUT_LINE('✅ Appointment created with ID: ' || p_appointment_id);
END;
/
```

Then in SQL*Plus:
```sql
SET SERVEROUTPUT ON;
-- Now book an appointment and you'll see the logs
```

---

## Method 4: Check the Code (Quick Visual Check)

### Look for this pattern in your code:

**✅ USING PROCEDURE (Good):**
```javascript
await connection.execute(
  `BEGIN
     sp_book_appointment(:patientId, :doctorId, ...);
   END;`,
  { patientId, doctorId, ... }
);
```

**❌ NOT USING PROCEDURE (Old way):**
```javascript
await connection.execute(
  `INSERT INTO DOCTORS_APPOINTMENTS (...) VALUES (...)`,
  { patientId, doctorId, ... }
);
```

### Files to check:
1. `backend/controllers/appointmentController.js` (line ~112) - Should have `sp_book_appointment`
2. `backend/controllers/prescriptionController.js` (line ~175) - Should have `sp_update_medicine_stock`

---

## Method 5: Test Error Handling (Procedure Validation)

### The procedure has built-in validation. Test it:

**Test 1: Try to book an already booked slot**
- Book an appointment
- Try to book the SAME slot again
- You should get: "❌ This slot is already booked"
- This error comes from the PROCEDURE, not your code!

**Test 2: Try to book with invalid time slot**
- Use a non-existent timeSlotId (e.g., 99999)
- You should get: "❌ Time slot not found"
- This error comes from the PROCEDURE!

If you get these specific error messages, the procedure is working!

---

## Method 6: Check Database Statistics

### Run this query to see procedure execution count:

```sql
SELECT name, type, executions
FROM v$db_object_cache
WHERE name = 'SP_BOOK_APPOINTMENT'
  AND type = 'PROCEDURE';
```

The `executions` column shows how many times the procedure has been called.

---

## Method 7: Simple Test Query

### Before booking an appointment:
```sql
SELECT COUNT(*) FROM DOCTORS_APPOINTMENTS;
-- Note the count (e.g., 10)
```

### Book an appointment through your app

### After booking:
```sql
SELECT COUNT(*) FROM DOCTORS_APPOINTMENTS;
-- Should be +1 (e.g., 11)

-- Check the latest appointment
SELECT * FROM DOCTORS_APPOINTMENTS 
ORDER BY ID DESC 
FETCH FIRST 1 ROW ONLY;
```

If the appointment was created, the procedure worked!

---

## Quick Verification Checklist

Run through this checklist:

- [ ] Procedures exist in database
  ```sql
  SELECT object_name, status FROM user_objects WHERE object_type='PROCEDURE';
  ```
  Should show: SP_BOOK_APPOINTMENT (VALID)

- [ ] Backend code calls procedure
  ```bash
  grep -n "sp_book_appointment" backend/controllers/appointmentController.js
  ```
  Should show line number with procedure call

- [ ] Backend server restarted after creating procedures

- [ ] Appointment booking works without errors

- [ ] Check backend console for any error messages

If all checks pass, you're using the stored procedure! ✅

---

## Expected Output When Using Procedure

### Backend Console (when booking):
```
Book appointment called
Patient ID: 5
Calling stored procedure...
✅ Appointment booked successfully
```

### Frontend Response:
```json
{
  "message": "✅ Appointment booked successfully",
  "appointmentId": 123
}
```

### Database:
```sql
-- New row in DOCTORS_APPOINTMENTS with:
-- - STATUS = 'BOOKED'
-- - START_TIME and END_TIME populated
-- - All validations passed
```

---

## Still Not Sure?

Add this temporary test endpoint to verify:

```javascript
// In backend/routes/auth.js
router.get('/test-procedure', async (req, res) => {
  const connectDB = require('../db/connection');
  const oracledb = require('oracledb');
  
  try {
    const connection = await connectDB();
    
    // Test calling the procedure
    const result = await connection.execute(
      `BEGIN
         sp_book_appointment(1, 1, SYSDATE, 1, 'Test', :appointmentId);
       END;`,
      { appointmentId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } }
    );
    
    await connection.close();
    
    res.json({ 
      success: true, 
      message: 'Procedure is working!',
      appointmentId: result.outBinds.appointmentId 
    });
  } catch (err) {
    res.json({ 
      success: false, 
      error: err.message 
    });
  }
});
```

Visit: `http://localhost:3000/api/test-procedure`

If you see `"success": true`, the procedure is working!
