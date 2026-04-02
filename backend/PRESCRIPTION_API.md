# Prescription API Documentation

## Overview
This API manages prescriptions with medicines, dosages, and durations for doctor appointments.

## Database Setup

Before using the API, run the migration to add dosage/duration columns to PRESCRIBED_MED:

```sql
-- Run this in your Oracle database
ALTER TABLE PRESCRIBED_MED ADD (
  DOSAGE VARCHAR2(100),
  DURATION VARCHAR2(100)
);
```

## Endpoints

### 1. Create Prescription
**POST** `/api/prescriptions`

Creates a new prescription for an appointment with medicines.

**Request Body:**
```json
{
  "appointmentId": 123,
  "chiefComplaints": "Fever and headache for 3 days",
  "investigations": "Blood pressure: 120/80, Temperature: 101°F",
  "requiredTests": "Complete Blood Count, Malaria Test",
  "diagnosis": "Viral Fever",
  "history": "No previous history of chronic illness",
  "instructions": "Take medicines after meals, drink plenty of water",
  "visitAgainAt": "2026-04-10",
  "medicines": [
    {
      "medicineName": "Paracetamol 500mg",
      "dosage": "1 tablet twice daily",
      "duration": "5 days"
    },
    {
      "medicineName": "Amoxicillin 250mg",
      "dosage": "2 tablets three times daily",
      "duration": "7 days"
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Prescription created successfully",
  "prescriptionId": 456
}
```

**Validation:**
- Checks if appointment exists
- Prevents duplicate prescriptions for same appointment
- Looks up medicine by name (case-insensitive)
- Skips medicines not found in database with warning
- Ensures data consistency with transactions

---

### 2. Get Prescription by Appointment ID
**GET** `/api/prescriptions/appointment/:appointmentId`

Retrieves prescription details for a specific appointment.

**Example:** `/api/prescriptions/appointment/123`

**Response (200):**
```json
{
  "success": true,
  "prescription": {
    "id": 456,
    "appointmentId": 123,
    "dateIssued": "2026-04-02T10:30:00.000Z",
    "chiefComplaints": "Fever and headache for 3 days",
    "investigations": "Blood pressure: 120/80, Temperature: 101°F",
    "requiredTests": "Complete Blood Count, Malaria Test",
    "diagnosis": "Viral Fever",
    "history": "No previous history of chronic illness",
    "instructions": "Take medicines after meals, drink plenty of water",
    "visitAgainAt": "2026-04-10T00:00:00.000Z",
    "appointmentDate": "2026-04-02T09:00:00.000Z",
    "appointmentStatus": "completed",
    "patientName": "John Doe",
    "doctorName": "Dr. Sarah Smith",
    "medicines": [
      {
        "id": 1,
        "medicineName": "Paracetamol 500mg",
        "dosage": "1 tablet twice daily",
        "duration": "5 days",
        "contraindication": "Not for patients with liver disease"
      },
      {
        "id": 2,
        "medicineName": "Amoxicillin 250mg",
        "dosage": "2 tablets three times daily",
        "duration": "7 days",
        "contraindication": "Avoid if allergic to penicillin"
      }
    ]
  }
}
```

---

### 3. Get Prescription by Prescription ID
**GET** `/api/prescriptions/:id`

Retrieves prescription details by prescription ID.

**Example:** `/api/prescriptions/456`

**Response:** Same format as "Get by Appointment ID"

---

### 4. Update Prescription
**PUT** `/api/prescriptions/:id`

Updates an existing prescription.

**Request Body:**
```json
{
  "chiefComplaints": "Updated complaints",
  "investigations": "Updated investigations",
  "requiredTests": "Updated tests",
  "diagnosis": "Updated diagnosis",
  "history": "Updated history",
  "instructions": "Updated instructions",
  "visitAgainAt": "2026-04-15",
  "medicines": [
    {
      "medicineName": "Ibuprofen 400mg",
      "dosage": "1 tablet once daily",
      "duration": "10 days"
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Prescription updated successfully"
}
```

**Note:** 
- Updating medicines will DELETE all existing prescribed medicines and insert new ones
- All fields are optional

---

### 5. Delete Prescription
**DELETE** `/api/prescriptions/:id`

Deletes a prescription and all associated prescribed medicines.

**Example:** `/api/prescriptions/456`

**Response (200):**
```json
{
  "success": true,
  "message": "Prescription deleted successfully"
}
```

---

### 6. Get All Available Medicines
**GET** `/api/prescriptions/medicines`

Retrieves all medicines available in the system for prescription.

**Response (200):**
```json
{
  "success": true,
  "medicines": [
    {
      "id": 1,
      "medicineName": "Paracetamol 500mg",
      "dosage": "1 tablet",
      "duration": "As needed",
      "contraindication": "Not for patients with liver disease"
    },
    {
      "id": 2,
      "medicineName": "Amoxicillin 250mg",
      "dosage": "2 tablets",
      "duration": "7 days",
      "contraindication": "Avoid if allergic to penicillin"
    }
  ]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Appointment ID is required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Prescription not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to create prescription",
  "error": "Detailed error message"
}
```

---

## Frontend Integration Examples

### Create Prescription Form
```javascript
const createPrescription = async (appointmentId, prescriptionData) => {
  try {
    const response = await fetch('http://localhost:3000/api/prescriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentId,
        ...prescriptionData
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('✅ Prescription created successfully!');
      return data.prescriptionId;
    } else {
      alert('❌ ' + data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Failed to create prescription');
  }
};
```

### Get Prescription by Appointment
```javascript
const getPrescription = async (appointmentId) => {
  try {
    const response = await fetch(
      `http://localhost:3000/api/prescriptions/appointment/${appointmentId}`
    );
    
    const data = await response.json();
    
    if (data.success) {
      return data.prescription;
    } else {
      alert('❌ ' + data.message);
      return null;
    }
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Failed to fetch prescription');
    return null;
  }
};
```

### Load Available Medicines
```javascript
const loadMedicines = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/prescriptions/medicines');
    const data = await response.json();
    
    if (data.success) {
      return data.medicines;
    }
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
};
```

---

## Database Schema

### PRESCRIPTION Table
- `ID` (NUMBER, PK)
- `APPOINTMENT_ID` (NUMBER, FK → DOCTORS_APPOINTMENTS)
- `DATE_ISSUED` (DATE)
- `CHIEF_COMPLAINTS` (VARCHAR2(500))
- `INVESTIGATIONS` (VARCHAR2(500))
- `REQUIRED_TESTS` (VARCHAR2(500))
- `DIAGNOSIS` (VARCHAR2(500))
- `HISTORY` (VARCHAR2(500))
- `INSTRUCTIONS` (VARCHAR2(500))
- `VISIT_AGAIN_AT` (DATE)

### PRESCRIBED_MED Table (Junction Table)
- `ID` (NUMBER, PK)
- `PRESCRIPTION_ID` (NUMBER, FK → PRESCRIPTION)
- `MEDICATION_ID` (NUMBER, FK → MEDICATIONS)
- `DOSAGE` (VARCHAR2(100)) - Prescription-specific dosage
- `DURATION` (VARCHAR2(100)) - Prescription-specific duration

### MEDICATIONS Table
- `ID` (NUMBER, PK)
- `MEDICINE_NAME` (VARCHAR2(100))
- `DURATION` (VARCHAR2(50)) - Default duration
- `DOSAGE` (VARCHAR2(50)) - Default dosage
- `CONTRAINDICATION` (VARCHAR2(255))

---

## Notes

1. **Medicine Name Lookup**: 
   - Frontend sends medicine names (not IDs)
   - Backend looks up medicine by name (case-insensitive)
   - If medicine not found, it's skipped with a warning
   - Doctor doesn't need to memorize medicine IDs

2. **Dosage & Duration Storage**: 
   - Each prescription can have custom dosage/duration per medicine
   - Stored in `PRESCRIBED_MED` table (not `MEDICATIONS`)
   - `MEDICATIONS` table stores default/suggested values

3. **Transaction Safety**: 
   - All operations use transactions with rollback on error
   - Ensures data consistency

4. **Validation**:
   - Appointment must exist
   - No duplicate prescriptions per appointment
   - Medicine names are looked up in database
   - Invalid medicine names are skipped

5. **Cascade Delete**:
   - Deleting a prescription automatically deletes all prescribed medicines
