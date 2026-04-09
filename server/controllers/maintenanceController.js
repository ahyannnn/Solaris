// controllers/maintenanceController.js
const Maintenance = require('../models/Maintenance');
const SystemConfig = require('../models/SystemConfig');
const MaintenanceTask = require('../models/MaintenanceTask');

// Helper function to generate task ID
const generateTaskId = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `MT-${year}${month}${day}-${random}`;
};

// @desc    Get maintenance status
// @route   GET /api/maintenance/status
// @access  Public
exports.getMaintenanceStatus = async (req, res) => {
  try {
    let maintenance = await Maintenance.findOne();
    
    if (!maintenance) {
      maintenance = new Maintenance();
      await maintenance.save();
    }
    
    res.json({
      success: true,
      isUnderMaintenance: maintenance.isUnderMaintenance,
      title: maintenance.title,
      message: maintenance.message,
      estimatedDuration: maintenance.estimatedDuration,
      scheduledStart: maintenance.scheduledStart,
      scheduledEnd: maintenance.scheduledEnd,
      showCountdown: maintenance.showCountdown,
      showProgressBar: maintenance.showProgressBar,
      contactEmail: maintenance.contactEmail,
      contactPhone: maintenance.contactPhone,
      socialLinks: maintenance.socialLinks
    });
    
  } catch (error) {
    console.error('Get maintenance status error:', error);
    res.status(500).json({ message: 'Failed to get maintenance status', error: error.message });
  }
};

// @desc    Enable maintenance mode (Admin only)
// @route   POST /api/maintenance/enable
// @access  Private (Admin)
exports.enableMaintenance = async (req, res) => {
  try {
    const { title, message, estimatedDuration, showCountdown, showProgressBar, contactEmail, contactPhone, socialLinks } = req.body;
    
    let maintenance = await Maintenance.findOne();
    
    if (!maintenance) {
      maintenance = new Maintenance();
    }
    
    // Check if already under maintenance
    if (maintenance.isUnderMaintenance) {
      return res.status(400).json({ 
        success: false, 
        message: 'Maintenance mode is already enabled. Please disable it first before enabling again.',
        isUnderMaintenance: true,
        startedAt: maintenance.scheduledStart
      });
    }
    
    await maintenance.startMaintenance(
      title || maintenance.title,
      message || maintenance.message,
      estimatedDuration || maintenance.estimatedDuration,
      req.user.id
    );
    
    // Update additional settings
    if (showCountdown !== undefined) maintenance.showCountdown = showCountdown;
    if (showProgressBar !== undefined) maintenance.showProgressBar = showProgressBar;
    if (contactEmail) maintenance.contactEmail = contactEmail;
    if (contactPhone) maintenance.contactPhone = contactPhone;
    if (socialLinks) maintenance.socialLinks = socialLinks;
    
    await maintenance.save();
    
    // Create maintenance task record
    const task = new MaintenanceTask({
      taskId: generateTaskId(),
      title: 'Maintenance Mode Enabled',
      description: `Maintenance mode enabled by ${req.user.name || req.user.id}`,
      type: 'system_config',
      taskData: { title, message, estimatedDuration },
      results: {
        success: true,
        message: 'Maintenance mode enabled successfully'
      },
      completedAt: new Date(),
      status: 'completed',
      createdBy: req.user.id
    });
    await task.save();
    
    res.json({
      success: true,
      message: 'Maintenance mode enabled',
      maintenance: {
        isUnderMaintenance: maintenance.isUnderMaintenance,
        scheduledStart: maintenance.scheduledStart,
        title: maintenance.title,
        message: maintenance.message
      }
    });
    
  } catch (error) {
    console.error('Enable maintenance error:', error);
    res.status(500).json({ message: 'Failed to enable maintenance', error: error.message });
  }
};

// @desc    Disable maintenance mode (Admin only)
// @route   POST /api/maintenance/disable
// @access  Private (Admin)
exports.disableMaintenance = async (req, res) => {
  try {
    let maintenance = await Maintenance.findOne();
    
    if (!maintenance) {
      maintenance = new Maintenance();
      await maintenance.save();
    }
    
    // Check if not under maintenance
    if (!maintenance.isUnderMaintenance) {
      return res.status(400).json({ 
        success: false, 
        message: 'Maintenance mode is not currently enabled. Nothing to disable.',
        isUnderMaintenance: false
      });
    }
    
    await maintenance.endMaintenance(req.user.id);
    
    // Create maintenance task record
    const task = new MaintenanceTask({
      taskId: generateTaskId(),
      title: 'Maintenance Mode Disabled',
      description: `Maintenance mode disabled by ${req.user.name || req.user.id}`,
      type: 'system_config',
      results: {
        success: true,
        message: 'Maintenance mode disabled successfully'
      },
      completedAt: new Date(),
      status: 'completed',
      createdBy: req.user.id
    });
    await task.save();
    
    res.json({
      success: true,
      message: 'Maintenance mode disabled',
      maintenance: {
        isUnderMaintenance: maintenance.isUnderMaintenance,
        scheduledEnd: maintenance.scheduledEnd
      }
    });
    
  } catch (error) {
    console.error('Disable maintenance error:', error);
    res.status(500).json({ message: 'Failed to disable maintenance', error: error.message });
  }
};

// @desc    Update maintenance settings (Admin only)
// @route   PUT /api/maintenance/settings
// @access  Private (Admin)
exports.updateMaintenanceSettings = async (req, res) => {
  try {
    const { 
      title, 
      message, 
      estimatedDuration, 
      allowedIPs, 
      allowedRoles, 
      whitelistedRoutes,
      showCountdown,
      showProgressBar,
      contactEmail,
      contactPhone,
      socialLinks
    } = req.body;
    
    let maintenance = await Maintenance.findOne();
    
    if (!maintenance) {
      maintenance = new Maintenance();
    }
    
    if (title) maintenance.title = title;
    if (message) maintenance.message = message;
    if (estimatedDuration) maintenance.estimatedDuration = estimatedDuration;
    if (allowedIPs) maintenance.allowedIPs = allowedIPs;
    if (allowedRoles) maintenance.allowedRoles = allowedRoles;
    if (whitelistedRoutes) maintenance.whitelistedRoutes = whitelistedRoutes;
    if (showCountdown !== undefined) maintenance.showCountdown = showCountdown;
    if (showProgressBar !== undefined) maintenance.showProgressBar = showProgressBar;
    if (contactEmail) maintenance.contactEmail = contactEmail;
    if (contactPhone) maintenance.contactPhone = contactPhone;
    if (socialLinks) maintenance.socialLinks = socialLinks;
    
    maintenance.updatedBy = req.user.id;
    maintenance.updatedAt = new Date();
    
    await maintenance.save();
    
    res.json({
      success: true,
      message: 'Maintenance settings updated',
      maintenance
    });
    
  } catch (error) {
    console.error('Update maintenance settings error:', error);
    res.status(500).json({ message: 'Failed to update settings', error: error.message });
  }
};

// @desc    Get maintenance history (Admin only)
// @route   GET /api/maintenance/history
// @access  Private (Admin)
exports.getMaintenanceHistory = async (req, res) => {
  try {
    const maintenance = await Maintenance.findOne()
      .populate('maintenanceHistory.initiatedBy', 'firstName lastName email')
      .populate('maintenanceHistory.completedAt');
    
    if (!maintenance) {
      return res.json({ success: true, history: [] });
    }
    
    res.json({
      success: true,
      history: maintenance.maintenanceHistory
    });
    
  } catch (error) {
    console.error('Get maintenance history error:', error);
    res.status(500).json({ message: 'Failed to get history', error: error.message });
  }
};

// @desc    Add allowed IP (Admin only)
// @route   POST /api/maintenance/add-ip
// @access  Private (Admin)
exports.addAllowedIP = async (req, res) => {
  try {
    const { ip } = req.body;
    
    if (!ip) {
      return res.status(400).json({ message: 'IP address is required' });
    }
    
    let maintenance = await Maintenance.findOne();
    
    if (!maintenance) {
      maintenance = new Maintenance();
    }
    
    if (!maintenance.allowedIPs.includes(ip)) {
      maintenance.allowedIPs.push(ip);
      await maintenance.save();
    }
    
    res.json({
      success: true,
      message: 'IP address added to whitelist',
      allowedIPs: maintenance.allowedIPs
    });
    
  } catch (error) {
    console.error('Add allowed IP error:', error);
    res.status(500).json({ message: 'Failed to add IP', error: error.message });
  }
};

// @desc    Remove allowed IP (Admin only)
// @route   DELETE /api/maintenance/remove-ip/:ip
// @access  Private (Admin)
exports.removeAllowedIP = async (req, res) => {
  try {
    const { ip } = req.params;
    
    let maintenance = await Maintenance.findOne();
    
    if (!maintenance) {
      maintenance = new Maintenance();
    }
    
    maintenance.allowedIPs = maintenance.allowedIPs.filter(allowedIp => allowedIp !== ip);
    await maintenance.save();
    
    res.json({
      success: true,
      message: 'IP address removed from whitelist',
      allowedIPs: maintenance.allowedIPs
    });
    
  } catch (error) {
    console.error('Remove allowed IP error:', error);
    res.status(500).json({ message: 'Failed to remove IP', error: error.message });
  }
};

// ============ SYSTEM CONFIGURATION FUNCTIONS ============

// @desc    Get system configuration
// @route   GET /api/maintenance/config
// @access  Private (Admin, Engineer)
exports.getSystemConfig = async (req, res) => {
  try {
    let config = await SystemConfig.findOne();
    
    if (!config) {
      config = new SystemConfig();
      await config.save();
    }
    
    res.json({
      success: true,
      config
    });
    
  } catch (error) {
    console.error('Get system config error:', error);
    res.status(500).json({ message: 'Failed to fetch system configuration', error: error.message });
  }
};

// @desc    Update system configuration
// @route   PUT /api/maintenance/config
// @access  Private (Admin)
exports.updateSystemConfig = async (req, res) => {
  try {
    const updates = req.body;
    const { reason } = req.query;
    
    let config = await SystemConfig.findOne();
    
    if (!config) {
      config = new SystemConfig();
    }
    
    const result = await config.updateConfig(updates, req.user.id, reason || 'Manual update');
    
    // Create maintenance task record
    const task = new MaintenanceTask({
      taskId: generateTaskId(),
      title: 'System Configuration Update',
      description: `Updated ${result.updated} configuration settings`,
      type: 'system_config',
      taskData: { updates, reason },
      results: {
        success: true,
        message: `Updated ${result.updated} settings`,
        affectedRecords: result.updated
      },
      completedAt: new Date(),
      status: 'completed',
      createdBy: req.user.id
    });
    
    await task.save();
    
    res.json({
      success: true,
      message: 'System configuration updated successfully',
      updated: result.updated,
      history: result.history
    });
    
  } catch (error) {
    console.error('Update system config error:', error);
    res.status(500).json({ message: 'Failed to update system configuration', error: error.message });
  }
};

// @desc    Reset system configuration to defaults
// @route   POST /api/maintenance/config/reset
// @access  Private (Admin)
exports.resetSystemConfig = async (req, res) => {
  try {
    const { reason } = req.body;
    
    // Create new default config
    const newConfig = new SystemConfig();
    
    let config = await SystemConfig.findOne();
    
    if (config) {
      const oldConfig = config.toObject();
      await config.updateConfig(newConfig.toObject(), req.user.id, reason || 'Reset to defaults');
    } else {
      config = newConfig;
      await config.save();
    }
    
    const task = new MaintenanceTask({
      taskId: generateTaskId(),
      title: 'System Configuration Reset',
      description: 'Reset system configuration to default values',
      type: 'system_config',
      results: {
        success: true,
        message: 'Configuration reset to defaults'
      },
      completedAt: new Date(),
      status: 'completed',
      createdBy: req.user.id
    });
    
    await task.save();
    
    res.json({
      success: true,
      message: 'System configuration reset to defaults',
      config
    });
    
  } catch (error) {
    console.error('Reset system config error:', error);
    res.status(500).json({ message: 'Failed to reset configuration', error: error.message });
  }
};

// @desc    Get configuration history
// @route   GET /api/maintenance/config/history
// @access  Private (Admin)
exports.getConfigHistory = async (req, res) => {
  try {
    const config = await SystemConfig.findOne()
      .populate('updateHistory.updatedBy', 'firstName lastName email');
    
    if (!config) {
      return res.json({ success: true, history: [] });
    }
    
    res.json({
      success: true,
      history: config.updateHistory
    });
    
  } catch (error) {
    console.error('Get config history error:', error);
    res.status(500).json({ message: 'Failed to fetch history', error: error.message });
  }
};

// ============ EQUIPMENT MANAGEMENT FUNCTIONS ============

// @desc    Add new equipment item
// @route   POST /api/maintenance/config/equipment
// @access  Private (Admin)
exports.addEquipmentItem = async (req, res) => {
  try {
    const { type, name, price, brand, warranty, unit, notes } = req.body;
    const { reason } = req.query;
    
    // Validate equipment type
    const validTypes = [
      'solarPanels', 'inverters', 'batteries', 'mountingStructures',
      'electricalComponents', 'cablesAndWiring', 'safetyEquipment',
      'junctionBoxes', 'disconnectSwitches', 'meters'
    ];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid equipment type. Must be one of: ${validTypes.join(', ')}` 
      });
    }
    
    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Equipment name is required' 
      });
    }
    
    if (!price || price <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid price is required' 
      });
    }
    
    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig();
      await config.save();
    }
    
    const newItem = await config.addEquipmentItem(
      type,
      { 
        name: name.trim(), 
        price: parseFloat(price), 
        brand: brand || '', 
        warranty: warranty || 0,
        unit: unit || 'piece',
        notes: notes || ''
      },
      req.user.id,
      reason || `Added new ${type.slice(0, -1)}: ${name}`
    );
    
    // Create maintenance task record
    const task = new MaintenanceTask({
      taskId: generateTaskId(),
      title: `Added New ${type.slice(0, -1)}`,
      description: `Added ${name} to ${type} catalog`,
      type: 'system_config',
      taskData: { type, item: newItem, reason },
      results: {
        success: true,
        message: `Added ${name} successfully`
      },
      completedAt: new Date(),
      status: 'completed',
      createdBy: req.user.id
    });
    
    await task.save();
    
    res.json({
      success: true,
      message: `${name} added successfully to ${type}`,
      item: newItem
    });
    
  } catch (error) {
    console.error('Add equipment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add equipment', 
      error: error.message 
    });
  }
};

// @desc    Update equipment item
// @route   PUT /api/maintenance/config/equipment/:type/:itemId
// @access  Private (Admin)
exports.updateEquipmentItem = async (req, res) => {
  try {
    const { type, itemId } = req.params;
    const { name, price, brand, warranty, unit, notes, isActive } = req.body;
    const { reason } = req.query;
    
    const validTypes = [
      'solarPanels', 'inverters', 'batteries', 'mountingStructures',
      'electricalComponents', 'cablesAndWiring', 'safetyEquipment',
      'junctionBoxes', 'disconnectSwitches', 'meters'
    ];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid equipment type' 
      });
    }
    
    let config = await SystemConfig.findOne();
    if (!config) {
      return res.status(404).json({ 
        success: false, 
        message: 'Configuration not found' 
      });
    }
    
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (price !== undefined) updates.price = parseFloat(price);
    if (brand !== undefined) updates.brand = brand;
    if (warranty !== undefined) updates.warranty = parseInt(warranty);
    if (unit !== undefined) updates.unit = unit;
    if (notes !== undefined) updates.notes = notes;
    if (isActive !== undefined) updates.isActive = isActive === 'true' || isActive === true;
    
    const updatedItem = await config.updateEquipmentItem(
      type,
      itemId,
      updates,
      req.user.id,
      reason || `Updated ${type.slice(0, -1)}: ${name || 'equipment'}`
    );
    
    // Create maintenance task record
    const task = new MaintenanceTask({
      taskId: generateTaskId(),
      title: `Updated ${type.slice(0, -1)}`,
      description: `Updated ${updatedItem.name} in ${type} catalog`,
      type: 'system_config',
      taskData: { type, itemId, updates, reason },
      results: {
        success: true,
        message: `Updated ${updatedItem.name} successfully`
      },
      completedAt: new Date(),
      status: 'completed',
      createdBy: req.user.id
    });
    
    await task.save();
    
    res.json({
      success: true,
      message: 'Equipment updated successfully',
      item: updatedItem
    });
    
  } catch (error) {
    console.error('Update equipment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update equipment', 
      error: error.message 
    });
  }
};

// @desc    Remove equipment item (soft delete)
// @route   DELETE /api/maintenance/config/equipment/:type/:itemId
// @access  Private (Admin)
exports.removeEquipmentItem = async (req, res) => {
  try {
    const { type, itemId } = req.params;
    const { reason } = req.body;
    const { hardDelete } = req.query;
    
    const validTypes = [
      'solarPanels', 'inverters', 'batteries', 'mountingStructures',
      'electricalComponents', 'cablesAndWiring', 'safetyEquipment',
      'junctionBoxes', 'disconnectSwitches', 'meters'
    ];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid equipment type' 
      });
    }
    
    let config = await SystemConfig.findOne();
    if (!config) {
      return res.status(404).json({ 
        success: false, 
        message: 'Configuration not found' 
      });
    }
    
    let removedItem;
    if (hardDelete === 'true') {
      removedItem = await config.hardDeleteEquipmentItem(
        type,
        itemId,
        req.user.id,
        reason || `Hard deleted ${type.slice(0, -1)}`
      );
    } else {
      removedItem = await config.removeEquipmentItem(
        type,
        itemId,
        req.user.id,
        reason || `Removed ${type.slice(0, -1)}`
      );
    }
    
    // Create maintenance task record
    const task = new MaintenanceTask({
      taskId: generateTaskId(),
      title: `Removed ${type.slice(0, -1)}`,
      description: `${hardDelete === 'true' ? 'Permanently deleted' : 'Removed'} ${removedItem.name} from ${type} catalog`,
      type: 'system_config',
      taskData: { type, itemId, hardDelete: hardDelete === 'true', reason },
      results: {
        success: true,
        message: `Removed ${removedItem.name} successfully`
      },
      completedAt: new Date(),
      status: 'completed',
      createdBy: req.user.id
    });
    
    await task.save();
    
    res.json({
      success: true,
      message: `Equipment ${hardDelete === 'true' ? 'permanently deleted' : 'removed'} successfully`,
      item: removedItem
    });
    
  } catch (error) {
    console.error('Remove equipment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to remove equipment', 
      error: error.message 
    });
  }
};

// @desc    Get equipment by type
// @route   GET /api/maintenance/config/equipment/:type
// @access  Private (Admin, Engineer)
exports.getEquipmentByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { includeInactive } = req.query;
    
    const validTypes = [
      'solarPanels', 'inverters', 'batteries', 'mountingStructures',
      'electricalComponents', 'cablesAndWiring', 'safetyEquipment',
      'junctionBoxes', 'disconnectSwitches', 'meters'
    ];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid equipment type' 
      });
    }
    
    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig();
      await config.save();
    }
    
    let items = config.equipmentPrices[type] || [];
    
    // Filter by active status if needed
    if (includeInactive !== 'true') {
      items = items.filter(item => item.isActive !== false);
    }
    
    res.json({
      success: true,
      type,
      count: items.length,
      items
    });
    
  } catch (error) {
    console.error('Get equipment by type error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch equipment', 
      error: error.message 
    });
  }
};

// @desc    Bulk update equipment (import/update multiple items)
// @route   POST /api/maintenance/config/equipment/bulk
// @access  Private (Admin)
exports.bulkUpdateEquipment = async (req, res) => {
  try {
    const { type, items, action } = req.body;
    const { reason } = req.query;
    
    const validTypes = [
      'solarPanels', 'inverters', 'batteries', 'mountingStructures',
      'electricalComponents', 'cablesAndWiring', 'safetyEquipment',
      'junctionBoxes', 'disconnectSwitches', 'meters'
    ];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid equipment type' 
      });
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Items array is required' 
      });
    }
    
    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig();
      await config.save();
    }
    
    let results = [];
    
    switch(action) {
      case 'replace':
        // Replace entire array
        config.equipmentPrices[type] = items.map(item => ({
          ...item,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: item.isActive !== false
        }));
        results = config.equipmentPrices[type];
        break;
        
      case 'add':
        // Add multiple items
        for (const item of items) {
          const newItem = await config.addEquipmentItem(
            type,
            item,
            req.user.id,
            reason || `Bulk add: ${item.name}`
          );
          results.push(newItem);
        }
        break;
        
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid action. Use: add, update, or replace' 
        });
    }
    
    await config.save();
    
    // Create maintenance task record
    const task = new MaintenanceTask({
      taskId: generateTaskId(),
      title: `Bulk ${action} ${type.slice(0, -1)}s`,
      description: `${action === 'replace' ? 'Replaced entire' : `Added ${results.length}`} ${type} catalog`,
      type: 'system_config',
      taskData: { type, action, count: results.length, reason },
      results: {
        success: true,
        message: `Successfully ${action}ed ${results.length} items`,
        affectedRecords: results.length
      },
      completedAt: new Date(),
      status: 'completed',
      createdBy: req.user.id
    });
    
    await task.save();
    
    res.json({
      success: true,
      message: `Successfully ${action}ed ${results.length} items`,
      action,
      count: results.length,
      items: results
    });
    
  } catch (error) {
    console.error('Bulk update equipment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to bulk update equipment', 
      error: error.message 
    });
  }
};