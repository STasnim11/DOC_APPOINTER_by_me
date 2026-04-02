-- Add dosage and duration columns to PRESCRIBED_MED table
-- This allows each prescription to have specific dosage/duration for medicines
-- instead of relying on the global MEDICATIONS table values

ALTER TABLE PRESCRIBED_MED ADD (
  DOSAGE VARCHAR2(100),
  DURATION VARCHAR2(100)
);

-- Add comments for documentation
COMMENT ON COLUMN PRESCRIBED_MED.DOSAGE IS 'Dosage instructions for this specific prescription (e.g., "1 tablet twice daily")';
COMMENT ON COLUMN PRESCRIBED_MED.DURATION IS 'Duration for this specific prescription (e.g., "7 days", "2 weeks")';
