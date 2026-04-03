const connectDB = require("../db/connection");

const getDayName = (dateString) => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const date = new Date(dateString);
  return days[date.getUTCDay()];
};

exports.getAvailableSlots = async (req, res) => {
  const { doctorId } = req.params;
  const { date } = req.query;

  console.log('getAvailableSlots called for doctor:', doctorId, 'date:', date);

  if (!date) {
    return res.status(400).json({ error: "❌ Date is required" });
  }

  const dayOfWeek = getDayName(date);
  console.log('Day of week:', dayOfWeek);

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

    console.log('Found', slotResult.rows.length, 'time slots');

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
    console.log('Booked slot IDs:', Array.from(bookedIds));

    // Return all slots with availability status
    const slots = slotResult.rows.map(row => ({
      timeSlotId: row[0],
      startTime: row[1],
      endTime: row[2],
      dayOfWeek: row[3],
      isAvailable: !bookedIds.has(row[0]) && row[4] === 'AVAILABLE'
    }));

    console.log('Returning', slots.length, 'slots');
    return res.status(200).json({ slots });
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
      `SELECT ID, DOCTOR_ID, STATUS, START_TIME, END_TIME
       FROM TIME_SLOTS
       WHERE ID = :timeSlotId
         AND DOCTOR_ID = :doctorId
         AND STATUS = 'AVAILABLE'`,
      { timeSlotId, doctorId }
    );

    if (slotResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Selected time slot not found for this doctor" });
    }

    const startTime = slotResult.rows[0][3];
    const endTime = slotResult.rows[0][4];

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

    // Insert appointment with times stored directly in the appointment record
    await connection.execute(
      `INSERT INTO DOCTORS_APPOINTMENTS
        (PATIENT_ID, DOCTOR_ID, APPOINTMENT_DATE, TIME_SLOT_ID, STATUS, TYPE, START_TIME, END_TIME)
       VALUES
        (:patientId, :doctorId, TO_DATE(:appointmentDate, 'YYYY-MM-DD'), :timeSlotId, :status, :type, :startTime, :endTime)`,
      { patientId, doctorId, appointmentDate, timeSlotId, status: "BOOKED", type: type || "General", startTime, endTime }
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

exports.cancelAppointment = async (req, res) => {
  const { id } = req.params;

  let connection;
  try {
    connection = await connectDB();

    const checkResult = await connection.execute(
      `SELECT ID, STATUS
       FROM DOCTORS_APPOINTMENTS
       WHERE ID = :id`,
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
      `UPDATE DOCTORS_APPOINTMENTS
       SET STATUS = 'CANCELLED'
       WHERE ID = :id`,
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