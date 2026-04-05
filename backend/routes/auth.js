const express = require("express");
const router = express.Router();
const { signup, login } = require("../controllers/authController");
// DEAD CODE: Old login controller replaced by authController
// const {login: oldLogin}=require("../controllers/login");
const { getProfile, updateProfile } = require("../controllers/profile");
const timetableController = require("../controllers/timetable");
const appointmentController = require("../controllers/appointmentController");
const patientAppointmentsController = require("../controllers/patientAppointments");
const doctorAppointmentsController = require("../controllers/doctorAppointments");
const doctorProfileController = require("../controllers/doctorProfileUpdate");
const { saveDoctorSpecialization } = require("../controllers/doctorSpecialization");
// DEAD CODE: doctorRoutes file is unused - all doctor routes are in this file
// const doctorRoutes = require("./doctorRoutes");
const patientProfileUpdate = require("../controllers/patientProfileUpdate");
const { authenticateToken, requirePatient, requireDoctor } = require("../middleware/auth");


console.log("auth routes loaded");

// PUBLIC ROUTES (No authentication required)
router.post("/signup", signup);
router.post("/login", login);

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

// Public timetable/doctor browsing routes
router.get("/timetable/doctors-by-specialty", timetableController.getDoctorsBySpecialty);
router.get("/timetable/all-doctors", timetableController.getAllDoctors);
router.get("/timetable/top-doctors", timetableController.getTopDoctors);
router.get("/timetable/doctor/:doctorId", timetableController.getDoctorById);
router.get("/appointments/available-slots/:doctorId", appointmentController.getAvailableSlots);

// AUTHENTICATED ROUTES - All routes below require valid token
router.use(authenticateToken);

// General authenticated routes
router.get("/profile/:email", getProfile);
router.put("/profile/update", updateProfile);

// DOCTOR-ONLY ROUTES
router.post("/doctor/setup-schedule", requireDoctor, timetableController.saveDoctorSchedule);
router.put("/doctor/update-schedule", requireDoctor, timetableController.saveDoctorSchedule);
router.get("/doctor/schedule/:email", requireDoctor, timetableController.getDoctorSchedule);
router.get("/doctor/appointments/:email", requireDoctor, doctorAppointmentsController.getDoctorAppointments);
router.get("/doctor/appointments/:email/today-count", requireDoctor, doctorAppointmentsController.getTodayAppointmentsCount);
router.get("/doctor/profile/:email", requireDoctor, doctorProfileController.getDoctorProfile);
router.put("/doctor/appointments/:id/complete", requireDoctor, doctorAppointmentsController.completeAppointment);
// DEAD CODE: Duplicate route - use /doctor/profile/update instead
// router.put("/doctor/profile", requireDoctor, doctorProfileController.updateDoctorProfile);
router.put("/doctor/profile/update", requireDoctor, doctorProfileController.updateDoctorBasicInfo);
router.put("/doctor/license", requireDoctor, doctorProfileController.updateDoctorLicense);
router.post("/doctor/specialization", requireDoctor, saveDoctorSpecialization);

// PATIENT-ONLY ROUTES
router.post("/appointments/book", requirePatient, appointmentController.bookAppointment);
router.put("/appointments/:id/cancel", requirePatient, appointmentController.cancelAppointment);
router.get("/patient/:email/appointments", requirePatient, patientAppointmentsController.getPatientAppointmentsByEmail);
router.get("/patient/profile/:email", requirePatient, patientProfileUpdate.getPatientProfile);
router.post("/patient-profile", requirePatient, patientProfileUpdate.createPatientProfile);
router.put("/patient/update-profile", requirePatient, patientProfileUpdate.updatePatientProfile);
router.delete("/patient/delete-profile", requirePatient, patientProfileUpdate.deletePatientProfile);

console.log("✅ All auth routes registered successfully");

module.exports = router;
