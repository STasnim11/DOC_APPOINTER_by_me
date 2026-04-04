-- ============================================
-- GRANT PERMISSIONS TO CREATE PROCEDURES
-- Run this as SYSTEM or SYSDBA user
-- ============================================

-- Replace 'YOUR_USERNAME' with your actual Oracle username
-- (the one you use to connect to the database)

GRANT CREATE PROCEDURE TO YOUR_USERNAME;
GRANT CREATE ANY PROCEDURE TO YOUR_USERNAME;
GRANT EXECUTE ANY PROCEDURE TO YOUR_USERNAME;

-- If you don't know your username, run this first:
SELECT USER FROM DUAL;

-- Example: If your username is 'DOCAPPOINTER', run:
-- GRANT CREATE PROCEDURE TO DOCAPPOINTER;
-- GRANT CREATE ANY PROCEDURE TO DOCAPPOINTER;
-- GRANT EXECUTE ANY PROCEDURE TO DOCAPPOINTER;

-- After granting permissions, reconnect with your regular user
-- and run CREATE_PROCEDURES_ONLY.sql
