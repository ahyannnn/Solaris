const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['payment_proof', 'project_document', 'report', 'site_photo', 'quotation_pdf', 'contract', 'invoice', 'assessment_document'],
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userRole: {
    type: String,
    enum: ['admin', 'engineer', 'customer'],
    required: true
  },
  relatedTo: {
    type: String,
     enum: ['pre_assessment', 'project', 'report', 'invoice', 'customer', 'free_quote'],
    required: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'relatedTo'
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
fileSchema.index({ relatedTo: 1, relatedId: 1 });
fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ fileType: 1 });

module.exports = mongoose.model('File', fileSchema);