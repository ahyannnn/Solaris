// routes/clientRoutes.js
const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const authMiddleware= require('../middleware/authMiddleware.js');

// Update client info
router.put('/update', authMiddleware.verifyToken, clientController.updateClient);
// Get client info (for checking account_setup)
router.get('/me', authMiddleware.verifyToken, clientController.getClientInfo);

module.exports = router;