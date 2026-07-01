const express = require('express');
const router = express.Router();
const { getAvailableSlots, createBooking } = require('../controllers/bookingController');

// Wire up the endpoints
router.get('/slots', getAvailableSlots);
router.post('/reserve', createBooking);

module.exports = router;