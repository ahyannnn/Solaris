// routes/billingRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { admin } = require('../middleware/roleMiddleware');

const { getBillingTransactions } = require('../controllers/billingController');

const { verifyToken } = authMiddleware;

// Unified billing transactions (Admin only)
router.get('/transactions', verifyToken, admin, getBillingTransactions);

module.exports = router;
