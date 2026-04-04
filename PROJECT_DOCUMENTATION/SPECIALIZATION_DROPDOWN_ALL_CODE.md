# All Code Related to Specializations Dropdown

## 1. BACKEND - Fetch Specializations API

### File: `backend/routes/auth.js`
```javascript
router.get("/specialties", async (req, res) => {
  console.log("✅ Specialties endpoint hit!");
  let connection;
  try {
    connection = await connectDB();
    
    const result = await connection.execute(
      `SELECT ID, NAME FROM SPECIALIZATION ORDER BY NAME`
    );
    
    console.log('Query result rows:', result.rows.length);

    const specialties = result.rows.map(row => ({
      id: row[0],
      name: row[1],
    }));

    res.status(200).json({ specialties });

  } catch (err) {
    console.error('Error in specialties endpoint:', err);
    res.status(500).json({ error: 'Failed to fetch specialties: ' + err.message });
  } finally {
    if (connection) await connection.close();
  }
});
```

**Endpoint:** `GET /api/specialties`  
**Response Format:**
```json
{
  "specialties": [
    { "id": 1, "name": "Cardiology" },
    { "id": 2, "name": "Dermatology" }
  ]
}
```

---

## 2. BACKEND - Save/Update Specialization

### File: `backend/controllers/doctorSpecialization.js`
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

    // Remove existing specialization
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
    res.status(200).json({ message: "✅ Specialization saved successfully" });

  } catch (err) {
    console.error("Error saving doctor specialization:", err);
    res.status(500).json({ error: "❌ Server error" });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (_) {}
    }
  }
};
```

**Endpoint:** `POST /api/doctor/specialization`  
**Request Body:**
```json
{
  "email": "doctor@example.com",
  "specializationId": 1
}
```

---

## 3. BACKEND - Update Profile with Specialization

### File: `backend/controllers/doctorProfileUpdate.js`
```javascript
exports.updateDoctorBasicInfo = async (req, res) => {
  const { email, degrees, experienceYears, fees, gender, specializationId } = req.body;
  
  // ... get doctor ID ...

  // Handle specialization update in DOC_SPECIALIZATION table
  if (specializationId !== undefined && specializationId !== null && specializationId !== '') {
    console.log('Updating specialization to:', specializationId);
    
    // Check if specialization entry exists
    const specCheck = await connection.execute(
      `SELECT ID FROM DOC_SPECIALIZATION WHERE DOCTOR_ID = :doctorId`,
      { doctorId }
    );

    if (specCheck.rows.length > 0) {
      // Update existing specialization
      await connection.execute(
        `UPDATE DOC_SPECIALIZATION 
         SET SPECIALIZATION_ID = :specializationId 
         WHERE DOCTOR_ID = :doctorId`,
        { specializationId, doctorId }
      );
    } else {
      // Insert new specialization
      await connection.execute(
        `INSERT INTO DOC_SPECIALIZATION (DOCTOR_ID, SPECIALIZATION_ID) 
         VALUES (:doctorId, :specializationId)`,
        { doctorId, specializationId }
      );
    }
  }

  await connection.commit();
  return res.status(200).json({ message: "✅ Profile updated successfully" });
};
```

**Endpoint:** `PUT /api/doctor/update-basic-info`  
**Request Body:**
```json
{
  "email": "doctor@example.com",
  "degrees": "MBBS, MD",
  "experienceYears": 5,
  "fees": 500,
  "gender": "Male",
  "specializationId": 1
}
```

---

## 4. FRONTEND - Fetch and Display Specializations

### File: `frontend/src/pages/DoctorDashboard.jsx`

#### State Declaration:
```javascript
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

#### Fetch Specializations:
```javascript
const fetchSpecializations = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/specialties');
    if (res.ok) {
      const data = await res.json();
      setSpecializations(data);
    }
  } catch (err) {
    // Error fetching specializations
  }
};

// Call on component mount
useEffect(() => {
  // ...
  fetchSpecializations();
}, [navigate]);
```

#### Dropdown Rendering:
```javascript
<div className="auth-input-group" style={{ marginBottom: '1rem' }}>
  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
    Specialization
  </label>
  <select
    value={editForm.specializationId}
    onChange={(e) => setEditForm({...editForm, specializationId: e.target.value})}
    className="auth-input"
    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
  >
    <option value="">Select specialization</option>
    {Array.isArray(specializations) && specializations.map(spec => (
      <option key={spec.ID} value={spec.ID}>{spec.NAME}</option>
    ))}
  </select>
</div>
```

#### Update Specialization on Save:
```javascript
// Inside handleUpdateProfile function
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
```

---

## 5. DATABASE TABLES

### SPECIALIZATION Table
```sql
CREATE TABLE SPECIALIZATION (
  ID NUMBER PRIMARY KEY,
  NAME VARCHAR2(100) NOT NULL UNIQUE
);
```

### DOC_SPECIALIZATION Table (Junction Table)
```sql
CREATE TABLE DOC_SPECIALIZATION (
  ID NUMBER PRIMARY KEY,
  DOCTOR_ID NUMBER NOT NULL,
  SPECIALIZATION_ID NUMBER NOT NULL,
  CONSTRAINT FK_DOC_SPEC_DOCTOR FOREIGN KEY (DOCTOR_ID) REFERENCES DOCTOR(ID),
  CONSTRAINT FK_DOC_SPEC_SPEC FOREIGN KEY (SPECIALIZATION_ID) REFERENCES SPECIALIZATION(ID)
);
```

---

## 6. ROUTES SUMMARY

| Method | Endpoint | Purpose | File |
|--------|----------|---------|------|
| GET | `/api/specialties` | Fetch all specializations | `backend/routes/auth.js` |
| POST | `/api/doctor/specialization` | Save/update doctor specialization | `backend/routes/doctorRoutes.js` |
| PUT | `/api/doctor/update-basic-info` | Update profile including specialization | `backend/routes/doctorRoutes.js` |

---

## 7. DATA FLOW

1. **Component Mount:**
   - `fetchSpecializations()` calls `GET /api/specialties`
   - Response stored in `specializations` state
   - Dropdown populated with options

2. **User Selects Specialization:**
   - `onChange` updates `editForm.specializationId`

3. **User Saves Profile:**
   - `handleUpdateProfile()` calls `POST /api/doctor/specialization`
   - Backend deletes old specialization from `DOC_SPECIALIZATION`
   - Backend inserts new specialization into `DOC_SPECIALIZATION`
   - Success message shown

---

## 8. COMMON ISSUES & FIXES

### Issue: Specialization not updating
**Cause:** `updateDoctorBasicInfo` wasn't handling specialization  
**Fix:** Added specialization handling in `doctorProfileUpdate.js` (lines 450-475)

### Issue: Dropdown shows empty
**Cause:** API response format mismatch  
**Fix:** Backend returns `{ specialties: [...] }`, frontend expects `data.specialties`

### Issue: Specialization ID not sent
**Cause:** Form field not included in request  
**Fix:** Added `specializationId` to request body in `handleUpdateProfile`

---

## 9. TESTING CHECKLIST

- [ ] Dropdown loads specializations on page load
- [ ] Can select a specialization from dropdown
- [ ] Specialization saves when clicking "Save Changes"
- [ ] Specialization displays correctly in view mode
- [ ] Can change specialization and save again
- [ ] Backend logs show correct specialization ID
- [ ] Database `DOC_SPECIALIZATION` table updates correctly
