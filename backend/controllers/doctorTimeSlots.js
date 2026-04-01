const oracledb = require("oracledb");
const connectDB = require("../db/connection");

exports.saveDoctorTimeSlots = async (req, res) => {
  const { email, timeSlots } = req.body;

  // ✅ Validate
  if (!email || !Array.isArray(timeSlots) || timeSlots.length === 0) {
    return res.status(400).json({ error: "❌ Email and timeSlots array are required" });
  }

  let connection;
  try {
    connection = await connectDB();

    // 1️⃣ Get doctor ID by email
    const doctorResult = await connection.execute(
      `SELECT d.ID AS doctor_id
       FROM DOCTOR d
       JOIN USERS u ON d.USER_ID = u.ID
       WHERE TRIM(LOWER(u.EMAIL)) = TRIM(LOWER(:email))`,
      { email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Doctor not found" });
    }

    const doctorId = doctorResult.rows[0].DOCTOR_ID;

    // 2️⃣ Delete existing time slots for this doctor
    await connection.execute(
      `DELETE FROM TIME_SLOTS WHERE DOCTOR_ID = :doctorId`,
      { doctorId }
    );

    // 3️⃣ Insert new time slots
    for (const slot of timeSlots) {
      const { dayOfWeek, startTime, endTime } = slot;
      if (!dayOfWeek || !startTime || !endTime) continue;

      await connection.execute(
        `INSERT INTO TIME_SLOTS 
          (DOCTOR_ID, DAY_OF_WEEK, START_TIME, END_TIME, CREATED_AT)
         VALUES
          (:doctorId, :dayOfWeek, TO_DATE(:startTime, 'HH24:MI'), TO_DATE(:endTime, 'HH24:MI'), SYSDATE)`,
        { doctorId, dayOfWeek, startTime, endTime }
      );
    }

    await connection.commit();
    res.status(200).json({ message: "✅ Time slots saved successfully" });

  } catch (err) {
    console.error("Error saving doctor time slots:", err);
    if (connection) {
      try { await connection.rollback(); } catch (_) {}
    }
    res.status(500).json({ error: "❌ Server error" });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (_) {}
    }
  }
};
