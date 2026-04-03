# DOCTOR PRESCRIPTION - COMPLETE CODE REFERENCE

## 🔄 COMPLETE FLOW

1. **Doctor Dashboard** → Views appointments list
2. **Sees "Write Prescription" button** → Only for BOOKED appointments without prescription
3. **Clicks button** → Navigates to `/doctor/prescription/:appointmentId`
4. **WritePrescription page** → Fills form with patient details, medicines, diagnosis
5. **Saves prescription** → `POST /api/prescriptions`
6. **Returns to dashboard** → Appointment now shows "✅ Prescription Added" badge

---

## 📍 FRONTEND: DoctorDashboard.jsx
**Location**: `frontend/src/pages/DoctorDashboard.jsx`

---

### 🔹 FETCH APPOINTMENTS (with Prescription Status)

```javascript
const fetchAppointments = async (email) => {
  setLoading(true);
  try {
    const res = await fetch(`http://localhost:3000/api/doctor/appointments/${email}`);
    if (res.ok) {
      const data = await res.json();
      setAppointments(data.appointments || []);
    }
  } catch (err) {
    console.error('Error fetching appointments:', err);
  } finally {
    setLoading(false);
  }
};
```

**API**: `GET /api/doctor/appointments/:email`

**Returns**:
```javascript
{
  appointments: [
    {
      appointmentId: 1,
      appointmentDate: "2024-01-15",
      status: "BOOKED",
      type: "CONSULTATION",
      startTime: "09:00",
      endTime: "09:30",
      patientName: "John Doe",
      patientEmail: "patient@example.com",
      patientPhone: "12345678901",
      hasPrescription: false,  // ← Key flag
      prescriptionId: null
    }
  ]
}
```

---

### 🔹 APPOINTMENTS LIST UI (Lines 303-333)

```javascript
{filteredAppointments.map((apt) => (
  <div key={apt.appointmentId} className="doctor-appointment-card">
    <div className="doctor-apt-header">
      <div>
        <h3>{apt.patientName}</h3>
        <p className="apt-email">{apt.patientEmail}</p>
      </div>
      <span className={`doctor-apt-status ${apt.status?.toLowerCase()}`}>
        {apt.status}
      </span>
    </div>
    <div className="doctor-apt-details">
      <p><strong>Date:</strong> {new Date(apt.appointmentDate).toLocaleDateString()}</p>
      <p><strong>Time:</strong> {apt.startTime} - {apt.endTime}</p>
      <p><strong>Type:</strong> {apt.type || 'General'}</p>
      <p><strong>Phone:</strong> {apt.patientPhone || 'N/A'}</p>
    </div>
    <div className="apt-actions">
      {apt.status === 'BOOKED' && !apt.hasPrescription && (
        <button 
          className="btn-write-prescription"
          onClick={() => navigate(`/doctor/prescription/${apt.appointmentId}`)}
        >
          ✍️ Write Prescription
        </button>
      )}
      {apt.hasPrescription && (
        <div className="prescription-badge">
          ✅ Prescription Added
        </div>
      )}
    </div>
  </div>
))}
```

**Logic**:
- Shows "Write Prescription" button if: `status === 'BOOKED'` AND `!hasPrescription`
- Shows "✅ Prescription Added" badge if: `hasPrescription === true`
- Button navigates to: `/doctor/prescription/${appointmentId}`

---


## 📍 FRONTEND: WritePrescription.jsx
**Location**: `frontend/src/pages/WritePrescription.jsx`

---

### 🔹 STATE MANAGEMENT

```javascript
const { appointmentId } = useParams(); // From URL
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState("");
const [medicines, setMedicines] = useState([]); // Available medicines from DB

const [formData, setFormData] = useState({
  chiefComplaints: "",
  investigations: "",
  requiredTests: "",
  diagnosis: "",
  history: "",
  instructions: "",
  visitAgainAt: "",
  prescribedMedicines: [{ medicineName: "", dosage: "", duration: "" }]
});
```

---

### 🔹 FETCH AVAILABLE MEDICINES

```javascript
const fetchMedicines = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/prescriptions/medicines');
    if (res.ok) {
      const data = await res.json();
      setMedicines(data.medicines || []);
    }
  } catch (err) {
    console.error('Error fetching medicines:', err);
  }
};

useEffect(() => {
  fetchMedicines();
}, []);
```

**API**: `GET /api/prescriptions/medicines`

**Returns**:
```javascript
{
  success: true,
  medicines: [
    {
      id: 1,
      medicineName: "Paracetamol",
      description: "Pain reliever",
      manufacturer: "ABC Pharma",
      price: 50,
      stockQuantity: 100,
      category: "Analgesic"
    }
  ]
}
```

---

### 🔹 ADD/REMOVE MEDICINE ROWS

```javascript
const handleAddMedicine = () => {
  setFormData({
    ...formData,
    prescribedMedicines: [...formData.prescribedMedicines, { medicineName: "", dosage: "", duration: "" }]
  });
};

const handleRemoveMedicine = (index) => {
  const newMedicines = formData.prescribedMedicines.filter((_, i) => i !== index);
  setFormData({ ...formData, prescribedMedicines: newMedicines });
};

const handleMedicineChange = (index, field, value) => {
  const newMedicines = [...formData.prescribedMedicines];
  newMedicines[index][field] = value;
  setFormData({ ...formData, prescribedMedicines: newMedicines });
};
```

---

### 🔹 SAVE PRESCRIPTION

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setMessage("");

  try {
    const res = await fetch('http://localhost:3000/api/prescriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        appointmentId: parseInt(appointmentId),
        ...formData,
        medicines: formData.prescribedMedicines.filter(m => m.medicineName)
      })
    });

    const result = await res.json();

    if (res.ok) {
      setMessage("✅ Prescription created successfully!");
      setTimeout(() => {
        navigate('/doctor/dashboard');
      }, 2000);
    } else {
      setMessage("❌ " + (result.message || "Failed to create prescription"));
    }
  } catch (err) {
    console.error('Error creating prescription:', err);
    setMessage("❌ Server error");
  } finally {
    setLoading(false);
  }
};
```

**API**: `POST /api/prescriptions`

**Sends**:
```javascript
{
  appointmentId: 123,
  chiefComplaints: "Fever and headache",
  investigations: "Temperature 101°F",
  requiredTests: "Blood test",
  diagnosis: "Viral fever",
  history: "No previous illness",
  instructions: "Rest and drink fluids",
  visitAgainAt: "2024-01-20",
  medicines: [
    {
      medicineName: "Paracetamol",
      dosage: "1 tablet",
      duration: "3 days"
    }
  ]
}
```

---

### 🔹 PRESCRIPTION FORM UI

```javascript
<form onSubmit={handleSubmit} className="prescription-form">
  {/* Patient Information */}
  <div className="form-section">
    <h3>Patient Information</h3>
    <div className="form-group">
      <label>Chief Complaints</label>
      <textarea
        value={formData.chiefComplaints}
        onChange={(e) => setFormData({ ...formData, chiefComplaints: e.target.value })}
        rows="3"
        placeholder="Patient's main complaints..."
      />
    </div>
    <div className="form-group">
      <label>History</label>
      <textarea
        value={formData.history}
        onChange={(e) => setFormData({ ...formData, history: e.target.value })}
        rows="3"
        placeholder="Medical history..."
      />
    </div>
  </div>

  {/* Examination & Diagnosis */}
  <div className="form-section">
    <h3>Examination & Diagnosis</h3>
    <div className="form-group">
      <label>Investigations</label>
      <textarea
        value={formData.investigations}
        onChange={(e) => setFormData({ ...formData, investigations: e.target.value })}
        rows="2"
        placeholder="Physical examination findings..."
      />
    </div>
    <div className="form-group">
      <label>Required Tests</label>
      <textarea
        value={formData.requiredTests}
        onChange={(e) => setFormData({ ...formData, requiredTests: e.target.value })}
        rows="2"
        placeholder="Lab tests, imaging, etc..."
      />
    </div>
    <div className="form-group">
      <label>Diagnosis</label>
      <textarea
        value={formData.diagnosis}
        onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
        rows="2"
        placeholder="Final diagnosis..."
        required
      />
    </div>
  </div>

  {/* Prescribed Medicines */}
  <div className="form-section">
    <div className="section-header">
      <h3>Prescribed Medicines</h3>
      <button type="button" className="btn-add-medicine" onClick={handleAddMedicine}>
        + Add Medicine
      </button>
    </div>

    {formData.prescribedMedicines.map((med, index) => (
      <div key={index} className="medicine-row">
        <div className="medicine-fields">
          <div className="form-group">
            <label>Medicine Name</label>
            <input
              type="text"
              value={med.medicineName}
              onChange={(e) => handleMedicineChange(index, 'medicineName', e.target.value)}
              placeholder="Enter medicine name"
              list={`medicines-list-${index}`}
            />
            <datalist id={`medicines-list-${index}`}>
              {medicines.map((m) => (
                <option key={m.id} value={m.medicineName} />
              ))}
            </datalist>
          </div>
          <div className="form-group">
            <label>Dosage</label>
            <input
              type="text"
              value={med.dosage}
              onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
              placeholder="e.g., 1 tablet"
            />
          </div>
          <div className="form-group">
            <label>Duration</label>
            <input
              type="text"
              value={med.duration}
              onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
              placeholder="e.g., 7 days"
            />
          </div>
        </div>
        {formData.prescribedMedicines.length > 1 && (
          <button
            type="button"
            className="btn-remove-medicine"
            onClick={() => handleRemoveMedicine(index)}
          >
            ✕
          </button>
        )}
      </div>
    ))}
  </div>

  {/* Additional Instructions */}
  <div className="form-section">
    <h3>Additional Instructions</h3>
    <div className="form-group">
      <label>Instructions</label>
      <textarea
        value={formData.instructions}
        onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
        rows="3"
        placeholder="Diet, lifestyle advice, precautions..."
      />
    </div>
    <div className="form-group">
      <label>Next Visit Date (Optional)</label>
      <input
        type="date"
        value={formData.visitAgainAt}
        onChange={(e) => setFormData({ ...formData, visitAgainAt: e.target.value })}
      />
    </div>
  </div>

  {/* Form Actions */}
  <div className="form-actions">
    <button type="button" className="btn-cancel" onClick={() => navigate('/doctor/dashboard')}>
      Cancel
    </button>
    <button type="submit" className="btn-submit" disabled={loading}>
      {loading ? 'Creating Prescription...' : 'Create Prescription'}
    </button>
  </div>
</form>
```

**Form Fields**:
- Chief Complaints (textarea)
- History (textarea)
- Investigations (textarea)
- Required Tests (textarea)
- Diagnosis (textarea, required)
- Medicines (dynamic array with name, dosage, duration)
- Instructions (textarea)
- Next Visit Date (date picker, optional)

**Medicine Input**: Uses `<datalist>` for autocomplete from available medicines

---


## 📍 BACKEND: Doctor Appointments Controller
**Location**: `backend/controllers/doctorAppointments.js`

---

### 🔹 GET DOCTOR APPOINTMENTS (with Prescription Status)

```javascript
exports.getDoctorAppointments = async (req, res) => {
  const { email } = req.params;
  let connection;

  if (!email) {
    return res.status(400).json({ error: "❌ Doctor email is required" });
  }

  try {
    connection = await connectDB();

    // Get doctor ID from email
    const doctorResult = await connection.execute(
      `SELECT d.ID
       FROM DOCTOR d
       JOIN USERS u ON d.USER_ID = u.ID
       WHERE TRIM(LOWER(u.EMAIL)) = TRIM(LOWER(:email))
         AND TRIM(UPPER(u.ROLE)) = 'DOCTOR'`,
      { email }
    );

    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Doctor not found" });
    }

    const doctorId = doctorResult.rows[0][0];

    // Get all appointments with patient details and prescription status
    const appointmentsResult = await connection.execute(
      `SELECT
          da.ID as APPOINTMENT_ID,
          da.APPOINTMENT_DATE,
          da.STATUS,
          da.TYPE,
          ts.START_TIME,
          ts.END_TIME,
          pu.NAME as PATIENT_NAME,
          pu.EMAIL as PATIENT_EMAIL,
          pu.PHONE as PATIENT_PHONE,
          p.ID as PRESCRIPTION_ID
       FROM DOCTORS_APPOINTMENTS da
       JOIN TIME_SLOTS ts ON da.TIME_SLOT_ID = ts.ID
       JOIN PATIENT pat ON da.PATIENT_ID = pat.ID
       JOIN USERS pu ON pat.USER_ID = pu.ID
       LEFT JOIN PRESCRIPTION p ON da.ID = p.APPOINTMENT_ID
       WHERE da.DOCTOR_ID = :doctorId
       ORDER BY da.APPOINTMENT_DATE DESC, ts.START_TIME DESC`,
      { doctorId }
    );

    const appointments = appointmentsResult.rows.map(row => ({
      appointmentId: row[0],
      appointmentDate: row[1],
      status: row[2],
      type: row[3],
      startTime: row[4],
      endTime: row[5],
      patientName: row[6],
      patientEmail: row[7],
      patientPhone: row[8],
      hasPrescription: row[9] ? true : false,  // ← If PRESCRIPTION_ID exists
      prescriptionId: row[9]
    }));

    return res.status(200).json({ appointments });
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    return res.status(500).json({ error: "❌ Failed to fetch appointments" });
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
```

**Route**: `GET /api/doctor/appointments/:email`

**Key Query**: `LEFT JOIN PRESCRIPTION p ON da.ID = p.APPOINTMENT_ID`
- If prescription exists for appointment, `p.ID` will have value → `hasPrescription = true`
- If no prescription, `p.ID` is NULL → `hasPrescription = false`

---

## 📍 BACKEND: Prescription Controller
**Location**: `backend/controllers/prescriptionController.js`

---

### 🔹 GET ALL MEDICINES

```javascript
exports.getAllMedicines = async (req, res) => {
  let connection;
  
  try {
    connection = await connectDB();

    const result = await connection.execute(
      `SELECT 
        id,
        name,
        description,
        manufacturer,
        price,
        stock_quantity,
        category
      FROM medicines
      ORDER BY name`
    );

    const medicines = result.rows.map(row => ({
      id: row[0],
      medicineName: row[1],
      description: row[2],
      manufacturer: row[3],
      price: row[4],
      stockQuantity: row[5],
      category: row[6]
    }));

    res.json({
      success: true,
      medicines
    });

  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medicines',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};
```

**Route**: `GET /api/prescriptions/medicines`

**Query**: Fetches all medicines from `medicines` table

---

### 🔹 CREATE PRESCRIPTION

```javascript
exports.createPrescription = async (req, res) => {
  let connection;
  
  try {
    const {
      appointmentId,
      chiefComplaints,
      investigations,
      requiredTests,
      diagnosis,
      history,
      instructions,
      visitAgainAt,
      medicines = []
    } = req.body;

    // Validate required fields
    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID is required'
      });
    }

    connection = await connectDB();

    // Check if appointment exists
    const appointmentCheck = await connection.execute(
      `SELECT ID FROM DOCTORS_APPOINTMENTS WHERE ID = :appointmentId`,
      { appointmentId }
    );

    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if prescription already exists for this appointment
    const existingPrescription = await connection.execute(
      `SELECT ID FROM PRESCRIPTION WHERE APPOINTMENT_ID = :appointmentId`,
      { appointmentId }
    );

    if (existingPrescription.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Prescription already exists for this appointment'
      });
    }

    // Insert prescription
    const prescriptionResult = await connection.execute(
      `INSERT INTO PRESCRIPTION (
        APPOINTMENT_ID,
        DATE_ISSUED,
        CHIEF_COMPLAINTS,
        INVESTIGATIONS,
        REQUIRED_TESTS,
        DIAGNOSIS,
        HISTORY,
        INSTRUCTIONS,
        VISIT_AGAIN_AT
      ) VALUES (
        :appointmentId,
        SYSDATE,
        :chiefComplaints,
        :investigations,
        :requiredTests,
        :diagnosis,
        :history,
        :instructions,
        :visitAgainAt
      ) RETURNING ID INTO :prescriptionId`,
      {
        appointmentId,
        chiefComplaints: chiefComplaints || null,
        investigations: investigations || null,
        requiredTests: requiredTests || null,
        diagnosis: diagnosis || null,
        history: history || null,
        instructions: instructions || null,
        visitAgainAt: visitAgainAt || null,
        prescriptionId: { dir: connectDB.oracledb.BIND_OUT, type: connectDB.oracledb.NUMBER }
      }
    );

    const prescriptionId = prescriptionResult.outBinds.prescriptionId[0];

    // Insert prescribed medicines if provided
    if (medicines && medicines.length > 0) {
      for (const medicine of medicines) {
        const { medicineName, dosage, duration } = medicine;

        if (!medicineName) {
          continue; // Skip empty entries
        }

        // Insert medicine name directly into PRESCRIBED_MED with dosage and duration
        // No validation - accept any medicine name
        await connection.execute(
          `INSERT INTO PRESCRIBED_MED (
            PRESCRIPTION_ID,
            MEDICATION_ID,
            DOSAGE,
            DURATION
          ) VALUES (
            :prescriptionId,
            :medicineName,
            :dosage,
            :duration
          )`,
          {
            prescriptionId,
            medicineName: medicineName.trim(),
            dosage: dosage || null,
            duration: duration || null
          }
        );
      }
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      prescriptionId
    });

  } catch (error) {
    console.error('Error creating prescription:', error);
    if (connection) {
      await connection.rollback();
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create prescription',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};
```

**Route**: `POST /api/prescriptions`

**Process**:
1. Validates appointmentId exists
2. Checks if prescription already exists (prevents duplicates)
3. Inserts into PRESCRIPTION table with `RETURNING ID`
4. Loops through medicines array and inserts into PRESCRIBED_MED table
5. Commits transaction

**Note**: Medicine name is stored directly in `MEDICATION_ID` column (accepts any string, no validation)

---

### 🔹 GET PRESCRIPTION BY APPOINTMENT ID

```javascript
exports.getPrescriptionByAppointment = async (req, res) => {
  let connection;
  
  try {
    const { appointmentId } = req.params;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID is required'
      });
    }

    connection = await connectDB();

    // Get prescription details
    const prescriptionResult = await connection.execute(
      `SELECT 
        p.ID,
        p.APPOINTMENT_ID,
        p.DATE_ISSUED,
        p.CHIEF_COMPLAINTS,
        p.INVESTIGATIONS,
        p.REQUIRED_TESTS,
        p.DIAGNOSIS,
        p.HISTORY,
        p.INSTRUCTIONS,
        p.VISIT_AGAIN_AT,
        da.APPOINTMENT_DATE,
        da.STATUS as APPOINTMENT_STATUS,
        u.NAME as PATIENT_NAME,
        du.NAME as DOCTOR_NAME
      FROM PRESCRIPTION p
      JOIN DOCTORS_APPOINTMENTS da ON p.APPOINTMENT_ID = da.ID
      JOIN PATIENT pat ON da.PATIENT_ID = pat.ID
      JOIN USERS u ON pat.USER_ID = u.ID
      JOIN DOCTOR doc ON da.DOCTOR_ID = doc.ID
      JOIN USERS du ON doc.USER_ID = du.ID
      WHERE p.APPOINTMENT_ID = :appointmentId`,
      { appointmentId }
    );

    if (prescriptionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found for this appointment'
      });
    }

    const prescription = prescriptionResult.rows[0];

    // Get prescribed medicines
    const medicinesResult = await connection.execute(
      `SELECT 
        m.id,
        m.name,
        pm.DOSAGE,
        pm.DURATION,
        m.manufacturer,
        m.category
      FROM PRESCRIBED_MED pm
      JOIN medicines m ON pm.MEDICATION_ID = m.id
      WHERE pm.PRESCRIPTION_ID = :prescriptionId`,
      { prescriptionId: prescription[0] }
    );

    const medicines = medicinesResult.rows.map(row => ({
      id: row[0],
      medicineName: row[1],
      dosage: row[2],
      duration: row[3],
      manufacturer: row[4],
      category: row[5]
    }));

    res.json({
      success: true,
      prescription: {
        id: prescription[0],
        appointmentId: prescription[1],
        dateIssued: prescription[2],
        chiefComplaints: prescription[3],
        investigations: prescription[4],
        requiredTests: prescription[5],
        diagnosis: prescription[6],
        history: prescription[7],
        instructions: prescription[8],
        visitAgainAt: prescription[9],
        appointmentDate: prescription[10],
        appointmentStatus: prescription[11],
        patientName: prescription[12],
        doctorName: prescription[13],
        medicines
      }
    });

  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prescription',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};
```

**Route**: `GET /api/prescriptions/appointment/:appointmentId`

**Query**: Joins PRESCRIPTION, DOCTORS_APPOINTMENTS, PATIENT, DOCTOR, USERS, and medicines tables

**Returns**: Complete prescription with patient/doctor names and medicines list

---


## 📍 BACKEND: Routes Registration
**Location**: `backend/routes/prescriptionRoutes.js`

---

### 🔹 ALL PRESCRIPTION ROUTES

```javascript
const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');

// Get all available medicines
router.get('/medicines', prescriptionController.getAllMedicines);

// Create new prescription
router.post('/', prescriptionController.createPrescription);

// Get prescription by appointment ID
router.get('/appointment/:appointmentId', prescriptionController.getPrescriptionByAppointment);

// Get prescription by prescription ID
router.get('/:id', prescriptionController.getPrescriptionById);

// Update prescription
router.put('/:id', prescriptionController.updatePrescription);

// Delete prescription
router.delete('/:id', prescriptionController.deletePrescription);

module.exports = router;
```

**Note**: These routes are mounted at `/api/prescriptions` in main server file

---

## 📊 COMPLETE API SUMMARY

### Prescription APIs

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/prescriptions/medicines` | No | Get all available medicines |
| POST | `/api/prescriptions` | No | Create new prescription |
| GET | `/api/prescriptions/appointment/:appointmentId` | No | Get prescription by appointment |
| GET | `/api/prescriptions/:id` | No | Get prescription by ID |
| PUT | `/api/prescriptions/:id` | No | Update prescription |
| DELETE | `/api/prescriptions/:id` | No | Delete prescription |

### Doctor Appointments API

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/doctor/appointments/:email` | No | Get all appointments with prescription status |

---

## 🗂️ DATABASE TABLES USED

### PRESCRIPTION Table
- Stores: ID, APPOINTMENT_ID, DATE_ISSUED, CHIEF_COMPLAINTS, INVESTIGATIONS, REQUIRED_TESTS, DIAGNOSIS, HISTORY, INSTRUCTIONS, VISIT_AGAIN_AT
- Created by: `POST /api/prescriptions`

### PRESCRIBED_MED Table
- Stores: ID, PRESCRIPTION_ID, MEDICATION_ID (stores medicine name as string), DOSAGE, DURATION
- Created by: `POST /api/prescriptions` (loops through medicines array)

### medicines Table
- Stores: id, name, description, manufacturer, price, stock_quantity, category
- Used by: `GET /api/prescriptions/medicines` (for autocomplete)

### DOCTORS_APPOINTMENTS Table
- Stores: ID, DOCTOR_ID, PATIENT_ID, TIME_SLOT_ID, APPOINTMENT_DATE, STATUS, TYPE
- Used by: Get appointments, check prescription status via LEFT JOIN

---

## 🔄 COMPLETE PRESCRIPTION FLOW

### Step 1: Doctor Views Appointments
1. Doctor lands on dashboard
2. `fetchAppointments(email)` called → `GET /api/doctor/appointments/:email`
3. Backend queries DOCTORS_APPOINTMENTS with `LEFT JOIN PRESCRIPTION`
4. Returns appointments with `hasPrescription` flag
5. Frontend displays appointment cards

### Step 2: Doctor Sees Write Prescription Button
1. For each appointment card, checks: `apt.status === 'BOOKED' && !apt.hasPrescription`
2. If true, shows "✍️ Write Prescription" button
3. If false (prescription exists), shows "✅ Prescription Added" badge

### Step 3: Doctor Clicks Write Prescription
1. Button onClick: `navigate(/doctor/prescription/${apt.appointmentId})`
2. Navigates to WritePrescription page with appointmentId in URL

### Step 4: WritePrescription Page Loads
1. Extracts `appointmentId` from URL params
2. Calls `fetchMedicines()` → `GET /api/prescriptions/medicines`
3. Populates medicines dropdown with available medicines
4. Shows empty form with one medicine row

### Step 5: Doctor Fills Form
1. Enters chief complaints, history, investigations, tests, diagnosis
2. Adds medicines (can add multiple rows with + button)
3. Each medicine has: name (autocomplete), dosage, duration
4. Enters instructions and optional next visit date

### Step 6: Doctor Saves Prescription
1. Clicks "Create Prescription" button
2. Calls `handleSubmit()` → `POST /api/prescriptions`
3. Sends all form data + filtered medicines array
4. Backend:
   - Validates appointment exists
   - Checks no duplicate prescription
   - Inserts into PRESCRIPTION table (gets prescriptionId)
   - Loops through medicines and inserts into PRESCRIBED_MED
   - Commits transaction
5. Success message shown
6. After 2 seconds, navigates back to `/doctor/dashboard`

### Step 7: Back to Dashboard
1. Appointments list refreshed
2. The appointment now has `hasPrescription = true`
3. Shows "✅ Prescription Added" badge instead of button

---

## ✅ KEY POINTS

1. **hasPrescription flag**: Determined by `LEFT JOIN PRESCRIPTION` - if prescription exists, flag is true
2. **Button visibility**: Only shows for BOOKED appointments without prescription
3. **Medicine autocomplete**: Uses `<datalist>` with medicines from database
4. **Dynamic medicine rows**: Can add/remove multiple medicines
5. **Medicine storage**: Medicine name stored as string in MEDICATION_ID column (no foreign key validation)
6. **Transaction safety**: Uses commit/rollback for data integrity
7. **Duplicate prevention**: Checks if prescription already exists before creating
8. **Auto-redirect**: After successful save, returns to dashboard after 2 seconds
9. **Required field**: Only diagnosis is required, all other fields optional
10. **Date issued**: Auto-set to SYSDATE on backend

---

## 📁 FILE LOCATIONS

### Frontend
- `frontend/src/pages/DoctorDashboard.jsx` - Appointments list with prescription status
- `frontend/src/pages/WritePrescription.jsx` - Prescription form
- `frontend/src/styles/WritePrescription.css` - Prescription form styles

### Backend
- `backend/controllers/prescriptionController.js` - All prescription CRUD operations
- `backend/controllers/doctorAppointments.js` - Fetch appointments with prescription status
- `backend/routes/prescriptionRoutes.js` - Prescription route registrations
- `backend/routes/auth.js` - Doctor appointments route registration

---

**END OF DOCUMENT**
