// routes/maintenanceRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { admin, engineer } = require('../middleware/roleMiddleware');

const {
  getMaintenanceStatus,
  enableMaintenance,
  disableMaintenance,
  updateMaintenanceSettings,
  getMaintenanceHistory,
  addAllowedIP,
  removeAllowedIP
} = require('../controllers/maintenanceController');

const { verifyToken } = authMiddleware;
// Add to routes/maintenanceRoutes.js
const {
  getSystemConfig,
  updateSystemConfig,
  resetSystemConfig,
  getConfigHistory
} = require('../controllers/systemConfigController');

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};
// Public routes
router.get('/status', getMaintenanceStatus);
// System Configuration Routes
router.get('/config', verifyToken, authorizeRoles('admin', 'engineer'), getSystemConfig);
router.put('/config', verifyToken, admin, updateSystemConfig);
router.post('/config/reset', verifyToken, admin, resetSystemConfig);
router.get('/config/history', verifyToken, admin, getConfigHistory);
// Admin routes
router.post('/enable', verifyToken, admin, enableMaintenance);
router.post('/disable', verifyToken, admin, disableMaintenance);
router.put('/settings', verifyToken, admin, updateMaintenanceSettings);
router.get('/history', verifyToken, admin, getMaintenanceHistory);
router.post('/add-ip', verifyToken, admin, addAllowedIP);
router.delete('/remove-ip/:ip', verifyToken, admin, removeAllowedIP);

module.exports = router;