const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  // Reference to the project or pre-assessment
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  preAssessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PreAssessment'
  },
  
  // Schedule Type
  type: {
    type: String,
    enum: ['pre_assessment', 'site_visit', 'installation', 'inspection', 'maintenance'],
    required: true
  },
  
  // Schedule Details
  title: {
    type: String,
    required: true
  },
  description: String,
  
  // Date and Time
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in hours
    default: 2
  },
  endTime: String,
  
  // Location
  address: {
    houseOrBuilding: String,
    street: String,
    barangay: String,
    cityMunicipality: String,
    province: String,
    zipCode: String
  },
  
  // Assigned Personnel
  assignedEngineerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedTeam: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Client Information
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  clientName: String,
  clientPhone: String,
  
  // Status
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled'],
    default: 'scheduled'
  },
  
  // Notes and Updates
  notes: String,
  cancellationReason: String,
  rescheduleReason: String,
  
  // Reschedule History
  rescheduleHistory: [{
    oldDate: Date,
    newDate: Date,
    reason: String,
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    requestedAt: { type: Date, default: Date.now }
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
scheduleSchema.index({ clientId: 1, scheduledDate: 1 });
scheduleSchema.index({ assignedEngineerId: 1, scheduledDate: 1 });
scheduleSchema.index({ type: 1, status: 1 });
scheduleSchema.index({ scheduledDate: -1 });

// Virtual for formatted date
scheduleSchema.virtual('formattedDate').get(function() {
  return this.scheduledDate ? this.scheduledDate.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'N/A';
});

// Virtual for formatted time
scheduleSchema.virtual('formattedTime').get(function() {
  return this.scheduledTime;
});

// Method to reschedule
scheduleSchema.methods.reschedule = async function(newDate, newTime, reason, requestedBy) {
  this.rescheduleHistory.push({
    oldDate: this.scheduledDate,
    newDate: newDate,
    reason: reason,
    requestedBy: requestedBy,
    requestedAt: new Date()
  });
  
  this.scheduledDate = newDate;
  this.scheduledTime = newTime;
  this.status = 'rescheduled';
  this.rescheduleReason = reason;
  this.updatedBy = requestedBy;
  
  await this.save();
  return this;
};

// Method to confirm schedule
scheduleSchema.methods.confirm = async function(confirmedBy) {
  this.status = 'confirmed';
  this.updatedBy = confirmedBy;
  await this.save();
  return this;
};

// Method to complete schedule
scheduleSchema.methods.complete = async function(completedBy, notes) {
  this.status = 'completed';
  this.notes = notes;
  this.updatedBy = completedBy;
  await this.save();
  return this;
};

// Method to cancel schedule
scheduleSchema.methods.cancel = async function(cancelledBy, reason) {
  this.status = 'cancelled';
  this.cancellationReason = reason;
  this.updatedBy = cancelledBy;
  await this.save();
  return this;
};

module.exports = mongoose.model('Schedule', scheduleSchema);