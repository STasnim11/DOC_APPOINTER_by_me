-- ============================================
-- VERIFY ALL DATABASE OBJECTS
-- ============================================

-- Check Functions (should show 3)
SELECT object_name, status 
FROM user_objects 
WHERE object_type = 'FUNCTION' 
  AND object_name LIKE 'FN_%'
ORDER BY object_name;

-- Check Procedure (should show 1)
SELECT object_name, status 
FROM user_objects 
WHERE object_type = 'PROCEDURE' 
  AND object_name LIKE 'SP_%'
ORDER BY object_name;

-- Check Trigger (should show 1)
SELECT trigger_name, status 
FROM user_triggers 
WHERE trigger_name LIKE 'TRG_%'
ORDER BY trigger_name;

-- ============================================
-- TEST FUNCTIONS
-- ============================================

-- Test Function 1: Doctor appointment count
SELECT fn_get_doctor_appointment_count(41) as DOCTOR_41_APPOINTMENTS FROM DUAL;

-- Test Function 2: Patient total expenses
SELECT fn_get_patient_total_expenses(8) as PATIENT_8_EXPENSES FROM DUAL;

-- Test Function 3: Bed occupancy (overall)
SELECT fn_calculate_bed_occupancy(NULL) as OVERALL_OCCUPANCY FROM DUAL;

-- Test Function 3: Bed occupancy by ward
SELECT DISTINCT WARD_NAME,
       fn_calculate_bed_occupancy(WARD_NAME) as OCCUPANCY_RATE
FROM HOSPITAL_BEDS
ORDER BY OCCUPANCY_RATE DESC;

-- ============================================
-- TEST TRIGGER
-- ============================================

-- View current appointment logs
SELECT * FROM APPOINTMENT_LOGS ORDER BY CHANGED_AT DESC;

-- To test trigger, update an appointment status:
-- UPDATE DOCTORS_APPOINTMENTS SET STATUS = 'COMPLETED' WHERE ID = 63;
-- Then check: SELECT * FROM APPOINTMENT_LOGS;
