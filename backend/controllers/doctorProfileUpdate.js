const connectDB = require("../db/connection");

// GET doctor profile by email
exports.getDoctorProfile = async (req, res) => {
  const { email } = req.params;
  let connection;

  if (!email) {
    return res.status(400).json({ error: "❌ Email is required" });
  }

  try {
    connection = await connectDB();

    // Get user info
    const userResult = await connection.execute(
      `SELECT u.ID, u.NAME, u.EMAIL
       FROM USERS u
       WHERE TRIM(LOWER(u.EMAIL)) = TRIM(LOWER(:email))
         AND TRIM(UPPER(u.ROLE)) = 'DOCTOR'`,
      { email }
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Doctor not found" });
    }

    const [userId, name, userEmail] = userResult.rows[0];

    // Get doctor details
    const doctorResult = await connection.execute(
      `SELECT d.ID, d.LICENSE_NUMBER
       FROM DOCTOR d
       WHERE d.USER_ID = :userId`,
      { userId }
    );

    let license = "Not provided";
    let specialization = "Not provided";
    let doctorId = null;

    if (doctorResult.rows.length > 0) {
      doctorId = doctorResult.rows[0][0];
      license = doctorResult.rows[0][1] || "Not provided";
      
      // Get specialization from DOC_SPECIALIZATION table
      const specResult = await connection.execute(
        `SELECT s.NAME
         FROM DOC_SPECIALIZATION ds
         JOIN SPECIALIZATION s ON ds.SPECIALIZATION_ID = s.ID
         WHERE ds.DOCTOR_ID = :doctorId`,
        { doctorId }
      );
      
      if (specResult.rows.length > 0) {
        specialization = specResult.rows[0][0] || "Not provided";
      }
    }

    // Get availability (from DOCTOR_SCHEDULE table if exists)
    const availabilityResult = await connection.execute(
      `SELECT DAY_OF_WEEK, START_TIME, END_TIME
       FROM DOCTOR_SCHEDULE
       WHERE DOCTOR_ID = :doctorId`,
      { doctorId }
    );

    const availability = {
      Sunday: { active: false, start: "10:00", end: "18:00" },
      Monday: { active: false, start: "10:00", end: "18:00" },
      Tuesday: { active: false, start: "10:00", end: "18:00" },
      Wednesday: { active: false, start: "10:00", end: "18:00" },
      Thursday: { active: false, start: "10:00", end: "18:00" },
      Friday: { active: false, start: "10:00", end: "18:00" },
      Saturday: { active: false, start: "10:00", end: "18:00" },
    };

    availabilityResult.rows.forEach(row => {
      const day = row[0];
      const start = row[1];
      const end = row[2];
      if (availability[day]) {
        availability[day] = { active: true, start, end };
      }
    });

    // Get appointments
    const appointmentsResult = await connection.execute(
      `SELECT da.ID, da.APPOINTMENT_DATE, da.STATUS, da.TYPE,
              ts.START_TIME, ts.END_TIME, pu.NAME as PATIENT_NAME
       FROM DOCTORS_APPOINTMENTS da
       JOIN TIME_SLOTS ts ON da.TIME_SLOT_ID = ts.ID
       JOIN PATIENT p ON da.PATIENT_ID = p.ID
       JOIN USERS pu ON p.USER_ID = pu.ID
       WHERE da.DOCTOR_ID = :doctorId
       ORDER BY da.APPOINTMENT_DATE DESC`,
      { doctorId }
    );

    const appointments = appointmentsResult.rows.map(row => ({
      id: row[0],
      date: row[1],
      status: row[2],
      type: row[3],
      startTime: row[4],
      endTime: row[5],
      patientName: row[6],
    }));

    return res.status(200).json({
      name,
      email: userEmail,
      license,
      specialization,
      availability,
      appointments,
    });

  } catch (error) {
    console.error("Get doctor profile error:", error);
    return res.status(500).json({ error: "❌ Failed to fetch doctor profile" });
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

// POST doctor availability
exports.saveDoctorAvailability = async (req, res) => {
  const { email } = req.params;
  const { availability } = req.body;
  let connection;

  if (!email || !availability) {
    return res.status(400).json({ error: "❌ Email and availability are required" });
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

    // Delete existing schedule
    await connection.execute(
      `DELETE FROM DOCTOR_SCHEDULE WHERE DOCTOR_ID = :doctorId`,
      { doctorId }
    );

    // Insert new schedule
    for (const [day, schedule] of Object.entries(availability)) {
      if (schedule.active) {
        await connection.execute(
          `INSERT INTO DOCTOR_SCHEDULE (DOCTOR_ID, DAY_OF_WEEK, START_TIME, END_TIME)
           VALUES (:doctorId, :day, :start, :end)`,
          {
            doctorId,
            day,
            start: schedule.start,
            end: schedule.end,
          }
        );
      }
    }

    await connection.commit();

    return res.status(200).json({ message: "✅ Availability updated successfully" });

  } catch (error) {
    console.error("Save doctor availability error:", error);
    if (connection) {
      try {
        await connection.rollback();
      } catch (_) {}
    }
    return res.status(500).json({ error: "❌ Failed to save availability" });
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

exports.updateDoctorProfile = async (req, res) => {
  const {
    email,
    licenseNumber,
    degrees,
    experienceYears,
    deptId,
    branchId,
  } = req.body;

  let connection;

  if (
    !email ||
    !licenseNumber ||
    !degrees ||
    experienceYears === undefined ||
    deptId === undefined ||
    branchId === undefined
  ) {
    return res.status(400).json({
      error: "❌ email, licenseNumber, degrees, experienceYears, deptId, and branchId are required",
    });
  }

  try {
    connection = await connectDB();

    const result = await connection.execute(
      `SELECT d.ID
       FROM DOCTOR d
       JOIN USERS u
         ON d.USER_ID = u.ID
       WHERE TRIM(LOWER(u.EMAIL)) = TRIM(LOWER(:email))
         AND TRIM(UPPER(u.ROLE)) = 'DOCTOR'`,
      { email }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "❌ Doctor profile not found for this email",
      });
    }

    const doctorId = result.rows[0][0];

    await connection.execute(
      `UPDATE DOCTOR
       SET LICENSE_NUMBER = :licenseNumber,
           DEGREES = :degrees,
           EXPERIENCE_YEARS = :experienceYears,
           DEPT_ID = :deptId,
           BRANCH_ID = :branchId
       WHERE ID = :doctorId`,
      {
        licenseNumber,
        degrees,
        experienceYears,
        deptId,
        branchId,
        doctorId,
      }
    );

    await connection.commit();

    return res.status(200).json({
      message: "✅ Doctor profile updated successfully",
      doctorId,
    });
  } catch (error) {
    console.error("Doctor profile update error:", error);

    if (connection) {
      try {
        await connection.rollback();
      } catch (_) {}
    }

    return res.status(500).json({
      error: "❌ Failed to update doctor profile",
    });
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
// const connectDB = require("../db/connection");

// exports.updateDoctorProfile = async (req, res) => {
//   const {
//     email,
//     licenseNumber,
//     degrees,
//     experienceYears,
//     deptId,
//     branchId,
//   } = req.body;

//   let connection;

//   console.log("1. Request received");
//   console.log("2. req.body =", req.body);

//   if (
//     !email ||
//     !licenseNumber ||
//     !degrees ||
//     experienceYears === undefined ||
//     deptId === undefined ||
//     branchId === undefined
//   ) {
//     console.log("3. Validation failed");
//     return res.status(400).json({
//       error: "email, licenseNumber, degrees, experienceYears, deptId, and branchId are required",
//     });
//   }

//   try {
//     console.log("4. Connecting to DB...");
//     connection = await connectDB();
//     console.log("5. DB connected");

//     console.log("6. Running SELECT...");
//     const result = await connection.execute(
//       `SELECT d.ID
//        FROM DOCTOR d
//        JOIN USERS u
//          ON d.USER_ID = u.ID
//        WHERE TRIM(LOWER(u.EMAIL)) = TRIM(LOWER(:email))
//          AND TRIM(UPPER(u.ROLE)) = 'DOCTOR'`,
//       { email }
//     );
//     console.log("7. SELECT done");
//     console.log("8. result.rows =", result.rows);

//     if (result.rows.length === 0) {
//       console.log("9. Doctor not found");
//       return res.status(404).json({
//         error: "Doctor profile not found for this email",
//       });
//     }

//     const doctorId = result.rows[0][0];
//     console.log("10. doctorId =", doctorId);

//     console.log("11. Running UPDATE...");
//     const updateResult = await connection.execute(
//       `UPDATE DOCTOR
//        SET LICENSE_NUMBER = :licenseNumber,
//            DEGREES = :degrees,
//            EXPERIENCE_YEARS = :experienceYears,
//            DEPT_ID = :deptId,
//            BRANCH_ID = :branchId
//        WHERE ID = :doctorId`,
//       {
//         licenseNumber,
//         degrees,
//         experienceYears,
//         deptId,
//         branchId,
//         doctorId,
//       }
//     );
//     console.log("12. UPDATE done");
//     console.log("13. rowsAffected =", updateResult.rowsAffected);

//     console.log("14. Committing...");
//     await connection.commit();
//     console.log("15. Commit done");

//     return res.status(200).json({
//       message: "Doctor profile updated successfully",
//       doctorId,
//     });
//   } catch (error) {
//     console.error("Doctor profile update error:", error);

//     if (connection) {
//       try {
//         await connection.rollback();
//       } catch (rollbackError) {
//         console.error("Rollback error:", rollbackError);
//       }
//     }

//     return res.status(500).json({
//       error: "Failed to update doctor profile",
//       details: error.message,
//     });
//   } finally {
//     if (connection) {
//       try {
//         await connection.close();
//         console.log("16. Connection closed");
//       } catch (closeError) {
//         console.error("Error closing DB connection:", closeError);
//       }
//     }
//   }
// };