# UI/UX Improvements - TODO List

## Issues to Fix:

### 1. Remove Refresh Button & Console Logs (Doctor Availability)
**Location:** `frontend/src/pages/DoctorDashboard.jsx`
- Remove the 🔄 Refresh button from availability section
- Remove all console.log statements

### 2. Fix "Type: General" in Appointments
**Issue:** Appointments show "Type: General" 
**Source:** `backend/controllers/appointmentController.js` - default value when booking
**Fix:** Make type optional or remove from display if it's just "General"

### 3. Fix Negative Experience Years
**Location:** `frontend/src/pages/DoctorDashboard.jsx` - Edit Profile form
**Fix:** Add `min="0"` to experience years input field

### 4. Improve Cancel Appointment Message
**Issue:** Shows "localStorage says..." - not professional
**Location:** `frontend/src/pages/PatientDashboard.jsx`
**Fix:** Show proper success/error messages

### 5. Add Appointment Filters to Patient Dashboard
**Add filters:**
- All (show nearest first)
- Today
- Upcoming
- Completed
- Cancelled

### 6. Improve Patient Dashboard UI
- Better card design
- Color coding for status
- Icons for different sections
- Responsive layout

### 7. Admin Panel Delete Error Messages
**Issue:** When deleting department/branch that has dependencies, no user-friendly message
**Fix:** Add beautiful error messages explaining why deletion failed

---

## Implementation Plan:

I'll create the fixes but won't apply them automatically. I'll show you each change and you can approve before I apply it.

Would you like me to:
1. Show you the fixes one by one?
2. Create all fix files and let you review?
3. Apply specific fixes you approve?

Please let me know which approach you prefer!
