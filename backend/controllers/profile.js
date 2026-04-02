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