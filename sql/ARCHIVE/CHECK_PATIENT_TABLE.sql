-- Check PATIENT table structure
DESC PATIENT;

-- Check how patient name is stored
SELECT * FROM PATIENT WHERE ROWNUM <= 2;

-- Check USERS table structure
DESC USERS;

-- Check relationship
SELECT 
    p.ID as PATIENT_ID,
    p.USER_ID,
    u.EMAIL,
    u.NAME
FROM PATIENT p
JOIN USERS u ON p.USER_ID = u.ID
WHERE ROWNUM <= 2;
