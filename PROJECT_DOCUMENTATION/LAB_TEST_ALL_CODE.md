# Lab Test Booking - ALL CODE

## Database Table Structure

### LAB_TEST_APPOINTMENTS
```sql
ID                  NUMBER (PK)
PATIENT_ID          NUMBER NOT NULL (FK → PATIENT)
REFERENCE           VARCHAR2(100)      -- Token
DOCTOR_ID           NUMBER (FK → DOCTOR, optional) -- Used for Technician ID
TIME_SLOT_ID        NUMBER (FK → TIME_SLOTS, optional)
TEST_ID             NUMBER NOT NULL (FK → LAB_TESTS)
TEST_FILE_URL       VARCHAR2(255)
```

---

## Backend Code

### 1. backend/controllers/labTestController.js

```javascript
const connectDB = require('../db/connection');

/**
 * Get all available lab tests
 * GET /api/lab-tests
 */
exports.getAllLabTests = async (req, res) => {
  let connection;
  
  try {
    connection = await connectDB();

    const result = await connection.execute(
      `SELECT 
        ID,
        TEST_NAME,
        DESCRIPTION,
        PRICE,
        DEPARTMENT,
        PREPARATION_REQUIRED,
        DURATION_MINUTES
      FROM LAB_TESTS
      ORDER BY TEST_NAME`
    );

    const labTests = result.rows.map(row => ({
      id: row[0],
      testName: row[1],
      description: row[2],
      price: row[3],
      department: row[4],
      preparationRequired: row[5],
      durationMinutes: row[6]
    }));

    res.json({
      success: true,
      labTests
    });

  } catch (error) {
    console.error('Error fetching lab tests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lab tests',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

/**
 * Get all medical technicians
 * GET /api/medical-technicians
 */
exports.getAllTechnicians = async (req, res) => {
  let connection;
  
  try {
    connection = await connectDB();

    const result = await connection.execute(
      `SELECT 
        mt.ID,
        mt.NAME,
        mt.EMAIL,
        mt.PHONE,
        mt.DEGREES,
        mt.EXPERIENCE_YEARS,
        d.NAME as DEPT_NAME,
        hb.NAME as BRANCH_NAME
      FROM MEDICAL_TECHNICIAN mt
      LEFT JOIN DEPARTMENTS d ON mt.DEPT_ID = d.ID
      LEFT JOIN HOSPITAL_BRANCHES hb ON mt.BRANCH_ID = hb.ID
      ORDER BY mt.NAME`
    );

    const technicians = result.rows.map(row => ({
      id: row[0],
      name: row[1],
      email: row[2],
      phone: row[3],
      degrees: row[4],
      experienceYears: row[5],
      department: row[6],
      branch: row[7]
    }));

    res.json({
      success: true,
      technicians
    });

  } catch (error) {
    console.error('Error fetching technicians:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch technicians',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

/**
 * Generate unique lab test token
 */
const generateLabTestToken = async (connection) => {
  const year = new Date().getFullYear();
  
  // Get the last token for this year
  const result = await connection.execute(
    `SELECT MAX(REFERENCE) as LAST_TOKEN 
     FROM LAB_TEST_APPOINTMENTS 
     WHERE REFERENCE LIKE :pattern`,
    { pattern: `LT-${year}-%` }
  );
  
  let nextNumber = 1;
  if (result.rows[0] && result.rows[0][0]) {
    const lastToken = result.rows[0][0];
    const lastNumber = parseInt(lastToken.split('-')[2]);
    nextNumber = lastNumber + 1;
  }
  
  const token = `LT-${year}-${String(nextNumber).padStart(6, '0')}`;
  return token;
};

/**
 * Book a lab test
 * POST /api/lab-test-appointments
 * Body: { patientEmail, testId, technicianId }
 */
exports.bookLabTest = async (req, res) => {
  let connection;
  
  try {
    const { patientEmail, testId, technicianId } = req.body;

    console.log('📋 Booking lab test:', { patientEmail, testId, technicianId });

    // Validate required fields
    if (!patientEmail || !testId) {
      return res.status(400).json({
        success: false,
        message: 'Patient email and test ID are required'
      });
    }

    connection = await connectDB();

    // Get patient ID from email
    const patientResult = await connection.execute(
      `SELECT p.ID 
       FROM PATIENT p
       JOIN USERS u ON p.USER_ID = u.ID
       WHERE TRIM(LOWER(u.EMAIL)) = TRIM(LOWER(:email))`,
      { email: patientEmail }
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const patientId = patientResult.rows[0][0];

    // Get test details
    const testResult = await connection.execute(
      `SELECT TEST_NAME, PRICE FROM LAB_TESTS WHERE ID = :testId`,
      { testId }
    );

    if (testResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lab test not found'
      });
    }

    const testName = testResult.rows[0][0];
    const testPrice = testResult.rows[0][1];

    // Get technician name if provided
    let technicianName = null;
    if (technicianId) {
      const techResult = await connection.execute(
        `SELECT NAME FROM MEDICAL_TECHNICIAN WHERE ID = :technicianId`,
        { technicianId }
      );
      if (techResult.rows.length > 0) {
        technicianName = techResult.rows[0][0];
      }
    }

    // Generate unique token
    const token = await generateLabTestToken(connection);

    console.log('🎫 Generated token:', token);

    // Insert lab test appointment
    const insertResult = await connection.execute(
      `INSERT INTO LAB_TEST_APPOINTMENTS (
        PATIENT_ID,
        TEST_ID,
        DOCTOR_ID,
        REFERENCE
      ) VALUES (
        :patientId,
        :testId,
        :technicianId,
        :token
      ) RETURNING ID INTO :appointmentId`,
      {
        patientId,
        testId,
        technicianId: technicianId || null,
        token,
        appointmentId: { dir: connectDB.oracledb.BIND_OUT, type: connectDB.oracledb.NUMBER }
      }
    );

    const appointmentId = insertResult.outBinds.appointmentId[0];

    await connection.commit();

    console.log('✅ Lab test booked successfully:', appointmentId);

    res.status(201).json({
      success: true,
      message: 'Lab test booked successfully',
      data: {
        appointmentId,
        token,
        testName,
        technicianName,
        price: testPrice
      }
    });

  } catch (error) {
    console.error('❌ Error booking lab test:', error);
    if (connection) {
      await connection.rollback();
    }
    res.status(500).json({
      success: false,
      message: 'Failed to book lab test',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

/**
 * Get patient's lab test appointments
 * GET /api/patient/:email/lab-tests
 */
exports.getPatientLabTests = async (req, res) => {
  let connection;
  
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Patient email is required'
      });
    }

    connection = await connectDB();

    // Get patient ID
    const patientResult = await connection.execute(
      `SELECT p.ID 
       FROM PATIENT p
       JOIN USERS u ON p.USER_ID = u.ID
       WHERE TRIM(LOWER(u.EMAIL)) = TRIM(LOWER(:email))`,
      { email }
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const patientId = patientResult.rows[0][0];

    // Get lab test appointments
    const result = await connection.execute(
      `SELECT 
        lta.ID,
        lta.REFERENCE,
        lt.TEST_NAME,
        lt.PRICE,
        lt.DEPARTMENT,
        mt.NAME as TECHNICIAN_NAME,
        lta.TEST_FILE_URL,
        'PENDING' as STATUS
      FROM LAB_TEST_APPOINTMENTS lta
      JOIN LAB_TESTS lt ON lta.TEST_ID = lt.ID
      LEFT JOIN MEDICAL_TECHNICIAN mt ON lta.DOCTOR_ID = mt.ID
      WHERE lta.PATIENT_ID = :patientId
      ORDER BY lta.ID DESC`,
      { patientId }
    );

    const labTests = result.rows.map(row => ({
      id: row[0],
      token: row[1],
      testName: row[2],
      price: row[3],
      department: row[4],
      technicianName: row[5],
      testFileUrl: row[6],
      status: row[7]
    }));

    res.json({
      success: true,
      labTests
    });

  } catch (error) {
    console.error('Error fetching patient lab tests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lab tests',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};
```

### 2. backend/routes/labTestRoutes.js

```javascript
const express = require('express');
const router = express.Router();
const labTestController = require('../controllers/labTestController');

// Get all available lab tests
router.get('/lab-tests', labTestController.getAllLabTests);

// Get all medical technicians
router.get('/medical-technicians', labTestController.getAllTechnicians);

// Book a lab test
router.post('/lab-test-appointments', labTestController.bookLabTest);

// Get patient's lab test appointments
router.get('/patient/:email/lab-tests', labTestController.getPatientLabTests);

module.exports = router;
```

### 3. backend/server.js (relevant part)

```javascript
// Routes
const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctorRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const labTestRoutes = require('./routes/labTestRoutes');

// ... admin routes code ...

app.use('/api', authRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api', labTestRoutes);
```

---

## Frontend Code

### frontend/src/pages/PatientDashboard.jsx (relevant parts)

#### State Variables
```javascript
const [showLabTestModal, setShowLabTestModal] = useState(false);
const [labTestStep, setLabTestStep] = useState(1);
const [labTests, setLabTests] = useState([]);
const [technicians, setTechnicians] = useState([]);
const [selectedTest, setSelectedTest] = useState(null);
const [selectedTechnician, setSelectedTechnician] = useState(null);
const [labTestSearch, setLabTestSearch] = useState('');
const [bookingLabTest, setBookingLabTest] = useState(false);
const [labTestToken, setLabTestToken] = useState(null);
const [myLabTests, setMyLabTests] = useState([]);
```

#### Handler Functions
```javascript
const handleBookLabTest = async () => {
  setShowLabTestModal(true);
  setLabTestStep(1);
  setSelectedTest(null);
  setSelectedTechnician(null);
  setLabTestToken(null);
  
  // Fetch lab tests and technicians
  try {
    const [testsRes, techsRes] = await Promise.all([
      fetch('http://localhost:3000/api/lab-tests'),
      fetch('http://localhost:3000/api/medical-technicians')
    ]);
    
    if (testsRes.ok) {
      const testsData = await testsRes.json();
      setLabTests(testsData.labTests || []);
    }
    
    if (techsRes.ok) {
      const techsData = await techsRes.json();
      setTechnicians(techsData.technicians || []);
    }
  } catch (err) {
    console.error('Error loading lab test data:', err);
  }
};

const handleConfirmLabTestBooking = async () => {
  if (!selectedTest) {
    setModalMessage({
      type: 'error',
      title: 'Selection Required',
      message: 'Please select a lab test'
    });
    setShowModal(true);
    return;
  }

  setBookingLabTest(true);

  try {
    const res = await fetch('http://localhost:3000/api/lab-test-appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        patientEmail: user.email,
        testId: selectedTest.id,
        technicianId: selectedTechnician?.id || null
      })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      setLabTestToken(data.data);
      setLabTestStep(3); // Show success screen
      // Refresh lab tests list
      fetchMyLabTests();
    } else {
      setModalMessage({
        type: 'error',
        title: 'Booking Failed',
        message: data.message || 'Failed to book lab test'
      });
      setShowModal(true);
      setShowLabTestModal(false);
    }
  } catch (err) {
    console.error('Error booking lab test:', err);
    setModalMessage({
      type: 'error',
      title: 'Error',
      message: 'Network error. Please try again.'
    });
    setShowModal(true);
    setShowLabTestModal(false);
  } finally {
    setBookingLabTest(false);
  }
};
```

---

## Data Flow

```
Frontend Request:
POST http://localhost:3000/api/lab-test-appointments
Body: {
  patientEmail: "patient@email.com",
  testId: 1,
  technicianId: 5
}

↓

Backend Processing:
1. Get PATIENT.ID from email
2. Get LAB_TESTS.TEST_NAME and PRICE
3. Get MEDICAL_TECHNICIAN.NAME (if provided)
4. Generate token: LT-2026-000001
5. INSERT INTO LAB_TEST_APPOINTMENTS

↓

Database Insert:
INSERT INTO LAB_TEST_APPOINTMENTS (
  PATIENT_ID,     -- From PATIENT table
  TEST_ID,        -- From request
  DOCTOR_ID,      -- Technician ID (reusing this field)
  REFERENCE       -- Generated token
) VALUES (123, 1, 5, 'LT-2026-000001')

↓

Backend Response:
{
  success: true,
  message: "Lab test booked successfully",
  data: {
    appointmentId: 567,
    token: "LT-2026-000001",
    testName: "Complete Blood Count (CBC)",
    technicianName: "Dr. Ahmed Khan",
    price: 500
  }
}
```

---

## Debugging Steps

### 1. Check if LAB_TESTS table has data
```sql
SELECT COUNT(*) FROM LAB_TESTS;
SELECT * FROM LAB_TESTS;
```

### 2. Check if MEDICAL_TECHNICIAN table has data
```sql
SELECT COUNT(*) FROM MEDICAL_TECHNICIAN;
SELECT * FROM MEDICAL_TECHNICIAN;
```

### 3. Test backend endpoints directly
```bash
# Test get lab tests
curl http://localhost:3000/api/lab-tests

# Test get technicians
curl http://localhost:3000/api/medical-technicians

# Test booking
curl -X POST http://localhost:3000/api/lab-test-appointments \
  -H "Content-Type: application/json" \
  -d '{
    "patientEmail": "YOUR_PATIENT_EMAIL",
    "testId": 1,
    "technicianId": 1
  }'
```

### 4. Check browser console
- Open DevTools → Console
- Click "Book Lab Test"
- Look for errors
- Check Network tab for API calls

### 5. Check backend logs
- Look at terminal where `node server.js` is running
- Should see:
  - "📋 Booking lab test: ..."
  - "🎫 Generated token: ..."
  - "✅ Lab test booked successfully: ..."
- Or error messages

---

## Common Issues

### Issue 1: "Booking Failed" - No tests in database
**Solution:** Run `backend/INSERT_SAMPLE_LAB_TESTS.sql`

### Issue 2: Patient not found
**Solution:** Make sure you're logged in as a patient

### Issue 3: Network error
**Solution:** Check if backend server is running on port 3000

### Issue 4: Token generation fails
**Solution:** Check LAB_TEST_APPOINTMENTS table structure

---

All code is here! Check the debugging steps to find the issue.
