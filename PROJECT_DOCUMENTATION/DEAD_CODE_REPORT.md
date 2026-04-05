# Dead Code Report - DOCAPPOINTER

**Date**: Generated during code cleanup
**Status**: All dead code has been commented with clear markers

---

## Summary

This document lists all dead code (unused files, routes, imports, and functions) that have been identified and commented in the codebase.

---

## 1. Dead Controller Files

### backend/controllers/login.js
- **Status**: ENTIRE FILE UNUSED
- **Reason**: Replaced by `authController.js`
- **Imported in**: `routes/auth.js` (as `oldLogin`)
- **Used**: Never
- **Action**: Commented with dead code marker at top of file
- **Can be deleted**: Yes

### backend/controllers/analyticsController.js
- **Status**: ALL 5 FUNCTIONS UNUSED
- **Functions**:
  - `getDepartmentStatistics`
  - `getBranchResourceAllocation`
  - `getTopDoctors`
  - `getMedicineUsageAnalysis`
  - `getPatientTreatmentSummary`
- **Reason**: Frontend uses `/db-features/stats` instead (which uses SQL functions)
- **Routes**: All 5 routes commented out in `adminRoutes.js`
- **Action**: Commented with dead code marker at top of file
- **Can be deleted**: Yes (or kept for future integration)

---

## 2. Dead Route Files

### backend/routes/doctorRoutes.js
- **Status**: ENTIRE FILE UNUSED
- **Reason**: All doctor routes are already defined in `routes/auth.js`
- **Imported in**: 
  - `server.js` (mounted at `/api/doctor`)
  - `routes/auth.js` (imported but never used)
- **Problem**: Creates duplicate routes
- **Action**: 
  - Commented with dead code marker at top of file
  - Import commented out in `server.js`
  - Import commented out in `routes/auth.js`
- **Can be deleted**: Yes

---

## 3. Dead Imports

### backend/routes/auth.js
**Line 4** (commented out):
```javascript
// DEAD CODE: Old login controller replaced by authController
// const {login: oldLogin}=require("../controllers/login");
```

**Line 13** (commented out):
```javascript
// DEAD CODE: doctorRoutes file is unused - all doctor routes are in this file
// const doctorRoutes = require("./doctorRoutes");
```

### backend/routes/adminRoutes.js
**Line 9** (commented out):
```javascript
// DEAD CODE: analyticsController is not used - all analytics routes commented out
// const analyticsController = require('../controllers/analyticsController');
```

### backend/server.js
**Line 13** (commented out):
```javascript
// DEAD CODE: doctorRoutes file is unused - all doctor routes are in auth.js
// const doctorRoutes = require('./routes/doctorRoutes');
```

**Line 28** (commented out):
```javascript
// DEAD CODE: doctorRoutes mounted here but all routes already in auth.js at /api/doctor/*
// app.use('/api/doctor', doctorRoutes);
```

---

## 4. Dead Routes

### backend/routes/auth.js
**Line 79** (commented out):
```javascript
// DEAD CODE: Duplicate route - use /doctor/profile/update instead
// router.put("/doctor/profile", requireDoctor, doctorProfileController.updateDoctorProfile);
```
- **Reason**: Duplicate of `/doctor/profile/update`
- **Used by**: Nothing (frontend uses `/doctor/profile/update`)

### backend/routes/adminRoutes.js
**Lines 45-49** (commented out):
```javascript
// ============================================
// DEAD CODE: Analytics Routes (Complex Queries)
// These routes exist but are NOT used in the frontend
// The frontend uses /db-features/stats instead
// ============================================
// router.get('/analytics/department-statistics', analyticsController.getDepartmentStatistics);
// router.get('/analytics/branch-allocation', analyticsController.getBranchResourceAllocation);
// router.get('/analytics/top-doctors', analyticsController.getTopDoctors);
// router.get('/analytics/medicine-usage', analyticsController.getMedicineUsageAnalysis);
// router.get('/analytics/patient-summary', analyticsController.getPatientTreatmentSummary);
```
- **Reason**: Never called from frontend
- **Alternative**: Frontend uses `/db-features/stats` which calls SQL functions

---

## 5. Active Routes (For Reference)

### Database Features Routes (USED)
These routes ARE actively used and should NOT be deleted:
- `GET /api/admin/db-features/stats` - Used in AdminDashboard
- `GET /api/admin/db-features/doctor/:doctorId/appointments` - Uses SQL function
- `GET /api/admin/db-features/patient/:patientId/expenses` - Uses SQL function
- `GET /api/admin/db-features/branch/:branchId/occupancy` - Uses SQL function
- `POST /api/admin/db-features/book-appointment` - Uses stored procedure
- `POST /api/admin/db-features/generate-bill` - Uses stored procedure
- `POST /api/admin/db-features/update-stock` - Uses stored procedure

---

## Cleanup Recommendations

### Safe to Delete (After Testing)
1. `backend/controllers/login.js` - Completely replaced
2. `backend/routes/doctorRoutes.js` - Duplicate routes
3. `backend/controllers/analyticsController.js` - Unused (or keep for future)

### Keep (Already Commented)
All dead imports and routes are commented out with clear markers. The code still compiles and runs correctly.

---

## Testing Checklist

Before deleting any files, verify:
- [ ] Backend starts without errors
- [ ] All authentication works (login, signup)
- [ ] Doctor dashboard loads and functions
- [ ] Patient dashboard loads and functions
- [ ] Admin dashboard loads and functions
- [ ] All API endpoints respond correctly
- [ ] No console errors in browser or server

---

## Notes

- All dead code is marked with clear comment blocks
- Dead imports are commented out to prevent errors
- Dead routes are commented out but can be uncommented if needed
- The analytics routes could be integrated in the future if needed
