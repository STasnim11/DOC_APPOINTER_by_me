# Lab Test Booking - Complete Flow & Design

## Database Schema Analysis

### Relevant Tables:

#### 1. LAB_TESTS (Test Catalog)
```sql
ID                  NUMBER (PK)
TEST_NAME           VARCHAR2(200) NOT NULL
DESCRIPTION         VARCHAR2(500)
PRICE               NUMBER NOT NULL
DEPARTMENT          VARCHAR2(100)
PREPARATION_REQUIRED VARCHAR2(500)
DURATION_MINUTES    NUMBER
CREATED_AT          TIMESTAMP
UPDATED_AT          TIMESTAMP
```

#### 2. LAB_TEST_APPOINTMENTS (Booking Table)
```sql
ID                  NUMBER (PK)
PATIENT_ID          NUMBER NOT NULL (FK → PATIENT)
REFERENCE           VARCHAR2(100)      -- This will be the TOKEN
DOCTOR_ID           NUMBER (FK → DOCTOR, optional)
TIME_SLOT_ID        NUMBER (FK → TIME_SLOTS, optional)
TEST_ID             NUMBER NOT NULL (FK → LAB_TESTS)
TEST_FILE_URL       VARCHAR2(255)      -- For uploading results later
```

#### 3. MEDICAL_TECHNICIAN (Technician List)
```sql
ID                  NUMBER (PK)
ADMIN_ID            NUMBER NOT NULL
NAME                VARCHAR2(100)
EMAIL               VARCHAR2(100) UNIQUE
PHONE               VARCHAR2(20)
DEGREES             VARCHAR2(200)
EXPERIENCE_YEARS    NUMBER
DEPT_ID             NUMBER (FK → DEPARTMENTS)
BRANCH_ID           NUMBER (FK → HOSPITAL_BRANCHES)
```

---

## Complete User Flow

### Step 1: Patient Views Appointment
```
Patient Dashboard → My Appointments → Appointment Card
├── View Prescription (if exists)
└── 📋 Book Lab Test (NEW BUTTON)
```

### Step 2: Click "Book Lab Test"
```
Opens Modal:
┌─────────────────────────────────────────┐
│  🧪 Book Lab Test                    ✕ │
├─────────────────────────────────────────┤
│  Step 1: Select Lab Test               │
│  [Search box]                           │
│  ┌─────────────────────────────────┐   │
│  │ ☑ Complete Blood Count (CBC)    │   │
│  │   Price: ৳500 | Duration: 30min │   │
│  │   Dept: Pathology               │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ ☐ X-Ray Chest                   │   │
│  │   Price: ৳800 | Duration: 15min │   │
│  │   Dept: Radiology               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Step 2: Select Medical Technician     │
│  ┌─────────────────────────────────┐   │
│  │ ○ Dr. Ahmed Khan                │   │
│  │   Pathology | 5 years exp       │   │
│  │   📧 ahmed@hospital.com          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Cancel]  [Book Test →]               │
└─────────────────────────────────────────┘
```

### Step 3: Booking Confirmation
```
After clicking "Book Test":
1. Generate unique token (e.g., "LT-2026-001234")
2. Insert into LAB_TEST_APPOINTMENTS
3. Show success modal with token

┌─────────────────────────────────────────┐
│  ✅ Lab Test Booked Successfully!       │
├─────────────────────────────────────────┤
│  Your Token Number:                     │
│  ┌─────────────────────────────────┐   │
│  │      LT-2026-001234             │   │
│  │  (Click to copy)                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Test: Complete Blood Count (CBC)      │
│  Technician: Dr. Ahmed Khan             │
│  Price: ৳500                            │
│                                         │
│  Please bring this token when you      │
│  visit the lab.                        │
│                                         │
│  [Download Receipt] [Close]            │
└─────────────────────────────────────────┘
```

### Step 4: View Booked Tests
```
Patient Dashboard → My Lab Tests (NEW TAB)
┌─────────────────────────────────────────┐
│  My Lab Tests                           │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │ 🧪 Complete Blood Count (CBC)   │   │
│  │ Token: LT-2026-001234           │   │
│  │ Status: Pending                 │   │
│  │ Technician: Dr. Ahmed Khan      │   │
│  │ Booked: Apr 3, 2026             │   │
│  │ [View Details] [Download Token] │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## Technical Implementation

### Frontend Components

#### 1. Book Lab Test Button (in appointment card)
```javascript
{apt.status === 'COMPLETED' && (
  <button onClick={() => handleBookLabTest(apt.appointmentId)}>
    🧪 Book Lab Test
  </button>
)}
```

#### 2. Lab Test Booking Modal
```javascript
const LabTestBookingModal = ({ show, onClose, appointmentId }) => {
  const [step, setStep] = useState(1); // 1: select test, 2: select tech, 3: confirm
  const [labTests, setLabTests] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  
  // Fetch lab tests and technicians
  // Handle booking
  // Generate token
  // Show confirmation
};
```

#### 3. Token Display Component
```javascript
const TokenDisplay = ({ token, testName, technicianName, price }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(token);
    // Show toast notification
  };
  
  return (
    <div className="token-display">
      <div className="token-number" onClick={copyToClipboard}>
        {token}
      </div>
      {/* Test details */}
    </div>
  );
};
```

---

## Backend API Endpoints

### 1. Get All Lab Tests
```
GET /api/lab-tests
Response: [
  {
    id: 1,
    testName: "Complete Blood Count (CBC)",
    description: "...",
    price: 500,
    department: "Pathology",
    preparationRequired: "Fasting required",
    durationMinutes: 30
  }
]
```

### 2. Get Available Technicians
```
GET /api/medical-technicians
Response: [
  {
    id: 1,
    name: "Dr. Ahmed Khan",
    email: "ahmed@hospital.com",
    phone: "01712345678",
    degrees: "MBBS, MD",
    experienceYears: 5,
    department: "Pathology",
    branch: "Main Branch"
  }
]
```

### 3. Book Lab Test
```
POST /api/lab-test-appointments
Body: {
  patientId: 123,
  testId: 1,
  technicianId: 5,  // Optional, stored in DOCTOR_ID field
  appointmentId: 42  // Reference to original appointment
}
Response: {
  success: true,
  token: "LT-2026-001234",
  appointmentId: 567,
  testName: "Complete Blood Count (CBC)",
  technicianName: "Dr. Ahmed Khan",
  price: 500
}
```

### 4. Get Patient Lab Test Appointments
```
GET /api/patient/:patientId/lab-tests
Response: [
  {
    id: 567,
    token: "LT-2026-001234",
    testName: "Complete Blood Count (CBC)",
    technicianName: "Dr. Ahmed Khan",
    status: "Pending",
    bookedDate: "2026-04-03",
    price: 500,
    testFileUrl: null
  }
]
```

---

## Token Generation Logic

### Format: `LT-YYYY-NNNNNN`
- `LT` = Lab Test prefix
- `YYYY` = Current year
- `NNNNNN` = 6-digit sequential number

### Implementation:
```javascript
const generateLabTestToken = async (connection) => {
  const year = new Date().getFullYear();
  
  // Get the last token for this year
  const result = await connection.execute(
    `SELECT MAX(REFERENCE) as LAST_TOKEN 
     FROM LAB_TEST_APPOINTMENTS 
     WHERE REFERENCE LIKE 'LT-${year}-%'`
  );
  
  let nextNumber = 1;
  if (result.rows[0][0]) {
    const lastToken = result.rows[0][0];
    const lastNumber = parseInt(lastToken.split('-')[2]);
    nextNumber = lastNumber + 1;
  }
  
  const token = `LT-${year}-${String(nextNumber).padStart(6, '0')}`;
  return token;
};
```

---

## Database Insertion

### SQL Query:
```sql
INSERT INTO LAB_TEST_APPOINTMENTS (
  PATIENT_ID,
  TEST_ID,
  DOCTOR_ID,      -- Store technician ID here
  REFERENCE,      -- Token
  TIME_SLOT_ID,   -- NULL for now
  TEST_FILE_URL   -- NULL initially
) VALUES (
  :patientId,
  :testId,
  :technicianId,
  :token,
  NULL,
  NULL
) RETURNING ID INTO :appointmentId
```

---

## UI Design Specifications

### Colors:
- Lab Test Theme: Teal/Cyan (#14b8a6)
- Pending Status: Yellow (#fbbf24)
- Completed Status: Green (#10b981)
- Token Display: Large, bold, copyable

### Animations:
- Modal slide-in
- Token number pulse effect
- Success checkmark animation
- Copy to clipboard feedback

### Responsive:
- Mobile: Single column layout
- Desktop: Two column (tests | technicians)
- Token: Large, centered, easy to read

---

## Additional Features

### 1. Search & Filter
- Search tests by name
- Filter by department
- Filter by price range
- Sort by price/duration

### 2. Test Details
- Show preparation requirements
- Show duration
- Show department
- Show price

### 3. Technician Selection
- Show photo (if available)
- Show qualifications
- Show experience
- Show department
- Show availability

### 4. Token Management
- Copy to clipboard
- Download as PDF
- Send via email
- Print receipt

### 5. Status Tracking
- Pending: Waiting for test
- In Progress: Test being conducted
- Completed: Results available
- Cancelled: Booking cancelled

---

## Files to Create/Modify

### Backend:
1. `backend/controllers/labTestController.js` (NEW)
2. `backend/routes/labTestRoutes.js` (NEW)
3. `backend/server.js` (add route)

### Frontend:
1. `frontend/src/pages/PatientDashboard.jsx` (add button & modal)
2. `frontend/src/components/LabTestBookingModal.jsx` (NEW)
3. `frontend/src/components/TokenDisplay.jsx` (NEW)
4. `frontend/src/styles/LabTest.css` (NEW)

---

## Summary

This is a complete lab test booking system where:
1. Patient clicks "Book Lab Test" on completed appointment
2. Selects test from catalog
3. Selects medical technician
4. Receives unique token
5. Can view all booked tests
6. Can track status
7. Can download/print token

The token serves as a reference number for the patient to present at the lab.

Ready to implement? 🚀
