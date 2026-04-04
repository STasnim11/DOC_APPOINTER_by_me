-- ============================================
-- FINAL CONSTRAINTS TO ADD
-- Run this to complete all table constraints
-- ============================================

-- 1. BRANCH_CONTACTS: Unique constraint on (BRANCH_ID, CONTACT_NO, TYPE)
-- Check for duplicates first
SELECT BRANCH_ID, CONTACT_NO, TYPE, COUNT(*) as DUPLICATE_COUNT
FROM BRANCH_CONTACTS
GROUP BY BRANCH_ID, CONTACT_NO, TYPE
HAVING COUNT(*) > 1;

-- If duplicates exist, remove them (keep only first occurrence)
-- DELETE FROM BRANCH_CONTACTS 
-- WHERE ID NOT IN (
--   SELECT MIN(ID) 
--   FROM BRANCH_CONTACTS 
--   GROUP BY BRANCH_ID, CONTACT_NO, TYPE
-- );
-- COMMIT;

-- Add the unique constraint
ALTER TABLE BRANCH_CONTACTS ADD CONSTRAINT uk_branch_contact_unique 
  UNIQUE (BRANCH_ID, CONTACT_NO, TYPE);

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify all constraints on BRANCH_CONTACTS
SELECT constraint_name, constraint_type, search_condition, status
FROM user_constraints 
WHERE table_name = 'BRANCH_CONTACTS'
ORDER BY constraint_type, constraint_name;

-- Verify all constraints on MEDICAL_TECHNICIAN
SELECT constraint_name, constraint_type, search_condition, status
FROM user_constraints 
WHERE table_name = 'MEDICAL_TECHNICIAN'
ORDER BY constraint_type, constraint_name;

-- Verify all constraints on HOSPITAL_BRANCHES
SELECT constraint_name, constraint_type, search_condition, status
FROM user_constraints 
WHERE table_name = 'HOSPITAL_BRANCHES'
ORDER BY constraint_type, constraint_name;

PROMPT 
PROMPT ============================================
PROMPT All Constraints Summary:
PROMPT ============================================
PROMPT MEDICAL_TECHNICIAN:
PROMPT   - CHK_EXPERIENCE_POSITIVE: Experience years >= 0
PROMPT   - UK_MED_TECH_EMAIL: Unique email
PROMPT 
PROMPT HOSPITAL_BRANCHES:
PROMPT   - UK_BRANCH_UNIQUE: Unique (name, address, established_date)
PROMPT 
PROMPT BRANCH_CONTACTS:
PROMPT   - UK_BRANCH_CONTACT_UNIQUE: Unique (branch_id, contact_no, type)
PROMPT ============================================
