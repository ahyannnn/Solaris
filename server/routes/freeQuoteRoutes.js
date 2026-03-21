// routes/freeQuoteRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { admin } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

const {
  createFreeQuote,
  getAllFreeQuotes,
  getMyFreeQuotes,
  getFreeQuoteById,
  updateQuoteStatus,
  uploadQuotation,
  cancelFreeQuote
} = require('../controllers/freeQuoteControllers');

// Extract verifyToken from authMiddleware
const { verifyToken } = authMiddleware;

// Customer routes
router.post('/', verifyToken, createFreeQuote);
router.get('/my-quotes', verifyToken, getMyFreeQuotes);
router.get('/:id', verifyToken, getFreeQuoteById);
router.put('/:id/cancel', verifyToken, cancelFreeQuote);

// Admin routes
router.get('/', verifyToken, admin, getAllFreeQuotes);
router.put('/:id/status', verifyToken, admin, updateQuoteStatus);
router.post('/:id/upload-quotation', verifyToken, admin, upload.single('quotation'), uploadQuotation);

module.exports = router;