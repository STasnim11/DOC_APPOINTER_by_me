const express = require('express');
const router = express.Router();
const bedBookingController = require('../controllers/bedBookingController');

// Get all available beds
router.get('/beds/available', bedBookingController.getAvailableBeds);

// Book a bed
router.post('/bed-bookings', bedBookingController.bookBed);

// Get all bed bookings (Admin)
router.get('/admin/bed-bookings', bedBookingController.getAllBedBookings);

// Delete bed booking (Admin)
router.delete('/admin/bed-bookings/:id', bedBookingController.deleteBedBooking);

// Get patient's bed bookings
router.get('/patient/:email/bed-bookings', bedBookingController.getPatientBedBookings);

module.exports = router;
