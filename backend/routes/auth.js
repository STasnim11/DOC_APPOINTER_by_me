const express = require("express");
const router = express.Router();
const { signup } = require("../controllers/authController");
const {login}=require("../controllers/login");
const { getProfile } = require("../controllers/profile");
const timetableController = require("../controllers/timetable");
const appointmentController = require("../controllers/appointmentController");
const patientAppointmentsController = require("../controllers/patientAppointments");
const doctorProfileController = require("../controllers/doctorProfileUpdate");
const { saveDoctorSpecialization } = require("../controllers/doctorSpecialization"); // Afnan
const doctorRoutes = require("./doctorRoutes");//Afnan
const patientProfileUpdate = require("../controllers/patientProfileUpdate");


console.log("auth routes loaded");

router.post("/signup", signup);
router.post("/login",login);
router.get("/profile/:email", getProfile);
router.post("/doctor/setup-schedule", timetableController.saveDoctorSchedule);
router.get("/doctor/:doctorId/available-slots", appointmentController.getAvailableSlots);
router.post("/appointments/book", appointmentController.bookAppointment);
router.get("/patient/:email/appointments", patientAppointmentsController.getPatientAppointmentsByEmail);
router.put("/doctor/profile", doctorProfileController.updateDoctorProfile);
router.post("/patient-profile", patientProfileUpdate.createPatientProfile);
router.put("/doctor/update-schedule", timetableController.saveDoctorSchedule);

// ✅ New specialization route
router.post("/doctor/specialization", saveDoctorSpecialization);

module.exports = router;
