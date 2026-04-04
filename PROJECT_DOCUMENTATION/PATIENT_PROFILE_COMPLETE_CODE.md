# PATIENT PROFILE - COMPLETE CODE REFERENCE

## 📍 FRONTEND: PatientDashboard.jsx
**Location**: `frontend/src/pages/PatientDashboard.jsx`

---

### 🔹 STATE MANAGEMENT

```javascript
const [user, setUser] = useState(null);
const [activeView, setActiveView] = useState('appointments');
const [showProfileMenu, setShowProfileMenu] = useState(false);
const [appointments, setAppointments] = useState([]);
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState('');
const [editMode, setEditMode] = useState(false);
const [profileData, setProfileData] = useState({});
```

---

### 🔹 USER OBJECT FROM LOCALSTORAGE

```javascript
// Loaded on component mount
const userData = JSON.parse(localStorage.getItem('user') || '{}');

// Contains:
{
  id: userId,
  name: "Patient Name",
  email: "patient@example.com",
  phone: "12345678901",
  role: "PATIENT",
  token: "jwt_token_string"
}
```

---

### 🔹 FETCH PATIENT PROFILE (View Profile)

```javascript
const fetchPatientProfile = async (email) => {
  try {
    const res = await fetch(`http://localhost:3000/api/patient/profile/${email}`);
    if (res.ok) {
      const data = await res.json();
      setProfileData(data);
    }
  } catch (err) {
    console.error('Error fetching patient profile:', err);
  }
};
```

**API**: `GET /api/patient/profile/:email`

**Returns**:
```javascript
{
  id: userId,
  name: "Patient Name",
  email: "patient@example.com",
  phone: "12345678901",
  role: "PATIENT",
  dateOfBirth: "1990-01-01",
  gender: "Male",
  occupation: "Engineer",
  bloodType: "A+",
  maritalStatus: "Single",
  address: "123 Main St"
}
```

---

### 🔹 FETCH APPOINTMENTS

```javascript
const fetchAppointments = async (email) => {
  setLoading(true);
  try {
    const res = await fetch(`http://localhost:3000/api/patient/${email}/appointments`);
    if (res.ok) {
      const data = await res.json();
      setAppointments(data || []);
    }
  } catch (err) {
    console.error('Error fetching appointments:', err);
  } finally {
    setLoading(false);
  }
};
```

**API**: `GET /api/patient/:email/appointments`

**Returns**:
```javascript
[
  {
    appointmentId: 1,
    appointmentDate: "2024-01-15",
    status: "BOOKED",
    type: "CONSULTATION",
    startTime: "09:00",
    endTime: "09:30",
    doctorName: "Dr. Smith",
    doctorEmail: "doctor@example.com",
    slot: "09:00 - 09:30"
  }
]
```

---

### 🔹 UPDATE PROFILE (Edit Profile Save)

```javascript
const handleUpdateProfile = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const res = await fetch('http://localhost:3000/api/patient/update-profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    });

    if (res.ok) {
      const result = await res.json();
      const updatedUser = { ...user, name: profileData.name, phone: profileData.phone };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
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

**API**: `PUT /api/patient/update-profile`

**Sends**:
```javascript
{
  name: "Updated Name",
  phone: "12345678901",
  dateOfBirth: "1990-01-01",
  gender: "Male",
  bloodType: "A+",
  maritalStatus: "Single",
  occupation: "Engineer",
  address: "123 Main St"
}
```

---

### 🔹 CANCEL APPOINTMENT

```javascript
const handleCancelAppointment = async (appointmentId) => {
  if (!window.confirm('Are you sure you want to cancel this appointment?')) {
    return;
  }

  setLoading(true);
  try {
    const res = await fetch(`http://localhost:3000/api/appointments/${appointmentId}/cancel`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.ok) {
      setMessage('✅ Appointment cancelled successfully');
      fetchAppointments(user.email);
      setTimeout(() => setMessage(''), 3000);
    } else {
      const result = await res.json();
      setMessage('❌ ' + (result.error || 'Failed to cancel appointment'));
    }
  } catch (err) {
    console.error('Error cancelling appointment:', err);
    setMessage('❌ Server error');
  } finally {
    setLoading(false);
  }
};
```

**API**: `PUT /api/appointments/:id/cancel`

---

### 🔹 DELETE PROFILE

```javascript
const handleDeleteProfile = async () => {
  if (!window.confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {
    return;
  }

  setLoading(true);
  try {
    const res = await fetch('http://localhost:3000/api/patient/delete-profile', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    });

    if (res.ok) {
      localStorage.removeItem('user');
      navigate('/');
    } else {
      const result = await res.json();
      setMessage('❌ ' + (result.error || 'Failed to delete profile'));
    }
  } catch (err) {
    console.error('Error deleting profile:', err);
    setMessage('❌ Server error');
  } finally {
    setLoading(false);
  }
};
```

**API**: `DELETE /api/patient/delete-profile`

---

### 🔹 VIEW PROFILE UI (Lines 360-440)

**Navigation**: Profile dropdown menu → "View Profile" → Sets `activeView='profile'` and `editMode=false`

```javascript
{activeView === 'profile' && !editMode && (
  <div className="profile-display">
    <div className="profile-avatar-large">
      <span className="avatar-icon">
        {profileData.gender === 'Female' ? '👩' : '👨'}
      </span>
    </div>
    <div className="profile-info">
      <div className="info-row">
        <label>Name:</label>
        <span>{profileData.name || user?.name || 'Not provided'}</span>
      </div>
      <div className="info-row">
        <label>Email:</label>
        <span>{profileData.email || user?.email || 'Not provided'}</span>
      </div>
      <div className="info-row">
        <label>Phone:</label>
        <span>{profileData.phone || user?.phone || 'Not provided'}</span>
      </div>
      <div className="info-row">
        <label>Date of Birth:</label>
        <span>{profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toLocaleDateString() : 'Not provided'}</span>
      </div>
      <div className="info-row">
        <label>Gender:</label>
        <span>{profileData.gender || 'Not provided'}</span>
      </div>
      <div className="info-row">
        <label>Blood Type:</label>
        <span>{profileData.bloodType || 'Not provided'}</span>
      </div>
      <div className="info-row">
        <label>Marital Status:</label>
        <span>{profileData.maritalStatus || 'Not provided'}</span>
      </div>
      <div className="info-row">
        <label>Occupation:</label>
        <span>{profileData.occupation || 'Not provided'}</span>
      </div>
      <div className="info-row">
        <label>Address:</label>
        <span>{profileData.address || 'Not provided'}</span>
      </div>
    </div>
    <button className="btn-edit-profile" onClick={() => setEditMode(true)}>
      Edit Profile
    </button>
  </div>
)}
```

**Data Source**: 
- Primary: `profileData` (from `fetchPatientProfile()` API call)
- Fallback: `user` object from localStorage (for name, email, phone only)

---

### 🔹 EDIT PROFILE UI (Lines 270-359)

**Navigation**: Profile dropdown menu → "Edit Profile" → Sets `activeView='profile'` and `editMode=true`

```javascript
{activeView === 'profile' && editMode && (
  <form onSubmit={handleUpdateProfile} className="profile-form">
    <div className="form-group">
      <label>Name</label>
      <input
        type="text"
        value={profileData.name || ''}
        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
        required
      />
    </div>
    <div className="form-group">
      <label>Email</label>
      <input
        type="email"
        value={profileData.email || ''}
        disabled
        style={{ background: '#f0f0f0', cursor: 'not-allowed' }}
      />
      <small>Email cannot be changed</small>
    </div>
    <div className="form-group">
      <label>Phone</label>
      <input
        type="text"
        value={profileData.phone || ''}
        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
        maxLength="11"
      />
    </div>
    <div className="form-group">
      <label>Date of Birth</label>
      <input
        type="date"
        value={profileData.dateOfBirth || ''}
        onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
      />
    </div>
    <div className="form-group">
      <label>Gender</label>
      <select
        value={profileData.gender || ''}
        onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
      >
        <option value="">Select Gender</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
      </select>
    </div>
    <div className="form-group">
      <label>Blood Type</label>
      <select
        value={profileData.bloodType || ''}
        onChange={(e) => setProfileData({ ...profileData, bloodType: e.target.value })}
      >
        <option value="">Select Blood Type</option>
        <option value="A+">A+</option>
        <option value="A-">A-</option>
        <option value="B+">B+</option>
        <option value="B-">B-</option>
        <option value="AB+">AB+</option>
        <option value="AB-">AB-</option>
        <option value="O+">O+</option>
        <option value="O-">O-</option>
      </select>
    </div>
    <div className="form-group">
      <label>Marital Status</label>
      <select
        value={profileData.maritalStatus || ''}
        onChange={(e) => setProfileData({ ...profileData, maritalStatus: e.target.value })}
      >
        <option value="">Select Status</option>
        <option value="Single">Single</option>
        <option value="Married">Married</option>
        <option value="Divorced">Divorced</option>
        <option value="Widowed">Widowed</option>
      </select>
    </div>
    <div className="form-group">
      <label>Occupation</label>
      <input
        type="text"
        value={profileData.occupation || ''}
        onChange={(e) => setProfileData({ ...profileData, occupation: e.target.value })}
        maxLength="50"
      />
    </div>
    <div className="form-group">
      <label>Address</label>
      <textarea
        value={profileData.address || ''}
        onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
        rows="3"
      />
    </div>
    <div className="form-actions">
      <button type="button" className="btn-cancel" onClick={() => setEditMode(false)}>
        Cancel
      </button>
      <button type="submit" className="btn-save" disabled={loading}>
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  </form>
)}
```

**Editable Fields**:
- Name (text, required)
- Phone (text, 11 digits max)
- Date of Birth (date picker)
- Gender (dropdown: Male/Female)
- Blood Type (dropdown: A+, A-, B+, B-, AB+, AB-, O+, O-)
- Marital Status (dropdown: Single, Married, Divorced, Widowed)
- Occupation (text, 50 chars max)
- Address (textarea)

**Non-editable**: Email (disabled field)

---


## 📍 BACKEND: Patient Profile Controller
**Location**: `backend/controllers/patientProfileUpdate.js`

---

### 🔹 GET PATIENT PROFILE

```javascript
exports.getPatientProfile = async (req, res) => {
  const { email } = req.params;

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

    if (userResult.rows.length === 0) {
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

    return res.status(200).json(profile);
  } catch (err) {
    console.error("Get patient profile error:", err);
    return res.status(500).json({ error: "❌ Failed to get profile" });
  } finally {
    if (connection) await connection.close();
  }
};
```

**Route**: `GET /api/patient/profile/:email`

**Query**: Joins USERS and PATIENT tables

**Returns**: Profile object with all fields

---

### 🔹 UPDATE PATIENT PROFILE

```javascript
exports.updatePatientProfile = async (req, res) => {
  const { name, phone, dateOfBirth, gender, bloodType, maritalStatus, occupation, address } = req.body;
  const userEmail = req.user?.email;

  if (!userEmail) {
    return res.status(401).json({ error: "❌ Unauthorized" });
  }

  let connection;
  try {
    connection = await connectDB();

    // Update USERS table
    await connection.execute(
      `UPDATE USERS
       SET NAME = :name, PHONE = :phone
       WHERE TRIM(LOWER(EMAIL)) = TRIM(LOWER(:email))
         AND TRIM(UPPER(ROLE)) = 'PATIENT'`,
      { name, phone, email: userEmail }
    );

    // Get user ID
    const userResult = await connection.execute(
      `SELECT ID FROM USERS WHERE TRIM(LOWER(EMAIL)) = TRIM(LOWER(:email))`,
      { email: userEmail }
    );

    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0][0];

      // Update PATIENT table
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
    }

    await connection.commit();

    return res.status(200).json({
      message: "✅ Profile updated successfully",
      name,
      phone
    });
  } catch (err) {
    console.error("Update patient profile error:", err);

    if (connection) {
      try {
        await connection.rollback();
      } catch (_) {}
    }

    return res.status(500).json({ error: "❌ Failed to update profile" });
  } finally {
    if (connection) await connection.close();
  }
};
```

**Route**: `PUT /api/patient/update-profile`

**Authentication**: Requires JWT token (via `authenticateToken` middleware)

**Authorization**: Requires PATIENT role (via `requirePatient` middleware)

**Updates 2 Tables**:
1. USERS table: NAME, PHONE
2. PATIENT table: DATE_OF_BIRTH, GENDER, BLOOD_TYPE, MARITAL_STATUS, OCCUPATION, ADDRESS

---

### 🔹 DELETE PATIENT PROFILE

```javascript
exports.deletePatientProfile = async (req, res) => {
  const userEmail = req.user?.email;

  if (!userEmail) {
    return res.status(401).json({ error: "❌ Unauthorized" });
  }

  let connection;
  try {
    connection = await connectDB();

    const userResult = await connection.execute(
      `SELECT ID
       FROM USERS
       WHERE TRIM(LOWER(EMAIL)) = TRIM(LOWER(:email))
         AND TRIM(UPPER(ROLE)) = 'PATIENT'`,
      { email: userEmail }
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Patient not found" });
    }

    const userId = userResult.rows[0][0];

    // Delete appointments first (foreign key constraint)
    await connection.execute(
      `DELETE FROM DOCTORS_APPOINTMENTS
       WHERE PATIENT_ID IN (SELECT ID FROM PATIENT WHERE USER_ID = :userId)`,
      { userId }
    );

    // Delete patient record
    await connection.execute(
      `DELETE FROM PATIENT WHERE USER_ID = :userId`,
      { userId }
    );

    // Delete user record
    await connection.execute(
      `DELETE FROM USERS WHERE ID = :userId`,
      { userId }
    );

    await connection.commit();

    return res.status(200).json({
      message: "✅ Profile deleted successfully"
    });
  } catch (err) {
    console.error("Delete patient profile error:", err);

    if (connection) {
      try {
        await connection.rollback();
      } catch (_) {}
    }

    return res.status(500).json({ error: "❌ Failed to delete profile" });
  } finally {
    if (connection) await connection.close();
  }
};
```

**Route**: `DELETE /api/patient/delete-profile`

**Authentication**: Requires JWT token

**Authorization**: Requires PATIENT role

**Deletes in order**:
1. DOCTORS_APPOINTMENTS (appointments for this patient)
2. PATIENT (patient record)
3. USERS (user account)

---

### 🔹 CREATE PATIENT PROFILE (Setup)

```javascript
exports.createPatientProfile = async (req, res) => {
  const {
    userId,
    dateOfBirth,
    gender,
    occupation,
    bloodType,
    maritalStatus,
    address,
  } = req.body;

  if (!userId) {
    return res.status(400).json({
      error: "❌ userId is required",
    });
  }

  let connection;

  try {
    connection = await connectDB();

    const sql = `UPDATE PATIENT
SET
  DATE_OF_BIRTH = :dateOfBirth,
  GENDER = :gender,
  OCCUPATION = :occupation,
  BLOOD_TYPE = :bloodType,
  MARITAL_STATUS = :maritalStatus,
  ADDRESS = :address
WHERE USER_ID = :userId`;

    const binds = {
      userId,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender: gender || null,
      occupation: occupation || null,
      bloodType: bloodType || null,
      maritalStatus: maritalStatus || null,
      address: address || null,
    };

    await connection.execute(sql, binds, { autoCommit: true });

    return res.status(201).json({
      message: "✅ Patient profile created successfully",
    });
  } catch (error) {
    console.error("Error creating patient profile:", error);

    return res.status(500).json({
      error: "❌ Failed to create patient profile",
      details: error.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error("Error closing connection:", closeError);
      }
    }
  }
};
```

**Route**: `POST /api/patient-profile`

**Note**: This is actually an UPDATE query (not INSERT) because PATIENT record is created during signup

---

## 📍 BACKEND: Patient Appointments Controller
**Location**: `backend/controllers/patientAppointments.js`

---

### 🔹 GET PATIENT APPOINTMENTS

```javascript
exports.getPatientAppointmentsByEmail = async (req, res) => {
  const { email } = req.params;
  let connection;

  if (!email) {
    return res.status(400).json({ error: "❌ Patient email is required" });
  }

  try {
    connection = await connectDB();

    // Get user ID from email
    const userResult = await connection.execute(
      `SELECT ID
       FROM USERS
       WHERE TRIM(LOWER(EMAIL)) = TRIM(LOWER(:email))
         AND TRIM(UPPER(ROLE)) = 'PATIENT'`,
      { email }
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Patient user not found" });
    }

    const userId = userResult.rows[0][0];

    // Get patient ID from user ID
    const patientResult = await connection.execute(
      `SELECT ID
       FROM PATIENT
       WHERE USER_ID = :userId`,
      { userId }
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Patient profile not found" });
    }

    const patientId = patientResult.rows[0][0];

    // Get all appointments for this patient
    const appointmentResult = await connection.execute(
      `SELECT
          da.ID,
          da.APPOINTMENT_DATE,
          da.STATUS,
          da.TYPE,
          ts.START_TIME,
          ts.END_TIME,
          du.NAME,
          du.EMAIL
       FROM DOCTORS_APPOINTMENTS da
       JOIN TIME_SLOTS ts
         ON da.TIME_SLOT_ID = ts.ID
       JOIN DOCTOR d
         ON da.DOCTOR_ID = d.ID
       JOIN USERS du
         ON d.USER_ID = du.ID
       WHERE da.PATIENT_ID = :patientId
       ORDER BY da.APPOINTMENT_DATE DESC, ts.START_TIME ASC`,
      { patientId }
    );

    const appointments = formatAppointments(appointmentResult.rows);

    return res.status(200).json(appointments);
  } catch (error) {
    console.error("Error fetching patient appointments:", error);
    return res.status(500).json({ error: "❌ Failed to fetch patient appointments" });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error("Error closing DB connection:", closeError);
      }
    }
  }
};

const formatAppointments = (rows) => {
  return rows.map((row) => ({
    appointmentId: row[0],
    appointmentDate: row[1],
    status: row[2],
    type: row[3],
    startTime: row[4],
    endTime: row[5],
    doctorName: row[6],
    doctorEmail: row[7],
    slot: `${row[4]} - ${row[5]}`,
  }));
};
```

**Route**: `GET /api/patient/:email/appointments`

**Query**: Joins DOCTORS_APPOINTMENTS, TIME_SLOTS, DOCTOR, and USERS tables

**Returns**: Array of appointment objects with doctor info and time slots

---

## 📍 BACKEND: Routes Registration
**Location**: `backend/routes/auth.js`

---

### 🔹 ALL PATIENT-RELATED ROUTES

```javascript
// Get patient profile
router.get("/patient/profile/:email", patientProfileUpdate.getPatientProfile);

// Create/setup patient profile
router.post("/patient-profile", patientProfileUpdate.createPatientProfile);

// Update patient profile (requires auth + patient role)
router.put("/patient/update-profile", authenticateToken, requirePatient, patientProfileUpdate.updatePatientProfile);

// Delete patient profile (requires auth + patient role)
router.delete("/patient/delete-profile", authenticateToken, requirePatient, patientProfileUpdate.deletePatientProfile);

// Get patient appointments
router.get("/patient/:email/appointments", patientAppointmentsController.getPatientAppointmentsByEmail);

// Cancel appointment (requires auth + patient role)
router.put("/appointments/:id/cancel", authenticateToken, requirePatient, appointmentController.cancelAppointment);
```

---

## 📊 COMPLETE API SUMMARY

### Patient Profile APIs

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/patient/profile/:email` | No | Fetch patient profile data |
| POST | `/api/patient-profile` | No | Create/setup patient profile |
| PUT | `/api/patient/update-profile` | Yes (JWT + PATIENT) | Update patient profile |
| DELETE | `/api/patient/delete-profile` | Yes (JWT + PATIENT) | Delete patient account |

### Appointment APIs

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/patient/:email/appointments` | No | Get all appointments for patient |
| PUT | `/api/appointments/:id/cancel` | Yes (JWT + PATIENT) | Cancel an appointment |

---

## 🗂️ DATABASE TABLES USED

### USERS Table
- Stores: ID, NAME, EMAIL, PHONE, ROLE, PASS
- Updated by: Update Profile (NAME, PHONE)

### PATIENT Table
- Stores: ID, USER_ID, DATE_OF_BIRTH, GENDER, OCCUPATION, BLOOD_TYPE, MARITAL_STATUS, ADDRESS
- Updated by: Update Profile (all fields except ID, USER_ID)

### DOCTORS_APPOINTMENTS Table
- Stores: ID, DOCTOR_ID, PATIENT_ID, TIME_SLOT_ID, APPOINTMENT_DATE, STATUS, TYPE
- Used by: Get Appointments, Cancel Appointment

### TIME_SLOTS Table
- Stores: ID, DOCTOR_ID, START_TIME, END_TIME, STATUS, DAY_OF_WEEK
- Used by: Get Appointments (to show time slots)

---

## 🔄 COMPLETE FLOW

### View Profile Flow
1. User clicks "View Profile" in dropdown menu
2. Sets `activeView='profile'` and `editMode=false`
3. Displays profile data from `profileData` state
4. Data was fetched on component mount via `fetchPatientProfile(email)`
5. Fallback to `user` object from localStorage for name/email/phone

### Edit Profile Flow
1. User clicks "Edit Profile" in dropdown menu
2. Sets `activeView='profile'` and `editMode=true`
3. Shows form with all editable fields pre-filled from `profileData`
4. User modifies fields and clicks "Save Changes"
5. Calls `handleUpdateProfile()` → `PUT /api/patient/update-profile`
6. Backend updates USERS table (name, phone) and PATIENT table (other fields)
7. Updates localStorage with new name/phone
8. Switches back to View Profile mode

### Appointments Flow
1. User lands on dashboard (default view is 'appointments')
2. `fetchAppointments(email)` called on mount
3. Backend fetches from DOCTORS_APPOINTMENTS joined with TIME_SLOTS, DOCTOR, USERS
4. Displays list of appointments with doctor name, date, time, status
5. User can cancel BOOKED appointments
6. Cancel calls `PUT /api/appointments/:id/cancel` with JWT token

---

## ✅ KEY POINTS

1. **Email is read-only**: Cannot be changed (unique identifier)
2. **Two-table update**: Profile update modifies both USERS and PATIENT tables
3. **JWT required for mutations**: Update and Delete require authentication
4. **Role-based access**: Update/Delete require PATIENT role
5. **LocalStorage sync**: After profile update, localStorage is updated with new name/phone
6. **Cascading delete**: Delete profile removes appointments → patient → user (in order)
7. **Gender options**: Only Male/Female
8. **Blood type options**: A+, A-, B+, B-, AB+, AB-, O+, O-
9. **Marital status options**: Single, Married, Divorced, Widowed
10. **Phone validation**: 11 digits max

---

## 📁 FILE LOCATIONS

### Frontend
- `frontend/src/pages/PatientDashboard.jsx` - Main dashboard with profile view/edit

### Backend
- `backend/controllers/patientProfileUpdate.js` - Profile CRUD operations
- `backend/controllers/patientAppointments.js` - Appointment fetching
- `backend/controllers/appointmentController.js` - Appointment cancellation
- `backend/routes/auth.js` - Route registrations

---

**END OF DOCUMENT**
