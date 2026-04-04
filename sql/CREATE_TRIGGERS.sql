-- ============================================
-- DOCAPPOINTER - DATABASE TRIGGER
-- ============================================

-- ============================================
-- Step 1: Create Log Table
-- ============================================
CREATE TABLE APPOINTMENT_LOGS (
    ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    APPOINTMENT_ID NUMBER,
    OLD_STATUS VARCHAR2(50),
    NEW_STATUS VARCHAR2(50),
    CHANGED_AT DATE DEFAULT SYSDATE
);

-- ============================================
-- Step 2: Create Trigger
-- ============================================
CREATE OR REPLACE TRIGGER trg_appointment_status_log
AFTER UPDATE OF STATUS ON DOCTORS_APPOINTMENTS
FOR EACH ROW
BEGIN
    IF :OLD.STATUS != :NEW.STATUS THEN
        INSERT INTO APPOINTMENT_LOGS (APPOINTMENT_ID, OLD_STATUS, NEW_STATUS, CHANGED_AT)
        VALUES (:OLD.ID, :OLD.STATUS, :NEW.STATUS, SYSDATE);
    END IF;
END;
/

-- ============================================
-- VERIFY TRIGGER WAS CREATED
-- ============================================
SELECT trigger_name, table_name, status
FROM user_triggers
WHERE trigger_name = 'TRG_APPOINTMENT_STATUS_LOG';
