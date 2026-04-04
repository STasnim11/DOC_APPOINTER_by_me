-- ============================================
-- CREATE FUNCTION: Patient Total Expenses
-- ============================================

-- Drop if exists (to avoid errors)
BEGIN
  EXECUTE IMMEDIATE 'DROP FUNCTION fn_get_patient_total_expenses';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE != -4043 THEN
      RAISE;
    END IF;
END;
/

-- ============================================
-- FUNCTION: Get Patient Total Expenses
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
-- VERIFY FUNCTION WAS CREATED
-- ============================================
SELECT 'Checking if function was created...' as STATUS FROM DUAL;

SELECT object_name, object_type, status 
FROM user_objects 
WHERE object_type = 'FUNCTION'
  AND object_name = 'FN_GET_PATIENT_TOTAL_EXPENSES';

-- Test the function with a sample patient ID
SELECT 'Testing function with patient ID 8...' as TEST FROM DUAL;

SELECT fn_get_patient_total_expenses(8) as TOTAL_EXPENSES FROM DUAL;

-- Show all patients with their expenses
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

SELECT '✅ Function created and tested successfully!' as RESULT FROM DUAL;
