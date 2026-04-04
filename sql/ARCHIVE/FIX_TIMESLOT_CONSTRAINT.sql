-- FIX: Change FK_DOCTOR_APPOINTMENT_TIMESLOT constraint from NO ACTION to SET NULL
-- This allows deleting TIME_SLOTS while preserving appointments

-- Step 1: Make sure TIME_SLOT_ID column allows NULL values
ALTER TABLE DOCTORS_APPOINTMENTS
MODIFY TIME_SLOT_ID NUMBER NULL;

-- Step 2: Drop the existing constraint
ALTER TABLE DOCTORS_APPOINTMENTS
DROP CONSTRAINT FK_DOCTOR_APPOINTMENT_TIMESLOT;

-- Step 3: Recreate the constraint with ON DELETE SET NULL
ALTER TABLE DOCTORS_APPOINTMENTS
ADD CONSTRAINT FK_DOCTOR_APPOINTMENT_TIMESLOT
FOREIGN KEY (TIME_SLOT_ID) REFERENCES TIME_SLOTS(ID)
ON DELETE SET NULL;

-- Step 4: Commit the changes
COMMIT;

-- Step 5: Verify the fix
SELECT 
  constraint_name,
  constraint_type,
  delete_rule,
  status
FROM user_constraints
WHERE constraint_name = 'FK_DOCTOR_APPOINTMENT_TIMESLOT';

-- Expected result: DELETE_RULE should be 'SET NULL'
