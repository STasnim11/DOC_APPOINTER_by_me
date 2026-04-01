console.log("login.js file loaded!");
const bcrypt = require("bcrypt");
const connectDB = require("../db/connection");

exports.login = async (req, res) => {
  const { email, pass } = req.body;
  console.log(" Login request received:", { email });

  // TEST ADMIN LOGIN - Bypass database for demo
  if (email === "admin@test.com" && pass === "admin123") {
    return res.status(200).json({
      message: "✅ Login successful",
      user: {
        id: 1,
        name: "Admin User",
        email: "admin@test.com",
        role: "ADMIN",
      },
    });
  }

  let connection;

  try {
    connection = await connectDB();
    console.log("🔗 Connected to database");

    
    const result = await connection.execute(
      `SELECT ID, NAME, EMAIL, PASS, ROLE FROM USERS WHERE EMAIL = :email`,
      { email }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "❌ User not found" });
    }

    const user = result.rows[0];
    const dbUser = {
      id: user[0],
      name: user[1],
      email: user[2],
      hashedPassword: user[3],
      role: user[4],
    };

    
    const isMatch = await bcrypt.compare(pass, dbUser.hashedPassword);

    if (!isMatch) {
      return res.status(401).json({ message: "❌ Invalid password" });
    }

    res.status(200).json({
      message: "✅ Login successful",
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
      },
    });

  } catch (err) {
    console.error(" Login error:", err.message);
    res.status(500).json({ error: "❌ " + err.message });
  } finally {
    if (connection) {
      await connection.close();
      console.log("🔌 Database connection closed");
    }
  }
};
