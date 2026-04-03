console.log("profile.js file loaded!");
const connectDB = require("../db/connection");

exports.getProfile = async (req, res) => {
  const { email } = req.params;

  let connection;

  try {
    connection = await connectDB();

    const result = await connection.execute(
      `SELECT ID, NAME, EMAIL, ROLE FROM USERS WHERE EMAIL = :email`,
      { email }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "❌ User not found" });
    }

    const user = result.rows[0];

    res.status(200).json({
      id: user[0],
      name: user[1],
      email: user[2],
      role: user[3]
    });

  } catch (err) {
    res.status(500).json({ error: "❌ " + err.message });
  } finally {
    if (connection) await connection.close();
  }
};


// Update user basic info (name, phone)
exports.updateProfile = async (req, res) => {
  const { email, name, phone } = req.body;
  let connection;

  if (!email) {
    return res.status(400).json({ error: "❌ Email is required" });
  }

  try {
    connection = await connectDB();

    // Build dynamic update
    const updates = [];
    const params = { email };

    if (name) {
      updates.push('NAME = :name');
      params.name = name;
    }
    if (phone) {
      updates.push('PHONE = :phone');
      params.phone = phone;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "❌ No fields to update" });
    }

    await connection.execute(
      `UPDATE USERS SET ${updates.join(', ')} WHERE TRIM(LOWER(EMAIL)) = TRIM(LOWER(:email))`,
      params
    );

    await connection.commit();

    return res.status(200).json({
      message: "✅ Profile updated successfully",
    });
  } catch (error) {
    console.error("Update profile error:", error);

    if (connection) {
      try {
        await connection.rollback();
      } catch (_) {}
    }

    return res.status(500).json({
      error: "❌ Failed to update profile",
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
