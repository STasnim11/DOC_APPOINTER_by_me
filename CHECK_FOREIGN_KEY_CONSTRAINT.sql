-- Check if foreign key constraint exists between DOCTORS_APPOINTMENTS and TIME_SLOTS
SELECT 
  constraint_name,
  constraint_type,
  table_name,
  r_constraint_name,
  delete_rule,
  status
FROM user_constraints
WHERE table_name = 'DOCTORS_APPOINTMENTS'
  AND constraint_type = 'R'  -- R = Referential (Foreign Key)
  AND constraint_name LIKE '%TIME%SLOT%'
ORDER BY constraint_name;

-- Check all foreign keys on DOCTORS_APPOINTMENTS
SELECT 
  a.constraint_name,
  a.table_name,
  a.column_name,
  c_pk.table_name as referenced_table,
  c_pk.constraint_name as referenced_constraint,
  c.delete_rule
FROM user_cons_columns a
JOIN user_constraints c ON a.constraint_name = c.constraint_name
JOIN user_constraints c_pk ON c.r_constraint_name = c_pk.constraint_name
WHERE c.constraint_type = 'R'
  AND a.table_name = 'DOCTORS_APPOINTMENTS'
ORDER BY a.constraint_name;

-- Check the column definition
SELECT 
  column_name,
  data_type,
  nullable
FROM user_tab_columns
WHERE table_name = 'DOCTORS_APPOINTMENTS'
  AND column_name = 'TIME_SLOT_ID';
