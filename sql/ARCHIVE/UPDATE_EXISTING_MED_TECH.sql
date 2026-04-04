-- ============================================
-- UPDATE EXISTING MEDICAL TECHNICIAN RECORDS
-- Add name, email, phone to existing records
-- ============================================

-- First, check current data
SELECT ID, NAME, EMAIL, PHONE, DEGREES, EXPERIENCE_YEARS, DEPT_ID, BRANCH_ID
FROM MEDICAL_TECHNICIAN
ORDER BY ID;

-- Update existing records with placeholder data
-- Replace with actual data for your technicians

-- Example for ID 1:
UPDATE MEDICAL_TECHNICIAN 
SET NAME = 'John Doe',
    EMAIL = 'john.doe@hospital.com',
    PHONE = '12345678901'
WHERE ID = 1;

-- Example for ID 2:
UPDATE MEDICAL_TECHNICIAN 
SET NAME = 'Jane Smith',
    EMAIL = 'jane.smith@hospital.com',
    PHONE = '12345678902'
WHERE ID = 2;

-- Commit changes
COMMIT;

-- Verify updates
SELECT ID, NAME, EMAIL, PHONE, DEGREES, EXPERIENCE_YEARS, DEPT_ID, BRANCH_ID
FROM MEDICAL_TECHNICIAN
ORDER BY ID;

-- ============================================
-- IMPORTANT: Replace the names, emails, and phones above
-- with the actual information for your technicians
-- ============================================
