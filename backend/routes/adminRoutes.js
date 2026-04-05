const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Import controllers
const branchContactsController = require('../controllers/branchContactsController');
const hospitalBranchesController = require('../controllers/hospitalBranchesController');
const medicalTechnicianController = require('../controllers/medicalTechnicianController');
const departmentController = require('../controllers/departmentController');
// DEAD CODE: analyticsController is not used - all analytics routes commented out
// const analyticsController = require('../controllers/analyticsController');
const bedController = require('../controllers/bedController');
const labTestController = require('../controllers/labTestController');
const medicineController = require('../controllers/medicineController');
const databaseFeaturesController = require('../controllers/databaseFeaturesController');

// Apply authentication middleware to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Branch Contacts Routes
router.get('/branch-contacts', branchContactsController.getAllBranchContacts);
router.post('/branch-contacts', branchContactsController.addBranchContact);
router.put('/branch-contacts/:id', branchContactsController.updateBranchContact);
router.delete('/branch-contacts/:id', branchContactsController.deleteBranchContact);

// Hospital Branches Routes
router.get('/hospital-branches', hospitalBranchesController.getAllBranches);
router.post('/hospital-branches', hospitalBranchesController.addBranch);
router.put('/hospital-branches/:id', hospitalBranchesController.updateBranch);
router.delete('/hospital-branches/:id', hospitalBranchesController.deleteBranch);

// Medical Technician Routes
router.get('/medical-technicians', medicalTechnicianController.getAllTechnicians);
router.post('/medical-technicians', medicalTechnicianController.addTechnician);
router.put('/medical-technicians/:id', medicalTechnicianController.updateTechnician);
router.delete('/medical-technicians/:id', medicalTechnicianController.deleteTechnician);

// Department Routes
router.get('/departments', departmentController.getAllDepartments);
router.post('/departments', departmentController.addDepartment);
router.put('/departments/:id', departmentController.updateDepartment);
router.delete('/departments/:id', departmentController.deleteDepartment);

// ============================================
// DEAD CODE: Analytics Routes (Complex Queries)
// These routes exist but are NOT used in the frontend
// The frontend uses /db-features/stats instead
// ============================================
// router.get('/analytics/department-statistics', analyticsController.getDepartmentStatistics);
// router.get('/analytics/branch-allocation', analyticsController.getBranchResourceAllocation);
// router.get('/analytics/top-doctors', analyticsController.getTopDoctors);
// router.get('/analytics/medicine-usage', analyticsController.getMedicineUsageAnalysis);
// router.get('/analytics/patient-summary', analyticsController.getPatientTreatmentSummary);

// Database Features Routes (Functions & Procedures)
router.get('/db-features/stats', databaseFeaturesController.getDatabaseFeaturesStats);
router.get('/db-features/doctor/:doctorId/appointments', databaseFeaturesController.getDoctorAppointmentCount);
router.get('/db-features/branch/:branchId/occupancy', databaseFeaturesController.getBedOccupancyRate);
router.get('/db-features/patient/:patientId/expenses', databaseFeaturesController.getPatientTotalExpenses);
router.post('/db-features/book-appointment', databaseFeaturesController.bookAppointmentWithProcedure);
router.post('/db-features/generate-bill', databaseFeaturesController.generateBill);
router.post('/db-features/update-stock', databaseFeaturesController.updateMedicineStock);

// Existing routes (beds, lab tests, medicines)
router.get('/beds', bedController.getAllBeds);
router.post('/beds', bedController.addBed);
router.put('/beds/:id', bedController.updateBed);
router.delete('/beds/:id', bedController.deleteBed);

router.get('/lab-tests', labTestController.getAllLabTests);
router.post('/lab-tests', labTestController.addLabTest);
router.put('/lab-tests/:id', labTestController.updateLabTest);
router.delete('/lab-tests/:id', labTestController.deleteLabTest);

// Lab Test Appointments Routes
router.get('/lab-test-appointments', labTestController.getAllLabTestAppointments);
router.put('/lab-test-appointments/:id', labTestController.updateLabTestAppointment);
router.delete('/lab-test-appointments/:id', labTestController.deleteLabTestAppointment);

router.get('/medicines', medicineController.getAllMedicines);
router.post('/medicines', medicineController.addMedicine);
router.put('/medicines/:id', medicineController.updateMedicine);
router.delete('/medicines/:id', medicineController.deleteMedicine);

module.exports = router;
