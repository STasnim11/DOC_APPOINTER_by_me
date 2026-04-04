# View Profile & Edit Profile - Complete Code Reference

## 🎯 FRONTEND - DoctorDashboard.jsx

### State (Lines 15-29)
```javascript
const [doctorProfile, setDoctorProfile] = useState({});
const [specializations, setSpecializations] = useState([]);

const [editForm, setEditForm] = useState({
  name: '',
  phone: '',
  gender: '',
  degrees: '',
  experienceYears: '',
  fees: '',
  specializationId: ''
});
```

---

### Fetch Doctor Profile (Lines 54-89)
```javascript
const fetchDoctorProfile = async (email) => {
  try {
    console.log('Fetching doctor profile for:', email);
    const res = await fetch(`http://localhost:3000/api/doctor/profile/${email}`);
    if (res.ok) {
      const data = await res.json();
      console.log('Doctor profile data received:', data);
      console.log('License value:', data.license);
      setDoctorProfile(data);
      
      // Populate edit form with current data
      setEditForm({
        name: data.name || '',
        phone: data.phone || '',
        gender: data.gender || '',
        degrees: data.degrees || '',
        experienceYears: data.experienceYears || '',
        fees: data.fees || '',
        specializationId: data.specializationId || ''
      });
      
      // Check if license exists - redirect to verification if not
      if (!data.license || data.license === 'Not provided') {
        console.log('No license found, redirecting to verification');
        navigate('/doctor/license-verification');
      } else {
        console.log('License found:', data.license);
      }
    } else {
      console.error('Failed to fetch profile, status:', res.status);
    }
  } catch (err) {
    console.error('Error fetching doctor profile:', err);
  }
};
```

---

### Fetch Specializations (Lines 91-103)
```javascript
const fetchSpecializations = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/specialties');
    if (res.ok) {
      const data = await res.json();
      setSpecializations(data);
    }
  } catch (err) {
    console.error('Error fetching specializations:', err);
  }
};
```

---

### VIEW PROFILE UI (Lines 408-450)
```javascript
{activeView === 'profile' && (
  <div className="doctor-profile-view">
    <h1>My Profile</h1>
    
    <div className="doctor-profile-display">
      <div className="doctor-profile-avatar-large">
        <span className="doctor-avatar-icon">👨‍⚕️</span>
      </div>
      <div className="doctor-profile-info">
        <div className="doctor-info-row">
          <label>Name:</label>
          <span>{doctorProfile.name || user?.name || 'Not provided'}</span>
        </div>
        <div className="doctor-info-row">
          <label>Email:</label>
          <span>{doctorProfile.email || user?.email || 'Not provided'}</span>
        </div>
        <div className="doctor-info-row">
          <label>Phone:</label>
          <span>{doctorProfile.phone || user?.phone || 'Not provided'}</span>
        </div>
        <div className="doctor-info-row">
          <label>Gender:</label>
          <span>{doctorProfile.gender || 'Not provided'}</span>
        </div>
        <div className="doctor-info-row">
          <label>License Number:</label>
          <span style={{ fontFamily: 'Courier New, monospace', letterSpacing: '1px', fontWeight: '600', color: '#2563eb' }}>
            {doctorProfile.license && doctorProfile.license !== 'Not provided' ? doctorProfile.license : 'Not provided'}
          </span>
        </div>
        <div className="doctor-info-row">
          <label>Specialization:</label>
          <span>{doctorProfile.specialization || 'Not provided'}</span>
        </div>
        <div className="doctor-info-row">
          <label>Degrees:</label>
          <span>{doctorProfile.degrees || 'Not provided'}</span>
        </div>
        <div className="doctor-info-row">
          <label>Experience:</label>
          <span>{doctorProfile.experienceYears ? `${doctorProfile.experienceYears} years` : 'Not provided'}</span>
        </div>
        <div className="doctor-info-row">
          <label>Consultation Fee:</label>
          <span>{doctorProfile.fees ? `৳${doctorProfile.fees}` : 'Not set'}</span>
        </div>
      </div>
    </div>
  </div>
)}
```

---

### EDIT PROFILE UI (Lines 462-650)
```javascript
{activeView === 'editProfile' && (
  <div className="doctor-profile-view">
    <h1>Edit Profile</h1>
    
    <div className="doctor-edit-form">
      <div className="edit-section">
        <h3>Update Profile Information</h3>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          Update your professional details and qualifications
        </p>
        
        {/* Full Name */}
        <div className="auth-input-group" style={{ marginBottom: '1rem' }}>
          <label>Full Name</label>
          <input
            type="text"
            value={editForm.name}
            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
            placeholder="Enter your full name"
          />
        </div>

        {/* Phone Number */}
        <div className="auth-input-group" style={{ marginBottom: '1rem' }}>
          <label>Phone Number</label>
          <input
            type="text"
            value={editForm.phone}
            onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
            placeholder="Enter phone number"
            maxLength="11"
          />
        </div>

        {/* Gender */}
        <div className="auth-input-group" style={{ marginBottom: '1rem' }}>
          <label>Gender</label>
          <select
            value={editForm.gender}
            onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        {/* Specialization */}
        <div className="auth-input-group" style={{ marginBottom: '1rem' }}>
          <label>Specialization</label>
          <select
            value={editForm.specializationId}
            onChange={(e) => setEditForm({...editForm, specializationId: e.target.value})}
          >
            <option value="">Select specialization</option>
            {Array.isArray(specializations) && specializations.map(spec => (
              <option key={spec.ID} value={spec.ID}>{spec.NAME}</option>
            ))}
          </select>
        </div>

        {/* Degrees */}
        <div className="auth-input-group" style={{ marginBottom: '1rem' }}>
          <label>Degrees</label>
          <input
            type="text"
            value={editForm.degrees}
            onChange={(e) => setEditForm({...editForm, degrees: e.target.value})}
            placeholder="e.g., MBBS, MD, PhD"
          />
        </div>

        {/* Experience Years */}
        <div className="auth-input-group" style={{ marginBottom: '1rem' }}>
          <label>Experience (Years)</label>
          <input
            type="number"
            min="0"
            value={editForm.experienceYears}
            onChange={(e) => setEditForm({...editForm, experienceYears: e.target.value})}
            placeholder="e.g., 5"
          />
        </div>

        {/* Consultation Fee */}
        <div className="auth-input-group" style={{ marginBottom: '1rem' }}>
          <label>Consultation Fee (৳)</label>
          <input
            type="number"
            min="0"
            value={editForm.fees}
            onChange={(e) => setEditForm({...editForm, fees: e.target.value})}
            placeholder="e.g., 500"
          />
        </div>

        {/* Update Button */}
        <button 
          className="btn-update-license"
          onClick={async () => {
            setLoading(true);
            setMessage('');
            
            // Validate
            if (!editForm.name || !editForm.phone) {
              setMessage('❌ Name and phone are required');
              setLoading(false);
              return;
            }
            
            if (editForm.phone && !/^\d{11}$/.test(editForm.phone)) {
              setMessage('❌ Phone must be 11 digits');
              setLoading(false);
              return;
            }

            try {
              // Step 1: Update user info (name, phone)
              const userRes = await fetch('http://localhost:3000/api/profile/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: user.email,
                  name: editForm.name,
                  phone: editForm.phone
                })
              });

              if (!userRes.ok) {
                const error = await userRes.json();
                setMessage('❌ ' + (error.error || 'Failed to update profile'));
                setLoading(false);
                return;
              }

              // Step 2: Update doctor-specific info
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

              if (!doctorRes.ok) {
                const error = await doctorRes.json();
                setMessage('❌ ' + (error.error || 'Failed to update doctor profile'));
                setLoading(false);
                return;
              }

              // Step 3: Update specialization if provided
              if (editForm.specializationId) {
                const specRes = await fetch('http://localhost:3000/api/doctor/specialization', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: user.email,
                    specializationId: parseInt(editForm.specializationId)
                  })
                });

                if (!specRes.ok) {
                  const error = await specRes.json();
                  setMessage('❌ ' + (error.error || 'Failed to update specialization'));
                  setLoading(false);
                  return;
                }
              }

              setMessage('✅ Profile updated successfully');
              
              // Update localStorage
              const updatedUser = {...user, name: editForm.name, phone: editForm.phone};
              localStorage.setItem('user', JSON.stringify(updatedUser));
              setUser(updatedUser);
              
              // Refresh profile
              await fetchDoctorProfile(user.email);
              
              setTimeout(() => {
                setMessage('');
                setActiveView('profile');
              }, 2000);
            } catch (err) {
              console.error('Error updating profile:', err);
              setMessage('❌ Server error');
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
        
        <button 
          className="btn-update-license"
          style={{ background: '#6b7280' }}
          onClick={() => {
            setActiveView('profile');
            setMessage('');
          }}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
```

---

## 🔧 BACKEND CODE

### 1. GET Doctor Profile
**File:** `backend/controllers/doctorProfileUpdate.js`
**Function:** `getDoctorProfile`
**Endpoint:** `GET /api/doctor/profile/:email`
**Lines:** 1-145

```javascript
exports.getDoctorProfile = async (req, res) => {
  const { email } = req.params;
  let connection;

  try {
    connection = await connectDB();

    // Get user info from USERS table
    const userResult = await connection.execute(
      `SELECT u.ID, u.NAME, u.EMAIL, u.PHONE
       FROM USERS u
       WHERE TRIM(LOWER(u.EMAIL)) = TRIM(LOWER(:email))
         AND TRIM(UPPER(u.ROLE)) = 'DOCTOR'`,
      { email }
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Doctor not found" });
    }

    const [userId, name, userEmail, phone] = userResult.rows[0];

    // Get doctor details from DOCTOR table
    const doctorResult = await connection.execute(
      `SELECT d.ID, d.LICENSE_NUMBER, d.DEGREES, d.EXPERIENCE_YEARS, d.FEES, d.GENDER
       FROM DOCTOR d
       WHERE d.USER_ID = :userId`,
      { userId }
    );
    
    let license = "Not provided";
    let degrees = "Not provided";
    let experienceYears = 0;
    let fees = null;
    let gender = null;
    let specialization = null;
    let specializationId = null;
    let doctorId = null;

    if (doctorResult.rows.length > 0) {
      doctorId = doctorResult.rows[0][0];
      license = doctorResult.rows[0][1] || "Not provided";
      degrees = doctorResult.rows[0][2] || "Not provided";
      experienceYears = doctorResult.rows[0][3] || 0;
      fees = doctorResult.rows[0][4];
      gender = doctorResult.rows[0][5];
      
      // Get specialization from DOC_SPECIALIZATION table
      const specResult = await connection.execute(
        `SELECT s.ID, s.NAME
         FROM DOC_SPECIALIZATION ds
         JOIN SPECIALIZATION s ON ds.SPECIALIZATION_ID = s.ID
         WHERE ds.DOCTOR_ID = :doctorId`,
        { doctorId }
      );
      
      if (specResult.rows.length > 0) {
        specializationId = specResult.rows[0][0];  // For Edit Profile dropdown
        specialization = specResult.rows[0][1];     // For View Profile display
      }
    }

    // Get appointments
    const appointmentsResult = await connection.execute(
      `SELECT da.ID, da.APPOINTMENT_DATE, da.STATUS, da.TYPE,
              ts.START_TIME, ts.END_TIME, pu.NAME as PATIENT_NAME, pu.PHONE as PATIENT_PHONE, pu.EMAIL as PATIENT_EMAIL
       FROM DOCTORS_APPOINTMENTS da
       JOIN TIME_SLOTS ts ON da.TIME_SLOT_ID = ts.ID
       JOIN PATIENT p ON da.PATIENT_ID = p.ID
       JOIN USERS pu ON p.USER_ID = pu.ID
       WHERE da.DOCTOR_ID = :doctorId
       ORDER BY da.APPOINTMENT_DATE DESC`,
      { doctorId }
    );

    const appointments = appointmentsResult.rows.map(row => ({
      id: row[0],
      date: row[1],
      status: row[2],
      type: row[3],
      startTime: row[4],
      endTime: row[5],
      patientName: row[6],
      patientPhone: row[7],
      patientEmail: row[8],
    }));

    return res.status(200).json({
      name,
      email: userEmail,
      phone,
      license,
      degrees,
      experienceYears,
      fees,
      gender,
      specialization,      // NAME for View Profile
      specializationId,    // ID for Edit Profile dropdown
      appointments,
    });

  } catch (error) {
    console.error("Get doctor profile error:", error);
    return res.status(500).json({ 
      error: "❌ Failed to fetch doctor profile",
      details: error.message 
    });
  } finally {
    if (connection) await connection.close();
  }
};
```

---

### 2. Update User Info (Name, Phone)
**File:** `backend/controllers/profile.js`
**Function:** `updateProfile`
**Endpoint:** `PUT /api/profile/update`
**Lines:** 40-95

```javascript
exports.updateProfile = async (req, res) => {
  const { email, name, phone } = req.body;
  let connection;

  if (!email) {
    return res.status(400).json({ error: "❌ Email is required" });
  }

  try {
    connection = await connectDB();

    // Build dynamic update
    const updates = [];
    const params = { email };

    if (name) {
      updates.push('NAME = :name');
      params.name = name;
    }
    if (phone) {
      updates.push('PHONE = :phone');
      params.phone = phone;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "❌ No fields to update" });
    }

    await connection.execute(
      `UPDATE USERS SET ${updates.join(', ')} WHERE TRIM(LOWER(EMAIL)) = TRIM(LOWER(:email))`,
      params
    );

    await connection.commit();

    return res.status(200).json({
      message: "✅ Profile updated successfully",
    });
  } catch (error) {
    console.error("Update profile error:", error);

    if (connection) {
      try {
        await connection.rollback();
      } catch (_) {}
    }

    return res.status(500).json({
      error: "❌ Failed to update profile",
    });
  } finally {
    if (connection) await connection.close();
  }
};
```

---

### 3. Update Doctor Info (Degrees, Experience, Fees, Gender)
**File:** `backend/controllers/doctorProfileUpdate.js`
**Function:** `updateDoctorBasicInfo`
**Endpoint:** `PUT /api/doctor/profile/update`
**Lines:** 350-430

```javascript
exports.updateDoctorBasicInfo = async (req, res) => {
  const { email, degrees, experienceYears, fees, gender } = req.body;
  let connection;

  if (!email) {
    return res.status(400).json({
      error: "❌ Email is required",
    });
  }

  try {
    connection = await connectDB();

    // Get doctor ID
    const result = await connection.execute(
      `SELECT d.ID
       FROM DOCTOR d
       JOIN USERS u ON d.USER_ID = u.ID
       WHERE TRIM(LOWER(u.EMAIL)) = TRIM(LOWER(:email))
         AND TRIM(UPPER(u.ROLE)) = 'DOCTOR'`,
      { email }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "❌ Doctor profile not found",
      });
    }

    const doctorId = result.rows[0][0];

    // Build dynamic update query
    const updates = [];
    const params = { doctorId };

    if (degrees !== undefined && degrees !== null && degrees !== '') {
      updates.push('DEGREES = :degrees');
      params.degrees = degrees;
    }
    if (experienceYears !== undefined && experienceYears !== null && experienceYears !== '') {
      updates.push('EXPERIENCE_YEARS = :experienceYears');
      params.experienceYears = experienceYears;
    }
    if (fees !== undefined && fees !== null && fees !== '') {
      updates.push('FEES = :fees');
      params.fees = fees;
    }
    if (gender !== undefined && gender !== null && gender !== '') {
      updates.push('GENDER = :gender');
      params.gender = gender;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: "❌ No fields to update",
      });
    }

    await connection.execute(
      `UPDATE DOCTOR SET ${updates.join(', ')} WHERE ID = :doctorId`,
      params
    );

    await connection.commit();

    return res.status(200).json({
      message: "✅ Profile updated successfully",
    });
  } catch (error) {
    console.error("Update doctor basic info error:", error);

    if (connection) {
      try {
        await connection.rollback();
      } catch (_) {}
    }

    return res.status(500).json({
      error: "❌ Failed to update profile: " + error.message,
    });
  } finally {
    if (connection) await connection.close();
  }
};
```

---

### 4. Update Specialization
**File:** `backend/controllers/doctorSpecialization.js`
**Function:** `saveDoctorSpecialization`
**Endpoint:** `POST /api/doctor/specialization`
**Lines:** 134-180

```javascript
exports.saveDoctorSpecialization = async (req, res) => {
  const { email, specializationId } = req.body;
  
  if (!email || !specializationId) {
    return res.status(400).json({ error: "❌ Email and specializationId are required" });
  }

  let connection;
  try {
    connection = await connectDB();

    // Get doctor ID by email
    const doctorResult = await connection.execute(
      `SELECT d.ID AS doctor_id 
       FROM DOCTOR d
       JOIN USERS u ON d.USER_ID = u.ID
       WHERE TRIM(LOWER(u.EMAIL)) = TRIM(LOWER(:email))`,
      { email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Doctor not found" });
    }

    const doctorId = doctorResult.rows[0].DOCTOR_ID;

    // Delete existing specialization
    await connection.execute(
      `DELETE FROM DOC_SPECIALIZATION WHERE DOCTOR_ID = :doctorId`,
      { doctorId }
    );

    // Insert new specialization (ID auto-generated by trigger)
    await connection.execute(
      `INSERT INTO DOC_SPECIALIZATION (DOCTOR_ID, SPECIALIZATION_ID)
       VALUES (:doctorId, :specializationId)`,
      { doctorId, specializationId }
    );

    await connection.commit();
    console.log(`✅ Specialization ${specializationId} saved for doctor ${doctorId}`);
    res.status(200).json({ message: "✅ Specialization saved successfully" });

  } catch (err) {
    console.error("Error saving doctor specialization:", err);
    res.status(500).json({ error: "❌ Server error" });
  } finally {
    if (connection) await connection.close();
  }
};
```

---

### 5. Get All Specializations
**File:** `backend/routes/auth.js`
**Endpoint:** `GET /api/specialties`
**Lines:** 19-47

```javascript
router.get("/specialties", async (req, res) => {
  console.log("✅ Specialties endpoint hit!");
  let connection;
  try {
    const connectDB = require("../db/connection");
    connection = await connectDB();

    const result = await connection.execute(
      `SELECT ID, NAME, DESCRIPTION
       FROM SPECIALIZATION
       ORDER BY NAME`
    );

    const specialties = result.rows.map(row => ({
      ID: row[0],
      NAME: row[1],
      DESCRIPTION: row[2]
    }));

    res.status(200).json(specialties);
  } catch (err) {
    console.error('Error in specialties endpoint:', err);
    res.status(500).json({ error: 'Failed to fetch specialties: ' + err.message });
  } finally {
    if (connection) await connection.close();
  }
});
```

---

## 📋 ROUTES REGISTERED

**File:** `backend/routes/auth.js`

```javascript
router.get("/doctor/profile/:email", doctorProfileController.getDoctorProfile);
router.put("/profile/update", updateProfile);
router.put("/doctor/profile/update", doctorProfileController.updateDoctorBasicInfo);
router.post("/doctor/specialization", saveDoctorSpecialization);
router.get("/specialties", /* inline handler */);
```

---

## 🗄️ DATABASE TABLES USED

**USERS:**
- ID, NAME, EMAIL, PHONE, ROLE

**DOCTOR:**
- ID, USER_ID, LICENSE_NUMBER, DEGREES, EXPERIENCE_YEARS, FEES, GENDER

**DOC_SPECIALIZATION:**
- ID, DOCTOR_ID, SPECIALIZATION_ID

**SPECIALIZATION:**
- ID, ADMIN_ID, NAME, DESCRIPTION

---

## 🔄 COMPLETE FLOW

**View Profile:**
1. Frontend calls `GET /api/doctor/profile/:email`
2. Backend queries USERS + DOCTOR + DOC_SPECIALIZATION + SPECIALIZATION
3. Returns all profile data including `specialization` (name) and `specializationId` (ID)
4. Frontend displays in View Profile UI

**Edit Profile:**
1. Frontend populates form with data from `fetchDoctorProfile`
2. User edits fields
3. On save, makes 3 API calls:
   - `PUT /api/profile/update` → Updates USERS table (name, phone)
   - `PUT /api/doctor/profile/update` → Updates DOCTOR table (degrees, experience, fees, gender)
   - `POST /api/doctor/specialization` → Updates DOC_SPECIALIZATION table (DELETE old + INSERT new)
4. Refreshes profile and shows success message
