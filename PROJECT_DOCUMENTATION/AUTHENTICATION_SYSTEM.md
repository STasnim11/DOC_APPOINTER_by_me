# DOCAPPOINTER - Authentication System Documentation

## Overview
DOCAPPOINTER uses **JWT (JSON Web Token)** based authentication with role-based access control (RBAC).

---

## 🔐 Authentication Flow

### 1. Signup Process
**Endpoint:** `POST /api/signup`  
**File:** `backend/controllers/authController.js`

**Steps:**
1. **Validation**
   - Email format validation (regex)
   - Password strength (min 8 chars, uppercase, number)
   - Phone number (exactly 11 digits)
   - Role validation (user, admin, patient, doctor, staff)

2. **Duplicate Check**
   - Query database for existing email
   - Return 409 Conflict if exists

3. **Password Hashing**
   - Use bcrypt with salt rounds = 10
   - Store hashed password (never plain text)

4. **User Creation**
   - Insert into USERS table
   - Create role-specific record:
     - DOCTOR → Insert into DOCTOR table
     - PATIENT → Insert into PATIENT table
     - ADMIN → Insert into ADMIN table

5. **JWT Generation**
   - Sign token with user data (id, email, role)
   - Expiration: 24 hours
   - Secret: From environment variable or default

6. **Response**
   ```json
   {
     "message": "✅ User created successfully",
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user": {
       "id": 123,
       "name": "John Doe",
       "email": "john@example.com",
       "phone": "01234567890",
       "role": "PATIENT"
     }
   }
   ```

---

### 2. Login Process
**Endpoint:** `POST /api/login`  
**File:** `backend/controllers/authController.js`

**Steps:**
1. **Input Validation**
   - Check email and password provided

2. **User Lookup**
   - Query USERS table by email
   - Return 401 if not found

3. **Password Verification**
   - Use bcrypt.compare() to verify hashed password
   - Return 401 if invalid

4. **JWT Generation**
   - Sign token with user data (id, email, role)
   - Expiration: 24 hours

5. **Response**
   ```json
   {
     "message": "✅ Login successful",
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user": {
       "id": 123,
       "name": "John Doe",
       "email": "john@example.com",
       "phone": "01234567890",
       "role": "PATIENT"
     }
   }
   ```

---

## 🛡️ Authentication Middleware

**File:** `backend/middleware/auth.js`

### 1. authenticateToken
**Purpose:** Verify JWT token from request headers

**Usage:**
```javascript
router.use(authenticateToken);
```

**Process:**
1. Extract token from `Authorization: Bearer <token>` header
2. Verify token using JWT_SECRET
3. Decode token and attach user data to `req.user`
4. Return 401 if no token
5. Return 403 if invalid/expired token

**Decoded User Object:**
```javascript
req.user = {
  id: 123,
  email: "john@example.com",
  role: "PATIENT"
}
```

---

### 2. requireAdmin
**Purpose:** Ensure user has ADMIN role

**Usage:**
```javascript
router.use(authenticateToken);
router.use(requireAdmin);
```

**Process:**
- Check if `req.user.role === 'ADMIN'`
- Return 403 if not admin

---

### 3. requireDoctor
**Purpose:** Ensure user has DOCTOR role

**Usage:**
```javascript
router.put('/appointments/:id/complete', authenticateToken, requireDoctor, controller.complete);
```

---

### 4. requirePatient
**Purpose:** Ensure user has PATIENT role

**Usage:**
```javascript
router.put('/appointments/:id/cancel', authenticateToken, requirePatient, controller.cancel);
```

---

## 🎯 Role-Based Access Control (RBAC)

### Roles in System
1. **PATIENT** - Book appointments, view prescriptions, manage profile
2. **DOCTOR** - View appointments, write prescriptions, manage schedule
3. **ADMIN** - Manage system data, view all records
4. **STAFF** - (Future use)
5. **USER** - (Generic role)

### Protected Routes

#### Admin Routes
**File:** `backend/routes/adminRoutes.js`
```javascript
router.use(authenticateToken);  // All routes require authentication
router.use(requireAdmin);        // All routes require admin role
```

**Protected Endpoints:**
- GET/POST/PUT/DELETE `/api/admin/departments`
- GET/POST/PUT/DELETE `/api/admin/hospital-branches`
- GET/POST/PUT/DELETE `/api/admin/medical-technicians`
- GET/POST/PUT/DELETE `/api/admin/beds`
- GET/POST/PUT/DELETE `/api/admin/lab-tests`
- GET/POST/PUT/DELETE `/api/admin/medicines`
- GET/POST/PUT/DELETE `/api/admin/bed-bookings`
- GET/POST/PUT/DELETE `/api/admin/lab-test-appointments`
- GET `/api/admin/db-features/*`

#### Patient Routes
**File:** `backend/routes/auth.js`
```javascript
router.put('/appointments/:id/cancel', authenticateToken, requirePatient, ...);
router.put('/patient/update-profile', authenticateToken, requirePatient, ...);
router.delete('/patient/delete-profile', authenticateToken, requirePatient, ...);
```

---

## 💾 Frontend Token Storage

### Storage Method: localStorage

**Stored Data:**
```javascript
localStorage.setItem("user", JSON.stringify({
  id: 123,
  name: "John Doe",
  email: "john@example.com",
  phone: "01234567890",
  role: "PATIENT",
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}));
```

**Additional Storage:**
```javascript
localStorage.setItem("userId", data.user.id);
localStorage.setItem("userEmail", data.user.email);
localStorage.setItem("userRole", data.user.role);
```

---

## 📡 Frontend API Calls with Authentication

### Pattern Used:
```javascript
const user = JSON.parse(localStorage.getItem('user'));
const token = user?.token;

const response = await fetch('http://localhost:3000/api/endpoint', {
  method: 'GET/POST/PUT/DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data) // for POST/PUT
});
```

### Files Using Authentication:
1. `frontend/src/pages/AdminDashboard.jsx` - Admin operations
2. `frontend/src/pages/PatientDashboard.jsx` - Patient profile updates
3. `frontend/src/pages/DoctorDashboard.jsx` - Doctor operations
4. `frontend/src/pages/DatabaseFeatures.jsx` - Admin database features
5. `frontend/src/pages/DoctorProfile.jsx` - Doctor profile updates

---

## 🔒 Security Features

### 1. Password Security
- **Hashing:** bcrypt with 10 salt rounds
- **Validation:** Min 8 chars, uppercase, number required
- **Storage:** Only hashed passwords stored in database

### 2. Token Security
- **Algorithm:** HS256 (HMAC with SHA-256)
- **Expiration:** 24 hours
- **Secret:** Environment variable (JWT_SECRET)
- **Transmission:** Bearer token in Authorization header

### 3. Input Validation
- Email format validation (regex)
- Phone number validation (11 digits)
- Role validation (whitelist)
- SQL injection prevention (parameterized queries)

### 4. Error Handling
- Generic error messages (don't reveal if email exists)
- Proper HTTP status codes:
  - 400: Bad Request (validation errors)
  - 401: Unauthorized (invalid credentials)
  - 403: Forbidden (insufficient permissions)
  - 409: Conflict (duplicate email)
  - 500: Internal Server Error

---

## 🚪 Logout Process

### Frontend Implementation:
```javascript
const handleLogout = () => {
  localStorage.removeItem('user');
  navigate('/login');
};
```

**Note:** JWT tokens are stateless - no server-side logout needed. Token expires after 24 hours.

---

## 🔄 Session Management

### Token Lifecycle:
1. **Creation:** On signup/login
2. **Storage:** localStorage (frontend)
3. **Usage:** Sent with every protected API request
4. **Validation:** Verified by middleware on each request
5. **Expiration:** 24 hours (automatic)
6. **Renewal:** User must login again after expiration

### Session Persistence:
- Token stored in localStorage persists across browser sessions
- User remains logged in until:
  - Token expires (24 hours)
  - User logs out (clears localStorage)
  - User clears browser data

---

## 📋 Authentication Checklist

### Signup
- ✅ Email validation
- ✅ Password strength validation
- ✅ Phone validation
- ✅ Duplicate email check
- ✅ Password hashing (bcrypt)
- ✅ Role-specific table insertion
- ✅ JWT token generation
- ✅ Token returned to client

### Login
- ✅ Email/password validation
- ✅ User lookup
- ✅ Password verification (bcrypt)
- ✅ JWT token generation
- ✅ Token returned to client

### Protected Routes
- ✅ Token verification middleware
- ✅ Role-based access control
- ✅ Proper error responses
- ✅ Token expiration handling

### Frontend
- ✅ Token storage (localStorage)
- ✅ Token sent with requests (Bearer)
- ✅ Logout functionality
- ✅ Role-based UI rendering
- ✅ Redirect on unauthorized

---

## 🛠️ Configuration

### Environment Variables:
```env
JWT_SECRET=your-secret-key-change-in-production
```

### Default Values:
- JWT_SECRET: 'your-secret-key-change-in-production'
- JWT_EXPIRES_IN: '24h'
- BCRYPT_SALT_ROUNDS: 10

---

## 📊 Authentication Flow Diagram

```
┌─────────────┐
│   Signup    │
└──────┬──────┘
       │
       ├─> Validate Input
       ├─> Check Duplicate
       ├─> Hash Password
       ├─> Insert User
       ├─> Insert Role Table
       ├─> Generate JWT
       └─> Return Token + User
              │
              ▼
       ┌──────────────┐
       │ localStorage │
       └──────┬───────┘
              │
              ▼
       ┌──────────────┐
       │ API Requests │
       └──────┬───────┘
              │
              ├─> Authorization: Bearer <token>
              │
              ▼
       ┌──────────────────┐
       │ authenticateToken│
       └──────┬───────────┘
              │
              ├─> Verify JWT
              ├─> Decode User
              └─> Attach to req.user
                     │
                     ▼
              ┌──────────────┐
              │ requireRole  │
              └──────┬───────┘
                     │
                     ├─> Check Role
                     └─> Allow/Deny
```

---

## 🔗 Related Files

### Backend
- `backend/controllers/authController.js` - Signup & Login
- `backend/middleware/auth.js` - Authentication middleware
- `backend/routes/adminRoutes.js` - Admin protected routes
- `backend/routes/auth.js` - General routes with auth

### Frontend
- `frontend/src/pages/Signup.jsx` - Signup page
- `frontend/src/pages/Login.jsx` - Login page
- `frontend/src/pages/AdminDashboard.jsx` - Admin dashboard
- `frontend/src/pages/PatientDashboard.jsx` - Patient dashboard
- `frontend/src/pages/DoctorDashboard.jsx` - Doctor dashboard

---

## 🎯 Best Practices Implemented

1. ✅ Never store plain text passwords
2. ✅ Use strong password requirements
3. ✅ Implement token expiration
4. ✅ Use HTTPS in production (recommended)
5. ✅ Validate all inputs
6. ✅ Use parameterized queries (SQL injection prevention)
7. ✅ Implement role-based access control
8. ✅ Return generic error messages
9. ✅ Use environment variables for secrets
10. ✅ Implement proper HTTP status codes



---

## 🔍 AUTHENTICATION AUDIT RESULTS

### ✅ PROTECTED ROUTES (Properly Secured)

#### Admin Routes (`/api/admin/*`)
- **Protection**: `authenticateToken` + `requireAdmin` middleware applied to ALL routes via `router.use()`
- **Endpoints**: All department, branch, technician, bed, lab test, medicine, analytics, and database features routes
- **Status**: ✅ SECURE

#### Patient-Specific Routes
- `PUT /api/appointments/:id/cancel` - ✅ Protected with `authenticateToken` + `requirePatient`
- `PUT /api/patient/update-profile` - ✅ Protected with `authenticateToken` + `requirePatient`
- `DELETE /api/patient/delete-profile` - ✅ Protected with `authenticateToken` + `requirePatient`

---

### ⚠️ UNPROTECTED ROUTES (Security Gaps Found)

#### 🔴 CRITICAL - Patient Data Access
1. **`GET /api/patient/profile/:email`** - No authentication
   - Exposes patient profile data to anyone with an email
   - **Risk**: Privacy violation, data breach
   - **Fix Needed**: Add `authenticateToken` + verify user owns the profile

2. **`GET /api/patient/:email/appointments`** - No authentication
   - Exposes patient appointment history to anyone
   - **Risk**: Medical privacy violation (HIPAA-like concerns)
   - **Fix Needed**: Add `authenticateToken` + verify user owns the appointments

3. **`GET /api/patient/:email/bed-bookings`** - No authentication
   - Exposes patient bed booking information
   - **Risk**: Privacy violation
   - **Fix Needed**: Add `authenticateToken` + verify user owns the bookings

4. **`GET /api/patient/:email/lab-tests`** - No authentication
   - Exposes patient lab test results and appointments
   - **Risk**: Medical privacy violation
   - **Fix Needed**: Add `authenticateToken` + verify user owns the lab tests

5. **`POST /api/patient-profile`** - No authentication
   - Anyone can create patient profiles
   - **Risk**: Data pollution, fake profiles
   - **Fix Needed**: Add `authenticateToken` + verify user is creating their own profile

#### 🔴 CRITICAL - Doctor Data Access
6. **`GET /api/doctor/profile/:email`** - No authentication
   - Exposes doctor profile data
   - **Risk**: Privacy violation
   - **Note**: Public read might be acceptable for doctor listings

7. **`GET /api/doctor/appointments/:email`** - No authentication
   - Exposes doctor's appointment schedule with patient details
   - **Risk**: Patient privacy violation
   - **Fix Needed**: Add `authenticateToken` + `requireDoctor` + verify doctor owns the appointments

8. **`GET /api/doctor/appointments/:email/today-count`** - No authentication
   - Exposes doctor's schedule information
   - **Risk**: Low, but should still be protected
   - **Fix Needed**: Add `authenticateToken` + `requireDoctor`

9. **`PUT /api/doctor/appointments/:id/complete`** - No authentication
   - Anyone can mark appointments as completed
   - **Risk**: Data integrity violation, appointment manipulation
   - **Fix Needed**: Add `authenticateToken` + `requireDoctor` + verify doctor owns the appointment

10. **`PUT /api/doctor/profile`** - No authentication
    - Anyone can update doctor profiles
    - **Risk**: Profile hijacking, data corruption
    - **Fix Needed**: Add `authenticateToken` + `requireDoctor` + verify doctor owns the profile

11. **`PUT /api/doctor/profile/update`** - No authentication
    - Anyone can update doctor basic info
    - **Risk**: Profile hijacking
    - **Fix Needed**: Add `authenticateToken` + `requireDoctor`

12. **`PUT /api/doctor/license`** - No authentication
    - Anyone can update doctor license numbers
    - **Risk**: Credential fraud, impersonation
    - **Fix Needed**: Add `authenticateToken` + `requireDoctor`

13. **`POST /api/doctor/specialization`** - No authentication
    - Anyone can set doctor specializations
    - **Risk**: Data corruption
    - **Fix Needed**: Add `authenticateToken` + `requireDoctor`

#### 🟡 MEDIUM - Appointment Booking
14. **`GET /api/appointments/available-slots/:doctorId`** - No authentication
    - **Risk**: Low (public information for booking)
    - **Recommendation**: Consider rate limiting to prevent scraping

15. **`POST /api/appointments/book`** - No authentication
    - Anyone can book appointments for any patient email
    - **Risk**: Appointment spam, booking manipulation
    - **Fix Needed**: Add `authenticateToken` + verify user is booking for themselves

#### 🟡 MEDIUM - Doctor Schedule Management
16. **`POST /api/doctor/setup-schedule`** - No authentication
    - Anyone can create doctor schedules
    - **Risk**: Schedule manipulation
    - **Fix Needed**: Add `authenticateToken` + `requireDoctor`

17. **`PUT /api/doctor/update-schedule`** - No authentication
    - Anyone can update doctor schedules
    - **Risk**: Schedule manipulation
    - **Fix Needed**: Add `authenticateToken` + `requireDoctor`

18. **`GET /api/doctor/schedule/:email`** - No authentication
    - **Risk**: Low (might be needed for public booking)
    - **Recommendation**: Consider if this should be public

#### 🟡 MEDIUM - Lab Test & Bed Booking
19. **`POST /api/lab-test-appointments`** - No authentication
    - Anyone can book lab tests for any patient
    - **Risk**: Booking manipulation
    - **Fix Needed**: Add `authenticateToken` + verify user is booking for themselves

20. **`POST /api/bed-bookings`** - No authentication
    - Anyone can book beds for any patient
    - **Risk**: Booking manipulation, resource blocking
    - **Fix Needed**: Add `authenticateToken` + verify user is booking for themselves

21. **`GET /api/beds/available`** - No authentication
    - **Risk**: Low (public information)
    - **Status**: Acceptable as public

#### 🟢 LOW - Public Information Routes
22. **`GET /api/timetable/doctors-by-specialty`** - No authentication
    - **Status**: Acceptable (public doctor directory)

23. **`GET /api/timetable/all-doctors`** - No authentication
    - **Status**: Acceptable (public doctor directory)

24. **`GET /api/timetable/top-doctors`** - No authentication
    - **Status**: Acceptable (public information)

25. **`GET /api/timetable/doctor/:doctorId`** - No authentication
    - **Status**: Acceptable (public doctor profile)

26. **`GET /api/lab-tests`** - No authentication
    - **Status**: Acceptable (public service catalog)

27. **`GET /api/medical-technicians`** - No authentication
    - **Status**: Acceptable (public information for booking)

#### 🔴 CRITICAL - Prescription Routes (ALL UNPROTECTED)
28. **`GET /api/prescriptions/medicines`** - No authentication
    - **Status**: Acceptable (medicine catalog)

29. **`POST /api/prescriptions`** - No authentication
    - Anyone can create prescriptions
    - **Risk**: Medical fraud, prescription forgery
    - **Fix Needed**: Add `authenticateToken` + `requireDoctor` + verify doctor owns the appointment

30. **`GET /api/prescriptions/appointment/:appointmentId`** - No authentication
    - Exposes prescription data
    - **Risk**: Medical privacy violation
    - **Fix Needed**: Add `authenticateToken` + verify user is patient or doctor for that appointment

31. **`GET /api/prescriptions/:id`** - No authentication
    - Exposes prescription data
    - **Risk**: Medical privacy violation
    - **Fix Needed**: Add `authenticateToken` + verify user is patient or doctor for that prescription

32. **`PUT /api/prescriptions/:id`** - No authentication
    - Anyone can update prescriptions
    - **Risk**: Medical fraud, prescription tampering
    - **Fix Needed**: Add `authenticateToken` + `requireDoctor` + verify doctor owns the prescription

33. **`DELETE /api/prescriptions/:id`** - No authentication
    - Anyone can delete prescriptions
    - **Risk**: Data loss, medical record tampering
    - **Fix Needed**: Add `authenticateToken` + `requireDoctor` + verify doctor owns the prescription

---

### 📊 AUDIT SUMMARY

- **Total Routes Audited**: 33+
- **Properly Protected**: 3 patient routes + all admin routes (~20 routes)
- **Critical Security Gaps**: 20 routes
- **Medium Risk**: 6 routes
- **Acceptable Public**: 7 routes

### 🚨 PRIORITY FIXES NEEDED

1. **IMMEDIATE**: Protect all prescription routes (medical fraud risk)
2. **IMMEDIATE**: Protect doctor appointment completion and profile updates
3. **HIGH**: Protect patient data access routes (privacy violations)
4. **HIGH**: Protect booking routes to prevent spam and manipulation
5. **MEDIUM**: Protect doctor schedule management routes

---

## ⚠️ SECURITY RECOMMENDATIONS

### 1. Add Authentication to Critical Routes
Update `backend/routes/auth.js` to add middleware:
```javascript
// Patient routes - verify ownership
router.get("/patient/profile/:email", authenticateToken, requirePatient, ...);
router.get("/patient/:email/appointments", authenticateToken, requirePatient, ...);

// Doctor routes - verify ownership
router.get("/doctor/appointments/:email", authenticateToken, requireDoctor, ...);
router.put("/doctor/appointments/:id/complete", authenticateToken, requireDoctor, ...);
router.put("/doctor/profile", authenticateToken, requireDoctor, ...);

// Prescription routes - doctor only
router.post("/prescriptions", authenticateToken, requireDoctor, ...);
router.put("/prescriptions/:id", authenticateToken, requireDoctor, ...);
router.delete("/prescriptions/:id", authenticateToken, requireDoctor, ...);
```

### 2. Add Ownership Verification
Create middleware to verify users can only access their own data:
```javascript
// middleware/verifyOwnership.js
exports.verifyPatientOwnership = async (req, res, next) => {
  const { email } = req.params;
  if (req.user.email !== email) {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
};
```

### 3. Implement Rate Limiting
Add rate limiting to prevent abuse:
```javascript
const rateLimit = require('express-rate-limit');

const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // limit each IP to 5 requests per windowMs
});

router.post('/appointments/book', bookingLimiter, ...);
```

### 4. Add Request Logging
Log all sensitive operations for audit trail:
```javascript
const logSensitiveOperation = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - User: ${req.user?.email}`);
  next();
};
```

### 5. Frontend Route Guards
Ensure frontend redirects unauthenticated users:
```javascript
// Check in useEffect
useEffect(() => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || !user.token) {
    navigate('/login');
  }
}, []);
```

---

## 🎯 CONCLUSION

The authentication system has a solid foundation with JWT tokens, bcrypt password hashing, and role-based access control. However, **many critical routes are currently unprotected**, exposing sensitive patient and doctor data. The admin routes are properly secured, but patient, doctor, and prescription routes need immediate attention to prevent privacy violations and data manipulation.
