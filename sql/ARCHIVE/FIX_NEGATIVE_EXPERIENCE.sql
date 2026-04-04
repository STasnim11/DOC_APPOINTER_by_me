-- ============================================
-- FIX NEGATIVE EXPERIENCE YEARS
-- ============================================

-- Step 1: Check which records have negative experience years
SELECT ID, NAME, EMAIL, EXPERIENCE_YEARS 
FROM MEDICAL_TECHNICIAN 
WHERE EXPERIENCE_YEARS < 0;

-- Step 2: Update negative experience years to 0
UPDATE MEDICAL_TECHNICIAN 
SET EXPERIENCE_YEARS = 0 
WHERE EXPERIENCE_YEARS < 0;

-- Step 3: Also update NULL values to 0 (optional, but recommended)
UPDATE MEDICAL_TECHNICIAN 
SET EXPERIENCE_YEARS = 0 
WHERE EXPERIENCE_YEARS IS NULL;

-- Step 4: Commit the changes
COMMIT;

-- Step 5: Verify all records are now valid
SELECT ID, NAME, EMAIL, EXPERIENCE_YEARS 
FROM MEDICAL_TECHNICIAN 
WHERE EXPERIENCE_YEARS < 0 OR EXPERIENCE_YEARS IS NULL;

-- Should return no rows if successful

-- Step 6: Now add the constraint
ALTER TABLE MEDICAL_TECHNICIAN ADD CONSTRAINT chk_experience_positive 
  CHECK (EXPERIENCE_YEARS >= 0);

-- Step 7: Verify constraint was added
SELECT constraint_name, constraint_type, search_condition 
FROM user_constraints 
WHERE table_name = 'MEDICAL_TECHNICIAN' AND constraint_name = 'CHK_EXPERIENCE_POSITIVE';
