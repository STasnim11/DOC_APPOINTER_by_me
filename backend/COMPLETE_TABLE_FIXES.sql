-- ============================================
-- COMPLETE TABLE FIXES FOR MEDICAL TECHNICIAN
-- Run this file to apply all necessary changes
-- ============================================

-- Step 1: Add NAME, EMAIL, PHONE columns to MEDICAL_TECHNICIAN
-- (Skip if already added)
ALTER TABLE MEDICAL_TECHNICIAN ADD NAME VARCHAR2(100);
ALTER TABLE MEDICAL_TECHNICIAN ADD EMAIL VARCHAR2(100);
ALTER TABLE MEDICAL_TECHNICIAN ADD PHONE VARCHAR2(20);

-- Step 2: Make them NOT NULL (after adding data if needed)
ALTER TABLE MEDICAL_TECHNICIAN MODIFY NAME NOT NULL;
ALTER TABLE MEDICAL_TECHNICIAN MODIFY EMAIL NOT NULL;
ALTER TABLE MEDICAL_TECHNICIAN MODIFY PHONE NOT NULL;

-- Step 3: Add unique constraint on email
ALTER TABLE MEDICAL_TECHNICIAN ADD CONSTRAINT uk_med_tech_email UNIQUE (EMAIL);

-- Step 4: Fix existing negative experience years before adding constraint
-- Check for negative values first
SELECT ID, NAME, EMAIL, EXPERIENCE_YEARS 
FROM MEDICAL_TECHNICIAN 
WHERE EXPERIENCE_YEARS < 0;

-- Update negative values to 0
UPDATE MEDICAL_TECHNICIAN 
SET EXPERIENCE_YEARS = 0 
WHERE EXPERIENCE_YEARS < 0;

-- Update NULL values to 0 (optional)
UPDATE MEDICAL_TECHNICIAN 
SET EXPERIENCE_YEARS = 0 
WHERE EXPERIENCE_YEARS IS NULL;

COMMIT;

-- Step 5: Add check constraint for positive experience years
ALTER TABLE MEDICAL_TECHNICIAN ADD CONSTRAINT chk_experience_positive 
  CHECK (EXPERIENCE_YEARS >= 0);

-- Step 5: Add unique constraint for hospital branches (name, address, established_date)
ALTER TABLE HOSPITAL_BRANCHES ADD CONSTRAINT uk_branch_unique 
  UNIQUE (NAME, ADDRESS, ESTABLISHED_DATE);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify MEDICAL_TECHNICIAN structure
DESC MEDICAL_TECHNICIAN;

-- Verify constraints on MEDICAL_TECHNICIAN
SELECT constraint_name, constraint_type, search_condition 
FROM user_constraints 
WHERE table_name = 'MEDICAL_TECHNICIAN';

-- Verify HOSPITAL_BRANCHES constraints
SELECT constraint_name, constraint_type, search_condition 
FROM user_constraints 
WHERE table_name = 'HOSPITAL_BRANCHES';

-- ============================================
-- NOTES:
-- 1. If columns already exist, you'll get "ORA-01430: column being added already exists in table"
--    This is safe to ignore.
-- 2. If constraints already exist, you'll get "ORA-02264: name already used by an existing constraint"
--    This is safe to ignore.
-- 3. Make sure to COMMIT after running if not using autocommit
-- ============================================
