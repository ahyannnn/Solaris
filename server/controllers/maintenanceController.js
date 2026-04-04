// controllers/maintenanceController.js
const Maintenance = require('../models/Maintenance');

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

// controllers/maintenanceController.js - Updated enableMaintenance

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
    
    // ✅ CHECK: If already under maintenance, prevent enabling again
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
    
    // ✅ CHECK: If not under maintenance, prevent disabling
    if (!maintenance.isUnderMaintenance) {
      return res.status(400).json({ 
        success: false, 
        message: 'Maintenance mode is not currently enabled. Nothing to disable.',
        isUnderMaintenance: false
      });
    }
    
    await maintenance.endMaintenance(req.user.id);
    
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

// controllers/maintenanceController.js - Ensure disable works

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
    
    // This will set isUnderMaintenance to false AND set scheduledEnd
    await maintenance.endMaintenance(req.user.id);
    
    res.json({
      success: true,
      message: 'Maintenance mode disabled',
      maintenance
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