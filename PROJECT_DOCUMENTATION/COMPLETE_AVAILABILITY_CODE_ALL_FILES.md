# Complete Doctor Availability Code - All Files

## WHAT DIDN'T FIX?

Please tell me specifically what error you're seeing:
- 404 error on GET schedule?
- 500 error on PUT update-schedule?
- No backend logs showing?
- Schedule not saving?
- Something else?

---

## BACKEND CODE

### 1. Routes File: `backend/routes/auth.js`

```javascript
const express = require("express");
const router = express.Router();
const { signup, login } = require("../controllers/authController");
const {login: oldLogin}=require("../controllers/login");
const { getProfile, updateProfile } = require("../controllers/profile");
const timetableController = require("../controllers/timetable");
const appointmentController = require("../controllers/appointmentController");
const patientAppointmentsController = require("../controllers/patientAppointments");
const doctorAppointmentsController = require("../controllers/doctorAppointments");
const doctorProfileController = require("../controllers/doctorProfileUpdate");
const { saveDoctorSpecialization } = require("../controllers/doctorSpecialization");
const doctorRoutes = require("./doctorRoutes");
const patientProfileUpdate = require("../controllers/patientProfileUpdate");
const { authenticateToken, requirePatient } = require("../middleware/auth");

console.log("auth routes loaded");

// ... other routes ...

// ✅ AVAILABILITY ROUTES - These 3 lines are critical
router.post("/doctor/setup-schedule", timetableController.saveDoctorSchedule);
router.put("/doctor/update-schedule", timetableController.saveDoctorSchedule);
router.get("/doctor/schedule/:email", timetableController.getDoctorSchedule);

// ... other routes ...

module.exports = router;
```

**Check:** Are these 3 routes registered in your file?

---

### 2. Controller File: `backend/controllers/timetable.js`

```javascript
const connectDB = require("../db/connection");

const validDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

const isValidTime = (time) => {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
};

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes) => {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const generateAppointmentSlots = (startTime, endTime, intervalMinutes = 25) => {
  const slots = [];
  let current = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const interval = parseInt(intervalMinutes) || 25;

  while (current + interval <= end) {
    slots.push({
      startTime: minutesToTime(current),
      endTime: minutesToTime(current + interval)
    });
    current += interval;
  }

  return slots;
};

// ✅ GET DOCTOR SCHEDULE FUNCTION
exports.getDoctorSchedule = async (req, res) => {
  const { email } = req.params;

  console.log("Get doctor schedule request for:", email);

  if (!email) {
    return res.status(400).json({ error: "❌ Email is required" });
  }

  let connection;
  try {
    connection = await connectDB();

    // Get doctor ID
    const userResult = await connection.execute(
      `SELECT ID FROM USERS 
       WHERE TRIM(LOWER(EMAIL)) = TRIM(LOWER(:email))
         AND TRIM(UPPER(ROLE)) = 'DOCTOR'`,
      { email }
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Doctor not found" });
    }

    const userId = userResult.rows[0][0];

    const doctorResult = await connection.execute(
      `SELECT ID FROM DOCTOR WHERE USER_ID = :userId`,
      { userId }
    );

    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Doctor profile not found" });
    }

    const doctorId = doctorResult.rows[0][0];

    // Get all time slots for this doctor
    const slotsResult = await connection.execute(
      `SELECT DAY_OF_WEEK, START_TIME, END_TIME
       FROM TIME_SLOTS
       WHERE DOCTOR_ID = :doctorId
       ORDER BY 
         CASE DAY_OF_WEEK
           WHEN 'Sunday' THEN 1
           WHEN 'Monday' THEN 2
           WHEN 'Tuesday' THEN 3
           WHEN 'Wednesday' THEN 4
           WHEN 'Thursday' THEN 5
           WHEN 'Friday' THEN 6
           WHEN 'Saturday' THEN 7
         END,
         START_TIME`,
      { doctorId }
    );

    console.log(`Found ${slotsResult.rows.length} time slots for doctor`);

    // Group slots by day and calculate interval
    const daySchedules = {};
    
    slotsResult.rows.forEach(row => {
      const day = row[0];
      const startTime = row[1];
      const endTime = row[2];
      
      if (!daySchedules[day]) {
        daySchedules[day] = {
          slots: [],
          startTime: startTime,
          endTime: endTime
        };
      }
      
      daySchedules[day].slots.push({ startTime, endTime });
      
      // Update overall start/end times
      if (startTime < daySchedules[day].startTime) {
        daySchedules[day].startTime = startTime;
      }
      if (endTime > daySchedules[day].endTime) {
        daySchedules[day].endTime = endTime;
      }
    });

    // Calculate interval from first two slots of first day
    let calculatedInterval = 30; // default
    const firstDay = Object.keys(daySchedules)[0];
    if (firstDay && daySchedules[firstDay].slots.length >= 2) {
      const slot1Start = timeToMinutes(daySchedules[firstDay].slots[0].startTime);
      const slot1End = timeToMinutes(daySchedules[firstDay].slots[0].endTime);
      // Interval is the duration of one slot
      calculatedInterval = slot1End - slot1Start;
    }

    // Build schedule object for frontend
    const schedule = {};
    validDays.forEach(day => {
      if (daySchedules[day]) {
        schedule[day] = {
          selected: true,
          startTime: daySchedules[day].startTime,
          endTime: daySchedules[day].endTime,
          interval: calculatedInterval
        };
      } else {
        schedule[day] = {
          selected: false,
          startTime: '09:00',
          endTime: '17:00',
          interval: 30
        };
      }
    });

    console.log("Returning schedule:", schedule);

    res.json({ 
      success: true,
      schedule,
      totalSlots: slotsResult.rows.length
    });

  } catch (err) {
    console.error('Error fetching doctor schedule:', err);
    res.status(500).json({ error: '❌ Failed to fetch schedule' });
  } finally {
    if (connection) await connection.close();
  }
};

// ✅ SAVE/UPDATE DOCTOR SCHEDULE FUNCTION
exports.saveDoctorSchedule = async (req, res) => {
  const { email, schedule } = req.body;

  console.log("Save doctor schedule request received:", { email, schedule });

  if (!email || !schedule) {
    return res.status(400).json({ error: "❌ Email and schedule are required" });
  }

  let connection;

  try {
    connection = await connectDB();
    console.log("Connected to database");

    const userResult = await connection.execute(
      `SELECT ID FROM USERS 
       WHERE TRIM(LOWER(EMAIL)) = TRIM(LOWER(:email))
         AND TRIM(UPPER(ROLE)) = 'DOCTOR'`,
      { email }
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Doctor user not found" });
    }

    const userId = userResult.rows[0][0];
    console.log("Doctor user found, USERS.ID =", userId);

    const doctorResult = await connection.execute(
      `SELECT ID FROM DOCTOR WHERE USER_ID = :userId`,
      { userId }
    );

    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Doctor profile not found" });
    }

    const doctorId = doctorResult.rows[0][0];
    console.log("Doctor profile found, DOCTOR.ID =", doctorId);

    // ✅ DELETE ALL EXISTING TIME SLOTS (UNCONDITIONAL)
    const deleteResult = await connection.execute(
      `DELETE FROM TIME_SLOTS WHERE DOCTOR_ID = :doctorId`,
      { doctorId }
    );
    
    console.log("Old schedule deleted - removed", deleteResult.rowsAffected, "slots");
    console.log("Note: Existing appointments are preserved and will still show in dashboards");

    let totalSlotsCreated = 0;
    
    // ✅ INSERT NEW SLOTS FOR SELECTED DAYS
    for (const day of Object.keys(schedule)) {
      const dayData = schedule[day];

      if (!validDays.includes(day)) {
        await connection.rollback();
        return res.status(400).json({ error: `❌ Invalid day: ${day}` });
      }

      if (dayData.selected) {
        const { startTime, endTime, interval } = dayData;

        if (!startTime || !endTime) {
          await connection.rollback();
          return res.status(400).json({
            error: `❌ Start time and end time are required for ${day}`
          });
        }

        if (!isValidTime(startTime) || !isValidTime(endTime)) {
          await connection.rollback();
          return res.status(400).json({
            error: `❌ Invalid time format for ${day}. Use HH:MM in 24-hour format`
          });
        }

        if (startTime >= endTime) {
          await connection.rollback();
          return res.status(400).json({
            error: `❌ Start time must be earlier than end time for ${day}`
          });
        }

        const appointmentInterval = interval || 25;
        const slots = generateAppointmentSlots(startTime, endTime, appointmentInterval);
        
        console.log(`📅 ${day}: Generated ${slots.length} slots from ${startTime} to ${endTime} (${appointmentInterval} min intervals)`);

        for (const slot of slots) {
          await connection.execute(
            `INSERT INTO TIME_SLOTS
              (ID, START_TIME, END_TIME, STATUS, DOCTOR_ID, DAY_OF_WEEK)
             VALUES
              (TIME_SLOTS_SEQ.NEXTVAL, :startTime, :endTime, :status, :doctorId, :day)`,
            {
              startTime: slot.startTime,
              endTime: slot.endTime,
              status: "AVAILABLE",
              doctorId,
              day
            }
          );
          totalSlotsCreated++;
        }
      }
    }

    await connection.commit();
    console.log("Doctor schedule saved successfully");

    return res.status(200).json({
      message: `✅ Doctor schedule saved successfully! Created ${totalSlotsCreated} appointment slots.`,
      slotsCreated: totalSlotsCreated
    });
  } catch (err) {
    console.error("Save schedule error:", err);

    if (connection) {
      try {
        await connection.rollback();
        console.log("Transaction rolled back");
      } catch (rollbackErr) {
        console.error("Rollback error:", rollbackErr);
      }
    }

    return res.status(500).json({ error: "❌ Failed to save doctor schedule" });
  } finally {
    if (connection) {
      await connection.close();
      console.log("Database connection closed");
    }
  }
};

// ✅ CRITICAL: Export the module
module.exports = exports;
```

**Check:** Does your file have `module.exports = exports;` at the very end?

---

## FRONTEND CODE

### 3. Frontend File: `frontend/src/pages/DoctorDashboard.jsx`

```javascript
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/DoctorDashboard.css";

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('appointments');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [scheduleLoaded, setScheduleLoaded] = useState(false);
  
  // ✅ SCHEDULE STATE
  const [schedule, setSchedule] = useState({
    Sunday: { selected: false, startTime: '09:00', endTime: '17:00', interval: 30 },
    Monday: { selected: false, startTime: '09:00', endTime: '17:00', interval: 30 },
    Tuesday: { selected: false, startTime: '09:00', endTime: '17:00', interval: 30 },
    Wednesday: { selected: false, startTime: '09:00', endTime: '17:00', interval: 30 },
    Thursday: { selected: false, startTime: '09:00', endTime: '17:00', interval: 30 },
    Friday: { selected: false, startTime: '09:00', endTime: '17:00', interval: 30 },
    Saturday: { selected: false, startTime: '09:00', endTime: '17:00', interval: 30 }
  });

  // ✅ FETCH SCHEDULE ON MOUNT
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData.token || userData.role?.toUpperCase() !== 'DOCTOR') {
      navigate('/login');
      return;
    }
    setUser(userData);
    fetchDoctorSchedule(userData.email);  // ← Fetch schedule here
  }, [navigate]);

  // ✅ FETCH DOCTOR SCHEDULE FUNCTION
  const fetchDoctorSchedule = async (email) => {
    try {
      console.log('🔍 Fetching doctor schedule for:', email);
      const res = await fetch(`http://localhost:3000/api/doctor/schedule/${email}`);
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Schedule data received:', data);
        if (data.schedule) {
          setSchedule(data.schedule);
          setScheduleLoaded(true);
        }
      } else {
        console.log('⚠️ No existing schedule found, using defaults');
        setScheduleLoaded(false);
      }
    } catch (err) {
      console.error('❌ Error fetching doctor schedule:', err);
      setScheduleLoaded(false);
    }
  };

  // ✅ HANDLE SCHEDULE CHANGE
  const handleScheduleChange = (day, field, value) => {
    setSchedule({
      ...schedule,
      [day]: {
        ...schedule[day],
        [field]: value
      }
    });
  };

  // ✅ SAVE AVAILABILITY FUNCTION
  const handleSaveAvailability = async () => {
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('http://localhost:3000/api/doctor/update-schedule', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          schedule
        })
      });

      const result = await res.json();

      if (res.ok) {
        setMessage('✅ ' + result.message);
        // Refresh schedule from database
        await fetchDoctorSchedule(user.email);
        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessage('❌ ' + (result.error || 'Failed to save availability'));
      }
    } catch (err) {
      console.error('Error saving availability:', err);
      setMessage('❌ Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="doctor-dashboard-new">
      {/* ... header and sidebar ... */}

      <main className="doctor-main">
        {message && <div className={`doctor-message ${message.includes('✅') ? 'success' : 'error'}`}>{message}</div>}

        {/* ✅ AVAILABILITY VIEW */}
        {activeView === 'availability' && (
          <div className="availability-view">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h1>Availability Schedule</h1>
              <button 
                onClick={() => fetchDoctorSchedule(user.email)}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                🔄 Refresh
              </button>
            </div>
            
            {/* ✅ GREEN BANNER - Schedule exists */}
            {scheduleLoaded && (
              <div style={{
                padding: '0.75rem 1rem',
                background: '#d1fae5',
                border: '1px solid #10b981',
                borderRadius: '6px',
                marginBottom: '1rem',
                color: '#065f46',
                fontSize: '0.9rem'
              }}>
                ✅ Showing your current availability schedule from database
              </div>
            )}
            
            {/* ✅ YELLOW BANNER - No schedule */}
            {!scheduleLoaded && (
              <div style={{
                padding: '0.75rem 1rem',
                background: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '6px',
                marginBottom: '1rem',
                color: '#92400e',
                fontSize: '0.9rem'
              }}>
                ℹ️ No schedule found. Set your availability below and click Save.
              </div>
            )}
            
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Set your working hours for each day. Appointment slots will be generated based on your interval.
            </p>
            
            {/* ✅ SCHEDULE FORM */}
            <div className="availability-form">
              {DAYS.map((day) => (
                <div key={day} className={`day-schedule ${schedule[day].selected ? 'active' : ''}`}>
                  <div className="day-header">
                    <input
                      type="checkbox"
                      className="day-checkbox"
                      checked={schedule[day].selected}
                      onChange={(e) => handleScheduleChange(day, 'selected', e.target.checked)}
                    />
                    <span className="day-name">{day}</span>
                  </div>
                  
                  {schedule[day].selected && (
                    <div className="time-inputs">
                      <div className="time-input-group">
                        <label>Start Time</label>
                        <input
                          type="time"
                          value={schedule[day].startTime}
                          onChange={(e) => handleScheduleChange(day, 'startTime', e.target.value)}
                        />
                      </div>
                      <div className="time-input-group">
                        <label>End Time</label>
                        <input
                          type="time"
                          value={schedule[day].endTime}
                          onChange={(e) => handleScheduleChange(day, 'endTime', e.target.value)}
                        />
                      </div>
                      <div className="time-input-group">
                        <label>Interval (minutes)</label>
                        <select
                          value={schedule[day].interval}
                          onChange={(e) => handleScheduleChange(day, 'interval', parseInt(e.target.value))}
                        >
                          <option value="15">15 minutes</option>
                          <option value="20">20 minutes</option>
                          <option value="25">25 minutes</option>
                          <option value="30">30 minutes</option>
                          <option value="45">45 minutes</option>
                          <option value="60">60 minutes</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* ✅ SAVE BUTTON */}
              <button 
                className="save-availability-btn"
                onClick={handleSaveAvailability}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Availability'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
```

---

## DATABASE SQL

### 4. Foreign Key Constraint Fix: `FIX_TIMESLOT_CONSTRAINT.sql`

```sql
-- Step 1: Make sure TIME_SLOT_ID column allows NULL values
ALTER TABLE DOCTORS_APPOINTMENTS
MODIFY TIME_SLOT_ID NUMBER NULL;

-- Step 2: Drop the existing constraint
ALTER TABLE DOCTORS_APPOINTMENTS
DROP CONSTRAINT FK_DOCTOR_APPOINTMENT_TIMESLOT;

-- Step 3: Recreate the constraint with ON DELETE SET NULL
ALTER TABLE DOCTORS_APPOINTMENTS
ADD CONSTRAINT FK_DOCTOR_APPOINTMENT_TIMESLOT
FOREIGN KEY (TIME_SLOT_ID) REFERENCES TIME_SLOTS(ID)
ON DELETE SET NULL;

-- Step 4: Commit the changes
COMMIT;

-- Step 5: Verify the fix
SELECT 
  constraint_name,
  constraint_type,
  delete_rule,
  status
FROM user_constraints
WHERE constraint_name = 'FK_DOCTOR_APPOINTMENT_TIMESLOT';

-- Expected result: DELETE_RULE should be 'SET NULL'
```

**Run this SQL in your database if you haven't already!**

---

## CHECKLIST - WHAT TO VERIFY

### Backend Checks:
1. ✅ `backend/routes/auth.js` has these 3 lines:
   ```javascript
   router.post("/doctor/setup-schedule", timetableController.saveDoctorSchedule);
   router.put("/doctor/update-schedule", timetableController.saveDoctorSchedule);
   router.get("/doctor/schedule/:email", timetableController.getDoctorSchedule);
   ```

2. ✅ `backend/controllers/timetable.js` has `module.exports = exports;` at the END

3. ✅ `backend/controllers/timetable.js` has `getDoctorSchedule` function

4. ✅ `backend/controllers/timetable.js` has `saveDoctorSchedule` function

5. ✅ Backend server is RESTARTED after code changes

### Frontend Checks:
1. ✅ `frontend/src/pages/DoctorDashboard.jsx` has `fetchDoctorSchedule` function

2. ✅ `useEffect` calls `fetchDoctorSchedule(userData.email)` on mount

3. ✅ `handleSaveAvailability` calls `PUT /api/doctor/update-schedule`

4. ✅ After save, it calls `fetchDoctorSchedule` again to refresh

### Database Checks:
1. ✅ Run the SQL script `FIX_TIMESLOT_CONSTRAINT.sql`

2. ✅ Verify constraint with:
   ```sql
   SELECT constraint_name, delete_rule, status
   FROM user_constraints
   WHERE constraint_name = 'FK_DOCTOR_APPOINTMENT_TIMESLOT';
   ```
   Should show: `DELETE_RULE = SET NULL`, `STATUS = ENABLED`

---

## TESTING STEPS

### Test 1: Check if routes are registered
```bash
# Start backend server
cd backend
node server.js

# Look for this in terminal:
# "auth routes loaded"
# "✅ All auth routes registered successfully"
```

### Test 2: Test GET schedule endpoint
```bash
# In browser console or Postman:
GET http://localhost:3000/api/doctor/schedule/doe@gmail.com

# Expected responses:
# - If schedule exists: { success: true, schedule: {...}, totalSlots: 48 }
# - If no schedule: { error: "❌ Doctor not found" } (404)
```

### Test 3: Test PUT update-schedule endpoint
```bash
# In browser console or Postman:
PUT http://localhost:3000/api/doctor/update-schedule
Content-Type: application/json

{
  "email": "doe@gmail.com",
  "schedule": {
    "Monday": { "selected": true, "startTime": "09:00", "endTime": "17:00", "interval": 30 },
    "Tuesday": { "selected": false, "startTime": "09:00", "endTime": "17:00", "interval": 30 },
    ...
  }
}

# Expected response:
# { message: "✅ Doctor schedule saved successfully! Created 16 appointment slots.", slotsCreated: 16 }
```

### Test 4: Check backend logs
When you save from the website, you should see in backend terminal:
```
Save doctor schedule request received: { email: 'doe@gmail.com', schedule: {...} }
Connected to database
Doctor user found, USERS.ID = 5
Doctor profile found, DOCTOR.ID = 3
Old schedule deleted - removed 48 slots
Note: Existing appointments are preserved and will still show in dashboards
📅 Monday: Generated 16 slots from 09:00 to 17:00 (30 min intervals)
Doctor schedule saved successfully
Database connection closed
```

---

## COMMON ISSUES AND FIXES

### Issue 1: 404 Error on GET /api/doctor/schedule/:email
**Cause:** Route not registered or `getDoctorSchedule` function missing
**Fix:** 
- Check `backend/routes/auth.js` has the GET route
- Check `backend/controllers/timetable.js` has `exports.getDoctorSchedule`
- Restart backend server

### Issue 2: 500 Error on PUT /api/doctor/update-schedule
**Cause:** Missing `module.exports` or database error
**Fix:**
- Add `module.exports = exports;` at end of `timetable.js`
- Check backend terminal for error details
- Restart backend server

### Issue 3: No backend logs showing
**Cause:** Server not restarted or wrong server running
**Fix:**
- Stop backend server (Ctrl+C)
- Start again: `node server.js`
- Make sure you're looking at the correct terminal

### Issue 4: Schedule saves but doesn't remove unchecked days
**Cause:** Conditional DELETE query or foreign key constraint
**Fix:**
- Change DELETE to: `DELETE FROM TIME_SLOTS WHERE DOCTOR_ID = :doctorId`
- Run `FIX_TIMESLOT_CONSTRAINT.sql` to fix foreign key
- Restart backend server

### Issue 5: Frontend shows yellow banner even after saving
**Cause:** `fetchDoctorSchedule` not called after save
**Fix:**
- Check `handleSaveAvailability` has `await fetchDoctorSchedule(user.email);` after successful save
- Check browser console for fetch errors

---

## WHAT SPECIFICALLY DIDN'T FIX?

Please provide:
1. **Error message** you're seeing (exact text)
2. **Browser console logs** (press F12, check Console tab)
3. **Backend terminal logs** (what shows when you try to save)
4. **Which step fails:**
   - Can't fetch existing schedule?
   - Can't save new schedule?
   - Saves but doesn't update?
   - Something else?

With this information, I can pinpoint the exact issue!
