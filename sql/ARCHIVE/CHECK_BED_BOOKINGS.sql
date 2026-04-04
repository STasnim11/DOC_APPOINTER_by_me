-- Check if there are any bed bookings
SELECT * FROM BED_BOOKING_APPOINTMENTS;

-- Check the structure
DESC BED_BOOKING_APPOINTMENTS;

-- Check if there are available beds
SELECT * FROM HOSPITAL_BEDS WHERE STATUS = 'available';

-- Check all beds
SELECT * FROM HOSPITAL_BEDS;
