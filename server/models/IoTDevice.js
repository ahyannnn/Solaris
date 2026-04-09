const mongoose = require('mongoose');

const iotDeviceSchema = new mongoose.Schema({
  // Device Identification
  deviceId: { type: String, required: true, unique: true, index: true },
  deviceName: { type: String, required: true },
  serialNumber: { type: String, unique: true, sparse: true },
  
  // Device Specifications
  manufacturer: { type: String, default: 'Salfer Engineering' },
  model: { type: String, required: true },
  firmwareVersion: { type: String, default: '1.0.0' },
  
  // Device Status
  status: {
    type: String,
    enum: ['available', 'assigned', 'deployed', 'data_collecting', 'retrieved', 'maintenance', 'retired'],
    default: 'available',
    index: true
  },
  // Add sensor data reference
  latestSensorData: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SensorData'
  },
  // Assignment Information (Admin assigns to engineer)
  assignedToEngineerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedToPreAssessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'PreAssessment' },
  assignedAt: Date,
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Deployment Information (Engineer deploys on site)
  deployedAt: Date,
  deployedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deploymentNotes: String,
  
  // Retrieval Information (Engineer retrieves after 7 days)
  retrievedAt: Date,
  retrievedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  retrievalNotes: String,
  
  // Device Health
  batteryLevel: { type: Number, min: 0, max: 100, default: 100 },
  lastHeartbeat: Date,
  
  // Alerts
  alerts: [{
    type: { type: String, enum: ['low_battery', 'offline', 'no_data'] },
    message: String,
    createdAt: { type: Date, default: Date.now },
    resolvedAt: Date
  }],
  
  // Maintenance
  maintenanceHistory: [{
    type: { type: String, enum: ['calibration', 'repair', 'battery_replacement'] },
    date: { type: Date, default: Date.now },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String
  }],
  
  // Deployment History
  deploymentHistory: [{
    preAssessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'PreAssessment' },
    assignedAt: Date,
    deployedAt: Date,
    retrievedAt: Date,
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deployedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    retrievedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String
  }]
}, {
  timestamps: true
});

// Indexes


module.exports = mongoose.model('IoTDevice', iotDeviceSchema);