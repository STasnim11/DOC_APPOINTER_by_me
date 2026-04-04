-- ============================================
-- FIX DUPLICATE CARDIOLOGY IN SPECIALIZATION
-- ============================================

-- Step 1: Check for duplicate Cardiology entries
SELECT ID, NAME, ADMIN_ID, DESCRIPTION
FROM SPECIALIZATION
WHERE UPPER(TRIM(NAME)) = 'CARDIOLOGY'
ORDER BY ID;

-- Step 2: Delete duplicate Cardiology entries (keep only the first one)
DELETE FROM SPECIALIZATION
WHERE UPPER(TRIM(NAME)) = 'CARDIOLOGY'
AND ID NOT IN (
    SELECT MIN(ID)
    FROM SPECIALIZATION
    WHERE UPPER(TRIM(NAME)) = 'CARDIOLOGY'
);

COMMIT;

-- Step 3: Verify only one Cardiology remains
SELECT ID, NAME, ADMIN_ID, DESCRIPTION
FROM SPECIALIZATION
WHERE UPPER(TRIM(NAME)) = 'CARDIOLOGY';

-- ============================================
-- MEDICAL LICENSE FORMAT INFORMATION
-- ============================================

/*
VALID LICENSE FORMATS:
- Must be 5-20 alphanumeric characters (letters and numbers only)
- No spaces, no special characters
- Case insensitive (will be stored in uppercase)

EXAMPLES OF VALID LICENSES:
- MD12345
- DOC987654
- LICENSE2024
- MBBS123456
- DR2024ABC
- MED12345678
- PHYSICIAN001
- DOCTOR2024XYZ

EXAMPLES OF INVALID LICENSES:
- MD-123 (contains hyphen)
- DOC 456 (contains space)
- MD12 (too short, less than 5 characters)
- VERYLONGLICENSENUMBER123456 (too long, more than 20 characters)
- @MD123 (contains special character)

VALIDATION RULES:
1. Length: 5-20 characters
2. Characters: Only A-Z and 0-9
3. Uniqueness: Each license must be unique (no two doctors can have the same license)
4. Required: Doctors cannot access dashboard without providing a valid license
*/

-- Check current doctor licenses
SELECT 
    d.ID as DOCTOR_ID,
    u.NAME as DOCTOR_NAME,
    u.EMAIL,
    d.LICENSE,
    CASE 
        WHEN d.LICENSE IS NULL THEN 'NO LICENSE'
        WHEN LENGTH(d.LICENSE) < 5 THEN 'TOO SHORT'
        WHEN LENGTH(d.LICENSE) > 20 THEN 'TOO LONG'
        WHEN REGEXP_LIKE(d.LICENSE, '[^A-Z0-9]') THEN 'INVALID CHARACTERS'
        ELSE 'VALID'
    END as LICENSE_STATUS
FROM DOCTOR d
JOIN USERS u ON d.USER_ID = u.ID
ORDER BY d.ID;
