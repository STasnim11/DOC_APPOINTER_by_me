# ✅ Single Table Solution - Using `medicines` Table

## Overview
We're using **ONE table** for everything: `medicines` (the admin inventory table)

---

## Database Setup

### Option 1: Drop MEDICATIONS table (Recommended)
```sql
-- Drop the unused MEDICATIONS table
DROP TABLE MEDICATIONS CASCADE CONSTRAINTS;
```

### Option 2: Keep MEDICATIONS but don't use it
Just leave it there, we won't use it.

---

## API Endpoint for Doctor to See Medicines

### Endpoint
```
GET http://localhost:3000/api/prescriptions/medicines
```

### Response
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
      "description": "Antibiotic",
      "manufacturer": "MediLabs",
      "price": 12.50,
      "stockQuantity": 200,
      "category": "Antibiotic"
    }
  ]
}
```

---

## Frontend Implementation

### React Component - Medicine Selector

```jsx
import { useState, useEffect } from 'react';

export default function PrescriptionForm({ appointmentId }) {
  const [availableMedicines, setAvailableMedicines] = useState([]);
  const [showMedicineList, setShowMedicineList] = useState(false);
  const [selectedMedicines, setSelectedMedicines] = useState([
    { medicineName: '', dosage: '', duration: '' }
  ]);

  // Load medicines when component mounts
  useEffect(() => {
    fetchMedicines();
  }, []);

  // Fetch medicines from API
  const fetchMedicines = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/prescriptions/medicines');
      const data = await response.json();
      if (data.success) {
        setAvailableMedicines(data.medicines);
      }
    } catch (error) {
      console.error('Error loading medicines:', error);
    }
  };

  // Add medicine to prescription
  const addMedicine = (medicine) => {
    const newMedicine = {
      medicineName: medicine.medicineName,
      dosage: '',
      duration: ''
    };
    setSelectedMedicines([...selectedMedicines, newMedicine]);
    setShowMedicineList(false);
  };

  // Update medicine details
  const updateMedicine = (index, field, value) => {
    const updated = [...selectedMedicines];
    updated[index][field] = value;
    setSelectedMedicines(updated);
  };

  // Remove medicine
  const removeMedicine = (index) => {
    setSelectedMedicines(selectedMedicines.filter((_, i) => i !== index));
  };

  return (
    <div className="prescription-form">
      <h2>Create Prescription</h2>

      {/* Other prescription fields */}
      <textarea placeholder="Chief Complaints" />
      <textarea placeholder="Diagnosis" />
      <textarea placeholder="Instructions" />

      {/* Medicines Section */}
      <div className="medicines-section">
        <h3>Medicines</h3>
        
        {/* Button to show medicine list */}
        <button 
          type="button"
          onClick={() => setShowMedicineList(!showMedicineList)}
          className="show-medicines-btn"
        >
          {showMedicineList ? 'Hide' : 'Show'} Available Medicines
        </button>

        {/* Medicine List Modal/Dropdown */}
        {showMedicineList && (
          <div className="medicine-list-modal">
            <h4>Available Medicines</h4>
            <div className="medicine-grid">
              {availableMedicines.map(medicine => (
                <div key={medicine.id} className="medicine-card">
                  <h5>{medicine.medicineName}</h5>
                  <p>{medicine.description}</p>
                  <p>Category: {medicine.category}</p>
                  <p>Stock: {medicine.stockQuantity}</p>
                  <button onClick={() => addMedicine(medicine)}>
                    Add to Prescription
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Medicines */}
        {selectedMedicines.map((medicine, index) => (
          <div key={index} className="medicine-row">
            <input
              type="text"
              placeholder="Medicine name"
              value={medicine.medicineName}
              onChange={(e) => updateMedicine(index, 'medicineName', e.target.value)}
              list="medicine-names"
            />
            
            {/* Autocomplete datalist */}
            <datalist id="medicine-names">
              {availableMedicines.map(m => (
                <option key={m.id} value={m.medicineName} />
              ))}
            </datalist>

            <input
              type="text"
              placeholder="Dosage (e.g., 1 tablet twice daily)"
              value={medicine.dosage}
              onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
            />

            <input
              type="text"
              placeholder="Duration (e.g., 5 days)"
              value={medicine.duration}
              onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
            />

            <button onClick={() => removeMedicine(index)}>Remove</button>
          </div>
        ))}

        <button onClick={() => setSelectedMedicines([...selectedMedicines, { medicineName: '', dosage: '', duration: '' }])}>
          + Add Another Medicine
        </button>
      </div>

      <button type="submit">Create Prescription</button>
    </div>
  );
}
```

---

## Simple HTML/JavaScript Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Prescription Form</title>
  <style>
    .medicine-list { 
      border: 1px solid #ccc; 
      padding: 10px; 
      max-height: 300px; 
      overflow-y: auto; 
    }
    .medicine-item { 
      padding: 10px; 
      border-bottom: 1px solid #eee; 
      cursor: pointer; 
    }
    .medicine-item:hover { 
      background: #f0f0f0; 
    }
  </style>
</head>
<body>
  <h2>Create Prescription</h2>

  <!-- Button to show medicines -->
  <button onclick="loadMedicines()">Show Available Medicines</button>

  <!-- Medicine list -->
  <div id="medicineList" class="medicine-list" style="display:none;"></div>

  <!-- Selected medicines -->
  <div id="selectedMedicines"></div>

  <script>
    let availableMedicines = [];
    let selectedMedicines = [];

    // Load medicines from API
    async function loadMedicines() {
      try {
        const response = await fetch('http://localhost:3000/api/prescriptions/medicines');
        const data = await response.json();
        
        if (data.success) {
          availableMedicines = data.medicines;
          displayMedicineList();
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Failed to load medicines');
      }
    }

    // Display medicine list
    function displayMedicineList() {
      const listDiv = document.getElementById('medicineList');
      listDiv.style.display = 'block';
      
      listDiv.innerHTML = '<h3>Available Medicines (Click to Add)</h3>';
      
      availableMedicines.forEach(medicine => {
        const item = document.createElement('div');
        item.className = 'medicine-item';
        item.innerHTML = `
          <strong>${medicine.medicineName}</strong><br>
          ${medicine.description || ''}<br>
          <small>Category: ${medicine.category || 'N/A'} | Stock: ${medicine.stockQuantity || 0}</small>
        `;
        item.onclick = () => addMedicine(medicine);
        listDiv.appendChild(item);
      });
    }

    // Add medicine to prescription
    function addMedicine(medicine) {
      selectedMedicines.push({
        medicineName: medicine.medicineName,
        dosage: '',
        duration: ''
      });
      displaySelectedMedicines();
    }

    // Display selected medicines
    function displaySelectedMedicines() {
      const div = document.getElementById('selectedMedicines');
      div.innerHTML = '<h3>Selected Medicines</h3>';
      
      selectedMedicines.forEach((medicine, index) => {
        div.innerHTML += `
          <div style="margin: 10px 0; padding: 10px; border: 1px solid #ddd;">
            <p><strong>${medicine.medicineName}</strong></p>
            <input type="text" placeholder="Dosage" value="${medicine.dosage}" 
              onchange="updateMedicine(${index}, 'dosage', this.value)">
            <input type="text" placeholder="Duration" value="${medicine.duration}"
              onchange="updateMedicine(${index}, 'duration', this.value)">
            <button onclick="removeMedicine(${index})">Remove</button>
          </div>
        `;
      });
    }

    // Update medicine
    function updateMedicine(index, field, value) {
      selectedMedicines[index][field] = value;
    }

    // Remove medicine
    function removeMedicine(index) {
      selectedMedicines.splice(index, 1);
      displaySelectedMedicines();
    }
  </script>
</body>
</html>
```

---

## API Usage Summary

### 1. Doctor Opens Prescription Form
```javascript
// Frontend loads medicines
fetch('http://localhost:3000/api/prescriptions/medicines')
  .then(res => res.json())
  .then(data => {
    console.log(data.medicines); // Array of all medicines from admin dashboard
  });
```

### 2. Doctor Clicks "Show Medicines" Button
- Displays list of all medicines added by admin
- Shows: name, description, category, stock quantity
- Doctor can click to add medicine to prescription

### 3. Doctor Fills Dosage & Duration
- For each selected medicine
- Types custom dosage (e.g., "1 tablet twice daily")
- Types custom duration (e.g., "5 days")

### 4. Doctor Submits Prescription
```javascript
const prescriptionData = {
  appointmentId: 123,
  diagnosis: "Viral Fever",
  instructions: "Take rest",
  medicines: [
    {
      medicineName: "Paracetamol 500mg",
      dosage: "1 tablet twice daily",
      duration: "5 days"
    }
  ]
};

fetch('http://localhost:3000/api/prescriptions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(prescriptionData)
});
```

---

## Complete Flow

1. **Admin adds medicines** → `POST /api/admin/medicines`
2. **Doctor opens prescription form** → `GET /api/prescriptions/medicines` (shows all medicines)
3. **Doctor clicks "Show Medicines"** → Displays list from step 2
4. **Doctor selects medicine** → Adds to prescription form
5. **Doctor fills dosage/duration** → Custom per prescription
6. **Doctor submits** → `POST /api/prescriptions`
7. **Backend looks up medicine by name** → Finds in `medicines` table
8. **Backend creates prescription** → Links medicine via `PRESCRIBED_MED`

---

## Key Points

✅ **Single table:** `medicines` (admin inventory)  
✅ **API endpoint:** `GET /api/prescriptions/medicines`  
✅ **Button action:** Fetch and display medicines  
✅ **Medicine selection:** By name (case-insensitive)  
✅ **Custom dosage:** Doctor specifies per prescription  

---

## Testing

```bash
# 1. Add medicine via admin
curl -X POST http://localhost:3000/api/admin/medicines \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Paracetamol 500mg",
    "description": "Pain reliever",
    "price": 5.99,
    "stockQuantity": 500,
    "category": "Painkiller"
  }'

# 2. Doctor sees medicines
curl http://localhost:3000/api/prescriptions/medicines

# 3. Doctor creates prescription
curl -X POST http://localhost:3000/api/prescriptions \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": 1,
    "diagnosis": "Fever",
    "medicines": [
      {
        "medicineName": "Paracetamol 500mg",
        "dosage": "1 tablet twice daily",
        "duration": "5 days"
      }
    ]
  }'
```

---

## Summary

🎯 **API for doctor to see medicines:**
```
GET http://localhost:3000/api/prescriptions/medicines
```

🎯 **Frontend button:**
```jsx
<button onClick={loadMedicines}>Show Available Medicines</button>
```

🎯 **Single table:** `medicines` (from admin dashboard)

🎯 **Everything works together:** Admin adds → Doctor sees → Doctor prescribes
