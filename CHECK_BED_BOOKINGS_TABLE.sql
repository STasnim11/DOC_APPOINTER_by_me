-- Check if BED_BOOKINGS table exists
SELECT table_name FROM user_tables WHERE table_name = 'BED_BOOKINGS';

-- If exists, show structure
DESC BED_BOOKINGS;

-- Check HOSPITAL_BEDS structure
DESC HOSPITAL_BEDS;

-- Show available beds
SELECT ID, BED_NUMBER, WARD_NAME, BED_TYPE, STATUS, PRICE_PER_DAY, FLOOR_NUMBER
FROM HOSPITAL_BEDS
WHERE STATUS = 'available'
ORDER BY WARD_NAME, BED_NUMBER;
