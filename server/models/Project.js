const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  // Project Identification
  projectReference: { type: String, unique: true },
  projectName: { type: String, required: true },

  // References
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  preAssessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'PreAssessment' },
  addressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },

  // Source tracking (which type created this project)
  sourceType: { type: String, enum: ['free-quote', 'pre-assessment', 'admin'], default: 'admin' },
  sourceId: { type: mongoose.Schema.Types.ObjectId },

  // Project Details
  systemSize: { type: Number, required: true }, // in kW
  systemType: { type: String, enum: ['grid-tie', 'hybrid', 'off-grid'], default: 'grid-tie' },
  panelsNeeded: { type: Number },
  inverterType: { type: String },
  batteryType: { type: String },

  // Financial Details
  totalCost: { type: Number, required: true },
  initialPayment: { type: Number, default: 0 },
  progressPayment: { type: Number, default: 0 },
  finalPayment: { type: Number, default: 0 },
  amountPaid: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },

  // Payment Preferences
  paymentPreference: {
    type: String,
    enum: ['full', 'installment'],
    default: 'installment'
  },
  fullPaymentCompleted: {
    type: Boolean,
    default: false
  },

  // Payment Schedule (Updated to include 'full' type)
  paymentSchedule: [{
    type: { type: String, enum: ['initial', 'progress', 'final', 'full'] },
    amount: Number,
    dueDate: Date,
    paidAt: Date,
    status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' },
    invoiceNumber: String,
    paymentGateway: { type: String, enum: ['paymongo', 'manual'], default: 'manual' },
    paymentProof: String,
    paymentReference: String
  }],

  // Project Timeline
  startDate: Date,
  estimatedCompletionDate: Date,
  actualCompletionDate: Date,

  // Project Status
  status: {
    type: String,
    enum: ['quoted', 'approved', 'initial_paid', 'full_paid', 'in_progress', 'progress_paid', 'completed', 'cancelled'],
    default: 'quoted'
  },

  // Assigned Personnel
  assignedEngineerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTeam: [{ type: String }],

  // Documents
  quotationFile: { type: String },
  contractFile: { type: String },
  permitFiles: [String],
  completionCertificate: { type: String },

  // Installation Details
  installationNotes: String,
  sitePhotos: [String],

  // Warranty
  warrantyStartDate: Date,
  warrantyEndDate: Date,
  warrantyTerms: String,

  // Invoices
  invoices: [{
    type: { type: mongoose.Schema.Types.ObjectId, ref: 'SolarInvoice' },
    invoiceNumber: String,
    amount: Number,
    issuedAt: Date,
    paidAt: Date
  }],
  // Add after fullPaymentCompleted field (around line 45)
  paymongoPaymentIntentId: { type: String, index: true },
  currentPaymentId: { type: String },
  // Project Updates/Audit Trail
  projectUpdates: [{
    title: String,
    description: String,
    status: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],

  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,

  // Notes
  notes: String,
  internalNotes: String
}, {
  timestamps: true
});

// Indexes for better query performance
projectSchema.index({ clientId: 1, status: 1 });
projectSchema.index({ assignedEngineerId: 1, status: 1 });
projectSchema.index({ createdAt: -1 });

// Helper function to format currency
function formatCurrencyHelper(amount) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
}

// Method to calculate balance
projectSchema.methods.calculateBalance = function () {
  this.balance = this.totalCost - this.amountPaid;
  return this.balance;
};

// models/Project.js - Update the recordPayment method

// Method to record payment (for installment payments)
projectSchema.methods.recordPayment = async function(amount, paymentType, invoiceId, paymentProof, paymentReference) {
  this.amountPaid += amount;
  this.calculateBalance();
  
  // Update payment schedule
  const scheduleItem = this.paymentSchedule.find(p => p.type === paymentType);
  if (scheduleItem) {
    scheduleItem.paidAt = new Date();
    scheduleItem.status = 'paid';
    scheduleItem.invoiceNumber = invoiceId;
    if (paymentProof) scheduleItem.paymentProof = paymentProof;
    if (paymentReference) scheduleItem.paymentReference = paymentReference;
  }
  
  // Update project status based on payments (installment logic)
  if (this.amountPaid >= this.totalCost) {
    this.status = 'full_paid';  // Changed from 'completed' to 'full_paid'
    // DO NOT set actualCompletionDate here
  } else if (this.amountPaid >= this.initialPayment && this.status === 'approved') {
    this.status = 'in_progress';
  } else if (this.amountPaid >= this.initialPayment + this.progressPayment) {
    this.status = 'progress_paid';
  }
  
  // Add to project updates
  this.projectUpdates = this.projectUpdates || [];
  this.projectUpdates.push({
    title: `Payment Received - ${paymentType.toUpperCase()}`,
    description: `Payment of ${formatCurrencyHelper(amount)} received via ${paymentReference ? 'GCash' : 'Cash'}`,
    status: this.status,
    updatedBy: this.clientId
  });
  
  return this.save();
};

// models/Project.js - Update recordFullPayment method

// Method to record full payment
projectSchema.methods.recordFullPayment = async function (amount, paymentMethod, paymentReference, paymentProof) {
  this.amountPaid = amount;
  this.balance = this.totalCost - amount;
  this.fullPaymentCompleted = true;

  // Update payment schedule
  const scheduleItem = this.paymentSchedule.find(p => p.type === 'full');
  if (scheduleItem) {
    scheduleItem.paidAt = new Date();
    scheduleItem.status = 'paid';
    scheduleItem.paymentReference = paymentReference;
    if (paymentProof) scheduleItem.paymentProof = paymentProof;
  }

  // ✅ FIXED: Set status to 'full_paid' instead of 'completed'
  // This means payment is complete but installation hasn't started yet
  this.status = 'full_paid';
  // DO NOT set actualCompletionDate - that's for when installation is complete

  // Add to project updates
  this.projectUpdates = this.projectUpdates || [];
  this.projectUpdates.push({
    title: 'Full Payment Received',
    description: `Full payment of ${formatCurrencyHelper(amount)} received via ${paymentMethod === 'gcash' ? 'GCash' : 'Cash'}${paymentReference ? ` (Ref: ${paymentReference})` : ''}. Waiting for installation to begin.`,
    status: this.status,
    updatedBy: this.clientId
  });

  return this.save();
};

// Pre-save middleware - FIXED: removed the 'next' parameter since we're not using async operations
projectSchema.pre('save', function () {
  // Calculate balance if totalCost or amountPaid changed
  if (this.isModified('totalCost') || this.isModified('amountPaid')) {
    this.balance = (this.totalCost || 0) - (this.amountPaid || 0);
  }

  // Set default project reference if not provided
  if (!this.projectReference) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.projectReference = `PROJ-${year}${month}-${random}`;
  }
});

module.exports = mongoose.model('Project', projectSchema);