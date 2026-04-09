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
  removeAllowedIP,
  getSystemConfig,
  updateSystemConfig,
  resetSystemConfig,
  getConfigHistory,
  addEquipmentItem,
  updateEquipmentItem,
  removeEquipmentItem,
  getEquipmentByType,
  bulkUpdateEquipment
} = require('../controllers/maintenanceController');

const { verifyToken } = authMiddleware;

// Helper function for role authorization
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};

// ============ PUBLIC MAINTENANCE ROUTES ============
router.get('/status', getMaintenanceStatus);

// ============ SYSTEM CONFIGURATION ROUTES ============
// Get config (admin and engineer can view)
router.get('/config', verifyToken, authorizeRoles('admin', 'engineer'), getSystemConfig);

// Update config (admin only)
router.put('/config', verifyToken, admin, updateSystemConfig);

// Reset config to defaults (admin only)
router.post('/config/reset', verifyToken, admin, resetSystemConfig);

// Get config history (admin only)
router.get('/config/history', verifyToken, admin, getConfigHistory);

// ============ EQUIPMENT MANAGEMENT ROUTES ============
// Add new equipment item (admin only)
router.post('/config/equipment', verifyToken, admin, addEquipmentItem);

// Update equipment item (admin only)
router.put('/config/equipment/:type/:itemId', verifyToken, admin, updateEquipmentItem);

// Remove equipment item - soft delete (admin only)
router.delete('/config/equipment/:type/:itemId', verifyToken, admin, removeEquipmentItem);

// Get equipment by type (admin and engineer can view)
router.get('/config/equipment/:type', verifyToken, authorizeRoles('admin', 'engineer'), getEquipmentByType);

// Bulk update equipment (admin only)
router.post('/config/equipment/bulk', verifyToken, admin, bulkUpdateEquipment);

// ============ MAINTENANCE MODE ROUTES ============
// Enable maintenance mode (admin only)
router.post('/enable', verifyToken, admin, enableMaintenance);

// Disable maintenance mode (admin only)
router.post('/disable', verifyToken, admin, disableMaintenance);

// Update maintenance settings (admin only)
router.put('/settings', verifyToken, admin, updateMaintenanceSettings);

// Get maintenance history (admin only)
router.get('/history', verifyToken, admin, getMaintenanceHistory);

// Add allowed IP for maintenance mode (admin only)
router.post('/add-ip', verifyToken, admin, addAllowedIP);

// Remove allowed IP (admin only)
router.delete('/remove-ip/:ip', verifyToken, admin, removeAllowedIP);

module.exports = router;