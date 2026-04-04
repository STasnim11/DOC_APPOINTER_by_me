-- Run these queries to verify your table structure

-- Check if medicines table exists (lowercase)
SELECT COUNT(*) as medicines_count FROM medicines;
SELECT * FROM medicines WHERE ROWNUM <= 3;

-- Check if MEDICATIONS table exists (uppercase)
SELECT COUNT(*) as medications_count FROM MEDICATIONS;
SELECT * FROM MEDICATIONS WHERE ROWNUM <= 3;

-- Check PRESCRIBED_MED structure
DESC PRESCRIBED_MED;

-- Check what PRESCRIBED_MED.MEDICATION_ID references
SELECT 
  a.constraint_name,
  a.table_name,
  b.column_name,
  c.table_name as referenced_table,
  d.column_name as referenced_column
FROM user_constraints a
JOIN user_cons_columns b ON a.constraint_name = b.constraint_name
JOIN user_constraints c ON a.r_constraint_name = c.constraint_name
JOIN user_cons_columns d ON c.constraint_name = d.constraint_name
WHERE a.table_name = 'PRESCRIBED_MED'
  AND a.constraint_type = 'R'
  AND b.column_name = 'MEDICATION_ID';
