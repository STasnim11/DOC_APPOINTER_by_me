-- ============================================
-- FIX DATABASE FUNCTIONS TO MATCH YOUR SCHEMA
-- Run this to update the functions
-- ============================================

-- ============================================
-- FIX 1: Update bed occupancy function to use correct table
-- ============================================
CREATE OR REPLACE FUNCTION fn_calculate_bed_occupancy(
  p_branch_id IN NUMBER
) RETURN NUMBER
IS
  v_total_beds NUMBER;
  v_occupied_beds NUMBER;
  v_occupancy_rate NUMBER;
BEGIN
  -- Count total beds (use HOSPITAL_BEDS table)
  SELECT COUNT(*) INTO v_total_beds
  FROM HOSPITAL_BEDS
  WHERE BRANCH_ID = p_branch_id;
  
  IF v_total_beds = 0 THEN
    RETURN 0;
  END IF;
  
  -- Count occupied beds
  SELECT COUNT(*) INTO v_occupied_beds
  FROM HOSPITAL_BEDS
  WHERE BRANCH_ID = p_branch_id 
    AND UPPER(STATUS) = 'OCCUPIED';
  
  v_occupancy_rate := (v_occupied_beds * 100.0) / v_total_beds;
  
  RETURN ROUND(v_occupancy_rate, 2);
END;
/

-- ============================================
-- FIX 2: Update appointment booking procedure to use BOOKED status
-- ============================================
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
  -- Validate time slot exists and belongs to doctor
  BEGIN
    SELECT STATUS, DOCTOR_ID, START_TIME, END_TIME 
    INTO v_slot_status, v_slot_doctor_id, v_start_time, v_end_time
    FROM TIME_SLOTS
    WHERE ID = p_time_slot_id;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      RAISE_APPLICATION_ERROR(-20003, 'Time slot not found');
  END;
  
  IF v_slot_doctor_id != p_doctor_id THEN
    RAISE_APPLICATION_ERROR(-20003, 'Time slot does not belong to this doctor');
  END IF;
  
  IF UPPER(v_slot_status) != 'AVAILABLE' THEN
    RAISE_APPLICATION_ERROR(-20004, 'Time slot is not available');
  END IF;
  
  -- Check for duplicate appointments
  SELECT COUNT(*) INTO v_existing_count
  FROM DOCTORS_APPOINTMENTS
  WHERE DOCTOR_ID = p_doctor_id
    AND APPOINTMENT_DATE = p_appointment_date
    AND TIME_SLOT_ID = p_time_slot_id
    AND UPPER(STATUS) = 'BOOKED';
  
  IF v_existing_count > 0 THEN
    RAISE_APPLICATION_ERROR(-20005, 'This slot is already booked');
  END IF;
  
  -- Insert appointment with BOOKED status and times
  INSERT INTO DOCTORS_APPOINTMENTS (
    PATIENT_ID, DOCTOR_ID, APPOINTMENT_DATE, TIME_SLOT_ID, 
    STATUS, TYPE, START_TIME, END_TIME
  ) VALUES (
    p_patient_id, p_doctor_id, p_appointment_date, p_time_slot_id, 
    'BOOKED', p_appointment_type, v_start_time, v_end_time
  ) RETURNING ID INTO p_appointment_id;
  
  COMMIT;
END;
/

-- ============================================
-- TEST THE FUNCTIONS
-- ============================================

-- Test 1: Check if functions work
SELECT 'Testing fn_get_doctor_appointment_count...' as TEST FROM DUAL;
SELECT fn_get_doctor_appointment_count(1) as DOCTOR_1_APPOINTMENTS FROM DUAL;

SELECT 'Testing fn_calculate_bed_occupancy...' as TEST FROM DUAL;
SELECT fn_calculate_bed_occupancy(1) as BRANCH_1_OCCUPANCY FROM DUAL;

SELECT 'Testing fn_get_patient_total_expenses...' as TEST FROM DUAL;
SELECT fn_get_patient_total_expenses(1) as PATIENT_1_EXPENSES FROM DUAL;

-- Show all doctors with appointment counts
SELECT 'All doctors with appointment counts:' as INFO FROM DUAL;
SELECT 
  d.ID as DOCTOR_ID,
  u.NAME as DOCTOR_NAME,
  fn_get_doctor_appointment_count(d.ID) as APPOINTMENT_COUNT
FROM DOCTOR d
INNER JOIN USERS u ON d.USER_ID = u.ID
ORDER BY APPOINTMENT_COUNT DESC
FETCH FIRST 10 ROWS ONLY;

-- Show all branches with occupancy
SELECT 'All branches with bed occupancy:' as INFO FROM DUAL;
SELECT 
  hb.ID as BRANCH_ID,
  hb.NAME as BRANCH_NAME,
  fn_calculate_bed_occupancy(hb.ID) as OCCUPANCY_RATE
FROM HOSPITAL_BRANCHES hb
ORDER BY OCCUPANCY_RATE DESC;

-- Show all patients with expenses
SELECT 'All patients with expenses:' as INFO FROM DUAL;
SELECT 
  p.ID as PATIENT_ID,
  u.NAME as PATIENT_NAME,
  fn_get_patient_total_expenses(p.ID) as TOTAL_EXPENSES
FROM PATIENT p
INNER JOIN USERS u ON p.USER_ID = u.ID
WHERE fn_get_patient_total_expenses(p.ID) > 0
ORDER BY TOTAL_EXPENSES DESC
FETCH FIRST 10 ROWS ONLY;
