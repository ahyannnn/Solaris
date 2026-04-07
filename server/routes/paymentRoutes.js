const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');

const paymentController = require('../controllers/paymentController');

// Pre-assessment payment routes
router.post(
  '/pre-assessment/:id/create-intent',
  verifyToken,
  paymentController.createPreAssessmentPaymentIntent
);

// ✅ ADD THIS: Solar Invoice payment routes
router.post(
  '/invoice/:id/create-intent',
  verifyToken,
  paymentController.createSolarInvoicePaymentIntent
);

// Process card payment (works for both pre-assessment and invoice)
router.post(
  '/process-card-payment',
  verifyToken,
  paymentController.processCardPayment
);

// Verify payment (for both card and GCash)
router.get(
  '/verify/:paymentIntentId',
  verifyToken,
  paymentController.verifyPayment
);

// Get test card (development only)
router.get(
  '/test-card',
  verifyToken,
  paymentController.getTestCard
);

module.exports = router;