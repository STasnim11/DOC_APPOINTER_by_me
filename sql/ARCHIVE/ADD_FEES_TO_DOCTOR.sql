-- Add FEES column to DOCTOR table
ALTER TABLE DOCTOR ADD (FEES NUMBER);

-- Add check constraint to ensure fees are non-negative
ALTER TABLE DOCTOR ADD CONSTRAINT CHK_DOCTOR_FEES CHECK (FEES >= 0);

COMMIT;

-- Verify the column was added
DESC DOCTOR;

-- Check current doctor records
SELECT ID, LICENSE_NUMBER, DEGREES, EXPERIENCE_YEARS, FEES
FROM DOCTOR;
