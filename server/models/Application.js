const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  version: {
    type: String,
    required: [true, 'Version is required'],
    unique: true,
    trim: true
  },
  apkUrl: {
    type: String,
    required: [true, 'APK URL is required']
  },
  fileName: {
    type: String,
    required: true
  },
  releaseNotes: {
    type: String,
    default: ''
  },
  releaseDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  // GitHub specific fields
  githubReleaseId: {
    type: Number,
    default: null
  },
  githubAssetId: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

applicationSchema.index({ status: 1, releaseDate: -1 });

const Application = mongoose.model('Application', applicationSchema);
module.exports = Application;