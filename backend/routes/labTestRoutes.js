const express = require('express');
const router = express.Router();
const labTestController = require('../controllers/labTestController');

console.log('✅ Lab test routes loaded');

// Get all available lab tests
router.get('/lab-tests', (req, res, next) => {
  console.log('🔬 /lab-tests route hit!');
  next();
}, labTestController.getAllLabTests);

// Get all medical technicians
router.get('/medical-technicians', (req, res, next) => {
  console.log('👨‍⚕️ /medical-technicians route hit!');
  next();
}, labTestController.getAllTechnicians);

// Book a lab test
router.post('/lab-test-appointments', labTestController.bookLabTest);

// Get patient's lab test appointments
router.get('/patient/:email/lab-tests', labTestController.getPatientLabTests);

module.exports = router;
