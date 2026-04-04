-- ============================================
-- FIX PRESCRIPTION AND PRESCRIBED_MED AUTO-INCREMENT
-- ============================================

-- STEP 1: Check current max IDs
SELECT NVL(MAX(ID), 0) as MAX_PRESCRIPTION_ID FROM PRESCRIPTION;
SELECT NVL(MAX(ID), 0) as MAX_PRESCRIBED_MED_ID FROM PRESCRIBED_MED;

-- STEP 2: Create sequences using PL/SQL block
DECLARE
  v_max_presc_id NUMBER;
  v_max_presc_med_id NUMBER;
  v_seq_exists NUMBER;
BEGIN
  -- Get max ID from PRESCRIPTION
  SELECT NVL(MAX(ID), 0) INTO v_max_presc_id FROM PRESCRIPTION;
  
  -- Drop and recreate PRESCRIPTION_SEQ
  SELECT COUNT(*) INTO v_seq_exists 
  FROM user_sequences 
  WHERE sequence_name = 'PRESCRIPTION_SEQ';
  
  IF v_seq_exists > 0 THEN
    EXECUTE IMMEDIATE 'DROP SEQUENCE PRESCRIPTION_SEQ';
  END IF;
  
  EXECUTE IMMEDIATE 'CREATE SEQUENCE PRESCRIPTION_SEQ START WITH ' || (v_max_presc_id + 1) || ' INCREMENT BY 1';
  DBMS_OUTPUT.PUT_LINE('✅ Created PRESCRIPTION_SEQ starting at ' || (v_max_presc_id + 1));
  
  -- Get max ID from PRESCRIBED_MED
  SELECT NVL(MAX(ID), 0) INTO v_max_presc_med_id FROM PRESCRIBED_MED;
  
  -- Drop and recreate PRESCRIBED_MED_SEQ
  SELECT COUNT(*) INTO v_seq_exists 
  FROM user_sequences 
  WHERE sequence_name = 'PRESCRIBED_MED_SEQ';
  
  IF v_seq_exists > 0 THEN
    EXECUTE IMMEDIATE 'DROP SEQUENCE PRESCRIBED_MED_SEQ';
  END IF;
  
  EXECUTE IMMEDIATE 'CREATE SEQUENCE PRESCRIBED_MED_SEQ START WITH ' || (v_max_presc_med_id + 1) || ' INCREMENT BY 1';
  DBMS_OUTPUT.PUT_LINE('✅ Created PRESCRIBED_MED_SEQ starting at ' || (v_max_presc_med_id + 1));
END;
/

-- STEP 3: Create trigger for PRESCRIPTION
CREATE OR REPLACE TRIGGER TRG_PRESCRIPTION_ID
BEFORE INSERT ON PRESCRIPTION
FOR EACH ROW
BEGIN
  IF :NEW.ID IS NULL THEN
    :NEW.ID := PRESCRIPTION_SEQ.NEXTVAL;
  END IF;
END;
/

-- STEP 4: Create trigger for PRESCRIBED_MED
CREATE OR REPLACE TRIGGER TRG_PRESCRIBED_MED_ID
BEFORE INSERT ON PRESCRIBED_MED
FOR EACH ROW
BEGIN
  IF :NEW.ID IS NULL THEN
    :NEW.ID := PRESCRIBED_MED_SEQ.NEXTVAL;
  END IF;
END;
/

-- STEP 5: Verify everything
SELECT 'Sequences Created:' as STATUS FROM DUAL;
SELECT sequence_name, last_number 
FROM user_sequences 
WHERE sequence_name IN ('PRESCRIPTION_SEQ', 'PRESCRIBED_MED_SEQ');

SELECT 'Triggers Created:' as STATUS FROM DUAL;
SELECT trigger_name, status 
FROM user_triggers 
WHERE trigger_name IN ('TRG_PRESCRIPTION_ID', 'TRG_PRESCRIBED_MED_ID');

COMMIT;

-- ============================================
-- SUMMARY:
-- ✅ Created sequences for both tables
-- ✅ Created triggers for auto-ID generation
-- ✅ Backend can now insert without specifying IDs
-- ============================================
