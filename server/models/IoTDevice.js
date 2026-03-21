// models/IoTDevice.js
const mongoose = require('mongoose');

const iotDeviceSchema = new mongoose.Schema({
  // Device Identification
  deviceId: { type: String, required: true, unique: true, index: true },
  deviceName: { type: String, required: true },
  serialNumber: { type: String, unique: true },
  
  // Device Specifications
  manufacturer: { type: String, default: 'Salfer Engineering' },
  model: { type: String, required: true },
  firmwareVersion: { type: String, default: '1.0.0' },
  
  // Device Status
  status: {
    type: String,
    enum: ['available', 'deployed', 'maintenance', 'retired'],
    default: 'available',
    index: true
  },
  
  // Deployment Information
  currentPreAssessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'PreAssessment' },
  lastDeployedAt: Date,
  lastRetrievedAt: Date,
  deployedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
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
    deployedAt: Date,
    retrievedAt: Date,
    deployedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    retrievedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String
  }],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Pre-save middleware to generate device ID
iotDeviceSchema.pre('save', function(next) {
  if (this.isNew && !this.deviceId) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.deviceId = `IOT-${year}${month}${day}-${random}`;
  }
  this.updatedAt = new Date();
  next();
});

// Methods
iotDeviceSchema.methods.deploy = async function(preAssessmentId, userId) {
  this.status = 'deployed';
  this.currentPreAssessmentId = preAssessmentId;
  this.lastDeployedAt = new Date();
  this.deployedBy = userId;
  
  // Add to deployment history
  this.deploymentHistory.push({
    preAssessmentId,
    deployedAt: new Date(),
    deployedBy: userId
  });
  
  return this.save();
};

iotDeviceSchema.methods.retrieve = async function(userId, notes = '') {
  this.status = 'available';
  
  // Update the last deployment in history
  if (this.deploymentHistory.length > 0) {
    const lastDeployment = this.deploymentHistory[this.deploymentHistory.length - 1];
    lastDeployment.retrievedAt = new Date();
    lastDeployment.retrievedBy = userId;
    lastDeployment.notes = notes;
  }
  
  this.currentPreAssessmentId = null;
  this.lastRetrievedAt = new Date();
  
  return this.save();
};

iotDeviceSchema.methods.updateHeartbeat = async function(batteryLevel) {
  this.lastHeartbeat = new Date();
  if (batteryLevel !== undefined) {
    this.batteryLevel = batteryLevel;
  }
  return this.save();
};

iotDeviceSchema.statics.getAvailableDevices = function() {
  return this.find({ status: 'available' }).sort({ lastRetrievedAt: 1 });
};

module.exports = mongoose.model('IoTDevice', iotDeviceSchema);