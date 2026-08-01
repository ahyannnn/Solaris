// controllers/admin/deviceControllers.js

const IoTDevice = require('../models/IoTDevice');
const PreAssessment = require('../models/PreAssessment');
const User = require('../models/Users');

// Helper function to generate unique device ID
const generateDeviceId = async () => {
  try {
    const prefix = 'IOT';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const latestDevice = await IoTDevice.findOne().sort({ createdAt: -1 });
    let nextNumber = 1;
    
    if (latestDevice && latestDevice.deviceId) {
      const parts = latestDevice.deviceId.split('-');
      if (parts.length === 3) {
        const lastNumber = parseInt(parts[2]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
    }
    
    const number = String(nextNumber).padStart(4, '0');
    const deviceId = `${prefix}-${year}${month}${day}-${number}`;
    return deviceId;
  } catch (error) {
    console.error('Error generating device ID:', error);
    return `IOT-${Date.now()}`;
  }
};

// @desc    Get all devices
// @route   GET /api/admin/devices
// @access  Private (Admin)
exports.getAllDevices = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status && status !== 'all') query.status = status;

    const devices = await IoTDevice.find(query)
      .populate('assignedToEngineerId', 'name email')
      .populate('assignedToPreAssessmentId', 'bookingReference clientId assessmentStatus')
      .populate('deployedBy', 'name email')
      .populate('retrievedBy', 'name email')
      .populate('assignedBy', 'name email')
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

    const device = await IoTDevice.findById(id)
      .populate('assignedToEngineerId', 'name email')
      .populate('assignedToPreAssessmentId', 'bookingReference clientId assessmentStatus')
      .populate('deployedBy', 'name email')
      .populate('retrievedBy', 'name email')
      .populate('assignedBy', 'name email')
      .populate('maintenanceHistory.performedBy', 'name email')
      .populate('deploymentHistory.assignedBy', 'name email')
      .populate('deploymentHistory.deployedBy', 'name email')
      .populate('deploymentHistory.retrievedBy', 'name email');

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

    if (!deviceName || !model) {
      return res.status(400).json({ 
        success: false, 
        message: 'Device name and model are required' 
      });
    }

    const deviceId = await generateDeviceId();

    const deviceData = {
      deviceId: deviceId,
      deviceName: deviceName,
      model: model,
      manufacturer: manufacturer || 'Salfer Engineering',
      serialNumber: serialNumber || undefined,
      firmwareVersion: firmwareVersion || '1.0.0',
      status: 'available',
      batteryLevel: 100,
      lastHeartbeat: new Date(),
      deploymentHistory: [],
      maintenanceHistory: [],
      alerts: []
    };
    
    const device = new IoTDevice(deviceData);
    await device.save();

    res.status(201).json({
      success: true,
      message: 'Device created successfully',
      device
    });

  } catch (error) {
    console.error('Create device error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Device with this ${field} already exists`
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create device', 
      error: error.message 
    });
  }
};

// @desc    Update device
// @route   PUT /api/admin/devices/:id
// @access  Private (Admin)
exports.updateDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const { deviceName, model, manufacturer, serialNumber, firmwareVersion, status } = req.body;

    const device = await IoTDevice.findById(id);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Don't allow changing status of deployed/assigned devices
    if (status && device.status !== status) {
      if (['deployed', 'data_collecting'].includes(device.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot change status of a ${device.status} device`
        });
      }
    }

    if (deviceName) device.deviceName = deviceName;
    if (model) device.model = model;
    if (manufacturer) device.manufacturer = manufacturer;
    if (serialNumber) device.serialNumber = serialNumber;
    if (firmwareVersion) device.firmwareVersion = firmwareVersion;
    if (status) device.status = status;

    await device.save();

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

    const device = await IoTDevice.findById(id);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Only allow deletion of available devices
    if (!['available', 'maintenance'].includes(device.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete a device that is assigned, deployed, or collecting data. Please retrieve it first.' 
      });
    }

    await device.deleteOne();

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
    const available = await IoTDevice.countDocuments({ status: 'available' });
    const assigned = await IoTDevice.countDocuments({ status: 'assigned' });
    const deployed = await IoTDevice.countDocuments({ status: 'deployed' });
    const dataCollecting = await IoTDevice.countDocuments({ status: 'data_collecting' });
    const maintenance = await IoTDevice.countDocuments({ status: 'maintenance' });
    const retired = await IoTDevice.countDocuments({ status: 'retired' });
    
    const lowBattery = await IoTDevice.countDocuments({ 
      batteryLevel: { $lt: 20 },
      status: { $nin: ['retired'] }
    });
    
    const offline = await IoTDevice.countDocuments({
      lastHeartbeat: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      status: { $nin: ['retired'] }
    });

    res.json({
      success: true,
      stats: {
        total,
        available,
        assigned,
        deployed,
        dataCollecting,
        maintenance,
        retired,
        lowBattery,
        offline
      }
    });

  } catch (error) {
    console.error('Get device stats error:', error);
    res.status(500).json({ message: 'Failed to fetch device stats', error: error.message });
  }
};

// @desc    Admin assigns device to engineer for a specific pre-assessment
// @route   POST /api/admin/devices/:deviceId/assign
// @access  Private (Admin only)
exports.assignDeviceToEngineer = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { engineerId, preAssessmentId, notes } = req.body;
    const adminId = req.user.id;

    console.log('=== ADMIN ASSIGN DEVICE ===');
    console.log('Device ID:', deviceId);
    console.log('Engineer ID:', engineerId);
    console.log('Pre-assessment ID:', preAssessmentId);

    // 1. Verify admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Only admins can assign devices' 
      });
    }

    // Validate required fields
    if (!engineerId || !preAssessmentId) {
      return res.status(400).json({
        success: false,
        message: 'Engineer ID and Pre-assessment ID are required'
      });
    }

    // 2. Find the device - must be available
    const device = await IoTDevice.findById(deviceId);
    if (!device) {
      return res.status(404).json({ 
        success: false,
        message: 'Device not found' 
      });
    }

    if (device.status !== 'available') {
      return res.status(400).json({ 
        success: false,
        message: `Device is not available. Current status: ${device.status}` 
      });
    }

    // 3. Find the pre-assessment
    const assessment = await PreAssessment.findById(preAssessmentId)
      .populate('clientId', 'contactFirstName contactLastName email');
    
    if (!assessment) {
      return res.status(404).json({ 
        success: false,
        message: 'Pre-assessment not found' 
      });
    }

    // Check payment status
    if (assessment.paymentStatus !== 'paid') {
      return res.status(400).json({ 
        success: false,
        message: `Cannot assign device. Payment status: ${assessment.paymentStatus}` 
      });
    }

    // Check assessment status
    if (!['scheduled', 'site_visit_ongoing'].includes(assessment.assessmentStatus)) {
      return res.status(400).json({ 
        success: false,
        message: `Cannot assign device. Assessment status: ${assessment.assessmentStatus}` 
      });
    }

    // 4. Find the engineer
    const engineer = await User.findById(engineerId);
    if (!engineer || engineer.role !== 'engineer') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid engineer selected' 
      });
    }

    // 5. Check if device is already assigned to another assessment
    const existingAssignment = await IoTDevice.findOne({
      assignedToPreAssessmentId: preAssessmentId,
      status: { $in: ['assigned', 'deployed', 'data_collecting'] }
    });
    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: 'Another device is already assigned to this assessment'
      });
    }

    // 6. UPDATE DEVICE STATUS to 'assigned'
    device.status = 'assigned';
    device.assignedToEngineerId = engineerId;
    device.assignedToPreAssessmentId = preAssessmentId;
    device.assignedAt = new Date();
    device.assignedBy = adminId;
    
    device.deploymentHistory.push({
      preAssessmentId,
      assignedAt: new Date(),
      assignedBy: adminId,
      notes: notes || `Assigned to ${engineer.name} for assessment ${assessment.bookingReference}`
    });

    await device.save();
    console.log('✅ Device status updated to: assigned');

    // 7. UPDATE ASSESSMENT
    assessment.assignedDeviceId = device._id;
    assessment.iotDeviceId = device._id;
    assessment.assignedDeviceAt = new Date();
    assessment.assignedDeviceBy = adminId;
    assessment.assignedEngineerId = engineerId;
    assessment.assignedEngineerAt = new Date();

    // Update assessment status if engineer wasn't already assigned
    if (!assessment.assignedEngineerId) {
      assessment.assessmentStatus = 'site_visit_ongoing';
      console.log('✅ Assessment status updated to: site_visit_ongoing');
    }

    await assessment.save();
    console.log('✅ Assessment updated with device assignment');

    // 8. Return success response
    res.json({
      success: true,
      message: `Device assigned successfully to ${engineer.name}`,
      data: {
        device: {
          id: device._id,
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          status: device.status,
          assignedTo: {
            engineerId: engineer._id,
            engineerName: engineer.name,
            engineerEmail: engineer.email
          }
        },
        assessment: {
          id: assessment._id,
          bookingReference: assessment.bookingReference,
          assessmentStatus: assessment.assessmentStatus,
          client: assessment.clientId?.contactFirstName
        },
        nextStep: 'Engineer can now deploy the device on site'
      }
    });

  } catch (error) {
    console.error('Assign device error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to assign device', 
      error: error.message 
    });
  }
};

// @desc    Engineer deploys device on site
// @route   POST /api/pre-assessments/:id/deploy-device
// @access  Private (Engineer only)
exports.deployDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const engineerId = req.user.id;

    console.log('=== ENGINEER DEPLOY DEVICE ===');

    // 1. Verify engineer role
    if (req.user.role !== 'engineer') {
      return res.status(403).json({ 
        success: false,
        message: 'Only engineers can deploy devices on site.' 
      });
    }

    // 2. Find the pre-assessment
    const assessment = await PreAssessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ 
        success: false,
        message: 'Pre-assessment not found' 
      });
    }

    // 3. Verify engineer is assigned to this assessment
    if (!assessment.assignedEngineerId || 
        assessment.assignedEngineerId.toString() !== engineerId) {
      return res.status(403).json({ 
        success: false,
        message: 'You are not authorized to deploy devices for this assessment' 
      });
    }

    // 4. Check if device is assigned
    if (!assessment.assignedDeviceId && !assessment.iotDeviceId) {
      return res.status(400).json({ 
        success: false,
        message: 'No device assigned to this assessment. Please contact admin.' 
      });
    }

    // 5. Find the device
    const deviceId = assessment.assignedDeviceId || assessment.iotDeviceId;
    const device = await IoTDevice.findById(deviceId);
    if (!device) {
      return res.status(404).json({ 
        success: false,
        message: 'Assigned device not found' 
      });
    }

    // 6. Check device status - must be 'assigned'
    if (device.status !== 'assigned') {
      return res.status(400).json({ 
        success: false,
        message: `Device is not ready for deployment. Current status: ${device.status}` 
      });
    }

    // 7. UPDATE DEVICE STATUS to 'deployed'
    device.status = 'deployed';
    device.deployedAt = new Date();
    device.deployedBy = engineerId;
    device.deploymentNotes = notes || 'Device deployed on site';
    device.deployedAt = new Date();
    
    // Update deployment history
    if (device.deploymentHistory.length > 0) {
      const lastDeployment = device.deploymentHistory[device.deploymentHistory.length - 1];
      lastDeployment.deployedAt = new Date();
      lastDeployment.deployedBy = engineerId;
      if (notes) lastDeployment.notes = notes;
    }
    
    await device.save();
    console.log('✅ Device status updated to: deployed');

    // 8. UPDATE ASSESSMENT
    assessment.iotDeviceId = device._id;
    assessment.deviceDeployedAt = new Date();
    assessment.deviceDeployedBy = engineerId;
    assessment.dataCollectionStart = new Date();
    assessment.assessmentStatus = 'device_deployed';
    
    await assessment.save();

    // 9. Return success
    res.json({
      success: true,
      message: 'Device deployed successfully on site',
      data: {
        device: {
          id: device._id,
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          status: device.status
        },
        assessment: {
          id: assessment._id,
          bookingReference: assessment.bookingReference,
          assessmentStatus: assessment.assessmentStatus
        }
      }
    });

  } catch (error) {
    console.error('Deploy device error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to deploy device', 
      error: error.message 
    });
  }
};

// @desc    Engineer retrieves device after data collection
// @route   POST /api/pre-assessments/:id/retrieve-device
// @access  Private (Engineer only)
exports.retrieveDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const engineerId = req.user.id;

    console.log('=== ENGINEER RETRIEVE DEVICE ===');

    // 1. Verify engineer role
    if (req.user.role !== 'engineer') {
      return res.status(403).json({ 
        success: false,
        message: 'Only engineers can retrieve devices' 
      });
    }

    // 2. Find assessment and verify engineer
    const assessment = await PreAssessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    if (assessment.assignedEngineerId?.toString() !== engineerId) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized for this assessment' 
      });
    }

    // 3. Check if device is deployed
    if (!['device_deployed', 'data_collecting'].includes(assessment.assessmentStatus)) {
      return res.status(400).json({ 
        success: false,
        message: `No device deployed to retrieve. Current status: ${assessment.assessmentStatus}` 
      });
    }

    // 4. Find device
    const device = await IoTDevice.findById(assessment.iotDeviceId);
    if (!device) {
      return res.status(404).json({ 
        success: false,
        message: 'Device not found' 
      });
    }

    // 5. UPDATE DEVICE STATUS back to 'available'
    device.status = 'available';
    device.retrievedAt = new Date();
    device.retrievedBy = engineerId;
    device.retrievalNotes = notes || 'Device retrieved after data collection';
    device.assignedToEngineerId = null;
    device.assignedToPreAssessmentId = null;
    
    // Update deployment history
    if (device.deploymentHistory.length > 0) {
      const lastDeployment = device.deploymentHistory[device.deploymentHistory.length - 1];
      lastDeployment.retrievedAt = new Date();
      lastDeployment.retrievedBy = engineerId;
      if (notes) lastDeployment.notes = notes;
    }
    
    await device.save();
    console.log('✅ Device status updated back to: available');

    // 6. Update assessment
    assessment.deviceRetrievedAt = new Date();
    assessment.deviceRetrievedBy = engineerId;
    assessment.dataCollectionEnd = new Date();
    assessment.assessmentStatus = 'data_analyzing';
    await assessment.save();

    res.json({
      success: true,
      message: 'Device retrieved successfully',
      data: {
        device: {
          id: device._id,
          deviceId: device.deviceId,
          status: device.status
        },
        assessment: {
          id: assessment._id,
          bookingReference: assessment.bookingReference,
          assessmentStatus: assessment.assessmentStatus,
          totalReadings: assessment.totalReadings || 0,
          dataCollectionDays: Math.ceil((assessment.dataCollectionEnd - assessment.dataCollectionStart) / (1000 * 60 * 60 * 24))
        }
      }
    });

  } catch (error) {
    console.error('Retrieve device error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve device', 
      error: error.message 
    });
  }
};

// @desc    Report device alert
// @route   POST /api/devices/:deviceId/alert
// @access  Public (Device API)
exports.reportAlert = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { type, message } = req.body;

    const device = await IoTDevice.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    device.alerts.push({
      type,
      message,
      createdAt: new Date()
    });

    await device.save();

    res.json({
      success: true,
      message: 'Alert recorded'
    });

  } catch (error) {
    console.error('Report alert error:', error);
    res.status(500).json({ message: 'Failed to report alert', error: error.message });
  }
};