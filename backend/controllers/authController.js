console.log("authController.js file loaded!");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const connectDB = require("../db/connection");

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (pass) => {
  return pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass);
};

exports.signup = async (req, res) => {
  const { name, email, pass, phone, role } = req.body;
  console.log(" Signup request received:", { name, email, phone, role });

  if (!name || !email || !pass || !phone || !role) {
    return res.status(400).json({ error: "❌ All fields are required" });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ error: "❌ Invalid email format" });
  }

  if (!validatePassword(pass)) {
    return res.status(400).json({ 
      error: "❌ Password must be at least 8 characters with uppercase and number" 
    });
  }

  if (!/^\d{11}$/.test(phone)) {
    return res.status(400).json({ error: "❌ Phone must be 11 digits" });
  }

  const validRoles = ["user", "admin", "patient","doctor","staff"];
  if (!validRoles.includes(role.toLowerCase())) {
    return res.status(400).json({ error: "❌ Invalid role" });
  }
  const normalizedRole = role.toUpperCase();

  let connection;
  try {
    

     connection = await connectDB();
    console.log(" Connected to database");

    const duplicateCheck = await connection.execute(
      'SELECT EMAIL FROM USERS WHERE EMAIL = :email',
      { email }
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({ 
        error: "❌ User with this email already exists" 
      });
    }

   
    const hashedPassword = await bcrypt.hash(pass, 10);
    console.log("🔐 Password hashed successfully");

    
    await connection.execute(
      `INSERT INTO USERS (NAME, EMAIL, PASS, PHONE, ROLE)
       VALUES (:name, :email, :pass, :phone, :normalizedRole)`,
      { name, email, pass: hashedPassword, phone, normalizedRole },
      //{ autoCommit: true }
    );
    console.log("User created successfully in database:", email);
    

    const userResult = await connection.execute(
      `SELECT ID FROM USERS WHERE EMAIL = :email`,
      { email }
    );
    const userId = userResult.rows[0][0];
    console.log("Fetched USER_ID:", userId);
    
    if (normalizedRole === "DOCTOR") {
      await connection.execute(
        `INSERT INTO DOCTOR (USER_ID)
         VALUES (:userId)`,
        { userId }
      );
      console.log("Inserted into DOCTOR");
    } else if (normalizedRole === "PATIENT") {
      await connection.execute(
        `INSERT INTO PATIENT (USER_ID)
         VALUES (:userId)`,
        { userId }
      );
      console.log("Inserted into PATIENT");
    } else if (normalizedRole === "ADMIN") {
      await connection.execute(
        `INSERT INTO ADMIN (USERS_ID, ROLE)
         VALUES (:userId, 'SUPER_ADMIN')`,
        { userId }
      );
      console.log("Inserted into ADMIN");
    }
    
    await connection.commit();
    console.log("Transaction committed");
    
    // Generate JWT token (same as login)
    const token = jwt.sign(
      { 
        id: userId, 
        email: email, 
        role: normalizedRole 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.status(201).json({ 
      message: "✅ User created successfully",
      token,
      user: { 
        id: userId,
        name, 
        email, 
        phone, 
        role: normalizedRole 
      } 
    });

  } catch (err) {
    console.error("Signup error:", err);
    if (connection) {
      try {
        await connection.rollback();
        console.log("Transaction rolled back");
      } catch (rollbackErr) {
        console.error("Rollback error:", rollbackErr);
      }
    }
    if (err.message.includes("UNIQUE constraint") || err.message.includes("ORA-00001")) {
      return res.status(409).json({ 
        error: "❌ User with this email already exists" 
      });
    }
    res.status(500).json({ error: "❌ Signup failed. Please try again." });
  }finally{
    if(connection)
    {
      await connection.close();
      console.log("Database connection closed");
    }
  }
};


// Login endpoint with JWT
exports.login = async (req, res) => {
  const { email, pass } = req.body;
  console.log("Login request received:", { email });

  if (!email || !pass) {
    return res.status(400).json({ error: "❌ Email and password are required" });
  }

  let connection;
  try {
    connection = await connectDB();
    console.log("Connected to database");

    // Fetch user from database
    const result = await connection.execute(
      `SELECT ID, NAME, EMAIL, PASS, PHONE, ROLE FROM USERS WHERE EMAIL = :email`,
      { email }
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "❌ Invalid email or password" });
    }

    const user = {
      id: result.rows[0][0],
      name: result.rows[0][1],
      email: result.rows[0][2],
      pass: result.rows[0][3],
      phone: result.rows[0][4],
      role: result.rows[0][5]
    };

    // Verify password
    const isPasswordValid = await bcrypt.compare(pass, user.pass);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "❌ Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    console.log("✅ Login successful for:", email);

    res.status(200).json({
      message: "✅ Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "❌ Login failed. Please try again." });
  } finally {
    if (connection) {
      await connection.close();
      console.log("Database connection closed");
    }
  }
};
