// models/MaintenanceTask.js
const mongoose = require('mongoose');

const maintenanceTaskSchema = new mongoose.Schema({
  // Task Identification
  taskId: { type: String, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  type: {
    type: String,
    enum: ['price_update', 'iot_calibration', 'system_health', 'data_cleanup', 'backup', 'firmware_update', 'system_config'],
    required: true
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed', 'cancelled', 'completed_with_errors'],
    default: 'pending'
  },
  
  // Schedule
  scheduledDate: Date,
  startedAt: Date,
  completedAt: Date,
  
  // Assigned Personnel
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Task Specific Data
  taskData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Results
  results: {
    success: { type: Boolean, default: false },
    message: String,
    details: mongoose.Schema.Types.Mixed,
    affectedRecords: Number,
    executionTime: Number
  },
  
  // Logs
  logs: [{
    timestamp: { type: Date, default: Date.now },
    level: { type: String, enum: ['info', 'warning', 'error'] },
    message: String,
    details: mongoose.Schema.Types.Mixed
  }],
  
  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ❌ NO pre-save middleware - removed completely

module.exports = mongoose.model('MaintenanceTask', maintenanceTaskSchema);