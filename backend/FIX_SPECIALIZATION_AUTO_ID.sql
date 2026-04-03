-- ============================================
-- FIX AUTO-INCREMENT FOR SPECIALIZATION TABLES
-- ============================================

-- STEP 1: Check if we have an admin ID to use
-- Run CHECK_ADMIN_IDS.sql first to see available admin IDs

-- 2. Sync sequences with current max IDs
DECLARE
  v_max_spec_id NUMBER;
  v_max_doc_spec_id NUMBER;
  v_seq_exists NUMBER;
BEGIN
  -- Get max ID from SPECIALIZATION
  SELECT NVL(MAX(ID), 0) INTO v_max_spec_id FROM SPECIALIZATION;
  
  -- Check if SPECIALIZATION_SEQ exists
  SELECT COUNT(*) INTO v_seq_exists FROM user_sequences WHERE sequence_name = 'SPECIALIZATION_SEQ';
  IF v_seq_exists > 0 THEN
    EXECUTE IMMEDIATE 'DROP SEQUENCE SPECIALIZATION_SEQ';
  END IF;
  EXECUTE IMMEDIATE 'CREATE SEQUENCE SPECIALIZATION_SEQ START WITH ' || (v_max_spec_id + 1) || ' INCREMENT BY 1';
  DBMS_OUTPUT.PUT_LINE('✅ Created SPECIALIZATION_SEQ starting at ' || (v_max_spec_id + 1));
  
  -- Get max ID from DOC_SPECIALIZATION
  SELECT NVL(MAX(ID), 0) INTO v_max_doc_spec_id FROM DOC_SPECIALIZATION;
  
  -- Check if DOC_SPECIALIZATION_SEQ exists
  SELECT COUNT(*) INTO v_seq_exists FROM user_sequences WHERE sequence_name = 'DOC_SPECIALIZATION_SEQ';
  IF v_seq_exists > 0 THEN
    EXECUTE IMMEDIATE 'DROP SEQUENCE DOC_SPECIALIZATION_SEQ';
  END IF;
  EXECUTE IMMEDIATE 'CREATE SEQUENCE DOC_SPECIALIZATION_SEQ START WITH ' || (v_max_doc_spec_id + 1) || ' INCREMENT BY 1';
  DBMS_OUTPUT.PUT_LINE('✅ Created DOC_SPECIALIZATION_SEQ starting at ' || (v_max_doc_spec_id + 1));
END;
/

-- 3. Create trigger for SPECIALIZATION (handles ADMIN_ID requirement)
CREATE OR REPLACE TRIGGER TRG_SPECIALIZATION_ID
BEFORE INSERT ON SPECIALIZATION
FOR EACH ROW
DECLARE
  v_default_admin_id NUMBER;
BEGIN
  -- Auto-generate ID if not provided
  IF :NEW.ID IS NULL THEN
    :NEW.ID := SPECIALIZATION_SEQ.NEXTVAL;
  END IF;
  
  -- If ADMIN_ID not provided, use first available admin
  IF :NEW.ADMIN_ID IS NULL THEN
    SELECT MIN(ID) INTO v_default_admin_id FROM ADMIN;
    :NEW.ADMIN_ID := v_default_admin_id;
  END IF;
END;
/

-- 4. Create trigger for DOC_SPECIALIZATION
CREATE OR REPLACE TRIGGER TRG_DOC_SPECIALIZATION_ID
BEFORE INSERT ON DOC_SPECIALIZATION
FOR EACH ROW
BEGIN
  IF :NEW.ID IS NULL THEN
    :NEW.ID := DOC_SPECIALIZATION_SEQ.NEXTVAL;
  END IF;
END;
/

-- 5. Verify triggers were created
SELECT trigger_name, status FROM user_triggers 
WHERE trigger_name IN ('TRG_SPECIALIZATION_ID', 'TRG_DOC_SPECIALIZATION_ID');

COMMIT;

-- ============================================
-- WHAT THIS DOES:
-- 1. SPECIALIZATION_SEQ starts at 11 (current max is 10)
-- 2. DOC_SPECIALIZATION_SEQ starts at 10 (current max is 9)
-- 3. TRG_SPECIALIZATION_ID: Auto-fills ID and ADMIN_ID if not provided
-- 4. TRG_DOC_SPECIALIZATION_ID: Auto-fills ID if not provided
-- ============================================
