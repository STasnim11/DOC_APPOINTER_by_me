-- Fix LAB_TEST_APPOINTMENTS foreign key constraint
-- The DOCTOR_ID column should reference MEDICAL_TECHNICIAN, not DOCTOR

-- Step 1: Check current constraint
SELECT 
    constraint_name,
    constraint_type,
    table_name,
    r_constraint_name,
    search_condition,
    delete_rule,
    status
FROM user_constraints
WHERE table_name = 'LAB_TEST_APPOINTMENTS';

-- Step 2: Check which table the FK_LAB_DOCTOR references
SELECT 
    a.constraint_name,
    a.table_name,
    a.column_name,
    c_pk.table_name as referenced_table,
    b.column_name as referenced_column
FROM user_cons_columns a
JOIN user_constraints c ON a.constraint_name = c.constraint_name
JOIN user_constraints c_pk ON c.r_constraint_name = c_pk.constraint_name
JOIN user_cons_columns b ON c_pk.constraint_name = b.constraint_name
WHERE a.constraint_name = 'FK_LAB_DOCTOR';

-- Step 3: Check LAB_TEST_APPOINTMENTS structure
DESC LAB_TEST_APPOINTMENTS;

-- Step 4: Check if there are any existing records
SELECT COUNT(*) as TOTAL_RECORDS FROM LAB_TEST_APPOINTMENTS;

-- Step 5: Drop the incorrect constraint
ALTER TABLE LAB_TEST_APPOINTMENTS DROP CONSTRAINT FK_LAB_DOCTOR;

-- Step 6: Add correct constraint referencing MEDICAL_TECHNICIAN
-- DOCTOR_ID in LAB_TEST_APPOINTMENTS should reference MEDICAL_TECHNICIAN.ID
ALTER TABLE LAB_TEST_APPOINTMENTS 
ADD CONSTRAINT FK_LTA_TECHNICIAN 
FOREIGN KEY (DOCTOR_ID) 
REFERENCES MEDICAL_TECHNICIAN(ID)
ON DELETE SET NULL;

-- Step 7: Verify the new constraint
SELECT 
    a.constraint_name,
    a.table_name,
    a.column_name,
    c_pk.table_name as referenced_table,
    b.column_name as referenced_column
FROM user_cons_columns a
JOIN user_constraints c ON a.constraint_name = c.constraint_name
JOIN user_constraints c_pk ON c.r_constraint_name = c_pk.constraint_name
JOIN user_cons_columns b ON c_pk.constraint_name = b.constraint_name
WHERE a.constraint_name = 'FK_LTA_TECHNICIAN';

-- Step 8: Check all constraints on LAB_TEST_APPOINTMENTS
SELECT 
    constraint_name,
    constraint_type,
    search_condition,
    r_constraint_name,
    delete_rule
FROM user_constraints
WHERE table_name = 'LAB_TEST_APPOINTMENTS'
ORDER BY constraint_type, constraint_name;

COMMIT;
