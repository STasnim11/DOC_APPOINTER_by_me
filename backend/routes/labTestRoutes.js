const express = require('express');
const router = express.Router();
const labTestController = require('../controllers/labTestController');

// Get all available lab tests
router.get('/lab-tests', labTestController.getAllLabTests);

// Get all medical technicians
router.get('/medical-technicians', labTestController.getAllTechnicians);

// Book a lab test
router.post('/lab-test-appointments', labTestController.bookLabTest);

// Get patient's lab test appointments
router.get('/patient/:email/lab-tests', labTestController.getPatientLabTests);

module.exports = router;
