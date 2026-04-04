-- ============================================
-- DOCAPPOINTER - STORED PROCEDURE
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

-- Verify procedure was created
SELECT object_name, object_type, status 
FROM user_objects 
WHERE object_type = 'PROCEDURE'
  AND object_name = 'SP_BOOK_APPOINTMENT';
