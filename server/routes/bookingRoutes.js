// routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware.js');

router.post('/', authMiddleware.verifyToken, bookingController.createBooking);

module.exports = router;