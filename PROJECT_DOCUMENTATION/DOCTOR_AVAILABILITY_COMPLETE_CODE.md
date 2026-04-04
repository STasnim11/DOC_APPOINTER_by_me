# DOCTOR AVAILABILITY - COMPLETE CODE REFERENCE

## OVERVIEW
Complete code for doctor availability management: save, show, and update schedule with time slot generation.

---

## TABLE STRUCTURE

### TIME_SLOTS Table
```sql
CREATE TABLE TIME_SLOTS (
  ID NUMBER PRIMARY KEY,
  DOCTOR_ID NUMBER NOT NULL,
  DAY_OF_WEEK VARCHAR2(20) NOT NULL,  -- 'Monday', 'Tuesday', etc.
  START_TIME VARCHAR2(5) NOT NULL,     -- 'HH:MM' format (e.g., '09:00')
  END_TIME VARCHAR2(5) NOT NULL,       -- 'HH:MM' format (e.g., '09:30')
  STATUS VARCHAR2(20) DEFAULT 'AVAILABLE',  -- 'AVAILABLE', 'BOOKED'
  CONSTRAINT FK_TIME_SLOTS_DOCTOR FOREIGN KEY (DOCTOR_ID) REFERENCES DOCTOR(ID)
);

-- Sequence for auto-increment
CREATE SEQUENCE TIME_SLOTS_SEQ START WITH 1 INCREMENT BY 1;
```

---

## BACKEND CODE

### 1. Main Controller: `backend/controllers/timetable.js`

#### Save Doctor Schedule Function

```javascript
const connectDB = require("../db/connection");

const validDays = [
  "Sunday", "Monday", "Tuesday", "Wednesday", 
  "Thursday", "Friday", "Saturday"
];

// Helper: Validate time format (HH:MM)
const isValidTime = (time) => {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
};

// Helper: Convert time to minutes
const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// Helper: Convert minutes to time
const minutesToTime = (totalMinutes) => {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
};

// Helper: Generate appointment slots based on interval
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

/**
 * Save Doctor Schedule
 * POST /api/doctor/setup-schedule
 * PUT /api/doctor/update-schedule
 * 
 * Request Body:
 * {
 *   email: "doctor@example.com",
 *   schedule: {
 *     Monday: { selected: true, startTime: "09:00", endTime: "17:00", interval: 30 },
 *     Tuesday: { selected: false },
 *     ...
 *   }
 * }
 */
exports.saveDoctorSchedule = async (req, res) => {
  const { email, schedule } = req.body;

  console.log("Save doctor schedule request received:", { email, schedule });

  // Validate input
  if (!email || !schedule) {
    return res.status(400).json({ error: "❌ Email and schedule are required" });
  }

  let connection;

  try {
    connection = await connectDB();
    console.log("Connected to database");

    // 1. Get user ID from USERS table
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

    // 2. Get doctor ID from DOCTOR table
    const doctorResult = await connection.execute(
      `SELECT ID FROM DOCTOR WHERE USER_ID = :userId`,
      { userId }
    );

    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Doctor profile not found" });
    }

    const doctorId = doctorResult.rows[0][0];
    console.log("Doctor profile found, DOCTOR.ID =", doctorId);

    // 3. Delete existing time slots for this doctor
    await connection.execute(
      `DELETE FROM TIME_SLOTS WHERE DOCTOR_ID = :doctorId`,
      { doctorId }
    );
    console.log("Old schedule deleted");

    let totalSlotsCreated = 0;
    
    // 4. Insert new time slots for each selected day
    for (const day of Object.keys(schedule)) {
      const dayData = schedule[day];

      // Validate day name
      if (!validDays.includes(day)) {
        await connection.rollback();
        return res.status(400).json({ error: `❌ Invalid day: ${day}` });
      }

      // Only process selected days
      if (dayData.selected) {
        const { startTime, endTime, interval } = dayData;

        // Validate required fields
        if (!startTime || !endTime) {
          await connection.rollback();
          return res.status(400).json({
            error: `❌ Start time and end time are required for ${day}`
          });
        }

        // Validate time format
        if (!isValidTime(startTime) || !isValidTime(endTime)) {
          await connection.rollback();
          return res.status(400).json({
            error: `❌ Invalid time format for ${day}. Use HH:MM in 24-hour format`
          });
        }

        // Validate time range
        if (startTime >= endTime) {
          await connection.rollback();
          return res.status(400).json({
            error: `❌ Start time must be earlier than end time for ${day}`
          });
        }

        // Generate appointment slots based on interval
        const appointmentInterval = interval || 25;
        const slots = generateAppointmentSlots(startTime, endTime, appointmentInterval);
        
        console.log(`📅 ${day}: Generated ${slots.length} slots from ${startTime} to ${endTime} (${appointmentInterval} min intervals)`);

        // Insert each slot into database
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

    // 5. Commit transaction
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
```

---

### 2. Routes: `backend/routes/auth.js`

```javascript
const timetableController = require("../controllers/timetable");

// Save/Update doctor schedule
router.post("/doctor/setup-schedule", timetableController.saveDoctorSchedule);
router.put("/doctor/update-schedule", timetableController.saveDoctorSchedule);
```

---

## FRONTEND CODE

### 1. Doctor Dashboard: `frontend/src/pages/DoctorDashboard.jsx`

#### State Management

```javascript
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import '../styles/DoctorDashboard.css';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('appointments');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Days of the week
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Schedule state - one object per day
  const [schedule, setSchedule] = useState({
    Sunday: { selected: false, startTime: '09:00', endTime: '17:00', interval: 30 },
    Monday: { selected: false, startTime: '09:00', endTime: '17:00', interval: 30 },
    Tuesday: { selected: false, startTime: '09:00', endTime: '17:00', interval: 30 },
    Wednesday: { selected: false, startTime: '09:00', endTime: '17:00', interval: 30 },
    Thursday: { selected: false, startTime: '09:00', endTime: '17:00', interval: 30 },
    Friday: { selected: false, startTime: '09:00', endTime: '17:00', interval: 30 },
    Saturday: { selected: false, startTime: '09:00', endTime: '17:00', interval: 30 }
  });

  // Check authentication on mount
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData.token || userData.role?.toUpperCase() !== 'DOCTOR') {
      navigate('/login');
      return;
    }
    setUser(userData);
  }, [navigate]);
```

#### Handle Schedule Changes

```javascript
  // Update schedule for a specific day and field
  const handleScheduleChange = (day, field, value) => {
    setSchedule({
      ...schedule,
      [day]: {
        ...schedule[day],
        [field]: value
      }
    });
  };
```

#### Save Availability Function

```javascript
  const handleSaveAvailability = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Call backend API
      const res = await fetch('http://localhost:3000/api/doctor/setup-schedule', {
        method: 'POST',
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
```

#### Availability View JSX

```javascript
  return (
    <div className="doctor-dashboard-new">
      {/* Header and Sidebar... */}

      <main className="doctor-main">
        {message && (
          <div className={`doctor-message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {/* Availability View */}
        {activeView === 'availability' && (
          <div className="availability-view">
            <h1>Availability Schedule</h1>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Set your working hours for each day. Appointment slots will be generated based on your interval.
            </p>
            
            <div className="availability-form">
              {DAYS.map((day) => (
                <div key={day} className={`day-schedule ${schedule[day].selected ? 'active' : ''}`}>
                  {/* Day Header with Checkbox */}
                  <div className="day-header">
                    <input
                      type="checkbox"
                      className="day-checkbox"
                      checked={schedule[day].selected}
                      onChange={(e) => handleScheduleChange(day, 'selected', e.target.checked)}
                    />
                    <span className="day-name">{day}</span>
                  </div>
                  
                  {/* Time Inputs (only shown if day is selected) */}
                  {schedule[day].selected && (
                    <div className="time-inputs">
                      {/* Start Time */}
                      <div className="time-input-group">
                        <label>Start Time</label>
                        <input
                          type="time"
                          value={schedule[day].startTime}
                          onChange={(e) => handleScheduleChange(day, 'startTime', e.target.value)}
                        />
                      </div>
                      
                      {/* End Time */}
                      <div className="time-input-group">
                        <label>End Time</label>
                        <input
                          type="time"
                          value={schedule[day].endTime}
                          onChange={(e) => handleScheduleChange(day, 'endTime', e.target.value)}
                        />
                      </div>
                      
                      {/* Interval Dropdown */}
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
              
              {/* Save Button */}
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

## COMPLETE FLOW

### 1. SAVE AVAILABILITY

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Doctor Sets Schedule                                    │
├─────────────────────────────────────────────────────────────────┤
│ Frontend: DoctorDashboard.jsx                                   │
│   → Doctor checks "Monday"                                      │
│   → Sets startTime: "09:00"                                     │
│   → Sets endTime: "17:00"                                       │
│   → Sets interval: 30 minutes                                   │
│   → Clicks "Save Availability"                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Frontend Sends Request                                  │
├─────────────────────────────────────────────────────────────────┤
│ POST http://localhost:3000/api/doctor/setup-schedule            │
│                                                                  │
│ Body:                                                            │
│ {                                                                │
│   "email": "doctor@example.com",                                │
│   "schedule": {                                                  │
│     "Monday": {                                                  │
│       "selected": true,                                          │
│       "startTime": "09:00",                                      │
│       "endTime": "17:00",                                        │
│       "interval": 30                                             │
│     },                                                           │
│     "Tuesday": { "selected": false },                            │
│     ...                                                          │
│   }                                                              │
│ }                                                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Backend Processes Request                               │
├─────────────────────────────────────────────────────────────────┤
│ Backend: timetable.js → saveDoctorSchedule()                    │
│                                                                  │
│ 1. Get USERS.ID from email                                      │
│    SELECT ID FROM USERS WHERE EMAIL = 'doctor@example.com'      │
│    Result: userId = 5                                           │
│                                                                  │
│ 2. Get DOCTOR.ID from userId                                    │
│    SELECT ID FROM DOCTOR WHERE USER_ID = 5                      │
│    Result: doctorId = 3                                         │
│                                                                  │
│ 3. Delete old slots                                             │
│    DELETE FROM TIME_SLOTS WHERE DOCTOR_ID = 3                   │
│                                                                  │
│ 4. Generate slots for Monday (09:00 - 17:00, 30 min interval)  │
│    Slots generated:                                             │
│    - 09:00 - 09:30                                              │
│    - 09:30 - 10:00                                              │
│    - 10:00 - 10:30                                              │
│    - 10:30 - 11:00                                              │
│    - 11:00 - 11:30                                              │
│    - 11:30 - 12:00                                              │
│    - 12:00 - 12:30                                              │
│    - 12:30 - 13:00                                              │
│    - 13:00 - 13:30                                              │
│    - 13:30 - 14:00                                              │
│    - 14:00 - 14:30                                              │
│    - 14:30 - 15:00                                              │
│    - 15:00 - 15:30                                              │
│    - 15:30 - 16:00                                              │
│    - 16:00 - 16:30                                              │
│    - 16:30 - 17:00                                              │
│    Total: 16 slots                                              │
│                                                                  │
│ 5. Insert each slot into TIME_SLOTS table                       │
│    INSERT INTO TIME_SLOTS (ID, START_TIME, END_TIME, STATUS,    │
│                            DOCTOR_ID, DAY_OF_WEEK)              │
│    VALUES (TIME_SLOTS_SEQ.NEXTVAL, '09:00', '09:30',           │
│            'AVAILABLE', 3, 'Monday')                            │
│    ... (repeat for all 16 slots)                               │
│                                                                  │
│ 6. Commit transaction                                           │
│    COMMIT;                                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Backend Returns Response                                │
├─────────────────────────────────────────────────────────────────┤
│ Response:                                                        │
│ {                                                                │
│   "message": "✅ Doctor schedule saved successfully!            │
│                Created 16 appointment slots.",                  │
│   "slotsCreated": 16                                            │
│ }                                                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Frontend Shows Success Message                          │
├─────────────────────────────────────────────────────────────────┤
│ Frontend: DoctorDashboard.jsx                                   │
│   → Shows: "✅ Doctor schedule saved successfully!              │
│             Created 16 appointment slots."                      │
│   → Message disappears after 5 seconds                          │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2. UPDATE AVAILABILITY

Same flow as SAVE - the backend deletes old slots and creates new ones.

```
Update Flow:
1. Doctor changes Monday interval from 30 to 60 minutes
2. Clicks "Save Availability"
3. Backend deletes all existing slots for this doctor
4. Backend generates new slots (09:00-17:00, 60 min = 8 slots)
5. Backend inserts 8 new slots
6. Success message shows "Created 8 appointment slots"
```

---

### 3. SHOW AVAILABILITY

Currently, there's NO "show existing availability" feature. The schedule state is initialized with default values, not fetched from database.

**To implement "Show Availability":**

#### Backend: Add GET endpoint

```javascript
// backend/controllers/timetable.js

exports.getDoctorSchedule = async (req, res) => {
  const { email } = req.params;

  let connection;
  try {
    connection = await connectDB();

    // Get doctor ID
    const doctorResult = await connection.execute(
      `SELECT d.ID 
       FROM DOCTOR d
       JOIN USERS u ON d.USER_ID = u.ID
       WHERE TRIM(LOWER(u.EMAIL)) = TRIM(LOWER(:email))`,
      { email }
    );

    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ error: "Doctor not found" });
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

    // Group slots by day
    const schedule = {};
    slotsResult.rows.forEach(row => {
      const day = row[0];
      if (!schedule[day]) {
        schedule[day] = {
          selected: true,
          slots: []
        };
      }
      schedule[day].slots.push({
        startTime: row[1],
        endTime: row[2]
      });
    });

    res.json({ schedule });
  } catch (err) {
    console.error('Error fetching doctor schedule:', err);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  } finally {
    if (connection) await connection.close();
  }
};
```

#### Frontend: Fetch on mount

```javascript
// frontend/src/pages/DoctorDashboard.jsx

useEffect(() => {
  if (user?.email) {
    fetchDoctorSchedule(user.email);
  }
}, [user]);

const fetchDoctorSchedule = async (email) => {
  try {
    const res = await fetch(`http://localhost:3000/api/doctor/schedule/${email}`);
    if (res.ok) {
      const data = await res.json();
      // Convert backend format to frontend schedule state
      // ... (implementation needed)
    }
  } catch (err) {
    console.error('Error fetching schedule:', err);
  }
};
```

---

## DATABASE QUERIES

### Check Doctor's Time Slots

```sql
-- Get all time slots for a doctor
SELECT 
  ts.ID,
  ts.DAY_OF_WEEK,
  ts.START_TIME,
  ts.END_TIME,
  ts.STATUS,
  u.NAME as DOCTOR_NAME,
  u.EMAIL as DOCTOR_EMAIL
FROM TIME_SLOTS ts
JOIN DOCTOR d ON ts.DOCTOR_ID = d.ID
JOIN USERS u ON d.USER_ID = u.ID
WHERE u.EMAIL = 'doctor@example.com'
ORDER BY 
  CASE ts.DAY_OF_WEEK
    WHEN 'Sunday' THEN 1
    WHEN 'Monday' THEN 2
    WHEN 'Tuesday' THEN 3
    WHEN 'Wednesday' THEN 4
    WHEN 'Thursday' THEN 5
    WHEN 'Friday' THEN 6
    WHEN 'Saturday' THEN 7
  END,
  ts.START_TIME;
```

### Count Slots Per Day

```sql
SELECT 
  DAY_OF_WEEK,
  COUNT(*) as SLOT_COUNT,
  MIN(START_TIME) as FIRST_SLOT,
  MAX(END_TIME) as LAST_SLOT
FROM TIME_SLOTS
WHERE DOCTOR_ID = 3
GROUP BY DAY_OF_WEEK
ORDER BY 
  CASE DAY_OF_WEEK
    WHEN 'Sunday' THEN 1
    WHEN 'Monday' THEN 2
    WHEN 'Tuesday' THEN 3
    WHEN 'Wednesday' THEN 4
    WHEN 'Thursday' THEN 5
    WHEN 'Friday' THEN 6
    WHEN 'Saturday' THEN 7
  END;
```

### Delete All Slots for a Doctor

```sql
DELETE FROM TIME_SLOTS WHERE DOCTOR_ID = 3;
COMMIT;
```

---

## EXAMPLE SCENARIOS

### Scenario 1: Doctor Works Monday-Friday, 9-5, 30-minute appointments

**Input:**
```json
{
  "email": "doctor@example.com",
  "schedule": {
    "Monday": { "selected": true, "startTime": "09:00", "endTime": "17:00", "interval": 30 },
    "Tuesday": { "selected": true, "startTime": "09:00", "endTime": "17:00", "interval": 30 },
    "Wednesday": { "selected": true, "startTime": "09:00", "endTime": "17:00", "interval": 30 },
    "Thursday": { "selected": true, "startTime": "09:00", "endTime": "17:00", "interval": 30 },
    "Friday": { "selected": true, "startTime": "09:00", "endTime": "17:00", "interval": 30 },
    "Saturday": { "selected": false },
    "Sunday": { "selected": false }
  }
}
```

**Result:**
- 16 slots per day × 5 days = 80 total slots
- Each slot is 30 minutes
- Status: AVAILABLE

### Scenario 2: Doctor Works Part-Time, Different Hours Each Day

**Input:**
```json
{
  "email": "doctor@example.com",
  "schedule": {
    "Monday": { "selected": true, "startTime": "09:00", "endTime": "13:00", "interval": 20 },
    "Wednesday": { "selected": true, "startTime": "14:00", "endTime": "18:00", "interval": 20 },
    "Friday": { "selected": true, "startTime": "10:00", "endTime": "16:00", "interval": 30 }
  }
}
```

**Result:**
- Monday: 09:00-13:00, 20 min = 12 slots
- Wednesday: 14:00-18:00, 20 min = 12 slots
- Friday: 10:00-16:00, 30 min = 12 slots
- Total: 36 slots

---

## SUMMARY

### Files Involved:

**Backend:**
- `backend/controllers/timetable.js` - Main availability logic
- `backend/routes/auth.js` - Route definitions
- Database: `TIME_SLOTS` table

**Frontend:**
- `frontend/src/pages/DoctorDashboard.jsx` - UI and state management
- `frontend/src/styles/DoctorDashboard.css` - Styling

### Key Features:

1. ✅ Save availability (create new schedule)
2. ✅ Update availability (delete old + create new)
3. ✅ Interval-based slot generation (15, 20, 25, 30, 45, 60 minutes)
4. ✅ Multiple slots per day
5. ✅ Validation (time format, range, day names)
6. ✅ Transaction safety (rollback on error)
7. ❌ Show existing availability (NOT implemented - needs GET endpoint)

### Missing Feature:

**Show Existing Availability** - Currently, the schedule form always starts with default values. To show existing availability, you need to:
1. Add GET endpoint in backend
2. Fetch schedule on component mount
3. Convert database format to frontend state format
4. Populate the form with existing data
