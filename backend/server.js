require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
// DEAD CODE: doctorRoutes file is unused - all doctor routes are in auth.js
// const doctorRoutes = require('./routes/doctorRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const labTestRoutes = require('./routes/labTestRoutes');
const bedBookingRoutes = require('./routes/bedBookingRoutes');

let adminRoutes;
try {
  adminRoutes = require('./routes/adminRoutes');
  console.log('✅ Admin routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading admin routes:', error.message);
  console.error(error.stack);
}

app.use('/api', labTestRoutes);
console.log('✅ Lab test routes mounted at /api');
app.use('/api', bedBookingRoutes);
console.log('✅ Bed booking routes mounted at /api');
app.use('/api', authRoutes);
console.log('✅ Auth routes mounted at /api');
// DEAD CODE: doctorRoutes mounted here but all routes already in auth.js at /api/doctor/*
// app.use('/api/doctor', doctorRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
if (adminRoutes) {
  app.use('/api/admin', adminRoutes);
  console.log('✅ Admin routes mounted at /api/admin');
}

// Test route
const connectDB = require('./db/connection');
app.get('/test', async (req, res) => {
  try {
    const connection = await connectDB();
    const result = await connection.execute(`SELECT * FROM dual`);
    await connection.close();
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
