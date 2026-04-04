# Complete License Verification Flow - All Related Code

## 🔴 THE PROBLEM
When you login as mama@gmail.com, you get redirected to license verification even though the database shows license '11223344' exists.

## 📁 ALL RELATED FILES

### Backend Files
1. `backend/controllers/authController.js` - Signup endpoint (generates JWT token)
2. `backend/controllers/doctorProfileUpdate.js` - Get doctor profile & update license
3. `backend/routes/auth.js` - API routes
4. `backend/controllers/profile.js` - Update user info (name, phone)

### Frontend Files
1. `frontend/src/pages/Login.jsx` - Login page
2. `frontend/src/pages/Signup.jsx` - Signup page
3. `frontend/src/pages/DoctorLicenseVerification.jsx` - License verification page
4. `frontend/src/pages/DoctorDashboard.jsx` - Doctor dashboard
5. `frontend/src/App.jsx` - Routes

---

## 🔄 COMPLETE FLOW

### 1. SIGNUP FLOW
**File:** `frontend/src/pages/Signup.jsx`
```javascript
// After successful signup
if (formData.role === "DOCTOR") {
  navigate("/doctor/license-verification");  // ← Goes to license page
}
```

**File:** `backend/controllers/authController.js`
```javascript
// Signup endpoint NOW returns JWT token
const token = jwt.sign({ id: userId, email: email, role: normalizedRole }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
res.status(201).json({ 
  message: "✅ User created successfully",
  token,  // ← Token is returned
  user: { id: userId, name, email, phone, role: normalizedRole } 
});
```

---

### 2. LOGIN FLOW
**File:** `frontend/src/pages/Login.jsx`
```javascript
// After successful login
if (userRole === "DOCTOR") {
  navigate("/doctor/dashboard");  // ← Goes DIRECTLY to dashboard
}
```

---

### 3. DASHBOARD FLOW
**File:** `frontend/src/pages/DoctorDashboard.jsx`
```javascript
useEffect(() => {
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  if (!userData.token || userData.role?.toUpperCase() !== 'DOCTOR') {
    navigate('/login');
    return;
  }
  setUser(userData);
  fetchDoctorProfile(userData.email);  // ← Fetches profile
}, [navigate]);

const fetchDoctorProfile = async (email) => {
  try {
    const res = await fetch(`http://localhost:3000/api/doctor/profile/${email}`);
    if (res.ok) {
      const data = await res.json();
      setDoctorProfile(data);
      
      // Check if license exists - redirect to verification if not
      if (!data.license || data.license === 'Not provided') {
        navigate('/doctor/license-verification');  // ← Redirects if no license
      }
    }
  } catch (err) {
    console.error('Error fetching doctor profile:', err);
  }
};
```

---

### 4. BACKEND PROFILE FETCH
**File:** `backend/controllers/doctorProfileUpdate.js`
**Endpoint:** `GET /api/doctor/profile/:email`

```javascript
exports.getDoctorProfile = async (req, res) => {
  const { email } = req.params;
  
  // Step 1: Get USER_ID from USERS table
  const userResult = await connection.execute(
    `SELECT u.ID, u.NAME, u.EMAIL, u.PHONE
     FROM USERS u
     WHERE TRIM(LOWER(u.EMAIL)) = TRIM(LOWER(:email))
       AND TRIM(UPPER(u.ROLE)) = 'DOCTOR'`,
    { email }
  );
  
  const [userId, name, userEmail, phone] = userResult.rows[0];
  
  // Step 2: Get DOCTOR details using USER_ID
  doctorResult = await connection.execute(
    `SELECT d.ID, d.LICENSE_NUMBER, d.DEGREES, d.EXPERIENCE_YEARS, d.FEES, d.GENDER
     FROM DOCTOR d
     WHERE d.USER_ID = :userId`,
    { userId }
  );
  
  // Step 3: Extract license
  license = doctorResult.rows[0][1] || "Not provided";  // ← This is the key line
  
  // Step 4: Return response
  return res.status(200).json({
    name,
    email: userEmail,
    phone,
    license,  // ← This is what frontend checks
    degrees,
    experienceYears,
    fees,
    gender,
    specialization,
    availability,
    appointments,
  });
};
```

---

### 5. LICENSE VERIFICATION PAGE
**File:** `frontend/src/pages/DoctorLicenseVerification.jsx`
**Route:** `/doctor/license-verification`

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  const trimmedLicense = licenseNumber.trim().toUpperCase();
  
  // Validate format
  if (trimmedLicense.length < 5 || trimmedLicense.length > 20) {
    setMessage('❌ License must be 5-20 characters long');
    return;
  }
  
  // Submit to backend
  const res = await fetch('http://localhost:3000/api/doctor/license', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: user.email,
      licenseNumber: trimmedLicense
    })
  });
  
  if (res.ok) {
    navigate('/doctor/dashboard');  // ← Goes to dashboard after success
  }
};
```

---

### 6. BACKEND LICENSE UPDATE
**File:** `backend/controllers/doctorProfileUpdate.js`
**Endpoint:** `PUT /api/doctor/license`

```javascript
exports.updateDoctorLicense = async (req, res) => {
  const { email, licenseNumber } = req.body;
  const trimmedLicense = licenseNumber.trim().toUpperCase();
  
  // Validate format
  if (trimmedLicense.length < 5 || trimmedLicense.length > 20) {
    return res.status(400).json({
      error: "❌ License number must be 5-20 characters long",
    });
  }
  
  // Check for duplicates
  const licenseCheck = await connection.execute(
    `SELECT d.ID, u.EMAIL
     FROM DOCTOR d
     JOIN USERS u ON d.USER_ID = u.ID
     WHERE UPPER(TRIM(d.LICENSE_NUMBER)) = :trimmedLicense`,
    { trimmedLicense }
  );
  
  // Update license
  await connection.execute(
    `UPDATE DOCTOR
     SET LICENSE_NUMBER = :trimmedLicense
     WHERE ID = :doctorId`,
    { trimmedLicense, doctorId }
  );
  
  await connection.commit();
};
```

---

## 🐛 THE BUG

The 500 error happens because:
1. Login page tries to fetch profile
2. Backend tries to query FEES and GENDER columns
3. **These columns don't exist in your database yet**
4. Query fails with "invalid identifier" error
5. Returns 500 error
6. Login page assumes no license and redirects to verification

## ✅ THE FIX

**Run this SQL first:**
```sql
ALTER TABLE DOCTOR ADD (FEES NUMBER);
ALTER TABLE DOCTOR ADD (GENDER VARCHAR2(10));
ALTER TABLE DOCTOR ADD CONSTRAINT CHK_DOCTOR_FEES CHECK (FEES >= 0);
ALTER TABLE DOCTOR ADD CONSTRAINT CHK_DOCTOR_GENDER CHECK (GENDER IN ('Male', 'Female'));
COMMIT;
```

**Then restart your backend server** so the changes take effect.

After this:
- Login as mama@gmail.com
- Should go directly to dashboard (because license '11223344' exists)
- View Profile will show license in blue
- No more 500 errors

---

## 📋 API ENDPOINTS SUMMARY

| Method | Endpoint | Purpose | File |
|--------|----------|---------|------|
| POST | `/api/signup` | Create account | authController.js |
| POST | `/api/login` | Login | authController.js |
| GET | `/api/doctor/profile/:email` | Get doctor profile | doctorProfileUpdate.js |
| PUT | `/api/doctor/license` | Update license | doctorProfileUpdate.js |
| PUT | `/api/profile/update` | Update name/phone | profile.js |
| PUT | `/api/doctor/profile/update` | Update degrees/experience/fees/gender | doctorProfileUpdate.js |

---

## 🔍 DEBUGGING CHECKLIST

1. ✅ Check backend terminal for console logs
2. ✅ Check browser console (F12) for errors
3. ✅ Run ALTER TABLE commands to add FEES and GENDER
4. ✅ Restart backend server
5. ✅ Try login again
6. ✅ Check backend logs to see what LICENSE_NUMBER value is fetched
