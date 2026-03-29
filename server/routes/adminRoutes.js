// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { admin } = require('../middleware/roleMiddleware');

// User Management Controllers
const userControllers = require('../controllers/userManagementControllers');
const deviceControllers = require('../controllers/deviceControllers');
const revenueControllers = require('../controllers/revenueControllers');

const { verifyToken } = authMiddleware;

// Apply admin middleware to all routes
router.use(verifyToken, admin);

// ============ USER MANAGEMENT ============
router.get('/users', userControllers.getAllUsers);
router.get('/users/stats', userControllers.getUserStats);
router.get('/users/:id', userControllers.getUserById);
router.post('/users', userControllers.createUser);
router.put('/users/:id', userControllers.updateUser);
router.put('/users/:id/role', userControllers.updateUserRole);
router.put('/users/:id/toggle-status', userControllers.toggleUserStatus);
router.put('/users/:id/reset-password', userControllers.resetUserPassword); // ADD THIS LINE
router.delete('/users/:id', userControllers.deleteUser);

// ============ DEVICE MANAGEMENT ============
router.get('/devices', deviceControllers.getAllDevices);
router.get('/devices/stats', deviceControllers.getDeviceStats);
router.get('/devices/:id', deviceControllers.getDeviceById);
router.post('/devices', deviceControllers.createDevice);
router.put('/devices/:id', deviceControllers.updateDevice);
router.delete('/devices/:id', deviceControllers.deleteDevice);
router.post('/devices/:deviceId/assign', deviceControllers.assignDeviceToEngineer);

// ============ REVENUE ============
router.get('/revenue', revenueControllers.getRevenueStats);
router.get('/revenue/monthly', revenueControllers.getMonthlyRevenue);
router.post('/revenue/range', revenueControllers.getRevenueByDateRange);

module.exports = router;