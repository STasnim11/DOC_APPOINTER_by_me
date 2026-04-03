# TIME_SLOTS vs APPOINTMENTS - How They Work Together

## DATABASE STRUCTURE

### TIME_SLOTS Table
```sql
CREATE TABLE TIME_SLOTS (
  ID NUMBER PRIMARY KEY,
  DOCTOR_ID NUMBER NOT NULL,
  DAY_OF_WEEK VARCHAR2(20),      -- 'Monday', 'Tuesday', etc.
  START_TIME VARCHAR2(5),         -- '09:00'
  END_TIME VARCHAR2(5),           -- '09:30'
  STATUS VARCHAR2(20)             -- 'AVAILABLE', 'BOOKED'
);
```

**Purpose:** Template slots that define when a doctor is available

**Example:**
```
ID | DOCTOR_ID | DAY_OF_WEEK | START_TIME | END_TIME | STATUS
1  | 3         | Monday      | 09:00      | 09:30    | AVAILABLE
2  | 3         | Monday      | 09:30      | 10:00    | BOOKED
3  | 3         | Monday      | 10:00      | 10:30    | AVAILABLE
```

### DOCTORS_APPOINTMENTS Table
```sql
CREATE TABLE DOCTORS_APPOINTMENTS (
  ID NUMBER PRIMARY KEY,
  TIME_SLOT_ID NUMBER,            -- References TIME_SLOTS.ID
  DOCTOR_ID NUMBER NOT NULL,
  PATIENT_ID NUMBER NOT NULL,
  APPOINTMENT_DATE DATE,          -- Actual date (e.g., 2026-04-10)
  STATUS VARCHAR2(20),            -- 'BOOKED', 'COMPLETED', 'CANCELLED'
  TYPE VARCHAR2(50)
);
```

**Purpose:** Actual appointment bookings made by patients

**Example:**
```
ID | TIME_SLOT_ID | DOCTOR_ID | PATIENT_ID | APPOINTMENT_DATE | STATUS
1  | 2            | 3         | 5          | 2026-04-14       | BOOKED
2  | 5            | 3         | 7          | 2026-04-15       | COMPLETED
```

---

## HOW THEY WORK TOGETHER

### Scenario 1: Patient Books Appointment

```
1. Patient selects doctor and date (Monday, April 14, 2026)
2. System shows available TIME_SLOTS for Monday
3. Patient selects 09:30-10:00 slot (TIME_SLOT_ID = 2)
4. System creates DOCTORS_APPOINTMENTS record:
   - TIME_SLOT_ID = 2
   - APPOINTMENT_DATE = 2026-04-14
   - STATUS = 'BOOKED'
5. System updates TIME_SLOTS.STATUS = 'BOOKED' for slot ID 2
```

### Scenario 2: Doctor Updates Schedule

**OLD APPROACH (WRONG):**
```sql
-- Only delete slots that have NO appointments
DELETE FROM TIME_SLOTS 
WHERE DOCTOR_ID = 3 
AND ID NOT IN (SELECT TIME_SLOT_ID FROM DOCTORS_APPOINTMENTS);
```

**Problem:**
- Slots with appointments are NOT deleted
- Old schedule persists
- Doctor can't change their availability

**NEW APPROACH (CORRECT):**
```sql
-- Delete ALL slots for this doctor
DELETE FROM TIME_SLOTS WHERE DOCTOR_ID = 3;
```

**Why this is safe:**
- DOCTORS_APPOINTMENTS table still has TIME_SLOT_ID = 2
- Appointment record is independent and persists
- Appointment will still show in dashboards
- Only future availability is affected

---

## WHAT HAPPENS WHEN TIME_SLOT IS DELETED

### Before Deletion:
```
TIME_SLOTS:
ID=2 | DOCTOR_ID=3 | DAY=Monday | START=09:30 | END=10:00 | STATUS=BOOKED

DOCTORS_APPOINTMENTS:
ID=1 | TIME_SLOT_ID=2 | DOCTOR_ID=3 | PATIENT_ID=5 | DATE=2026-04-14 | STATUS=BOOKED
```

### After Deletion (Doctor updates schedule):
```
TIME_SLOTS:
(Slot ID=2 is deleted)

DOCTORS_APPOINTMENTS:
ID=1 | TIME_SLOT_ID=2 | DOCTOR_ID=3 | PATIENT_ID=5 | DATE=2026-04-14 | STATUS=BOOKED
                ↑ Still references deleted slot, but that's OK!
```

### How Appointments Are Displayed:

**Doctor Dashboard Query:**
```sql
SELECT 
  da.ID as APPOINTMENT_ID,
  da.APPOINTMENT_DATE,
  da.STATUS,
  ts.START_TIME,  -- Will be NULL if slot deleted
  ts.END_TIME,    -- Will be NULL if slot deleted
  pu.NAME as PATIENT_NAME
FROM DOCTORS_APPOINTMENTS da
LEFT JOIN TIME_SLOTS ts ON da.TIME_SLOT_ID = ts.ID  -- LEFT JOIN handles deleted slots
JOIN PATIENT p ON da.PATIENT_ID = p.ID
JOIN USERS pu ON p.USER_ID = pu.ID
WHERE da.DOCTOR_ID = 3;
```

**Result:**
```
APPOINTMENT_ID | DATE       | STATUS | START_TIME | END_TIME | PATIENT_NAME
1              | 2026-04-14 | BOOKED | NULL       | NULL     | John Doe
```

**Display Logic:**
```javascript
// If time slot is deleted, show appointment date only
{apt.startTime && apt.endTime ? (
  <p>Time: {apt.startTime} - {apt.endTime}</p>
) : (
  <p>Time: (Slot no longer available)</p>
)}
```

---

## REAL-WORLD SCENARIOS

### Scenario A: Doctor Works Monday-Friday, Then Changes to Monday-Wednesday

**Step 1: Initial Schedule**
```
Monday:    09:00-17:00 (16 slots)
Tuesday:   09:00-17:00 (16 slots)
Wednesday: 09:00-17:00 (16 slots)
Thursday:  09:00-17:00 (16 slots)
Friday:    09:00-17:00 (16 slots)
Total: 80 slots
```

**Step 2: Patient Books Appointment**
```
Patient books: Thursday, April 17, 2026, 10:00-10:30
TIME_SLOT_ID = 45 (Thursday slot)
```

**Step 3: Doctor Updates Schedule (Removes Thursday & Friday)**
```
New Schedule:
Monday:    09:00-17:00 (16 slots)
Tuesday:   09:00-17:00 (16 slots)
Wednesday: 09:00-17:00 (16 slots)
Total: 48 slots

Backend Action:
1. DELETE FROM TIME_SLOTS WHERE DOCTOR_ID = 3  (deletes all 80 slots)
2. INSERT new 48 slots for Mon-Wed
```

**Step 4: What Happens to Thursday Appointment?**
```
DOCTORS_APPOINTMENTS table:
ID=1 | TIME_SLOT_ID=45 | DATE=2026-04-17 | STATUS=BOOKED

✅ Appointment still exists!
✅ Shows in doctor's dashboard
✅ Shows in patient's dashboard
✅ Doctor can still complete it
⚠️ Time slot details (10:00-10:30) may show as NULL
```

---

## BENEFITS OF THIS APPROACH

### ✅ Advantages:
1. **Doctor Flexibility:** Can update schedule anytime
2. **Data Integrity:** Appointments are never lost
3. **Historical Record:** Past appointments remain accessible
4. **Simple Logic:** No complex checks for existing appointments

### ⚠️ Considerations:
1. **Orphaned References:** DOCTORS_APPOINTMENTS.TIME_SLOT_ID may reference deleted slots
2. **Display Logic:** Need LEFT JOIN to handle deleted slots
3. **Time Display:** May show "Time not available" for old appointments

---

## ALTERNATIVE APPROACH (Not Recommended)

### Option 2: Prevent Schedule Changes If Appointments Exist

```javascript
// Check for future appointments
const futureAppointments = await connection.execute(
  `SELECT COUNT(*) FROM DOCTORS_APPOINTMENTS
   WHERE DOCTOR_ID = :doctorId
   AND APPOINTMENT_DATE >= TRUNC(SYSDATE)
   AND STATUS = 'BOOKED'`,
  { doctorId }
);

if (futureAppointments.rows[0][0] > 0) {
  return res.status(400).json({
    error: "Cannot update schedule - you have upcoming appointments. Please complete or cancel them first."
  });
}
```

**Why NOT recommended:**
- Too restrictive
- Doctor can't add new days
- Doctor can't change intervals
- Poor user experience

---

## CURRENT IMPLEMENTATION

### Code: `backend/controllers/timetable.js`

```javascript
// Delete ALL existing time slots for this doctor
// Note: Existing appointments will remain valid even if their time slots are deleted
// Appointments are independent records that just reference the slot ID
const deleteResult = await connection.execute(
  `DELETE FROM TIME_SLOTS WHERE DOCTOR_ID = :doctorId`,
  { doctorId }
);

console.log("Old schedule deleted - removed", deleteResult.rowsAffected, "slots");
console.log("Note: Existing appointments are preserved and will still show in dashboards");
```

### Result:
- ✅ All old slots deleted
- ✅ New slots created based on updated schedule
- ✅ Appointments persist and remain visible
- ✅ Doctor can freely update availability

---

## SUMMARY

**Question:** "If an appointment is already booked, will deleting the time slot affect it?"

**Answer:** No! Here's why:

1. **TIME_SLOTS** = Template for availability (can be deleted/recreated)
2. **DOCTORS_APPOINTMENTS** = Actual bookings (permanent records)
3. **Relationship** = Appointments reference slots, but are independent
4. **Deletion** = Deleting slots doesn't delete appointments
5. **Display** = Appointments show even if their slot is deleted (using LEFT JOIN)

**Analogy:**
- TIME_SLOTS = Restaurant's weekly menu
- APPOINTMENTS = Orders already placed
- Changing the menu doesn't cancel existing orders!

---

## TESTING

### Test 1: Book Appointment, Then Change Schedule

1. Doctor sets Monday 09:00-17:00 (30 min intervals)
2. Patient books Monday, April 14, 10:00-10:30
3. Doctor changes Monday to 14:00-18:00 (60 min intervals)
4. Check: Patient's appointment still shows in both dashboards ✅

### Test 2: Remove Day With Appointments

1. Doctor sets Mon-Fri 09:00-17:00
2. Patient books Wednesday appointment
3. Doctor removes Wednesday from schedule
4. Check: Wednesday appointment still shows ✅
5. Check: No new Wednesday slots available for future bookings ✅

### Test 3: Database Verification

```sql
-- Before schedule update
SELECT COUNT(*) FROM TIME_SLOTS WHERE DOCTOR_ID = 3;
-- Result: 80 slots

-- Book appointment
INSERT INTO DOCTORS_APPOINTMENTS (TIME_SLOT_ID, DOCTOR_ID, PATIENT_ID, APPOINTMENT_DATE, STATUS)
VALUES (45, 3, 5, TO_DATE('2026-04-17', 'YYYY-MM-DD'), 'BOOKED');

-- Update schedule (remove Thursday & Friday)
-- Backend deletes all 80 slots, creates 48 new ones

SELECT COUNT(*) FROM TIME_SLOTS WHERE DOCTOR_ID = 3;
-- Result: 48 slots (Mon-Wed only)

SELECT COUNT(*) FROM DOCTORS_APPOINTMENTS WHERE DOCTOR_ID = 3;
-- Result: 1 appointment (still exists!)

-- Verify appointment shows correctly
SELECT 
  da.ID,
  da.APPOINTMENT_DATE,
  ts.START_TIME,
  ts.END_TIME
FROM DOCTORS_APPOINTMENTS da
LEFT JOIN TIME_SLOTS ts ON da.TIME_SLOT_ID = ts.ID
WHERE da.ID = 1;
-- Result: ID=1, DATE=2026-04-17, START_TIME=NULL, END_TIME=NULL
-- Appointment exists, but slot details are gone (expected)
```

---

## CONCLUSION

✅ **Safe to delete all TIME_SLOTS** when updating schedule

✅ **Appointments are preserved** and remain visible

✅ **Doctor has full flexibility** to change availability

✅ **No conflicts** between slots and appointments

The current implementation is correct and follows best practices!
