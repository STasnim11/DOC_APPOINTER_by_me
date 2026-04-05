//DEAD CODE
// ============================================
// DEAD CODE - ENTIRE FILE UNUSED
// ============================================
// This file is imported in routes/auth.js but never used
// All doctor routes are already defined in routes/auth.js
// This file was mounted in server.js at /api/doctor but creates duplicate routes
// Can be safely deleted
// ============================================

// routes/doctorRoutes.js
const express = require("express");
const router = express.Router();
console.log("DOCTOR ROUTES LOADED");
// Controllers
const doctorProfileController = require("../controllers/doctorProfileUpdate");
const {
  createDoctorProfile,
  saveDoctorSpecialization,
  getAllSpecializations,
  createTimeSlots,
} = require("../controllers/doctorSpecialization"); // ✅ singular, matches your file
const databaseFeaturesController = require("../controllers/databaseFeaturesController");

/**
 * ===============================
 * DOCTOR PROFILE ROUTES
 * ===============================
 */

// GET doctor profile by email
router.get("/profile/:email", doctorProfileController.getDoctorProfile);

// GET total appointment count for doctor (uses SQL function)
router.get("/appointment-count/:doctorId", databaseFeaturesController.getDoctorAppointmentCount);

// POST — Create new doctor profile
router.post("/profile/create", createDoctorProfile);

// PUT — Update existing doctor profile
router.put("/profile/update", doctorProfileController.updateDoctorProfile);

// POST — Save doctor availability
router.post("/availability/:email", doctorProfileController.saveDoctorAvailability);

/**
 * ===============================
 * DOCTOR SPECIALIZATION ROUTES
 * ===============================
 */

// POST — Save or update doctor's specialization
router.post("/specialization", saveDoctorSpecialization);

// GET — Fetch all specializations
router.get("/specializations", getAllSpecializations);

// POST — Create doctor time slots
router.post("/timeslots", createTimeSlots);

const { saveDoctorTimeSlots } = require("../controllers/doctorTimeSlots"); // make sure file name matches

// POST — Save doctor time slots
router.post("/timeslots/save", saveDoctorTimeSlots);

module.exports = router;