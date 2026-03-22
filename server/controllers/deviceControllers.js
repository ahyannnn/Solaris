// controllers/deviceControllers.js
const IoTDevice = require('../models/IoTDevice');

// @desc    Get all devices
// @route   GET /api/admin/devices
// @access  Private (Admin)
exports.getAllDevices = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;

    const devices = await IoTDevice.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await IoTDevice.countDocuments(query);

    res.json({
      success: true,
      devices,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Get all devices error:', error);
    res.status(500).json({ message: 'Failed to fetch devices', error: error.message });
  }
};

// @desc    Get device by ID
// @route   GET /api/admin/devices/:id
// @access  Private (Admin)
exports.getDeviceById = async (req, res) => {
  try {
    const { id } = req.params;

    const device = await IoTDevice.findById(id);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    res.json({
      success: true,
      device
    });

  } catch (error) {
    console.error('Get device by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch device', error: error.message });
  }
};

// @desc    Create new device
// @route   POST /api/admin/devices
// @access  Private (Admin)
exports.createDevice = async (req, res) => {
  try {
    const { deviceName, model, manufacturer, serialNumber, firmwareVersion } = req.body;

    const device = new IoTDevice({
      deviceName,
      model,
      manufacturer: manufacturer || 'Salfer Engineering',
      serialNumber,
      firmwareVersion: firmwareVersion || '1.0.0',
      status: 'available'
    });

    await device.save();

    res.status(201).json({
      success: true,
      message: 'Device created successfully',
      device
    });

  } catch (error) {
    console.error('Create device error:', error);
    res.status(500).json({ message: 'Failed to create device', error: error.message });
  }
};

// @desc    Update device
// @route   PUT /api/admin/devices/:id
// @access  Private (Admin)
exports.updateDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const device = await IoTDevice.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    res.json({
      success: true,
      message: 'Device updated successfully',
      device
    });

  } catch (error) {
    console.error('Update device error:', error);
    res.status(500).json({ message: 'Failed to update device', error: error.message });
  }
};

// @desc    Delete device
// @route   DELETE /api/admin/devices/:id
// @access  Private (Admin)
exports.deleteDevice = async (req, res) => {
  try {
    const { id } = req.params;

    const device = await IoTDevice.findByIdAndDelete(id);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    res.json({
      success: true,
      message: 'Device deleted successfully'
    });

  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ message: 'Failed to delete device', error: error.message });
  }
};

// @desc    Get device stats for dashboard
// @route   GET /api/admin/devices/stats
// @access  Private (Admin)
exports.getDeviceStats = async (req, res) => {
  try {
    const total = await IoTDevice.countDocuments();
    const active = await IoTDevice.countDocuments({ status: 'available' });
    const deployed = await IoTDevice.countDocuments({ status: 'deployed' });
    const maintenance = await IoTDevice.countDocuments({ status: 'maintenance' });
    const retired = await IoTDevice.countDocuments({ status: 'retired' });

    res.json({
      success: true,
      stats: {
        total,
        active,
        deployed,
        maintenance,
        retired
      }
    });

  } catch (error) {
    console.error('Get device stats error:', error);
    res.status(500).json({ message: 'Failed to fetch device stats', error: error.message });
  }
};