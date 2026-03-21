// models/FreeQuote.js
const mongoose = require('mongoose');

const freeQuoteSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
  addressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
  
  // Request Details
  monthlyBill: { type: Number, required: true },
  propertyType: { type: String, enum: ['residential', 'commercial', 'industrial'], required: true },
  desiredCapacity: { type: String },
  
  // Status
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Admin Response
  quotationReference: { type: String, unique: true },
  quotationFile: { type: String },
  quotationSentAt: Date,
  adminRemarks: String,
  
  // Timestamps
  requestedAt: { type: Date, default: Date.now },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedAt: Date
}, {
  timestamps: true
});

// NO PRE-SAVE MIDDLEWARE - we'll generate the reference in the controller

module.exports = mongoose.model('FreeQuote', freeQuoteSchema);