-- Add check constraint to ensure experience years is between 0 and 70
-- This prevents negative values and unrealistic experience years

-- First, check if any existing data violates the constraint
SELECT EMAIL, NAME, EXPERIENCE_YEARS 
FROM DOCTORS 
WHERE EXPERIENCE_YEARS < 0 OR EXPERIENCE_YEARS > 70;

-- If the above query returns any rows, fix them first:
-- UPDATE DOCTORS SET EXPERIENCE_YEARS = 0 WHERE EXPERIENCE_YEARS < 0;
-- UPDATE DOCTORS SET EXPERIENCE_YEARS = 70 WHERE EXPERIENCE_YEARS > 70;

-- Add the check constraint
ALTER TABLE DOCTORS 
ADD CONSTRAINT CHK_EXPERIENCE_YEARS 
CHECK (EXPERIENCE_YEARS >= 0 AND EXPERIENCE_YEARS <= 70);

-- Verify the constraint was added
SELECT CONSTRAINT_NAME, SEARCH_CONDITION, STATUS 
FROM USER_CONSTRAINTS 
WHERE TABLE_NAME = 'DOCTORS' 
AND CONSTRAINT_TYPE = 'C'
AND CONSTRAINT_NAME = 'CHK_EXPERIENCE_YEARS';
