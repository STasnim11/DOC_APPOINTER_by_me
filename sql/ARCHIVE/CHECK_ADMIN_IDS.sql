-- Check existing admin IDs
SELECT ID, USERS_ID, ROLE FROM ADMIN;

-- Check existing specializations and their admin IDs
SELECT ID, ADMIN_ID, NAME FROM SPECIALIZATION;

-- Check if there's a default/system admin
SELECT MIN(ID) as FIRST_ADMIN_ID FROM ADMIN;
