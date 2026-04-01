// models/FreeQuote.js
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
  
  // Roof Dimensions
  roofLength: { 
    type: Number,
    default: null
  },
  roofWidth: { 
    type: Number,
    default: null
  },
  systemType: { 
    type: String, 
    enum: ['grid-tie', 'hybrid', 'off-grid'],
    default: null
  },
  
  // Status - Workflow: pending → assigned → processing → completed
  status: { 
    type: String, 
    enum: ['pending', 'assigned', 'processing', 'completed', 'cancelled'],
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
  quotationSentAt: Date,
  adminRemarks: String,
  
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