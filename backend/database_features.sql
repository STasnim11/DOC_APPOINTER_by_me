-- ============================================
-- DATABASE FEATURES: TRIGGERS, FUNCTIONS, PROCEDURES
-- ============================================

-- ============================================
-- 1. TRIGGER: Auto-update timestamp on record modification
-- ============================================
CREATE OR REPLACE TRIGGER trg_update_medicines_timestamp
BEFORE UPDATE ON MEDICINES
FOR EACH ROW
BEGIN
  :NEW.UPDATED_AT := CURRENT_TIMESTAMP;
END;
/

CREATE OR REPLACE TRIGGER trg_update_labtests_timestamp
BEFORE UPDATE ON LAB_TESTS
FOR EACH ROW
BEGIN
  :NEW.UPDATED_AT := CURRENT_TIMESTAMP;
END;
/

CREATE OR REPLACE TRIGGER trg_update_beds_timestamp
BEFORE UPDATE ON HOSPITAL_BEDS
FOR EACH ROW
BEGIN
  :NEW.UPDATED_AT := CURRENT_TIMESTAMP;
END;
/

-- ============================================
-- 2. TRIGGER: Validate bed booking before insert
-- Ensures bed is available before booking
-- ============================================
CREATE OR REPLACE TRIGGER trg_validate_bed_booking
BEFORE INSERT ON BED_BOOKING_APPOINTMENTS
FOR EACH ROW
DECLARE
  v_bed_status VARCHAR2(20);
BEGIN
  -- Check if bed is available
  SELECT STATUS INTO v_bed_status
  FROM BEDS
  WHERE ID = :NEW.BED_ID;
  
  IF v_bed_status != 'available' THEN
    RAISE_APPLICATION_ERROR(-20001, 'Bed is not available for booking');
  END IF;
  
  -- Set default status if not provided
  IF :NEW.STATUS IS NULL THEN
    :NEW.STATUS := 'confirmed';
  END IF;
END;
/

-- ============================================
-- 3. TRIGGER: Auto-update bed status when booked
-- ============================================
CREATE OR REPLACE TRIGGER trg_update_bed_status_on_booking
AFTER INSERT ON BED_BOOKING_APPOINTMENTS
FOR EACH ROW
BEGIN
  UPDATE BEDS
  SET STATUS = 'occupied'
  WHERE ID = :NEW.BED_ID;
END;
/

-- ============================================
-- 4. TRIGGER: Validate medicine stock before prescription
-- ============================================
CREATE OR REPLACE TRIGGER trg_validate_medicine_stock
BEFORE INSERT ON PRESCRIBED_MED
FOR EACH ROW
DECLARE
  v_stock_qty NUMBER;
  v_medicine_name VARCHAR2(200);
BEGIN
  SELECT STOCK_QUANTITY, NAME INTO v_stock_qty, v_medicine_name
  FROM MEDICINES
  WHERE ID = :NEW.MEDICATION_ID;
  
  IF v_stock_qty <= 0 THEN
    RAISE_APPLICATION_ERROR(-20002, 
      'Medicine "' || v_medicine_name || '" is out of stock');
  END IF;
END;
/

-- ============================================
-- 5. FUNCTION: Calculate total appointments for a doctor
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
-- 6. FUNCTION: Calculate bed occupancy rate for a branch
-- ============================================
CREATE OR REPLACE FUNCTION fn_calculate_bed_occupancy(
  p_branch_id IN NUMBER
) RETURN NUMBER
IS
  v_total_beds NUMBER;
  v_occupied_beds NUMBER;
  v_occupancy_rate NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_total_beds
  FROM BEDS
  WHERE ADMIN_ID = p_branch_id;
  
  IF v_total_beds = 0 THEN
    RETURN 0;
  END IF;
  
  SELECT COUNT(*) INTO v_occupied_beds
  FROM BEDS
  WHERE ADMIN_ID = p_branch_id AND STATUS = 'occupied';
  
  v_occupancy_rate := (v_occupied_beds * 100.0) / v_total_beds;
  
  RETURN ROUND(v_occupancy_rate, 2);
END;
/

-- ============================================
-- 7. FUNCTION: Get patient's total medical expenses
-- ============================================
CREATE OR REPLACE FUNCTION fn_get_patient_total_expenses(
  p_patient_id IN NUMBER
) RETURN NUMBER
IS
  v_total_expenses NUMBER := 0;
BEGIN
  SELECT NVL(SUM(b.TOTAL_AMOUNT), 0)
  INTO v_total_expenses
  FROM BILLS b
  INNER JOIN DOCTORS_APPOINTMENTS da ON b.APPOINTMENT_ID = da.ID
  WHERE da.PATIENT_ID = p_patient_id;
  
  RETURN v_total_expenses;
END;
/

-- ============================================
-- 8. PROCEDURE: Book appointment with validation
-- Validates doctor availability and time slot
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
BEGIN
  -- Validate time slot exists and belongs to doctor
  SELECT STATUS, DOCTOR_ID INTO v_slot_status, v_slot_doctor_id
  FROM TIME_SLOTS
  WHERE ID = p_time_slot_id;
  
  IF v_slot_doctor_id != p_doctor_id THEN
    RAISE_APPLICATION_ERROR(-20003, 'Time slot does not belong to this doctor');
  END IF;
  
  IF v_slot_status != 'available' THEN
    RAISE_APPLICATION_ERROR(-20004, 'Time slot is not available');
  END IF;
  
  -- Check for duplicate appointments
  SELECT COUNT(*) INTO v_existing_count
  FROM DOCTORS_APPOINTMENTS
  WHERE PATIENT_ID = p_patient_id
    AND DOCTOR_ID = p_doctor_id
    AND APPOINTMENT_DATE = p_appointment_date
    AND TIME_SLOT_ID = p_time_slot_id;
  
  IF v_existing_count > 0 THEN
    RAISE_APPLICATION_ERROR(-20005, 'Appointment already exists for this time slot');
  END IF;
  
  -- Insert appointment
  INSERT INTO DOCTORS_APPOINTMENTS (
    PATIENT_ID, DOCTOR_ID, APPOINTMENT_DATE, TIME_SLOT_ID, STATUS, TYPE
  ) VALUES (
    p_patient_id, p_doctor_id, p_appointment_date, p_time_slot_id, 'scheduled', p_appointment_type
  ) RETURNING ID INTO p_appointment_id;
  
  COMMIT;
END;
/

-- ============================================
-- 9. PROCEDURE: Generate bill for appointment
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
-- 10. PROCEDURE: Update medicine stock after prescription
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
-- USAGE EXAMPLES
-- ============================================

-- Example 1: Get doctor appointment count
-- SELECT fn_get_doctor_appointment_count(1) FROM DUAL;

-- Example 2: Calculate bed occupancy
-- SELECT fn_calculate_bed_occupancy(1) FROM DUAL;

-- Example 3: Get patient expenses
-- SELECT fn_get_patient_total_expenses(1) FROM DUAL;

-- Example 4: Book appointment
-- DECLARE
--   v_appointment_id NUMBER;
-- BEGIN
--   sp_book_appointment(1, 1, SYSDATE, 1, 'consultation', v_appointment_id);
--   DBMS_OUTPUT.PUT_LINE('Appointment ID: ' || v_appointment_id);
-- END;
-- /

-- Example 5: Generate bill
-- DECLARE
--   v_bill_id NUMBER;
-- BEGIN
--   sp_generate_bill(1, 1, 500, v_bill_id);
--   DBMS_OUTPUT.PUT_LINE('Bill ID: ' || v_bill_id);
-- END;
-- /
