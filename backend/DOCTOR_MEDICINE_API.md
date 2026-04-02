# 🏥 Doctor Medicine Selection API - Quick Reference

## API Endpoint

```
GET http://localhost:3000/api/prescriptions/medicines
```

## What It Does
Returns all medicines that admin added via the admin dashboard.

## Response Example
```json
{
  "success": true,
  "medicines": [
    {
      "id": 1,
      "medicineName": "Paracetamol 500mg",
      "description": "Pain reliever and fever reducer",
      "manufacturer": "PharmaCorp",
      "price": 5.99,
      "stockQuantity": 500,
      "category": "Painkiller"
    },
    {
      "id": 2,
      "medicineName": "Amoxicillin 250mg",
      "description": "Antibiotic for bacterial infections",
      "manufacturer": "MediLabs",
      "price": 12.50,
      "stockQuantity": 200,
      "category": "Antibiotic"
    }
  ]
}
```

---

## Frontend Button Implementation

### Simple Button
```jsx
<button onClick={loadMedicines}>
  Show Available Medicines
</button>
```

### Load Medicines Function
```javascript
const loadMedicines = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/prescriptions/medicines');
    const data = await response.json();
    
    if (data.success) {
      setAvailableMedicines(data.medicines);
      setShowMedicineList(true);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to load medicines');
  }
};
```

### Display Medicines
```jsx
{showMedicineList && (
  <div className="medicine-list">
    <h3>Available Medicines</h3>
    {availableMedicines.map(medicine => (
      <div key={medicine.id} className="medicine-item">
        <h4>{medicine.medicineName}</h4>
        <p>{medicine.description}</p>
        <p>Category: {medicine.category}</p>
        <p>In Stock: {medicine.stockQuantity}</p>
        <button onClick={() => addToPrescription(medicine)}>
          Add to Prescription
        </button>
      </div>
    ))}
  </div>
)}
```

---

## Complete Working Example

```jsx
import { useState, useEffect } from 'react';

export default function PrescriptionForm() {
  const [medicines, setMedicines] = useState([]);
  const [showList, setShowList] = useState(false);
  const [prescription, setPrescription] = useState({
    medicines: []
  });

  // Load medicines when button is clicked
  const loadMedicines = async () => {
    const res = await fetch('http://localhost:3000/api/prescriptions/medicines');
    const data = await res.json();
    if (data.success) {
      setMedicines(data.medicines);
      setShowList(true);
    }
  };

  // Add medicine to prescription
  const addMedicine = (medicine) => {
    setPrescription({
      ...prescription,
      medicines: [
        ...prescription.medicines,
        {
          medicineName: medicine.medicineName,
          dosage: '',
          duration: ''
        }
      ]
    });
    setShowList(false);
  };

  return (
    <div>
      <h2>Create Prescription</h2>
      
      {/* Button to show medicines */}
      <button onClick={loadMedicines}>
        📋 Show Available Medicines
      </button>

      {/* Medicine list */}
      {showList && (
        <div style={{ border: '1px solid #ccc', padding: '10px', marginTop: '10px' }}>
          <h3>Select Medicine</h3>
          {medicines.map(med => (
            <div key={med.id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
              <strong>{med.medicineName}</strong>
              <p>{med.description}</p>
              <button onClick={() => addMedicine(med)}>Add</button>
            </div>
          ))}
        </div>
      )}

      {/* Selected medicines */}
      <h3>Prescribed Medicines</h3>
      {prescription.medicines.map((med, i) => (
        <div key={i}>
          <p>{med.medicineName}</p>
          <input 
            placeholder="Dosage" 
            onChange={(e) => {
              const updated = [...prescription.medicines];
              updated[i].dosage = e.target.value;
              setPrescription({ ...prescription, medicines: updated });
            }}
          />
          <input 
            placeholder="Duration"
            onChange={(e) => {
              const updated = [...prescription.medicines];
              updated[i].duration = e.target.value;
              setPrescription({ ...prescription, medicines: updated });
            }}
          />
        </div>
      ))}
    </div>
  );
}
```

---

## Testing

### 1. Test API directly
```bash
curl http://localhost:3000/api/prescriptions/medicines
```

### 2. Test in browser console
```javascript
fetch('http://localhost:3000/api/prescriptions/medicines')
  .then(res => res.json())
  .then(data => console.log(data));
```

### 3. Expected result
Should return all medicines from admin dashboard

---

## Summary

🎯 **Endpoint:** `GET /api/prescriptions/medicines`  
🎯 **Button:** "Show Available Medicines"  
🎯 **Source:** Admin dashboard medicines  
🎯 **Usage:** Doctor clicks → Sees list → Selects medicine → Adds to prescription  

**That's it!** Simple and straightforward.
