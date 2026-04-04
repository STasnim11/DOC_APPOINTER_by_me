-- ============================================
-- COPY AND RUN THIS ENTIRE FILE IN YOUR ORACLE DATABASE
-- This creates the stored procedures needed for appointment booking
-- ============================================

-- ============================================
-- PROCEDURE 1: Book Appointment with Validation
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
-- PROCEDURE 2: Update Medicine Stock
-- ============================================
CREATE OR REPLACE PROCEDURE sp_update_medicine_stock(
  p_medication_id IN NUMBER,
  p_quantity IN NUMBER
)
IS
  v_current_stock NUMBER;
BEGIN
  SELECT STOCK_QUANTITY INTO v_current_stock
  FROM MEDICINES
  WHERE ID = p_medication_id;
  
  IF v_current_stock < p_quantity THEN
    RAISE_APPLICATION_ERROR(-20006, 'Insufficient stock for medicine');
  END IF;
  
  UPDATE MEDICINES
  SET STOCK_QUANTITY = STOCK_QUANTITY - p_quantity
  WHERE ID = p_medication_id;
  
  COMMIT;
END;
/

-- ============================================
-- PROCEDURE 3: Generate Bill (Optional - not used yet)
-- ============================================
CREATE OR REPLACE PROCEDURE sp_generate_bill(
  p_admin_id IN NUMBER,
  p_appointment_id IN NUMBER,
  p_consultation_fee IN NUMBER,
  p_bill_id OUT NUMBER
)
IS
  v_medicine_cost NUMBER := 0;
  v_test_cost NUMBER := 0;
  v_total_amount NUMBER;
  v_prescription_id NUMBER;
BEGIN
  -- Calculate medicine costs from prescription
  BEGIN
    SELECT p.ID INTO v_prescription_id
    FROM PRESCRIPTION p
    WHERE p.APPOINTMENT_ID = p_appointment_id;
    
    SELECT NVL(SUM(m.PRICE), 0) INTO v_medicine_cost
    FROM PRESCRIBED_MED pm
    INNER JOIN MEDICINES m ON pm.MEDICATION_ID = m.ID
    WHERE pm.PRESCRIPTION_ID = v_prescription_id;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      v_medicine_cost := 0;
  END;
  
  -- Calculate lab test costs
  SELECT NVL(SUM(lt.PRICE), 0) INTO v_test_cost
  FROM LAB_TEST_APPOINTMENTS lta
  INNER JOIN LAB_TESTS lt ON lta.TEST_ID = lt.ID
  INNER JOIN DOCTORS_APPOINTMENTS da ON lta.DOCTOR_ID = da.DOCTOR_ID
  WHERE da.ID = p_appointment_id;
  
  -- Calculate total
  v_total_amount := p_consultation_fee + v_medicine_cost + v_test_cost;
  
  -- Insert bill
  INSERT INTO BILLS (ADMIN_ID, APPOINTMENT_ID, TOTAL_AMOUNT, STATUS, ISSUE_DATE)
  VALUES (p_admin_id, p_appointment_id, v_total_amount, 'pending', SYSDATE)
  RETURNING ID INTO p_bill_id;
  
  COMMIT;
END;
/

-- ============================================
-- VERIFY PROCEDURES WERE CREATED
-- ============================================
SELECT 'Checking if procedures were created...' as STATUS FROM DUAL;

SELECT object_name, object_type, status 
FROM user_objects 
WHERE object_type = 'PROCEDURE'
  AND object_name IN ('SP_BOOK_APPOINTMENT', 'SP_UPDATE_MEDICINE_STOCK', 'SP_GENERATE_BILL')
ORDER BY object_name;

-- If you see 3 rows with STATUS = 'VALID', you're good to go!
-- If STATUS = 'INVALID', there's a compilation error

SELECT 'Setup complete! Restart your backend server.' as MESSAGE FROM DUAL;
