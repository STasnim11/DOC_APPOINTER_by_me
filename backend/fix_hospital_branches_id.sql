-- Create sequence for HOSPITAL_BRANCHES ID
CREATE SEQUENCE hospital_branches_seq START WITH 1 INCREMENT BY 1;

-- Create trigger to auto-populate ID
CREATE OR REPLACE TRIGGER trg_hospital_branches_id
BEFORE INSERT ON HOSPITAL_BRANCHES
FOR EACH ROW
BEGIN
  IF :NEW.ID IS NULL THEN
    SELECT hospital_branches_seq.NEXTVAL INTO :NEW.ID FROM DUAL;
  END IF;
END;
/
