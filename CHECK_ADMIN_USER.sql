-- Check if admin user has ADMIN record
-- Replace 'your_admin_email@example.com' with your actual admin email

SELECT 
    u.ID as USER_ID,
    u.EMAIL,
    u.ROLE,
    a.ID as ADMIN_ID,
    a.USERS_ID
FROM USERS u
LEFT JOIN ADMIN a ON u.ID = a.USERS_ID
WHERE UPPER(u.ROLE) = 'ADMIN';

-- If ADMIN_ID is NULL, you need to create an ADMIN record:
-- INSERT INTO ADMIN (USERS_ID, NAME, EMAIL, PHONE) 
-- VALUES (
--   (SELECT ID FROM USERS WHERE EMAIL = 'your_admin_email@example.com'),
--   'Admin Name',
--   'your_admin_email@example.com',
--   '01234567890'
-- );
