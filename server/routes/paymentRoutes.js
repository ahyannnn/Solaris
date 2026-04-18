const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');

const paymentController = require('../controllers/paymentController');

// Create payment intent (for both card and GCash)
router.post(
  '/pre-assessment/:id/create-intent',
  verifyToken,
  paymentController.createPreAssessmentPaymentIntent
);

// ✅ ADD THIS NEW ROUTE FOR INVOICE PAYMENTS
router.post(
  '/invoice/:invoiceId/create-intent',
  verifyToken,
  paymentController.createInvoicePaymentIntent
);
// Process card payment
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