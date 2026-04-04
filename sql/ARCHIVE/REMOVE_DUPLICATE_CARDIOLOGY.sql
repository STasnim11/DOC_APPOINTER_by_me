-- Check for duplicate Cardiology entries
SELECT ID, NAME, ADMIN_ID, DESCRIPTION
FROM SPECIALIZATION
WHERE UPPER(TRIM(NAME)) = 'CARDIOLOGY'
ORDER BY ID;

-- Keep only the first Cardiology entry and delete duplicates
-- First, identify which ID to keep (usually the lowest ID)
-- Then delete the others

-- Option 1: Delete all but the first one (lowest ID)
DELETE FROM SPECIALIZATION
WHERE UPPER(TRIM(NAME)) = 'CARDIOLOGY'
AND ID NOT IN (
    SELECT MIN(ID)
    FROM SPECIALIZATION
    WHERE UPPER(TRIM(NAME)) = 'CARDIOLOGY'
);

COMMIT;

-- Verify only one Cardiology remains
SELECT ID, NAME, ADMIN_ID, DESCRIPTION
FROM SPECIALIZATION
WHERE UPPER(TRIM(NAME)) = 'CARDIOLOGY';
