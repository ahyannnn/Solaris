// routes/clientRoutes.js
const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const authMiddleware = require('../middleware/authMiddleware.js');

// Update client info
router.put('/update', authMiddleware.verifyToken, clientController.updateClient);

// Get client info (for checking account_setup)
router.get('/me', authMiddleware.verifyToken, clientController.getClientInfo);

// Address routes (new)
router.post('/me/addresses', authMiddleware.verifyToken, clientController.addAddress);
router.get('/me/addresses', authMiddleware.verifyToken, clientController.getAddresses);
router.put('/me/addresses/:addressId', authMiddleware.verifyToken, clientController.updateAddress);
router.delete('/me/addresses/:addressId', authMiddleware.verifyToken, clientController.deleteAddress);
router.patch('/me/addresses/:addressId/primary', authMiddleware.verifyToken, clientController.setPrimaryAddress);

module.exports = router;