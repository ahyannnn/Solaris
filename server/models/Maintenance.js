const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  // Maintenance Settings
  isUnderMaintenance: {
    type: Boolean,
    default: false
  },
  
  // Maintenance Details
  title: {
    type: String,
    default: 'Under Maintenance'
  },
  message: {
    type: String,
    default: 'We are currently performing scheduled maintenance. Please check back soon.'
  },
  
  // Schedule
  scheduledStart: {
    type: Date,
    default: null
  },
  scheduledEnd: {
    type: Date,
    default: null
  },
  estimatedDuration: {
    type: String,
    default: '2 hours'
  },
  
  // Access Control
  allowedIPs: [{
    type: String
  }],
  allowedRoles: [{
    type: String,
    enum: ['admin', 'engineer', 'customer'],
    default: ['admin']
  }],
  
  // Whitelisted Routes (paths that remain accessible)
  whitelistedRoutes: [{
    type: String,
    default: ['/api/auth/login', '/api/auth/register', '/api/maintenance/status']
  }],
  
  // Contact Information
  contactEmail: {
    type: String,
    default: 'support@salferengineering.com'
  },
  contactPhone: {
    type: String,
    default: '+63 XXX XXX XXXX'
  },
  
  // Social Media Links (optional)
  socialLinks: {
    facebook: String,
    twitter: String,
    instagram: String
  },
  
  // Additional Settings
  showProgressBar: {
    type: Boolean,
    default: true
  },
  showCountdown: {
    type: Boolean,
    default: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Maintenance History
  maintenanceHistory: [{
    startDate: Date,
    endDate: Date,
    reason: String,
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedAt: Date
  }]
});

// Method to start maintenance
maintenanceSchema.methods.startMaintenance = async function(title, message, duration, initiatedBy) {
  this.isUnderMaintenance = true;
  this.title = title || this.title;
  this.message = message || this.message;
  this.scheduledStart = new Date();
  this.estimatedDuration = duration || this.estimatedDuration;
  this.updatedBy = initiatedBy;
  this.updatedAt = new Date();
  
  this.maintenanceHistory.push({
    startDate: new Date(),
    reason: title,
    initiatedBy: initiatedBy
  });
  
  await this.save();
  return this;
};

// Method to end maintenance
maintenanceSchema.methods.endMaintenance = async function(completedBy) {
  this.isUnderMaintenance = false;
  this.scheduledEnd = new Date();
  this.updatedBy = completedBy;
  this.updatedAt = new Date();
  
  if (this.maintenanceHistory.length > 0) {
    const lastEntry = this.maintenanceHistory[this.maintenanceHistory.length - 1];
    lastEntry.endDate = new Date();
    lastEntry.completedAt = new Date();
  }
  
  await this.save();
  return this;
};

module.exports = mongoose.model('Maintenance', maintenanceSchema);