# Database Features Usage Guide

## Overview
All database triggers, functions, and procedures are now integrated into the frontend application.

## How to Access

1. **Login as Admin**: http://localhost:5173/login
2. **Go to Admin Dashboard**: http://localhost:5173/admin/dashboard
3. **Click "🔧 DB Features" button** in the header

## Features Demonstrated

### 📊 Functions Tab (Overview)

Shows real-time statistics calculated using Oracle database functions:

#### 1. fn_get_doctor_appointment_count
- **Purpose**: Counts total appointments for each doctor
- **Display**: Table showing top 10 doctors by appointment count
- **Usage**: Automatically called when page loads

#### 2. fn_calculate_bed_occupancy
- **Purpose**: Calculates bed occupancy percentage for each branch
- **Display**: Table showing all branches with color-coded occupancy rates
  - 🔴 Red: > 80% (High occupancy)
  - 🟡 Orange: 50-80% (Medium occupancy)
  - 🟢 Green: < 50% (Low occupancy)
- **Usage**: Automatically called when page loads

#### 3. fn_get_patient_total_expenses
- **Purpose**: Calculates total medical expenses for each patient
- **Display**: Table showing top 10 patients by total expenses
- **Usage**: Automatically called when page loads

### ⚙️ Procedures Tab

Interactive forms to test stored procedures:

#### 1. sp_book_appointment
- **Purpose**: Books appointment with comprehensive validation
- **Validations**:
  - Time slot exists and belongs to doctor
  - Time slot is available
  - No duplicate appointments
- **Form Fields**:
  - Patient ID
  - Doctor ID
  - Appointment Date
  - Time Slot ID
  - Appointment Type (consultation/follow-up/emergency)
- **Result**: Returns new appointment ID on success

#### 2. sp_generate_bill
- **Purpose**: Generates comprehensive bill for an appointment
- **Calculations**:
  - Consultation fee (input)
  - Medicine costs (from prescriptions)
  - Lab test costs (from lab appointments)
  - Total = consultation + medicines + tests
- **Form Fields**:
  - Appointment ID
  - Consultation Fee
- **Result**: Returns new bill ID with total amount

#### 3. sp_update_medicine_stock
- **Purpose**: Updates medicine inventory after dispensing
- **Validations**:
  - Checks sufficient stock available
  - Prevents negative inventory
- **Form Fields**:
  - Medicine ID
  - Quantity to Deduct
- **Result**: Updates stock quantity

### ⚡ Triggers Tab

Information about automatic database triggers:

#### 1. Auto-Update Timestamps
- **Triggers**: 
  - trg_update_medicines_timestamp
  - trg_update_labtests_timestamp
  - trg_update_beds_timestamp
- **Event**: BEFORE UPDATE
- **Action**: Sets UPDATED_AT to current timestamp
- **Tables**: MEDICINES, LAB_TESTS, HOSPITAL_BEDS
- **Demo**: Update any medicine/test/bed to see timestamp change

#### 2. Validate Bed Booking
- **Trigger**: trg_validate_bed_booking
- **Event**: BEFORE INSERT on BED_BOOKING_APPOINTMENTS
- **Action**: Validates bed is available before booking
- **Demo**: Try booking an occupied bed - will fail with error

#### 3. Auto-Update Bed Status
- **Trigger**: trg_update_bed_status_on_booking
- **Event**: AFTER INSERT on BED_BOOKING_APPOINTMENTS
- **Action**: Marks bed as 'occupied' automatically
- **Demo**: Book a bed and check its status changes to occupied

#### 4. Validate Medicine Stock
- **Trigger**: trg_validate_medicine_stock
- **Event**: BEFORE INSERT on PRESCRIBED_MED
- **Action**: Prevents prescribing out-of-stock medicines
- **Demo**: Try prescribing medicine with 0 stock - will fail

## API Endpoints

All features are accessible via REST API:

### Functions
```
GET /api/admin/db-features/stats
GET /api/admin/db-features/doctor/:doctorId/appointments
GET /api/admin/db-features/branch/:branchId/occupancy
GET /api/admin/db-features/patient/:patientId/expenses
```

### Procedures
```
POST /api/admin/db-features/book-appointment
POST /api/admin/db-features/generate-bill
POST /api/admin/db-features/update-stock
```

## Testing Scenarios

### Test Function: Doctor Appointment Count
1. Go to "Functions Overview" tab
2. View "Top Doctors by Appointments" table
3. Numbers are calculated in real-time using fn_get_doctor_appointment_count

### Test Function: Bed Occupancy
1. Go to "Functions Overview" tab
2. View "Branch Bed Occupancy Rates" table
3. Percentages calculated using fn_calculate_bed_occupancy
4. Color coding shows occupancy levels

### Test Function: Patient Expenses
1. Go to "Functions Overview" tab
2. View "Top Patients by Medical Expenses" table
3. Totals calculated using fn_get_patient_total_expenses

### Test Procedure: Book Appointment
1. Go to "Procedures" tab
2. Fill in the "Book Appointment" form:
   - Patient ID: 1
   - Doctor ID: 1
   - Date: Select future date
   - Time Slot ID: 1
   - Type: consultation
3. Click "Book Appointment"
4. Success: Shows appointment ID
5. Failure: Shows validation error (e.g., "Time slot not available")

### Test Procedure: Generate Bill
1. Go to "Procedures" tab
2. Fill in the "Generate Bill" form:
   - Appointment ID: (use existing appointment)
   - Consultation Fee: 500
3. Click "Generate Bill"
4. Success: Shows bill ID with calculated total
5. Total includes: consultation + medicines + tests

### Test Procedure: Update Stock
1. Go to "Procedures" tab
2. Fill in the "Update Medicine Stock" form:
   - Medicine ID: 1
   - Quantity: 5
3. Click "Update Stock"
4. Success: Stock reduced by 5
5. Failure: "Insufficient stock" if quantity > available

### Test Trigger: Auto-Update Timestamp
1. Go to Medicines management
2. Update any medicine
3. Check UPDATED_AT field - automatically updated

### Test Trigger: Validate Bed Booking
1. Try booking a bed that's already occupied
2. Trigger prevents the booking
3. Error: "Bed is not available for booking"

### Test Trigger: Auto-Update Bed Status
1. Book an available bed
2. Bed status automatically changes to 'occupied'
3. No manual update needed

### Test Trigger: Validate Medicine Stock
1. Set medicine stock to 0
2. Try prescribing that medicine
3. Trigger prevents prescription
4. Error: "Medicine is out of stock"

## Backend Implementation

### Controller: databaseFeaturesController.js
- getDoctorAppointmentCount
- getBedOccupancyRate
- getPatientTotalExpenses
- bookAppointmentWithProcedure
- generateBill
- updateMedicineStock
- getDatabaseFeaturesStats (combines all functions)

### Routes: adminRoutes.js
All routes require JWT authentication and admin role

## Database Features Summary

### ✅ Triggers (4)
1. Auto-update timestamps (3 triggers)
2. Validate bed booking
3. Auto-update bed status
4. Validate medicine stock

### ✅ Functions (3)
1. Get doctor appointment count
2. Calculate bed occupancy
3. Get patient total expenses

### ✅ Procedures (3)
1. Book appointment with validation
2. Generate comprehensive bill
3. Update medicine stock

### ✅ Complex Queries (5)
1. Department statistics
2. Branch resource allocation
3. Top doctors by performance
4. Medicine usage analysis
5. Patient treatment summary

## All Features Are Used

✅ **Every trigger** is automatically activated on database operations
✅ **Every function** is called in the Database Features page
✅ **Every procedure** has a form in the Database Features page
✅ **Every complex query** is accessible via Analytics endpoints

## Quick Access

- **Database Features Page**: http://localhost:5173/admin/database-features
- **Admin Dashboard**: http://localhost:5173/admin/dashboard
- **Backend API**: http://localhost:3000/api/admin/db-features/*

## Notes

- All features require admin authentication
- JWT token must be valid (24-hour expiration)
- Database features must be installed first (run database_features.sql)
- Triggers work automatically - no frontend action needed
- Functions and procedures are called via API endpoints
