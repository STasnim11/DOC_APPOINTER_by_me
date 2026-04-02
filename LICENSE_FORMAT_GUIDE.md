# Medical License Format Guide

## Overview
All doctors must provide a valid medical license number before accessing the dashboard. This is a security measure to ensure only qualified medical professionals can use the system.

## Valid License Format

### Requirements
- **Length**: 5-20 characters
- **Characters**: Only letters (A-Z) and numbers (0-9)
- **No spaces or special characters**: Hyphens, underscores, dots, etc. are NOT allowed
- **Case insensitive**: Will be automatically converted to uppercase
- **Must be unique**: No two doctors can have the same license number

### Valid Examples ✅
```
MD12345
DOC987654
MBBS123456
LICENSE2024
DR2024ABC
MED12345678
PHYSICIAN001
DOCTOR2024XYZ
```

### Invalid Examples ❌
```
MD-123          ❌ Contains hyphen
DOC 456         ❌ Contains space
MD12            ❌ Too short (less than 5 characters)
VERYLONGLICENSENUMBER123456  ❌ Too long (more than 20 characters)
@MD123          ❌ Contains special character
DR.SMITH        ❌ Contains dot
LICENSE_2024    ❌ Contains underscore
```

## How It Works

### For New Doctors (Signup)
1. Complete signup form
2. Redirected to License Verification page
3. Enter valid license number
4. System validates format and uniqueness
5. Access granted to dashboard

### For Existing Doctors (Login)
1. Login with credentials
2. System checks if license exists
3. If no license → Redirected to License Verification page
4. If license exists → Access dashboard directly

### Updating License
Doctors can update their license number anytime from:
- Dashboard → Profile dropdown → Edit Profile → Update License Number

## Error Messages

| Error | Meaning |
|-------|---------|
| "License number must be 5-20 alphanumeric characters" | Format is invalid |
| "This license number is already registered to another doctor" | License is not unique |
| "Failed to verify license" | Server error or database issue |

## Database Storage
- Stored in `DOCTOR.LICENSE` column
- VARCHAR2(20)
- Always stored in UPPERCASE
- Unique constraint enforced

## SQL to Check Licenses
```sql
-- View all doctor licenses
SELECT 
    d.ID,
    u.NAME,
    u.EMAIL,
    d.LICENSE,
    CASE 
        WHEN d.LICENSE IS NULL THEN 'NO LICENSE'
        WHEN LENGTH(d.LICENSE) < 5 THEN 'TOO SHORT'
        WHEN LENGTH(d.LICENSE) > 20 THEN 'TOO LONG'
        WHEN REGEXP_LIKE(d.LICENSE, '[^A-Z0-9]') THEN 'INVALID CHARACTERS'
        ELSE 'VALID'
    END as STATUS
FROM DOCTOR d
JOIN USERS u ON d.USER_ID = u.ID
ORDER BY d.ID;
```

## Testing
To test the license verification:
1. Create a new doctor account
2. Try various license formats (valid and invalid)
3. Verify error messages are clear
4. Confirm duplicate licenses are rejected
5. Verify dashboard access is blocked without license
