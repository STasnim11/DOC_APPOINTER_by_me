# 📍 ALL CODE LOCATIONS - SQL Function Usage

## 1️⃣ SQL FUNCTION (Database)
**File**: `sql/CREATE_FUNCTION_APPOINTMENT_COUNT.sql`
**Status**: ✅ CREATED (you already ran this)

```sql
CREATE OR REPLACE FUNCTION fn_get_doctor_appointment_count(
  p_doctor_id IN NUMBER
) RETURN NUMBER
IS
  v_count NUMBER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM DOCTORS_APPOINTMENTS
  WHERE DOCTOR_ID = p_doctor_id;
  
  RETURN v_count;
END;
/
```

---

## 2️⃣ BACKEND CONTROLLER
**File**: `backend/controllers/databaseFeaturesController.js`
**Lines**: 1-28

```javascript
const connectDB = require('../db/connection');

// Use Function: Get doctor appointment count
exports.getDoctorAppointmentCount = async (req, res) => {
  const { doctorId } = req.params;
  console.log('🔧 getDoctorAppointmentCount called with doctorId:', doctorId);
  let connection;
  
  try {
    connection = await connectDB();
    console.log('📊 Executing SQL function: fn_get_doctor_appointment_count');
    
    const result = await connection.execute(
      `SELECT fn_get_doctor_appointment_count(:doctorId) as APPOINTMENT_COUNT FROM DUAL`,
      { doctorId }
    );

    const count = result.rows[0][0];
    console.log('✅ Function returned count:', count);
    res.status(200).json({ doctorId, appointmentCount: count });
  } catch (err) {
    console.error('❌ Error getting appointment count:', err);
    res.status(500).json({ error: 'Failed to get appointment count' });
  } finally {
    if (connection) await connection.close();
  }
};
```

---

## 3️⃣ BACKEND ROUTE
**File**: `backend/routes/doctorRoutes.js`
**Line**: 22

```javascript
// GET total appointment count for doctor (uses SQL function)
router.get("/appointment-count/:doctorId", databaseFeaturesController.getDoctorAppointmentCount);
```

**Full URL**: `http://localhost:3000/api/doctor/appointment-count/41`

---

## 4️⃣ FRONTEND FUNCTION
**File**: `frontend/src/pages/DoctorDashboard.jsx`
**Lines**: 211-227

```javascript
const fetchTotalAppointments = async (doctorId) => {
  console.log('🔍 fetchTotalAppointments called with doctorId:', doctorId);
  try {
    const url = `http://localhost:3000/api/doctor/appointment-count/${doctorId}`;
    console.log('📡 Fetching from:', url);
    
    const res = await fetch(url);
    console.log('📥 Response status:', res.status);
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Response data:', data);
      setTotalAppointments(data.appointmentCount || 0);
    } else {
      console.error('❌ Response not OK:', res.status, res.statusText);
    }
  } catch (err) {
    console.error('❌ Error fetching total appointments:', err);
  }
};
```

---

## 5️⃣ WHERE IT'S CALLED
**File**: `frontend/src/pages/DoctorDashboard.jsx`
**Lines**: 82-107 (inside `fetchDoctorProfile`)

```javascript
const fetchDoctorProfile = async (email) => {
  try {
    const res = await fetch(`http://localhost:3000/api/doctor/profile/${email}`);
    if (res.ok) {
      const data = await res.json();
      setDoctorProfile(data);
      
      // 👇 THIS IS WHERE IT SHOULD BE CALLED
      if (data.doctorId) {
        fetchTotalAppointments(data.doctorId);  // ← CALLS THE FUNCTION
      }
      
      // ... rest of code
    }
  } catch (err) {
    // Error fetching profile
  }
};
```

---

## 6️⃣ WHERE IT'S DISPLAYED
**File**: `frontend/src/pages/DoctorDashboard.jsx`
**Lines**: ~680-690 (in the JSX)

```javascript
<div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
  <div className="today-count-badge">
    📊 Today's Patients: <strong>{todayCount}</strong>
  </div>
  <div className="today-count-badge" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
    📈 Total Appointments: <strong>{totalAppointments}</strong>
  </div>
</div>
```

---

## 🔍 DEBUGGING CHECKLIST

### Check 1: Is the function being called?
Open browser console (F12) and look for:
```
🔍 fetchTotalAppointments called with doctorId: 41
```

**If you DON'T see this** → The function isn't being called at all!

### Check 2: Is doctorId in the profile response?
Look in browser console Network tab:
- Find request to: `/api/doctor/profile/doe@gmail.com`
- Check response - does it have `doctorId: 41`?

### Check 3: Is the route registered?
Backend should show on startup:
```
DOCTOR ROUTES LOADED
```

### Check 4: Test the API directly
Open a new browser tab and go to:
```
http://localhost:3000/api/doctor/appointment-count/41
```

You should see:
```json
{"doctorId":"41","appointmentCount":10}
```

---

## 🚨 MOST LIKELY ISSUE

The profile response probably doesn't include `doctorId`. Let me check what the profile endpoint returns!
