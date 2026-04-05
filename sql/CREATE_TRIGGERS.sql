-- ============================================
-- DOCAPPOINTER - DATABASE TRIGGERS
-- ============================================

-- ============================================
-- Step 1: Create Log Tables
-- ============================================

-- Appointment status log table
CREATE TABLE APPOINTMENT_LOGS (
    ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    APPOINTMENT_ID NUMBER,
    OLD_STATUS VARCHAR2(50),
    NEW_STATUS VARCHAR2(50),
    CHANGED_AT DATE DEFAULT SYSDATE
);

-- Doctor license log table
CREATE TABLE DOCTOR_LICENSE_LOGS (
    ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    DOCTOR_ID NUMBER,
    OLD_LICENSE VARCHAR2(50),
    NEW_LICENSE VARCHAR2(50),
    CHANGED_AT DATE DEFAULT SYSDATE
);

-- ============================================
-- Step 2: Create Triggers
-- ============================================

-- Trigger 1: Log appointment status changes
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

-- Trigger 2: Log doctor license changes
CREATE OR REPLACE TRIGGER trg_doctor_license_update
AFTER UPDATE OF LICENSE_NUMBER ON DOCTOR
FOR EACH ROW
BEGIN
    -- Log if license changed (handles NULL cases properly)
    IF (:OLD.LICENSE_NUMBER IS NULL AND :NEW.LICENSE_NUMBER IS NOT NULL) OR
       (:OLD.LICENSE_NUMBER IS NOT NULL AND :NEW.LICENSE_NUMBER IS NULL) OR
       (:OLD.LICENSE_NUMBER IS NOT NULL AND :NEW.LICENSE_NUMBER IS NOT NULL AND :OLD.LICENSE_NUMBER != :NEW.LICENSE_NUMBER) THEN
        INSERT INTO DOCTOR_LICENSE_LOGS (DOCTOR_ID, OLD_LICENSE, NEW_LICENSE, CHANGED_AT)
        VALUES (:OLD.ID, :OLD.LICENSE_NUMBER, :NEW.LICENSE_NUMBER, SYSDATE);
    END IF;
END;
/

-- ============================================
-- VERIFY TRIGGERS WERE CREATED
-- ============================================
SELECT trigger_name, table_name, status
FROM user_triggers
WHERE trigger_name IN ('TRG_APPOINTMENT_STATUS_LOG', 'TRG_DOCTOR_LICENSE_UPDATE');
