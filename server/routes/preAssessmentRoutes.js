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
  uploadSiteImages,

  submitPayment,
  submitAssessmentReport,
  getAssessmentDocuments,
  addEngineerComment,
  getAssessmentComments,
  getIoTData,
  // Admin functions
  deployDevice,
  retrieveDevice,
  updatePaymentStatus,
  approveBooking,
  // NEW: PDF Generation and IoT Analysis
  generateQuotationPDF,  // ✅ ADD THIS
  analyzeIoTData          // ✅ ADD THIS (if you have it)
} = require('../controllers/preAssessmentControllers');

// ============ CUSTOMER ROUTES ============
router.get('/payments', verifyToken, getPaymentHistory);
router.get('/my-bookings', verifyToken, getMyPreAssessments);
// Payment routes
router.post('/submit-payment', verifyToken, upload.single('paymentProof'), submitPayment);
router.post('/cash-payment', verifyToken, cashPayment);
router.post('/:id/create-payment-intent', verifyToken, require('../controllers/paymentController').createPreAssessmentPaymentIntent);

// ============ ADMIN ROUTES ============
router.get('/stats', verifyToken, admin, getPreAssessmentStats);
router.get('/', verifyToken, admin, getAllPreAssessments);
router.put('/:id/verify-payment', verifyToken, admin, verifyPayment);
router.put('/:id/assign-engineer', verifyToken, admin, assignEngineer);
router.put('/:id/update-payment-status', verifyToken, admin, updatePaymentStatus);
router.put('/:id/approve-booking', verifyToken, admin, approveBooking);

// ============ ENGINEER DEVICE FUNCTIONS ============
router.post('/:id/deploy-device', verifyToken, engineer, deployDevice);
router.put('/:id/retrieve-device', verifyToken, engineer, retrieveDevice);
router.get('/:id/iot-data', verifyToken, engineer, getIoTData);


// ============ ENGINEER FUNCTIONS ============
router.get('/engineer/my-assessments', verifyToken, engineer, getEngineerAssessments);
router.put('/:id/update-assessment', verifyToken, engineer, updateSiteAssessment);
router.post('/:id/upload-quotation', verifyToken, engineer, upload.single('quotation'), uploadQuotationPDF);
router.post('/:id/upload-images', verifyToken, engineer, upload.array('images', 10), uploadSiteImages);
router.get('/:id/documents', verifyToken, getAssessmentDocuments);

router.post('/:id/add-comment', verifyToken, engineer, addEngineerComment);
router.get('/:id/comments', verifyToken, getAssessmentComments);

// ✅ ADD PDF GENERATION ROUTE (Engineer and Admin can generate)
router.post('/:id/generate-quotation', verifyToken, (req, res, next) => {
  if (req.user.role === 'engineer' || req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Only engineers and admins can generate quotations.' });
  }
}, generateQuotationPDF);

// ✅ ADD IoT DATA ANALYSIS ROUTE (Engineer only)
router.post('/:id/analyze-iot-data', verifyToken, engineer, analyzeIoTData);

// ============ DYNAMIC ROUTES ============
router.get('/:id', verifyToken, getPreAssessmentById);
router.post('/', verifyToken, createPreAssessment);
router.put('/:id/cancel', verifyToken, cancelPreAssessment);

module.exports = router;