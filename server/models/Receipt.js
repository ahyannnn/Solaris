const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  receiptNumber: { type: String, unique: true, required: true },  // This already creates an index
  paymentType: { 
    type: String, 
    enum: ['pre_assessment', 'initial', 'progress', 'final', 'full', 'additional'],
    required: true 
  },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'gcash', 'card'], required: true },
  referenceNumber: { type: String },
  paymentDate: { type: Date, default: Date.now },
  
  // Customer info
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  customerName: { type: String, required: true },
  customerEmail: { type: String },
  customerPhone: { type: String },
  
  // Related records
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'SolarInvoice' },
  invoiceNumber: { type: String },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  preAssessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'PreAssessment' },
  
  // Receipt file
  receiptUrl: { type: String, required: true },
  cloudinaryPublicId: { type: String },
  
  // Verification
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date, default: Date.now },
  
  // Additional info
  notes: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  
  // Status
  isVoid: { type: Boolean, default: false },
  voidReason: { type: String },
  voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  voidedAt: Date
}, { timestamps: true });

// Only define indexes for non-unique fields
// REMOVED receiptNumber index since it's already covered by unique: true
receiptSchema.index({ customerId: 1, paymentDate: -1 });
receiptSchema.index({ invoiceNumber: 1 });

module.exports = mongoose.model('Receipt', receiptSchema);