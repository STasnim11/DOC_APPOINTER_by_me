-- Add unique constraint on name, address, established_date combination
ALTER TABLE HOSPITAL_BRANCHES ADD CONSTRAINT uk_branch_unique 
  UNIQUE (NAME, ADDRESS, ESTABLISHED_DATE);
