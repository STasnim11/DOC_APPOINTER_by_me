const express = require("express");
const router = express.Router();
const { signup, login } = require("../controllers/authController");
const {login: oldLogin}=require("../controllers/login");
const { getProfile } = require("../controllers/profile");
const timetableController = require("../controllers/timetable");
const appointmentController = require("../controllers/appointmentController");
const patientAppointmentsController = require("../controllers/patientAppointments");
const doctorAppointmentsController = require("../controllers/doctorAppointments");
const doctorProfileController = require("../controllers/doctorProfileUpdate");
const { saveDoctorSpecialization } = require("../controllers/doctorSpecialization"); // Afnan
const doctorRoutes = require("./doctorRoutes");//Afnan
const patientProfileUpdate = require("../controllers/patientProfileUpdate");
const { authenticateToken, requirePatient } = require("../middleware/auth");


console.log("auth routes loaded");

router.get("/specialties", async (req, res) => {
  console.log("✅ Specialties endpoint hit!");
  let connection;
  try {
    const connectDB = require("../db/connection");
    connection = await connectDB();
    console.log('Database connected');

    const result = await connection.execute(
      `SELECT ID, NAME, DESCRIPTION
       FROM SPECIALIZATION
       ORDER BY NAME`
    );

    console.log('Query result rows:', result.rows.length);

    const specialties = result.rows.map(row => ({
      id: row[0],
      name: row[1],
      description: row[2]
    }));

    res.status(200).json({ specialties });
  } catch (err) {
    console.error('Error in specialties endpoint:', err);
    res.status(500).json({ error: 'Failed to fetch specialties: ' + err.message });
  } finally {
    if (connection) await connection.close();
  }
});
console.log("✅ Specialties route registered at /specialties");

router.post("/signup", signup);
router.post("/login", login);
router.get("/profile/:email", getProfile);
router.get("/patient/profile/:email", patientProfileUpdate.getPatientProfile);
router.post("/doctor/setup-schedule", timetableController.saveDoctorSchedule);
router.put("/doctor/update-schedule", timetableController.saveDoctorSchedule);
router.get("/timetable/doctors-by-specialty", timetableController.getDoctorsBySpecialty);
router.get("/timetable/all-doctors", timetableController.getAllDoctors);
router.get("/timetable/top-doctors", timetableController.getTopDoctors);
router.get("/timetable/doctor/:doctorId", timetableController.getDoctorById);
router.get("/appointments/available-slots/:doctorId", appointmentController.getAvailableSlots);
router.post("/appointments/book", appointmentController.bookAppointment);
router.put("/appointments/:id/cancel", authenticateToken, requirePatient, appointmentController.cancelAppointment);
router.get("/patient/:email/appointments", patientAppointmentsController.getPatientAppointmentsByEmail);
router.get("/doctor/appointments/:email", doctorAppointmentsController.getDoctorAppointments);
router.get("/doctor/appointments/:email/today-count", doctorAppointmentsController.getTodayAppointmentsCount);
router.put("/doctor/appointments/:id/complete", doctorAppointmentsController.completeAppointment);
router.put("/doctor/profile", doctorProfileController.updateDoctorProfile);
router.put("/doctor/license", doctorProfileController.updateDoctorLicense);
router.post("/patient-profile", patientProfileUpdate.createPatientProfile);
router.put("/patient/update-profile", authenticateToken, requirePatient, patientProfileUpdate.updatePatientProfile);
router.delete("/patient/delete-profile", authenticateToken, requirePatient, patientProfileUpdate.deletePatientProfile);

// ✅ New specialization route
router.post("/doctor/specialization", saveDoctorSpecialization);

console.log("✅ All auth routes registered successfully");

module.exports = router;
