const mongoose = require('mongoose');

const SERVICE_TYPES = [
  'Electrical Design and Wiring',
  'CCTV Installation',
  'Broadcast system integration',
  'Lighting system design and integration',
  'Solar Installation Course with hands on training',
  'Maintenance'
];

const serviceRequestSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  referenceNo: {
    type: String,
    unique: true,
    index: true
  },
  // Personal information (read-only snapshot from account at booking time)
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  // Booking details — one service per request
  serviceType: {
    type: String,
    enum: SERVICE_TYPES,
    required: true,
    index: true
  },
  preferredDate: {
    type: Date,
    default: null
  },
  serviceAddress: {
    type: String,
    required: true,
    trim: true
  },
  notes: {
    type: String,
    default: '',
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'scheduled', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  adminRemarks: {
    type: String,
    default: ''
  },
  contactedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  contactedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

serviceRequestSchema.statics.SERVICE_TYPES = SERVICE_TYPES;

// One active request per service per client (enforced in controller with 409;
// index speeds the lookup).
serviceRequestSchema.index({ clientId: 1, serviceType: 1, status: 1 });

// Real-time table updates (reuses existing Socket.IO backend)
const { attachRealtimeHooks } = require('../utils/realtimeHelper');
attachRealtimeHooks(serviceRequestSchema, 'service-requests');

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
