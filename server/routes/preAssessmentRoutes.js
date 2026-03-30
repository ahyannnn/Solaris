// routes/preAssessmentRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { admin, engineer } = require('../middleware/roleMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const { verifyToken } = authMiddleware;

const {
  createPreAssessment,
  submitPaymentProof,
  cashPayment,
  verifyPayment,
  getAllPreAssessments,
  getMyPreAssessments,
  getPreAssessmentById,
  assignEngineer,
  cancelPreAssessment,
  getPaymentHistory,
  getPreAssessmentStats,
  // Engineer functions
  getEngineerAssessments,
  updateSiteAssessment,
  uploadQuotationPDF,
  submitPayment,
  submitAssessmentReport,
  getAssessmentDocuments,
  addEngineerComment,
  getAssessmentComments,
  getIoTData,
  // Admin functions
  deployDevice,
  retrieveDevice,
  updatePaymentStatus,  // ADD THIS IMPORT
  approveBooking
} = require('../controllers/preAssessmentControllers');

// ============ CUSTOMER ROUTES ============
router.get('/payments', verifyToken, getPaymentHistory);
router.get('/my-bookings', verifyToken, getMyPreAssessments);
// Payment routes
router.post('/submit-payment', verifyToken, upload.single('paymentProof'), submitPayment);
router.post('/cash-payment', verifyToken, cashPayment);

// ============ ADMIN ROUTES ============
router.get('/stats', verifyToken, admin, getPreAssessmentStats);
router.get('/', verifyToken, admin, getAllPreAssessments);
router.put('/:id/verify-payment', verifyToken, admin, verifyPayment);
router.put('/:id/assign-engineer', verifyToken, admin, assignEngineer);
router.put('/:id/update-payment-status', verifyToken, admin, updatePaymentStatus);  // ADD THIS ROUTE
router.put('/:id/approve-booking', verifyToken, admin, approveBooking);

// ============ ENGINEER DEVICE FUNCTIONS ============
router.post('/:id/deploy-device', verifyToken, engineer, deployDevice);
router.post('/:id/retrieve-device', verifyToken, engineer, retrieveDevice);
router.get('/:id/iot-data', verifyToken, engineer, getIoTData);

// ============ ENGINEER FUNCTIONS ============
router.get('/engineer/my-assessments', verifyToken, engineer, getEngineerAssessments);
router.put('/:id/update-assessment', verifyToken, engineer, updateSiteAssessment);
router.post('/:id/upload-quotation', verifyToken, engineer, upload.single('quotation'), uploadQuotationPDF);
router.get('/:id/documents', verifyToken, getAssessmentDocuments);
router.post('/:id/add-comment', verifyToken, engineer, addEngineerComment);
router.get('/:id/comments', verifyToken, getAssessmentComments);

// ============ DYNAMIC ROUTES ============
router.get('/:id', verifyToken, getPreAssessmentById);
router.post('/', verifyToken, createPreAssessment);
router.put('/:id/cancel', verifyToken, cancelPreAssessment);

module.exports = router;