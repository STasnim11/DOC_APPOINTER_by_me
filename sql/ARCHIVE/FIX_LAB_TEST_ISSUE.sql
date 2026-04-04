-- Fix Lab Test Booking Issue
-- Error: FK_LTA_TEST violated - parent key not found
-- This means testId doesn't exist in LAB_TESTS table

-- Step 1: Check if LAB_TESTS table has any data
SELECT COUNT(*) as TOTAL_TESTS FROM LAB_TESTS;

-- Step 2: Check what IDs exist in LAB_TESTS
SELECT ID, TEST_NAME, PRICE FROM LAB_TESTS ORDER BY ID;

-- Step 3: Check the foreign key constraint
SELECT 
    constraint_name,
    table_name,
    r_constraint_name,
    delete_rule,
    status
FROM user_constraints
WHERE constraint_name = 'FK_LTA_TEST';

-- Step 4: If LAB_TESTS is empty, insert sample data
-- First, check if there's a sequence for LAB_TESTS
SELECT sequence_name FROM user_sequences WHERE sequence_name LIKE '%LAB_TEST%';

-- Insert sample lab tests (if table is empty)
INSERT INTO LAB_TESTS (TEST_NAME, DESCRIPTION, PRICE, DEPARTMENT, PREPARATION_REQUIRED, DURATION_MINUTES)
VALUES ('Complete Blood Count (CBC)', 'Measures different components of blood including RBC, WBC, platelets', 500, 'Pathology', 'No special preparation required', 30);

INSERT INTO LAB_TESTS (TEST_NAME, DESCRIPTION, PRICE, DEPARTMENT, PREPARATION_REQUIRED, DURATION_MINUTES)
VALUES ('X-Ray Chest', 'Chest X-ray to examine lungs, heart, and chest wall', 800, 'Radiology', 'Remove metal objects', 15);

INSERT INTO LAB_TESTS (TEST_NAME, DESCRIPTION, PRICE, DEPARTMENT, PREPARATION_REQUIRED, DURATION_MINUTES)
VALUES ('Blood Sugar (Fasting)', 'Measures blood glucose level after fasting', 300, 'Pathology', '8-12 hours fasting required', 20);

INSERT INTO LAB_TESTS (TEST_NAME, DESCRIPTION, PRICE, DEPARTMENT, PREPARATION_REQUIRED, DURATION_MINUTES)
VALUES ('Lipid Profile', 'Measures cholesterol and triglycerides', 1200, 'Pathology', '12 hours fasting required', 30);

INSERT INTO LAB_TESTS (TEST_NAME, DESCRIPTION, PRICE, DEPARTMENT, PREPARATION_REQUIRED, DURATION_MINUTES)
VALUES ('Urine Routine', 'Complete urine analysis', 250, 'Pathology', 'Morning first sample preferred', 20);

COMMIT;

-- Step 5: Verify the data was inserted
SELECT ID, TEST_NAME, PRICE, DEPARTMENT FROM LAB_TESTS ORDER BY ID;

-- Step 6: Now try booking again with the correct test ID
-- Use the ID from the query above
