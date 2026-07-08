const mongoose = require('mongoose');

const preAssessmentSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
  addressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },

  // Assessment Details
  propertyType: { type: String, enum: ['residential', 'commercial', 'industrial'], required: true },
  desiredCapacity: { type: String },
  roofType: { type: String, enum: ['concrete', 'metal', 'tile', 'other'] },
  roofLength: { type: Number, default: null },
  roofWidth: { type: Number, default: null },
  systemType: {
    type: String,
    enum: ['grid-tie', 'hybrid', 'off-grid'],
    default: null
  },
  preferredDate: { type: Date, default: null },

  // ============ BILLING & CONSUMPTION FIELDS ============
  monthlyBill: { type: Number, default: 0 },
  rate: { type: Number, default: 0 },
  consumption: { type: Number, default: 0 },
  dayConsumption: { type: Number, default: 0 },
  nightConsumption: { type: Number, default: 0 },
  dayPercentage: { type: Number, default: 0 },
  nightPercentage: { type: Number, default: 0 },
  totalDailyConsumption: { type: Number, default: 0 },
  targetSavings: { type: Number, enum: [100, 75, 50, 25], default: null },

  // ============ SYSTEM CALCULATIONS ============
  recommendedSystemSize: { type: Number, default: null },
  inverterSize: { type: Number, default: null },
  batteryCapacityKwh: { type: Number, default: null },
  panelsNeeded: { type: Number, default: null },

  // ============ ESTIMATED PRODUCTION & CO2 OFFSET ============
  estimatedAnnualProduction: { type: Number, default: null },
  estimatedAnnualProductionMin: { type: Number, default: null },
  estimatedAnnualProductionMax: { type: Number, default: null },
  co2Offset: { type: Number, default: null },
  co2OffsetMin: { type: Number, default: null },
  co2OffsetMax: { type: Number, default: null },

  // ============ PAYMENT FIELDS ============
  assessmentFee: { type: Number, default: 1500 },
  bookingReference: { type: String }, // Removed unique: true
  invoiceNumber: { type: String }, // Removed unique: true and sparse: true
  paymentMethod: { type: String, enum: ['gcash', 'card', 'cash'], default: null },
  paymentProof: { type: String },
  paymentProofFileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
  paymentReference: { type: String },
  paymongoPaymentIntentId: { type: String }, // Removed index: true
  paymentGateway: { type: String, enum: ['paymongo', 'manual'], default: 'manual' },
  autoVerified: { type: Boolean, default: false },
  paymentCompletedAt: Date,

  paymentStatus: {
    type: String,
    enum: ['pending', 'for_verification', 'paid', 'failed'],
    default: 'pending'
  },

  assessmentStatus: {
    type: String,
    enum: ['pending_review', 'pending_payment', 'scheduled', 'site_visit_ongoing',
      'device_deployed', 'data_collecting', 'data_analyzing', 'report_draft',
      'quotation_generated', 'quotation_accepted', 'completed', 'cancelled'],
    default: 'pending_review'
  },

  // ============ IoT DEVICE INTEGRATION ============
  iotDeviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'IoTDevice' },
  deviceDeployedAt: Date,
  deviceDeployedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deviceRetrievedAt: Date,
  deviceRetrievedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dataCollectionStart: Date,
  dataCollectionEnd: Date,
  totalReadings: { type: Number, default: 0 },

  // ============ SITE VISIT ============
  assignedEngineerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  siteVisitDate: Date,
  siteVisitNotes: String,
  sitePhotos: [String],

  // ============ ENGINEER ASSESSMENT FIELDS ============
  engineerAssessment: {
    siteInspectionDate: Date,
    inspectionNotes: String,
    roofCondition: { type: String, enum: ['excellent', 'good', 'fair', 'poor'] },
    roofLength: { type: Number, default: null },
    roofWidth: { type: Number, default: null },
    structuralIntegrity: { type: String, enum: ['excellent', 'good', 'fair', 'poor'] },
    shadingAnalysis: String,
    recommendedPanelPlacement: String,
    estimatedInstallationTime: Number,
    additionalMaterials: [{ name: String, quantity: Number, estimatedCost: Number }],
    safetyConsiderations: [String],
    recommendations: String
  },

  // ============ ENGINEER SITE VISIT DETAILS ============
  engineerSiteVisit: {
    arrivalTime: Date,
    departureTime: Date,
    weatherConditions: String,
    accessNotes: String,
    safetyEquipmentUsed: [String],
    teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },

  // ============ DEVICE DEPLOYMENT DETAILS ============
  deviceDeployment: {
    deploymentPhotos: [String],
    deviceSerialAtDeployment: String,
    installationLocation: String,
    gpsCoordinates: { lat: Number, lng: Number },
    signalStrength: Number,
    calibrationNotes: String
  },

  // ============ ASSESSMENT DOCUMENTS ============
  assessmentDocuments: [{
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
    documentType: {
      type: String,
      enum: ['quotation_pdf', 'technical_report', 'site_sketch', 'structural_analysis', 'site_photo', 'electrical_diagram', 'safety_report', 'other']
    },
    description: String,
    uploadedAt: Date
  }],

  // ============ QUOTATION DETAILS ============
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
      panelType: String,
      inverterType: String,
      batteryType: String,
      installationCost: Number,
      equipmentCost: Number,
      totalCost: Number,
      paymentTerms: String,
      warrantyYears: Number,
      equipmentBreakdown: mongoose.Schema.Types.Mixed
    },
    generatedAt: Date,
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },

  // ============ RESULTS ============
  detailedReport: { type: String },
  finalQuotation: { type: String },
  finalSystemSize: Number,
  finalSystemCost: Number,
  recommendedSystemType: { type: String, enum: ['grid-tie', 'hybrid', 'off-grid'] },
  estimatedAnnualSavings: Number,
  paybackPeriod: Number,

  // ============ ASSESSMENT RESULTS ============
  assessmentResults: {
    dataCollectionStart: Date,
    dataCollectionEnd: Date,
    totalReadings: { type: Number, default: 0 },
    averageIrradiance: { type: Number, default: 0 },
    maxIrradiance: { type: Number, default: 0 },
    minIrradiance: { type: Number, default: 0 },
    peakSunHours: { type: Number, default: 0 },
    averageTemperature: { type: Number, default: 0 },
    maxTemperature: { type: Number, default: 0 },
    minTemperature: { type: Number, default: 0 },
    temperatureDerating: { type: Number, default: 0 },
    averageHumidity: { type: Number, default: 0 },
    maxHumidity: { type: Number, default: 0 },
    minHumidity: { type: Number, default: 0 },
    shadingPercentage: { type: Number, default: 0 },
    gpsCoordinates: { latitude: Number, longitude: Number },
    totalIrradiance: { type: Number, default: 0 },
    recommendedPanelCount: { type: Number, default: 0 },
    estimatedSystemSize: { type: Number, default: 0 },
    structuralAssessment: String,
    electricalAssessment: String,
    safetyAssessment: String,
    summary: {
      totalDays: { type: Number, default: 0 },
      dataPointsPerDay: { type: Number, default: 0 },
      siteSuitabilityScore: { type: Number, default: 0 },
      recommendedSystemSize: { type: Number, default: 0 },
      estimatedAnnualProduction: { type: Number, default: 0 },
      estimatedAnnualSavings: { type: Number, default: 0 }
    }
  },

  // ============ ENGINEER RECOMMENDATIONS ============
  engineerRecommendations: String,
  technicalFindings: String,

  // ============ ENGINEER COMMENTS ============
  engineerComments: [{
    comment: String,
    commentedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    commentedAt: Date,
    isPublic: { type: Boolean, default: true }
  }],

  // ============ RECEIPT ============
  receiptUrl: { type: String },
  receiptNumber: { type: String },

  // ============ ADMIN ============
  adminRemarks: String,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date,

  // ============ TIMESTAMPS ============
  bookedAt: { type: Date, default: Date.now },
  confirmedAt: Date,
  completedAt: Date
}, {
  timestamps: true
});

// ============ INDEXES ============
preAssessmentSchema.index({ assignedEngineerId: 1, assessmentStatus: 1 });
preAssessmentSchema.index({ clientId: 1, assessmentStatus: 1 });
preAssessmentSchema.index({ bookingReference: 1 }, { unique: true });
preAssessmentSchema.index({ invoiceNumber: 1 }, { unique: true, sparse: true });
preAssessmentSchema.index({ paymongoPaymentIntentId: 1 });

module.exports = mongoose.model('PreAssessment', preAssessmentSchema);