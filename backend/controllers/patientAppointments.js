const connectDB = require("../db/connection");

const formatAppointments = (rows) => {
  return rows.map((row) => ({
    appointmentId: row[0],
    appointmentDate: row[1],
    status: row[2],
    type: row[3],
    startTime: row[4],
    endTime: row[5],
    doctorName: row[6],
    doctorEmail: row[7],
    slot: `${row[4]} - ${row[5]}`,
    hasPrescription: row[8] ? true : false,
    prescriptionId: row[8]
  }));
};

exports.getPatientAppointmentsByEmail = async (req, res) => {
  const { email } = req.params;
  let connection;

  if (!email) {
    return res.status(400).json({ error: "❌ Patient email is required" });
  }

  try {
    connection = await connectDB();

    const userResult = await connection.execute(
      `SELECT ID
       FROM USERS
       WHERE TRIM(LOWER(EMAIL)) = TRIM(LOWER(:email))
         AND TRIM(UPPER(ROLE)) = 'PATIENT'`,
      { email }
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Patient user not found" });
    }

    const userId = userResult.rows[0][0];

    const patientResult = await connection.execute(
      `SELECT ID
       FROM PATIENT
       WHERE USER_ID = :userId`,
      { userId }
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Patient profile not found" });
    }

    const patientId = patientResult.rows[0][0];

    // Get appointments using stored times (no need to join TIME_SLOTS)
    // Also get prescription info
    const appointmentResult = await connection.execute(
      `SELECT
          da.ID,
          da.APPOINTMENT_DATE,
          da.STATUS,
          da.TYPE,
          da.START_TIME,
          da.END_TIME,
          du.NAME,
          du.EMAIL,
          p.ID as PRESCRIPTION_ID
       FROM DOCTORS_APPOINTMENTS da
       JOIN DOCTOR d
         ON da.DOCTOR_ID = d.ID
       JOIN USERS du
         ON d.USER_ID = du.ID
       LEFT JOIN PRESCRIPTION p
         ON da.ID = p.APPOINTMENT_ID
       WHERE da.PATIENT_ID = :patientId
       ORDER BY da.APPOINTMENT_DATE DESC, da.START_TIME ASC`,
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