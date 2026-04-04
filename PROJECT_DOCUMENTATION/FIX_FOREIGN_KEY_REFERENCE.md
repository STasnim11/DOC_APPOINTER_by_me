# HOW FOREIGN KEY REFERENCING IS HANDLED

## THE PROBLEM

When `DOCTORS_APPOINTMENTS.TIME_SLOT_ID` references `TIME_SLOTS.ID`, deleting a TIME_SLOT could cause issues depending on the constraint type.

---

## SCENARIO 1: NO FOREIGN KEY CONSTRAINT (Most Likely Your Case)

### Check if this is your situation:
Run this SQL:
```sql
SELECT constraint_name, delete_rule
FROM user_constraints
WHERE table_name = 'DOCTORS_APPOINTMENTS'
  AND constraint_type = 'R'
  AND constraint_name LIKE '%TIME%';
```

**If result is empty:** You have NO foreign key constraint!

### How it works:
```
TIME_SLOTS:
ID=45 | DOCTOR_ID=3 | DAY=Thursday | START=10:00 | END=10:30

DOCTORS_APPOINTMENTS:
ID=1 | TIME_SLOT_ID=45 | DOCTOR_ID=3 | PATIENT_ID=5

-- Delete the slot
DELETE FROM TIME_SLOTS WHERE ID = 45;
-- ✅ Works! No error

-- Appointment still exists
SELECT * FROM DOCTORS_APPOINTMENTS WHERE ID = 1;
-- Result: ID=1, TIME_SLOT_ID=45 (references non-existent slot)
```

### Why it works:
- TIME_SLOT_ID is just a NUMBER column
- No constraint enforcing the reference
- Oracle allows "orphaned" references
- Appointments display using LEFT JOIN (handles missing slots)

### Display query handles it:
```sql
SELECT 
  da.ID,
  da.APPOINTMENT_DATE,
  ts.START_TIME,  -- NULL if slot deleted
  ts.END_TIME     -- NULL if slot deleted
FROM DOCTORS_APPOINTMENTS da
LEFT JOIN TIME_SLOTS ts ON da.TIME_SLOT_ID = ts.ID
WHERE da.ID = 1;
```

**Result:** Appointment shows, time is NULL

### ✅ NO FIX NEEDED - Already works!

---

## SCENARIO 2: FOREIGN KEY WITH ON DELETE RESTRICT (Problematic)

### Check if this is your situation:
```sql
SELECT constraint_name, delete_rule
FROM user_constraints
WHERE table_name = 'DOCTORS_APPOINTMENTS'
  AND constraint_type = 'R'
  AND delete_rule = 'NO ACTION';
```

**If you get a result:** You have a restrictive constraint!

### The problem:
```sql
DELETE FROM TIME_SLOTS WHERE DOCTOR_ID = 3;
-- ❌ Error: ORA-02292: integrity constraint violated - child record found
```

### The fix:
**Option A: Drop the constraint**
```sql
-- Find constraint name
SELECT constraint_name 
FROM user_constraints
WHERE table_name = 'DOCTORS_APPOINTMENTS'
  AND constraint_type = 'R';

-- Drop it (replace CONSTRAINT_NAME with actual name)
ALTER TABLE DOCTORS_APPOINTMENTS
DROP CONSTRAINT FK_APPOINTMENT_TIMESLOT;

COMMIT;
```

**Option B: Change to ON DELETE SET NULL**
```sql
-- Drop old constraint
ALTER TABLE DOCTORS_APPOINTMENTS
DROP CONSTRAINT FK_APPOINTMENT_TIMESLOT;

-- Add new constraint with SET NULL
ALTER TABLE DOCTORS_APPOINTMENTS
ADD CONSTRAINT FK_APPOINTMENT_TIMESLOT
FOREIGN KEY (TIME_SLOT_ID) REFERENCES TIME_SLOTS(ID)
ON DELETE SET NULL;

COMMIT;
```

**Option C: Make TIME_SLOT_ID nullable first**
```sql
-- Ensure column allows NULL
ALTER TABLE DOCTORS_APPOINTMENTS
MODIFY TIME_SLOT_ID NUMBER NULL;

-- Then apply Option B
```

---

## SCENARIO 3: FOREIGN KEY WITH ON DELETE CASCADE (Dangerous!)

### Check if this is your situation:
```sql
SELECT constraint_name, delete_rule
FROM user_constraints
WHERE table_name = 'DOCTORS_APPOINTMENTS'
  AND constraint_type = 'R'
  AND delete_rule = 'CASCADE';
```

**If you get a result:** DANGER! Appointments will be deleted!

### The problem:
```sql
DELETE FROM TIME_SLOTS WHERE DOCTOR_ID = 3;
-- ✅ Works, but...
-- ❌ All appointments referencing those slots are ALSO DELETED!
```

### The fix:
**MUST change the constraint:**
```sql
-- Drop CASCADE constraint
ALTER TABLE DOCTORS_APPOINTMENTS
DROP CONSTRAINT FK_APPOINTMENT_TIMESLOT;

-- Option 1: No constraint (simplest)
-- (Just don't add it back)

-- Option 2: Add with SET NULL
ALTER TABLE DOCTORS_APPOINTMENTS
MODIFY TIME_SLOT_ID NUMBER NULL;

ALTER TABLE DOCTORS_APPOINTMENTS
ADD CONSTRAINT FK_APPOINTMENT_TIMESLOT
FOREIGN KEY (TIME_SLOT_ID) REFERENCES TIME_SLOTS(ID)
ON DELETE SET NULL;

COMMIT;
```

---

## RECOMMENDED SOLUTION

### Best Practice: ON DELETE SET NULL

```sql
-- Step 1: Check current constraint
SELECT constraint_name, delete_rule
FROM user_constraints
WHERE table_name = 'DOCTORS_APPOINTMENTS'
  AND constraint_type = 'R';

-- Step 2: If constraint exists, drop it
ALTER TABLE DOCTORS_APPOINTMENTS
DROP CONSTRAINT FK_APPOINTMENT_TIMESLOT;  -- Use actual name from Step 1

-- Step 3: Ensure column is nullable
ALTER TABLE DOCTORS_APPOINTMENTS
MODIFY TIME_SLOT_ID NUMBER NULL;

-- Step 4: Add new constraint with SET NULL
ALTER TABLE DOCTORS_APPOINTMENTS
ADD CONSTRAINT FK_APPOINTMENT_TIMESLOT
FOREIGN KEY (TIME_SLOT_ID) REFERENCES TIME_SLOTS(ID)
ON DELETE SET NULL;

COMMIT;
```

### Why this is best:
1. ✅ Maintains referential integrity when slot exists
2. ✅ Allows deleting slots (sets TIME_SLOT_ID to NULL)
3. ✅ Appointments are preserved
4. ✅ Database enforces the relationship
5. ✅ Clear indication when slot is deleted (NULL value)

---

## HOW QUERIES HANDLE NULL TIME_SLOT_ID

### Doctor Dashboard Query:
```sql
SELECT 
  da.ID as APPOINTMENT_ID,
  da.APPOINTMENT_DATE,
  da.STATUS,
  ts.START_TIME,
  ts.END_TIME,
  pu.NAME as PATIENT_NAME
FROM DOCTORS_APPOINTMENTS da
LEFT JOIN TIME_SLOTS ts ON da.TIME_SLOT_ID = ts.ID
JOIN PATIENT p ON da.PATIENT_ID = p.ID
JOIN USERS pu ON p.USER_ID = pu.ID
WHERE da.DOCTOR_ID = 3;
```

**Result when TIME_SLOT_ID is NULL:**
```
APPOINTMENT_ID | DATE       | STATUS | START_TIME | END_TIME | PATIENT_NAME
1              | 2026-04-14 | BOOKED | NULL       | NULL     | John Doe
```

### Frontend Display Logic:
```javascript
{apt.startTime && apt.endTime ? (
  <p><strong>Time:</strong> {apt.startTime} - {apt.endTime}</p>
) : (
  <p><strong>Time:</strong> <em>Slot no longer available</em></p>
)}
```

---

## TESTING THE FIX

### Test 1: Verify Constraint Type
```sql
SELECT 
  constraint_name,
  constraint_type,
  delete_rule,
  status
FROM user_constraints
WHERE table_name = 'DOCTORS_APPOINTMENTS'
  AND constraint_type = 'R';
```

**Expected:** Either no result (no constraint) or `DELETE_RULE = 'SET NULL'`

### Test 2: Delete Slot With Appointment
```sql
-- Create test appointment
INSERT INTO DOCTORS_APPOINTMENTS (TIME_SLOT_ID, DOCTOR_ID, PATIENT_ID, APPOINTMENT_DATE, STATUS)
VALUES (45, 3, 5, TO_DATE('2026-04-14', 'YYYY-MM-DD'), 'BOOKED');
COMMIT;

-- Delete the slot
DELETE FROM TIME_SLOTS WHERE ID = 45;
COMMIT;

-- Check appointment still exists
SELECT ID, TIME_SLOT_ID, STATUS
FROM DOCTORS_APPOINTMENTS
WHERE DOCTOR_ID = 3;
```

**Expected:** Appointment exists with TIME_SLOT_ID = NULL (or 45 if no constraint)

### Test 3: Update Doctor Schedule
```sql
-- Delete all slots for doctor
DELETE FROM TIME_SLOTS WHERE DOCTOR_ID = 3;
COMMIT;

-- Check appointments still exist
SELECT COUNT(*) FROM DOCTORS_APPOINTMENTS WHERE DOCTOR_ID = 3;
```

**Expected:** Count > 0 (appointments preserved)

---

## SUMMARY

### If you have NO constraint:
- ✅ Already works!
- ✅ No fix needed
- ✅ Appointments persist with orphaned TIME_SLOT_ID

### If you have ON DELETE RESTRICT:
- ❌ Cannot delete slots
- 🔧 Fix: Drop constraint or change to SET NULL

### If you have ON DELETE CASCADE:
- ❌ Appointments get deleted!
- 🔧 Fix: MUST change to SET NULL or remove constraint

### Recommended:
- ✅ Use ON DELETE SET NULL
- ✅ Maintains data integrity
- ✅ Allows schedule updates
- ✅ Preserves appointments

---

## QUICK FIX SCRIPT

Run this to ensure everything works:

```sql
-- Check current setup
SELECT 
  constraint_name,
  delete_rule
FROM user_constraints
WHERE table_name = 'DOCTORS_APPOINTMENTS'
  AND constraint_type = 'R'
  AND constraint_name LIKE '%TIME%';

-- If constraint exists and is not SET NULL, run this:
-- (Replace FK_APPOINTMENT_TIMESLOT with actual constraint name)

BEGIN
  -- Try to drop constraint (ignore error if doesn't exist)
  BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE DOCTORS_APPOINTMENTS DROP CONSTRAINT FK_APPOINTMENT_TIMESLOT';
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  -- Ensure column is nullable
  EXECUTE IMMEDIATE 'ALTER TABLE DOCTORS_APPOINTMENTS MODIFY TIME_SLOT_ID NUMBER NULL';
  
  -- Add constraint with SET NULL
  EXECUTE IMMEDIATE 'ALTER TABLE DOCTORS_APPOINTMENTS
    ADD CONSTRAINT FK_APPOINTMENT_TIMESLOT
    FOREIGN KEY (TIME_SLOT_ID) REFERENCES TIME_SLOTS(ID)
    ON DELETE SET NULL';
    
  COMMIT;
END;
/
```

Now your schedule updates will work without losing appointments!
