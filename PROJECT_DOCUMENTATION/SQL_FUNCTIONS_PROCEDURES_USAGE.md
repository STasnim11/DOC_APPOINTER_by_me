# SQL Functions & Procedures - Active Usage in DOCAPPOINTER

## Overview
This document shows where SQL stored functions and procedures are actively used and visible in the application.

---

## ✅ IMPLEMENTED & VISIBLE

### STORED PROCEDURES (2 Active)

### 1. **sp_book_appointment** (SQL Procedure)
**Purpose:** Book appointment with validation (validates doctor availability and time slot)

**Where Used:**
- **Patient Dashboard - Book Appointment** (`backend/controllers/appointmentController.js`)
  - Used when patients book appointments with doctors
  - Validates time slot availability
  - Prevents double booking
  - Returns appointment ID
  - **Replaces manual INSERT with stored procedure validation**

**Backend API:**
- `POST /api/appointments/book`
- Controller: `backend/controllers/appointmentController.js` (line ~70)

**SQL:**
```sql
BEGIN
  sp_book_appointment(
    :patientId, :doctorId, :appointmentDate,
    :timeSlotId, :appointmentType, :appointmentId
  );
END;
```

---

### 2. **sp_update_medicine_stock** (SQL Procedure)
**Purpose:** Update medicine stock after prescription

**Where Used:**
- **Doctor Dashboard - Write Prescription** (`backend/controllers/prescriptionController.js`)
  - Automatically called when doctor prescribes medicine
  - Deducts 1 unit from medicine stock
  - Runs for each medicine in prescription
  - **Automatic stock management via stored procedure**

**Backend API:**
- `POST /api/prescriptions` (internally calls procedure)
- Controller: `backend/controllers/prescriptionController.js` (line ~175)

**SQL:**
```sql
BEGIN
  sp_update_medicine_stock(:medicationId, :quantity);
END;
```

---

### STORED FUNCTIONS (3 Active)

### 1. **fn_get_doctor_appointment_count** (SQL Function)
**Purpose:** Calculate total appointments for a doctor

**Where Used:**
- **Doctor Dashboard** (`frontend/src/pages/DoctorDashboard.jsx`)
  - Displays "Total Appointments" badge in the appointments header
  - Shows next to "Today's Patients" count
  - Updates when doctor profile loads
  - **Visual**: Purple gradient badge with 📈 icon

- **Admin Analytics** (`frontend/src/pages/AdminDashboard.jsx`)
  - Shows "Top Doctors by Appointments" table
  - Lists top 10 doctors sorted by appointment count
  - **Visual**: Table with doctor names and appointment counts

**Backend API:**
- `GET /api/admin/db-features/doctor/:doctorId/appointments`
- Controller: `backend/controllers/databaseFeaturesController.js`

**SQL:**
```sql
SELECT fn_get_doctor_appointment_count(:doctorId) FROM DUAL
```

---

### 2. **fn_calculate_bed_occupancy** (SQL Function)
**Purpose:** Calculate bed occupancy rate for a hospital branch

**Where Used:**
- **Admin Analytics** (`frontend/src/pages/AdminDashboard.jsx`)
  - Shows "Branch Bed Occupancy Rates" table
  - Color-coded badges:
    - 🔴 Red (>80%): High occupancy
    - 🟡 Yellow (50-80%): Medium occupancy
    - 🟢 Green (<50%): Low occupancy
  - **Visual**: Table with branch names and percentage badges

**Backend API:**
- `GET /api/admin/db-features/stats`
- Controller: `backend/controllers/databaseFeaturesController.js`

**SQL:**
```sql
SELECT fn_calculate_bed_occupancy(:branchId) FROM DUAL
```

---

### 3. **fn_get_patient_total_expenses** (SQL Function)
**Purpose:** Calculate patient's total medical expenses

**Where Used:**
- **Admin Analytics** (`frontend/src/pages/AdminDashboard.jsx`)
  - Shows "Top Patients by Total Expenses" table
  - Lists top 10 patients with highest expenses
  - **Visual**: Table with patient names and expense amounts in ₹

**Backend API:**
- `GET /api/admin/db-features/stats`
- Controller: `backend/controllers/databaseFeaturesController.js`

**SQL:**
```sql
SELECT fn_get_patient_total_expenses(:patientId) FROM DUAL
```

---

## 📊 HOW TO ACCESS THESE FEATURES

### For Doctors:
1. Login as doctor
2. Go to "My Appointments" section
3. See **"Total Appointments"** badge (uses SQL function)

### For Admins:
1. Login as admin
2. Click **"Analytics & Reports"** in the sidebar (📊 icon)
3. View three sections:
   - 🏆 Top Doctors by Appointments
   - 🏥 Branch Bed Occupancy Rates
   - 💰 Top Patients by Total Expenses

---

## 🔧 STORED PROCEDURES (Available but not in UI)

### 3. **sp_generate_bill**
**Purpose:** Generate bill for appointment
**Status:** ⚠️ API endpoint exists but not used in frontend
**Endpoint:** `POST /api/admin/db-features/generate-bill`

---

## ⚡ TRIGGERS (Automatically Active)

### 1. **trg_update_medicines_timestamp**
- Auto-updates UPDATED_AT when MEDICINES table is modified
- **Active**: Yes (runs automatically)

### 2. **trg_update_labtests_timestamp**
- Auto-updates UPDATED_AT when LAB_TESTS table is modified
- **Active**: Yes (runs automatically)

### 3. **trg_update_beds_timestamp**
- Auto-updates UPDATED_AT when HOSPITAL_BEDS table is modified
- **Active**: Yes (runs automatically)

### 4. **trg_validate_bed_booking**
- Validates bed is available before booking
- **Active**: Yes (runs automatically)

### 5. **trg_update_bed_status_on_booking**
- Auto-updates bed status to 'occupied' when booked
- **Active**: Yes (runs automatically)

### 6. **trg_validate_medicine_stock**
- Validates medicine stock before prescription
- **Active**: Yes (runs automatically)

---

## 📁 FILE LOCATIONS

### Frontend:
- `frontend/src/pages/DoctorDashboard.jsx` - Doctor appointment count display
- `frontend/src/pages/AdminDashboard.jsx` - Analytics module with all 3 functions

### Backend:
- `backend/controllers/databaseFeaturesController.js` - All function/procedure APIs
- `backend/routes/adminRoutes.js` - Routes for `/api/admin/db-features/*`
- `sql/database_features.sql` - SQL definitions for all functions, procedures, triggers

---

## 🎯 DEMONSTRATION POINTS

When presenting your project, highlight:

1. **Appointment Booking (Stored Procedure)**
   - When patient books appointment
   - Explain it uses `sp_book_appointment` procedure
   - Mention it validates availability and prevents double booking

2. **Prescription Creation (Stored Procedure)**
   - When doctor writes prescription
   - Explain it uses `sp_update_medicine_stock` procedure
   - Mention it automatically updates medicine inventory

3. **Doctor Dashboard (SQL Function)**
   - Point to "Total Appointments" badge
   - Explain it uses SQL function `fn_get_doctor_appointment_count`
   - Show it updates in real-time

4. **Admin Analytics (SQL Functions)**
   - Navigate to Analytics & Reports module
   - Show three tables using three different SQL functions
   - Explain color-coding for occupancy rates
   - Mention triggers running in background

5. **Database Features**
   - Explain triggers auto-update timestamps
   - Mention bed booking validation trigger
   - Show medicine stock validation

---

## 💡 WHY THIS APPROACH?

- **Functions**: Used for calculations and reporting (read-only)
- **Procedures**: Used for complex operations with validation (write operations)
- **Triggers**: Used for automatic data integrity and validation

All SQL features (3 functions + 2 procedures + 6 triggers) are actively used in your application!
