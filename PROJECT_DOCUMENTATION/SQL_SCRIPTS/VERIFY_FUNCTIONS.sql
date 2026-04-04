-- ============================================
-- VERIFY SQL FUNCTIONS EXIST AND WORK
-- Run this to check if functions are created
-- ============================================

-- Check if functions exist
SELECT 'Checking if functions exist...' as STATUS FROM DUAL;

SELECT object_name, object_type, status 
FROM user_objects 
WHERE object_type = 'FUNCTION'
  AND object_name IN (
    'FN_GET_DOCTOR_APPOINTMENT_COUNT',
    'FN_CALCULATE_BED_OCCUPANCY', 
    'FN_GET_PATIENT_TOTAL_EXPENSES'
  )
ORDER BY object_name;

-- If you see 3 rows with STATUS = 'VALID', functions exist!

-- ============================================
-- TEST FUNCTION 1: Doctor Appointment Count
-- ============================================
SELECT 'Testing fn_get_doctor_appointment_count...' as TEST FROM DUAL;

-- Test with a specific doctor (replace 1 with actual doctor ID)
SELECT fn_get_doctor_appointment_count(1) as APPOINTMENT_COUNT FROM DUAL;

-- Show all doctors with their appointment counts
SELECT 
  d.ID as DOCTOR_ID,
  u.NAME as DOCTOR_NAME,
  fn_get_doctor_appointment_count(d.ID) as TOTAL_APPOINTMENTS
FROM DOCTOR d
INNER JOIN USERS u ON d.USER_ID = u.ID
ORDER BY TOTAL_APPOINTMENTS DESC
FETCH FIRST 5 ROWS ONLY;

-- ============================================
-- TEST FUNCTION 2: Bed Occupancy Rate
-- ============================================
SELECT 'Testing fn_calculate_bed_occupancy...' as TEST FROM DUAL;

-- Test with a specific branch (replace 1 with actual branch ID)
SELECT fn_calculate_bed_occupancy(1) as OCCUPANCY_RATE FROM DUAL;

-- Show all branches with occupancy rates
SELECT 
  hb.ID as BRANCH_ID,
  hb.NAME as BRANCH_NAME,
  fn_calculate_bed_occupancy(hb.ID) as OCCUPANCY_RATE
FROM HOSPITAL_BRANCHES hb
ORDER BY OCCUPANCY_RATE DESC;

-- ============================================
-- TEST FUNCTION 3: Patient Total Expenses
-- ============================================
SELECT 'Testing fn_get_patient_total_expenses...' as TEST FROM DUAL;

-- Test with a specific patient (replace 1 with actual patient ID)
SELECT fn_get_patient_total_expenses(1) as TOTAL_EXPENSES FROM DUAL;

-- Show all patients with expenses > 0
SELECT 
  p.ID as PATIENT_ID,
  u.NAME as PATIENT_NAME,
  fn_get_patient_total_expenses(p.ID) as TOTAL_EXPENSES
FROM PATIENT p
INNER JOIN USERS u ON p.USER_ID = u.ID
WHERE fn_get_patient_total_expenses(p.ID) > 0
ORDER BY TOTAL_EXPENSES DESC
FETCH FIRST 5 ROWS ONLY;

-- ============================================
-- SUMMARY
-- ============================================
SELECT 'All tests complete!' as MESSAGE FROM DUAL;
SELECT 'If you see data above, functions are working!' as MESSAGE FROM DUAL;
