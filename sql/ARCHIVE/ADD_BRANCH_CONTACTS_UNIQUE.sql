-- ============================================
-- ADD UNIQUE CONSTRAINT FOR BRANCH_CONTACTS
-- Ensures no duplicate contact for same branch and type
-- ============================================

-- Step 1: Check current data for potential duplicates
SELECT BRANCH_ID, CONTACT_NO, TYPE, COUNT(*) as DUPLICATE_COUNT
FROM BRANCH_CONTACTS
GROUP BY BRANCH_ID, CONTACT_NO, TYPE
HAVING COUNT(*) > 1;

-- If duplicates exist, you'll need to remove them first
-- Example: Keep only the first record of each duplicate
-- DELETE FROM BRANCH_CONTACTS 
-- WHERE ID NOT IN (
--   SELECT MIN(ID) 
--   FROM BRANCH_CONTACTS 
--   GROUP BY BRANCH_ID, CONTACT_NO, TYPE
-- );

-- Step 2: Add unique constraint
ALTER TABLE BRANCH_CONTACTS ADD CONSTRAINT uk_branch_contact_unique 
  UNIQUE (BRANCH_ID, CONTACT_NO, TYPE);

-- Step 3: Verify constraint was added
SELECT constraint_name, constraint_type, search_condition, status
FROM user_constraints 
WHERE table_name = 'BRANCH_CONTACTS' AND constraint_name = 'UK_BRANCH_CONTACT_UNIQUE';

-- Step 4: Test the constraint (should FAIL)
-- INSERT INTO BRANCH_CONTACTS (ADMIN_ID, BRANCH_ID, CONTACT_NO, TYPE)
-- VALUES (1, 1, '1234567890', 'phone');
-- Then try to insert same combination again (should fail with unique constraint violation)

COMMIT;

PROMPT 
PROMPT ============================================
PROMPT Branch Contacts Unique Constraint Added!
PROMPT ============================================
PROMPT Now the same contact number with same type cannot be added twice for a branch
PROMPT ============================================
