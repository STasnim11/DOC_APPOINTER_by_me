# ALL APPOINTMENT & SCHEDULE RELATED CODE

## CRITICAL ISSUE FOUND! ⚠️

In `backend/controllers/timetable.js` line 422-432, there's a **manual UPDATE** that sets TIME_SLOT_ID to NULL BEFORE deleting slots. This is WRONG because:

1. It makes the foreign key constraint useless
2. It manually nulls out ALL appointments' TIME_SLOT_ID
3. The foreign key constraint `ON DELETE SET NULL` should handle this automatically

---

## BACKEND FILES

### 1. `backend/controllers/timetable.js` - NEEDS FIX!

**CURRENT CODE (WRONG):**
```javascript
// Line 418-432
// Delete ALL existing time slots for this doctor
// Note: Existing appointments will remain valid even if their time slots are deleted
// Appointments are independent records that just reference the slot ID

// Step 1: Null out references in appointments first ❌ WRONG!
await connection.execute(
  `UPDATE DOCTORS_APPOINTMENTS 
   SET TIME_SLOT_ID = NULL
   WHERE TIME_SLOT_ID IN (
     SELECT ID FROM TIME_SLOTS WHERE DOCTOR_ID = :doctorId
   )`,
  { doctorId }
);

// Step 2: Now delete slots safely
const deleteResult = await connection.execute(
  `DELETE FROM TIME_SLOTS WHERE DOCTOR_ID = :doctorId`,
  { doctorId }
);
```

**CORRECT CODE (SHOULD BE):**
```javascript
// Line 418-425
// Delete ALL existing time slots for this doctor
// Note: Foreign key constraint ON DELETE SET NULL will automatically
// set TIME_SLOT_ID to NULL in DOCTORS_APPOINTMENTS table

const deleteResult = await connection.execute(
  `DELETE FROM TIME_SLOTS WHERE DOCTOR_ID = :doctorId`,
  { doctorId }
);
```

**Why this is wrong:**
- The manual UPDATE nulls out TIME_SLOT_ID for ALL appointments, even future ones
- The foreign key constraint `FK_DOCTOR_APPOINTMENT_TIMESLOT` with `ON DELETE SET NULL` should handle this automatically
- Only appointments referencing deleted slots should have NULL TIME_SLOT_ID

---

### 2. `backend/controllers/appointmentController.js` - CORRECT ✅

```javascript
const connectDB = require("../db/connection");

const getDayName = (dateString) => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const date = new Date(dateString);
  return days[date.getUTCDay()];
};

// GET available slots for booking
exports.getAvailableSlots = async (req, res) => {
  const { doctorId } = req.params;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: "❌ Date is required" });
  }

  const dayOfWeek = getDayName(date);

  let connection;
  try {
    connection = await connectDB();

    // Get ALL time slots for this doctor on this day
    const slotResult = await connection.execute(
      `SELECT ID, START_TIME, END_TIME, DAY_OF_WEEK, STATUS
       FROM TIME_SLOTS
       WHERE DOCTOR_ID = :doctorId
         AND DAY_OF_WEEK = :dayOfWeek
       ORDER BY START_TIME`,
      { doctorId, dayOfWeek }
    );

    // Get booked appointments for this date
    const bookedResult = await connection.execute(
      `SELECT TIME_SLOT_ID
       FROM DOCTORS_APPOINTMENTS
       WHERE DOCTOR_ID = :doctorId
         AND APPOINTMENT_DATE = TO_DATE(:dateStr, 'YYYY-MM-DD')
         AND STATUS = 'BOOKED'`,
      { doctorId, dateStr: date }
    );

    const bookedIds = new Set(bookedResult.rows.map(row => row[0]));

    // Return all slots with availability status
    const slots = slotResult.rows.map(row => ({
      timeSlotId: row[0],
      startTime: row[1],
      endTime: row[2],
      dayOfWeek: row[3],
      isAvailable: !bookedIds.has(row[0]) && row[4] === 'AVAILABLE'
    }));

    return res.status(200).json({ slots });
  } catch (err) {
    console.error("Get available slots error:", err);
    return res.status(500).json({ error: "❌ Failed to get available slots" });
  } finally {
    if (connection) await connection.close();
  }
};

// POST book appointment
exports.bookAppointment = async (req, res) => {
  const { patientEmail, doctorId, appointmentDate, timeSlotId, type } = req.body;

  if (!patientEmail || !doctorId || !appointmentDate || !timeSlotId) {
    return res.status(400).json({ error: "❌ Missing required fields" });
  }

  let connection;
  try {
    connection = await connectDB();

    // Get patient ID
    const userResult = await connection.execute(
      `SELECT ID FROM USERS
       WHERE TRIM(LOWER(EMAIL)) = TRIM(LOWER(:email))
         AND TRIM(UPPER(ROLE)) = 'PATIENT'`,
      { email: patientEmail }
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Patient user not found" });
    }

    const userId = userResult.rows[0][0];

    const patientResult = await connection.execute(
      `SELECT ID FROM PATIENT WHERE USER_ID = :userId`,
      { userId }
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Patient profile not found" });
    }

    const patientId = patientResult.rows[0][0];

    // Check slot exists and is available
    const slotResult = await connection.execute(
      `SELECT ID, DOCTOR_ID, STATUS
       FROM TIME_SLOTS
       WHERE ID = :timeSlotId
         AND DOCTOR_ID = :doctorId
         AND STATUS = 'AVAILABLE'`,
      { timeSlotId, doctorId }
    );

    if (slotResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Selected time slot not found for this doctor" });
    }

    // Check if slot already booked
    const existingResult = await connection.execute(
      `SELECT ID
       FROM DOCTORS_APPOINTMENTS
       WHERE DOCTOR_ID = :doctorId
         AND APPOINTMENT_DATE = TO_DATE(:appointmentDate, 'YYYY-MM-DD')
         AND TIME_SLOT_ID = :timeSlotId
         AND STATUS = 'BOOKED'`,
      { doctorId, appointmentDate, timeSlotId }
    );

    if (existingResult.rows.length > 0) {
      return res.status(409).json({ error: "❌ This slot is already booked" });
    }

    // Book appointment
    await connection.execute(
      `INSERT INTO DOCTORS_APPOINTMENTS
        (PATIENT_ID, DOCTOR_ID, APPOINTMENT_DATE, TIME_SLOT_ID, STATUS, TYPE)
       VALUES
        (:patientId, :doctorId, TO_DATE(:appointmentDate, 'YYYY-MM-DD'), :timeSlotId, :status, :type)`,
      {
        patientId,
        doctorId,
        appointmentDate,
        timeSlotId,
        status: "BOOKED",
        type: type || "General"
      }
    );

    await connection.commit();

    return res.status(201).json({
      message: "✅ Appointment booked successfully"
    });
  } catch (err) {
    console.error("Book appointment error:", err);

    if (connection) {
      try {
        await connection.rollback();
      } catch (_) {}
    }

    return res.status(500).json({ error: "❌ Failed to book appointment" });
  } finally {
    if (connection) await connection.close();
  }
};

// PUT cancel appointment
exports.cancelAppointment = async (req, res) => {
  const { id } = req.params;

  let connection;
  try {
    connection = await connectDB();

    const checkResult = await connection.execute(
      `SELECT ID, STATUS FROM DOCTORS_APPOINTMENTS WHERE ID = :id`,
      { id }
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Appointment not found" });
    }

    const currentStatus = checkResult.rows[0][1];
    if (currentStatus !== 'BOOKED') {
      return res.status(400).json({ error: "❌ Only booked appointments can be cancelled" });
    }

    await connection.execute(
      `UPDATE DOCTORS_APPOINTMENTS SET STATUS = 'CANCELLED' WHERE ID = :id`,
      { id }
    );

    await connection.commit();

    return res.status(200).json({
      message: "✅ Appointment cancelled successfully"
    });
  } catch (err) {
    console.error("Cancel appointment error:", err);

    if (connection) {
      try {
        await connection.rollback();
      } catch (_) {}
    }

    return res.status(500).json({ error: "❌ Failed to cancel appointment" });
  } finally {
    if (connection) await connection.close();
  }
};
```

---

### 3. `backend/controllers/doctorAppointments.js` - CORRECT ✅ (LEFT JOIN applied)

```javascript
const connectDB = require("../db/connection");

// GET doctor's appointments
exports.getDoctorAppointments = async (req, res) => {
  const { email } = req.params;
  let connection;

  if (!email) {
    return res.status(400).json({ error: "❌ Doctor email is required" });
  }

  try {
    connection = await connectDB();

    // Get doctor ID
    const doctorResult = await connection.execute(
      `SELECT d.ID
       FROM DOCTOR d
       JOIN USERS u ON d.USER_ID = u.ID
       WHERE TRIM(LOWER(u.EMAIL)) = TRIM(LOWER(:email))
         AND TRIM(UPPER(u.ROLE)) = 'DOCTOR'`,
      { email }
    );

    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Doctor not found" });
    }

    const doctorId = doctorResult.rows[0][0];

    // ✅ LEFT JOIN TIME_SLOTS - shows appointments even if slot deleted
    const appointmentsResult = await connection.execute(
      `SELECT
          da.ID as APPOINTMENT_ID,
          da.APPOINTMENT_DATE,
          da.STATUS,
          da.TYPE,
          ts.START_TIME,
          ts.END_TIME,
          pu.NAME as PATIENT_NAME,
          pu.EMAIL as PATIENT_EMAIL,
          pu.PHONE as PATIENT_PHONE,
          p.ID as PRESCRIPTION_ID
       FROM DOCTORS_APPOINTMENTS da
       LEFT JOIN TIME_SLOTS ts ON da.TIME_SLOT_ID = ts.ID
       JOIN PATIENT pat ON da.PATIENT_ID = pat.ID
       JOIN USERS pu ON pat.USER_ID = pu.ID
       LEFT JOIN PRESCRIPTION p ON da.ID = p.APPOINTMENT_ID
       WHERE da.DOCTOR_ID = :doctorId
       ORDER BY da.APPOINTMENT_DATE DESC, ts.START_TIME DESC`,
      { doctorId }
    );

    const appointments = appointmentsResult.rows.map(row => ({
      appointmentId: row[0],
      appointmentDate: row[1],
      status: row[2],
      type: row[3],
      startTime: row[4],  // Will be NULL if slot deleted
      endTime: row[5],    // Will be NULL if slot deleted
      patientName: row[6],
      patientEmail: row[7],
      patientPhone: row[8],
      hasPrescription: row[9] ? true : false,
      prescriptionId: row[9]
    }));

    return res.status(200).json({ appointments });
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    return res.status(500).json({ error: "❌ Failed to fetch appointments" });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error("Error closing DB connection:", closeError);
      }
    }
  }
};

// GET today's appointment count
exports.getTodayAppointmentsCount = async (req, res) => {
  const { email } = req.params;
  let connection;

  if (!email) {
    return res.status(400).json({ error: "❌ Doctor email is required" });
  }

  try {
    connection = await connectDB();

    const doctorResult = await connection.execute(
      `SELECT d.ID
       FROM DOCTOR d
       JOIN USERS u ON d.USER_ID = u.ID
       WHERE TRIM(LOWER(u.EMAIL)) = TRIM(LOWER(:email))
         AND TRIM(UPPER(u.ROLE)) = 'DOCTOR'`,
      { email }
    );

    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Doctor not found" });
    }

    const doctorId = doctorResult.rows[0][0];

    const countResult = await connection.execute(
      `SELECT COUNT(*) as TOTAL
       FROM DOCTORS_APPOINTMENTS
       WHERE DOCTOR_ID = :doctorId
         AND TRUNC(APPOINTMENT_DATE) = TRUNC(SYSDATE)
         AND STATUS = 'BOOKED'`,
      { doctorId }
    );

    const totalPatients = countResult.rows[0][0];

    return res.status(200).json({ totalPatients });
  } catch (error) {
    console.error("Error fetching today's appointments count:", error);
    return res.status(500).json({ error: "❌ Failed to fetch count" });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error("Error closing DB connection:", closeError);
      }
    }
  }
};

// PUT complete appointment
exports.completeAppointment = async (req, res) => {
  const { id } = req.params;
  let connection;

  if (!id) {
    return res.status(400).json({ error: "❌ Appointment ID is required" });
  }

  try {
    connection = await connectDB();

    const checkResult = await connection.execute(
      `SELECT ID, STATUS FROM DOCTORS_APPOINTMENTS WHERE ID = :id`,
      { id }
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Appointment not found" });
    }

    await connection.execute(
      `UPDATE DOCTORS_APPOINTMENTS SET STATUS = 'COMPLETED' WHERE ID = :id`,
      { id }
    );

    await connection.commit();

    return res.status(200).json({
      message: "✅ Appointment marked as completed"
    });
  } catch (error) {
    console.error("Error completing appointment:", error);

    if (connection) {
      try {
        await connection.rollback();
      } catch (_) {}
    }

    return res.status(500).json({ error: "❌ Failed to complete appointment" });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error("Error closing DB connection:", closeError);
      }
    }
  }
};
```

---

### 4. `backend/controllers/patientAppointments.js` - CORRECT ✅ (LEFT JOIN applied)

```javascript
const connectDB = require("../db/connection");

const formatAppointments = (rows) => {
  return rows.map((row) => ({
    appointmentId: row[0],
    appointmentDate: row[1],
    status: row[2],
    type: row[3],
    startTime: row[4],  // Will be NULL if slot deleted
    endTime: row[5],    // Will be NULL if slot deleted
    doctorName: row[6],
    doctorEmail: row[7],
    slot: `${row[4]} - ${row[5]}`,
  }));
};

// GET patient's appointments
exports.getPatientAppointmentsByEmail = async (req, res) => {
  const { email } = req.params;
  let connection;

  if (!email) {
    return res.status(400).json({ error: "❌ Patient email is required" });
  }

  try {
    connection = await connectDB();

    const userResult = await connection.execute(
      `SELECT ID FROM USERS
       WHERE TRIM(LOWER(EMAIL)) = TRIM(LOWER(:email))
         AND TRIM(UPPER(ROLE)) = 'PATIENT'`,
      { email }
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Patient user not found" });
    }

    const userId = userResult.rows[0][0];

    const patientResult = await connection.execute(
      `SELECT ID FROM PATIENT WHERE USER_ID = :userId`,
      { userId }
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Patient profile not found" });
    }

    const patientId = patientResult.rows[0][0];

    // ✅ LEFT JOIN TIME_SLOTS - shows appointments even if slot deleted
    const appointmentResult = await connection.execute(
      `SELECT
          da.ID,
          da.APPOINTMENT_DATE,
          da.STATUS,
          da.TYPE,
          ts.START_TIME,
          ts.END_TIME,
          du.NAME,
          du.EMAIL
       FROM DOCTORS_APPOINTMENTS da
       LEFT JOIN TIME_SLOTS ts
         ON da.TIME_SLOT_ID = ts.ID
       JOIN DOCTOR d
         ON da.DOCTOR_ID = d.ID
       JOIN USERS du
         ON d.USER_ID = du.ID
       WHERE da.PATIENT_ID = :patientId
       ORDER BY da.APPOINTMENT_DATE DESC, ts.START_TIME ASC`,
      { patientId }
    );

    const appointments = formatAppointments(appointmentResult.rows);

    return res.status(200).json(appointments);
  } catch (error) {
    console.error("Error fetching patient appointments:", error);
    return res.status(500).json({ error: "❌ Failed to fetch patient appointments" });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error("Error closing DB connection:", closeError);
      }
    }
  }
};
```

---

## THE FIX NEEDED

In `backend/controllers/timetable.js`, **REMOVE** the manual UPDATE and just use DELETE:

**Replace lines 418-432 with:**
```javascript
// Delete ALL existing time slots for this doctor
// Foreign key constraint ON DELETE SET NULL will automatically
// set TIME_SLOT_ID to NULL in appointments that reference deleted slots
const deleteResult = await connection.execute(
  `DELETE FROM TIME_SLOTS WHERE DOCTOR_ID = :doctorId`,
  { doctorId }
);

console.log("Old schedule deleted - removed", deleteResult.rowsAffected, "slots");
console.log("Note: Existing appointments are preserved with NULL TIME_SLOT_ID");
```

---

## WHY THIS MATTERS

**Current behavior (WRONG):**
1. Manual UPDATE sets TIME_SLOT_ID = NULL for ALL appointments
2. Then DELETE removes all slots
3. Result: ALL appointments lose their time slot reference, even future ones

**Correct behavior (with foreign key constraint):**
1. DELETE removes all slots
2. Foreign key constraint automatically sets TIME_SLOT_ID = NULL ONLY for appointments that referenced deleted slots
3. Result: Only affected appointments lose their time slot reference

---

## SUMMARY

✅ LEFT JOIN applied in 3 files (doctor appointments, patient appointments, doctor profile)
❌ Manual UPDATE in timetable.js needs to be removed
✅ Foreign key constraint `ON DELETE SET NULL` is configured
⚠️ Remove the manual UPDATE and let the constraint do its job!

**Next step:** Fix `backend/controllers/timetable.js` by removing the manual UPDATE statement.
