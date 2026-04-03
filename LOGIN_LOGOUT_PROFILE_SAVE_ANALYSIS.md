# LOGIN/LOGOUT AND PROFILE SAVE ANALYSIS

## EXECUTIVE SUMMARY
✅ **Profile data IS saved properly before logout** in all dashboards (Admin, Doctor, Patient)
✅ **Logout only clears localStorage** - does NOT affect database
✅ **All profile updates are committed to database BEFORE logout**

---

## 1. LOGIN FLOW

### Frontend: `frontend/src/pages/Login.jsx`
```javascript
const handleLogin = async () => {
  // 1. Validates email and password
  // 2. Calls POST /api/login
  // 3. Receives: { token, user: { id, name, email, phone, role } }
  // 4. Clears localStorage (removes old session)
  localStorage.clear();
  // 5. Stores new session
  localStorage.setItem("user", JSON.stringify(userWithToken));
  localStorage.setItem("userEmail", data.user.email);
  localStorage.setItem("userRole", role);
  // 6. Redirects based on role
}
```

### Backend: `backend/controllers/authController.js`
```javascript
exports.login = async (req, res) => {
  // 1. Validates email/password
  // 2. Fetches user from USERS table
  // 3. Verifies password with bcrypt
  // 4. Generates JWT token (expires in 24h)
  // 5. Returns: { token, user }
}
```

**What's stored in localStorage:**
- `user`: `{ id, name, email, phone, role, token }`
- `userEmail`: email string
- `userRole`: role string (ADMIN/DOCTOR/PATIENT)

---

## 2. LOGOUT FLOW

### Admin Dashboard: `frontend/src/pages/AdminDashboard.jsx`
```javascript
const handleLogout = () => {
  localStorage.removeItem('user');  // Only removes 'user' key
  navigate('/login');
};
```

### Doctor Dashboard: `frontend/src/pages/DoctorDashboard.jsx`
```javascript
const handleLogout = () => {
  localStorage.removeItem('user');  // Only removes 'user' key
  navigate('/');
};
```

### Patient Dashboard: `frontend/src/pages/PatientDashboard.jsx`
```javascript
const handleLogout = () => {
  localStorage.removeItem('user');  // Only removes 'user' key
  navigate('/');
};
```

**CRITICAL FINDING:**
- Logout ONLY removes `localStorage.getItem('user')`
- Does NOT remove `userEmail` or `userRole` (leftover data)
- Does NOT call any backend API
- Does NOT invalidate JWT token on server
- JWT token remains valid for 24h even after logout

---

## 3. PROFILE UPDATE & SAVE FLOW

### 3.1 PATIENT PROFILE UPDATE

**Frontend: `frontend/src/pages/PatientDashboard.jsx`**
```javascript
const handleUpdateProfile = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  // 1. Calls PUT /api/patient/update-profile
  const res = await fetch('http://localhost:3000/api/patient/update-profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${user.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profileData)  // Contains all profile fields
  });

  // 2. If successful, updates localStorage
  if (res.ok) {
    const updatedUser = { ...user, name: profileData.name, phone: profileData.phone };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setMessage('✅ Profile updated successfully');
    setEditMode(false);
  }
};
```

**Backend: `backend/controllers/patientProfileUpdate.js`**
```javascript
// Updates 2 tables:
// 1. USERS table (name, phone)
await connection.execute(`
  UPDATE USERS
  SET NAME = :name, PHONE = :phone
  WHERE EMAIL = :email
`, { name, phone, email });

// 2. PATIENT table (dateOfBirth, gender, bloodType, maritalStatus, occupation, address)
await connection.execute(`
  UPDATE PATIENT
  SET DATE_OF_BIRTH = :dateOfBirth,
      GENDER = :gender,
      BLOOD_TYPE = :bloodType,
      MARITAL_STATUS = :maritalStatus,
      OCCUPATION = :occupation,
      ADDRESS = :address
  WHERE USER_ID = :userId
`, { userId, dateOfBirth, gender, bloodType, maritalStatus, occupation, address });

await connection.commit();  // ✅ COMMITTED TO DATABASE
```

**✅ RESULT:** Patient profile is saved to database BEFORE logout

---

### 3.2 DOCTOR PROFILE UPDATE

**Frontend: `frontend/src/pages/DoctorDashboard.jsx`**
```javascript
// Doctor profile update makes 3 API calls:

// 1. Update user info (name, phone)
const userRes = await fetch('http://localhost:3000/api/profile/update', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: user.email,
    name: editForm.name,
    phone: editForm.phone
  })
});

// 2. Update doctor-specific info (degrees, experience, fees, gender)
const doctorRes = await fetch('http://localhost:3000/api/doctor/profile/update', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: user.email,
    degrees: editForm.degrees,
    experienceYears: parseInt(editForm.experienceYears) || 0,
    fees: parseInt(editForm.fees) || 0,
    gender: editForm.gender
  })
});

// 3. Update specialization (if provided)
if (editForm.specializationId) {
  const specRes = await fetch('http://localhost:3000/api/doctor/specialization', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: user.email,
      specializationId: parseInt(editForm.specializationId)
    })
  });
}

// 4. Update localStorage
const updatedUser = {...user, name: editForm.name, phone: editForm.phone};
localStorage.setItem('user', JSON.stringify(updatedUser));
setUser(updatedUser);

// 5. Refresh profile from database
await fetchDoctorProfile(user.email);
```

**Backend: `backend/controllers/doctorProfileUpdate.js`**
```javascript
// Updates USERS table
await connection.execute(`
  UPDATE USERS
  SET NAME = :name, PHONE = :phone
  WHERE EMAIL = :email
`, { name, phone, email });

// Updates DOCTOR table
await connection.execute(`
  UPDATE DOCTOR
  SET DEGREES = :degrees,
      EXPERIENCE_YEARS = :experienceYears,
      FEES = :fees,
      GENDER = :gender
  WHERE USER_ID = (SELECT ID FROM USERS WHERE EMAIL = :email)
`, { degrees, experienceYears, fees, gender, email });

await connection.commit();  // ✅ COMMITTED TO DATABASE
```

**✅ RESULT:** Doctor profile is saved to database BEFORE logout

---

### 3.3 ADMIN PROFILE

**Admin dashboard does NOT have profile edit functionality**
- Admin can only manage hospital data (branches, contacts, beds, medicines, etc.)
- Admin profile is created during signup and cannot be edited
- Admin logout only clears localStorage

---

## 4. WHEN USER GETS LOGGED OUT

### Automatic Logout Scenarios:

1. **User clicks "Logout" button** (any dashboard)
   - Clears localStorage
   - Redirects to login/home

2. **Patient deletes their profile**
   ```javascript
   const handleDeleteProfile = async () => {
     // Deletes from database
     await fetch('http://localhost:3000/api/patient/delete-profile', {
       method: 'DELETE',
       headers: { 'Authorization': `Bearer ${user.token}` }
     });
     // Then logs out
     localStorage.removeItem('user');
     navigate('/');
   };
   ```

3. **User logs in/signs up** (clears old session)
   ```javascript
   localStorage.clear();  // Removes all old data
   ```

4. **Role mismatch on dashboard access**
   ```javascript
   // In each dashboard's useEffect:
   const user = JSON.parse(localStorage.getItem('user') || '{}');
   const userRole = user.role ? user.role.toUpperCase() : '';
   
   if (userRole !== 'ADMIN') {  // or 'DOCTOR' or 'PATIENT'
     navigate('/login');
   }
   ```

5. **Missing token or user data**
   - If `localStorage.getItem('user')` is null/empty
   - Dashboard redirects to login

---

## 5. TOKEN/ROLE MISMATCH SCENARIOS

### Why Token/Role Mismatch Happens:

1. **User manually clears browser data**
   - localStorage gets wiped
   - User object becomes `{}`
   - Role check fails → redirect to login

2. **localStorage corruption**
   - Browser storage quota exceeded
   - Browser crash/force quit
   - Malicious browser extension

3. **User opens app in incognito mode**
   - No localStorage data
   - Treated as new session

4. **User accesses dashboard directly via URL**
   - Types `/doctor/dashboard` without logging in
   - No user data in localStorage
   - Redirect to login

5. **Wrong role tries to access dashboard**
   - Patient tries to access `/doctor/dashboard`
   - Role check: `userRole !== 'DOCTOR'` → redirect

6. **JWT token expired (24h)**
   - Token is expired but frontend doesn't check
   - Backend API calls will fail with 401
   - Frontend doesn't auto-logout on 401

---

## 6. SECURITY ISSUES IDENTIFIED

### 🔴 CRITICAL ISSUES:

1. **No token expiry validation on frontend**
   - JWT expires after 24h
   - Frontend never checks `exp` claim
   - User can stay "logged in" with expired token
   - API calls will fail silently

2. **No refresh token mechanism**
   - User must re-login after 24h
   - No automatic token renewal

3. **Role stored in localStorage can be manipulated**
   - User can edit localStorage and change role
   - Backend MUST verify role from JWT token, not trust frontend

4. **Logout doesn't invalidate JWT token**
   - Token remains valid for 24h after logout
   - If token is stolen, attacker can use it
   - No server-side token blacklist

5. **Incomplete localStorage cleanup**
   - Logout only removes `user` key
   - Leaves `userEmail` and `userRole` behind
   - Should use `localStorage.clear()` instead

6. **No 401 error handling**
   - When API returns 401 (unauthorized), frontend doesn't auto-logout
   - User sees error messages but stays on dashboard

---

## 7. PROFILE SAVE VERIFICATION

### ✅ PATIENT PROFILE SAVE:
- **When:** User clicks "Save" in Edit Profile form
- **What's saved:**
  - USERS table: name, phone
  - PATIENT table: dateOfBirth, gender, bloodType, maritalStatus, occupation, address
- **Commit:** `await connection.commit()` ✅
- **localStorage update:** After successful save ✅
- **Logout impact:** None - data already in database ✅

### ✅ DOCTOR PROFILE SAVE:
- **When:** User clicks "Save" in Edit Profile modal
- **What's saved:**
  - USERS table: name, phone
  - DOCTOR table: degrees, experienceYears, fees, gender
  - DOC_SPECIALIZATION table: specializationId (if provided)
- **Commit:** `await connection.commit()` ✅
- **localStorage update:** After successful save ✅
- **Logout impact:** None - data already in database ✅

### ✅ ADMIN:
- **No profile edit functionality**
- Admin data created during signup only
- Logout has no impact on admin data

---

## 8. RECOMMENDATIONS

### High Priority:

1. **Fix logout to clear all localStorage**
   ```javascript
   const handleLogout = () => {
     localStorage.clear();  // Instead of removeItem('user')
     navigate('/login');
   };
   ```

2. **Add token expiry check**
   ```javascript
   const isTokenExpired = (token) => {
     const decoded = jwt.decode(token);
     return decoded.exp * 1000 < Date.now();
   };
   ```

3. **Add 401 error interceptor**
   ```javascript
   if (res.status === 401) {
     localStorage.clear();
     navigate('/login');
   }
   ```

4. **Backend: Verify role from JWT, not request body**
   ```javascript
   const token = req.headers.authorization?.split(' ')[1];
   const decoded = jwt.verify(token, JWT_SECRET);
   const userRole = decoded.role;  // Use this, not req.body.role
   ```

### Medium Priority:

5. **Implement refresh token**
6. **Add token blacklist on logout**
7. **Add session timeout warning**
8. **Add "Remember Me" functionality**

---

## 9. CONCLUSION

### ✅ PROFILE DATA IS SAFE:
- All profile updates are committed to database BEFORE logout
- Logout only clears localStorage (frontend state)
- Database remains intact after logout
- User can login again and see their saved profile

### ⚠️ SECURITY CONCERNS:
- Token expiry not validated on frontend
- No refresh token mechanism
- Incomplete localStorage cleanup
- No 401 auto-logout
- Role can be manipulated in localStorage

### 📊 SUMMARY TABLE:

| Dashboard | Profile Edit | Save to DB | Commit | localStorage Update | Logout Clears DB |
|-----------|-------------|------------|--------|-------------------|------------------|
| Patient   | ✅ Yes      | ✅ Yes     | ✅ Yes | ✅ Yes            | ❌ No            |
| Doctor    | ✅ Yes      | ✅ Yes     | ✅ Yes | ✅ Yes            | ❌ No            |
| Admin     | ❌ No       | N/A        | N/A    | N/A               | ❌ No            |

**FINAL ANSWER:** Yes, everything is saved properly after logout. Profile information is committed to the database BEFORE logout happens. Logout only clears the frontend session (localStorage), it does NOT affect the database.
