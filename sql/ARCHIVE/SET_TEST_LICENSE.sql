-- This shows why license shows "Not provided" - all LICENSE_NUMBER values are NULL!
-- You need to actually submit a license through the verification page

-- To test, let's set a license for one doctor manually:
UPDATE DOCTOR
SET LICENSE_NUMBER = 'MD12345'
WHERE ID = 1;

COMMIT;

-- Verify it was set
SELECT d.ID, u.NAME, u.EMAIL, d.LICENSE_NUMBER
FROM DOCTOR d
JOIN USERS u ON d.USER_ID = u.ID
WHERE d.ID = 1;

-- Now when you login as doctor@test.com, you should see:
-- 1. No redirect to license verification (because license exists)
-- 2. License shows as "MD12345" in blue in View Profile

-- For all other doctors, they will be redirected to license verification page
-- because their LICENSE_NUMBER is still NULL
