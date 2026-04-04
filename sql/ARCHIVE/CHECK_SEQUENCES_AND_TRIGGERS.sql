-- Check if sequences exist for SPECIALIZATION and DOC_SPECIALIZATION
SELECT sequence_name 
FROM user_sequences 
WHERE sequence_name LIKE '%SPECIAL%';

-- Check if triggers exist for auto-generating IDs
SELECT trigger_name, table_name, triggering_event, status
FROM user_triggers
WHERE table_name IN ('SPECIALIZATION', 'DOC_SPECIALIZATION');

-- Check current max IDs
SELECT MAX(ID) as MAX_SPECIALIZATION_ID FROM SPECIALIZATION;
SELECT MAX(ID) as MAX_DOC_SPEC_ID FROM DOC_SPECIALIZATION;
