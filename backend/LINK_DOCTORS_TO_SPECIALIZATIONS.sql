-- ============================================
-- LINK EXISTING DOCTORS TO SPECIALIZATIONS
-- ============================================

-- Step 1: Check existing doctors
SELECT d.ID, u.NAME, u.EMAIL, d.EXPERIENCE_YEARS
FROM DOCTOR d
JOIN USERS u ON d.USER_ID = u.ID
ORDER BY d.ID;

-- Step 2: Check available specializations
SELECT ID, NAME FROM SPECIALIZATION ORDER BY NAME;

-- Step 3: Link doctors to specializations
-- Replace DOCTOR_ID and SPECIALIZATION_ID with actual values from above queries

-- Example: Link Doctor ID 1 to Cardiology (assuming Cardiology has ID 7)
-- INSERT INTO DOC_SPECIALIZATION (DOCTOR_ID, SPECIALIZATION_ID)
-- VALUES (1, 7);

-- Example: Link Doctor ID 2 to General physician (assuming General physician has ID 1)
-- INSERT INTO DOC_SPECIALIZATION (DOCTOR_ID, SPECIALIZATION_ID)
-- VALUES (2, 1);

-- Add more as needed for your doctors...

-- COMMIT;

-- Step 4: Verify the links
SELECT d.ID as DOCTOR_ID, u.NAME as DOCTOR_NAME, s.NAME as SPECIALIZATION
FROM DOCTOR d
JOIN USERS u ON d.USER_ID = u.ID
LEFT JOIN DOC_SPECIALIZATION ds ON d.ID = ds.DOCTOR_ID
LEFT JOIN SPECIALIZATION s ON ds.SPECIALIZATION_ID = s.ID
ORDER BY d.ID;

-- ============================================
-- QUICK LINK TEMPLATE:
-- ============================================
-- Copy and modify these for each doctor:
-- 
-- INSERT INTO DOC_SPECIALIZATION (DOCTOR_ID, SPECIALIZATION_ID) VALUES (?, ?);
-- 
-- Where:
-- - First ? = DOCTOR.ID
-- - Second ? = SPECIALIZATION.ID
-- ============================================

PROMPT 
PROMPT ============================================
PROMPT Instructions:
PROMPT 1. Check your doctors (Step 1)
PROMPT 2. Check specializations (Step 2)
PROMPT 3. Uncomment and modify INSERT statements in Step 3
PROMPT 4. Run COMMIT
PROMPT 5. Verify with Step 4
PROMPT ============================================
