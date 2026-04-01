const oracledb = require("oracledb");
const connectDB = require("../db/connection");

exports.createDoctorProfile = async (req, res) => {
  const {
    email,
    licenseNumber,
    degrees,
    experienceYears,
    deptId,
    branchId,
    specializationId,
    timeSlots // expect array: [{ startTime: "09:00", endTime: "11:00" }, ...]
  } = req.body;

  if (!email || !licenseNumber || !degrees || experienceYears === undefined || !deptId || !branchId) {
    return res.status(400).json({
      error: "❌ email, licenseNumber, degrees, experienceYears, deptId, and branchId are required",
    });
  }

  let connection;
  try {
    connection = await connectDB();

    // 1️⃣ Get user ID from email
    const userResult = await connection.execute(
      `SELECT ID FROM USERS WHERE TRIM(LOWER(EMAIL)) = TRIM(LOWER(:email)) AND TRIM(UPPER(ROLE)) = 'DOCTOR'`,
      { email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log("Email received from React:", email);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Doctor user not found" });
    }

    const userId = userResult.rows[0].ID;

    // 2️⃣ Check if doctor profile exists
    const doctorResult = await connection.execute(
      `SELECT ID, LICENSE_NUMBER, DEGREES, EXPERIENCE_YEARS, DEPT_ID, BRANCH_ID
       FROM DOCTOR WHERE USER_ID = :userId`,
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    let doctorId;

    if (doctorResult.rows.length === 0) {
      // Doctor placeholder doesn't exist → create new
      const insertResult = await connection.execute(
        `INSERT INTO DOCTOR (USER_ID, LICENSE_NUMBER, DEGREES, EXPERIENCE_YEARS, DEPT_ID, BRANCH_ID)
         VALUES (:userId, :licenseNumber, :degrees, :experienceYears, :deptId, :branchId)
         RETURNING ID INTO :doctorId`,
        {
          userId,
          licenseNumber,
          degrees,
          experienceYears,
          deptId,
          branchId,
          doctorId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        }
      );
      doctorId = insertResult.outBinds.doctorId[0];
    } else {
      // Doctor exists → check if required fields are NULL
      const existing = doctorResult.rows[0];
      doctorId = existing.ID;

      if (
        existing.LICENSE_NUMBER && existing.DEGREES && existing.EXPERIENCE_YEARS &&
        existing.DEPT_ID && existing.BRANCH_ID
      ) {
        return res.status(400).json({ error: "❌ Doctor profile already completed" });
      }

      // Update missing fields (only overwrite NULL)
      await connection.execute(
        `UPDATE DOCTOR SET
           LICENSE_NUMBER = NVL(LICENSE_NUMBER, :licenseNumber),
           DEGREES = NVL(DEGREES, :degrees),
           EXPERIENCE_YEARS = NVL(EXPERIENCE_YEARS, :experienceYears),
           DEPT_ID = NVL(DEPT_ID, :deptId),
           BRANCH_ID = NVL(BRANCH_ID, :branchId)
         WHERE ID = :doctorId`,
        { licenseNumber, degrees, experienceYears, deptId, branchId, doctorId }
      );
    }

    // 3️⃣ Save specialization (replace existing)
    if (specializationId) {
      await connection.execute(`DELETE FROM DOC_SPECIALIZATION WHERE DOCTOR_ID = :doctorId`, { doctorId });
      await connection.execute(
        `INSERT INTO DOC_SPECIALIZATION (DOCTOR_ID, SPECIALIZATION_ID) VALUES (:doctorId, :specializationId)`,
        { doctorId, specializationId }
      );
    }

    // 4️⃣ Save time slots (replace existing)
    if (Array.isArray(timeSlots) && timeSlots.length > 0) {
      await connection.execute(`DELETE FROM TIME_SLOTS WHERE DOCTOR_ID = :doctorId`, { doctorId });
      for (const slot of timeSlots) {
        await connection.execute(
          `INSERT INTO TIME_SLOTS (DOCTOR_ID, START_TIME, END_TIME)
           VALUES (:doctorId, TO_DATE(:startTime, 'HH24:MI'), TO_DATE(:endTime, 'HH24:MI'))`,
          { doctorId, startTime: slot.startTime, endTime: slot.endTime }
        );
      }
    }

    await connection.commit();
    res.status(201).json({ message: "✅ Doctor profile saved successfully" });

  } catch (err) {
    console.error("Error creating doctor profile:", err);
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


/**
 * POST — Save or update doctor's specialization
 */
exports.saveDoctorSpecialization = async (req, res) => {
  const { email, specializationId } = req.body;
  if (!email || !specializationId) {
    return res.status(400).json({ error: "❌ Email and specializationId are required" });
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

    // 2️⃣ Remove existing specialization (if any)
    await connection.execute(
      `DELETE FROM DOC_SPECIALIZATION WHERE DOCTOR_ID = :doctorId`,
      { doctorId }
    );

    // 3️⃣ Insert new specialization
    await connection.execute(
      `INSERT INTO DOC_SPECIALIZATION (DOCTOR_ID, SPECIALIZATION_ID)
       VALUES (:doctorId, :specializationId)`,
      { doctorId, specializationId }
    );

    await connection.commit();
    res.status(200).json({ message: "✅ Specialization saved successfully" });

  } catch (err) {
    console.error("Error saving doctor specialization:", err);
    res.status(500).json({ error: "❌ Server error" });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (_) {}
    }
  }
};


/**
 * GET — Fetch all specializations
 */
exports.getAllSpecializations = async (req, res) => {
  let connection;
  try {
    connection = await connectDB();

    const result = await connection.execute(
      `SELECT ID AS specialization_id, NAME 
       FROM SPECIALIZATION`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Map to frontend-friendly format
    const specializations = result.rows.map((row) => ({
      ID: row.SPECIALIZATION_ID,
      NAME: row.NAME,
    }));

    res.json(specializations);

  } catch (err) {
    console.error("Error fetching specializations:", err);
    res.status(500).json({ error: "❌ Server error" });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (_) {}
    }
  }
};

/**
 * POST — Create doctor's time slots
 */
exports.createTimeSlots = async (req, res) => {
  const { email, date, startTime, endTime, interval } = req.body;

  console.log("Time slot request received:", req.body);

  // temporary validation
  if (!email || !date || !startTime || !endTime || !interval) {
    return res.status(400).json({
      error: "❌ email, date, startTime, endTime and interval are required",
    });
  }

  // For now just confirm request reached backend
  res.status(200).json({
    message: "✅ Time slot API reached successfully",
  });
};