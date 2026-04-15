// routes/receiptRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { admin } = require('../middleware/roleMiddleware');
const receiptService = require('../services/receiptService');
const Receipt = require('../models/Receipt');

const { verifyToken } = authMiddleware;

// Generate receipt for a payment
router.post('/generate', verifyToken, admin, async (req, res) => {
  try {
    const receipt = await receiptService.generateReceipt(req.body);
    res.json({ success: true, receipt });
  } catch (error) {
    console.error('Generate receipt error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get receipt by number
router.get('/:receiptNumber', verifyToken, async (req, res) => {
  try {
    const receipt = await Receipt.findOne({ receiptNumber: req.params.receiptNumber })
      .populate('customerId', 'contactFirstName contactLastName contactNumber')
      .populate('verifiedBy', 'firstName lastName');
    
    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }
    
    res.json({ success: true, receipt });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Download receipt PDF
router.get('/:receiptNumber/download', verifyToken, async (req, res) => {
  try {
    const receipt = await Receipt.findOne({ receiptNumber: req.params.receiptNumber });
    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }
    
    // Redirect to Cloudinary URL or stream file
    res.redirect(receipt.receiptUrl);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get customer receipts
router.get('/customer/:customerId', verifyToken, async (req, res) => {
  try {
    const receipts = await Receipt.find({ customerId: req.params.customerId })
      .sort({ paymentDate: -1 })
      .limit(50);
    res.json({ success: true, receipts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Void receipt (admin only)
router.put('/:receiptNumber/void', verifyToken, admin, async (req, res) => {
  try {
    const { reason } = req.body;
    const receipt = await Receipt.findOne({ receiptNumber: req.params.receiptNumber });
    
    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }
    
    receipt.isVoid = true;
    receipt.voidReason = reason;
    receipt.voidedBy = req.user.id;
    receipt.voidedAt = new Date();
    await receipt.save();
    
    res.json({ success: true, message: 'Receipt voided' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;