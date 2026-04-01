const express = require('express');
const router = express.Router();

const medicineController = require('../controllers/medicineController');
const labTestController = require('../controllers/labTestController');
const bedController = require('../controllers/bedController');

// Medicine routes
router.get('/medicines', medicineController.getAllMedicines);
router.get('/medicines/:id', medicineController.getMedicineById);
router.post('/medicines', medicineController.addMedicine);
router.put('/medicines/:id', medicineController.updateMedicine);
router.delete('/medicines/:id', medicineController.deleteMedicine);

// Lab test routes
router.get('/lab-tests', labTestController.getAllLabTests);
router.get('/lab-tests/:id', labTestController.getLabTestById);
router.post('/lab-tests', labTestController.addLabTest);
router.put('/lab-tests/:id', labTestController.updateLabTest);
router.delete('/lab-tests/:id', labTestController.deleteLabTest);

// Bed routes
router.get('/beds', bedController.getAllBeds);
router.get('/beds/:id', bedController.getBedById);
router.post('/beds', bedController.addBed);
router.put('/beds/:id', bedController.updateBed);
router.delete('/beds/:id', bedController.deleteBed);

module.exports = router;
