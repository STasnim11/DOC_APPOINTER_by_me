# Fix Missing Authorization Headers - Implementation Guide

## Problem
Many fetch() calls in dashboards don't include the Authorization header, causing 401 errors on protected routes.

## Solution
Use the `getAuthHeaders()` utility function for all authenticated API calls.

## Files to Fix

### ✅ COMPLETED:
1. `frontend/src/utils/api.js` - Created utility functions
2. `frontend/src/pages/PatientDashboard.jsx` - Added import and fixed 2 fetch calls

### 🔧 TO FIX:

#### frontend/src/pages/DoctorDashboard.jsx
Add import:
```javascript
import { getAuthHeaders } from '../utils/api';
```

Fix these fetch calls (add `headers: getAuthHeaders()`):
- Line ~66: `fetchDoctorSchedule` - GET /api/doctor/schedule/:email
- Line ~86: `fetchDoctorProfile` - GET /api/doctor/profile/:email  
- Line ~142: `fetchAppointments` - GET /api/doctor/appointments/:email
- Line ~160: `fetchPrescription` - GET /api/prescriptions/:id
- Line ~183: `completeAppointment` - PUT /api/doctor/appointments/:id/complete
- Line ~205: `fetchTodayCount` - GET /api/doctor/appointments/:email/today-count
- Line ~221: `fetchTotalAppointments` - GET /api/doctor/:doctorId/appointment-count
- Line ~252: `handleSaveAvailability` - PUT /api/doctor/update-schedule
- Line ~1036: `updateProfile` - PUT /api/profile/update
- Line ~1054: `updateDoctorProfile` - PUT /api/doctor/profile/update
- Line ~1075: `saveDoctorSpecialization` - POST /api/doctor/specialization

#### frontend/src/pages/PatientDashboard.jsx (Remaining)
Fix these fetch calls:
- Line ~201: `fetchPrescription` - GET /api/prescriptions/:id
- Line ~234-235: `fetchLabTestsAndTechs` - GET /api/lab-tests, /api/medical-technicians
- Line ~260: `fetchAvailableBeds` - GET /api/beds/available
- Line ~284: `bookBed` - POST /api/bed-bookings
- Line ~333: `fetchBedBookings` - GET /api/patient/:email/bed-bookings
- Line ~357: `bookLabTest` - POST /api/lab-test-appointments
- Line ~403: `fetchLabTests` - GET /api/patient/:email/lab-tests

#### frontend/src/pages/AdminDashboard.jsx
All admin routes already have token in fetchData() function, but verify:
- Check all fetch calls include Authorization header

#### frontend/src/pages/WritePrescription.jsx
Check and fix if needed

#### frontend/src/pages/SpecializationSetup.jsx
Check and fix if needed

## Pattern to Follow

### Before (❌ Missing Auth):
```javascript
const res = await fetch('http://localhost:3000/api/doctor/profile/email@test.com');
```

### After (✅ With Auth):
```javascript
const res = await fetch('http://localhost:3000/api/doctor/profile/email@test.com', {
  headers: getAuthHeaders()
});
```

### For POST/PUT/DELETE with body:
```javascript
const res = await fetch('http://localhost:3000/api/doctor/update-schedule', {
  method: 'PUT',
  headers: getAuthHeaders(),
  body: JSON.stringify(data)
});
```

## Alternative: Use authFetch wrapper
Instead of manual headers, use the wrapper:
```javascript
import { authFetch, authGet, authPost, authPut, authDelete } from '../utils/api';

// GET
const res = await authGet('http://localhost:3000/api/doctor/profile/email');

// POST
const res = await authPost('http://localhost:3000/api/appointments/book', appointmentData);

// PUT
const res = await authPut('http://localhost:3000/api/doctor/update-schedule', scheduleData);

// DELETE
const res = await authDelete('http://localhost:3000/api/appointments/123');
```

## Testing Checklist
After fixing each file:
- [ ] Open browser DevTools → Network tab
- [ ] Perform actions that trigger API calls
- [ ] Verify each request has `Authorization: Bearer <token>` header
- [ ] Verify no 401 Unauthorized errors
- [ ] Test all CRUD operations (Create, Read, Update, Delete)

## Priority Order
1. **HIGH**: DoctorDashboard.jsx - Most critical, many protected routes
2. **HIGH**: PatientDashboard.jsx - Remaining fetch calls
3. **MEDIUM**: WritePrescription.jsx
4. **LOW**: SpecializationSetup.jsx
5. **VERIFY**: AdminDashboard.jsx

## Notes
- Public routes (login, signup, browse doctors) don't need auth headers
- The `getAuthHeaders()` function automatically checks for token existence
- If token is missing, it won't add the Authorization header (graceful degradation)
- Always test after fixing to ensure no regressions
