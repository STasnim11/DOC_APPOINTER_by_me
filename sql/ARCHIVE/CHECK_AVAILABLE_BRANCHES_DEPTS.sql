-- Check available Hospital Branches
SELECT ID, NAME, ADDRESS 
FROM HOSPITAL_BRANCHES 
ORDER BY ID;

-- Check available Departments
SELECT ID, NAME, DESCRIPTION 
FROM DEPARTMENTS 
ORDER BY ID;

-- If no branches exist, insert some:
-- INSERT INTO HOSPITAL_BRANCHES (NAME, ADDRESS, ADMIN_ID) 
-- VALUES ('Main Branch', '123 Main St', (SELECT ID FROM ADMIN WHERE ROWNUM = 1));

-- If no departments exist, insert some:
-- INSERT INTO DEPARTMENTS (NAME, DESCRIPTION, ADMIN_ID) 
-- VALUES ('Radiology', 'X-Ray and Imaging', (SELECT ID FROM ADMIN WHERE ROWNUM = 1));
