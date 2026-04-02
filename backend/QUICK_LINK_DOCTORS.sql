-- ============================================
-- QUICK LINK DOCTORS TO SPECIALIZATIONS
-- ============================================

-- Step 1: See your doctors
SELECT d.ID, u.NAME, u.EMAIL 
FROM DOCTOR d
JOIN USERS u ON d.USER_ID = u.ID
ORDER BY d.ID;

-- Step 2: See your specializations
SELECT ID, NAME FROM SPECIALIZATION ORDER BY ID;

-- Step 3: Link each doctor to a specialization
-- Format: INSERT INTO DOC_SPECIALIZATION (DOCTOR_ID, SPECIALIZATION_ID) VALUES (doctor_id, spec_id);

-- Example: If Doctor ID 1 is a Cardiologist (Cardiology ID = 1 or 7)
-- INSERT INTO DOC_SPECIALIZATION (DOCTOR_ID, SPECIALIZATION_ID) VALUES (1, 1);

-- Add your links here (replace with your actual doctor IDs and specialization IDs):
-- INSERT INTO DOC_SPECIALIZATION (DOCTOR_ID, SPECIALIZATION_ID) VALUES (?, ?);
-- INSERT INTO DOC_SPECIALIZATION (DOCTOR_ID, SPECIALIZATION_ID) VALUES (?, ?);
-- INSERT INTO DOC_SPECIALIZATION (DOCTOR_ID, SPECIALIZATION_ID) VALUES (?, ?);

-- COMMIT;

-- Step 4: Verify the links
SELECT d.ID as DOC_ID, u.NAME as DOCTOR_NAME, s.NAME as SPECIALTY
FROM DOCTOR d
JOIN USERS u ON d.USER_ID = u.ID
LEFT JOIN DOC_SPECIALIZATION ds ON d.ID = ds.DOCTOR_ID
LEFT JOIN SPECIALIZATION s ON ds.SPECIALIZATION_ID = s.ID
ORDER BY d.ID;

-- ============================================
-- AVAILABLE SPECIALIZATIONS:
-- 1 = Cardiology
-- 2 = Neurology  
-- 3 = Orthopedics
-- 4 = Pediatrics
-- 5 = General Medicine
-- 6 = Gastroenterologist
-- 7 = Cardiology (duplicate)
-- 8 = Orthopedic (duplicate)
-- 9 = Psychiatry
-- 10 = Ophthalmology
-- ============================================
