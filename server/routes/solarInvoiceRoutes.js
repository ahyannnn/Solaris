// routes/solarInvoiceRoutes.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { admin, engineer } = require('../middleware/roleMiddleware');
const { upload } = require('../middleware/uploadMiddleware'); // ✅ FIXED: import upload

const {
  createSolarInvoice,
  getAllSolarInvoices,
  getMySolarInvoices,
  getSolarInvoiceById,
  sendSolarInvoice,
  recordSolarPayment,
  getSolarInvoiceStats,
  downloadSolarInvoice,
  cancelSolarInvoice,
  updateSolarInvoice,
  getInvoicesByProject,
  paySolarInvoice,
  paySolarInvoiceCash,
  getPayMongoPaymentIntent,
  verifyPayMongoPayment,
  verifySolarInvoicePayment,
  rejectSolarInvoicePayment
} = require('../controllers/solarInvoiceController');

const { verifyToken } = authMiddleware;

// ============ CUSTOMER ROUTES ============
router.get('/my-invoices', verifyToken, getMySolarInvoices);

// Customer payment routes
router.post('/:id/pay', verifyToken, upload.single('paymentProof'), paySolarInvoice);
router.post('/:id/pay-cash', verifyToken, paySolarInvoiceCash);
router.post('/:id/create-payment-intent', verifyToken, getPayMongoPaymentIntent);
router.post('/verify-payment', verifyToken, verifyPayMongoPayment);

// ============ ADMIN ROUTES ============
router.get('/stats', verifyToken, admin, getSolarInvoiceStats);
router.get('/project/:projectId', verifyToken, admin, getInvoicesByProject);
router.get('/', verifyToken, admin, getAllSolarInvoices);
router.get('/:id', verifyToken, getSolarInvoiceById);
router.get('/:id/download', verifyToken, downloadSolarInvoice);
// Admin verification routes
router.put('/:id/verify', verifyToken, admin, verifySolarInvoicePayment);
router.put('/:id/reject-payment', verifyToken, admin, rejectSolarInvoicePayment);

router.put('/:id/cancel', verifyToken, cancelSolarInvoice);
router.put('/:id', verifyToken, admin, updateSolarInvoice);
router.put('/:id/send', verifyToken, admin, sendSolarInvoice);
router.post('/:id/payment', verifyToken, admin, recordSolarPayment);
router.post('/', verifyToken, admin, createSolarInvoice);

// ============ ENGINEER ROUTES ============
router.get('/engineer/my-invoices', verifyToken, engineer, getMySolarInvoices);

module.exports = router;