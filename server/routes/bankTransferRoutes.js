// routes/bankTransferRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/roleMiddleware');
const {
  getCompanyBankAccounts,
  submitManualBankTransfer,
  getPendingBankTransfers,
  getBankTransferById,
  approveBankTransfer,
  rejectBankTransfer,
  getBankTransferStats,
  getBankTransferStatus
} = require('../controllers/bankTransferController');

// Configure multer for file upload (memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
    }
  }
});

// =============================================
// CUSTOMER ROUTES
// =============================================

// Get company bank accounts
router.get('/banks', protect, getCompanyBankAccounts);

// Submit manual bank transfer
router.post('/manual', protect, upload.single('proofOfPayment'), submitManualBankTransfer);

// Get bank transfer status for an invoice
router.get('/invoice/:invoiceId/status', protect, getBankTransferStatus);

// =============================================
// ADMIN ROUTES
// =============================================

// Get all pending bank transfers (with filters)
router.get('/pending', protect, admin, getPendingBankTransfers);

// Get bank transfer statistics
router.get('/stats', protect, admin, getBankTransferStats);

// Get single bank transfer
router.get('/:id', protect, admin, getBankTransferById);

// Approve bank transfer
router.put('/:id/approve', protect, admin, approveBankTransfer);

// Reject bank transfer
router.put('/:id/reject', protect, admin, rejectBankTransfer);

module.exports = router;