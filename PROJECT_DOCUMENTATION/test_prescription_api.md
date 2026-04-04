# Testing Prescription API

## Prerequisites
1. Run the migration SQL:
```sql
ALTER TABLE PRESCRIBED_MED ADD (
  DOSAGE VARCHAR2(100),
  DURATION VARCHAR2(100)
);
```

2. Ensure you have:
   - Valid appointment ID
   - Valid medicine IDs in MEDICATIONS table
   - Backend server running on port 3000

## Test Sequence

### Step 1: Get Available Medicines
```bash
curl http://localhost:3000/api/prescriptions/medicines
```

### Step 2: Create a Prescription
```bash
curl -X POST http://localhost:3000/api/prescriptions \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": 1,
    "chiefComplaints": "Fever and cough",
    "investigations": "Temperature: 101F",
    "requiredTests": "Blood test",
    "diagnosis": "Viral infection",
    "history": "No previous illness",
    "instructions": "Rest and take medicines",
    "visitAgainAt": "2026-04-10",
    "medicines": [
      {
        "medicineName": "Paracetamol 500mg",
        "dosage": "1 tablet twice daily",
        "duration": "5 days"
      }
    ]
  }'
```

### Step 3: Get Prescription by Appointment ID
```bash
curl http://localhost:3000/api/prescriptions/appointment/1
```

### Step 4: Get Prescription by Prescription ID
```bash
curl http://localhost:3000/api/prescriptions/1
```

### Step 5: Update Prescription
```bash
curl -X PUT http://localhost:3000/api/prescriptions/1 \
  -H "Content-Type: application/json" \
  -d '{
    "diagnosis": "Updated diagnosis",
    "medicines": [
      {
        "medicineName": "Ibuprofen 400mg",
        "dosage": "2 tablets three times daily",
        "duration": "7 days"
      }
    ]
  }'
```

### Step 6: Delete Prescription
```bash
curl -X DELETE http://localhost:3000/api/prescriptions/1
```

## Using Postman

### Collection Setup
1. Create new collection "Prescription API"
2. Set base URL variable: `{{baseUrl}}` = `http://localhost:3000`

### Test Cases

#### 1. Get Medicines
- Method: GET
- URL: `{{baseUrl}}/api/prescriptions/medicines`

#### 2. Create Prescription
- Method: POST
- URL: `{{baseUrl}}/api/prescriptions`
- Body (JSON):
```json
{
  "appointmentId": 1,
  "chiefComplaints": "Fever and cough",
  "diagnosis": "Viral infection",
  "medicines": [
    {
      "medicineName": "Paracetamol 500mg",
      "dosage": "1 tablet twice daily",
      "duration": "5 days"
    }
  ]
}
```

#### 3. Get by Appointment
- Method: GET
- URL: `{{baseUrl}}/api/prescriptions/appointment/1`

#### 4. Update Prescription
- Method: PUT
- URL: `{{baseUrl}}/api/prescriptions/1`
- Body (JSON):
```json
{
  "diagnosis": "Updated diagnosis"
}
```

#### 5. Delete Prescription
- Method: DELETE
- URL: `{{baseUrl}}/api/prescriptions/1`
