const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');

// Get all available medicines
router.get('/medicines', prescriptionController.getAllMedicines);

// Create new prescription
router.post('/', prescriptionController.createPrescription);

// Get prescription by appointment ID
router.get('/appointment/:appointmentId', prescriptionController.getPrescriptionByAppointment);

// Get prescription by prescription ID
router.get('/:id', prescriptionController.getPrescriptionById);

// Update prescription
router.put('/:id', prescriptionController.updatePrescription);

// Delete prescription
router.delete('/:id', prescriptionController.deletePrescription);

module.exports = router;
