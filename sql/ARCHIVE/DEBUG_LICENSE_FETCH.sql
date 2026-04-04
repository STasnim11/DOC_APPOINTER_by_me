-- Debug: Check what the backend query actually returns
-- This simulates what the backend does

-- Example: For doctor@test.com (assuming USER_ID = 41)
SELECT u.ID, u.NAME, u.EMAIL, u.PHONE
FROM USERS u
WHERE TRIM(LOWER(u.EMAIL)) = TRIM(LOWER('doctor@test.com'))
  AND TRIM(UPPER(u.ROLE)) = 'DOCTOR';

-- Then it gets doctor details
SELECT d.ID, d.LICENSE_NUMBER, d.DEGREES, d.EXPERIENCE_YEARS, d.FEES, d.GENDER
FROM DOCTOR d
WHERE d.USER_ID = 41;

-- Full join to see everything
SELECT 
    u.ID as USER_ID,
    u.NAME,
    u.EMAIL,
    u.PHONE,
    d.ID as DOCTOR_ID,
    d.LICENSE_NUMBER,
    d.DEGREES,
    d.EXPERIENCE_YEARS,
    d.FEES,
    d.GENDER
FROM USERS u
LEFT JOIN DOCTOR d ON d.USER_ID = u.ID
WHERE u.ROLE = 'DOCTOR'
ORDER BY u.ID;

-- Check if there's a mismatch between USERS and DOCTOR tables
SELECT 
    u.ID as USER_ID,
    u.EMAIL,
    d.ID as DOCTOR_ID,
    d.LICENSE_NUMBER,
    CASE 
        WHEN d.ID IS NULL THEN 'NO DOCTOR RECORD'
        WHEN d.LICENSE_NUMBER IS NULL THEN 'LICENSE IS NULL'
        ELSE 'HAS LICENSE: ' || d.LICENSE_NUMBER
    END as STATUS
FROM USERS u
LEFT JOIN DOCTOR d ON d.USER_ID = u.ID
WHERE u.ROLE = 'DOCTOR'
ORDER BY u.ID;
