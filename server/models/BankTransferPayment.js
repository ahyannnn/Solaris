// models/BankTransferPayment.js
const mongoose = require('mongoose');

const BankTransferPaymentSchema = new mongoose.Schema({
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SolarInvoice', // This will be either SolarInvoice or PreAssessment
    required: true
  },
  invoiceType: {
    type: String,
    enum: ['solar', 'preassessment'],
    required: true,
    default: 'solar'
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false // Make it optional for PreAssessment
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  bankName: {
    type: String,
    required: true,
    enum: ['BPI','Metrobank', 'Security Bank', 'BPO']
  },
  accountName: {
    type: String,
    default: ''
  },
  transactionReference: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  transferDate: {
    type: Date,
    required: true
  },
  transferTime: {
    type: String,
    required: true
  },
  proofOfPayment: {
    type: String,
    required: true // Cloudinary URL or file path
  },
  remarks: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['waiting_verification', 'verified', 'rejected'],
    default: 'waiting_verification'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  receiptUrl: {
    type: String,
    default: ''
  },
  receiptNumber: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for faster queries
BankTransferPaymentSchema.index({ status: 1 });
BankTransferPaymentSchema.index({ invoiceId: 1 });
BankTransferPaymentSchema.index({ clientId: 1 });
BankTransferPaymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('BankTransferPayment', BankTransferPaymentSchema);