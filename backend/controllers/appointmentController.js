const connectDB = require("../db/connection");

const getDayName = (dateString) => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const date = new Date(dateString);
  return days[date.getDay()];
};

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

    const slotResult = await connection.execute(
      `SELECT ID, START_TIME, END_TIME, DAY_OF_WEEK
       FROM TIME_SLOTS
       WHERE DOCTOR_ID = :doctorId
         AND DAY_OF_WEEK = :dayOfWeek
         AND STATUS = 'AVAILABLE'
       ORDER BY START_TIME`,
      { doctorId, dayOfWeek }
    );

    const bookedResult = await connection.execute(
      `SELECT TIME_SLOT_ID
       FROM DOCTORS_APPOINTMENTS
       WHERE DOCTOR_ID = :doctorId
         AND APPOINTMENT_DATE = TO_DATE(:dateStr, 'YYYY-MM-DD')
         AND STATUS = 'BOOKED'`,
      { doctorId, dateStr: date }
    );

    const bookedIds = new Set(bookedResult.rows.map(row => row[0]));

    const availableSlots = slotResult.rows
      .map(row => ({
        timeSlotId: row[0],
        startTime: row[1],
        endTime: row[2],
        dayOfWeek: row[3]
      }))
      .filter(slot => !bookedIds.has(slot.timeSlotId));

    return res.status(200).json({ slots: availableSlots });
  } catch (err) {
    console.error("Get available slots error:", err);
    return res.status(500).json({ error: "❌ Failed to get available slots" });
  } finally {
    if (connection) await connection.close();
  }
};

exports.bookAppointment = async (req, res) => {
  const { patientEmail, doctorId, appointmentDate, timeSlotId, type } = req.body;

  if (!patientEmail || !doctorId || !appointmentDate || !timeSlotId) {
    return res.status(400).json({ error: "❌ Missing required fields" });
  }

  let connection;
  try {
    connection = await connectDB();

    const userResult = await connection.execute(
      `SELECT ID
       FROM USERS
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