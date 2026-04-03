# DEBUG: Patient Profile Not Updating After Logout/Login

## ISSUE REPRODUCTION

1. Patient logs in
2. Updates profile (e.g., changes name from "John" to "John NEW")
3. Sees success message "✅ Profile updated successfully"
4. Logs out
5. Logs in again
6. Profile still shows old name "John" instead of "John NEW"

---

## ROOT CAUSE ANALYSIS

### Problem 1: Profile Display Uses localStorage Instead of Database

**File:** `frontend/src/pages/PatientDashboard.jsx` (Lines 367-369)

```javascript
<div className="info-row">
  <label>Name:</label>
  <span>{profileData.name || user?.name || 'Not provided'}</span>
  //                          ^^^^^^^^^^
  //                          FALLBACK TO localStorage!
</div>
```

**The Issue:**
- When `profileData.name` is empty/undefined, it falls back to `user.name`
- `user` comes from localStorage (set during login)
- If `fetchPatientProfile()` fails or returns incomplete data, it shows stale localStorage data

### Problem 2: Profile Fetch Might Be Failing Silently

**File:** `frontend/src/pages/PatientDashboard.jsx` (Lines 30-39)

```javascript
const fetchPatientProfile = async (email) => {
  try {
    const res = await fetch(`http://localhost:3000/api/patient/profile/${email}`);
    if (res.ok) {
      const data = await res.json();
      setProfileData(data);  // Sets entire response
    }
    // ❌ NO ERROR HANDLING if res.ok is false!
  } catch (err) {
    console.error('Error fetching patient profile:', err);
    // ❌ NO USER FEEDBACK on error
  }
};
```

**The Issue:**
- If API returns 404 or 500, `profileData` remains empty `{}`
- No error message shown to user
- Falls back to localStorage data in display

### Problem 3: Login Response Only Contains Basic User Info

**File:** `backend/controllers/authController.js` (Lines 210-220)

```javascript
res.status(200).json({
  message: "✅ Login successful",
  token,
  user: {
    id: user.id,
    name: user.name,      // ✅ From USERS table (updated)
    email: user.email,
    phone: user.phone,    // ✅ From USERS table (updated)
    role: user.role
  }
});
```

**What's Included:**
- ✅ name (from USERS table - should be updated)
- ✅ phone (from USERS table - should be updated)
- ❌ dateOfBirth (NOT included - from PATIENT table)
- ❌ gender (NOT included - from PATIENT table)
- ❌ bloodType (NOT included - from PATIENT table)
- ❌ maritalStatus (NOT included - from PATIENT table)
- ❌ occupation (NOT included - from PATIENT table)
- ❌ address (NOT included - from PATIENT table)

**The Issue:**
- Login only returns USERS table data
- PATIENT table data must be fetched separately via `fetchPatientProfile()`
- If that fetch fails, only name/phone show (from localStorage)

---

## ACTUAL FLOW ANALYSIS

### STEP 1: Login
```
1. POST /api/login
2. Backend: SELECT * FROM USERS WHERE EMAIL = 'john@example.com'
3. Returns: { name: "John NEW", phone: "01987654321" } ✅ UPDATED
4. Frontend: localStorage.setItem('user', { name: "John NEW", ... })
5. Frontend: fetchPatientProfile('john@example.com')
6. Backend: SELECT * FROM USERS u LEFT JOIN PATIENT p ...
7. Returns: { name: "John NEW", dateOfBirth: "1990-05-15", ... } ✅ UPDATED
8. Frontend: setProfileData({ name: "John NEW", ... })
```

**Expected:** Profile shows "John NEW" ✅

### STEP 2: Why It Might Not Work

**Scenario A: API Call Fails**
```
5. Frontend: fetchPatientProfile('john@example.com')
6. Backend: Returns 404 or 500
7. Frontend: profileData remains {}
8. Display: Falls back to user.name from localStorage
```

**Scenario B: Timing Issue**
```
4. Frontend: localStorage.setItem('user', { name: "John NEW" })
5. Frontend: fetchPatientProfile() called
6. Component renders BEFORE fetch completes
7. Display: Shows user.name from localStorage (correct)
8. Fetch completes, setProfileData() called
9. Component re-renders with profileData.name (correct)
```

**Scenario C: Email Mismatch**
```
5. Frontend: fetchPatientProfile(user.email)
6. user.email might be undefined or wrong
7. Backend: Returns 404
8. Frontend: profileData remains {}
```

---

## DEBUGGING STEPS

### Step 1: Add Console Logs to Frontend

**File:** `frontend/src/pages/PatientDashboard.jsx`

```javascript
const fetchPatientProfile = async (email) => {
  console.log('🔍 Fetching profile for email:', email);
  try {
    const res = await fetch(`http://localhost:3000/api/patient/profile/${email}`);
    console.log('📡 Profile fetch response status:', res.status);
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Profile data received:', data);
      setProfileData(data);
    } else {
      const error = await res.json();
      console.error('❌ Profile fetch failed:', error);
      setMessage('❌ Failed to load profile');
    }
  } catch (err) {
    console.error('❌ Error fetching profile:', err);
    setMessage('❌ Error loading profile');
  }
};
```

### Step 2: Add Console Logs to Backend

**File:** `backend/controllers/patientProfileUpdate.js`

```javascript
exports.getPatientProfile = async (req, res) => {
  const { email } = req.params;
  console.log('🔍 GET profile request for email:', email);

  let connection;
  try {
    connection = await connectDB();

    const userResult = await connection.execute(
      `SELECT u.ID, u.NAME, u.EMAIL, u.PHONE, u.ROLE,
              p.DATE_OF_BIRTH, p.GENDER, p.OCCUPATION, p.BLOOD_TYPE, 
              p.MARITAL_STATUS, p.ADDRESS
       FROM USERS u
       LEFT JOIN PATIENT p ON u.ID = p.USER_ID
       WHERE TRIM(LOWER(u.EMAIL)) = TRIM(LOWER(:email))
         AND TRIM(UPPER(u.ROLE)) = 'PATIENT'`,
      { email }
    );

    console.log('📊 Query returned rows:', userResult.rows.length);

    if (userResult.rows.length === 0) {
      console.log('❌ Patient not found for email:', email);
      return res.status(404).json({ error: "❌ Patient not found" });
    }

    const row = userResult.rows[0];
    const profile = {
      id: row[0],
      name: row[1],
      email: row[2],
      phone: row[3],
      role: row[4],
      dateOfBirth: row[5],
      gender: row[6],
      occupation: row[7],
      bloodType: row[8],
      maritalStatus: row[9],
      address: row[10]
    };

    console.log('✅ Returning profile:', profile);
    return res.status(200).json(profile);
  } catch (err) {
    console.error("❌ Get patient profile error:", err);
    return res.status(500).json({ error: "❌ Failed to get profile" });
  } finally {
    if (connection) await connection.close();
  }
};
```

### Step 3: Check Database Directly

```sql
-- Check if update actually saved
SELECT u.NAME, u.PHONE, p.GENDER, p.BLOOD_TYPE
FROM USERS u
LEFT JOIN PATIENT p ON u.ID = p.USER_ID
WHERE u.EMAIL = 'john@example.com';
```

---

## LIKELY CAUSES (Ranked by Probability)

### 1. ⭐⭐⭐ Profile Fetch Returns 404 (Most Likely)
- Email in localStorage might be different from database
- Case sensitivity issue (email stored as "John@example.com" but querying "john@example.com")
- TRIM/LOWER in SQL might not match

### 2. ⭐⭐ Update Didn't Actually Save to Database
- Transaction not committed
- Update query failed silently
- Wrong email used in WHERE clause

### 3. ⭐ Timing Issue
- Component renders before fetch completes
- profileData not updated properly

---

## SOLUTION

### Fix 1: Add Error Handling and Logging

**File:** `frontend/src/pages/PatientDashboard.jsx`

```javascript
const fetchPatientProfile = async (email) => {
  console.log('🔍 Fetching profile for:', email);
  try {
    const res = await fetch(`http://localhost:3000/api/patient/profile/${email}`);
    console.log('📡 Response status:', res.status);
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Profile loaded:', data);
      setProfileData(data);
    } else {
      const error = await res.json();
      console.error('❌ Failed to load profile:', error);
      setMessage('❌ Failed to load profile: ' + error.error);
    }
  } catch (err) {
    console.error('❌ Error:', err);
    setMessage('❌ Error loading profile');
  }
};
```

### Fix 2: Don't Fall Back to localStorage in Display

**File:** `frontend/src/pages/PatientDashboard.jsx`

```javascript
<div className="info-row">
  <label>Name:</label>
  <span>{profileData.name || 'Loading...'}</span>
  {/* Don't use user?.name as fallback */}
</div>
```

### Fix 3: Ensure Email is Passed Correctly

**File:** `frontend/src/pages/PatientDashboard.jsx`

```javascript
useEffect(() => {
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  console.log('👤 User data from localStorage:', userData);
  
  if (!userData.token || userData.role?.toUpperCase() !== 'PATIENT') {
    navigate('/login');
    return;
  }
  
  setUser(userData);
  
  if (userData.email) {
    console.log('📧 Fetching profile for email:', userData.email);
    fetchPatientProfile(userData.email);
    fetchAppointments(userData.email);
  } else {
    console.error('❌ No email in userData!');
    setMessage('❌ Session error - please login again');
  }
}, [navigate]);
```

---

## TESTING CHECKLIST

After applying fixes, test:

1. ✅ Login → Check console for "Fetching profile for: [email]"
2. ✅ Check console for "Profile loaded: {...}"
3. ✅ Verify profileData contains all fields
4. ✅ Update profile → Check success message
5. ✅ Check database directly (SQL query)
6. ✅ Logout
7. ✅ Login again → Check console logs
8. ✅ Verify updated data shows in UI

---

## NEXT STEPS

1. Add the console.log statements
2. Reproduce the issue
3. Check browser console
4. Check backend terminal
5. Report what you see in the logs
