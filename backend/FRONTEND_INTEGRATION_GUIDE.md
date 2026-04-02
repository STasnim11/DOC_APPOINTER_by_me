# Frontend Integration Guide - Prescription System

## Quick Start

### 1. Setup (Run Once)
Execute this SQL in your Oracle database:
```sql
ALTER TABLE PRESCRIBED_MED ADD (
  DOSAGE VARCHAR2(100),
  DURATION VARCHAR2(100)
);
```

### 2. Base URL
```javascript
const API_BASE_URL = 'http://localhost:3000/api/prescriptions';
```

---

## Common Use Cases

### Use Case 1: Doctor Creates Prescription Form

**Step 1: Load Available Medicines**
```javascript
const [medicines, setMedicines] = useState([]);

useEffect(() => {
  fetch('http://localhost:3000/api/prescriptions/medicines')
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setMedicines(data.medicines);
      }
    });
}, []);
```

**Step 2: Create Form State**
```javascript
const [formData, setFormData] = useState({
  chiefComplaints: '',
  investigations: '',
  requiredTests: '',
  diagnosis: '',
  history: '',
  instructions: '',
  visitAgainAt: '',
  medicines: [
    { medicineName: '', dosage: '', duration: '' }
  ]
});
```

**Step 3: Add Medicine Row**
```javascript
const addMedicineRow = () => {
  setFormData({
    ...formData,
    medicines: [
      ...formData.medicines,
      { medicineName: '', dosage: '', duration: '' }
    ]
  });
};
```

**Step 4: Submit Prescription**
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    const response = await fetch('http://localhost:3000/api/prescriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentId: appointmentId, // from props or route params
        ...formData
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('✅ Prescription created successfully!');
      // Redirect or close form
    } else {
      alert('❌ ' + data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Failed to create prescription');
  }
};
```

---

### Use Case 2: Patient Views Prescription

```javascript
const [prescription, setPrescription] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchPrescription = async () => {
    try {
      const appointmentId = 123; // from props or route params
      const response = await fetch(
        `http://localhost:3000/api/prescriptions/appointment/${appointmentId}`
      );
      
      const data = await response.json();
      
      if (data.success) {
        setPrescription(data.prescription);
      } else {
        alert('No prescription found for this appointment');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to load prescription');
    } finally {
      setLoading(false);
    }
  };
  
  fetchPrescription();
}, []);

// Render prescription
if (loading) return <p>Loading...</p>;
if (!prescription) return <p>No prescription available</p>;

return (
  <div className="prescription-view">
    <h2>Prescription</h2>
    <p><strong>Doctor:</strong> {prescription.doctorName}</p>
    <p><strong>Date:</strong> {new Date(prescription.dateIssued).toLocaleDateString()}</p>
    <p><strong>Diagnosis:</strong> {prescription.diagnosis}</p>
    <p><strong>Instructions:</strong> {prescription.instructions}</p>
    
    <h3>Medicines</h3>
    <table>
      <thead>
        <tr>
          <th>Medicine</th>
          <th>Dosage</th>
          <th>Duration</th>
        </tr>
      </thead>
      <tbody>
        {prescription.medicines.map(med => (
          <tr key={med.id}>
            <td>{med.medicineName}</td>
            <td>{med.dosage}</td>
            <td>{med.duration}</td>
          </tr>
        ))}
      </tbody>
    </table>
    
    {prescription.visitAgainAt && (
      <p><strong>Next Visit:</strong> {new Date(prescription.visitAgainAt).toLocaleDateString()}</p>
    )}
  </div>
);
```

---

### Use Case 3: Doctor Updates Prescription

```javascript
const updatePrescription = async (prescriptionId, updates) => {
  try {
    const response = await fetch(
      `http://localhost:3000/api/prescriptions/${prescriptionId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      alert('✅ Prescription updated successfully!');
      return true;
    } else {
      alert('❌ ' + data.message);
      return false;
    }
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Failed to update prescription');
    return false;
  }
};

// Usage
await updatePrescription(456, {
  diagnosis: 'Updated diagnosis',
  medicines: [
    { medicineName: 'Ibuprofen 400mg', dosage: '1 tablet twice daily', duration: '5 days' }
  ]
});
```

---

## Complete React Component Example

```jsx
import { useState, useEffect } from 'react';

export default function PrescriptionForm({ appointmentId, onSuccess }) {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    chiefComplaints: '',
    investigations: '',
    requiredTests: '',
    diagnosis: '',
    history: '',
    instructions: '',
    visitAgainAt: '',
    medicines: [{ medicineName: '', dosage: '', duration: '' }]
  });

  // Load available medicines
  useEffect(() => {
    fetch('http://localhost:3000/api/prescriptions/medicines')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMedicines(data.medicines);
        }
      })
      .catch(err => console.error('Error loading medicines:', err));
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle medicine changes
  const handleMedicineChange = (index, field, value) => {
    const updatedMedicines = [...formData.medicines];
    updatedMedicines[index][field] = value;
    setFormData({ ...formData, medicines: updatedMedicines });
  };

  // Add medicine row
  const addMedicine = () => {
    setFormData({
      ...formData,
      medicines: [...formData.medicines, { medicineName: '', dosage: '', duration: '' }]
    });
  };

  // Remove medicine row
  const removeMedicine = (index) => {
    const updatedMedicines = formData.medicines.filter((_, i) => i !== index);
    setFormData({ ...formData, medicines: updatedMedicines });
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          ...formData,
          medicines: formData.medicines.filter(m => m.medicineName) // Remove empty rows
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Prescription created successfully!');
        if (onSuccess) onSuccess(data.prescriptionId);
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Failed to create prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="prescription-form">
      <h2>Create Prescription</h2>

      <div className="form-group">
        <label>Chief Complaints</label>
        <textarea
          name="chiefComplaints"
          value={formData.chiefComplaints}
          onChange={handleChange}
          rows="3"
          placeholder="Patient's main complaints..."
        />
      </div>

      <div className="form-group">
        <label>Investigations</label>
        <textarea
          name="investigations"
          value={formData.investigations}
          onChange={handleChange}
          rows="2"
          placeholder="Physical examination findings..."
        />
      </div>

      <div className="form-group">
        <label>Required Tests</label>
        <input
          type="text"
          name="requiredTests"
          value={formData.requiredTests}
          onChange={handleChange}
          placeholder="CBC, X-Ray, etc."
        />
      </div>

      <div className="form-group">
        <label>Diagnosis</label>
        <input
          type="text"
          name="diagnosis"
          value={formData.diagnosis}
          onChange={handleChange}
          placeholder="Final diagnosis..."
          required
        />
      </div>

      <div className="form-group">
        <label>History</label>
        <textarea
          name="history"
          value={formData.history}
          onChange={handleChange}
          rows="2"
          placeholder="Patient's medical history..."
        />
      </div>

      <div className="form-group">
        <label>Instructions</label>
        <textarea
          name="instructions"
          value={formData.instructions}
          onChange={handleChange}
          rows="3"
          placeholder="Instructions for patient..."
        />
      </div>

      <div className="form-group">
        <label>Next Visit Date</label>
        <input
          type="date"
          name="visitAgainAt"
          value={formData.visitAgainAt}
          onChange={handleChange}
        />
      </div>

      <h3>Medicines</h3>
      {formData.medicines.map((medicine, index) => (
        <div key={index} className="medicine-row">
          <input
            type="text"
            placeholder="Medicine name (e.g., Paracetamol 500mg)"
            value={medicine.medicineName}
            onChange={(e) => handleMedicineChange(index, 'medicineName', e.target.value)}
            list="medicine-suggestions"
            required
          />
          
          {/* Optional: Add datalist for autocomplete */}
          <datalist id="medicine-suggestions">
            {medicines.map(med => (
              <option key={med.id} value={med.medicineName} />
            ))}
          </datalist>

          <input
            type="text"
            placeholder="Dosage (e.g., 1 tablet twice daily)"
            value={medicine.dosage}
            onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Duration (e.g., 5 days)"
            value={medicine.duration}
            onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
            required
          />

          {formData.medicines.length > 1 && (
            <button type="button" onClick={() => removeMedicine(index)}>
              Remove
            </button>
          )}
        </div>
      ))}

      <button type="button" onClick={addMedicine} className="add-medicine-btn">
        + Add Medicine
      </button>

      <button type="submit" disabled={loading} className="submit-btn">
        {loading ? 'Creating...' : 'Create Prescription'}
      </button>
    </form>
  );
}
```

---

## API Response Examples

### Success Response
```json
{
  "success": true,
  "message": "Prescription created successfully",
  "prescriptionId": 456
}
```

### Error Response
```json
{
  "success": false,
  "message": "Appointment not found"
}
```

### Prescription Data Structure
```json
{
  "success": true,
  "prescription": {
    "id": 456,
    "appointmentId": 123,
    "dateIssued": "2026-04-02T10:30:00.000Z",
    "chiefComplaints": "Fever and headache",
    "diagnosis": "Viral Fever",
    "patientName": "John Doe",
    "doctorName": "Dr. Sarah Smith",
    "medicines": [
      {
        "id": 1,
        "medicineName": "Paracetamol 500mg",
        "dosage": "1 tablet twice daily",
        "duration": "5 days"
      }
    ]
  }
}
```

---

## Error Handling Best Practices

```javascript
const createPrescription = async (data) => {
  try {
    const response = await fetch('http://localhost:3000/api/prescriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      // Handle HTTP errors
      throw new Error(result.message || 'Failed to create prescription');
    }

    if (!result.success) {
      // Handle application errors
      throw new Error(result.message);
    }

    return result;
  } catch (error) {
    console.error('Error creating prescription:', error);
    throw error; // Re-throw to handle in component
  }
};
```

---

## Validation Tips

1. **Required Fields:**
   - `appointmentId` (always required)
   - At least one medicine with `medicineName`, `dosage`, and `duration`

2. **Optional Fields:**
   - All prescription text fields are optional
   - `visitAgainAt` is optional

3. **Medicine Validation:**
   - Backend looks up medicine by name (case-insensitive)
   - Medicines not found in database are skipped with warnings
   - Empty medicine rows should be filtered out before sending
   - Use autocomplete/datalist for better UX

---

## Common Issues & Solutions

### Issue: "Prescription already exists"
**Solution:** Check if prescription was already created for this appointment. Use GET endpoint to retrieve existing prescription.

### Issue: "Appointment not found"
**Solution:** Verify the appointment ID exists in DOCTORS_APPOINTMENTS table.

### Issue: "Medicine not found"
**Solution:** 
- Ensure medicine name matches exactly with database (case-insensitive)
- Use GET /medicines endpoint to see available medicine names
- Consider using autocomplete/datalist for medicine input
- Backend will skip medicines not found and continue with others

### Issue: BIND_OUT error
**Solution:** Ensure you ran the database migration and restarted the server.
