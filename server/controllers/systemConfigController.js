const SystemConfig = require('../models/SystemConfig');
const MaintenanceTask = require('../models/MaintenanceTask');

// @desc    Get system configuration
// @route   GET /api/maintenance/config
// @access  Private (Admin)
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