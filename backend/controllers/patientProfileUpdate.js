const oracledb = require("oracledb");
const connectDB = require("../db/connection");

exports.getPatientProfile = async (req, res) => {
  const { email } = req.params;

  let connection;
  try {
    connection = await connectDB();

    const userResult = await connection.execute(
      `SELECT u.ID, u.NAME, u.EMAIL, u.PHONE, u.ROLE,
              p.DATE_OF_BIRTH, p.GENDER, p.OCCUPATION, p.BLOOD_TYPE, 
              p.MARITAL_STATUS, p.ADDRESS
       FROM USERS u
       LEFT JOIN PATIENT p ON u.ID = p.USER_ID
       WHERE TRIM(LOWER(u.EMAIL)) = TRIM(LOWER(:email))
         AND TRIM(UPPER(u.ROLE)) = 'PATIENT'`,
      { email }
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Patient not found" });
    }

    const row = userResult.rows[0];
    const profile = {
      id: row[0],
      name: row[1],
      email: row[2],
      phone: row[3],
      role: row[4],
      dateOfBirth: row[5],
      gender: row[6],
      occupation: row[7],
      bloodType: row[8],
      maritalStatus: row[9],
      address: row[10]
    };

    return res.status(200).json(profile);
  } catch (err) {
    console.error("Get patient profile error:", err);
    return res.status(500).json({ error: "❌ Failed to get profile" });
  } finally {
    if (connection) await connection.close();
  }
};

exports.createPatientProfile = async (req, res) => {
  const {
    userId,
    dateOfBirth,
    gender,
    occupation,
    bloodType,
    maritalStatus,
    address,
  } = req.body;

  
  if (!userId) {
    return res.status(400).json({
      error: "❌ userId is required",
    });
  }

  let connection;

  try {
    connection = await connectDB();

    const sql = `UPDATE PATIENT
SET
  DATE_OF_BIRTH = :dateOfBirth,
  GENDER = :gender,
  OCCUPATION = :occupation,
  BLOOD_TYPE = :bloodType,
  MARITAL_STATUS = :maritalStatus,
  ADDRESS = :address
WHERE USER_ID = :userId
      ;`

    const binds = {
      userId,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender: gender || null,
      occupation: occupation || null,
      bloodType: bloodType || null,
      maritalStatus: maritalStatus || null,
      address: address || null,
    };

    await connection.execute(sql, binds, { autoCommit: true });

    return res.status(201).json({
      message: "✅ Patient profile created successfully",
    });
  } catch (error) {
    console.error("Error creating patient profile:", error);

    return res.status(500).json({
      error: "❌ Failed to create patient profile",
      details: error.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error("Error closing connection:", closeError);
      }
    }
  }
};

exports.updatePatientProfile = async (req, res) => {
  const { name, phone, dateOfBirth, gender, bloodType, maritalStatus, occupation, address } = req.body;
  const userEmail = req.user?.email;

  if (!userEmail) {
    return res.status(401).json({ error: "❌ Unauthorized" });
  }

  let connection;
  try {
    connection = await connectDB();

    // Update USERS table
    await connection.execute(
      `UPDATE USERS
       SET NAME = :name, PHONE = :phone
       WHERE TRIM(LOWER(EMAIL)) = TRIM(LOWER(:email))
         AND TRIM(UPPER(ROLE)) = 'PATIENT'`,
      { name, phone, email: userEmail }
    );

    // Get user ID
    const userResult = await connection.execute(
      `SELECT ID FROM USERS WHERE TRIM(LOWER(EMAIL)) = TRIM(LOWER(:email))`,
      { email: userEmail }
    );

    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0][0];

      // Update PATIENT table
      await connection.execute(
        `UPDATE PATIENT
         SET DATE_OF_BIRTH = :dateOfBirth,
             GENDER = :gender,
             BLOOD_TYPE = :bloodType,
             MARITAL_STATUS = :maritalStatus,
             OCCUPATION = :occupation,
             ADDRESS = :address
         WHERE USER_ID = :userId`,
        {
          userId,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          gender: gender || null,
          bloodType: bloodType || null,
          maritalStatus: maritalStatus || null,
          occupation: occupation || null,
          address: address || null
        }
      );
    }

    await connection.commit();

    return res.status(200).json({
      message: "✅ Profile updated successfully",
      name,
      phone
    });
  } catch (err) {
    console.error("Update patient profile error:", err);

    if (connection) {
      try {
        await connection.rollback();
      } catch (_) {}
    }

    return res.status(500).json({ error: "❌ Failed to update profile" });
  } finally {
    if (connection) await connection.close();
  }
};

exports.deletePatientProfile = async (req, res) => {
  const userEmail = req.user?.email;

  if (!userEmail) {
    return res.status(401).json({ error: "❌ Unauthorized" });
  }

  let connection;
  try {
    connection = await connectDB();

    const userResult = await connection.execute(
      `SELECT ID
       FROM USERS
       WHERE TRIM(LOWER(EMAIL)) = TRIM(LOWER(:email))
         AND TRIM(UPPER(ROLE)) = 'PATIENT'`,
      { email: userEmail }
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Patient not found" });
    }

    const userId = userResult.rows[0][0];

    await connection.execute(
      `DELETE FROM DOCTORS_APPOINTMENTS
       WHERE PATIENT_ID IN (SELECT ID FROM PATIENT WHERE USER_ID = :userId)`,
      { userId }
    );

    await connection.execute(
      `DELETE FROM PATIENT WHERE USER_ID = :userId`,
      { userId }
    );

    await connection.execute(
      `DELETE FROM USERS WHERE ID = :userId`,
      { userId }
    );

    await connection.commit();

    return res.status(200).json({
      message: "✅ Profile deleted successfully"
    });
  } catch (err) {
    console.error("Delete patient profile error:", err);

    if (connection) {
      try {
        await connection.rollback();
      } catch (_) {}
    }

    return res.status(500).json({ error: "❌ Failed to delete profile" });
  } finally {
    if (connection) await connection.close();
  }
};