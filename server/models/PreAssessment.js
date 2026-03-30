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
  paymentMethod: { type: String, enum: ['gcash', 'cash'], default: null },
  paymentProof: { type: String },
  paymentProofFileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
  paymentReference: { type: String },
  
  // Status
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'for_verification', 'paid', 'failed'],
    default: 'pending'
  },
  // Find the assessmentStatus enum and add 'device_deployed'
assessmentStatus: {
  type: String,
  enum: ['pending_review', 'pending_payment', 'scheduled', 'site_visit_ongoing', 'device_deployed', 'data_collecting', 'data_analyzing', 'report_draft', 'completed', 'cancelled'],
  default: 'pending_review'
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
  
  // Engineer Assessment Fields
  engineerAssessment: {
    siteInspectionDate: Date,
    inspectionNotes: String,
    roofCondition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor']
    },
    structuralIntegrity: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor']
    },
    shadingAnalysis: String,
    recommendedPanelPlacement: String,
    estimatedInstallationTime: Number, // in days
    additionalMaterials: [{
      name: String,
      quantity: Number,
      estimatedCost: Number
    }],
    safetyConsiderations: [String],
    recommendations: String
  },
  
  // Assessment Documents (Quotation PDF, etc.)
  assessmentDocuments: [{
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
    documentType: {
      type: String,
      enum: ['quotation_pdf', 'technical_report', 'site_sketch', 'structural_analysis', 'electrical_diagram', 'safety_report', 'other']
    },
    description: String,
    uploadedAt: Date
  }],
  
  // Quotation Details
  quotation: {
    quotationFileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
    quotationUrl: String,
    quotationNumber: String,
    quotationDate: Date,
    quotationExpiryDate: Date,
    systemDetails: {
      systemSize: Number,
      systemType: String,
      panelsNeeded: Number,
      inverterType: String,
      batteryType: String,
      installationCost: Number,
      equipmentCost: Number,
      totalCost: Number,
      paymentTerms: String,
      warrantyYears: Number
    },
    generatedAt: Date,
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  
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
  
  // Engineer Comments
  engineerComments: [{
    comment: String,
    commentedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    commentedAt: Date,
    isPublic: { type: Boolean, default: true }
  }],
  
  // Admin Remarks
  adminRemarks: String,
  
  // Timestamps
  bookedAt: { type: Date, default: Date.now },
  confirmedAt: Date,
  completedAt: Date
}, {
  timestamps: true
});

// Indexes for faster queries
preAssessmentSchema.index({ assignedEngineerId: 1, assessmentStatus: 1 });

preAssessmentSchema.index({ clientId: 1, assessmentStatus: 1 });
// models/PreAssessment.js - Add these fields if not present
preAssessmentSchema.add({
  // Engineer Site Visit Details
  engineerSiteVisit: {
    arrivalTime: Date,
    departureTime: Date,
    weatherConditions: String,
    accessNotes: String,
    safetyEquipmentUsed: [String],
    teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  
  // Device Deployment Details
  deviceDeployment: {
    deploymentPhotos: [String],
    deviceSerialAtDeployment: String,
    installationLocation: String,
    gpsCoordinates: {
      lat: Number,
      lng: Number
    },
    signalStrength: Number,
    calibrationNotes: String
  },
  
  // Assessment Results
  assessmentResults: {
    totalIrradiance: Number,
    averageTemperature: Number,
    shadingPercentage: Number,
    recommendedPanelCount: Number,
    estimatedSystemSize: Number,
    structuralAssessment: String,
    electricalAssessment: String,
    safetyAssessment: String
  }
});

module.exports = mongoose.model('PreAssessment', preAssessmentSchema);