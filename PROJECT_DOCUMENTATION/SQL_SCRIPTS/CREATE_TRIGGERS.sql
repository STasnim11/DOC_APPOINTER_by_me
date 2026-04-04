-- ============================================
-- DOCAPPOINTER - DATABASE TRIGGERS
-- ============================================
-- Purpose: Data validation and audit logging
-- Author: System
-- Date: 2026-04-05
-- ============================================

-- ============================================
-- 1. AUDIT LOG TABLE (Shadow Table)
-- ============================================
-- Stores all sensitive operations for security auditing

CREATE TABLE AUDIT_LOG (
    ID NUMBER PRIMARY KEY,
    TABLE_NAME VARCHAR2(50) NOT NULL,
    OPERATION VARCHAR2(10) NOT NULL,
    RECORD_ID NUMBER,
    OLD_VALUE CLOB,
    NEW_VALUE CLOB,
    CHANGED_BY VARCHAR2(100),
    CHANGED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    IP_ADDRESS VARCHAR2(50),
    DESCRIPTION VARCHAR2(500)
);

CREATE SEQUENCE AUDIT_LOG_SEQ START WITH 1 INCREMENT BY 1;

-- ============================================
-- 2. TRIGGER: Validate Doctor License Format
-- ============================================
-- Ensures doctor license follows proper format before insert/update

CREATE OR REPLACE TRIGGER trg_validate_doctor_license
BEFORE INSERT OR UPDATE OF LICENSE ON DOCTOR
FOR EACH ROW
DECLARE
    v_license_length NUMBER;
BEGIN
    -- Check if license is provided
    IF :NEW.LICENSE IS NOT NULL THEN
        v_license_length := LENGTH(:NEW.LICENSE);
        
        -- Validate license length (must be between 6 and 20 characters)
        IF v_license_length < 6 OR v_license_length > 20 THEN
            RAISE_APPLICATION_ERROR(-20001, 
                'Doctor license must be between 6 and 20 characters');
        END IF;
        
        -- Validate license format (alphanumeric only)
        IF NOT REGEXP_LIKE(:NEW.LICENSE, '^[A-Z0-9]+$') THEN
            RAISE_APPLICATION_ERROR(-20002, 
                'Doctor license must contain only uppercase letters and numbers');
        END IF;
    END IF;
END;
/

-- ============================================
-- 3. TRIGGER: Validate Doctor Experience
-- ============================================
-- Ensures experience years is reasonable before insert/update

CREATE OR REPLACE TRIGGER trg_validate_doctor_experience
BEFORE INSERT OR UPDATE OF EXPERIENCE_YEARS ON DOCTOR
FOR EACH ROW
BEGIN
    -- Validate experience years (0-60 years)
    IF :NEW.EXPERIENCE_YEARS IS NOT NULL THEN
        IF :NEW.EXPERIENCE_YEARS < 0 THEN
            RAISE_APPLICATION_ERROR(-20003, 
                'Experience years cannot be negative');
        END IF;
        
        IF :NEW.EXPERIENCE_YEARS > 60 THEN
            RAISE_APPLICATION_ERROR(-20004, 
                'Experience years cannot exceed 60 years');
        END IF;
    END IF;
END;
/

-- ============================================
-- 4. TRIGGER: Validate Doctor Fees
-- ============================================
-- Ensures consultation fees are within acceptable range

CREATE OR REPLACE TRIGGER trg_validate_doctor_fees
BEFORE INSERT OR UPDATE OF FEES ON DOCTOR
FOR EACH ROW
BEGIN
    IF :NEW.FEES IS NOT NULL THEN
        -- Minimum fee: 100 Taka
        IF :NEW.FEES < 100 THEN
            RAISE_APPLICATION_ERROR(-20005, 
                'Consultation fee cannot be less than 100 Taka');
        END IF;
        
        -- Maximum fee: 50000 Taka
        IF :NEW.FEES > 50000 THEN
            RAISE_APPLICATION_ERROR(-20006, 
                'Consultation fee cannot exceed 50,000 Taka');
        END IF;
    END IF;
END;
/

-- ============================================
-- 5. TRIGGER: Audit User Changes
-- ============================================
-- Logs all changes to USERS table for security

CREATE OR REPLACE TRIGGER trg_audit_users
AFTER INSERT OR UPDATE OR DELETE ON USERS
FOR EACH ROW
DECLARE
    v_operation VARCHAR2(10);
    v_old_value CLOB;
    v_new_value CLOB;
    v_description VARCHAR2(500);
BEGIN
    -- Determine operation type
    IF INSERTING THEN
        v_operation := 'INSERT';
        v_new_value := 'Name: ' || :NEW.NAME || ', Email: ' || :NEW.EMAIL || ', Role: ' || :NEW.ROLE;
        v_description := 'New user registered: ' || :NEW.EMAIL;
        
    ELSIF UPDATING THEN
        v_operation := 'UPDATE';
        v_old_value := 'Name: ' || :OLD.NAME || ', Email: ' || :OLD.EMAIL || ', Role: ' || :OLD.ROLE;
        v_new_value := 'Name: ' || :NEW.NAME || ', Email: ' || :NEW.EMAIL || ', Role: ' || :NEW.ROLE;
        v_description := 'User updated: ' || :NEW.EMAIL;
        
    ELSIF DELETING THEN
        v_operation := 'DELETE';
        v_old_value := 'Name: ' || :OLD.NAME || ', Email: ' || :OLD.EMAIL || ', Role: ' || :OLD.ROLE;
        v_description := 'User deleted: ' || :OLD.EMAIL;
    END IF;
    
    -- Insert audit log
    INSERT INTO AUDIT_LOG (
        ID, TABLE_NAME, OPERATION, RECORD_ID, 
        OLD_VALUE, NEW_VALUE, CHANGED_BY, DESCRIPTION
    ) VALUES (
        AUDIT_LOG_SEQ.NEXTVAL, 
        'USERS', 
        v_operation, 
        COALESCE(:NEW.ID, :OLD.ID),
        v_old_value, 
        v_new_value, 
        USER,
        v_description
    );
END;
/

-- ============================================
-- 6. TRIGGER: Audit Appointment Changes
-- ============================================
-- Logs appointment status changes for tracking

CREATE OR REPLACE TRIGGER trg_audit_appointments
AFTER UPDATE OF STATUS ON DOCTORS_APPOINTMENTS
FOR EACH ROW
WHEN (OLD.STATUS != NEW.STATUS)
DECLARE
    v_description VARCHAR2(500);
BEGIN
    v_description := 'Appointment #' || :NEW.ID || ' status changed from ' || 
                     :OLD.STATUS || ' to ' || :NEW.STATUS;
    
    INSERT INTO AUDIT_LOG (
        ID, TABLE_NAME, OPERATION, RECORD_ID, 
        OLD_VALUE, NEW_VALUE, CHANGED_BY, DESCRIPTION
    ) VALUES (
        AUDIT_LOG_SEQ.NEXTVAL,
        'DOCTORS_APPOINTMENTS',
        'UPDATE',
        :NEW.ID,
        'Status: ' || :OLD.STATUS,
        'Status: ' || :NEW.STATUS,
        USER,
        v_description
    );
END;
/

-- ============================================
-- 7. TRIGGER: Validate Appointment Date
-- ============================================
-- Ensures appointments are not booked in the past

CREATE OR REPLACE TRIGGER trg_validate_appointment_date
BEFORE INSERT OR UPDATE OF APPOINTMENT_DATE ON DOCTORS_APPOINTMENTS
FOR EACH ROW
BEGIN
    -- Check if appointment date is in the past
    IF :NEW.APPOINTMENT_DATE < TRUNC(SYSDATE) THEN
        RAISE_APPLICATION_ERROR(-20007, 
            'Cannot book appointment in the past');
    END IF;
    
    -- Check if appointment is too far in future (more than 6 months)
    IF :NEW.APPOINTMENT_DATE > ADD_MONTHS(SYSDATE, 6) THEN
        RAISE_APPLICATION_ERROR(-20008, 
            'Cannot book appointment more than 6 months in advance');
    END IF;
END;
/

-- ============================================
-- 8. TRIGGER: Validate Medicine Stock
-- ============================================
-- Ensures stock quantity is never negative

CREATE OR REPLACE TRIGGER trg_validate_medicine_stock
BEFORE INSERT OR UPDATE OF STOCK_QUANTITY ON MEDICINE
FOR EACH ROW
BEGIN
    IF :NEW.STOCK_QUANTITY IS NOT NULL THEN
        IF :NEW.STOCK_QUANTITY < 0 THEN
            RAISE_APPLICATION_ERROR(-20009, 
                'Medicine stock quantity cannot be negative');
        END IF;
    END IF;
END;
/

-- ============================================
-- 9. TRIGGER: Audit Medicine Stock Changes
-- ============================================
-- Logs all medicine stock changes for inventory tracking

CREATE OR REPLACE TRIGGER trg_audit_medicine_stock
AFTER UPDATE OF STOCK_QUANTITY ON MEDICINE
FOR EACH ROW
WHEN (OLD.STOCK_QUANTITY != NEW.STOCK_QUANTITY)
DECLARE
    v_description VARCHAR2(500);
    v_change NUMBER;
BEGIN
    v_change := :NEW.STOCK_QUANTITY - :OLD.STOCK_QUANTITY;
    
    IF v_change > 0 THEN
        v_description := 'Medicine "' || :NEW.NAME || '" stock increased by ' || v_change;
    ELSE
        v_description := 'Medicine "' || :NEW.NAME || '" stock decreased by ' || ABS(v_change);
    END IF;
    
    INSERT INTO AUDIT_LOG (
        ID, TABLE_NAME, OPERATION, RECORD_ID,
        OLD_VALUE, NEW_VALUE, CHANGED_BY, DESCRIPTION
    ) VALUES (
        AUDIT_LOG_SEQ.NEXTVAL,
        'MEDICINE',
        'UPDATE',
        :NEW.ID,
        'Stock: ' || :OLD.STOCK_QUANTITY,
        'Stock: ' || :NEW.STOCK_QUANTITY,
        USER,
        v_description
    );
END;
/

-- ============================================
-- 10. TRIGGER: Validate Bed Price
-- ============================================
-- Ensures bed prices are reasonable

CREATE OR REPLACE TRIGGER trg_validate_bed_price
BEFORE INSERT OR UPDATE OF PRICE_PER_DAY ON BED
FOR EACH ROW
BEGIN
    IF :NEW.PRICE_PER_DAY IS NOT NULL THEN
        -- Minimum price: 500 Taka per day
        IF :NEW.PRICE_PER_DAY < 500 THEN
            RAISE_APPLICATION_ERROR(-20010, 
                'Bed price cannot be less than 500 Taka per day');
        END IF;
        
        -- Maximum price: 100000 Taka per day
        IF :NEW.PRICE_PER_DAY > 100000 THEN
            RAISE_APPLICATION_ERROR(-20011, 
                'Bed price cannot exceed 100,000 Taka per day');
        END IF;
    END IF;
END;
/

-- ============================================
-- 11. TRIGGER: Auto-update Bed Status
-- ============================================
-- Automatically updates bed status when booked/released

CREATE OR REPLACE TRIGGER trg_update_bed_status_on_booking
AFTER INSERT ON BED_BOOKING
FOR EACH ROW
BEGIN
    -- Mark bed as occupied when booked
    UPDATE BED
    SET STATUS = 'OCCUPIED'
    WHERE ID = :NEW.BED_ID;
END;
/

-- ============================================
-- 12. TRIGGER: Validate Lab Test Price
-- ============================================
-- Ensures lab test prices are within acceptable range

CREATE OR REPLACE TRIGGER trg_validate_lab_test_price
BEFORE INSERT OR UPDATE OF PRICE ON LAB_TEST
FOR EACH ROW
BEGIN
    IF :NEW.PRICE IS NOT NULL THEN
        -- Minimum price: 100 Taka
        IF :NEW.PRICE < 100 THEN
            RAISE_APPLICATION_ERROR(-20012, 
                'Lab test price cannot be less than 100 Taka');
        END IF;
        
        -- Maximum price: 50000 Taka
        IF :NEW.PRICE > 50000 THEN
            RAISE_APPLICATION_ERROR(-20013, 
                'Lab test price cannot exceed 50,000 Taka');
        END IF;
    END IF;
END;
/

-- ============================================
-- 13. TRIGGER: Audit Doctor License Changes
-- ============================================
-- Logs all doctor license changes for compliance and security

CREATE OR REPLACE TRIGGER trg_audit_doctor_license
AFTER UPDATE OF LICENSE ON DOCTOR
FOR EACH ROW
WHEN (OLD.LICENSE IS NULL OR OLD.LICENSE != NEW.LICENSE)
DECLARE
    v_description VARCHAR2(500);
    v_doctor_name VARCHAR2(200);
BEGIN
    -- Get doctor name from USERS table
    BEGIN
        SELECT u.NAME INTO v_doctor_name
        FROM USERS u
        WHERE u.ID = :NEW.USER_ID;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            v_doctor_name := 'Unknown Doctor';
    END;
    
    -- Create description
    IF :OLD.LICENSE IS NULL THEN
        v_description := 'Doctor "' || v_doctor_name || '" license added: ' || :NEW.LICENSE;
    ELSE
        v_description := 'Doctor "' || v_doctor_name || '" license changed from ' || 
                        :OLD.LICENSE || ' to ' || :NEW.LICENSE;
    END IF;
    
    -- Insert audit log
    INSERT INTO AUDIT_LOG (
        ID, TABLE_NAME, OPERATION, RECORD_ID,
        OLD_VALUE, NEW_VALUE, CHANGED_BY, DESCRIPTION
    ) VALUES (
        AUDIT_LOG_SEQ.NEXTVAL,
        'DOCTOR',
        'UPDATE',
        :NEW.ID,
        'License: ' || NVL(:OLD.LICENSE, 'NULL'),
        'License: ' || :NEW.LICENSE,
        USER,
        v_description
    );
END;
/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all triggers
SELECT trigger_name, table_name, triggering_event, status
FROM user_triggers
WHERE trigger_name LIKE 'TRG_%'
ORDER BY trigger_name;

-- View audit log
SELECT * FROM AUDIT_LOG ORDER BY CHANGED_AT DESC;

-- Count audit entries by table
SELECT TABLE_NAME, OPERATION, COUNT(*) as COUNT
FROM AUDIT_LOG
GROUP BY TABLE_NAME, OPERATION
ORDER BY TABLE_NAME, OPERATION;

COMMIT;
