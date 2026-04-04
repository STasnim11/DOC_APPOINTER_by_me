# Patient Profile API Testing

## 1. Create Patient Profile
**POST** `http://localhost:3000/api/patient-profile`

**Body (JSON):**
```json
{
  "userId": 127,
  "dateOfBirth": "1999-01-01",
  "gender": "Male",
  "occupation": "Student",
  "bloodType": "A-",
  "maritalStatus": "Single",
  "address": "123 Main St"
}
```

**Expected Response:**
```json
{
  "message": "✅ Patient profile created successfully"
}
```

---

## 2. Get Patient Profile
**GET** `http://localhost:3000/api/patient/profile/pat10@gmail.com`

**Expected Response:**
```json
{
  "id": 127,
  "name": "Patient Name",
  "email": "pat10@gmail.com",
  "phone": "01234567890",
  "role": "PATIENT",
  "dateOfBirth": "1999-01-01",
  "gender": "Male",
  "occupation": "Student",
  "bloodType": "A-",
  "maritalStatus": "Single",
  "address": "123 Main St"
}
```

---

## 3. Check Database Directly

Run this SQL to verify the data:

```sql
-- Check USERS table
SELECT ID, NAME, EMAIL, PHONE, ROLE 
FROM USERS 
WHERE LOWER(EMAIL) = 'pat10@gmail.com';

-- Check PATIENT table
SELECT p.*, u.EMAIL 
FROM PATIENT p
JOIN USERS u ON p.USER_ID = u.ID
WHERE LOWER(u.EMAIL) = 'pat10@gmail.com';
```

---

## Common Issues:

1. **500 Error on GET**: Check backend console for the actual error
2. **Patient not found**: Verify USER_ID 127 exists in USERS table
3. **No PATIENT record**: The INSERT might have failed silently

---

## Backend Console Logs to Check:

Look for these in your backend terminal:
- `🔍 GET profile request for email: pat10@gmail.com`
- `📊 Query returned rows: X`
- `❌ Get patient profile error:` (if error occurs)
