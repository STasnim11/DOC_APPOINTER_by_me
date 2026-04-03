# Test Lab Test Booking - Step by Step

## Step 1: Check if LAB_TESTS table has data

```sql
SELECT COUNT(*) as TOTAL_TESTS FROM LAB_TESTS;
```

**Expected:** Should return a number > 0

**If 0:** Run this first:
```bash
sqlplus username/password@database
@backend/INSERT_SAMPLE_LAB_TESTS.sql
```

---

## Step 2: Check if MEDICAL_TECHNICIAN table has data

```sql
SELECT COUNT(*) as TOTAL_TECHS FROM MEDICAL_TECHNICIAN;
SELECT ID, NAME, EMAIL FROM MEDICAL_TECHNICIAN;
```

**Expected:** Should return at least 1 technician

**If 0:** You need to add technicians via Admin panel first

---

## Step 3: Test Backend API - Get Lab Tests

```bash
curl http://localhost:3000/api/lab-tests
```

**Expected Response:**
```json
{
  "success": true,
  "labTests": [
    {
      "id": 1,
      "testName": "Complete Blood Count (CBC)",
      "description": "...",
      "price": 500,
      "department": "Pathology",
      "preparationRequired": "...",
      "durationMinutes": 30
    }
  ]
}
```

---

## Step 4: Test Backend API - Get Technicians

```bash
curl http://localhost:3000/api/medical-technicians
```

**Expected Response:**
```json
{
  "success": true,
  "technicians": [
    {
      "id": 1,
      "name": "Dr. Ahmed Khan",
      "email": "ahmed@hospital.com",
      ...
    }
  ]
}
```

---

## Step 5: Get Your Patient Email

```sql
-- Find your patient email
SELECT u.EMAIL, p.ID 
FROM PATIENT p
JOIN USERS u ON p.USER_ID = u.ID
WHERE ROWNUM = 1;
```

Copy the EMAIL value.

---

## Step 6: Test Booking API

Replace `YOUR_EMAIL` with the email from Step 5:

```bash
curl -X POST http://localhost:3000/api/lab-test-appointments \
  -H "Content-Type: application/json" \
  -d '{
    "patientEmail": "YOUR_EMAIL",
    "testId": 1,
    "technicianId": 1
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Lab test booked successfully",
  "data": {
    "appointmentId": 1,
    "token": "LT-2026-000001",
    "testName": "Complete Blood Count (CBC)",
    "technicianName": "Dr. Ahmed Khan",
    "price": 500
  }
}
```

**If Error:** Check the error message in response

---

## Step 7: Verify in Database

```sql
SELECT * FROM LAB_TEST_APPOINTMENTS ORDER BY ID DESC;
```

**Expected:** Should see your booking with the token

---

## Step 8: Test Frontend

1. Open browser DevTools (F12)
2. Go to Console tab
3. Login as patient
4. Go to completed appointment
5. Click "🧪 Book Lab Test"
6. Watch console for errors

**Look for:**
- "📋 Booking lab test: ..." in backend terminal
- Any errors in browser console
- Network tab → Check the POST request

---

## Common Errors & Solutions

### Error: "Patient not found"
**Cause:** Email doesn't match any patient
**Solution:** 
```sql
-- Check your patient email
SELECT u.EMAIL FROM USERS u 
JOIN PATIENT p ON u.ID = p.USER_ID 
WHERE u.EMAIL = 'your@email.com';
```

### Error: "Lab test not found"
**Cause:** testId doesn't exist in LAB_TESTS
**Solution:** Run INSERT_SAMPLE_LAB_TESTS.sql

### Error: "Failed to book lab test"
**Cause:** Database constraint or connection issue
**Solution:** Check backend terminal for detailed error

### Error: Network error
**Cause:** Backend not running or wrong port
**Solution:** Make sure `node server.js` is running on port 3000

---

## Debug Checklist

- [ ] LAB_TESTS table has data
- [ ] MEDICAL_TECHNICIAN table has data (optional)
- [ ] Backend server is running
- [ ] GET /api/lab-tests works
- [ ] GET /api/medical-technicians works
- [ ] Patient email is correct
- [ ] POST /api/lab-test-appointments works via curl
- [ ] Browser console shows no errors
- [ ] Network tab shows successful POST request

---

## What to Check in Browser

### Console Tab
Look for:
```
Error loading lab test data: ...
Error booking lab test: ...
```

### Network Tab
1. Click on POST request to `/api/lab-test-appointments`
2. Check **Headers** → Request URL
3. Check **Payload** → Should show:
   ```json
   {
     "patientEmail": "...",
     "testId": 1,
     "technicianId": 1
   }
   ```
4. Check **Response** → Should show success or error

---

Run these tests and tell me which step fails!
