# Postman Tests for Bed Booking API

## 1. Get Available Beds
**Method:** GET  
**URL:** `http://localhost:3000/api/beds/available`  
**Headers:** None required  

**Expected Response:**
```json
{
  "success": true,
  "beds": [
    {
      "id": 1,
      "bedNumber": "101",
      "wardName": "General Ward",
      "bedType": "Standard",
      "pricePerDay": 500,
      "floorNumber": 1
    }
  ]
}
```

---

## 2. Get Patient's Bed Bookings
**Method:** GET  
**URL:** `http://localhost:3000/api/patient/umme@gmail.com/bed-bookings`  
(Replace `umme@gmail.com` with your patient email)

**Headers:** None required  

**Expected Response:**
```json
{
  "success": true,
  "bookings": [
    {
      "id": 1,
      "appointmentId": 123,
      "bedNumber": "101",
      "wardName": "General Ward",
      "bedType": "Standard",
      "pricePerDay": 500,
      "floorNumber": 1,
      "appointmentDate": "2026-04-05T00:00:00.000Z",
      "status": "BOOKED",
      "startTime": "10:00",
      "endTime": "11:00"
    }
  ]
}
```

---

## 3. Book a Bed
**Method:** POST  
**URL:** `http://localhost:3000/api/bed-bookings`  
**Headers:**  
- Content-Type: `application/json`

**Body (raw JSON):**
```json
{
  "appointmentId": 123,
  "bedId": 1
}
```
(Replace with actual appointment ID and bed ID from your database)

**Expected Response:**
```json
{
  "success": true,
  "message": "Bed booked successfully",
  "bookingId": 1
}
```

---

## Things to Check:

### Test 1: Get Available Beds
- Does it return beds with status='available'?
- Are the bed details correct?

### Test 2: Get Patient Bed Bookings (MOST IMPORTANT)
- Replace `umme@gmail.com` with the email you're logged in with
- Does it return your bed bookings?
- Check if the response has `success: true`
- Check if `bookings` array has data

### Test 3: Book a Bed
- Use an appointment ID from your DOCTORS_APPOINTMENTS table
- Use a bed ID from HOSPITAL_BEDS where STATUS='available'
- After booking, the bed status should change to 'occupied'

---

## Common Issues to Check:

1. **Patient email not found:**
   - Make sure the email in the URL matches exactly (case-insensitive, but check spaces)
   - Check: `SELECT * FROM USERS WHERE EMAIL = 'umme@gmail.com';`

2. **No bookings returned:**
   - Check: `SELECT * FROM BED_BOOKING_APPOINTMENTS;`
   - Check if DOCTOR_APPOINTMENT_ID matches your patient's appointments
   - Check: `SELECT * FROM DOCTORS_APPOINTMENTS WHERE PATIENT_ID = (SELECT ID FROM PATIENT WHERE USER_ID = (SELECT ID FROM USERS WHERE EMAIL = 'umme@gmail.com'));`

3. **500 Error:**
   - Check backend console for error details
   - Check if all foreign keys are correct

---

## SQL Queries to Verify Data:

```sql
-- Get patient ID
SELECT p.ID, u.EMAIL 
FROM PATIENT p
JOIN USERS u ON p.USER_ID = u.ID
WHERE u.EMAIL = 'umme@gmail.com';

-- Get patient's appointments
SELECT * FROM DOCTORS_APPOINTMENTS 
WHERE PATIENT_ID = (
  SELECT p.ID FROM PATIENT p
  JOIN USERS u ON p.USER_ID = u.ID
  WHERE u.EMAIL = 'umme@gmail.com'
);

-- Get all bed bookings
SELECT * FROM BED_BOOKING_APPOINTMENTS;

-- Get bed bookings with details
SELECT 
  bba.ID,
  bba.DOCTOR_APPOINTMENT_ID,
  hb.BED_NUMBER,
  hb.WARD_NAME,
  da.APPOINTMENT_DATE,
  p.ID as PATIENT_ID,
  u.EMAIL
FROM BED_BOOKING_APPOINTMENTS bba
JOIN HOSPITAL_BEDS hb ON bba.BED_ID = hb.ID
JOIN DOCTORS_APPOINTMENTS da ON bba.DOCTOR_APPOINTMENT_ID = da.ID
JOIN PATIENT p ON da.PATIENT_ID = p.ID
JOIN USERS u ON p.USER_ID = u.ID;
```
