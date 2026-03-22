// models/Project.js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  // Project Identification
  projectReference: { type: String, unique: true, required: true },
  projectName: { type: String, required: true },
  
  // References
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  preAssessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'PreAssessment' },
  addressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
  
  // Project Details
  systemSize: { type: Number, required: true }, // in kW
  systemType: { type: String, enum: ['grid-tie', 'hybrid', 'off-grid'], default: 'grid-tie' },
  panelsNeeded: { type: Number },
  inverterSize: { type: Number },
  batterySize: { type: Number },
  
  // Financial Details
  totalCost: { type: Number, required: true },
  initialPayment: { type: Number, default: 0 },
  progressPayment: { type: Number, default: 0 },
  finalPayment: { type: Number, default: 0 },
  amountPaid: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  
  // Payment Schedule
  paymentSchedule: [{
    type: { type: String, enum: ['initial', 'progress', 'final'] },
    amount: Number,
    dueDate: Date,
    paidAt: Date,
    status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' },
    invoiceNumber: String
  }],
  
  // Project Timeline
  startDate: Date,
  estimatedCompletionDate: Date,
  actualCompletionDate: Date,
  
  // Project Status
  status: {
    type: String,
    enum: ['quoted', 'approved', 'initial_paid', 'in_progress', 'progress_paid', 'completed', 'cancelled'],
    default: 'quoted'
  },
  
  // Assigned Personnel
  assignedEngineerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTeam: [String],
  
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

// Pre-save middleware to generate project reference
projectSchema.pre('save', function(next) {
  if (this.isNew && !this.projectReference) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.projectReference = `PROJ-${year}${month}-${random}`;
  }
  next();
});

// Method to calculate balance
projectSchema.methods.calculateBalance = function() {
  this.balance = this.totalCost - this.amountPaid;
  return this.balance;
};

// Method to record payment
projectSchema.methods.recordPayment = async function(amount, paymentType, invoiceId) {
  this.amountPaid += amount;
  this.calculateBalance();
  
  // Update payment schedule
  const scheduleItem = this.paymentSchedule.find(p => p.type === paymentType);
  if (scheduleItem) {
    scheduleItem.paidAt = new Date();
    scheduleItem.status = 'paid';
    scheduleItem.invoiceNumber = invoiceId;
  }
  
  // Update project status based on payments
  if (this.amountPaid >= this.totalCost) {
    this.status = 'completed';
    this.actualCompletionDate = new Date();
  } else if (this.amountPaid >= this.initialPayment && this.status === 'approved') {
    this.status = 'in_progress';
  } else if (this.amountPaid >= this.initialPayment + this.progressPayment) {
    this.status = 'progress_paid';
  }
  
  return this.save();
};

module.exports = mongoose.model('Project', projectSchema);