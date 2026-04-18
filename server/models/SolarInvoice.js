// models/SolarInvoice.js

const mongoose = require('mongoose');

const solarInvoiceSchema = new mongoose.Schema({
  // Project Reference
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Invoice Details
  invoiceNumber: { type: String, unique: true, required: true },
  quotationReference: { type: String },
  
  // Invoice Type
  invoiceType: {
    type: String,
    enum: ['initial', 'progress', 'final', 'additional', 'full'],
    default: 'full'
  },
  
  // Billing Details
  description: { type: String, required: true },
  items: [{
    name: { type: String, required: true },
    description: String,
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true }
  }],
  
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  
  // Payment Terms
  dueDate: { type: Date, required: true },
  issueDate: { type: Date, default: Date.now },
   receiptUrl: { type: String },
  receiptNumber: { type: String },
  receiptGeneratedAt: { type: Date },
  // Payment Status - ✅ ADD 'for_verification'
  paymentStatus: {
    type: String,
    enum: ['pending', 'for_verification', 'partial', 'paid', 'overdue', 'cancelled'], // ✅ Added 'for_verification'
    default: 'pending'
  },
  
  // Payments Received
  payments: [{
    amount: { type: Number, required: true },
    method: { type: String, enum: ['gcash', 'bank_transfer', 'card', 'cash', 'check', 'paymongo'] },
    reference: String,
    proof: String,
    date: { type: Date, default: Date.now },
    notes: String,
    receiptUrl: { type: String },
    receiptNumber: { type: String },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  
  amountPaid: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  
  // Status - ✅ ADD 'pending'
  status: {
    type: String,
    enum: ['draft', 'pending', 'sent', 'approved', 'paid', 'cancelled', 'overdue'], // ✅ Added 'pending'
    default: 'draft'
  },
  
  // PayMongo
  paymongoPaymentIntentId: { type: String, index: true },
  
  // Timestamps
  sentAt: Date,
  paidAt: Date,
  cancelledAt: Date,
  
  // Notes
  notes: String,
  internalNotes: String,
  
  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// Pre-save middleware to generate invoice number
solarInvoiceSchema.pre('save', function() {
  if (this.isNew && !this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.invoiceNumber = `SOL-${year}${month}${day}-${random}`;
  }
});

// Method to calculate balance
solarInvoiceSchema.methods.calculateBalance = function() {
  this.balance = this.totalAmount - this.amountPaid;
  return this.balance;
};

// Method to add payment
solarInvoiceSchema.methods.addPayment = async function(paymentData) {
  this.payments.push(paymentData);
  this.amountPaid += paymentData.amount;
  this.calculateBalance();
  
  if (this.balance <= 0) {
    this.paymentStatus = 'paid';
    this.status = 'paid';
    this.paidAt = new Date();
  } else if (this.amountPaid > 0) {
    this.paymentStatus = 'partial';
  }
  
  return this.save();
};

module.exports = mongoose.model('SolarInvoice', solarInvoiceSchema);