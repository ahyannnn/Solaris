// routes/solarInvoiceRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { admin, engineer } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

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
  getInvoicesByProject
} = require('../controllers/solarInvoiceController');

const { verifyToken } = authMiddleware;

// ============ CUSTOMER ROUTES ============
// Get my solar invoices - must come before /:id
router.get('/my-invoices', verifyToken, getMySolarInvoices);

// ============ ADMIN ROUTES ============
// IMPORTANT: Specific routes MUST come before dynamic routes like /:id

// Get invoice stats for dashboard - MUST come before /:id
router.get('/stats', verifyToken, admin, getSolarInvoiceStats);

// Get invoices by project - MUST come before /:id
router.get('/project/:projectId', verifyToken, admin, getInvoicesByProject);

// Get all solar invoices (admin)
router.get('/', verifyToken, admin, getAllSolarInvoices);

// Get invoice by ID - dynamic route, should be LAST among GET routes
router.get('/:id', verifyToken, getSolarInvoiceById);

// Download invoice PDF - uses :id, must come after /stats and /project
router.get('/:id/download', verifyToken, downloadSolarInvoice);

// Cancel invoice (customer)
router.put('/:id/cancel', verifyToken, cancelSolarInvoice);

// Update invoice
router.put('/:id', verifyToken, admin, updateSolarInvoice);

// Send invoice to customer
router.put('/:id/send', verifyToken, admin, sendSolarInvoice);

// Record payment
router.post('/:id/payment', verifyToken, admin, recordSolarPayment);

// Create new solar invoice
router.post('/', verifyToken, admin, createSolarInvoice);

// ============ ENGINEER ROUTES ============
// Engineers can view invoices for their projects
router.get('/engineer/my-invoices', verifyToken, engineer, getMySolarInvoices);

module.exports = router;