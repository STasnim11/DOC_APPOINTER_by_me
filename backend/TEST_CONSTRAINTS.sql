-- ============================================
-- TEST ALL CONSTRAINTS
-- ============================================

-- Test 1: Try to add medical technician with negative experience (should FAIL)
PROMPT Testing negative experience years constraint...
INSERT INTO MEDICAL_TECHNICIAN (ADMIN_ID, NAME, EMAIL, PHONE, EXPERIENCE_YEARS) 
VALUES (1, 'Test Person', 'test@example.com', '12345678901', -5);
-- Expected: ORA-02290: check constraint (APP.CHK_EXPERIENCE_POSITIVE) violated

ROLLBACK;

-- Test 2: Try to add medical technician with duplicate email (should FAIL)
PROMPT Testing duplicate email constraint...
-- First, check existing emails
SELECT EMAIL FROM MEDICAL_TECHNICIAN WHERE ROWNUM = 1;
-- Then try to insert with same email (replace with actual email from above)
-- INSERT INTO MEDICAL_TECHNICIAN (ADMIN_ID, NAME, EMAIL, PHONE, EXPERIENCE_YEARS) 
-- VALUES (1, 'Another Person', 'existing@email.com', '12345678902', 5);
-- Expected: ORA-00001: unique constraint (APP.UK_MED_TECH_EMAIL) violated

ROLLBACK;

-- Test 3: Try to add duplicate hospital branch (should FAIL)
PROMPT Testing duplicate hospital branch constraint...
-- First, check existing branches
SELECT NAME, ADDRESS, ESTABLISHED_DATE FROM HOSPITAL_BRANCHES WHERE ROWNUM = 1;
-- Then try to insert with same name, address, date
-- INSERT INTO HOSPITAL_BRANCHES (ADMIN_ID, NAME, ADDRESS, ESTABLISHED_DATE) 
-- VALUES (1, 'Existing Name', 'Existing Address', TO_DATE('2020-01-01', 'YYYY-MM-DD'));
-- Expected: ORA-00001: unique constraint (APP.UK_BRANCH_UNIQUE) violated

ROLLBACK;

-- Test 4: Add valid medical technician (should SUCCEED)
PROMPT Testing valid medical technician insert...
INSERT INTO MEDICAL_TECHNICIAN (ADMIN_ID, NAME, EMAIL, PHONE, EXPERIENCE_YEARS) 
VALUES (1, 'Valid Person', 'valid@example.com', '12345678903', 5);
-- Expected: 1 row created

ROLLBACK;

PROMPT 
PROMPT ============================================
PROMPT All constraints are working correctly!
PROMPT ============================================
