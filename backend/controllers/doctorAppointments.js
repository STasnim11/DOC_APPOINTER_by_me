const connectDB = require("../db/connection");

/**
 * Get all appointments for a doctor by email
 * GET /api/doctor/appointments/:email
 */
exports.getDoctorAppointments = async (req, res) => {
  const { email } = req.params;
  let connection;

  if (!email) {
    return res.status(400).json({ error: "❌ Doctor email is required" });
  }

  try {
    connection = await connectDB();

    // Get doctor ID from email
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

    // Get all appointments with patient details and prescription status
    // Using stored times (no need to join TIME_SLOTS)
    const appointmentsResult = await connection.execute(
      `SELECT
          da.ID as APPOINTMENT_ID,
          da.APPOINTMENT_DATE,
          da.STATUS,
          da.TYPE,
          da.START_TIME,
          da.END_TIME,
          pu.NAME as PATIENT_NAME,
          pu.EMAIL as PATIENT_EMAIL,
          pu.PHONE as PATIENT_PHONE,
          p.ID as PRESCRIPTION_ID
       FROM DOCTORS_APPOINTMENTS da
       JOIN PATIENT pat ON da.PATIENT_ID = pat.ID
       JOIN USERS pu ON pat.USER_ID = pu.ID
       LEFT JOIN PRESCRIPTION p ON da.ID = p.APPOINTMENT_ID
       WHERE da.DOCTOR_ID = :doctorId
       ORDER BY da.APPOINTMENT_DATE DESC, da.START_TIME DESC`,
      { doctorId }
    );

    const appointments = appointmentsResult.rows.map(row => ({
      appointmentId: row[0],
      appointmentDate: row[1],
      status: row[2],
      type: row[3],
      startTime: row[4],
      endTime: row[5],
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

/**
 * Get today's appointments count for a doctor
 * GET /api/doctor/appointments/:email/today-count
 */
exports.getTodayAppointmentsCount = async (req, res) => {
  const { email } = req.params;
  let connection;

  if (!email) {
    return res.status(400).json({ error: "❌ Doctor email is required" });
  }

  try {
    connection = await connectDB();

    // Get doctor ID from email
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

    // Get today's appointments count
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

/**
 * Mark appointment as completed
 * PUT /api/doctor/appointments/:id/complete
 */
exports.completeAppointment = async (req, res) => {
  const { id } = req.params;
  let connection;

  if (!id) {
    return res.status(400).json({ error: "❌ Appointment ID is required" });
  }

  try {
    connection = await connectDB();


const checkResult = await connection.execute(
  `SELECT da.ID, da.STATUS, p.ID as PRESCRIPTION_ID
   FROM DOCTORS_APPOINTMENTS da
   LEFT JOIN PRESCRIPTION p ON da.ID = p.APPOINTMENT_ID
   WHERE da.ID = :id`,
  { id }
);

if (checkResult.rows.length === 0) {
  return res.status(404).json({ error: "❌ Appointment not found" });
}

const currentStatus = checkResult.rows[0][1];
const hasPrescription   = checkResult.rows[0][2];

if (currentStatus !== 'BOOKED') {
  return res.status(400).json({
    error: `❌ Only BOOKED appointments can be completed. Current status: ${currentStatus}`
  });
}

if (!hasPrescription) {
  return res.status(400).json({
    error: "❌ Please write a prescription before completing the appointment"
  });
}

// Update appointment status to COMPLETED
await connection.execute(
  `UPDATE DOCTORS_APPOINTMENTS SET STATUS = 'COMPLETED' WHERE ID = :id`,
  { id }
);

await connection.commit();

return res.status(200).json({
  message: "Appointment marked as completed"
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
