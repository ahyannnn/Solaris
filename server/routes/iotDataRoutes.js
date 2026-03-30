// routes/iotDataRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { engineer } = require('../middleware/roleMiddleware');
const { verifyToken } = authMiddleware;
const {
  getIoTData,
  getRealtimeIoTData,
  getIoTDashboardSummary
} = require('../controllers/iotDataController');

// Engineer routes for IoT data
router.get('/pre-assessments/:id/iot-data', verifyToken, engineer, getIoTData);
router.get('/pre-assessments/:id/iot-data/realtime', verifyToken, engineer, getRealtimeIoTData);
router.get('/engineer/iot-summary', verifyToken, engineer, getIoTDashboardSummary);

module.exports = router;