const mongoose = require('mongoose');

const freeQuoteSchema = new mongoose.Schema({
  // Client Information
  clientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Client', 
    required: true, 
    index: true 
  },
  addressId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Address' 
  },
  
  // Request Details
  monthlyBill: { 
    type: Number, 
    required: true 
  },
  propertyType: { 
    type: String, 
    enum: ['residential', 'commercial', 'industrial'], 
    required: true 
  },
  desiredCapacity: { 
    type: String 
  },
  
  // ============ SYSTEM PREFERENCES ============
  systemType: { 
    type: String, 
    enum: ['grid-tie', 'hybrid', 'off-grid'],
    default: null
  },
  roofType: {
    type: String,
    enum: ['concrete', 'metal', 'tile', 'other'],
    default: null
  },
  roofLength: { 
    type: Number,
    default: null
  },
  roofWidth: { 
    type: Number,
    default: null
  },
  targetSavings: { 
    type: Number, 
    enum: [100, 75, 50, 25], 
    default: null 
  },
  
  // ============ CONSUMPTION DATA ============
  monthlyConsumption: { 
    type: Number, 
    default: null 
  },
  dayConsumption: { 
    type: Number, 
    default: null 
  },
  nightConsumption: { 
    type: Number, 
    default: null 
  },
  dayPercentage: { 
    type: Number, 
    default: null 
  },
  nightPercentage: { 
    type: Number, 
    default: null 
  },
  totalDailyConsumption: { 
    type: Number, 
    default: null 
  },
  
  // ============ SYSTEM CALCULATIONS ============
  recommendedSystemSize: { 
    type: Number, 
    default: null 
  },
  inverterSize: { 
    type: Number, 
    default: null 
  },
  batteryCapacityKwh: { 
    type: Number, 
    default: null 
  },
  panelsNeeded: { 
    type: Number, 
    default: null 
  },
  
  // ============ STATUS - UPDATED with 'accepted' ============
  status: { 
    type: String, 
    enum: ['pending', 'assigned', 'processing', 'completed', 'accepted', 'cancelled'],
    default: 'pending'
  },
  
  // Engineer Assignment
  assignedEngineerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    index: true
  },
  assignedAt: { 
    type: Date 
  },
  assignedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  
  // Admin Response
  quotationReference: { 
    type: String, 
    unique: true 
  },
  quotationFile: { 
    type: String 
  },
  quotationUrl: { 
    type: String 
  },
  quotationSentAt: Date,
  adminRemarks: String,
  
  // Quotation Details (for storing system recommendations)
  quotationDetails: {
    systemSize: Number,
    systemType: String,
    equipmentBreakdown: mongoose.Schema.Types.Mixed,
    installationCost: Number,
    equipmentCost: Number,
    totalCost: Number,
    paymentTerms: String,
    warrantyYears: Number,
    remarks: String
  },
  
  // Timestamps
  requestedAt: { 
    type: Date, 
    default: Date.now 
  },
  processedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  processedAt: Date
}, {
  timestamps: true
});

// Compound index for faster queries on engineer's assigned quotes
freeQuoteSchema.index({ assignedEngineerId: 1, status: 1 });

module.exports = mongoose.model('FreeQuote', freeQuoteSchema);