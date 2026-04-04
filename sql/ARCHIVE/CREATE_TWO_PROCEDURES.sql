-- ============================================
-- DOCAPPOINTER - 2 STORED PROCEDURES
-- Run this file in your Oracle database
-- ============================================

-- ============================================
-- PROCEDURE 1: Book Appointment with Validation
-- ============================================
-- Multi-step workflow: validates slot, checks availability, books appointment
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
  -- Step 1: Validate time slot exists and belongs to doctor
  BEGIN
    SELECT STATUS, DOCTOR_ID, START_TIME, END_TIME 
    INTO v_slot_status, v_slot_doctor_id, v_start_time, v_end_time
    FROM TIME_SLOTS
    WHERE ID = p_time_slot_id;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      RAISE_APPLICATION_ERROR(-20003, 'Time slot not found');
  END;
  
  -- Step 2: Verify slot belongs to correct doctor
  IF v_slot_doctor_id != p_doctor_id THEN
    RAISE_APPLICATION_ERROR(-20003, 'Time slot does not belong to this doctor');
  END IF;
  
  -- Step 3: Check slot availability
  IF UPPER(v_slot_status) != 'AVAILABLE' THEN
    RAISE_APPLICATION_ERROR(-20004, 'Time slot is not available');
  END IF;
  
  -- Step 4: Check for duplicate appointments
  SELECT COUNT(*) INTO v_existing_count
  FROM DOCTORS_APPOINTMENTS
  WHERE DOCTOR_ID = p_doctor_id
    AND APPOINTMENT_DATE = p_appointment_date
    AND TIME_SLOT_ID = p_time_slot_id
    AND UPPER(STATUS) = 'BOOKED';
  
  IF v_existing_count > 0 THEN
    RAISE_APPLICATION_ERROR(-20005, 'This slot is already booked');
  END IF;
  
  -- Step 5: Insert appointment with BOOKED status
  INSERT INTO DOCTORS_APPOINTMENTS (
    PATIENT_ID, DOCTOR_ID, APPOINTMENT_DATE, TIME_SLOT_ID, 
    STATUS, TYPE, START_TIME, END_TIME
  ) VALUES (
    p_patient_id, p_doctor_id, p_appointment_date, p_time_slot_id, 
    'BOOKED', p_appointment_type, v_start_time, v_end_time
  ) RETURNING ID INTO p_appointment_id;
  
  -- Step 6: Commit transaction
  COMMIT;
  
  DBMS_OUTPUT.PUT_LINE('✅ Appointment booked successfully. ID: ' || p_appointment_id);
END;
/

-- ============================================
-- PROCEDURE 2: Generate Bill for Appointment
-- ============================================
-- Multi-step workflow: calculates costs, generates bill
CREATE OR REPLACE PROCEDURE sp_generate_bill(
  p_appointment_id IN NUMBER,
  p_bill_id OUT NUMBER
)
IS
  v_patient_id NUMBER;
  v_doctor_id NUMBER;
  v_consultation_fee NUMBER := 0;
  v_medicine_cost NUMBER := 0;
  v_test_cost NUMBER := 0;
  v_total_amount NUMBER;
  v_prescription_id NUMBER;
BEGIN
  -- Step 1: Get appointment details
  BEGIN
    SELECT PATIENT_ID, DOCTOR_ID 
    INTO v_patient_id, v_doctor_id
    FROM DOCTORS_APPOINTMENTS 
    WHERE ID = p_appointment_id;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      RAISE_APPLICATION_ERROR(-20007, 'Appointment not found');
  END;
  
  -- Step 2: Get doctor's consultation fee
  BEGIN
    SELECT NVL(FEES, 0) 
    INTO v_consultation_fee
    FROM DOCTOR 
    WHERE ID = v_doctor_id;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      v_consultation_fee := 0;
  END;
  
  -- Step 3: Calculate medicine costs from prescription (if exists)
  BEGIN
    SELECT ID INTO v_prescription_id
    FROM PRESCRIPTION
    WHERE APPOINTMENT_ID = p_appointment_id;
    
    -- Sum medicine prices
    SELECT NVL(SUM(m.PRICE * pm.QUANTITY), 0) 
    INTO v_medicine_cost
    FROM PRESCRIBED_MED pm
    INNER JOIN MEDICINES m ON pm.MEDICATION_ID = m.ID
    WHERE pm.PRESCRIPTION_ID = v_prescription_id;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      v_medicine_cost := 0;
  END;
  
  -- Step 4: Calculate lab test costs (if any)
  BEGIN
    SELECT NVL(SUM(lt.PRICE), 0) 
    INTO v_test_cost
    FROM LAB_TEST_APPOINTMENTS lta
    INNER JOIN LAB_TESTS lt ON lta.TEST_ID = lt.ID
    WHERE lta.APPOINTMENT_ID = p_appointment_id;
  EXCEPTION
    WHEN OTHERS THEN
      v_test_cost := 0;
  END;
  
  -- Step 5: Calculate total amount
  v_total_amount := v_consultation_fee + v_medicine_cost + v_test_cost;
  
  -- Step 6: Insert bill record
  INSERT INTO BILLS (
    APPOINTMENT_ID, 
    PATIENT_ID,
    DOCTOR_ID,
    CONSULTATION_FEE,
    MEDICINE_COST,
    TEST_COST,
    TOTAL_AMOUNT, 
    STATUS, 
    ISSUE_DATE
  ) VALUES (
    p_appointment_id,
    v_patient_id,
    v_doctor_id,
    v_consultation_fee,
    v_medicine_cost,
    v_test_cost,
    v_total_amount, 
    'PENDING', 
    SYSDATE
  ) RETURNING ID INTO p_bill_id;
  
  -- Step 7: Commit transaction
  COMMIT;
  
  DBMS_OUTPUT.PUT_LINE('✅ Bill generated successfully. ID: ' || p_bill_id);
  DBMS_OUTPUT.PUT_LINE('   Consultation: ' || v_consultation_fee || ' Taka');
  DBMS_OUTPUT.PUT_LINE('   Medicines: ' || v_medicine_cost || ' Taka');
  DBMS_OUTPUT.PUT_LINE('   Tests: ' || v_test_cost || ' Taka');
  DBMS_OUTPUT.PUT_LINE('   Total: ' || v_total_amount || ' Taka');
END;
/

-- ============================================
-- VERIFY PROCEDURES WERE CREATED
-- ============================================
SET SERVEROUTPUT ON;

SELECT 'Checking if procedures were created...' as STATUS FROM DUAL;

SELECT object_name, object_type, status 
FROM user_objects 
WHERE object_type = 'PROCEDURE'
  AND object_name IN ('SP_BOOK_APPOINTMENT', 'SP_GENERATE_BILL')
ORDER BY object_name;

-- Expected output: 2 rows with STATUS = 'VALID'

SELECT '✅ Setup complete! You now have 2 stored procedures.' as MESSAGE FROM DUAL;

-- ============================================
-- TEST THE PROCEDURES
-- ============================================

-- Test sp_book_appointment:
/*
DECLARE
  v_appointment_id NUMBER;
BEGIN
  sp_book_appointment(
    p_patient_id => 1,
    p_doctor_id => 2,
    p_appointment_date => TO_DATE('2026-04-10', 'YYYY-MM-DD'),
    p_time_slot_id => 5,
    p_appointment_type => 'CONSULTATION',
    p_appointment_id => v_appointment_id
  );
  DBMS_OUTPUT.PUT_LINE('New Appointment ID: ' || v_appointment_id);
END;
/
*/

-- Test sp_generate_bill:
/*
DECLARE
  v_bill_id NUMBER;
BEGIN
  sp_generate_bill(
    p_appointment_id => 123,
    p_bill_id => v_bill_id
  );
  DBMS_OUTPUT.PUT_LINE('New Bill ID: ' || v_bill_id);
END;
/
*/
