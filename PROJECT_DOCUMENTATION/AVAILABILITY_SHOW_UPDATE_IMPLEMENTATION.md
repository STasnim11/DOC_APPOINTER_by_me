# AVAILABILITY SHOW & UPDATE - IMPLEMENTATION COMPLETE

## CHANGES MADE

### 1. Backend: Added GET Endpoint to Fetch Existing Schedule

**File:** `backend/controllers/timetable.js`

Added `getDoctorSchedule()` function that:
- Fetches all TIME_SLOTS for a doctor by email
- Groups slots by day of week
- Calculates start time, end time, and interval for each day
- Returns schedule in frontend-compatible format

```javascript
exports.getDoctorSchedule = async (req, res) => {
  // 1. Get doctor ID from email
  // 2. Fetch all TIME_SLOTS for this doctor
  // 3. Group by day and calculate interval
  // 4. Return schedule object
}
```

**Route:** `GET /api/doctor/schedule/:email`

---

### 2. Backend: Added Route

**File:** `backend/routes/auth.js`

```javascript
router.get("/doctor/schedule/:email", timetableController.getDoctorSchedule);
```

---

### 3. Frontend: Added Fetch Schedule Function

**File:** `frontend/src/pages/DoctorDashboard.jsx`

Added `fetchDoctorSchedule()` function that:
- Calls GET endpoint with doctor's email
- Updates schedule state with database data
- Sets `scheduleLoaded` flag to true if data found

```javascript
const fetchDoctorSchedule = async (email) => {
  const res = await fetch(`http://localhost:3000/api/doctor/schedule/${email}`);
  if (res.ok) {
    const data = await res.json();
    if (data.schedule) {
      setSchedule(data.schedule);
      setScheduleLoaded(true);
    }
  }
};
```

---

### 4. Frontend: Call Fetch on Component Mount

**File:** `frontend/src/pages/DoctorDashboard.jsx`

Updated `useEffect` to fetch schedule when dashboard loads:

```javascript
useEffect(() => {
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  // ... auth check ...
  setUser(userData);
  fetchDoctorProfile(userData.email);
  fetchAppointments(userData.email);
  fetchTodayCount(userData.email);
  fetchSpecializations();
  fetchDoctorSchedule(userData.email);  // ✅ NEW
}, [navigate]);
```

---

### 5. Frontend: Updated Save Function to Use PUT

**File:** `frontend/src/pages/DoctorDashboard.jsx`

Changed save function to:
- Use PUT method (for update)
- Refresh schedule after save
- Show updated data from database

```javascript
const handleSaveAvailability = async () => {
  const res = await fetch('http://localhost:3000/api/doctor/update-schedule', {
    method: 'PUT',  // ✅ Changed from POST
    // ...
  });
  
  if (res.ok) {
    setMessage('✅ ' + result.message);
    await fetchDoctorSchedule(user.email);  // ✅ Refresh from DB
  }
};
```

---

### 6. Frontend: Added Visual Indicators

**File:** `frontend/src/pages/DoctorDashboard.jsx`

Added:
- **Refresh button** - Manually reload schedule from database
- **Green banner** - Shows when schedule is loaded from database
- **Yellow banner** - Shows when no schedule exists (using defaults)

```javascript
{scheduleLoaded && (
  <div style={{ background: '#d1fae5', border: '1px solid #10b981' }}>
    ✅ Showing your current availability schedule from database
  </div>
)}

{!scheduleLoaded && (
  <div style={{ background: '#fef3c7', border: '1px solid #f59e0b' }}>
    ℹ️ No schedule found. Set your availability below and click Save.
  </div>
)}
```

---

## HOW IT WORKS NOW

### First Time Setup (No Existing Schedule)

```
1. Doctor logs in → Dashboard loads
2. fetchDoctorSchedule() called
3. Backend returns 404 (no slots found)
4. Frontend shows yellow banner: "No schedule found"
5. Schedule form shows default values (all days unchecked)
6. Doctor sets availability and clicks "Save Availability"
7. Backend creates slots in TIME_SLOTS table
8. Frontend refreshes and shows green banner: "Showing current schedule"
```

### Viewing Existing Schedule

```
1. Doctor logs in → Dashboard loads
2. fetchDoctorSchedule() called
3. Backend fetches TIME_SLOTS from database
4. Backend groups by day and calculates interval
5. Frontend receives schedule data
6. Schedule form populates with existing data:
   - Checked days show as selected
   - Start/end times from database
   - Interval calculated from slot duration
7. Green banner shows: "Showing current schedule from database"
```

### Updating Existing Schedule

```
1. Doctor views existing schedule (loaded from database)
2. Doctor makes changes:
   - Unchecks Wednesday
   - Changes Monday interval from 30 to 60 minutes
3. Doctor clicks "Save Availability"
4. Frontend calls PUT /api/doctor/update-schedule
5. Backend:
   - Deletes ALL existing TIME_SLOTS for this doctor
   - Generates NEW slots based on updated schedule
   - Inserts new slots into database
   - Commits transaction
6. Backend returns success with slot count
7. Frontend:
   - Shows success message
   - Calls fetchDoctorSchedule() to refresh
   - Updates form with latest database data
8. Green banner confirms schedule is from database
```

---

## TESTING CHECKLIST

### Test 1: First Time Setup
- [ ] Login as new doctor (no schedule set)
- [ ] Navigate to "Availability Schedule"
- [ ] Verify yellow banner shows: "No schedule found"
- [ ] Verify all days are unchecked
- [ ] Check Monday, set 09:00-17:00, interval 30
- [ ] Click "Save Availability"
- [ ] Verify success message shows slot count
- [ ] Verify green banner appears: "Showing current schedule"
- [ ] Refresh page
- [ ] Verify Monday is still checked with correct times

### Test 2: View Existing Schedule
- [ ] Login as doctor with existing schedule
- [ ] Navigate to "Availability Schedule"
- [ ] Verify green banner shows immediately
- [ ] Verify correct days are checked
- [ ] Verify correct times are shown
- [ ] Verify correct intervals are selected
- [ ] Click "🔄 Refresh" button
- [ ] Verify schedule reloads correctly

### Test 3: Update Existing Schedule
- [ ] Login as doctor with existing schedule
- [ ] Navigate to "Availability Schedule"
- [ ] Uncheck one day (e.g., Wednesday)
- [ ] Change interval on another day (e.g., Monday 30→60)
- [ ] Click "Save Availability"
- [ ] Verify success message
- [ ] Verify green banner still shows
- [ ] Refresh page
- [ ] Verify changes persisted (Wednesday unchecked, Monday interval 60)

### Test 4: Database Verification
```sql
-- Check slots before update
SELECT DAY_OF_WEEK, COUNT(*) as SLOT_COUNT
FROM TIME_SLOTS
WHERE DOCTOR_ID = (
  SELECT d.ID FROM DOCTOR d
  JOIN USERS u ON d.USER_ID = u.ID
  WHERE u.EMAIL = 'doctor@example.com'
)
GROUP BY DAY_OF_WEEK;

-- Make changes in UI and save

-- Check slots after update
SELECT DAY_OF_WEEK, COUNT(*) as SLOT_COUNT
FROM TIME_SLOTS
WHERE DOCTOR_ID = (
  SELECT d.ID FROM DOCTOR d
  JOIN USERS u ON d.USER_ID = u.ID
  WHERE u.EMAIL = 'doctor@example.com'
)
GROUP BY DAY_OF_WEEK;

-- Verify slot counts changed correctly
```

### Test 5: Error Handling
- [ ] Disconnect backend server
- [ ] Try to save availability
- [ ] Verify error message shows
- [ ] Reconnect backend
- [ ] Click "🔄 Refresh"
- [ ] Verify schedule loads correctly

---

## API ENDPOINTS

### GET /api/doctor/schedule/:email
**Purpose:** Fetch existing schedule for a doctor

**Request:**
```
GET http://localhost:3000/api/doctor/schedule/doctor@example.com
```

**Response (Success):**
```json
{
  "success": true,
  "schedule": {
    "Sunday": { "selected": false, "startTime": "09:00", "endTime": "17:00", "interval": 30 },
    "Monday": { "selected": true, "startTime": "09:00", "endTime": "17:00", "interval": 30 },
    "Tuesday": { "selected": true, "startTime": "09:00", "endTime": "17:00", "interval": 30 },
    "Wednesday": { "selected": false, "startTime": "09:00", "endTime": "17:00", "interval": 30 },
    "Thursday": { "selected": true, "startTime": "09:00", "endTime": "17:00", "interval": 30 },
    "Friday": { "selected": true, "startTime": "09:00", "endTime": "17:00", "interval": 30 },
    "Saturday": { "selected": false, "startTime": "09:00", "endTime": "17:00", "interval": 30 }
  },
  "totalSlots": 64
}
```

**Response (No Schedule):**
```json
{
  "error": "❌ Doctor not found"
}
```

### PUT /api/doctor/update-schedule
**Purpose:** Update doctor's schedule (delete old + create new)

**Request:**
```json
PUT http://localhost:3000/api/doctor/update-schedule
Content-Type: application/json

{
  "email": "doctor@example.com",
  "schedule": {
    "Monday": { "selected": true, "startTime": "09:00", "endTime": "17:00", "interval": 30 },
    "Tuesday": { "selected": false },
    ...
  }
}
```

**Response:**
```json
{
  "message": "✅ Doctor schedule saved successfully! Created 64 appointment slots.",
  "slotsCreated": 64
}
```

---

## BACKEND LOGIC

### How Schedule is Reconstructed from TIME_SLOTS

```javascript
// Database has individual slots:
// Monday 09:00-09:30
// Monday 09:30-10:00
// Monday 10:00-10:30
// ...

// Backend groups them:
const daySchedules = {};
slotsResult.rows.forEach(row => {
  const day = row[0];
  if (!daySchedules[day]) {
    daySchedules[day] = {
      slots: [],
      startTime: row[1],  // First slot start
      endTime: row[2]     // First slot end
    };
  }
  daySchedules[day].slots.push({ startTime: row[1], endTime: row[2] });
  
  // Update overall range
  if (row[1] < daySchedules[day].startTime) {
    daySchedules[day].startTime = row[1];
  }
  if (row[2] > daySchedules[day].endTime) {
    daySchedules[day].endTime = row[2];
  }
});

// Calculate interval from first two slots
const slot1End = timeToMinutes(slots[0].endTime);
const slot2Start = timeToMinutes(slots[1].startTime);
const interval = slot2Start - slot1End + (slot1End - timeToMinutes(slots[0].startTime));

// Result:
// Monday: { selected: true, startTime: "09:00", endTime: "17:00", interval: 30 }
```

---

## FILES MODIFIED

1. ✅ `backend/controllers/timetable.js` - Added getDoctorSchedule()
2. ✅ `backend/routes/auth.js` - Added GET route
3. ✅ `frontend/src/pages/DoctorDashboard.jsx` - Added fetch, refresh, indicators

---

## SUMMARY

✅ **Show Existing Availability:** Doctor sees their current schedule from database when page loads

✅ **Update Availability:** Doctor can modify schedule and save changes (old slots deleted, new slots created)

✅ **Visual Feedback:** Green/yellow banners show whether schedule is from database or defaults

✅ **Refresh Button:** Doctor can manually reload schedule from database

✅ **Proper HTTP Methods:** POST for first-time setup, PUT for updates

✅ **Database Sync:** Frontend always shows latest data from database after save

---

## NEXT STEPS (Optional Enhancements)

1. **Show Slot Count:** Display how many appointment slots exist for each day
2. **Validation:** Prevent saving if no days are selected
3. **Confirmation:** Ask "Are you sure?" before deleting all existing slots
4. **History:** Track schedule changes over time
5. **Bulk Actions:** "Select All Weekdays" button
6. **Preview:** Show generated slots before saving
