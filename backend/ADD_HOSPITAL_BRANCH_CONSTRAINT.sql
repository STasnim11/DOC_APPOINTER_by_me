-- ============================================
-- ADD UNIQUE CONSTRAINT FOR HOSPITAL BRANCHES
-- ============================================

-- Check current hospital branches data
SELECT ID, NAME, ADDRESS, ESTABLISHED_DATE
FROM HOSPITAL_BRANCHES
ORDER BY ID;

-- Check for potential duplicates before adding constraint
SELECT NAME, ADDRESS, ESTABLISHED_DATE, COUNT(*) as DUPLICATE_COUNT
FROM HOSPITAL_BRANCHES
GROUP BY NAME, ADDRESS, ESTABLISHED_DATE
HAVING COUNT(*) > 1;

-- If duplicates exist, you'll need to handle them first
-- Otherwise, add the unique constraint:

ALTER TABLE HOSPITAL_BRANCHES ADD CONSTRAINT uk_branch_unique 
  UNIQUE (NAME, ADDRESS, ESTABLISHED_DATE);

-- Verify constraint was added
SELECT constraint_name, constraint_type, search_condition, status
FROM user_constraints 
WHERE table_name = 'HOSPITAL_BRANCHES' AND constraint_name = 'UK_BRANCH_UNIQUE';

PROMPT 
PROMPT ============================================
PROMPT Hospital Branch Unique Constraint Added!
PROMPT ============================================
