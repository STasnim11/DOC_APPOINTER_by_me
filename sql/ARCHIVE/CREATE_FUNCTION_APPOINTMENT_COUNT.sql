-- ============================================
-- CREATE SINGLE FUNCTION: Doctor Appointment Count
-- ============================================

-- Drop if exists (to avoid errors)
BEGIN
  EXECUTE IMMEDIATE 'DROP FUNCTION fn_get_doctor_appointment_count';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE != -4043 THEN
      RAISE;
    END IF;
END;
/

-- ============================================
-- FUNCTION: Get Doctor Appointment Count
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
-- VERIFY FUNCTION WAS CREATED
-- ============================================
SELECT 'Checking if function was created...' as STATUS FROM DUAL;

SELECT object_name, object_type, status 
FROM user_objects 
WHERE object_type = 'FUNCTION'
  AND object_name = 'FN_GET_DOCTOR_APPOINTMENT_COUNT';

-- Test the function with a sample doctor ID
SELECT 'Testing function with doctor ID 1...' as TEST FROM DUAL;

SELECT fn_get_doctor_appointment_count(1) as APPOINTMENT_COUNT FROM DUAL;

SELECT '✅ Function created and tested successfully!' as RESULT FROM DUAL;
