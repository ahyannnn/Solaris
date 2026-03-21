// models/PreAssessment.js
const mongoose = require('mongoose');

const preAssessmentSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
  addressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
  
  // Assessment Details
  propertyType: { type: String, enum: ['residential', 'commercial', 'industrial'], required: true },
  desiredCapacity: { type: String },
  roofType: { type: String, enum: ['concrete', 'metal', 'tile', 'other'] },
  preferredDate: { type: Date, required: true },
  
  // Payment
  assessmentFee: { type: Number, default: 1500 },
  bookingReference: { type: String, unique: true },
  invoiceNumber: { type: String, unique: true },
  paymentMethod: { type: String, enum: ['gcash', 'cash'] },
  paymentProof: { type: String },
  paymentReference: { type: String },
  
  // Status
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'for_verification', 'paid', 'failed'],
    default: 'pending'
  },
  assessmentStatus: {
    type: String,
    enum: ['pending_payment', 'scheduled', 'device_deployed', 'data_collecting', 'data_analyzing', 'completed', 'cancelled'],
    default: 'pending_payment'
  },
  
  // IoT Device Integration
  iotDeviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'IoTDevice' },
  deviceDeployedAt: Date,
  deviceDeployedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deviceRetrievedAt: Date,
  deviceRetrievedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dataCollectionStart: Date,
  dataCollectionEnd: Date,
  
  // Data Collection Stats
  totalReadings: { type: Number, default: 0 },
  
  // Site Visit
  assignedEngineerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  siteVisitDate: Date,
  siteVisitNotes: String,
  sitePhotos: [String],
  
  // Results
  detailedReport: { type: String },
  finalQuotation: { type: String },
  finalSystemSize: Number,
  finalSystemCost: Number,
  recommendedSystemType: { type: String, enum: ['grid-tie', 'hybrid', 'off-grid'] },
  panelsNeeded: Number,
  estimatedAnnualProduction: Number,
  estimatedAnnualSavings: Number,
  paybackPeriod: Number,
  co2Offset: Number,
  
  // Engineer Recommendations
  engineerRecommendations: String,
  technicalFindings: String,
  
  // Admin Remarks
  adminRemarks: String,
  
  // Timestamps
  bookedAt: { type: Date, default: Date.now },
  confirmedAt: Date,
  completedAt: Date
}, {
  timestamps: true
});

// NO MIDDLEWARE - we'll generate references in the controller

module.exports = mongoose.model('PreAssessment', preAssessmentSchema);