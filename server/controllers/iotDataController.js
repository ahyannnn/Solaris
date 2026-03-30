// controllers/iotDataController.js
const PreAssessment = require('../models/PreAssessment');
const SensorData = require('../models/SensorData');
const IoTDevice = require('../models/IoTDevice');

// @desc    Get IoT data for engineer's assessment
// @route   GET /api/pre-assessments/:id/iot-data
// @access  Private (Engineer only)
exports.getIoTData = async (req, res) => {
  try {
    const { id } = req.params;
    const engineerId = req.user.id;
    const { range = '7days', limit = 100 } = req.query;

    // Find the assessment
    const assessment = await PreAssessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    // Verify engineer is assigned to this assessment
    if (assessment.assignedEngineerId?.toString() !== engineerId) {
      return res.status(403).json({ message: 'Not authorized to view this data' });
    }

    // Check if device is deployed
    if (!assessment.iotDeviceId) {
      return res.status(400).json({ message: 'No device deployed for this assessment' });
    }

    // Get the device
    const device = await IoTDevice.findById(assessment.iotDeviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Build date filter based on range
    let dateFilter = {};
    const now = new Date();
    
    switch(range) {
      case '24h':
        dateFilter = { timestamp: { $gte: new Date(now - 24 * 60 * 60 * 1000) } };
        break;
      case '7days':
        dateFilter = { timestamp: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case '30days':
        dateFilter = { timestamp: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } };
        break;
      case 'all':
        dateFilter = {};
        break;
      default:
        dateFilter = { timestamp: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
    }

    // Get sensor data
    const sensorData = await SensorData.find({
      deviceId: device.deviceId,
      ...dateFilter
    })
    .sort({ timestamp: -1 })
    .limit(parseInt(limit));

    // Calculate statistics
    const stats = {
      totalReadings: sensorData.length,
      dataCollectionStart: assessment.dataCollectionStart,
      dataCollectionEnd: assessment.dataCollectionEnd,
      averageIrradiance: 0,
      maxIrradiance: 0,
      averageTemperature: 0,
      maxTemperature: 0,
      minTemperature: 0,
      averageHumidity: 0,
      maxHumidity: 0,
      minHumidity: 0,
      peakSunHours: 0,
      estimatedEnergyProduction: 0
    };

    if (sensorData.length > 0) {
      // Calculate averages
      const irradianceSum = sensorData.reduce((sum, d) => sum + (d.irradiance || 0), 0);
      const tempSum = sensorData.reduce((sum, d) => sum + (d.temperature || 0), 0);
      const humiditySum = sensorData.reduce((sum, d) => sum + (d.humidity || 0), 0);
      
      stats.averageIrradiance = irradianceSum / sensorData.length;
      stats.averageTemperature = tempSum / sensorData.length;
      stats.averageHumidity = humiditySum / sensorData.length;
      
      // Find max/min
      stats.maxIrradiance = Math.max(...sensorData.map(d => d.irradiance || 0));
      stats.maxTemperature = Math.max(...sensorData.map(d => d.temperature || 0));
      stats.minTemperature = Math.min(...sensorData.map(d => d.temperature || 0));
      stats.maxHumidity = Math.max(...sensorData.map(d => d.humidity || 0));
      stats.minHumidity = Math.min(...sensorData.map(d => d.humidity || 0));
      
      // Calculate peak sun hours (hours where irradiance > 200 W/m²)
      const peakHours = sensorData.filter(d => (d.irradiance || 0) > 200).length;
      stats.peakSunHours = (peakHours / sensorData.length) * 24;
      
      // Estimate energy production (kWp * peak sun hours)
      const systemSize = assessment.finalSystemSize || 5; // Default 5kW if not set
      stats.estimatedEnergyProduction = systemSize * stats.peakSunHours * (sensorData.length / 24);
    }

    // Prepare chart data for frontend
    const chartData = {
      irradiance: sensorData.map(d => ({
        timestamp: d.timestamp,
        value: d.irradiance || 0
      })),
      temperature: sensorData.map(d => ({
        timestamp: d.timestamp,
        value: d.temperature || 0
      })),
      humidity: sensorData.map(d => ({
        timestamp: d.timestamp,
        value: d.humidity || 0
      }))
    };

    res.json({
      success: true,
      device: {
        id: device._id,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        status: device.status,
        batteryLevel: device.batteryLevel,
        lastHeartbeat: device.lastHeartbeat
      },
      stats,
      chartData,
      readings: sensorData.slice(0, 100) // Return last 100 readings for detailed view
    });

  } catch (error) {
    console.error('Get IoT data error:', error);
    res.status(500).json({ message: 'Failed to fetch IoT data', error: error.message });
  }
};

// @desc    Get real-time IoT data for engineer (latest readings)
// @route   GET /api/pre-assessments/:id/iot-data/realtime
// @access  Private (Engineer only)
exports.getRealtimeIoTData = async (req, res) => {
  try {
    const { id } = req.params;
    const engineerId = req.user.id;
    const { limit = 10 } = req.query;

    const assessment = await PreAssessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }

    if (assessment.assignedEngineerId?.toString() !== engineerId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!assessment.iotDeviceId) {
      return res.status(400).json({ message: 'No device deployed' });
    }

    const device = await IoTDevice.findById(assessment.iotDeviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Get latest readings
    const latestReadings = await SensorData.find({
      deviceId: device.deviceId
    })
    .sort({ timestamp: -1 })
    .limit(parseInt(limit));

    // Get device status
    const deviceStatus = {
      isOnline: device.lastHeartbeat && (new Date() - device.lastHeartbeat) < 30 * 60 * 1000, // 30 minutes
      batteryLevel: device.batteryLevel,
      lastHeartbeat: device.lastHeartbeat,
      status: device.status
    };

    res.json({
      success: true,
      deviceStatus,
      latestReadings
    });

  } catch (error) {
    console.error('Get realtime IoT data error:', error);
    res.status(500).json({ message: 'Failed to fetch realtime data' });
  }
};

// @desc    Get IoT data summary for engineer dashboard
// @route   GET /api/engineer/iot-summary
// @access  Private (Engineer only)
exports.getIoTDashboardSummary = async (req, res) => {
  try {
    const engineerId = req.user.id;

    // Get all assessments with deployed devices
    const assessments = await PreAssessment.find({
      assignedEngineerId: engineerId,
      iotDeviceId: { $ne: null },
      assessmentStatus: { $in: ['device_deployed', 'data_collecting'] }
    })
    .populate('iotDeviceId')
    .populate('clientId', 'contactFirstName contactLastName');

    const summary = await Promise.all(assessments.map(async (assessment) => {
      const device = assessment.iotDeviceId;
      if (!device) return null;

      // Get latest reading
      const latestReading = await SensorData.findOne({
        deviceId: device.deviceId
      })
      .sort({ timestamp: -1 });

      // Count readings in last 24 hours
      const readings24h = await SensorData.countDocuments({
        deviceId: device.deviceId,
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      return {
        assessmentId: assessment._id,
        bookingReference: assessment.bookingReference,
        client: `${assessment.clientId?.contactFirstName} ${assessment.clientId?.contactLastName}`,
        device: {
          id: device._id,
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          status: device.status,
          batteryLevel: device.batteryLevel,
          isOnline: device.lastHeartbeat && (new Date() - device.lastHeartbeat) < 30 * 60 * 1000
        },
        latestReading: latestReading ? {
          irradiance: latestReading.irradiance,
          temperature: latestReading.temperature,
          humidity: latestReading.humidity,
          timestamp: latestReading.timestamp
        } : null,
        readings24h
      };
    }));

    res.json({
      success: true,
      activeDevices: summary.filter(s => s !== null).length,
      devices: summary.filter(s => s !== null)
    });

  } catch (error) {
    console.error('Get IoT dashboard summary error:', error);
    res.status(500).json({ message: 'Failed to fetch summary' });
  }
};