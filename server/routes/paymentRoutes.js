// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const paymentsController = require('../controllers/paymentController');

// =============================================
// PRE-ASSESSMENT PAYMENT
// =============================================

router.post(
  '/pre-assessment/:id/create-intent',
  verifyToken,
  paymentsController.createPreAssessmentPaymentIntent
);

// =============================================
// INVOICE PAYMENT (PROJECT BILL)
// =============================================

router.post(
  '/invoice/:invoiceId/create-intent',
  verifyToken,
  paymentsController.createInvoicePaymentIntent
);

// =============================================
// ✅ NEW: BANK TRANSFER (DOB/Brankas)
// =============================================

// @route   POST /api/payments/bank-transfer/:invoiceId/create-intent
// @desc    Create bank transfer payment intent (DOB/Brankas)
// @access  Private
router.post(
  '/bank-transfer/:invoiceId/create-intent',
  verifyToken,
  paymentsController.createBankTransferPaymentIntent
);

// =============================================
// CARD PAYMENT
// =============================================

router.post(
  '/process-card-payment',
  verifyToken,
  paymentsController.processCardPayment
);

// =============================================
// BANK TRANSFER (BRANKAS) - Legacy
// =============================================

router.post(
  '/create-brankas-source',
  verifyToken,
  paymentsController.createBrankasPaymentSource
);

// =============================================
// PAYMENT STATUS & VERIFICATION
// =============================================

router.get(
  '/verify/:paymentIntentId',
  verifyToken,
  paymentsController.verifyPayment
);

router.get(
  '/status/:paymentIntentId',
  verifyToken,
  paymentsController.getPaymentStatus
);

// =============================================
// SUPPORTED BANKS
// =============================================

router.get(
  '/supported-banks',
  verifyToken,
  paymentsController.getSupportedBanks
);

// =============================================
// WEBHOOK (PUBLIC - No Auth)
// =============================================

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paymentsController.handlePayMongoWebhook
);

// =============================================
// TEST CARD (Development Only)
// =============================================

router.get(
  '/test-card',
  verifyToken,
  paymentsController.getTestCard
);

module.exports = router;