-- Check current DOCTOR table structure
DESC DOCTOR;

-- Check if any doctors have license numbers (THIS IS THE KEY CHECK)
SELECT d.ID, u.NAME, u.EMAIL, d.LICENSE_NUMBER, d.DEGREES, d.EXPERIENCE_YEARS
FROM DOCTOR d
JOIN USERS u ON d.USER_ID = u.ID
ORDER BY d.ID;

-- Add FEES column if it doesn't exist
ALTER TABLE DOCTOR ADD (FEES NUMBER);

-- Add GENDER column
ALTER TABLE DOCTOR ADD (GENDER VARCHAR2(10));

-- Add constraints
ALTER TABLE DOCTOR ADD CONSTRAINT CHK_DOCTOR_FEES CHECK (FEES >= 0);
ALTER TABLE DOCTOR ADD CONSTRAINT CHK_DOCTOR_GENDER CHECK (GENDER IN ('Male', 'Female'));

COMMIT;

-- Verify columns were added
DESC DOCTOR;

-- Show updated data with all fields
SELECT d.ID, u.NAME, u.EMAIL, d.LICENSE_NUMBER, d.DEGREES, d.EXPERIENCE_YEARS, d.FEES, d.GENDER
FROM DOCTOR d
JOIN USERS u ON d.USER_ID = u.ID
ORDER BY d.ID;

-- If you see NULL in LICENSE_NUMBER column, that's why it shows "Not provided"
-- You need to actually submit a license through the verification page!
