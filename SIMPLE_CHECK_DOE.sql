-- ============================================
-- SIMPLE CHECK FOR doe@gmail.com
-- Copy and paste these queries one by one
-- ============================================

-- Query 1: Get Doctor ID
SELECT 
  u.ID as USER_ID,
  d.ID as DOCTOR_ID,
  u.NAME,
  u.EMAIL
FROM USERS u
JOIN DOCTOR d ON u.ID = d.USER_ID
WHERE LOWER(TRIM(u.EMAIL)) = 'doe@gmail.com';

-- Write down the DOCTOR_ID from above (e.g., 3)
-- Replace :doctorId below with that number


-- Query 2: Check Time Slots (replace :doctorId with actual number)
SELECT 
  ID as SLOT_ID,
  DAY_OF_WEEK,
  START_TIME,
  END_TIME,
  STATUS
FROM TIME_SLOTS
WHERE DOCTOR_ID = :doctorId
ORDER BY 
  CASE DAY_OF_WEEK
    WHEN 'Sunday' THEN 1
    WHEN 'Monday' THEN 2
    WHEN 'Tuesday' THEN 3
    WHEN 'Wednesday' THEN 4
    WHEN 'Thursday' THEN 5
    WHEN 'Friday' THEN 6
    WHEN 'Saturday' THEN 7
  END,
  START_TIME;


-- Query 3: Check Appointments (replace :doctorId with actual number)
SELECT 
  da.ID as APT_ID,
  da.APPOINTMENT_DATE,
  da.STATUS,
  da.TIME_SLOT_ID,
  ts.START_TIME,
  ts.END_TIME,
  pu.NAME as PATIENT_NAME
FROM DOCTORS_APPOINTMENTS da
LEFT JOIN TIME_SLOTS ts ON da.TIME_SLOT_ID = ts.ID
JOIN PATIENT p ON da.PATIENT_ID = p.ID
JOIN USERS pu ON p.USER_ID = pu.ID
WHERE da.DOCTOR_ID = :doctorId
ORDER BY da.APPOINTMENT_DATE DESC;


-- Query 4: Count Everything (replace :doctorId with actual number)
SELECT 
  (SELECT COUNT(*) FROM TIME_SLOTS WHERE DOCTOR_ID = :doctorId) as TOTAL_SLOTS,
  (SELECT COUNT(*) FROM DOCTORS_APPOINTMENTS WHERE DOCTOR_ID = :doctorId) as TOTAL_APPOINTMENTS,
  (SELECT COUNT(*) FROM DOCTORS_APPOINTMENTS WHERE DOCTOR_ID = :doctorId AND TIME_SLOT_ID IS NULL) as APPOINTMENTS_WITH_NULL_SLOT
FROM DUAL;


-- Query 5: Check Foreign Key Constraint
SELECT 
  constraint_name,
  delete_rule,
  status
FROM user_constraints
WHERE constraint_name = 'FK_DOCTOR_APPOINTMENT_TIMESLOT';

-- Should show: DELETE_RULE = 'SET NULL', STATUS = 'ENABLED'
