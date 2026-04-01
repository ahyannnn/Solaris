// routes/freeQuoteRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { admin, engineer } = require('../middleware/roleMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

const {
  createFreeQuote,
  getAllFreeQuotes,
  getMyFreeQuotes,
  getFreeQuoteById,
  updateQuoteStatus,
  uploadQuotation,
  cancelFreeQuote,
  getEngineerFreeQuotes,
  assignEngineerToFreeQuote,
  generateFreeQuotePDF
} = require('../controllers/freeQuoteControllers');

const { verifyToken } = authMiddleware;

// Custom middleware for engineer or admin
const engineerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'engineer' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Only engineers and admins can perform this action.' });
  }
};

// Customer routes
router.post('/', verifyToken, createFreeQuote);
router.get('/my-quotes', verifyToken, getMyFreeQuotes);
router.get('/:id', verifyToken, getFreeQuoteById);
router.put('/:id/cancel', verifyToken, cancelFreeQuote);

// Engineer routes
router.get('/engineer/my-quotes', verifyToken, engineer, getEngineerFreeQuotes);

// Engineer/Admin route for generating PDF
router.post('/:id/generate-quotation', verifyToken, engineerOrAdmin, generateFreeQuotePDF);

// Admin routes
router.get('/', verifyToken, admin, getAllFreeQuotes);
router.put('/:id/status', verifyToken, admin, updateQuoteStatus);
router.put('/:id/assign-engineer', verifyToken, admin, assignEngineerToFreeQuote);
router.post('/:id/upload-quotation', verifyToken, admin, upload.single('quotation'), uploadQuotation);

module.exports = router;