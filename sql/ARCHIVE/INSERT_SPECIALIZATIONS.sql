-- ============================================
-- INSERT COMMON MEDICAL SPECIALIZATIONS
-- ============================================

-- First, check if SPECIALIZATION table is empty
SELECT COUNT(*) as TOTAL_SPECIALIZATIONS FROM SPECIALIZATION;

-- Get ADMIN_ID (assuming you're logged in as admin with USERS_ID = 62)
SELECT ID FROM ADMIN WHERE USERS_ID = 62;

-- Insert common specializations (replace ADMIN_ID = 1 with your actual admin ID)
INSERT INTO SPECIALIZATION (ADMIN_ID, NAME, DESCRIPTION) 
VALUES (1, 'General physician', 'Primary care doctors who treat a wide range of conditions');

INSERT INTO SPECIALIZATION (ADMIN_ID, NAME, DESCRIPTION) 
VALUES (1, 'Gynecologist', 'Specialists in women''s reproductive health');

INSERT INTO SPECIALIZATION (ADMIN_ID, NAME, DESCRIPTION) 
VALUES (1, 'Dermatologist', 'Skin, hair, and nail specialists');

INSERT INTO SPECIALIZATION (ADMIN_ID, NAME, DESCRIPTION) 
VALUES (1, 'Pediatricians', 'Doctors specializing in children''s health');

INSERT INTO SPECIALIZATION (ADMIN_ID, NAME, DESCRIPTION) 
VALUES (1, 'Neurologist', 'Brain and nervous system specialists');

INSERT INTO SPECIALIZATION (ADMIN_ID, NAME, DESCRIPTION) 
VALUES (1, 'Gastroenterologist', 'Digestive system specialists');

INSERT INTO SPECIALIZATION (ADMIN_ID, NAME, DESCRIPTION) 
VALUES (1, 'Cardiology', 'Heart and cardiovascular specialists');

INSERT INTO SPECIALIZATION (ADMIN_ID, NAME, DESCRIPTION) 
VALUES (1, 'Orthopedic', 'Bone, joint, and muscle specialists');

INSERT INTO SPECIALIZATION (ADMIN_ID, NAME, DESCRIPTION) 
VALUES (1, 'Psychiatry', 'Mental health specialists');

INSERT INTO SPECIALIZATION (ADMIN_ID, NAME, DESCRIPTION) 
VALUES (1, 'Ophthalmology', 'Eye care specialists');

COMMIT;

-- Verify insertions
SELECT ID, NAME, DESCRIPTION FROM SPECIALIZATION ORDER BY NAME;

-- ============================================
-- NEXT STEPS:
-- ============================================
-- 1. Link doctors to specializations using DOC_SPECIALIZATION table
-- 2. Example: If you have a doctor with ID = 1 who is a Cardiologist:
--    
--    First, get the specialization ID:
--    SELECT ID FROM SPECIALIZATION WHERE NAME = 'Cardiology';
--    
--    Then insert into DOC_SPECIALIZATION:
--    INSERT INTO DOC_SPECIALIZATION (DOCTOR_ID, SPECIALIZATION_ID)
--    VALUES (1, <specialization_id_from_above>);
--    
--    COMMIT;
-- ============================================

PROMPT 
PROMPT ============================================
PROMPT Specializations inserted successfully!
PROMPT ============================================
PROMPT Now link your doctors to specializations using DOC_SPECIALIZATION table
PROMPT ============================================
