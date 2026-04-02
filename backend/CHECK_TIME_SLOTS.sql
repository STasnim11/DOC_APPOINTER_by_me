-- Check if doctors have time slots
SELECT d.ID as DOCTOR_ID, u.NAME as DOCTOR_NAME, COUNT(ts.ID) as SLOT_COUNT
FROM DOCTOR d
JOIN USERS u ON d.USER_ID = u.ID
LEFT JOIN TIME_SLOTS ts ON d.ID = ts.DOCTOR_ID
GROUP BY d.ID, u.NAME
ORDER BY d.ID;

-- Check existing time slots
SELECT ts.ID, ts.DOCTOR_ID, ts.DAY_OF_WEEK, ts.START_TIME, ts.END_TIME, ts.STATUS
FROM TIME_SLOTS ts
ORDER BY ts.DOCTOR_ID, ts.DAY_OF_WEEK, ts.START_TIME;

-- If no slots exist, doctors need to set their schedule via /doctor/timeslots page
