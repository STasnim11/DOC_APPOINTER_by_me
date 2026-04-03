-- ============================================
-- FIX ALL SPECIALIZATION ISSUES
-- ============================================

-- STEP 1: Remove duplicate Cardiology (keep ID=1, remove ID=7)
-- First, update any doctors using the duplicate to use the original
UPDATE DOC_SPECIALIZATION 
SET SPECIALIZATION_ID = 1 
WHERE SPECIALIZATION_ID = 7;

-- Delete the duplicate Cardiology
DELETE FROM SPECIALIZATION WHERE ID = 7 AND NAME = 'Cardiology';

COMMIT;

-- STEP 2: Create sequences starting from correct numbers
DECLARE
  v_max_spec_id NUMBER;
  v_max_doc_spec_id NUMBER;
  v_seq_exists NUMBER;
BEGIN
  -- Get max ID from SPECIALIZATION (should be 10 after deleting 7)
  SELECT NVL(MAX(ID), 0) INTO v_max_spec_id FROM SPECIALIZATION;
  
  -- Drop and recreate SPECIALIZATION_SEQ
  SELECT COUNT(*) INTO v_seq_exists FROM user_sequences WHERE sequence_name = 'SPECIALIZATION_SEQ';
  IF v_seq_exists > 0 THEN
    EXECUTE IMMEDIATE 'DROP SEQUENCE SPECIALIZATION_SEQ';
  END IF;
  EXECUTE IMMEDIATE 'CREATE SEQUENCE SPECIALIZATION_SEQ START WITH ' || (v_max_spec_id + 1) || ' INCREMENT BY 1';
  DBMS_OUTPUT.PUT_LINE('✅ Created SPECIALIZATION_SEQ starting at ' || (v_max_spec_id + 1));
  
  -- Get max ID from DOC_SPECIALIZATION
  SELECT NVL(MAX(ID), 0) INTO v_max_doc_spec_id FROM DOC_SPECIALIZATION;
  
  -- Drop and recreate DOC_SPECIALIZATION_SEQ
  SELECT COUNT(*) INTO v_seq_exists FROM user_sequences WHERE sequence_name = 'DOC_SPECIALIZATION_SEQ';
  IF v_seq_exists > 0 THEN
    EXECUTE IMMEDIATE 'DROP SEQUENCE DOC_SPECIALIZATION_SEQ';
  END IF;
  EXECUTE IMMEDIATE 'CREATE SEQUENCE DOC_SPECIALIZATION_SEQ START WITH ' || (v_max_doc_spec_id + 1) || ' INCREMENT BY 1';
  DBMS_OUTPUT.PUT_LINE('✅ Created DOC_SPECIALIZATION_SEQ starting at ' || (v_max_doc_spec_id + 1));
END;
/

-- STEP 3: Create trigger for SPECIALIZATION (auto-fills ID and ADMIN_ID)
CREATE OR REPLACE TRIGGER TRG_SPECIALIZATION_ID
BEFORE INSERT ON SPECIALIZATION
FOR EACH ROW
BEGIN
  -- Auto-generate ID if not provided
  IF :NEW.ID IS NULL THEN
    :NEW.ID := SPECIALIZATION_SEQ.NEXTVAL;
  END IF;
  
  -- Auto-fill ADMIN_ID with 1 if not provided (default admin)
  IF :NEW.ADMIN_ID IS NULL THEN
    :NEW.ADMIN_ID := 1;
  END IF;
END;
/

-- STEP 4: Create trigger for DOC_SPECIALIZATION (auto-fills ID only)
CREATE OR REPLACE TRIGGER TRG_DOC_SPECIALIZATION_ID
BEFORE INSERT ON DOC_SPECIALIZATION
FOR EACH ROW
BEGIN
  IF :NEW.ID IS NULL THEN
    :NEW.ID := DOC_SPECIALIZATION_SEQ.NEXTVAL;
  END IF;
END;
/

-- STEP 5: Verify everything
SELECT 'Sequences Created:' as STATUS FROM DUAL;
SELECT sequence_name, last_number FROM user_sequences 
WHERE sequence_name IN ('SPECIALIZATION_SEQ', 'DOC_SPECIALIZATION_SEQ');

SELECT 'Triggers Created:' as STATUS FROM DUAL;
SELECT trigger_name, status FROM user_triggers 
WHERE trigger_name IN ('TRG_SPECIALIZATION_ID', 'TRG_DOC_SPECIALIZATION_ID');

SELECT 'Remaining Specializations (no duplicates):' as STATUS FROM DUAL;
SELECT ID, NAME FROM SPECIALIZATION ORDER BY ID;

COMMIT;

-- ============================================
-- SUMMARY:
-- ✅ Removed duplicate Cardiology (ID=7)
-- ✅ Created sequences starting at correct numbers
-- ✅ Created triggers for auto-ID generation
-- ✅ ADMIN_ID defaults to 1 for new specializations
-- ✅ Backend code works without specifying IDs
-- ============================================
