# COMPLETE DOCTOR SCHEDULE CODE - ALL FILES

## ISSUE: No Backend Terminal Messages

If you see NO messages in backend terminal when accessing availability page, the requests are NOT reaching the backend. This means:
1. Frontend is calling wrong URL
2. Backend route not registered
3. CORS issue
4. Backend not actually running

---

## 1. BACKEND: Controller (`backend/controllers/timetable.js`)

**COMPLETE FILE - Copy this entire content:**

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

// Get doctors by specialty
exports.getDoctorsBySpecialty = async (req, res) => {
  const { specialty } = req.query;

  if (!specialty) {
    return res.status(400).json({ error: "Specialty is required" });
  }

  let connection;
  try {
    connection = await connectDB();

    const result = await connection.execute(
      `SELECT d.ID, u.NAME, u.EMAIL, s.NAME as SPECIALIZATION_NAME, d.EXPERIENCE_YEARS, d.DEGREES
       FROM DOCTOR d
       JOIN USERS u ON d.USER_ID = u.ID
       JOIN DOC_SPECIALIZATION ds ON d.ID = ds.DOCTOR_ID
       JOIN SPECIALIZATION s ON ds.SPECIALIZATION_ID = s.ID
       WHERE UPPER(s.NAME) = UPPER(:specialty)
       ORDER BY d.EXPERIENCE_YEARS DESC`,
      { specialty }
    );

    const doctors = result.rows.map(row => ({
      id: row[0],
      name: row[1],
      email: row[2],
      specialty: row[3],
      experienceYears: row[4],
      degrees: row[5]
    }));

    res.status(200).json({ doctors });
  } catch (err) {
    console.error('Error fetching doctors by specialty:', err);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  } finally {
    if (connection) await connection.close();
  }
};

// Get all specialties
exports.getAllSpecialties = async (req, res) => {
  console.log('getAllSpecialties called');
  let connection;
  try {
    connection = await connectDB();
    console.log('Database connected for specialties');

    const result = await connection.execute(
      `SELECT ID, NAME, DESCRIPTION
       FROM SPECIALIZATION
       ORDER BY NAME`
    );

    console.log('Query executed, rows:', result.rows.length);

    const specialties = result.rows.map(row => ({
      id: row[0],
      name: row[1],
      description: row[2]
    }));

    console.log('Specialties:', specialties);
    res.status(200).json({ specialties });
  } catch (err) {
    console.error('Error fetching specialties:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: 'Failed to fetch specialties' });
  } finally {
    if (connection) await connection.close();
  }
};

// Get all doctors
exports.getAllDoctors = async (req, res) => {
  let connection;
  try {
    connection = await connectDB();

    const result = await connection.execute(
      `SELECT DISTINCT d.ID, u.NAME, u.EMAIL, s.NAME as SPECIALIZATION_NAME, d.EXPERIENCE_YEARS, d.DEGREES
       FROM DOCTOR d
       JOIN USERS u ON d.USER_ID = u.ID
       LEFT JOIN DOC_SPECIALIZATION ds ON d.ID = ds.DOCTOR_ID
       LEFT JOIN SPECIALIZATION s ON ds.SPECIALIZATION_ID = s.ID
       ORDER BY d.EXPERIENCE_YEARS DESC`
    );

    const doctors = result.rows.map(row => ({
      id: row[0],
      name: row[1],
      email: row[2],
      specialty: row[3] || 'General',
      experienceYears: row[4],
      degrees: row[5]
    }));

    res.status(200).json({ doctors });
  } catch (err) {
    console.error('Error fetching all doctors:', err);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  } finally {
    if (connection) await connection.close();
  }
};

// Get top doctors by appointment count
exports.getTopDoctors = async (req, res) => {
  let connection;
  try {
    connection = await connectDB();

    const result = await connection.execute(
      `SELECT 
          d.ID as DOCTOR_ID,
          u.NAME as DOCTOR_NAME,
          u.EMAIL as DOCTOR_EMAIL,
          d.DEGREES,
          d.EXPERIENCE_YEARS,
          d.FEES,
          s.NAME as SPECIALTY,
          COUNT(da.ID) as TOTAL_APPOINTMENTS
       FROM DOCTOR d
       JOIN USERS u ON d.USER_ID = u.ID
       LEFT JOIN DOC_SPECIALIZATION ds ON d.ID = ds.DOCTOR_ID
       LEFT JOIN SPECIALIZATION s ON ds.SPECIALIZATION_ID = s.ID
       LEFT JOIN DOCTORS_APPOINTMENTS da ON d.ID = da.DOCTOR_ID
       WHERE u.ROLE = 'DOCTOR'
       GROUP BY d.ID, u.NAME, u.EMAIL, d.DEGREES, d.EXPERIENCE_YEARS, d.FEES, s.NAME
       ORDER BY TOTAL_APPOINTMENTS DESC, u.NAME ASC
       FETCH FIRST 10 ROWS ONLY`
    );

    const doctors = result.rows.map(row => ({
      id: row[0],
      name: row[1],
      email: row[2],
      degrees: row[3],
      experienceYears: row[4],
      fees: row[5],
      specialty: row[6] || 'General',
      totalAppointments: row[7]
    }));

    res.status(200).json({ doctors });
  } catch (err) {
    console.error('Error fetching top doctors:', err);
    res.status(500).json({ error: 'Failed to fetch top doctors' });
  } finally {
    if (connection) await connection.close();
  }
};

// Get single doctor details
exports.getDoctorById = async (req, res) => {
  const { doctorId } = req.params;

  let connection;
  try {
    connection = await connectDB();

    const result = await connection.execute(
      `SELECT d.ID, u.NAME, u.EMAIL, s.NAME as SPECIALIZATION_NAME, d.EXPERIENCE_YEARS, d.DEGREES
       FROM DOCTOR d
       JOIN USERS u ON d.USER_ID = u.ID
       LEFT JOIN DOC_SPECIALIZATION ds ON d.ID = ds.DOCTOR_ID
       LEFT JOIN SPECIALIZATION s ON ds.SPECIALIZATION_ID = s.ID
       WHERE d.ID = :doctorId`,
      { doctorId }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const row = result.rows[0];
    const doctor = {
      id: row[0],
      name: row[1],
      email: row[2],
      specialty: row[3] || 'General',
      experienceYears: row[4],
      degrees: row[5],
      fee: 50
    };

    res.status(200).json({ doctor });
  } catch (err) {
    console.error('Error fetching doctor details:', err);
    res.status(500).json({ error: 'Failed to fetch doctor details' });
  } finally {
    if (connection) await connection.close();
  }
};

// ✅ GET DOCTOR SCHEDULE
exports.getDoctorSchedule = async (req, res) => {
  const { email } = req.params;

  console.log("🔍 GET DOCTOR SCHEDULE - Email:", email);

  if (!email) {
    console.log("❌ No email provided");
    return res.status(400).json({ error: "❌ Email is required" });
  }

  let connection;
  try {
    connection = await connectDB();
    console.log("✅ Database connected");

    // Get doctor ID
    const userResult = await connection.execute(
      `SELECT ID FROM USERS 
       WHERE TRIM(LOWER(EMAIL)) = TRIM(LOWER(:email))
         AND TRIM(UPPER(ROLE)) = 'DOCTOR'`,
      { email }
    );

    console.log("📊 User query result:", userResult.rows.length, "rows");

    if (userResult.rows.length === 0) {
      console.log("❌ Doctor user not found for email:", email);
      return res.status(404).json({ error: "❌ Doctor not found" });
    }

    const userId = userResult.rows[0][0];
    console.log("✅ User ID:", userId);

    const doctorResult = await connection.execute(
      `SELECT ID FROM DOCTOR WHERE USER_ID = :userId`,
      { userId }
    );

    console.log("📊 Doctor query result:", doctorResult.rows.length, "rows");

    if (doctorResult.rows.length === 0) {
      console.log("❌ Doctor profile not found for user ID:", userId);
      return res.status(404).json({ error: "❌ Doctor profile not found" });
    }

    const doctorId = doctorResult.rows[0][0];
    console.log("✅ Doctor ID:", doctorId);

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

    console.log(`📊 Found ${slotsResult.rows.length} time slots for doctor`);

    // If no slots, return empty schedule
    if (slotsResult.rows.length === 0) {
      const emptySchedule = {};
      validDays.forEach(day => {
        emptySchedule[day] = {
          selected: false,
          startTime: '09:00',
          endTime: '17:00',
          interval: 30
        };
      });

      console.log("✅ Returning empty schedule (no slots found)");
      return res.json({ 
        success: true,
        schedule: emptySchedule,
        totalSlots: 0
      });
    }

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
      calculatedInterval = slot1End - slot1Start;
    }

    console.log("📊 Calculated interval:", calculatedInterval, "minutes");

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

    console.log("✅ Returning schedule with", slotsResult.rows.length, "total slots");

    res.json({ 
      success: true,
      schedule,
      totalSlots: slotsResult.rows.length
    });

  } catch (err) {
    console.error('❌ Error fetching doctor schedule:', err);
    console.error('❌ Error stack:', err.stack);
    res.status(500).json({ error: '❌ Failed to fetch schedule: ' + err.message });
  } finally {
    if (connection) {
      await connection.close();
      console.log("🔌 Database connection closed");
    }
  }
};

// ✅ SAVE/UPDATE DOCTOR SCHEDULE
exports.saveDoctorSchedule = async (req, res) => {
  const { email, schedule } = req.body;

  console.log("💾 SAVE DOCTOR SCHEDULE - Email:", email);
  console.log("📋 Schedule data:", JSON.stringify(schedule, null, 2));

  if (!email || !schedule) {
    console.log("❌ Missing email or schedule");
    return res.status(400).json({ error: "❌ Email and schedule are required" });
  }

  let connection;

  try {
    connection = await connectDB();
    console.log("✅ Database connected");

    // Get user ID
    const userResult = await connection.execute(
      `SELECT ID FROM USERS 
       WHERE TRIM(LOWER(EMAIL)) = TRIM(LOWER(:email))
         AND TRIM(UPPER(ROLE)) = 'DOCTOR'`,
      { email }
    );

    console.log("📊 User query result:", userResult.rows.length, "rows");

    if (userResult.rows.length === 0) {
      console.log("❌ Doctor user not found");
      return res.status(404).json({ error: "❌ Doctor user not found" });
    }

    const userId = userResult.rows[0][0];
    console.log("✅ User ID:", userId);

    // Get doctor ID
    const doctorResult = await connection.execute(
      `SELECT ID FROM DOCTOR WHERE USER_ID = :userId`,
      { userId }
    );

    console.log("📊 Doctor query result:", doctorResult.rows.length, "rows");

    if (doctorResult.rows.length === 0) {
      console.log("❌ Doctor profile not found");
      return res.status(404).json({ error: "❌ Doctor profile not found" });
    }

    const doctorId = doctorResult.rows[0][0];
    console.log("✅ Doctor ID:", doctorId);

    // Delete existing time slots
    const deleteResult = await connection.execute(
      `DELETE FROM TIME_SLOTS WHERE DOCTOR_ID = :doctorId`,
      { doctorId }
    );

    console.log("🗑️ Deleted", deleteResult.rowsAffected, "existing slots");

    let totalSlotsCreated = 0;
    
    // Insert new time slots for each selected day
    for (const day of Object.keys(schedule)) {
      const dayData = schedule[day];

      if (!validDays.includes(day)) {
        console.log("⚠️ Invalid day:", day);
        await connection.rollback();
        return res.status(400).json({ error: `❌ Invalid day: ${day}` });
      }

      if (dayData.selected) {
        const { startTime, endTime, interval } = dayData;

        console.log(`📅 Processing ${day}: ${startTime}-${endTime}, interval: ${interval}min`);

        if (!startTime || !endTime) {
          console.log("❌ Missing start/end time for", day);
          await connection.rollback();
          return res.status(400).json({
            error: `❌ Start time and end time are required for ${day}`
          });
        }

        if (!isValidTime(startTime) || !isValidTime(endTime)) {
          console.log("❌ Invalid time format for", day);
          await connection.rollback();
          return res.status(400).json({
            error: `❌ Invalid time format for ${day}. Use HH:MM in 24-hour format`
          });
        }

        if (startTime >= endTime) {
          console.log("❌ Start time >= end time for", day);
          await connection.rollback();
          return res.status(400).json({
            error: `❌ Start time must be earlier than end time for ${day}`
          });
        }

        // Generate appointment slots
        const appointmentInterval = interval || 25;
        const slots = generateAppointmentSlots(startTime, endTime, appointmentInterval);
        
        console.log(`✅ Generated ${slots.length} slots for ${day}`);

        // Insert each slot
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
    console.log("✅ Transaction committed -", totalSlotsCreated, "slots created");

    return res.status(200).json({
      message: `✅ Doctor schedule saved successfully! Created ${totalSlotsCreated} appointment slots.`,
      slotsCreated: totalSlotsCreated
    });

  } catch (err) {
    console.error("❌ Save schedule error:", err);
    console.error("❌ Error stack:", err.stack);

    if (connection) {
      try {
        await connection.rollback();
        console.log("🔄 Transaction rolled back");
      } catch (rollbackErr) {
        console.error("❌ Rollback error:", rollbackErr);
      }
    }

    return res.status(500).json({ error: "❌ Failed to save doctor schedule: " + err.message });
  } finally {
    if (connection) {
      await connection.close();
      console.log("🔌 Database connection closed");
    }
  }
};

module.exports = exports;
```

---

## 2. BACKEND: Routes (`backend/routes/auth.js`)

**Find these lines and make sure they exist:**

```javascript
const timetableController = require("../controllers/timetable");

// ... other routes ...

router.post("/doctor/setup-schedule", timetableController.saveDoctorSchedule);
router.put("/doctor/update-schedule", timetableController.saveDoctorSchedule);
router.get("/doctor/schedule/:email", timetableController.getDoctorSchedule);
```

**IMPORTANT:** These lines must be BEFORE `module.exports = router;`

---

## 3. FRONTEND: Fetch Schedule Function

**In `frontend/src/pages/DoctorDashboard.jsx`, find and verify:**

```javascript
const fetchDoctorSchedule = async (email) => {
  try {
    console.log('🔍 Fetching doctor schedule for:', email);
    const res = await fetch(`http://localhost:3000/api/doctor/schedule/${email}`);
    console.log('📡 Response status:', res.status);
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Schedule data received:', data);
      if (data.schedule) {
        setSchedule(data.schedule);
        setScheduleLoaded(true);
      }
    } else {
      const error = await res.json();
      console.log('⚠️ No existing schedule:', error);
      setScheduleLoaded(false);
    }
  } catch (err) {
    console.error('❌ Error fetching doctor schedule:', err);
    setScheduleLoaded(false);
  }
};
```

---

## 4. SQL: Check Database

```sql
-- Check if doctor exists
SELECT 
  u.ID as USER_ID,
  u.EMAIL,
  u.NAME,
  u.ROLE,
  d.ID as DOCTOR_ID
FROM USERS u
LEFT JOIN DOCTOR d ON u.ID = d.USER_ID
WHERE u.EMAIL = 'doe@gmail.com';

-- Check existing time slots
SELECT 
  ts.ID,
  ts.DOCTOR_ID,
  ts.DAY_OF_WEEK,
  ts.START_TIME,
  ts.END_TIME,
  ts.STATUS
FROM TIME_SLOTS ts
JOIN DOCTOR d ON ts.DOCTOR_ID = d.ID
JOIN USERS u ON d.USER_ID = u.ID
WHERE u.EMAIL = 'doe@gmail.com'
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

-- Check TIME_SLOTS_SEQ exists
SELECT sequence_name FROM user_sequences WHERE sequence_name = 'TIME_SLOTS_SEQ';

-- If sequence doesn't exist, create it:
CREATE SEQUENCE TIME_SLOTS_SEQ START WITH 1 INCREMENT BY 1;
```

---

## 5. DEBUGGING: Check if Backend is Receiving Requests

### Test 1: Check if backend is running
Open browser and go to:
```
http://localhost:3000/api/specialties
```

Should return JSON with specialties. If not, backend is not running.

### Test 2: Check GET schedule endpoint directly
Open browser and go to:
```
http://localhost:3000/api/doctor/schedule/doe@gmail.com
```

Should return schedule JSON or error. Check backend terminal for logs.

### Test 3: Check browser console
Open browser console (F12) and look for:
```
🔍 Fetching doctor schedule for: doe@gmail.com
📡 Response status: 200
```

---

## 6. COMMON ISSUES

### Issue 1: Backend not showing logs = Route not registered

**Check `backend/server.js`:**
```javascript
const authRoutes = require('./routes/auth');
app.use('/api', authRoutes);
```

### Issue 2: CORS error

**Check `backend/server.js` has CORS:**
```javascript
const cors = require('cors');
app.use(cors());
```

### Issue 3: Wrong URL in frontend

**Frontend should call:**
```
http://localhost:3000/api/doctor/schedule/doe@gmail.com
```

NOT:
```
http://localhost:3000/doctor/schedule/doe@gmail.com  ❌ (missing /api)
```

---

## 7. STEP-BY-STEP DEBUG

1. **Stop backend** (Ctrl+C)

2. **Start backend with logs:**
   ```bash
   cd backend
   node server.js
   ```

3. **You should see:**
   ```
   auth routes loaded
   ✅ Specialties route registered at /specialties
   ✅ All auth routes registered successfully
   Server running on http://localhost:3000
   ```

4. **Open browser console** (F12)

5. **Navigate to Availability Schedule**

6. **Check browser console** - should see:
   ```
   🔍 Fetching doctor schedule for: doe@gmail.com
   ```

7. **Check backend terminal** - should see:
   ```
   🔍 GET DOCTOR SCHEDULE - Email: doe@gmail.com
   ```

8. **If you see backend logs:** Backend is working!

9. **If you DON'T see backend logs:** Route not registered or wrong URL

---

## 8. FINAL CHECK

Run this in browser console:
```javascript
fetch('http://localhost:3000/api/doctor/schedule/doe@gmail.com')
  .then(r => r.json())
  .then(d => console.log('Response:', d))
  .catch(e => console.error('Error:', e));
```

This will show if the endpoint is reachable.

---

## WHAT TO SHARE IF STILL NOT WORKING

1. **Backend terminal output** (full startup logs)
2. **Browser console output** (all messages)
3. **Result of SQL query:**
   ```sql
   SELECT u.EMAIL, d.ID FROM USERS u
   LEFT JOIN DOCTOR d ON u.ID = d.USER_ID
   WHERE u.EMAIL = 'doe@gmail.com';
   ```
4. **Result of browser fetch test** (from step 8 above)
