-- Add check constraint for positive experience years (must be >= 0)
ALTER TABLE MEDICAL_TECHNICIAN ADD CONSTRAINT chk_experience_positive 
  CHECK (EXPERIENCE_YEARS >= 0);

-- Verify the constraint was added
SELECT constraint_name, constraint_type, search_condition 
FROM user_constraints 
WHERE table_name = 'MEDICAL_TECHNICIAN' AND constraint_name = 'CHK_EXPERIENCE_POSITIVE';
