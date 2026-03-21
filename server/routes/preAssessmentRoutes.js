// routes/preAssessmentRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { admin, engineer } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

const {
  createPreAssessment,
  submitPaymentProof,
  cashPayment,
  verifyPayment,
  getAllPreAssessments,
  getMyPreAssessments,
  getPreAssessmentById,
  assignEngineer,
  deployDevice,
  retrieveDevice,
  generateReport,
  cancelPreAssessment
} = require('../controllers/preAssessmentControllers');

const { verifyToken } = authMiddleware;

// Customer routes
router.post('/', verifyToken, createPreAssessment);
router.post('/payment', verifyToken, upload.single('paymentProof'), submitPaymentProof);
router.post('/cash-payment', verifyToken, cashPayment);
router.get('/my-bookings', verifyToken, getMyPreAssessments);
router.get('/:id', verifyToken, getPreAssessmentById);
router.put('/:id/cancel', verifyToken, cancelPreAssessment);

// Admin routes
router.get('/', verifyToken, admin, getAllPreAssessments);
router.put('/:id/verify-payment', verifyToken, admin, verifyPayment);
router.put('/:id/assign-engineer', verifyToken, admin, assignEngineer);

// Engineer routes
router.post('/:id/deploy-device', verifyToken, engineer, deployDevice);
router.post('/:id/retrieve-device', verifyToken, engineer, retrieveDevice);
router.post('/:id/generate-report', verifyToken, engineer, generateReport);

module.exports = router;