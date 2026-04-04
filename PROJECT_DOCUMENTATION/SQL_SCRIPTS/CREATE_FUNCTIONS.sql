-- ============================================
-- CREATE SQL FUNCTIONS
-- Run this if functions don't exist yet
-- ============================================

-- ============================================
-- FUNCTION 1: Get Doctor Appointment Count
-- ============================================
CREATE OR REPLACE FUNCTION fn_get_doctor_appointment_count(
  p_doctor_id IN NUMBER
) RETURN NUMBER
IS
  v_count NUMBER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM DOCTORS_APPOINTMENTS
  WHERE DOCTOR_ID = p_doctor_id;
  
  RETURN v_count;
END;
/

-- ============================================
-- FUNCTION 2: Calculate Bed Occupancy Rate (Overall)
-- ============================================
CREATE OR REPLACE FUNCTION fn_calculate_bed_occupancy(
  p_ward_name IN VARCHAR2 DEFAULT NULL
) RETURN NUMBER
IS
  v_total_beds NUMBER;
  v_occupied_beds NUMBER;
  v_occupancy_rate NUMBER;
BEGIN
  -- Count total beds (all or by ward)
  IF p_ward_name IS NULL THEN
    SELECT COUNT(*) INTO v_total_beds FROM HOSPITAL_BEDS;
  ELSE
    SELECT COUNT(*) INTO v_total_beds
    FROM HOSPITAL_BEDS
    WHERE WARD_NAME = p_ward_name;
  END IF;
  
  IF v_total_beds = 0 THEN
    RETURN 0;
  END IF;
  
  -- Count occupied beds
  IF p_ward_name IS NULL THEN
    SELECT COUNT(*) INTO v_occupied_beds
    FROM HOSPITAL_BEDS
    WHERE UPPER(STATUS) = 'OCCUPIED';
  ELSE
    SELECT COUNT(*) INTO v_occupied_beds
    FROM HOSPITAL_BEDS
    WHERE WARD_NAME = p_ward_name 
      AND UPPER(STATUS) = 'OCCUPIED';
  END IF;
  
  -- Calculate percentage
  v_occupancy_rate := (v_occupied_beds * 100.0) / v_total_beds;
  
  RETURN ROUND(v_occupancy_rate, 2);
END;
/

-- ============================================
-- FUNCTION 3: Get Patient Total Expenses
-- ============================================
CREATE OR REPLACE FUNCTION fn_get_patient_total_expenses(
  p_patient_id IN NUMBER
) RETURN NUMBER
IS
  v_total_expenses NUMBER := 0;
BEGIN
  -- Sum all bills for this patient's appointments
  SELECT NVL(SUM(b.TOTAL_AMOUNT), 0)
  INTO v_total_expenses
  FROM BILLS b
  INNER JOIN DOCTORS_APPOINTMENTS da ON b.APPOINTMENT_ID = da.ID
  WHERE da.PATIENT_ID = p_patient_id;
  
  RETURN v_total_expenses;
END;
/

-- ============================================
-- VERIFY FUNCTIONS WERE CREATED
-- ============================================
SELECT 'Checking if functions were created...' as STATUS FROM DUAL;

SELECT object_name, object_type, status 
FROM user_objects 
WHERE object_type = 'FUNCTION'
  AND object_name IN (
    'FN_GET_DOCTOR_APPOINTMENT_COUNT',
    'FN_CALCULATE_BED_OCCUPANCY', 
    'FN_GET_PATIENT_TOTAL_EXPENSES'
  )
ORDER BY object_name;

-- You should see 3 rows with STATUS = 'VALID'

SELECT 'Functions created successfully!' as MESSAGE FROM DUAL;
SELECT 'Now run VERIFY_FUNCTIONS.sql to test them' as NEXT_STEP FROM DUAL;
