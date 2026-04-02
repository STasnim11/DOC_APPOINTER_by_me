# Backend Implementation Guide

## Overview
This backend implementation follows database best practices with JWT authentication, explicit transaction control, and complex queries for analytics.

## Authentication System

### JWT-Based Authentication
- All authentication is handled internally (no third-party services)
- JWT tokens are generated on login and expire after 24 hours
- Tokens must be included in the `Authorization` header as `Bearer <token>`

### Middleware
- `authenticateToken`: Verifies JWT token on every request
- `requireAdmin`: Ensures user has admin privileges
- `requireDoctor`: Ensures user has doctor privileges
- `requirePatient`: Ensures user has patient privileges

### Usage Example
```javascript
// Login
POST /api/login
Body: { "email": "admin@hospital.com", "pass": "Password123" }
Response: { "token": "eyJhbGc...", "user": {...} }

// Protected Route
GET /api/admin/departments
Headers: { "Authorization": "Bearer eyJhbGc..." }
```

## Transaction Control

### Explicit Transaction Management
All DML operations (INSERT, UPDATE, DELETE) use explicit transaction control:

```javascript
// Start transaction
await connection.execute('BEGIN NULL; END;');

try {
  // Perform operations
  await connection.execute('INSERT INTO ...');
  await connection.execute('UPDATE ...');
  
  // Commit on success
  await connection.commit();
} catch (err) {
  // Rollback on failure
  await connection.rollback();
  throw err;
}
```

### Example: Adding Branch Contact
```javascript
// Validates branch exists
// Inserts contact
// Commits or rolls back based on success
```

## Complex Queries

### 1. Department Statistics
**Endpoint**: `GET /api/admin/analytics/department-statistics`

Retrieves department-wise statistics including:
- Total doctors and technicians
- Average experience years
- Total appointments

**Query Features**:
- Joins 4 tables (DEPARTMENTS, DOCTOR, MEDICAL_TECHNICIAN, DOCTORS_APPOINTMENTS)
- Uses COUNT DISTINCT and AVG aggregation
- Groups by department

### 2. Branch Resource Allocation
**Endpoint**: `GET /api/admin/analytics/branch-allocation`

Analyzes resource distribution across branches:
- Staff count (doctors, technicians)
- Bed availability and occupancy rate
- Contact information

**Query Features**:
- Joins 5 tables
- Calculates bed occupancy percentage
- Uses NULLIF to prevent division by zero

### 3. Top Doctors
**Endpoint**: `GET /api/admin/analytics/top-doctors`

Ranks doctors by performance:
- Total appointments and prescriptions
- Medicines prescribed
- Average medicines per prescription

**Query Features**:
- Joins 7 tables
- Multiple COUNT DISTINCT aggregations
- HAVING clause for filtering
- FETCH FIRST for top 10

### 4. Medicine Usage Analysis
**Endpoint**: `GET /api/admin/analytics/medicine-usage`

Analyzes medicine inventory and usage:
- Times prescribed
- Stock status (Critical/Low/Medium/Adequate)
- Total value prescribed

**Query Features**:
- CASE statement for stock categorization
- Multiple aggregations
- Calculated fields

### 5. Patient Treatment Summary
**Endpoint**: `GET /api/admin/analytics/patient-summary`

Comprehensive patient history:
- Appointments, prescriptions, lab tests
- Unique medicines received
- Bed bookings
- Last appointment date

**Query Features**:
- Joins 6 tables
- Multiple COUNT DISTINCT
- MAX for latest date
- FETCH FIRST for top 20

## Database Features

### Triggers

#### 1. Auto-Update Timestamps
```sql
CREATE OR REPLACE TRIGGER trg_update_medicines_timestamp
BEFORE UPDATE ON MEDICINES
FOR EACH ROW
BEGIN
  :NEW.UPDATED_AT := CURRENT_TIMESTAMP;
END;
```
**Purpose**: Automatically updates timestamp when records are modified

#### 2. Validate Bed Booking
```sql
CREATE OR REPLACE TRIGGER trg_validate_bed_booking
BEFORE INSERT ON BED_BOOKING_APPOINTMENTS
```
**Purpose**: Ensures bed is available before allowing booking

#### 3. Update Bed Status
```sql
CREATE OR REPLACE TRIGGER trg_update_bed_status_on_booking
AFTER INSERT ON BED_BOOKING_APPOINTMENTS
```
**Purpose**: Automatically marks bed as occupied when booked

#### 4. Validate Medicine Stock
```sql
CREATE OR REPLACE TRIGGER trg_validate_medicine_stock
BEFORE INSERT ON PRESCRIBED_MED
```
**Purpose**: Prevents prescribing out-of-stock medicines

### Functions

#### 1. Get Doctor Appointment Count
```sql
fn_get_doctor_appointment_count(p_doctor_id)
```
**Returns**: Total appointments for a doctor

#### 2. Calculate Bed Occupancy
```sql
fn_calculate_bed_occupancy(p_branch_id)
```
**Returns**: Bed occupancy percentage for a branch

#### 3. Get Patient Total Expenses
```sql
fn_get_patient_total_expenses(p_patient_id)
```
**Returns**: Total medical expenses for a patient

### Procedures

#### 1. Book Appointment
```sql
sp_book_appointment(
  p_patient_id, p_doctor_id, p_appointment_date, 
  p_time_slot_id, p_appointment_type, p_appointment_id OUT
)
```
**Purpose**: Books appointment with validation
- Validates time slot availability
- Checks for duplicates
- Returns appointment ID

#### 2. Generate Bill
```sql
sp_generate_bill(
  p_admin_id, p_appointment_id, 
  p_consultation_fee, p_bill_id OUT
)
```
**Purpose**: Generates comprehensive bill
- Calculates medicine costs
- Includes lab test fees
- Returns bill ID

#### 3. Update Medicine Stock
```sql
sp_update_medicine_stock(p_medication_id, p_quantity)
```
**Purpose**: Updates stock after dispensing
- Validates sufficient stock
- Decrements quantity

## API Endpoints

### Admin Routes (All require authentication + admin role)

#### Branch Contacts
- `GET /api/admin/branch-contacts` - List all
- `POST /api/admin/branch-contacts` - Add new
- `PUT /api/admin/branch-contacts/:id` - Update
- `DELETE /api/admin/branch-contacts/:id` - Delete

#### Hospital Branches
- `GET /api/admin/hospital-branches` - List all
- `POST /api/admin/hospital-branches` - Add new
- `PUT /api/admin/hospital-branches/:id` - Update
- `DELETE /api/admin/hospital-branches/:id` - Delete

#### Medical Technicians
- `GET /api/admin/medical-technicians` - List all
- `POST /api/admin/medical-technicians` - Add new
- `PUT /api/admin/medical-technicians/:id` - Update
- `DELETE /api/admin/medical-technicians/:id` - Delete

#### Departments
- `GET /api/admin/departments` - List all
- `POST /api/admin/departments` - Add new
- `PUT /api/admin/departments/:id` - Update
- `DELETE /api/admin/departments/:id` - Delete

#### Analytics (Complex Queries)
- `GET /api/admin/analytics/department-statistics`
- `GET /api/admin/analytics/branch-allocation`
- `GET /api/admin/analytics/top-doctors`
- `GET /api/admin/analytics/medicine-usage`
- `GET /api/admin/analytics/patient-summary`

#### Existing Modules
- Beds: `/api/admin/beds`
- Lab Tests: `/api/admin/lab-tests`
- Medicines: `/api/admin/medicines`

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
Create `.env` file:
```
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_CONNECTION_STRING=your_connection_string
JWT_SECRET=your-secret-key-change-in-production
```

### 3. Run Database Features
```bash
sqlplus username/password@database < database_features.sql
```

### 4. Start Server
```bash
node server.js
```

## Security Features

1. **Password Hashing**: bcrypt with salt rounds
2. **JWT Tokens**: Signed with secret key, 24-hour expiration
3. **Route Protection**: Middleware checks authentication on every request
4. **Role-Based Access**: Admin, Doctor, Patient roles enforced
5. **SQL Injection Prevention**: Parameterized queries
6. **Transaction Rollback**: Automatic rollback on errors

## Error Handling

All controllers implement try-catch-finally:
```javascript
try {
  // Operations
  await connection.commit();
} catch (err) {
  await connection.rollback();
  res.status(500).json({ error: 'Operation failed' });
} finally {
  if (connection) await connection.close();
}
```

## Testing

### Login Test
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hospital.com","pass":"Password123"}'
```

### Protected Route Test
```bash
curl -X GET http://localhost:3000/api/admin/departments \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Analytics Test
```bash
curl -X GET http://localhost:3000/api/admin/analytics/top-doctors \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Best Practices Implemented

1. ✅ JWT authentication (no third-party services)
2. ✅ Authentication check on every request
3. ✅ Explicit transaction control (COMMIT/ROLLBACK)
4. ✅ 5+ complex queries with multiple table joins
5. ✅ Appropriate use of triggers (validation, auto-updates)
6. ✅ Functions for calculations
7. ✅ Procedures for complex operations
8. ✅ Proper error handling
9. ✅ Connection management (close in finally)
10. ✅ Input validation
