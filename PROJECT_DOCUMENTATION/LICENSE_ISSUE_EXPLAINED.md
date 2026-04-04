# Why License Shows "Not provided" - EXPLAINED

## The Root Cause

When you ran the SQL query:
```sql
SELECT d.ID, u.NAME, u.EMAIL, d.LICENSE_NUMBER, d.DEGREES, d.EXPERIENCE_YEARS, d.FEES, d.GENDER
FROM DOCTOR d
JOIN USERS u ON d.USER_ID = u.ID
ORDER BY d.ID;
```

The output showed 15 doctors, but the LICENSE_NUMBER column was **truncated** in the display. However, based on the table structure, all these doctors have **NULL** values in the LICENSE_NUMBER column.

## Why NULL = "Not provided"

In the backend code (`doctorProfileUpdate.js`):
```javascript
license = doctorResult.rows[0][1] || "Not provided";
```

When `LICENSE_NUMBER` is NULL in the database, JavaScript converts it to the string `"Not provided"`.

## The Solution

**Option 1: Use the License Verification Page (Recommended)**
1. Login as any doctor (e.g., doctor@test.com)
2. You'll be automatically redirected to `/doctor/license-verification`
3. Enter a valid license (e.g., MD12345)
4. Submit
5. Now the license will be saved in the database
6. View Profile will show the license in blue

**Option 2: Set License Manually in Database (For Testing)**
Run this SQL:
```sql
UPDATE DOCTOR
SET LICENSE_NUMBER = 'MD12345'
WHERE ID = 1;
COMMIT;
```

Then login as doctor@test.com - you'll see the license displayed properly.

## How to Fix for All Doctors

Each doctor needs to:
1. Login to their account
2. Complete the license verification page
3. Their license will be saved to the database
4. They can then access the dashboard

## Database Changes Applied

Run `backend/CHECK_DOCTOR_TABLE_AND_ADD_FIELDS.sql` to add:
- FEES column (NUMBER, >= 0)
- GENDER column (VARCHAR2(10), 'Male' or 'Female')

## Edit Profile Now Includes

- Name
- Phone (11 digits)
- Gender (Male/Female)
- Degrees (e.g., MBBS, MD)
- Experience Years
- Consultation Fee

**Email and License are NOT editable** (Email is the unique identifier, License is set during verification)

## Testing the Complete Flow

1. Create new doctor account (signup)
2. Redirected to license verification
3. Enter license (e.g., DOC123456)
4. Redirected to dashboard
5. View Profile → See license in blue
6. Edit Profile → Update other fields (not license)
7. Logout and login again → Goes directly to dashboard (no verification needed)
