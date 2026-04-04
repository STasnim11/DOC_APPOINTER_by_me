# Specialization Code Locations

## 📍 WHERE SPECIALIZATION IS CURRENTLY USED

### Backend Files

#### 1. `backend/controllers/doctorProfileUpdate.js`
**Location:** Line ~78-90
**What it does:** Fetches specialization from DOC_SPECIALIZATION table
```javascript
// Get specialization from DOC_SPECIALIZATION table
const specResult = await connection.execute(
  `SELECT s.NAME
   FROM DOC_SPECIALIZATION ds
   JOIN SPECIALIZATION s ON ds.SPECIALIZATION_ID = s.ID
   WHERE ds.DOCTOR_ID = :doctorId`,
  { doctorId }
);

if (specResult.rows.length > 0) {
  specialization = specResult.rows[0][0] || "Not provided";
}
```
**Returns in response:** `specialization: "Cardiology"` (or "Not provided")

---

#### 2. `backend/controllers/doctorSpecialization.js`
**Location:** Line ~134-180
**What it does:** Saves/updates doctor's specialization
```javascript
exports.saveDoctorSpecialization = async (req, res) => {
  const { email, specializationId } = req.body;
  
  // Delete existing specialization
  await connection.execute(
    `DELETE FROM DOC_SPECIALIZATION WHERE DOCTOR_ID = :doctorId`,
    { doctorId }
  );
  
  // Insert new specialization
  await connection.execute(
    `INSERT INTO DOC_SPECIALIZATION (DOCTOR_ID, SPECIALIZATION_ID)
     VALUES (:doctorId, :specializationId)`,
    { doctorId, specializationId }
  );
};
```
**Endpoint:** `POST /api/doctor/specialization`

---

#### 3. `backend/controllers/timetable.js`
**Multiple locations** - Used in:
- `getDoctorsBySpecialty()` - Line ~57-65
- `getAllDoctors()` - Line ~125-131
- `getTopDoctors()` - Line ~169-173
- `getDoctorById()` - Line ~207-213

All these fetch specialization when getting doctor lists.

---

### Frontend Files

#### 1. `frontend/src/pages/DoctorDashboard.jsx`
**View Profile - Line ~430** (approximately)
```javascript
<div className="doctor-info-row">
  <label>Specialization:</label>
  <span>{doctorProfile.specialization || 'Not provided'}</span>
</div>
```
**Shows:** Displays specialization in View Profile

**Edit Profile - NOT INCLUDED**
Currently Edit Profile does NOT have specialization field.

---

#### 2. `frontend/src/pages/SpecializationSetup.jsx`
**Entire file**
This is a separate page for setting up specialization (might be old/unused).

---

#### 3. `frontend/src/pages/Home.jsx`
**Line ~114-117**
Shows specialties in the "Find by Specialty" section.

---

#### 4. `frontend/src/pages/AllDoctors.jsx`
Shows specialties in sidebar filter and doctor cards.

---

#### 5. `frontend/src/pages/DoctorProfile.jsx`
Shows doctor's specialization on their public profile page.

---

## 🔴 THE PROBLEM

**View Profile shows:** "Not provided" for specialization
**Edit Profile:** Does NOT have a field to update specialization

## 📊 DATABASE STRUCTURE

```
SPECIALIZATION table:
- ID (PK)
- NAME (e.g., "Cardiology", "Neurology")
- DESCRIPTION
- ADMIN_ID

DOC_SPECIALIZATION table (junction table):
- ID (PK)
- DOCTOR_ID (FK to DOCTOR)
- SPECIALIZATION_ID (FK to SPECIALIZATION)
```

## ✅ WHAT NEEDS TO BE ADDED

### 1. Edit Profile Form
**File:** `frontend/src/pages/DoctorDashboard.jsx`
**Location:** Edit Profile View section (~line 450)
**Add:** Dropdown to select specialization from available specializations

### 2. Backend Endpoint
**File:** `backend/controllers/doctorProfileUpdate.js` or `backend/controllers/doctorSpecialization.js`
**Add to:** `updateDoctorBasicInfo` function
**Or use existing:** `saveDoctorSpecialization` endpoint

### 3. Frontend API Call
**File:** `frontend/src/pages/DoctorDashboard.jsx`
**Location:** Edit Profile update button onClick handler
**Add:** Call to update specialization

---

## 🎯 SOLUTION APPROACH

**Option 1: Add to Edit Profile (Recommended)**
1. Fetch all specializations when Edit Profile loads
2. Show dropdown with specializations
3. On save, call existing `POST /api/doctor/specialization` endpoint

**Option 2: Use Separate Page**
Keep using `SpecializationSetup.jsx` page (if it exists and works)

---

## 📋 CURRENT ENDPOINTS

| Method | Endpoint | Purpose | File |
|--------|----------|---------|------|
| GET | `/api/specialties` | Get all specializations | routes/auth.js |
| POST | `/api/doctor/specialization` | Save doctor specialization | doctorSpecialization.js |
| GET | `/api/doctor/profile/:email` | Get doctor profile (includes specialization) | doctorProfileUpdate.js |

---

Do you want me to:
1. Add specialization dropdown to Edit Profile?
2. Or show you the existing SpecializationSetup page?
