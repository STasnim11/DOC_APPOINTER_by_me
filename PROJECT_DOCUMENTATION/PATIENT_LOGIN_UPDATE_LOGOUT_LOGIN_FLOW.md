# PATIENT: LOGIN → UPDATE PROFILE → LOGOUT → LOGIN FLOW

## ANSWER: ✅ YES, PATIENT WILL SEE UPDATED PROFILE

The patient will see their updated profile because:
1. Profile updates are saved to the database
2. On login, fresh data is fetched from the database
3. localStorage is cleared on logout and repopulated on login

---

## COMPLETE CODE FLOW

### STEP 1: PATIENT LOGS IN (First Time)

#### Frontend: `frontend/src/pages/Login.jsx` (Lines 13-64)

```javascript
const handleLogin = async () => {
  if (!email || !password) {
    setMessage("Please enter email and password");
    return;
  }

  setLoading(true);
  setMessage("");

  try {
    // 1. Call login API
    const res = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, pass: password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || data.message || "Login failed");
      setLoading(false);
      return;
    }

    const { role } = data.user;
    
    // 2. Clear old localStorage data
    localStorage.clear();

    // 3. Store new session data
    const userWithToken = { ...data.user, token: data.token };
    localStorage.setItem("user", JSON.stringify(userWithToken));
    localStorage.setItem("userEmail", data.user.email);
    localStorage.setItem("userRole", role);

    // 4. Navigate to patient dashboard
    const userRole = role.toUpperCase();
    
    if (userRole === "PATIENT") {
      navigate("/patient/dashboard");
    }

  } catch (err) {
    console.error(err);
    setMessage("Server error ❌");
  } finally {
    setLoading(false);
  }
};
```

**What's stored in localStorage after login:**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "01234567890",
    "role": "PATIENT",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "userEmail": "john@example.com",
  "userRole": "PATIENT"
}
```

#### Backend: `backend/controllers/authController.js` (Lines 163-227)

```javascript
exports.login = async (req, res) => {
  const { email, pass } = req.body;
  console.log("Login request received:", { email });

  if (!email || !pass) {
    return res.status(400).json({ error: "❌ Email and password are required" });
  }

  let connection;
  try {
    connection = await connectDB();
    console.log("Connected to database");

    // 1. Fetch user from USERS table
    const result = await connection.execute(
      `SELECT ID, NAME, EMAIL, PASS, PHONE, ROLE FROM USERS WHERE EMAIL = :email`,
      { email }
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "❌ Invalid email or password" });
    }

    const user = {
      id: result.rows[0][0],
      name: result.rows[0][1],
      email: result.rows[0][2],
      pass: result.rows[0][3],
      phone: result.rows[0][4],
      role: result.rows[0][5]
    };

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(pass, user.pass);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "❌ Invalid email or password" });
    }

    // 3. Generate JWT token (expires in 24h)
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    console.log("✅ Login successful for:", email);

    // 4. Return user data + token
    res.status(200).json({
      message: "✅ Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "❌ Login failed. Please try again." });
  } finally {
    if (connection) {
      await connection.close();
      console.log("Database connection closed");
    }
  }
};
```

---

### STEP 2: PATIENT DASHBOARD LOADS & FETCHES PROFILE

#### Frontend: `frontend/src/pages/PatientDashboard.jsx` (Lines 5-83)

```javascript
export default function PatientDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    bloodType: '',
    maritalStatus: '',
    occupation: '',
    address: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [appointments, setAppointments] = useState([]);

  // 1. Check authentication on mount
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = storedUser.role ? storedUser.role.toUpperCase() : '';
    
    if (userRole !== 'PATIENT') {
      navigate('/login');
      return;
    }
    
    setUser(storedUser);
    
    // 2. Fetch profile from database
    if (storedUser.email) {
      fetchProfile(storedUser.email);
      fetchAppointments(storedUser.email);
    }
  }, [navigate]);

  // 3. Fetch profile from database
  const fetchProfile = async (email) => {
    try {
      const res = await fetch(`http://localhost:3000/api/patient/profile/${email}`, {
        headers: {
          'Authorization': `Bearer ${user?.token || JSON.parse(localStorage.getItem('user')).token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        // 4. Populate form with database data
        setProfileData({
          name: data.profile.name || '',
          email: data.profile.email || '',
          phone: data.profile.phone || '',
          dateOfBirth: data.profile.dateOfBirth ? data.profile.dateOfBirth.split('T')[0] : '',
          gender: data.profile.gender || '',
          bloodType: data.profile.bloodType || '',
          maritalStatus: data.profile.maritalStatus || '',
          occupation: data.profile.occupation || '',
          address: data.profile.address || ''
        });
      } else {
        console.error('Failed to fetch profile');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const fetchAppointments = async (email) => {
    try {
      const res = await fetch(`http://localhost:3000/api/patient/appointments/${email}`, {
        headers: {
          'Authorization': `Bearer ${user?.token || JSON.parse(localStorage.getItem('user')).token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  };
```

#### Backend: `backend/controllers/patientProfileUpdate.js` (GET profile endpoint)

```javascript
// GET /api/patient/profile/:email
exports.getPatientProfile = async (req, res) => {
  let connection;
  
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    connection = await connectDB();

    // 1. Fetch from USERS and PATIENT tables (JOIN)
    const result = await connection.execute(
      `SELECT 
        u.ID,
        u.NAME,
        u.EMAIL,
        u.PHONE,
        p.DATE_OF_BIRTH,
        p.GENDER,
        p.BLOOD_TYPE,
        p.MARITAL_STATUS,
        p.OCCUPATION,
        p.ADDRESS
      FROM USERS u
      LEFT JOIN PATIENT p ON u.ID = p.USER_ID
      WHERE u.EMAIL = :email AND u.ROLE = 'PATIENT'`,
      { email }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    const row = result.rows[0];

    // 2. Return profile data from database
    res.json({
      success: true,
      profile: {
        id: row[0],
        name: row[1],
        email: row[2],
        phone: row[3],
        dateOfBirth: row[4],
        gender: row[5],
        bloodType: row[6],
        maritalStatus: row[7],
        occupation: row[8],
        address: row[9]
      }
    });

  } catch (error) {
    console.error('Error fetching patient profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};
```

**At this point, patient sees their current profile from database**

---

### STEP 3: PATIENT UPDATES PROFILE

#### Frontend: `frontend/src/pages/PatientDashboard.jsx` (Lines 85-117)

```javascript
const handleUpdateProfile = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    // 1. Send updated data to backend
    const res = await fetch('http://localhost:3000/api/patient/update-profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)  // All updated fields
    });

    if (res.ok) {
      const result = await res.json();
      
      // 2. Update localStorage with new name/phone
      const updatedUser = { ...user, name: profileData.name, phone: profileData.phone };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      // 3. Show success message
      setMessage('✅ Profile updated successfully');
      setEditMode(false);
      setTimeout(() => setMessage(''), 3000);
    } else {
      const result = await res.json();
      setMessage('❌ ' + (result.error || 'Failed to update profile'));
    }
  } catch (err) {
    console.error('Error updating profile:', err);
    setMessage('❌ Server error');
  } finally {
    setLoading(false);
  }
};
```

#### Backend: `backend/controllers/patientProfileUpdate.js` (PUT update endpoint)

```javascript
// PUT /api/patient/update-profile
exports.updatePatientProfile = async (req, res) => {
  let connection;
  
  try {
    const {
      email,
      name,
      phone,
      dateOfBirth,
      gender,
      bloodType,
      maritalStatus,
      occupation,
      address
    } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    connection = await connectDB();

    // 1. Get user ID
    const userResult = await connection.execute(
      `SELECT ID FROM USERS WHERE EMAIL = :email AND ROLE = 'PATIENT'`,
      { email }
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    const userId = userResult.rows[0][0];

    // 2. Update USERS table (name, phone)
    await connection.execute(
      `UPDATE USERS
       SET NAME = :name,
           PHONE = :phone
       WHERE EMAIL = :email`,
      { name, phone, email }
    );

    // 3. Update PATIENT table (all other fields)
    await connection.execute(
      `UPDATE PATIENT
       SET DATE_OF_BIRTH = :dateOfBirth,
           GENDER = :gender,
           BLOOD_TYPE = :bloodType,
           MARITAL_STATUS = :maritalStatus,
           OCCUPATION = :occupation,
           ADDRESS = :address
       WHERE USER_ID = :userId`,
      {
        userId,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || null,
        bloodType: bloodType || null,
        maritalStatus: maritalStatus || null,
        occupation: occupation || null,
        address: address || null
      }
    );

    // 4. COMMIT TO DATABASE ✅
    await connection.commit();

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating patient profile:', error);
    if (connection) {
      await connection.rollback();
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};
```

**DATABASE STATE AFTER UPDATE:**
```sql
-- USERS table
ID | NAME          | EMAIL              | PHONE       | ROLE
1  | John Doe NEW  | john@example.com   | 01987654321 | PATIENT

-- PATIENT table
ID | USER_ID | DATE_OF_BIRTH | GENDER | BLOOD_TYPE | MARITAL_STATUS | OCCUPATION | ADDRESS
1  | 1       | 1990-05-15    | Male   | O+         | Single         | Engineer   | 123 Main St
```

---

### STEP 4: PATIENT LOGS OUT

#### Frontend: `frontend/src/pages/PatientDashboard.jsx` (Lines 147-150)

```javascript
const handleLogout = () => {
  // 1. Remove user from localStorage
  localStorage.removeItem('user');
  
  // 2. Navigate to home
  navigate('/');
};
```

**localStorage AFTER logout:**
```json
{
  // "user" key is removed
  "userEmail": "john@example.com",  // Still there (leftover)
  "userRole": "PATIENT"              // Still there (leftover)
}
```

**DATABASE remains unchanged** - All profile data is still there!

---

### STEP 5: PATIENT LOGS IN AGAIN

#### Frontend: `frontend/src/pages/Login.jsx` (Same as Step 1)

```javascript
const handleLogin = async () => {
  // ... validation ...

  try {
    // 1. Call login API
    const res = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, pass: password }),
    });

    const data = await res.json();

    // 2. Clear ALL old localStorage data
    localStorage.clear();

    // 3. Store NEW session data (with updated name/phone from database)
    const userWithToken = { ...data.user, token: data.token };
    localStorage.setItem("user", JSON.stringify(userWithToken));
    localStorage.setItem("userEmail", data.user.email);
    localStorage.setItem("userRole", role);

    // 4. Navigate to patient dashboard
    navigate("/patient/dashboard");

  } catch (err) {
    console.error(err);
    setMessage("Server error ❌");
  }
};
```

#### Backend: `backend/controllers/authController.js` (Same as Step 1)

```javascript
exports.login = async (req, res) => {
  // ... validation ...

  try {
    connection = await connectDB();

    // 1. Fetch UPDATED user data from USERS table
    const result = await connection.execute(
      `SELECT ID, NAME, EMAIL, PASS, PHONE, ROLE FROM USERS WHERE EMAIL = :email`,
      { email }
    );

    const user = {
      id: result.rows[0][0],
      name: result.rows[0][1],      // ✅ UPDATED NAME from database
      email: result.rows[0][2],
      pass: result.rows[0][3],
      phone: result.rows[0][4],     // ✅ UPDATED PHONE from database
      role: result.rows[0][5]
    };

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(pass, user.pass);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "❌ Invalid email or password" });
    }

    // 3. Generate new JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 4. Return UPDATED user data
    res.status(200).json({
      message: "✅ Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,      // ✅ UPDATED NAME
        email: user.email,
        phone: user.phone,    // ✅ UPDATED PHONE
        role: user.role
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "❌ Login failed. Please try again." });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};
```

---

### STEP 6: PATIENT DASHBOARD LOADS WITH UPDATED PROFILE

#### Frontend: `frontend/src/pages/PatientDashboard.jsx` (Same as Step 2)

```javascript
useEffect(() => {
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  // storedUser now has UPDATED name and phone from login response
  
  setUser(storedUser);
  
  if (storedUser.email) {
    // Fetch FULL profile from database (including other fields)
    fetchProfile(storedUser.email);
    fetchAppointments(storedUser.email);
  }
}, [navigate]);

const fetchProfile = async (email) => {
  try {
    const res = await fetch(`http://localhost:3000/api/patient/profile/${email}`, {
      headers: {
        'Authorization': `Bearer ${user?.token || JSON.parse(localStorage.getItem('user')).token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      // ✅ ALL UPDATED FIELDS from database
      setProfileData({
        name: data.profile.name || '',              // ✅ UPDATED
        email: data.profile.email || '',
        phone: data.profile.phone || '',            // ✅ UPDATED
        dateOfBirth: data.profile.dateOfBirth ? data.profile.dateOfBirth.split('T')[0] : '',  // ✅ UPDATED
        gender: data.profile.gender || '',          // ✅ UPDATED
        bloodType: data.profile.bloodType || '',    // ✅ UPDATED
        maritalStatus: data.profile.maritalStatus || '',  // ✅ UPDATED
        occupation: data.profile.occupation || '',  // ✅ UPDATED
        address: data.profile.address || ''         // ✅ UPDATED
      });
    }
  } catch (err) {
    console.error('Error fetching profile:', err);
  }
};
```

#### Backend: `backend/controllers/patientProfileUpdate.js` (Same GET endpoint)

```javascript
exports.getPatientProfile = async (req, res) => {
  // ... connection ...

  // Fetch UPDATED data from database
  const result = await connection.execute(
    `SELECT 
      u.ID,
      u.NAME,           -- ✅ UPDATED NAME
      u.EMAIL,
      u.PHONE,          -- ✅ UPDATED PHONE
      p.DATE_OF_BIRTH,  -- ✅ UPDATED
      p.GENDER,         -- ✅ UPDATED
      p.BLOOD_TYPE,     -- ✅ UPDATED
      p.MARITAL_STATUS, -- ✅ UPDATED
      p.OCCUPATION,     -- ✅ UPDATED
      p.ADDRESS         -- ✅ UPDATED
    FROM USERS u
    LEFT JOIN PATIENT p ON u.ID = p.USER_ID
    WHERE u.EMAIL = :email AND u.ROLE = 'PATIENT'`,
    { email }
  );

  // Return ALL UPDATED fields
  res.json({
    success: true,
    profile: {
      id: row[0],
      name: row[1],           // ✅ UPDATED
      email: row[2],
      phone: row[3],          // ✅ UPDATED
      dateOfBirth: row[4],    // ✅ UPDATED
      gender: row[5],         // ✅ UPDATED
      bloodType: row[6],      // ✅ UPDATED
      maritalStatus: row[7],  // ✅ UPDATED
      occupation: row[8],     // ✅ UPDATED
      address: row[9]         // ✅ UPDATED
    }
  });
};
```

---

## VISUAL FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: LOGIN (First Time)                                      │
├─────────────────────────────────────────────────────────────────┤
│ Frontend: Login.jsx                                             │
│   → POST /api/login { email, pass }                             │
│                                                                  │
│ Backend: authController.js                                      │
│   → SELECT * FROM USERS WHERE EMAIL = 'john@example.com'        │
│   → Returns: { name: "John Doe", phone: "01234567890" }         │
│                                                                  │
│ Frontend: localStorage                                          │
│   → Stores: { name: "John Doe", phone: "01234567890", token }   │
│                                                                  │
│ Frontend: PatientDashboard.jsx                                  │
│   → GET /api/patient/profile/john@example.com                   │
│   → Displays: John Doe, 01234567890, etc.                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: UPDATE PROFILE                                          │
├─────────────────────────────────────────────────────────────────┤
│ Frontend: PatientDashboard.jsx                                  │
│   → User changes name to "John Doe NEW"                         │
│   → User changes phone to "01987654321"                         │
│   → PUT /api/patient/update-profile { name, phone, ... }        │
│                                                                  │
│ Backend: patientProfileUpdate.js                                │
│   → UPDATE USERS SET NAME='John Doe NEW', PHONE='01987654321'   │
│   → UPDATE PATIENT SET ... (other fields)                       │
│   → COMMIT ✅                                                    │
│                                                                  │
│ Frontend: localStorage                                          │
│   → Updates: { name: "John Doe NEW", phone: "01987654321" }     │
│                                                                  │
│ DATABASE STATE:                                                 │
│   USERS: name="John Doe NEW", phone="01987654321" ✅            │
│   PATIENT: all other fields updated ✅                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: LOGOUT                                                  │
├─────────────────────────────────────────────────────────────────┤
│ Frontend: PatientDashboard.jsx                                  │
│   → localStorage.removeItem('user')                             │
│   → navigate('/')                                               │
│                                                                  │
│ localStorage: user key removed ❌                               │
│ DATABASE: unchanged ✅ (data still there)                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: LOGIN AGAIN                                             │
├─────────────────────────────────────────────────────────────────┤
│ Frontend: Login.jsx                                             │
│   → localStorage.clear() (removes all old data)                 │
│   → POST /api/login { email, pass }                             │
│                                                                  │
│ Backend: authController.js                                      │
│   → SELECT * FROM USERS WHERE EMAIL = 'john@example.com'        │
│   → Returns: { name: "John Doe NEW", phone: "01987654321" } ✅  │
│                                                                  │
│ Frontend: localStorage                                          │
│   → Stores: { name: "John Doe NEW", phone: "01987654321" } ✅   │
│                                                                  │
│ Frontend: PatientDashboard.jsx                                  │
│   → GET /api/patient/profile/john@example.com                   │
│   → Displays: John Doe NEW, 01987654321, etc. ✅                │
└─────────────────────────────────────────────────────────────────┘
```

---

## SUMMARY

### ✅ YES, PATIENT SEES UPDATED PROFILE BECAUSE:

1. **Profile update saves to database** (USERS + PATIENT tables)
2. **Database commit happens** (`await connection.commit()`)
3. **Logout only clears localStorage** (doesn't touch database)
4. **Login fetches fresh data from database** (SELECT from USERS table)
5. **Dashboard fetches full profile from database** (JOIN USERS + PATIENT)

### DATA FLOW:

```
UPDATE → DATABASE (committed) → LOGOUT (clears localStorage) 
→ LOGIN (fetches from DATABASE) → DASHBOARD (fetches from DATABASE)
```

### KEY FILES:

1. **Login:** `frontend/src/pages/Login.jsx` + `backend/controllers/authController.js`
2. **Update:** `frontend/src/pages/PatientDashboard.jsx` + `backend/controllers/patientProfileUpdate.js`
3. **Logout:** `frontend/src/pages/PatientDashboard.jsx` (handleLogout)
4. **Fetch Profile:** `backend/controllers/patientProfileUpdate.js` (getPatientProfile)

### TABLES INVOLVED:

- **USERS:** Stores name, email, phone, role
- **PATIENT:** Stores dateOfBirth, gender, bloodType, maritalStatus, occupation, address

Both tables are updated and committed during profile update, ensuring data persistence across logout/login cycles.
