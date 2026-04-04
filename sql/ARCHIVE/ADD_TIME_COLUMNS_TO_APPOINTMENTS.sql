-- Add START_TIME and END_TIME columns to DOCTORS_APPOINTMENTS table
-- This allows appointments to store their own time information
-- independent of TIME_SLOTS table

-- Step 1: Add the columns
ALTER TABLE DOCTORS_APPOINTMENTS
ADD (
  START_TIME VARCHAR2(5),
  END_TIME VARCHAR2(5)
);

-- Step 2: Populate existing appointments with times from TIME_SLOTS
UPDATE DOCTORS_APPOINTMENTS da
SET (START_TIME, END_TIME) = (
  SELECT ts.START_TIME, ts.END_TIME
  FROM TIME_SLOTS ts
  WHERE ts.ID = da.TIME_SLOT_ID
)
WHERE da.TIME_SLOT_ID IS NOT NULL;

COMMIT;

-- Step 3: Verify the update
SELECT 
  ID,
  APPOINTMENT_DATE,
  TIME_SLOT_ID,
  START_TIME,
  END_TIME,
  STATUS
FROM DOCTORS_APPOINTMENTS
ORDER BY APPOINTMENT_DATE DESC
FETCH FIRST 10 ROWS ONLY;

-- Expected: All appointments should now have START_TIME and END_TIME populated
