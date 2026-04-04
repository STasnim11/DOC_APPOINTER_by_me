-- Insert Sample Lab Tests
-- Run this if LAB_TESTS table is empty

-- Check if tests exist
SELECT COUNT(*) as TEST_COUNT FROM LAB_TESTS;

-- Insert sample lab tests
INSERT INTO LAB_TESTS (TEST_NAME, DESCRIPTION, PRICE, DEPARTMENT, PREPARATION_REQUIRED, DURATION_MINUTES)
VALUES ('Complete Blood Count (CBC)', 'Measures different components of blood including RBC, WBC, platelets', 500, 'Pathology', 'No special preparation required', 30);

INSERT INTO LAB_TESTS (TEST_NAME, DESCRIPTION, PRICE, DEPARTMENT, PREPARATION_REQUIRED, DURATION_MINUTES)
VALUES ('X-Ray Chest', 'Chest X-ray to examine lungs, heart, and chest wall', 800, 'Radiology', 'Remove metal objects', 15);

INSERT INTO LAB_TESTS (TEST_NAME, DESCRIPTION, PRICE, DEPARTMENT, PREPARATION_REQUIRED, DURATION_MINUTES)
VALUES ('Blood Sugar (Fasting)', 'Measures blood glucose level after fasting', 300, 'Pathology', '8-12 hours fasting required', 20);

INSERT INTO LAB_TESTS (TEST_NAME, DESCRIPTION, PRICE, DEPARTMENT, PREPARATION_REQUIRED, DURATION_MINUTES)
VALUES ('Lipid Profile', 'Measures cholesterol and triglycerides', 1200, 'Pathology', '12 hours fasting required', 30);

INSERT INTO LAB_TESTS (TEST_NAME, DESCRIPTION, PRICE, DEPARTMENT, PREPARATION_REQUIRED, DURATION_MINUTES)
VALUES ('Urine Routine', 'Complete urine analysis', 250, 'Pathology', 'Morning first sample preferred', 20);

INSERT INTO LAB_TESTS (TEST_NAME, DESCRIPTION, PRICE, DEPARTMENT, PREPARATION_REQUIRED, DURATION_MINUTES)
VALUES ('ECG', 'Electrocardiogram to check heart rhythm', 600, 'Cardiology', 'No special preparation', 15);

INSERT INTO LAB_TESTS (TEST_NAME, DESCRIPTION, PRICE, DEPARTMENT, PREPARATION_REQUIRED, DURATION_MINUTES)
VALUES ('Ultrasound Abdomen', 'Ultrasound imaging of abdominal organs', 1500, 'Radiology', '6 hours fasting, drink water before test', 30);

INSERT INTO LAB_TESTS (TEST_NAME, DESCRIPTION, PRICE, DEPARTMENT, PREPARATION_REQUIRED, DURATION_MINUTES)
VALUES ('Thyroid Function Test', 'Measures TSH, T3, T4 levels', 900, 'Pathology', 'No special preparation', 30);

INSERT INTO LAB_TESTS (TEST_NAME, DESCRIPTION, PRICE, DEPARTMENT, PREPARATION_REQUIRED, DURATION_MINUTES)
VALUES ('Liver Function Test', 'Measures liver enzymes and function', 800, 'Pathology', 'No special preparation', 30);

INSERT INTO LAB_TESTS (TEST_NAME, DESCRIPTION, PRICE, DEPARTMENT, PREPARATION_REQUIRED, DURATION_MINUTES)
VALUES ('Kidney Function Test', 'Measures creatinine, urea, electrolytes', 700, 'Pathology', 'No special preparation', 30);

COMMIT;

-- Verify insertion
SELECT TEST_NAME, PRICE, DEPARTMENT FROM LAB_TESTS ORDER BY TEST_NAME;
