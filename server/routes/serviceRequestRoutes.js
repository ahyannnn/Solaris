// routes/serviceRequestRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { admin, customer } = require('../middleware/roleMiddleware');

const {
  createServiceRequest,
  getMyServiceRequests,
  getAllServiceRequests,
  getServiceRequestStats,
  getServiceRequestById,
  updateServiceRequestStatus,
  cancelServiceRequest
} = require('../controllers/serviceRequestController');

const { verifyToken } = authMiddleware;

// Customer routes
router.post('/', verifyToken, customer, createServiceRequest);
router.get('/my-requests', verifyToken, customer, getMyServiceRequests);
router.put('/:id/cancel', verifyToken, customer, cancelServiceRequest);

// Admin routes (static paths must come before dynamic /:id)
router.get('/stats', verifyToken, admin, getServiceRequestStats);
router.get('/', verifyToken, admin, getAllServiceRequests);

// Shared (owner customer or admin — checked in controller)
router.get('/:id', verifyToken, getServiceRequestById);
router.put('/:id/status', verifyToken, admin, updateServiceRequestStatus);

module.exports = router;
