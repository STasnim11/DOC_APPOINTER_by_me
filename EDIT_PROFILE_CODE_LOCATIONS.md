# Edit Profile - Exact Code Locations

## 🎯 FRONTEND - Edit Profile Form

**File:** `frontend/src/pages/DoctorDashboard.jsx`

### State Management
**Line ~17-23:**
```javascript
const [editForm, setEditForm] = useState({
  name: '',
  phone: '',
  gender: '',
  degrees: '',
  experienceYears: '',
  fees: ''
});
```
**MISSING:** `specialization` or `specializationId`

---

### Populate Form with Current Data
**Line ~50-58:**
```javascript
setEditForm({
  name: data.name || '',
  phone: data.phone || '',
  gender: data.gender || '',
  degrees: data.degrees || '',
  experienceYears: data.experienceYears || '',
  fees: data.fees || ''
});
```
**MISSING:** `specialization: data.specialization` or `specializationId`

---

### Edit Profile View (Form Fields)
**Line ~450-530:**
```javascript
{activeView === 'editProfile' && (
  <div className="doctor-profile-view">
    <h1>Edit Profile</h1>
    
    <div className="doctor-edit-form">
      <div className="edit-section">
        {/* Full Name input */}
        {/* Phone Number input */}
        {/* Gender dropdown */}
        {/* Degrees input */}
        {/* Experience Years input */}
        {/* Consultation Fee input */}
        
        {/* MISSING: Specialization dropdown */}
      </div>
    </div>
  </div>
)}
```

---

### Update Button Handler
**Line ~540-610:**
```javascript
onClick={async () => {
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
  
  // MISSING: Step 3: Update specialization
  // Should call: POST /api/doctor/specialization
}
```

---

## 🔧 BACKEND - Update Profile Endpoints

### 1. Update User Info (Name, Phone)
**File:** `backend/controllers/profile.js`
**Function:** `updateProfile`
**Endpoint:** `PUT /api/profile/update`
**Line ~35-80:**
```javascript
exports.updateProfile = async (req, res) => {
  const { email, name, phone } = req.body;
  
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

  await connection.execute(
    `UPDATE USERS SET ${updates.join(', ')} WHERE TRIM(LOWER(EMAIL)) = TRIM(LOWER(:email))`,
    params
  );
  
  await connection.commit();
};
```

---

### 2. Update Doctor Info (Degrees, Experience, Fees, Gender)
**File:** `backend/controllers/doctorProfileUpdate.js`
**Function:** `updateDoctorBasicInfo`
**Endpoint:** `PUT /api/doctor/profile/update`
**Line ~350-430:**
```javascript
exports.updateDoctorBasicInfo = async (req, res) => {
  const { email, degrees, experienceYears, fees, gender } = req.body;
  
  // Get doctor ID
  const result = await connection.execute(
    `SELECT d.ID FROM DOCTOR d
     JOIN USERS u ON d.USER_ID = u.ID
     WHERE TRIM(LOWER(u.EMAIL)) = TRIM(LOWER(:email))
       AND TRIM(UPPER(u.ROLE)) = 'DOCTOR'`,
    { email }
  );
  
  const doctorId = result.rows[0][0];
  
  // Build dynamic update
  const updates = [];
  const params = { doctorId };
  
  if (degrees) {
    updates.push('DEGREES = :degrees');
    params.degrees = degrees;
  }
  if (experienceYears) {
    updates.push('EXPERIENCE_YEARS = :experienceYears');
    params.experienceYears = experienceYears;
  }
  if (fees) {
    updates.push('FEES = :fees');
    params.fees = fees;
  }
  if (gender) {
    updates.push('GENDER = :gender');
    params.gender = gender;
  }
  
  await connection.execute(
    `UPDATE DOCTOR SET ${updates.join(', ')} WHERE ID = :doctorId`,
    params
  );
  
  await connection.commit();
};
```
**MISSING:** Does NOT update specialization

---

### 3. Update Specialization (SEPARATE ENDPOINT - EXISTS!)
**File:** `backend/controllers/doctorSpecialization.js`
**Function:** `saveDoctorSpecialization`
**Endpoint:** `POST /api/doctor/specialization`
**Line ~134-180:**
```javascript
exports.saveDoctorSpecialization = async (req, res) => {
  const { email, specializationId } = req.body;
  
  // Get doctor ID from email
  const doctorResult = await connection.execute(
    `SELECT d.ID as DOCTOR_ID
     FROM DOCTOR d
     JOIN USERS u ON d.USER_ID = u.ID
     WHERE TRIM(LOWER(u.EMAIL)) = TRIM(LOWER(:email))`,
    { email }
  );
  
  const doctorId = doctorResult.rows[0].DOCTOR_ID;
  
  // Delete existing specialization
  await connection.execute(
    `DELETE FROM DOC_SPECIALIZATION WHERE DOCTOR_ID = :doctorId`,
    { doctorId }
  );
  
  // Insert new specialization
  await connection.execute(
    `INSERT INTO DOC_SPECIALIZATION (DOCTOR_ID, SPECIALIZATION_ID)
     VALUES (:doctorId, :specializationId)`,
    { doctorId, specializationId }
  );
  
  await connection.commit();
};
```

---

## 📋 WHAT'S MISSING IN EDIT PROFILE

### Frontend (`DoctorDashboard.jsx`):
1. **State:** Add `specializationId: ''` to editForm
2. **Fetch specializations:** Need to fetch all specializations on component mount
3. **Dropdown:** Add specialization dropdown in Edit Profile form
4. **API Call:** Add call to `POST /api/doctor/specialization` in update handler

### Backend:
**Nothing missing!** The endpoint already exists at `POST /api/doctor/specialization`

---

## 🎯 TO ADD SPECIALIZATION TO EDIT PROFILE

You need to modify these exact locations in `frontend/src/pages/DoctorDashboard.jsx`:

1. **Line ~17:** Add `specializationId: ''` to editForm state
2. **Line ~10:** Add `const [specializations, setSpecializations] = useState([]);`
3. **Line ~40:** Add `fetchSpecializations()` in useEffect
4. **Line ~50:** Add `specializationId: data.specializationId` when populating form
5. **Line ~490:** Add specialization dropdown between Gender and Degrees
6. **Line ~580:** Add API call to update specialization after updating doctor info

Do you want me to add these changes now?
