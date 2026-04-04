const connectDB = require("../db/connection");

// GET doctor profile by email
exports.getDoctorProfile = async (req, res) => {
  const { email } = req.params;
  let connection;

  console.log('=== GET DOCTOR PROFILE START ===');
  console.log('Email parameter:', email);

  if (!email) {
    return res.status(400).json({ error: "❌ Email is required" });
  }

  try {
    connection = await connectDB();

    // Get user info
    const userResult = await connection.execute(
      `SELECT u.ID, u.NAME, u.EMAIL, u.PHONE
       FROM USERS u
       WHERE TRIM(LOWER(u.EMAIL)) = TRIM(LOWER(:email))
         AND TRIM(UPPER(u.ROLE)) = 'DOCTOR'`,
      { email }
    );

    console.log('User query result rows:', userResult.rows.length);

    if (userResult.rows.length === 0) {
      console.log('No user found for email:', email);
      return res.status(404).json({ error: "❌ Doctor not found" });
    }

    const [userId, name, userEmail, phone] = userResult.rows[0];
    console.log('User found:', { userId, name, userEmail, phone });

    // Get doctor details
    console.log('Querying DOCTOR table for USER_ID:', userId);
    const doctorResult = await connection.execute(
      `SELECT d.ID, d.LICENSE_NUMBER, d.DEGREES, d.EXPERIENCE_YEARS, d.FEES, d.GENDER
       FROM DOCTOR d
       WHERE d.USER_ID = :userId`,
      { userId }
    );
    
    console.log('Doctor query result rows:', doctorResult.rows.length);
    if (doctorResult.rows.length > 0) {
      console.log('Raw doctor row data:', doctorResult.rows[0]);
    }

    let license = "Not provided";
    let degrees = "Not provided";
    let experienceYears = 0;
    let fees = null;
    let gender = null;
    let specialization = null;
    let specializationId = null;
    let doctorId = null;

    if (doctorResult.rows.length > 0) {
      doctorId = doctorResult.rows[0][0];
      license = doctorResult.rows[0][1] || "Not provided";
      degrees = doctorResult.rows[0][2] || "Not provided";
      experienceYears = doctorResult.rows[0][3] || 0;
      fees = doctorResult.rows[0][4];
      gender = doctorResult.rows[0][5];
      
      console.log('Doctor data from DB:', {
        doctorId,
        license,
        degrees,
        experienceYears,
        fees,
        gender
      });
      console.log('License is NULL?', doctorResult.rows[0][1] === null);
      console.log('License raw value:', doctorResult.rows[0][1]);
      
      // Get specialization from DOC_SPECIALIZATION table
      const specResult = await connection.execute(
        `SELECT s.ID, s.NAME
         FROM DOC_SPECIALIZATION ds
         JOIN SPECIALIZATION s ON ds.SPECIALIZATION_ID = s.ID
         WHERE ds.DOCTOR_ID = :doctorId`,
        { doctorId }
      );
      
      if (specResult.rows.length > 0) {
        specializationId = specResult.rows[0][0];
        specialization = specResult.rows[0][1];
      }
    }

    // Get appointments using stored times (no need to join TIME_SLOTS)
    const appointmentsResult = await connection.execute(
      `SELECT da.ID, da.APPOINTMENT_DATE, da.STATUS, da.TYPE,
              da.START_TIME, da.END_TIME, pu.NAME as PATIENT_NAME, pu.PHONE as PATIENT_PHONE, pu.EMAIL as PATIENT_EMAIL
       FROM DOCTORS_APPOINTMENTS da
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
      patientPhone: row[7],
      patientEmail: row[8],
    }));

    console.log('=== RESPONSE SENT ===');
    console.log('License in response:', license);
    console.log('Doctor ID in response:', doctorId);

    return res.status(200).json({
      doctorId,  // ← ADDED THIS!
      name,
      email: userEmail,
      phone,
      license,
      degrees,
      experienceYears,
      fees,
      gender,
      specialization,
      specializationId,
      appointments,
    });

  } catch (error) {
    console.error("Get doctor profile error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    return res.status(500).json({ 
      error: "❌ Failed to fetch doctor profile",
      details: error.message 
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

// Update only license number
exports.updateDoctorLicense = async (req, res) => {
  const { email, licenseNumber } = req.body;
  let connection;

  if (!email || !licenseNumber) {
    return res.status(400).json({
      error: "❌ Email and license number are required",
    });
  }

  // Validate license number format (alphanumeric, 5-20 characters)
  const trimmedLicense = licenseNumber.trim().toUpperCase();
  
  if (trimmedLicense.length < 5 || trimmedLicense.length > 20) {
    return res.status(400).json({
      error: "❌ License number must be 5-20 characters long",
    });
  }
  
  if (!/^[A-Z0-9]+$/.test(trimmedLicense)) {
    return res.status(400).json({
      error: "❌ License number can only contain letters and numbers",
    });
  }

  try {
    connection = await connectDB();

    // Check if license already exists for another doctor
    const licenseCheck = await connection.execute(
      `SELECT d.ID, u.EMAIL
       FROM DOCTOR d
       JOIN USERS u ON d.USER_ID = u.ID
       WHERE UPPER(TRIM(d.LICENSE_NUMBER)) = :trimmedLicense`,
      { trimmedLicense }
    );

    if (licenseCheck.rows.length > 0) {
      const existingEmail = licenseCheck.rows[0][1];
      if (existingEmail.toLowerCase() !== email.toLowerCase()) {
        return res.status(400).json({
          error: "❌ This license number is already registered to another doctor",
        });
      }
    }

    // Get doctor ID
    const result = await connection.execute(
      `SELECT d.ID
       FROM DOCTOR d
       JOIN USERS u ON d.USER_ID = u.ID
       WHERE TRIM(LOWER(u.EMAIL)) = TRIM(LOWER(:email))
         AND TRIM(UPPER(u.ROLE)) = 'DOCTOR'`,
      { email }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "❌ Doctor profile not found",
      });
    }

    const doctorId = result.rows[0][0];

    // Update license number
    await connection.execute(
      `UPDATE DOCTOR
       SET LICENSE_NUMBER = :trimmedLicense
       WHERE ID = :doctorId`,
      { trimmedLicense, doctorId }
    );

    await connection.commit();

    return res.status(200).json({
      message: "License number updated successfully",
    });
  } catch (error) {
    console.error("Update license error:", error);

    if (connection) {
      try {
        await connection.rollback();
      } catch (_) {}
    }

    return res.status(500).json({
      error: "❌ Failed to update license number",
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


// Update doctor basic info (degrees, experience, fees, gender, specialization)
exports.updateDoctorBasicInfo = async (req, res) => {
  const { email, degrees, experienceYears, fees, gender, specializationId } = req.body;
  let connection;

  if (!email) {
    return res.status(400).json({
      error: "❌ Email is required",
    });
  }

  try {
    connection = await connectDB();

    // Get doctor ID
    const result = await connection.execute(
      `SELECT d.ID
       FROM DOCTOR d
       JOIN USERS u ON d.USER_ID = u.ID
       WHERE TRIM(LOWER(u.EMAIL)) = TRIM(LOWER(:email))
         AND TRIM(UPPER(u.ROLE)) = 'DOCTOR'`,
      { email }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "❌ Doctor profile not found",
      });
    }

    const doctorId = result.rows[0][0];

    // Build dynamic update query for DOCTOR table
    const updates = [];
    const params = { doctorId };

    if (degrees !== undefined && degrees !== null && degrees !== '') {
      updates.push('DEGREES = :degrees');
      params.degrees = degrees;
    }
    if (experienceYears !== undefined && experienceYears !== null && experienceYears !== '') {
      updates.push('EXPERIENCE_YEARS = :experienceYears');
      params.experienceYears = experienceYears;
    }
    if (fees !== undefined && fees !== null && fees !== '') {
      updates.push('FEES = :fees');
      params.fees = fees;
    }
    if (gender !== undefined && gender !== null && gender !== '') {
      updates.push('GENDER = :gender');
      params.gender = gender;
    }

    // Update DOCTOR table if there are fields to update
    if (updates.length > 0) {
      console.log('Updating doctor with:', params);
      console.log('Update query:', `UPDATE DOCTOR SET ${updates.join(', ')} WHERE ID = :doctorId`);

      await connection.execute(
        `UPDATE DOCTOR SET ${updates.join(', ')} WHERE ID = :doctorId`,
        params
      );
    }

    // Handle specialization update in DOC_SPECIALIZATION table
    if (specializationId !== undefined && specializationId !== null && specializationId !== '') {
      console.log('Updating specialization to:', specializationId);
      
      // Check if specialization entry exists
      const specCheck = await connection.execute(
        `SELECT ID FROM DOC_SPECIALIZATION WHERE DOCTOR_ID = :doctorId`,
        { doctorId }
      );

      if (specCheck.rows.length > 0) {
        // Update existing specialization
        await connection.execute(
          `UPDATE DOC_SPECIALIZATION 
           SET SPECIALIZATION_ID = :specializationId 
           WHERE DOCTOR_ID = :doctorId`,
          { specializationId, doctorId }
        );
        console.log('Specialization updated');
      } else {
        // Insert new specialization
        await connection.execute(
          `INSERT INTO DOC_SPECIALIZATION (DOCTOR_ID, SPECIALIZATION_ID) 
           VALUES (:doctorId, :specializationId)`,
          { doctorId, specializationId }
        );
        console.log('Specialization inserted');
      }
    }

    await connection.commit();

    return res.status(200).json({
      message: "✅ Profile updated successfully",
    });
  } catch (error) {
    console.error("Update doctor basic info error:", error);
    console.error("Error details:", error.message);

    if (connection) {
      try {
        await connection.rollback();
      } catch (_) {}
    }

    return res.status(500).json({
      error: "❌ Failed to update profile: " + error.message,
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