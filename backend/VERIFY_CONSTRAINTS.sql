-- ============================================
-- VERIFY ALL CONSTRAINTS ARE IN PLACE
-- ============================================

-- Check MEDICAL_TECHNICIAN table structure
DESC MEDICAL_TECHNICIAN;

-- Check all constraints on MEDICAL_TECHNICIAN
SELECT constraint_name, constraint_type, search_condition, status
FROM user_constraints 
WHERE table_name = 'MEDICAL_TECHNICIAN'
ORDER BY constraint_type, constraint_name;

-- Check if experience constraint is working
-- This should FAIL if constraint is working:
-- INSERT INTO MEDICAL_TECHNICIAN (ADMIN_ID, NAME, EMAIL, PHONE, EXPERIENCE_YEARS) 
-- VALUES (1, 'Test', 'test@test.com', '12345678901', -5);

-- Check HOSPITAL_BRANCHES constraints
SELECT constraint_name, constraint_type, search_condition, status
FROM user_constraints 
WHERE table_name = 'HOSPITAL_BRANCHES'
ORDER BY constraint_type, constraint_name;

-- Check current data in MEDICAL_TECHNICIAN
SELECT ID, NAME, EMAIL, PHONE, EXPERIENCE_YEARS, DEPT_ID, BRANCH_ID
FROM MEDICAL_TECHNICIAN
ORDER BY ID;

-- Verify no negative experience years exist
SELECT COUNT(*) as NEGATIVE_COUNT
FROM MEDICAL_TECHNICIAN 
WHERE EXPERIENCE_YEARS < 0;

-- Should return 0

PROMPT 
PROMPT ============================================
PROMPT Constraint Verification Complete!
PROMPT ============================================
PROMPT If CHK_EXPERIENCE_POSITIVE shows in the list above, it's working!
PROMPT If NEGATIVE_COUNT = 0, all data is valid!
PROMPT ============================================
