# DOCAPPOINTER - Database Features Documentation

## Overview
This document lists all SQL functions, procedures, triggers, and complex queries used in the DOCAPPOINTER project.

---

## 📊 STORED FUNCTIONS (3)

### 1. fn_get_doctor_appointment_count
**Purpose:** Calculate total appointments for a doctor  
**Parameters:** `p_doctor_id IN NUMBER`  
**Returns:** `NUMBER`  
**Usage:**
```sql
SELECT fn_get_doctor_appointment_count(1) FROM DUAL;
```
**Location:** `backend/database_features.sql` (Lines 95-108)

---

### 2. fn_calculate_bed_occupancy
**Purpose:** Calculate bed occupancy rate for a branch  
**Parameters:** `p_branch_id IN NUMBER`  
**Returns:** `NUMBER` (percentage)  
**Usage:**
```sql
SELECT fn_calculate_bed_occupancy(1) FROM DUAL;
```
**Location:** `backend/database_features.sql` (Lines 113-139)

---

### 3. fn_get_patient_total_expenses
**Purpose:** Get patient's total medical expenses  
**Parameters:** `p_patient_id IN NUMBER`  
**Returns:** `NUMBER`  
**Usage:**
```sql
SELECT fn_get_patient_total_expenses(1) FROM DUAL;
```
**Location:** `backend/database_features.sql` (Lines 142-158)

---

## 🔧 STORED PROCEDURES (3)

### 1. sp_book_appointment
**Purpose:** Book appointment with validation (validates doctor availability and time slot)  
**Parameters:**
- `p_patient_id IN NUMBER`
- `p_doctor_id IN NUMBER`
- `p_appointment_date IN DATE`
- `p_time_slot_id IN NUMBER`
- `p_appointment_type IN VARCHAR2`
- `p_appointment_id OUT NUMBER`

**Usage:**
```sql
DECLARE
  v_appointment_id NUMBER;
BEGIN
  sp_book_appointment(1, 1, SYSDATE, 1, 'consultation', v_appointment_id);
  DBMS_OUTPUT.PUT_LINE('Appointment ID: ' || v_appointment_id);
END;
```
**Location:** `backend/database_features.sql` (Lines 162-211)

---

### 2. sp_generate_bill
**Purpose:** Generate bill for appointment (includes consultation, medicine, and test costs)  
**Parameters:**
- `p_admin_id IN NUMBER`
- `p_appointment_id IN NUMBER`
- `p_consultation_fee IN NUMBER`
- `p_bill_id OUT NUMBER`

**Usage:**
```sql
DECLARE
  v_bill_id NUMBER;
BEGIN
  sp_generate_bill(1, 1, 500, v_bill_id);
  DBMS_OUTPUT.PUT_LINE('Bill ID: ' || v_bill_id);
END;
```
**Location:** `backend/database_features.sql` (Lines 214-260)

---

### 3. sp_update_medicine_stock
**Purpose:** Update medicine stock after prescription  
**Parameters:**
- `p_medication_id IN NUMBER`
- `p_quantity IN NUMBER`

**Location:** `backend/database_features.sql` (Lines 263-282)

---

## ⚡ TRIGGERS (7)

### 1. trg_update_medicines_timestamp
**Purpose:** Auto-update timestamp on MEDICINES table modification  
**Fires:** BEFORE UPDATE ON MEDICINES  
**Location:** `backend/database_features.sql` (Lines 7-13)

---

### 2. trg_update_labtests_timestamp
**Purpose:** Auto-update timestamp on LAB_TESTS table modification  
**Fires:** BEFORE UPDATE ON LAB_TESTS  
**Location:** `backend/database_features.sql` (Lines 15-21)

---

### 3. trg_update_beds_timestamp
**Purpose:** Auto-update timestamp on HOSPITAL_BEDS table modification  
**Fires:** BEFORE UPDATE ON HOSPITAL_BEDS  
**Location:** `backend/database_features.sql` (Lines 23-29)

---

### 4. trg_validate_bed_booking
**Purpose:** Validate bed booking before insert (ensures bed is available)  
**Fires:** BEFORE INSERT ON BED_BOOKING_APPOINTMENTS  
**Location:** `backend/database_features.sql` (Lines 31-56)

---

### 5. trg_update_bed_status_on_booking
**Purpose:** Auto-update bed status to 'occupied' when booked  
**Fires:** AFTER INSERT ON BED_BOOKING_APPOINTMENTS  
**Location:** `backend/database_features.sql` (Lines 58-66)

---

### 6. trg_validate_medicine_stock
**Purpose:** Validate medicine stock before prescription  
**Fires:** BEFORE INSERT ON PRESCRIBED_MED  
**Location:** `backend/database_features.sql` (Lines 68-92)

---

## 🔍 COMPLEX QUERIES BY MODULE

### Patient Profile Module
**File:** `backend/controllers/patientProfileUpdate.js`

**Query 1: Get Patient Profile with User Data**
```sql
SELECT u.ID, u.NAME, u.EMAIL, u.PHONE, u.ROLE,
       p.DATE_OF_BIRTH, p.GENDER, p.OCCUPATION, p.BLOOD_TYPE, 
       p.MARITAL_STATUS, p.ADDRESS
FROM USERS u
LEFT JOIN PATIENT p ON u.ID = p.USER_ID
WHERE TRIM(LOWER(u.EMAIL)) = TRIM(LOWER(:email))
  AND TRIM(UPPER(u.ROLE)) = 'PATIENT'
```
**Purpose:** Fetch complete patient profile with user information

---

### Prescription Module
**File:** `backend/controllers/prescriptionController.js`

**Query 1: Get Prescription with Patient and Doctor Details**
```sql
SELECT 
  p.ID, p.DIAGNOSIS, p.SYMPTOMS, p.HISTORY, p.INSTRUCTIONS, 
  p.VISIT_AGAIN_AT, p.CREATED_AT,
  u.NAME as PATIENT_NAME, u.EMAIL as PATIENT_EMAIL,
  du.NAME as DOCTOR_NAME
FROM PRESCRIPTION p
JOIN DOCTORS_APPOINTMENTS da ON p.APPOINTMENT_ID = da.ID
JOIN PATIENT pat ON da.PATIENT_ID = pat.ID
JOIN USERS u ON pat.USER_ID = u.ID
JOIN DOCTOR doc ON da.DOCTOR_ID = doc.ID
JOIN USERS du ON doc.USER_ID = du.ID
WHERE p.APPOINTMENT_ID = :appointmentId
```
**Purpose:** Fetch prescription with related patient and doctor information

**Query 2: Get Prescribed Medicines**
```sql
SELECT 
  pm.id, pm.medication_id, pm.dosage, pm.frequency, pm.duration,
  m.name, m.description, m.manufacturer, m.price, m.category
FROM PRESCRIBED_MED pm
JOIN medicines m ON pm.MEDICATION_ID = m.id
WHERE pm.PRESCRIPTION_ID = :prescriptionId
```
**Purpose:** Fetch all medicines prescribed in a prescription

---

### Doctor Profile Module
**File:** `backend/controllers/doctorProfileUpdate.js`

**Query 1: Get Doctor Specializations**
```sql
SELECT s.ID, s.NAME
FROM DOC_SPECIALIZATION ds
JOIN SPECIALIZATION s ON ds.SPECIALIZATION_ID = s.ID
WHERE ds.DOCTOR_ID = :doctorId
```
**Purpose:** Fetch all specializations for a doctor

**Query 2: Get Doctor Appointments with Patient Details**
```sql
SELECT da.ID, da.APPOINTMENT_DATE, da.STATUS, da.TYPE,
       da.START_TIME, da.END_TIME, 
       pu.NAME as PATIENT_NAME, 
       pu.PHONE as PATIENT_PHONE, 
       pu.EMAIL as PATIENT_EMAIL
FROM DOCTORS_APPOINTMENTS da
JOIN PATIENT p ON da.PATIENT_ID = p.ID
JOIN USERS pu ON p.USER_ID = pu.ID
WHERE da.DOCTOR_ID = :doctorId
ORDER BY da.APPOINTMENT_DATE DESC
```
**Purpose:** Fetch all appointments for a doctor with patient information

---

### Bed Booking Module
**File:** `backend/controllers/bedBookingController.js`

**Query 1: Get All Bed Bookings with Complete Details**
```sql
SELECT 
  bba.ID, bba.STATUS, bba.CREATED_AT,
  hb.BED_NUMBER, hb.WARD_NAME, hb.BED_TYPE, 
  hb.PRICE_PER_DAY, hb.FLOOR_NUMBER,
  da.APPOINTMENT_DATE, da.START_TIME, da.END_TIME,
  du.NAME as DOCTOR_NAME,
  pu.NAME as PATIENT_NAME,
  pu.EMAIL as PATIENT_EMAIL
FROM BED_BOOKING_APPOINTMENTS bba
JOIN HOSPITAL_BEDS hb ON bba.BED_ID = hb.ID
JOIN DOCTORS_APPOINTMENTS da ON bba.DOCTOR_APPOINTMENT_ID = da.ID
JOIN DOCTOR d ON da.DOCTOR_ID = d.ID
JOIN USERS du ON d.USER_ID = du.ID
JOIN PATIENT p ON da.PATIENT_ID = p.ID
JOIN USERS pu ON p.USER_ID = pu.ID
ORDER BY bba.ID ASC
```
**Purpose:** Fetch all bed bookings with bed, doctor, and patient details

**Query 2: Get Patient's Bed Bookings**
```sql
SELECT 
  bba.ID, bba.STATUS,
  hb.BED_NUMBER, hb.WARD_NAME, hb.BED_TYPE, 
  hb.PRICE_PER_DAY, hb.FLOOR_NUMBER,
  da.APPOINTMENT_DATE, da.START_TIME, da.END_TIME
FROM BED_BOOKING_APPOINTMENTS bba
JOIN HOSPITAL_BEDS hb ON bba.BED_ID = hb.ID
JOIN DOCTORS_APPOINTMENTS da ON bba.DOCTOR_APPOINTMENT_ID = da.ID
WHERE da.PATIENT_ID = :patientId
ORDER BY bba.ID ASC
```
**Purpose:** Fetch bed bookings for a specific patient

---

### Medical Technician Module
**File:** `backend/controllers/medicalTechnicianController.js`

**Query: Get Technicians with Department and Branch**
```sql
SELECT 
  mt.ID, mt.NAME, mt.EMAIL, mt.PHONE, 
  mt.DEGREES, mt.EXPERIENCE_YEARS,
  d.NAME as DEPT_NAME,
  hb.NAME as BRANCH_NAME
FROM MEDICAL_TECHNICIAN mt
LEFT JOIN DEPARTMENTS d ON mt.DEPT_ID = d.ID
LEFT JOIN HOSPITAL_BRANCHES hb ON mt.BRANCH_ID = hb.ID
ORDER BY mt.ID ASC
```
**Purpose:** Fetch all technicians with their department and branch information

---

### Branch Contacts Module
**File:** `backend/controllers/branchContactsController.js`

**Query: Get Branch Contacts with Branch Details**
```sql
SELECT 
  bc.ID, bc.ADMIN_ID, bc.BRANCH_ID, bc.CONTACT_NO, bc.TYPE,
  hb.NAME as BRANCH_NAME, 
  hb.ADDRESS as BRANCH_ADDRESS
FROM BRANCH_CONTACTS bc
LEFT JOIN HOSPITAL_BRANCHES hb ON bc.BRANCH_ID = hb.ID
ORDER BY bc.ID ASC
```
**Purpose:** Fetch all branch contacts with branch information

---

### Lab Test Module
**File:** `backend/controllers/labTestController.js`

**Query 1: Get All Technicians**
```sql
SELECT 
  mt.ID, mt.NAME, mt.EMAIL, mt.PHONE, 
  mt.DEGREES, mt.EXPERIENCE_YEARS,
  d.NAME as DEPT_NAME,
  hb.NAME as BRANCH_NAME
FROM MEDICAL_TECHNICIAN mt
LEFT JOIN DEPARTMENTS d ON mt.DEPT_ID = d.ID
LEFT JOIN HOSPITAL_BRANCHES hb ON mt.BRANCH_ID = hb.ID
ORDER BY mt.NAME
```
**Purpose:** Fetch all medical technicians for lab test assignment

**Query 2: Get Patient Lab Tests**
```sql
SELECT 
  lta.ID, lta.REFERENCE,
  lt.TEST_NAME, lt.PRICE, lt.DEPARTMENT,
  mt.NAME as TECHNICIAN_NAME,
  lta.TEST_FILE_URL,
  CASE 
    WHEN lta.TEST_FILE_URL IS NOT NULL THEN 'COMPLETED'
    ELSE 'PENDING'
  END as STATUS
FROM LAB_TEST_APPOINTMENTS lta
JOIN LAB_TESTS lt ON lta.TEST_ID = lt.ID
LEFT JOIN MEDICAL_TECHNICIAN mt ON lta.TECHNICIAN_ID = mt.ID
WHERE lta.PATIENT_ID = :patientId
ORDER BY lta.ID DESC
```
**Purpose:** Fetch all lab test appointments for a patient with status

---

## 📈 QUERY PATTERNS USED

### 1. LEFT JOIN
Used for optional relationships where related data may not exist
- Patient profile (may not have PATIENT record yet)
- Technician assignments (may not have department/branch)
- Branch contacts (may not have branch details)

### 2. INNER JOIN
Used for required relationships
- Appointments with patients and doctors
- Prescriptions with appointments
- Bed bookings with beds and appointments

### 3. CASE WHEN
Used for conditional logic in queries
- Lab test status determination (COMPLETED vs PENDING)
- Prescription visit date formatting

### 4. Aggregate Functions
- COUNT(*) - Counting appointments, beds, etc.
- SUM() - Calculating total expenses, costs
- NVL() - Handling NULL values in calculations

### 5. String Functions
- TRIM() - Removing whitespace
- LOWER() / UPPER() - Case-insensitive comparisons
- TO_DATE() - Date formatting

---

## 🎯 Database Features Usage in Controllers

| Controller | Functions Used | Procedures Used | Complex Queries |
|------------|---------------|-----------------|-----------------|
| databaseFeaturesController.js | 3 | 0 | 0 |
| patientProfileUpdate.js | 0 | 0 | 1 |
| prescriptionController.js | 0 | 0 | 4 |
| doctorProfileUpdate.js | 0 | 0 | 3 |
| bedBookingController.js | 0 | 0 | 2 |
| medicalTechnicianController.js | 0 | 0 | 1 |
| branchContactsController.js | 0 | 0 | 1 |
| labTestController.js | 0 | 0 | 2 |

---

## 📝 Notes

1. **Triggers** are automatically executed by the database - no manual invocation needed
2. **Functions** can be called in SELECT statements or PL/SQL blocks
3. **Procedures** must be called from PL/SQL blocks or through application code
4. All complex queries use proper indexing on foreign keys for performance
5. TRIM() and LOWER() are used consistently for case-insensitive email matching

---

## 🔗 Related Files

- `backend/database_features.sql` - All triggers, functions, and procedures
- `backend/controllers/databaseFeaturesController.js` - API endpoints for functions
- Various controller files - Complex query implementations

