-- ============================================
-- CHECK DOE@GMAIL.COM SCHEDULE AND APPOINTMENTS
-- Run these queries in your Oracle SQL client
-- ============================================

-- Step 1: Get Doctor ID for doe@gmail.com
SELECT 
  u.ID as USER_ID,
  u.NAME,
  u.EMAIL,
  u.ROLE,
  d.ID as DOCTOR_ID
FROM USERS u
LEFT JOIN DOCTOR d ON u.ID = d.USER_ID
WHERE LOWER(TRIM(u.EMAIL)) = 'doe@gmail.com';

-- Expected output: Shows USER_ID and DOCTOR_ID
-- Example: USER_ID=5, DOCTOR_ID=3


-- Step 2: Check TIME_SLOTS for this doctor
SELECT 
  ts.ID as SLOT_ID,
  ts.DOCTOR_ID,
  ts.DAY_OF_WEEK,
  ts.START_TIME,
  ts.END_TIME,
  ts.STATUS
FROM TIME_SLOTS ts
WHERE ts.DOCTOR_ID = (
  SELECT d.ID 
  FROM DOCTOR d 
  JOIN USERS u ON d.USER_ID = u.ID 
  WHERE LOWER(TRIM(u.EMAIL)) = 'doe@gmail.com'
)
ORDER BY 
  CASE ts.DAY_OF_WEEK
    WHEN 'Sunday' THEN 1
    WHEN 'Monday' THEN 2
    WHEN 'Tuesday' THEN 3
    WHEN 'Wednesday' THEN 4
    WHEN 'Thursday' THEN 5
    WHEN 'Friday' THEN 6
    WHEN 'Saturday' THEN 7
  END,
  ts.START_TIME;

-- Expected output: Shows all time slots for this doctor
-- If empty, doctor has no schedule set


-- Step 3: Check APPOINTMENTS for this doctor (WITHOUT LEFT JOIN - WRONG)
SELECT 
  da.ID as APPOINTMENT_ID,
  da.APPOINTMENT_DATE,
  da.STATUS,
  da.TIME_SLOT_ID,
  ts.START_TIME,
  ts.END_TIME,
  ts.DAY_OF_WEEK,
  pu.NAME as PATIENT_NAME,
  pu.EMAIL as PATIENT_EMAIL
FROM DOCTORS_APPOINTMENTS da
JOIN TIME_SLOTS ts ON da.TIME_SLOT_ID = ts.ID  -- ❌ INNER JOIN - appointments disappear if slot deleted
JOIN PATIENT p ON da.PATIENT_ID = p.ID
JOIN USERS pu ON p.USER_ID = pu.ID
WHERE da.DOCTOR_ID = (
  SELECT d.ID 
  FROM DOCTOR d 
  JOIN USERS u ON d.USER_ID = u.ID 
  WHERE LOWER(TRIM(u.EMAIL)) = 'doe@gmail.com'
)
ORDER BY da.APPOINTMENT_DATE DESC;

-- This query will FAIL to show appointments if TIME_SLOT_ID references a deleted slot!


-- Step 4: Check APPOINTMENTS for this doctor (WITH LEFT JOIN - CORRECT) ✅
SELECT 
  da.ID as APPOINTMENT_ID,
  da.APPOINTMENT_DATE,
  da.STATUS,
  da.TIME_SLOT_ID,
  ts.START_TIME,
  ts.END_TIME,
  ts.DAY_OF_WEEK,
  pu.NAME as PATIENT_NAME,
  pu.EMAIL as PATIENT_EMAIL,
  CASE 
    WHEN ts.ID IS NULL THEN 'SLOT DELETED'
    ELSE 'SLOT EXISTS'
  END as SLOT_STATUS
FROM DOCTORS_APPOINTMENTS da
LEFT JOIN TIME_SLOTS ts ON da.TIME_SLOT_ID = ts.ID  -- ✅ LEFT JOIN - shows all appointments
JOIN PATIENT p ON da.PATIENT_ID = p.ID
JOIN USERS pu ON p.USER_ID = pu.ID
WHERE da.DOCTOR_ID = (
  SELECT d.ID 
  FROM DOCTOR d 
  JOIN USERS u ON d.USER_ID = u.ID 
  WHERE LOWER(TRIM(u.EMAIL)) = 'doe@gmail.com'
)
ORDER BY da.APPOINTMENT_DATE DESC;

-- This query will show ALL appointments, even if TIME_SLOT_ID is NULL or references deleted slot!


-- Step 5: Check ALL APPOINTMENTS (raw data)
SELECT 
  da.ID as APPOINTMENT_ID,
  da.DOCTOR_ID,
  da.PATIENT_ID,
  da.TIME_SLOT_ID,
  da.APPOINTMENT_DATE,
  da.STATUS,
  da.TYPE
FROM DOCTORS_APPOINTMENTS da
WHERE da.DOCTOR_ID = (
  SELECT d.ID 
  FROM DOCTOR d 
  JOIN USERS u ON d.USER_ID = u.ID 
  WHERE LOWER(TRIM(u.EMAIL)) = 'doe@gmail.com'
)
ORDER BY da.APPOINTMENT_DATE DESC;

-- Shows raw appointment data without any joins


-- Step 6: Check if TIME_SLOT_ID references exist
SELECT 
  da.ID as APPOINTMENT_ID,
  da.TIME_SLOT_ID,
  CASE 
    WHEN ts.ID IS NULL THEN 'SLOT DOES NOT EXIST (DELETED OR NULL)'
    ELSE 'SLOT EXISTS'
  END as SLOT_CHECK
FROM DOCTORS_APPOINTMENTS da
LEFT JOIN TIME_SLOTS ts ON da.TIME_SLOT_ID = ts.ID
WHERE da.DOCTOR_ID = (
  SELECT d.ID 
  FROM DOCTOR d 
  JOIN USERS u ON d.USER_ID = u.ID 
  WHERE LOWER(TRIM(u.EMAIL)) = 'doe@gmail.com'
);


-- Step 7: Count appointments vs time slots
SELECT 
  'Total Appointments' as METRIC,
  COUNT(*) as COUNT
FROM DOCTORS_APPOINTMENTS da
WHERE da.DOCTOR_ID = (
  SELECT d.ID 
  FROM DOCTOR d 
  JOIN USERS u ON d.USER_ID = u.ID 
  WHERE LOWER(TRIM(u.EMAIL)) = 'doe@gmail.com'
)
UNION ALL
SELECT 
  'Total Time Slots' as METRIC,
  COUNT(*) as COUNT
FROM TIME_SLOTS ts
WHERE ts.DOCTOR_ID = (
  SELECT d.ID 
  FROM DOCTOR d 
  JOIN USERS u ON d.USER_ID = u.ID 
  WHERE LOWER(TRIM(u.EMAIL)) = 'doe@gmail.com'
)
UNION ALL
SELECT 
  'Appointments with NULL TIME_SLOT_ID' as METRIC,
  COUNT(*) as COUNT
FROM DOCTORS_APPOINTMENTS da
WHERE da.DOCTOR_ID = (
  SELECT d.ID 
  FROM DOCTOR d 
  JOIN USERS u ON d.USER_ID = u.ID 
  WHERE LOWER(TRIM(u.EMAIL)) = 'doe@gmail.com'
)
AND da.TIME_SLOT_ID IS NULL
UNION ALL
SELECT 
  'Appointments with DELETED TIME_SLOT_ID' as METRIC,
  COUNT(*) as COUNT
FROM DOCTORS_APPOINTMENTS da
LEFT JOIN TIME_SLOTS ts ON da.TIME_SLOT_ID = ts.ID
WHERE da.DOCTOR_ID = (
  SELECT d.ID 
  FROM DOCTOR d 
  JOIN USERS u ON d.USER_ID = u.ID 
  WHERE LOWER(TRIM(u.EMAIL)) = 'doe@gmail.com'
)
AND da.TIME_SLOT_ID IS NOT NULL
AND ts.ID IS NULL;


-- Step 8: Verify Foreign Key Constraint
SELECT 
  constraint_name,
  constraint_type,
  delete_rule,
  status
FROM user_constraints
WHERE constraint_name = 'FK_DOCTOR_APPOINTMENT_TIMESLOT';

-- Expected: DELETE_RULE = 'SET NULL', STATUS = 'ENABLED'


-- ============================================
-- TESTING SCENARIO
-- ============================================

-- Test 1: See current state
-- Run Step 2 (time slots) and Step 4 (appointments with LEFT JOIN)

-- Test 2: Delete all time slots for doe@gmail.com
/*
DELETE FROM TIME_SLOTS 
WHERE DOCTOR_ID = (
  SELECT d.ID 
  FROM DOCTOR d 
  JOIN USERS u ON d.USER_ID = u.ID 
  WHERE LOWER(TRIM(u.EMAIL)) = 'doe@gmail.com'
);
COMMIT;
*/

-- Test 3: Check appointments still exist
-- Run Step 4 again - appointments should still show with NULL times

-- Test 4: Compare INNER JOIN vs LEFT JOIN
-- Run Step 3 (INNER JOIN) - may show 0 appointments
-- Run Step 4 (LEFT JOIN) - should show all appointments


-- ============================================
-- WHAT TO LOOK FOR
-- ============================================

-- If Step 3 (INNER JOIN) shows FEWER appointments than Step 4 (LEFT JOIN):
--   → Some appointments have deleted/NULL TIME_SLOT_ID
--   → LEFT JOIN is needed to show them

-- If Step 4 shows appointments with NULL START_TIME/END_TIME:
--   → Those appointments had their time slots deleted
--   → This is expected behavior after schedule update

-- If Step 8 shows DELETE_RULE = 'NO ACTION':
--   → Foreign key constraint NOT fixed yet
--   → Run FIX_TIMESLOT_CONSTRAINT.sql first

-- If Step 8 shows DELETE_RULE = 'SET NULL':
--   → Foreign key constraint is correct ✅
--   → Appointments will survive slot deletion
