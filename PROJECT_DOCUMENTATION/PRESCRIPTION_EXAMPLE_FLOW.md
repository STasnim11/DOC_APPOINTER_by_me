# Complete Prescription Flow Example

## Scenario
Dr. Sarah treats patient John for viral fever and creates a prescription.

---

## Step 1: Doctor Opens Prescription Form

Frontend loads available medicines for autocomplete:

```javascript
// Component loads
useEffect(() => {
  fetch('http://localhost:3000/api/prescriptions/medicines')
    .then(res => res.json())
    .then(data => {
      setAvailableMedicines(data.medicines);
      // Result: [
      //   { id: 1, medicineName: "Paracetamol 500mg", ... },
      //   { id: 2, medicineName: "Amoxicillin 250mg", ... },
      //   { id: 3, medicineName: "Ibuprofen 400mg", ... }
      // ]
    });
}, []);
```

---

## Step 2: Doctor Fills Prescription Form

```jsx
<form>
  {/* Basic Info */}
  <textarea name="chiefComplaints" placeholder="Chief Complaints">
    Patient complains of high fever (102°F) and severe headache for 3 days.
    Also experiencing body aches and fatigue.
  </textarea>

  <textarea name="investigations" placeholder="Investigations">
    Temperature: 102°F
    Blood Pressure: 120/80 mmHg
    Pulse: 88 bpm
    Throat: Slightly red
  </textarea>

  <input name="requiredTests" placeholder="Required Tests" 
    value="Complete Blood Count (CBC), Malaria Test" />

  <input name="diagnosis" placeholder="Diagnosis" 
    value="Viral Fever" />

  <textarea name="history" placeholder="Medical History">
    No previous chronic illness.
    No known allergies.
    Not on any regular medication.
  </textarea>

  <textarea name="instructions" placeholder="Instructions">
    1. Take complete bed rest
    2. Drink plenty of fluids (8-10 glasses of water daily)
    3. Take medicines after meals
    4. Avoid cold foods and beverages
    5. Monitor temperature twice daily
  </textarea>

  <input type="date" name="visitAgainAt" value="2026-04-09" />

  {/* Medicines */}
  <h3>Medicines</h3>
  
  {/* Medicine 1 */}
  <div className="medicine-row">
    <input 
      type="text" 
      placeholder="Medicine name"
      value="Paracetamol 500mg"
      list="medicine-list"
    />
    <input placeholder="Dosage" value="1 tablet three times daily" />
    <input placeholder="Duration" value="5 days" />
  </div>

  {/* Medicine 2 */}
  <div className="medicine-row">
    <input 
      type="text" 
      placeholder="Medicine name"
      value="Ibuprofen 400mg"
      list="medicine-list"
    />
    <input placeholder="Dosage" value="1 tablet twice daily (if fever > 101°F)" />
    <input placeholder="Duration" value="3 days" />
  </div>

  {/* Autocomplete suggestions */}
  <datalist id="medicine-list">
    <option value="Paracetamol 500mg" />
    <option value="Amoxicillin 250mg" />
    <option value="Ibuprofen 400mg" />
  </datalist>

  <button type="submit">Create Prescription</button>
</form>
```

---

## Step 3: Frontend Sends Request

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const prescriptionData = {
    appointmentId: 123, // From appointment context
    chiefComplaints: "Patient complains of high fever (102°F) and severe headache for 3 days. Also experiencing body aches and fatigue.",
    investigations: "Temperature: 102°F, Blood Pressure: 120/80 mmHg, Pulse: 88 bpm, Throat: Slightly red",
    requiredTests: "Complete Blood Count (CBC), Malaria Test",
    diagnosis: "Viral Fever",
    history: "No previous chronic illness. No known allergies. Not on any regular medication.",
    instructions: "1. Take complete bed rest\n2. Drink plenty of fluids (8-10 glasses of water daily)\n3. Take medicines after meals\n4. Avoid cold foods and beverages\n5. Monitor temperature twice daily",
    visitAgainAt: "2026-04-09",
    medicines: [
      {
        medicineName: "Paracetamol 500mg",
        dosage: "1 tablet three times daily",
        duration: "5 days"
      },
      {
        medicineName: "Ibuprofen 400mg",
        dosage: "1 tablet twice daily (if fever > 101°F)",
        duration: "3 days"
      }
    ]
  };

  try {
    const response = await fetch('http://localhost:3000/api/prescriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prescriptionData)
    });

    const result = await response.json();
    
    if (result.success) {
      alert('✅ Prescription created successfully!');
      console.log('Prescription ID:', result.prescriptionId);
      // Redirect to prescription view or appointment list
    } else {
      alert('❌ ' + result.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Failed to create prescription');
  }
};
```

---

## Step 4: Backend Processes Request

### 4.1 Validate Appointment
```sql
SELECT ID FROM DOCTORS_APPOINTMENTS WHERE ID = 123
-- Result: Appointment exists ✅
```

### 4.2 Check for Duplicate
```sql
SELECT ID FROM PRESCRIPTION WHERE APPOINTMENT_ID = 123
-- Result: No existing prescription ✅
```

### 4.3 Create Prescription
```sql
INSERT INTO PRESCRIPTION (
  APPOINTMENT_ID, DATE_ISSUED, CHIEF_COMPLAINTS, 
  INVESTIGATIONS, REQUIRED_TESTS, DIAGNOSIS, 
  HISTORY, INSTRUCTIONS, VISIT_AGAIN_AT
) VALUES (
  123, SYSDATE, 'Patient complains of...', 
  'Temperature: 102°F...', 'Complete Blood Count...', 'Viral Fever',
  'No previous chronic illness...', '1. Take complete bed rest...', '2026-04-09'
) RETURNING ID INTO :prescriptionId
-- Result: prescriptionId = 456 ✅
```

### 4.4 Process Medicine 1: "Paracetamol 500mg"
```sql
-- Look up medicine by name
SELECT ID FROM MEDICATIONS 
WHERE UPPER(MEDICINE_NAME) = UPPER('Paracetamol 500mg')
-- Result: ID = 1 ✅

-- Insert prescribed medicine
INSERT INTO PRESCRIBED_MED (
  PRESCRIPTION_ID, MEDICATION_ID, DOSAGE, DURATION
) VALUES (
  456, 1, '1 tablet three times daily', '5 days'
)
-- Result: Success ✅
```

### 4.5 Process Medicine 2: "Ibuprofen 400mg"
```sql
-- Look up medicine by name
SELECT ID FROM MEDICATIONS 
WHERE UPPER(MEDICINE_NAME) = UPPER('Ibuprofen 400mg')
-- Result: ID = 3 ✅

-- Insert prescribed medicine
INSERT INTO PRESCRIBED_MED (
  PRESCRIPTION_ID, MEDICATION_ID, DOSAGE, DURATION
) VALUES (
  456, 3, '1 tablet twice daily (if fever > 101°F)', '3 days'
)
-- Result: Success ✅
```

### 4.6 Commit Transaction
```sql
COMMIT;
-- Result: All changes saved ✅
```

---

## Step 5: Backend Sends Response

```json
{
  "success": true,
  "message": "Prescription created successfully",
  "prescriptionId": 456
}
```

---

## Step 6: Patient Views Prescription

### Frontend Request
```javascript
const appointmentId = 123;
const response = await fetch(
  `http://localhost:3000/api/prescriptions/appointment/${appointmentId}`
);
const data = await response.json();
```

### Backend Response
```json
{
  "success": true,
  "prescription": {
    "id": 456,
    "appointmentId": 123,
    "dateIssued": "2026-04-02T14:30:00.000Z",
    "chiefComplaints": "Patient complains of high fever (102°F) and severe headache for 3 days. Also experiencing body aches and fatigue.",
    "investigations": "Temperature: 102°F, Blood Pressure: 120/80 mmHg, Pulse: 88 bpm, Throat: Slightly red",
    "requiredTests": "Complete Blood Count (CBC), Malaria Test",
    "diagnosis": "Viral Fever",
    "history": "No previous chronic illness. No known allergies. Not on any regular medication.",
    "instructions": "1. Take complete bed rest\n2. Drink plenty of fluids (8-10 glasses of water daily)\n3. Take medicines after meals\n4. Avoid cold foods and beverages\n5. Monitor temperature twice daily",
    "visitAgainAt": "2026-04-09T00:00:00.000Z",
    "appointmentDate": "2026-04-02T09:00:00.000Z",
    "appointmentStatus": "completed",
    "patientName": "John Doe",
    "doctorName": "Dr. Sarah Smith",
    "medicines": [
      {
        "id": 1,
        "medicineName": "Paracetamol 500mg",
        "dosage": "1 tablet three times daily",
        "duration": "5 days",
        "contraindication": "Not for patients with liver disease"
      },
      {
        "id": 3,
        "medicineName": "Ibuprofen 400mg",
        "dosage": "1 tablet twice daily (if fever > 101°F)",
        "duration": "3 days",
        "contraindication": "Avoid if you have stomach ulcers"
      }
    ]
  }
}
```

### Frontend Display
```jsx
<div className="prescription-view">
  <header>
    <h1>Prescription</h1>
    <p>Dr. Sarah Smith</p>
    <p>Date: April 2, 2026</p>
  </header>

  <section>
    <h2>Patient Information</h2>
    <p><strong>Name:</strong> John Doe</p>
    <p><strong>Appointment Date:</strong> April 2, 2026</p>
  </section>

  <section>
    <h2>Chief Complaints</h2>
    <p>Patient complains of high fever (102°F) and severe headache for 3 days. 
       Also experiencing body aches and fatigue.</p>
  </section>

  <section>
    <h2>Investigations</h2>
    <p>Temperature: 102°F</p>
    <p>Blood Pressure: 120/80 mmHg</p>
    <p>Pulse: 88 bpm</p>
    <p>Throat: Slightly red</p>
  </section>

  <section>
    <h2>Diagnosis</h2>
    <p className="diagnosis">Viral Fever</p>
  </section>

  <section>
    <h2>Required Tests</h2>
    <p>Complete Blood Count (CBC), Malaria Test</p>
  </section>

  <section>
    <h2>Prescribed Medicines</h2>
    <table>
      <thead>
        <tr>
          <th>Medicine</th>
          <th>Dosage</th>
          <th>Duration</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Paracetamol 500mg</td>
          <td>1 tablet three times daily</td>
          <td>5 days</td>
        </tr>
        <tr>
          <td>Ibuprofen 400mg</td>
          <td>1 tablet twice daily (if fever > 101°F)</td>
          <td>3 days</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section>
    <h2>Instructions</h2>
    <ol>
      <li>Take complete bed rest</li>
      <li>Drink plenty of fluids (8-10 glasses of water daily)</li>
      <li>Take medicines after meals</li>
      <li>Avoid cold foods and beverages</li>
      <li>Monitor temperature twice daily</li>
    </ol>
  </section>

  <section>
    <h2>Follow-up</h2>
    <p><strong>Next Visit:</strong> April 9, 2026</p>
  </section>

  <footer>
    <button onClick={handlePrint}>Print Prescription</button>
    <button onClick={handleDownloadPDF}>Download PDF</button>
  </footer>
</div>
```

---

## Complete Flow Summary

1. ✅ Doctor opens prescription form
2. ✅ System loads available medicines for autocomplete
3. ✅ Doctor fills form with medicine names (not IDs)
4. ✅ Frontend sends prescription data to backend
5. ✅ Backend validates appointment exists
6. ✅ Backend checks for duplicate prescription
7. ✅ Backend creates prescription record
8. ✅ Backend looks up each medicine by name
9. ✅ Backend links medicines to prescription
10. ✅ Backend commits transaction
11. ✅ Backend returns success with prescription ID
12. ✅ Patient can view prescription anytime
13. ✅ Prescription shows all details including medicines

---

## Key Points

- 🎯 **No IDs needed**: Doctor types medicine names naturally
- 🔍 **Auto lookup**: Backend finds medicine ID automatically
- 📝 **Case insensitive**: "Paracetamol" = "paracetamol" = "PARACETAMOL"
- ✅ **Graceful errors**: Invalid medicine names are skipped
- 💾 **Transaction safe**: All-or-nothing database operations
- 🔄 **Complete data**: Prescription includes patient, doctor, and medicine details

---

## Testing This Flow

```bash
# 1. Get available medicines
curl http://localhost:3000/api/prescriptions/medicines

# 2. Create prescription with medicine names
curl -X POST http://localhost:3000/api/prescriptions \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": 123,
    "diagnosis": "Viral Fever",
    "instructions": "Take rest and drink water",
    "medicines": [
      {
        "medicineName": "Paracetamol 500mg",
        "dosage": "1 tablet three times daily",
        "duration": "5 days"
      }
    ]
  }'

# 3. View prescription
curl http://localhost:3000/api/prescriptions/appointment/123
```

---

**Status:** Complete working example  
**Date:** April 2, 2026
