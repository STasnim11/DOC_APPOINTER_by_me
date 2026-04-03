-- Drop FK_LAB_DOCTOR constraint and rename DOCTOR_ID to TECHNICIAN_ID

-- Step 1: Drop the constraint
ALTER TABLE LAB_TEST_APPOINTMENTS DROP CONSTRAINT FK_LAB_DOCTOR;

-- Step 2: Rename column from DOCTOR_ID to TECHNICIAN_ID
ALTER TABLE LAB_TEST_APPOINTMENTS RENAME COLUMN DOCTOR_ID TO TECHNICIAN_ID;

COMMIT;

-- Step 3: Verify changes
DESC LAB_TEST_APPOINTMENTS;

-- Step 4: Check remaining constraints
SELECT 
    constraint_name,
    constraint_type,
    r_constraint_name
FROM user_constraints
WHERE table_name = 'LAB_TEST_APPOINTMENTS'
ORDER BY constraint_type, constraint_name;
